import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/?google=error`);
  }

  let user: string;
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString());
    user = decoded.user;
  } catch {
    return NextResponse.redirect(`${origin}/?google=error`);
  }

  const redirectUri = `${origin}/api/auth/google/callback`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${origin}/?google=error`);
  }

  const tokenData = await tokenRes.json();
  const expiresAt = Math.floor(Date.now() / 1000) + (tokenData.expires_in ?? 3600);

  await prisma.googleToken.upsert({
    where: { user },
    create: {
      user,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token ?? '',
      expires_at: expiresAt,
    },
    update: {
      access_token: tokenData.access_token,
      ...(tokenData.refresh_token ? { refresh_token: tokenData.refresh_token } : {}),
      expires_at: expiresAt,
    },
  });

  return NextResponse.redirect(`${origin}/?google=connected`);
}
