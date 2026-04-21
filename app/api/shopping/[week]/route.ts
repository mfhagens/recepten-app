import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(_req: NextRequest, { params }: { params: { week: string } }) {
  const items = await prisma.shoppingExtra.findMany({
    where: { week: params.week },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: { params: { week: string } }) {
  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });
  const item = await prisma.shoppingExtra.create({
    data: { week: params.week, text: text.trim() },
  });
  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: { week: string } }) {
  const { id, checked } = await req.json();
  const item = await prisma.shoppingExtra.update({
    where: { id },
    data: { checked },
  });
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params: _params }: { params: { week: string } }) {
  const { id } = await req.json();
  await prisma.shoppingExtra.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
