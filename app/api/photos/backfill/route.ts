import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchUnsplashPhoto } from '@/lib/unsplash';

export async function POST() {
  const missing = await prisma.recipe.findMany({
    where: { photo_url: '' },
    take: 10,
  });

  await Promise.all(
    missing.map(async (r) => {
      const photo_url = await fetchUnsplashPhoto(r.name);
      if (photo_url) {
        await prisma.recipe.update({ where: { id: r.id }, data: { photo_url } });
      }
    })
  );

  return NextResponse.json({ filled: missing.length });
}
