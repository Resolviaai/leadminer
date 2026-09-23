import { describe, it, expect } from 'vitest';
import { isPrivateIp, isSafePublicUrl } from '../../src/lib/ssrf-guard';

describe('SSRF Protection Guard (P2-2)', () => {
  it('correctly identifies private IPv4 ranges', () => {
    // Loopback
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('127.1.2.3')).toBe(true);

    // RFC 1918 Private
    expect(isPrivateIp('10.0.0.1')).toBe(true);
    expect(isPrivateIp('10.254.254.254')).toBe(true);
    expect(isPrivateIp('172.16.0.1')).toBe(true);
    expect(isPrivateIp('172.31.255.255')).toBe(true);
    expect(isPrivateIp('192.168.1.1')).toBe(true);

    // Link-local / Cloud Metadata (169.254.169.254)
    expect(isPrivateIp('169.254.169.254')).toBe(true);

    // Multicast & Reserved
    expect(isPrivateIp('224.0.0.1')).toBe(true);
    expect(isPrivateIp('240.0.0.1')).toBe(true);

    // Public IPs must NOT be flagged as private
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('142.250.190.46')).toBe(false);
  });

  it('correctly identifies private IPv6 ranges', () => {
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('::')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
    expect(isPrivateIp('fc00::1')).toBe(true);
    expect(isPrivateIp('fd12:3456:789a::1')).toBe(true);

    // IPv6 mapped IPv4
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIp('::ffff:169.254.169.254')).toBe(true);
    expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false);
  });

  it('rejects unsafe protocols and localhost targets', async () => {
    expect(await isSafePublicUrl('file:///etc/passwd')).toBe(false);
    expect(await isSafePublicUrl('ftp://example.com')).toBe(false);
    expect(await isSafePublicUrl('http://localhost:3000')).toBe(false);
    expect(await isSafePublicUrl('http://localhost/admin')).toBe(false);
    expect(await isSafePublicUrl('http://127.0.0.1:8080')).toBe(false);
    expect(await isSafePublicUrl('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });
});
