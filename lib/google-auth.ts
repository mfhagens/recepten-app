import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getUserFromRequest(req: Request): Promise<string | null> {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)auth-token=([^;]+)/);
  if (!match) return null;
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const { payload } = await jwtVerify(match[1], secret);
    return (payload.name as string) ?? null;
  } catch {
    return null;
  }
}

export async function getValidAccessToken(user: string): Promise<string | null> {
  const record = await prisma.googleToken.findUnique({ where: { user } });
  if (!record) return null;

  // Still valid (60s buffer)
  if (record.expires_at > Math.floor(Date.now() / 1000) + 60) {
    return record.access_token;
  }

  // Refresh
  if (!record.refresh_token) return null;
  const refreshed = await refreshAccessToken(record.refresh_token);
  if (!refreshed) return null;

  await prisma.googleToken.update({
    where: { user },
    data: { access_token: refreshed.access_token, expires_at: refreshed.expires_at },
  });
  return refreshed.access_token;
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: number } | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_at: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
  };
}
