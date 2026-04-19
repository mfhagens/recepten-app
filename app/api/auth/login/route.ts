import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { createHash } from 'crypto';

const USERS = ['Sara', 'Job', 'Martijn', 'Karlijn'];
const PASSWORD_HASH = createHash('sha256').update('Ollie').digest('hex');

function secret() {
  return new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');
}

export async function POST(req: NextRequest) {
  const { name, password, rememberMe } = await req.json();
  const hash = createHash('sha256').update(password ?? '').digest('hex');

  if (!USERS.includes(name) || hash !== PASSWORD_HASH) {
    return NextResponse.json({ error: 'Onjuiste naam of wachtwoord' }, { status: 401 });
  }

  const token = await new SignJWT({ name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(rememberMe ? '30d' : '1d')
    .sign(secret());

  const res = NextResponse.json({ ok: true, name });
  res.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 } : {}),
  });
  return res;
}
