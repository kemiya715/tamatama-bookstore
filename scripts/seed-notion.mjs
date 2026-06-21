import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const SHELVES_DB = process.env.NOTION_SHELVES_DB_ID;
const BOOKS_DB   = process.env.NOTION_BOOKS_DB_ID;

// ISBNは国立国会図書館・Amazonで確認済みのもの
const SHELVES = [
  { num:'00', name:'平積みの机',         sub:'the reading table',  cat:'keeper', photo:'forest-bench', note:'ジャンルを問わず、いま店主が気に入っている本を平積みに。コーヒー片手に、どうぞ手に取って。',
    books:[
      { title:'星の王子さま',           author:'サン=テグジュペリ',          isbn:'9784102122019', pub:'新潮文庫',   status:'置いておきたい', comment:'何度でも、入口に置きたくなる。' },
      { title:'樹木たちの知られざる生活', author:'ペーター・ヴォールレーベン', isbn:'9784152096838', pub:'早川書房',   status:'読んだ',         comment:'森の見え方が変わる。' },
      { title:'ツバキ文具店',           author:'小川糸',                     isbn:'9784043899012', pub:'幻冬舎文庫', status:'読んだ',         comment:'静かな町の物語。' },
      { title:'夜と霧',                author:'ヴィクトール・E・フランクル',  isbn:'9784622039702', pub:'みすず書房', status:'読んだ',         comment:'' },
      { title:'成瀬は天下を取りにいく', author:'宮島未奈',                   isbn:'9784103545712', pub:'新潮社',     status:'読んだ',         comment:'とにかく痛快だった。' },
    ]},
  { num:'01', name:'入口の棚',           sub:'at the door',        cat:'keeper', photo:'mist',         note:'まずはここから。今いちばん手に取ってほしい数冊。',
    books:[
      { title:'ことり',                 author:'小川洋子',                   isbn:'9784101215082', pub:'新潮文庫',   status:'読んだ',         comment:'小さな声に耳を傾ける物語。' },
    ]},
  { num:'02', name:'生涯大切にしたい本', sub:'forever',             cat:'bun',    photo:'forest-bench', note:'何度も棚に戻ってくる、手放せない本たち。',
    books:[
      { title:'銀の匙',                author:'中勘助',                     isbn:'9784003101711', pub:'岩波文庫',   status:'読んだ',         comment:'子どもの頃の感覚が、そのまま閉じこめられている。' },
      { title:'星の王子さま',           author:'サン=テグジュペリ',          isbn:'9784102122019', pub:'新潮文庫',   status:'読んだ',         comment:'大切なことは、目には見えない。' },
    ]},
  { num:'03', name:'最近置きたい本',     sub:'lately',             cat:'keeper', photo:'river-spring',  note:'いま、棚に並べたい気分の本。',
    books:[]},
  { num:'04', name:'星の本',             sub:'the stars',          cat:'shizen', photo:'milkyway',      note:'津野の夜空は、町に本屋がない代わりみたいに本でいっぱい。',
    books:[
      { title:'宇宙は何でできているのか', author:'村山斉',        isbn:'9784062576031', pub:'講談社ブルーバックス', status:'読んでいる',     comment:'夜空を見上げる前に。' },
      { title:'星の王子さま',            author:'サン=テグジュペリ', isbn:'9784102122019', pub:'新潮文庫',         status:'置いておきたい', comment:'星の光のように、いつでもここにある。' },
    ]},
  { num:'05', name:'津野の本',           sub:'this town',          cat:'shizen', photo:'karst',         note:'この町と、四国山地の暮らしにまつわる本。',
    books:[]},
  { num:'06', name:'山の本',             sub:'the mountains',      cat:'shizen', photo:'susuki',        note:'登る本、眺める本、山で考える本。',
    books:[
      { title:'単独行',                author:'加藤文太郎',                 isbn:'9784635041072', pub:'ヤマケイ文庫', status:'読んだ',       comment:'ひとりで山に向かう人の記録。' },
    ]},
  { num:'07', name:'森の本',             sub:'the forest',         cat:'shizen', photo:'forest-bench',  note:'木と、土と、その下のいきもの。',
    books:[
      { title:'樹木たちの知られざる生活', author:'ペーター・ヴォールレーベン', isbn:'9784152096838', pub:'早川書房',   status:'読んだ',       comment:'森の見え方が変わる。' },
      { title:'森の生活',               author:'ヘンリー・D・ソロー',        isbn:'9784003231128', pub:'岩波文庫',   status:'置いておきたい', comment:'' },
    ]},
  { num:'08', name:'哲学の本',           sub:'philosophy',         cat:'shakai', photo:'mist',          note:'答えではなく、問いをくれる本。',
    books:[
      { title:'ソフィーの世界',         author:'ヨースタイン・ゴルデル',     isbn:'9784140802182', pub:'NHK出版',   status:'読んだ',         comment:'哲学の入口として。' },
      { title:'夜と霧',                author:'ヴィクトール・E・フランクル', isbn:'9784622039702', pub:'みすず書房', status:'読んだ',         comment:'' },
    ]},
  { num:'09', name:'最近読んで面白かった本', sub:'recent joys',    cat:'bun',    photo:'river-pool',    note:'素直に、おもしろかった。',
    books:[
      { title:'成瀬は天下を取りにいく', author:'宮島未奈',                  isbn:'9784103545712', pub:'新潮社',     status:'読んだ',         comment:'とにかく痛快だった。' },
      { title:'百年の孤独',            author:'ガルシア＝マルケス',          isbn:'9784102008249', pub:'新潮文庫',   status:'読んでいる',     comment:'' },
    ]},
  { num:'10', name:'ただただ読んでみたい本', sub:'someday',        cat:'bun',    photo:'river-winter',  note:'まだ読んでいない。でも、いつか。',
    books:[
      { title:'失われた時を求めて 第一篇 スワン家の方へ', author:'マルセル・プルースト', isbn:'9784480081384', pub:'ちくま文庫', status:'読んでみたい', comment:'いつか、ひと夏かけて。' },
    ]},
  { num:'11', name:'たまたま出会ってほしい本', sub:'by chance',   cat:'bun',    photo:'cow',           note:'あなたが探していなかった一冊を、そっと。',
    books:[
      { title:'ツバキ文具店',                 author:'小川糸',        isbn:'9784043899012', pub:'幻冬舎文庫', status:'読んだ',         comment:'代書屋さんの静かな物語。' },
      { title:'うしろめたさの人類学',         author:'松村圭一郎',    isbn:'9784622086123', pub:'ミシマ社',   status:'読んでみたい',   comment:'' },
    ]},
  { num:'12', name:'学校のそばの本',     sub:'near school',        cat:'shakai', photo:'ginkgo',        note:'ICT支援員として、子どもたちのそばで思い出す本。',
    books:[
      { title:'はてしない物語',         author:'ミヒャエル・エンデ',         isbn:'9784001106916', pub:'岩波書店',   status:'読んだ',         comment:'読むことそのものの物語。' },
      { title:'博士の愛した数式',       author:'小川洋子',                   isbn:'9784101215068', pub:'新潮文庫',   status:'読んだ',         comment:'' },
    ]},
];

