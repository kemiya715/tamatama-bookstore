import { Client } from '@notionhq/client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export const notion = new Client({ auth: process.env.NOTION_TOKEN });
export const SHELVES_DB = process.env.NOTION_SHELVES_DB_ID!;
export const BOOKS_DB = process.env.NOTION_BOOKS_DB_ID!;

type Props = PageObjectResponse['properties'];

export function propText(props: Props, key: string): string {
  const p = props[key];
  if (!p) return '';
  if (p.type === 'rich_text') return p.rich_text[0]?.plain_text ?? '';
  if (p.type === 'title') return p.title[0]?.plain_text ?? '';
  return '';
}

export function propSelect(props: Props, key: string): string {
  const p = props[key];
  return p?.type === 'select' ? (p.select?.name ?? '') : '';
}

export function propNumber(props: Props, key: string): number {
  const p = props[key];
  return p?.type === 'number' ? (p.number ?? 999) : 999;
}
