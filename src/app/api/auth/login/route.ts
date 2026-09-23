import { NextRequest, NextResponse } from 'next/server';
import { validateLoginCredentialsAsync, createSessionCookie } from '../../../../lib/api-auth';
import { checkRateLimit, getClientIp } from '../../../../lib/rate-limiter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit('login', ip, 5, 60000); // 5 attempts per minute
  if (!rl.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many login attempts. Please wait 60 seconds.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

  try {
    let email = '';
    let password = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = (body.email ?? '').toString().trim().toLowerCase();
      password = (body.password ?? '').toString();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData();
      email = ((form.get('email') ?? '') as string).trim().toLowerCase();
      password = (form.get('password') ?? '') as string;
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const isValid = await validateLoginCredentialsAsync(email, password);
    if (!isValid) {
      // Deliberate: same error for wrong email and wrong password — don't reveal which is wrong
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true });
    res.headers.set('Set-Cookie', createSessionCookie(email));
    return res;
  } catch (err: any) {
    console.error('[Login] Error:', err.message);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
