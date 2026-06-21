import { NextResponse } from 'next/server';
import { notion, BOOKS_DB, propText, propSelect } from '@/lib/notion';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export const dynamic = 'force-dynamic';

// Module-level cache: persists across requests within the same server process
const coverCache = new Map<string, string>();

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

async function fetchCover(title: string, author: string, isbn: string): Promise<string> {
  const key = `${title}::${author}`;
  if (coverCache.has(key)) return coverCache.get(key)!;

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) { coverCache.set(key, ''); return ''; }

  try {
    const normalize = (s: string) => s.replace(/\s|　/g, '').toLowerCase();

    const titleMatch = (returned: string, expected: string) => {
      const r = normalize(returned);
      const e = normalize(expected);
      // Exact or near-exact match only (returned title must start with expected or vice versa)
      return r === e || r.startsWith(e) || e.startsWith(r);
    };

    const gbSearch = async (q: string, checkTitle?: string, checkAuthor?: string) => {
      const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&country=JP&key=${apiKey}`;
      const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!r.ok) return null;
      const j = await r.json();
      const items: Array<{volumeInfo: {title?: string; authors?: string[]; imageLinks?: {thumbnail?: string; smallThumbnail?: string}}}> = j.items ?? [];
      for (const item of items) {
        const links = item.volumeInfo?.imageLinks;
        if (!links?.thumbnail) continue;
        if (checkTitle && !titleMatch(item.volumeInfo?.title ?? '', checkTitle)) continue;
        // If author provided, at least one author token must appear in the returned authors
        if (checkAuthor) {
          const retAuthors = normalize((item.volumeInfo?.authors ?? []).join(' '));
          const token = normalize(checkAuthor).slice(0, 4);
          if (token && !retAuthors.includes(token)) continue;
        }
        return links;
      }
      return null;
    };
    // 1. ISBN search with strict title+author verification
    let links = isbn ? await gbSearch(`isbn:${isbn}`, title, author) : null;
    // 2. title+author (strict title check)
    if (!links) { await sleep(200); links = await gbSearch(`intitle:${title} inauthor:${author}`, title); }
    // 3. title only (strict title check)
    if (!links) { await sleep(200); links = await gbSearch(`intitle:${title}`, title); }
    if (!links) { coverCache.set(key, ''); return ''; }
    const raw = (links.thumbnail || links.smallThumbnail || '') as string;
    const cover = raw.replace('http://', 'https://').replace('&edge=curl', '').replace(/&zoom=\d/, '&zoom=2');
    coverCache.set(key, cover);
    return cover;
  } catch {
    coverCache.set(key, '');
    return '';
  }
}

function isbn13to10(isbn13: string): string | null {
  const raw = isbn13.replace(/-/g, '');
  if (raw.length !== 13 || !raw.startsWith('978')) return null;
  const body = raw.slice(3, 12);
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(body[i]) * (10 - i);
  const check = (11 - (sum % 11)) % 11;
  return body + (check === 10 ? 'X' : String(check));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const AMAZON_TAG = process.env.AMAZON_AFFILIATE_TAG ?? '';
  const RAKUTEN_TAG = process.env.RAKUTEN_AFFILIATE_TAG ?? '';

  const r = await notion.databases.query({
    database_id: BOOKS_DB,
    filter: {
      and: [
        { property: '公開', checkbox: { equals: true } },
        { property: '棚', relation: { contains: id } },
      ],
    },
    sorts: [{ property: '表示順', direction: 'ascending' }],
  });

  const rawBooks = r.results
    .filter((p): p is PageObjectResponse => p.object === 'page')
    .map(p => ({
      title: propText(p.properties, 'タイトル'),
      author: propText(p.properties, '著者'),
      isbn: propText(p.properties, 'ISBN').replace(/-/g, ''),
      publisher: propText(p.properties, '出版社'),
      status: propSelect(p.properties, 'ステータス'),
      comment: propText(p.properties, '店主コメント'),
    }));

  // Fetch covers sequentially to stay within Rakuten API rate limits
  const covers: string[] = [];
  for (const b of rawBooks) {
    const cover = await fetchCover(b.title, b.author, b.isbn);
    covers.push(cover);
    await sleep(200);
  }

  const books = rawBooks.map((b, i) => {
    const isbn10 = b.isbn ? isbn13to10(b.isbn) : null;
    const amazonUrl = isbn10
      ? `https://www.amazon.co.jp/dp/${isbn10}${AMAZON_TAG ? `?tag=${AMAZON_TAG}` : ''}`
      : `https://www.amazon.co.jp/s?k=${encodeURIComponent(b.title)}&i=stripbooks${AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ''}`;
    const rakutenUrl = b.isbn
      ? `https://books.rakuten.co.jp/rb/${b.isbn}/${RAKUTEN_TAG ? `?rafId=${RAKUTEN_TAG}` : ''}`
      : '';
    return { ...b, cover: covers[i], amazonUrl, rakutenUrl };
  });

  return NextResponse.json({ books });
}
