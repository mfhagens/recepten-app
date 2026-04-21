import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, getValidAccessToken } from '@/lib/google-auth';

interface ExportGroup {
  name: string;
  items: string[];
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accessToken = await getValidAccessToken(user);
  if (!accessToken) return NextResponse.json({ error: 'not_connected' }, { status: 403 });

  const { weekLabel, groups }: { weekLabel: string; groups: ExportGroup[] } = await req.json();

  // Create a new task list for this week
  const listRes = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title: `Boodschappen ${weekLabel}` }),
  });

  if (!listRes.ok) {
    return NextResponse.json({ error: 'Failed to create task list' }, { status: 500 });
  }

  const list = await listRes.json();

  // Add each item as a task (sequentially to preserve order)
  for (const group of groups) {
    for (const item of group.items) {
      const title = group.name !== 'Overig' ? `${item} (${group.name})` : item;
      await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${list.id}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
