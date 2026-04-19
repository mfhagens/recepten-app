import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchUnsplashPhoto } from '@/lib/unsplash';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const body = await req.json();

  const existing = await prisma.recipe.findUnique({ where: { id } });
  const nameChanged = existing?.name !== body.name;
  const photo_url = nameChanged ? await fetchUnsplashPhoto(body.name) : existing?.photo_url ?? '';

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      name: body.name,
      ingredients: body.ingredients ?? '',
      instructions: body.instructions ?? '',
      tags: body.tags ?? '',
      liked_by: body.liked_by ?? '',
      url: body.url ?? '',
      photo_url,
      duration: body.duration ?? '',
    },
  });
  return NextResponse.json(recipe);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
