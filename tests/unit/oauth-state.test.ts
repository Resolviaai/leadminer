import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { generateOAuthState, verifyOAuthState, OAUTH_STATE_COOKIE } from '../../src/lib/api-auth';
import { env } from '../../src/config/env';

describe('SEC-03 OAuth CSRF Protection Suite', () => {
  it('generates a signed state and corresponding HttpOnly cookie header', () => {
    const { state, cookieHeader } = generateOAuthState();

    expect(state).toBeDefined();
    expect(state.split('.').length).toBe(3);
    expect(cookieHeader).toContain(OAUTH_STATE_COOKIE);
    expect(cookieHeader).toContain('HttpOnly');
    expect(cookieHeader).toContain('SameSite=Lax');
    expect(cookieHeader).toContain('Max-Age=600');
  });

  it('verifies state successfully when query param matches cookie value and signature is valid', () => {
    const { state } = generateOAuthState();
    const isValid = verifyOAuthState(state, state);
    expect(isValid).toBe(true);
  });

  it('rejects state when query param does not match cookie value', () => {
    const { state: state1 } = generateOAuthState();
    const { state: state2 } = generateOAuthState();
    const isValid = verifyOAuthState(state1, state2);
    expect(isValid).toBe(false);
  });

  it('rejects state when state or cookie is null or empty', () => {
    expect(verifyOAuthState(null, 'cookie')).toBe(false);
    expect(verifyOAuthState('state', null)).toBe(false);
    expect(verifyOAuthState('', '')).toBe(false);
  });

  it('rejects state with forged signature', () => {
    const { state } = generateOAuthState();
    const parts = state.split('.');
    const forgedState = `${parts[0]}.${parts[1]}.tampered_signature`;
    expect(verifyOAuthState(forgedState, forgedState)).toBe(false);
  });

  it('rejects expired state (>10 minutes old)', () => {
    const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
    const raw = `testnonce.${elevenMinutesAgo}`;
    const sig = crypto.createHmac('sha256', env.SESSION_SECRET).update(raw).digest('base64url');
    const expiredState = `${raw}.${sig}`;

    expect(verifyOAuthState(expiredState, expiredState)).toBe(false);
  });
});
