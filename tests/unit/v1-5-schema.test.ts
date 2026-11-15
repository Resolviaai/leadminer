import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { splitSqlStatements } from '../../src/db/migrate';
import { campaignLeads, campaignLeadStatusEnum, leads } from '../../src/db/schema';

describe('LeadMiner v1.5 Schema & Migration Unit Tests', () => {
  describe('Migration 0020 SQL Parser & Integrity', () => {
    it('should cleanly parse migration 0020 without splitting the DO $$ enum block', () => {
      const migrationPath = path.join(process.cwd(), 'migrations', '0020_campaign_leads_and_source_independence.sql');
      expect(fs.existsSync(migrationPath)).toBe(true);

      const rawSql = fs.readFileSync(migrationPath, 'utf8');
      const statements = splitSqlStatements(rawSql);

      expect(statements.length).toBeGreaterThan(5);

      // Verify DO $$ enum block is intact as a single statement
      const enumStmt = statements.find((s) => s.includes('campaign_lead_status'));
      expect(enumStmt).toBeDefined();
      expect(enumStmt).toContain('CREATE TYPE campaign_lead_status AS ENUM');
      expect(enumStmt).toContain('EXCEPTION');
      expect(enumStmt).toContain('WHEN duplicate_object THEN null;');
      expect(enumStmt).toContain('END $$');

      // Verify campaign_leads table creation statement
      const createTableStmt = statements.find((s) => s.includes('CREATE TABLE IF NOT EXISTS campaign_leads'));
      expect(createTableStmt).toBeDefined();
      expect(createTableStmt).toContain('campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE');
      expect(createTableStmt).toContain('lead_id BIGINT NOT NULL REFERENCES leads(id) ON DELETE CASCADE');
      expect(createTableStmt).toContain('primary_contact_id BIGINT REFERENCES contacts(id) ON DELETE SET NULL');
      expect(createTableStmt).toContain('CONSTRAINT uq_campaign_leads_campaign_lead UNIQUE (campaign_id, lead_id)');

      // Verify indexes and RLS
      const uniqueDomainIndex = statements.find((s) => s.includes('uq_leads_normalized_domain'));
      expect(uniqueDomainIndex).toBeDefined();
      expect(uniqueDomainIndex).toContain('WHERE normalized_domain IS NOT NULL AND normalized_domain != \'\'');

      const rlsStmt = statements.find((s) => s.includes('ALTER TABLE IF EXISTS campaign_leads ENABLE ROW LEVEL SECURITY'));
      expect(rlsStmt).toBeDefined();
    });
  });

  describe('Drizzle Schema Type Definitions & Columns', () => {
    it('should export campaignLeadStatusEnum with all required status variants', () => {
      expect(campaignLeadStatusEnum.enumValues).toEqual([
        'ENROLLED',
        'SCHEDULED',
        'CONTACTED',
        'REPLIED',
        'COMPLETED',
        'PAUSED',
        'DISQUALIFIED',
      ]);
    });

    it('should have campaignLeads table with all required columns and constraints', () => {
      expect(campaignLeads).toBeDefined();
      expect(campaignLeads.id).toBeDefined();
      expect(campaignLeads.campaignId).toBeDefined();
      expect(campaignLeads.leadId).toBeDefined();
      expect(campaignLeads.primaryContactId).toBeDefined();
      expect(campaignLeads.status).toBeDefined();
      expect(campaignLeads.currentStepNumber).toBeDefined();
      expect(campaignLeads.customVariables).toBeDefined();
      expect(campaignLeads.disqualifiedReason).toBeDefined();
      expect(campaignLeads.enrolledAt).toBeDefined();
      expect(campaignLeads.lastContactedAt).toBeDefined();
      expect(campaignLeads.createdAt).toBeDefined();
      expect(campaignLeads.updatedAt).toBeDefined();
    });

    it('should have new source-independent columns in leads table', () => {
      expect(leads.companyName).toBeDefined();
      expect(leads.firstName).toBeDefined();
      expect(leads.lastName).toBeDefined();
      expect(leads.sourceProvider).toBeDefined();
      expect(leads.industry).toBeDefined();
      expect(leads.normalizedDomain).toBeDefined();
    });
  });
});
