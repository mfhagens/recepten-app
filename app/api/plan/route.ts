import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const week = req.nextUrl.searchParams.get('week');
  if (!week) return NextResponse.json([]);

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const plans = await prisma.plan.findMany({
    where: { date: { in: dates } },
  });

  return NextResponse.json(plans);
}
