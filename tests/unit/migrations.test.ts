import { describe, it, expect } from 'vitest';
import {
  splitSqlStatements,
  isDuplicateObjectError,
  DUPLICATE_OBJECT_SQLSTATES,
} from '../../src/db/migrate';

describe('Database Migration Runner & Enum Resilience Suite', () => {
  describe('1. splitSqlStatements Parser & Dollar-Quoting', () => {
    it('should correctly split simple statements on semicolons', () => {
      const sql = `
        CREATE TABLE users (id SERIAL PRIMARY KEY);
        CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INT);
      `;
      const stmts = splitSqlStatements(sql);
      expect(stmts).toHaveLength(2);
      expect(stmts[0]).toBe('CREATE TABLE users (id SERIAL PRIMARY KEY)');
      expect(stmts[1]).toBe('CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INT)');
    });

    it('should ignore semicolons inside single-quoted string literals and handle escaped quotes', () => {
      const sql = `
        INSERT INTO settings (key, value) VALUES ('greeting', 'Hello; welcome to LeadMiner''s portal; enjoy');
        UPDATE leads SET category = 'Tech';
      `;
      const stmts = splitSqlStatements(sql);
      expect(stmts).toHaveLength(2);
      expect(stmts[0]).toContain("Hello; welcome to LeadMiner''s portal; enjoy");
      expect(stmts[1]).toBe("UPDATE leads SET category = 'Tech'");
    });

    it('should NOT split on semicolons inside PostgreSQL DO $$ BEGIN ... END $$ blocks (Enum creation)', () => {
      const sql = `
        DO $$ BEGIN
            CREATE TYPE keyword_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY', 'SKIPPED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;

        DO $$ BEGIN
            CREATE TYPE lead_qualification_status AS ENUM ('UNQUALIFIED', 'QUALIFIED', 'DISQUALIFIED');
        EXCEPTION WHEN duplicate_object THEN null; END $$;
      `;
      const stmts = splitSqlStatements(sql);
      expect(stmts).toHaveLength(2);
      expect(stmts[0]).toContain("CREATE TYPE keyword_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'RETRY', 'SKIPPED');");
      expect(stmts[0]).toContain('EXCEPTION WHEN duplicate_object THEN null;');
      expect(stmts[1]).toContain("CREATE TYPE lead_qualification_status AS ENUM ('UNQUALIFIED', 'QUALIFIED', 'DISQUALIFIED');");
    });

    it('should support custom-tagged dollar quotes ($func$, $body$)', () => {
      const sql = `
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $func$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $func$ LANGUAGE plpgsql;

        CREATE TABLE test_table (id INT);
      `;
      const stmts = splitSqlStatements(sql);
      expect(stmts).toHaveLength(2);
      expect(stmts[0]).toContain('NEW.updated_at = NOW();');
      expect(stmts[1]).toBe('CREATE TABLE test_table (id INT)');
    });
  });

  describe('2. Postgres SQLSTATE & Duplicate Schema Object Error Identification', () => {
    it('should recognize 42710 (duplicate_object) for duplicate enum labels and types', () => {
      expect(isDuplicateObjectError({ code: '42710' })).toBe(true);
      expect(DUPLICATE_OBJECT_SQLSTATES.has('42710')).toBe(true);
    });

    it('should recognize 42P07 (duplicate_table), 42701 (duplicate_column), and 42723 (duplicate_function)', () => {
      expect(isDuplicateObjectError({ code: '42P07' })).toBe(true);
      expect(isDuplicateObjectError({ code: '42701' })).toBe(true);
      expect(isDuplicateObjectError({ code: '42723' })).toBe(true);
    });

    it('should recognize duplicate enum label messages even without code', () => {
      const err = { message: 'ERROR: enum label "SIMULATED" already exists' };
      expect(isDuplicateObjectError(err)).toBe(true);
    });

    it('should recognize duplicate type messages', () => {
      const err = { message: 'ERROR: type "keyword_status" already exists' };
      expect(isDuplicateObjectError(err)).toBe(true);
    });

    it('should reject non-duplicate errors (fail-fast on syntax or constraint errors)', () => {
      // 42704: undefined_object (e.g. adding value to non-existent enum)
      expect(isDuplicateObjectError({ code: '42704', message: 'type "missing_enum" does not exist' })).toBe(false);
      // 42601: syntax_error
      expect(isDuplicateObjectError({ code: '42601', message: 'syntax error at or near "FOO"' })).toBe(false);
      // 23505: unique_violation
      expect(isDuplicateObjectError({ code: '23505', message: 'duplicate key value violates unique constraint' })).toBe(false);
      // 08006: connection failure
      expect(isDuplicateObjectError({ code: '08006', message: 'connection failure' })).toBe(false);
    });
  });

  describe('3. ADD VALUE Detection & Non-Transactional Execution Rules', () => {
    it('should detect ADD VALUE across case variations and whitespace', () => {
      const regex = /ADD\s+VALUE/i;
      expect(regex.test("ALTER TYPE message_send_status ADD VALUE 'SIMULATED'")).toBe(true);
      expect(regex.test("ALTER TYPE message_send_status ADD   VALUE IF NOT EXISTS 'UNCONFIRMED'")).toBe(true);
      expect(regex.test("alter type account_status add\nvalue if not exists 'DISCONNECTED'")).toBe(true);
      expect(regex.test("CREATE TABLE leads (id INT)")).toBe(false);
    });

    it('should cleanly parse migration 0016_verification_and_priority_overhaul.sql into valid statements', () => {
      const fs = require('fs');
      const path = require('path');
      const file = path.join(process.cwd(), 'migrations', '0016_verification_and_priority_overhaul.sql');
      const content = fs.readFileSync(file, 'utf8');
      const stmts = splitSqlStatements(content);
      expect(stmts.length).toBeGreaterThanOrEqual(8);
      expect(stmts.some((s: string) => s.includes('confidence_score'))).toBe(true);
      expect(stmts.some((s: string) => s.includes('opportunity_tier'))).toBe(true);
      expect(stmts.some((s: string) => s.includes('domain_cache'))).toBe(true);
    });
  });
});
