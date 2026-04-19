import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchUnsplashPhoto } from '@/lib/unsplash';

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') ?? '';
  const likersParam = req.nextUrl.searchParams.get('likers') ?? '';
  const likers = likersParam ? likersParam.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const recipes = await prisma.recipe.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { ingredients: { contains: search, mode: 'insensitive' } },
                { instructions: { contains: search, mode: 'insensitive' } },
                { tags: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
        ...likers.map((liker) => ({
          liked_by: { contains: liker, mode: 'insensitive' as const },
        })),
      ],
    },
    include: { meals: true },
    orderBy: { name: 'asc' },
  });

  const result = recipes.map((r) => {
    const dates = r.meals.map((m) => m.ate_on).sort().reverse();
    return {
      id: r.id,
      name: r.name,
      ingredients: r.ingredients,
      instructions: r.instructions,
      tags: r.tags,
      liked_by: r.liked_by,
      url: r.url,
      photo_url: r.photo_url,
      mealCount: r.meals.length,
      lastEaten: dates[0] ?? null,
    };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const photo_url = await fetchUnsplashPhoto(body.name);
  const recipe = await prisma.recipe.create({
    data: {
      name: body.name,
      ingredients: body.ingredients ?? '',
      instructions: body.instructions ?? '',
      tags: body.tags ?? '',
      liked_by: body.liked_by ?? '',
      url: body.url ?? '',
      photo_url,
    },
  });
  return NextResponse.json(recipe, { status: 201 });
}
