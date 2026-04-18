import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const meal = await prisma.meal.create({
    data: {
      recipe_id: body.recipe_id,
      ate_on: body.ate_on,
      notes: body.notes ?? '',
    },
  });
  return NextResponse.json(meal, { status: 201 });
}
