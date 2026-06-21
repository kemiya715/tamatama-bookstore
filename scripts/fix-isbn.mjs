/**
 * ISBNが正しくない可能性のある本をNotionで更新するスクリプト
 * 修正が必要なタイトルと正しいISBNのマッピング
 */
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const BOOKS_DB = process.env.NOTION_BOOKS_DB_ID;

// 確認済みISBN修正リスト
const FIXES = {
  '成瀬は天下を取りにいく': '9784103545408',  // 宮島未奈 新潮社 2023
  '星の王子さま':            '9784102122014',  // 新潮文庫 内藤濯訳
  'ツバキ文具店':            '9784344426689',  // 幻冬舎文庫
  '百年の孤独':              '9784102008249',  // 新潮文庫 2024
};

async function main() {
  let cursor;
  let updated = 0;
  do {
    const r = await notion.databases.query({ database_id: BOOKS_DB, page_size: 100, start_cursor: cursor });
    for (const p of r.results) {
      if (p.object !== 'page') continue;
      const titleProp = p.properties['タイトル'];
      const title = titleProp?.title?.[0]?.text?.content ?? '';
      if (FIXES[title]) {
        await notion.pages.update({
          page_id: p.id,
          properties: {
            'ISBN': { rich_text: [{ type:'text', text:{ content: FIXES[title] } }] }
          }
        });
        console.log(`✓ ${title} → ${FIXES[title]}`);
        updated++;
        await new Promise(r => setTimeout(r, 300));
      }
    }
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  console.log(`\n${updated}件のISBNを修正しました`);
}

main().catch(console.error);
