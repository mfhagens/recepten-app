/**
 * Migratie-script: importeert bestaande recepten.db (SQLite) naar de Postgres database.
 *
 * Gebruik:
 *   1. Zorg dat DATABASE_URL in .env.local staat ingesteld (Postgres URL)
 *   2. Zorg dat recepten.db in de root van het project staat
 *   3. Run: npx ts-node -e "require('./scripts/migrate-from-sqlite')"
 *      Of via tsx: npx tsx scripts/migrate-from-sqlite.ts
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import path from 'path';

const prisma = new PrismaClient();

interface SqliteRecipe {
  id: number;
  name: string;
  ingredients: string;
  instructions: string;
  tags: string;
  liked_by: string;
}

interface SqliteMeal {
  id: number;
  recipe_id: number;
  ate_on: string;
  notes: string;
}

async function main() {
  const dbPath = path.join(process.cwd(), 'recepten.db');
  const sqlite = new Database(dbPath, { readonly: true });

  const recipes = sqlite.prepare('SELECT * FROM recipes').all() as SqliteRecipe[];
  const meals = sqlite.prepare('SELECT * FROM meals').all() as SqliteMeal[];

  console.log(`Gevonden: ${recipes.length} recepten, ${meals.length} maaltijden`);

  for (const r of recipes) {
    await prisma.recipe.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name ?? '',
        ingredients: r.ingredients ?? '',
        instructions: r.instructions ?? '',
        tags: r.tags ?? '',
        liked_by: r.liked_by ?? '',
      },
    });
  }

  for (const m of meals) {
    await prisma.meal.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        recipe_id: m.recipe_id,
        ate_on: m.ate_on ?? '',
        notes: m.notes ?? '',
      },
    });
  }

  sqlite.close();
  console.log('Migratie voltooid!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