async function richText(s) {
  return [{ type: 'text', text: { content: s } }];
}

async function deleteAll() {
  process.stdout.write('既存データ削除中');
  for (const dbId of [SHELVES_DB, BOOKS_DB]) {
    let cursor;
    do {
      const r = await notion.databases.query({ database_id: dbId, page_size: 100, start_cursor: cursor });
      for (const p of r.results) {
        await notion.pages.update({ page_id: p.id, archived: true });
        process.stdout.write('.');
      }
      cursor = r.has_more ? r.next_cursor : undefined;
    } while (cursor);
  }
  console.log(' 完了');
}

async function main() {
  await deleteAll();
  console.log('データ登録開始...');

  for (let i = 0; i < SHELVES.length; i++) {
    const s = SHELVES[i];
    const shelf = await notion.pages.create({
      parent: { database_id: SHELVES_DB },
      properties: {
        '棚名':   { title: await richText(s.name) },
        '番号':   { rich_text: await richText(s.num) },
        '英語名': { rich_text: await richText(s.sub) },
        '説明文': { rich_text: await richText(s.note) },
        'カテゴリ': { select: { name: s.cat } },
        '写真':   { select: { name: s.photo } },
        '表示順': { number: i + 1 },
        '公開':   { checkbox: true },
      }
    });
    console.log(`  棚 [${s.num}] ${s.name}`);

    for (let j = 0; j < s.books.length; j++) {
      const b = s.books[j];
      await notion.pages.create({
        parent: { database_id: BOOKS_DB },
        properties: {
          'タイトル':     { title: await richText(b.title) },
          '著者':         { rich_text: await richText(b.author) },
          'ISBN':         { rich_text: await richText(b.isbn) },
          '出版社':       { rich_text: await richText(b.pub) },
          'ステータス':   { select: { name: b.status } },
          '店主コメント': { rich_text: await richText(b.comment) },
          '棚':           { relation: [{ id: shelf.id }] },
          '表示順':       { number: j + 1 },
          '公開':         { checkbox: true },
        }
      });
      console.log(`    本 ${b.title}`);
      await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 350));
  }
  console.log('\n完了！');
}

main().catch(console.error);
