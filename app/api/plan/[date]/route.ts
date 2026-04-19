import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { date: string } }) {
  const body = await req.json();
  const { date } = params;

  const plan = await prisma.plan.upsert({
    where: { date },
    update: {
      eaters: body.eaters ?? '',
      recipe_id: body.recipe_id ?? null,
    },
    create: {
      date,
      eaters: body.eaters ?? '',
      recipe_id: body.recipe_id ?? null,
    },
  });

  // Auto-log as meal when a recipe is selected
  if (body.recipe_id) {
    const existing = await prisma.meal.findFirst({
      where: { recipe_id: body.recipe_id, ate_on: date },
    });
    if (!existing) {
      await prisma.meal.create({
        data: { recipe_id: body.recipe_id, ate_on: date, notes: 'Gepland' },
      });
    }
  }

  return NextResponse.json(plan);
}
