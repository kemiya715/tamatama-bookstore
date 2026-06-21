import { NextResponse } from 'next/server';
import { notion, SHELVES_DB, propText, propSelect } from '@/lib/notion';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export const dynamic = 'force-dynamic';

export async function GET() {
  const r = await notion.databases.query({
    database_id: SHELVES_DB,
    filter: { property: '公開', checkbox: { equals: true } },
    sorts: [{ property: '表示順', direction: 'ascending' }],
    page_size: 100,
  });

  const shelves = r.results
    .filter((p): p is PageObjectResponse => p.object === 'page')
    .map(p => ({
      id: p.id,
      num: propText(p.properties, '番号'),
      name: propText(p.properties, '棚名'),
      sub: propText(p.properties, '英語名'),
      note: propText(p.properties, '説明文'),
      category: propSelect(p.properties, 'カテゴリ'),
      photo: propSelect(p.properties, '写真'),
    }));

  return NextResponse.json({ shelves });
}
