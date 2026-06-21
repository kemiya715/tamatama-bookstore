export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ isbn10: string }> }) {
  const { isbn10 } = await params;
  if (!/^[\dX]{10}$/.test(isbn10)) {
    return new Response('Not found', { status: 404 });
  }

  const url = `https://images-na.ssl-images-amazon.com/images/P/${isbn10}.09.LZZZZZZZ.jpg`;
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });

  if (!r.ok || !r.body) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', r.headers.get('Content-Type') || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=86400');

  return new Response(r.body, { status: 200, headers });
}
