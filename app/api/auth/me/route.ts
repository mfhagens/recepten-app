import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) return NextResponse.json({ name: null });
  try {
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? 'dev-secret-change-me');
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({ name: payload.name ?? null });
  } catch {
    return NextResponse.json({ name: null });
  }
}
