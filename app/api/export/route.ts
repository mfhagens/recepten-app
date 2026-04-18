import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get('table') ?? 'recipes';

  if (table === 'recipes') {
    const rows = await prisma.recipe.findMany({ orderBy: { name: 'asc' } });
    const header = 'id,name,ingredients,instructions,tags,liked_by';
    const lines = rows.map((r) =>
      [r.id, r.name, r.ingredients, r.instructions, r.tags, r.liked_by]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header, ...lines].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="recepten.csv"',
      },
    });
  }

  if (table === 'meals') {
    const rows = await prisma.meal.findMany({ orderBy: { ate_on: 'desc' } });
    const header = 'id,recipe_id,ate_on,notes';
    const lines = rows.map((m) =>
      [m.id, m.recipe_id, m.ate_on, m.notes]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csv = [header, ...lines].join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="maaltijden.csv"',
      },
    });
  }

  return NextResponse.json({ error: 'Onbekende tabel' }, { status: 400 });
}
