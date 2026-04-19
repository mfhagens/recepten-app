import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest, { params }: { params: { week: string } }) {
  const entry = await prisma.weekCook.findUnique({ where: { week: params.week } });
  return NextResponse.json({ cook: entry?.cook ?? '' });
}

export async function PUT(req: NextRequest, { params }: { params: { week: string } }) {
  const { cook } = await req.json();
  const entry = await prisma.weekCook.upsert({
    where: { week: params.week },
    update: { cook },
    create: { week: params.week, cook },
  });
  return NextResponse.json(entry);
}
