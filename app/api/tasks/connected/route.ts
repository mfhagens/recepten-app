import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/google-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ connected: false });
  const token = await prisma.googleToken.findUnique({ where: { user } });
  return NextResponse.json({ connected: !!token });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.googleToken.deleteMany({ where: { user } });
  return NextResponse.json({ ok: true });
}
