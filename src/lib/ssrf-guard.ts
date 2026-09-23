import dns from 'dns/promises';

/**
 * Checks whether an IP address belongs to a private, loopback, link-local,
 * multicast, or cloud-metadata reserved subnet.
 */
export function isPrivateIp(rawIp: string): boolean {
  let ip = rawIp.trim();

  // Strip IPv6-mapped IPv4 prefix
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  // IPv4 validation
  const ipv4Parts = ip.split('.').map(Number);
  if (ipv4Parts.length === 4 && ipv4Parts.every((p) => !isNaN(p) && p >= 0 && p <= 255)) {
    const [a, b, c, d] = ipv4Parts;
    if (a === 0) return true; // 0.0.0.0/8 current network
    if (a === 10) return true; // 10.0.0.0/8 private network
    if (a === 127) return true; // 127.0.0.0/8 loopback
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 link-local / AWS/GCP metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 private network
    if (a === 192 && b === 168) return true; // 192.168.0.0/16 private network
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 carrier NAT
    if (a === 192 && b === 0 && (c === 0 || c === 2)) return true; // 192.0.0.0/24 / TEST-NET-1
    if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 TEST-NET-2
    if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 TEST-NET-3
    if (a >= 224) return true; // 224.0.0.0/4 multicast & 240.0.0.0/4 reserved
    return false;
  }

  // IPv6 validation
  const cleanIp = ip.toLowerCase();
  if (cleanIp === '::1' || cleanIp === '::') return true; // Loopback & unspecified
  if (cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) {
    return true; // fe80::/10 link-local
  }
  if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) {
    return true; // fc00::/7 unique local
  }

  return false;
}

/**
 * Validates that a URL is a safe public HTTP/HTTPS endpoint.
 * Protects against SSRF (P2-2) by resolving DNS and rejecting internal IPs.
 */
export async function isSafePublicUrl(targetUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname.endsWith('.corp')
    ) {
      return false;
    }

    // Direct IP literal in URL
    if (isPrivateIp(hostname)) {
      return false;
    }

    // Resolve DNS and check all returned IPs
    const addresses = await dns.lookup(hostname, { all: true });
    if (!addresses || addresses.length === 0) {
      return false;
    }

    for (const record of addresses) {
      if (isPrivateIp(record.address)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
