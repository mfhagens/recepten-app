import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await req.json();
  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name: body.name,
      ingredients: body.ingredients ?? '',
      instructions: body.instructions ?? '',
      tags: body.tags ?? '',
      liked_by: body.liked_by ?? '',
      url: body.url ?? '',
    },
  });
  return NextResponse.json(recipe);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
