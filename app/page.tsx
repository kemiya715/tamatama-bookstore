'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ---- types ----
type Screen = 'entry' | 'bookstore' | 'shelves' | 'category' | 'shelf' | 'about' | 'tsuno';
type Tone = 'night' | 'dusk' | 'mist';
type Typeface = 'shippori' | 'zenold' | 'hina';

interface ApiShelf {
  id: string;
  num: string;
  name: string;
  sub: string;
  note: string;
  category: string;
  photo: string;
}

interface ApiBook {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  status: string;
  comment: string;
  cover: string;
  amazonUrl: string;
  rakutenUrl: string;
}

interface Book extends ApiBook {
  spineColor: string;
  statusColor: string;
  hasCover: boolean;
  noCover: boolean;
}

interface Shelf extends ApiShelf {
  books: Book[];
  count: number;
}

// ---- constants ----
const SPINE_PALETTE = [
  '#86643f','#5d6b4f','#7d6b86','#5f5a6e','#6e7a86',
  '#6b5e7a','#7a6450','#5f6e80','#6e5a44','#7a5a52',
  '#6f7a5c','#8a6b4a','#4f6048','#5d6b86','#737a5c',
  '#6a7257','#566546','#76795e','#6e7256','#6b5e4a',
];

function hashColor(s: string): string {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return SPINE_PALETTE[Math.abs(h) % SPINE_PALETTE.length];
}

const CAT_META = [
  { key:'keeper', name:'店主のおすすめ', en:"keeper's picks", photo:'ginkgo',      note:'ジャンルを問わず、いま店主が手わたしたい本を。迷ったら、まずはこの棚から。' },
  { key:'bun',    name:'文学',          en:'literature',     photo:'forest-bench', note:'物語と、ことば。何度も棚に戻ってくる本たち。' },
  { key:'shizen', name:'自然',          en:'nature',         photo:'karst',        note:'星、山、森、川。津野の自然とつながる本。' },
  { key:'shakai', name:'社会',          en:'society',        photo:'mist',         note:'人と世界、学びと思索をめぐる本。' }
];

const TSUNO_THEMES = [
  { title:'四国カルスト', en:'the karst plateau', note:'標高1,400m。石灰岩と、風にゆれる草原。', photos:['karst','susuki'] },
  { title:'星空',         en:'the night sky',     note:'町に本屋がない代わりみたいな、満天の星。', photos:['milkyway','stars','moon-dusk'] },
  { title:'自然',         en:'nature',            note:'源流の清流、森、いきもの。すぐそばの自然。', photos:['river-pool','river-spring','forest-bench','mist'] },
  { title:'暮らし',       en:'daily life',        note:'学校、大銀杏、棚田。人の手が入った里の景色。', photos:['ginkgo','cow','dog'] }
];

const THEMES = {
  night: { '--bg':'#13100c','--bg2':'#1b1610','--panel':'#221c15','--ink':'#ece3d4','--dim':'#9b9081','--faint':'#6f655a','--line':'rgba(236,227,212,.12)','--amber':'#caa463','--amber-soft':'rgba(202,164,99,.16)','--cool':'#7d93a8' },
  dusk:  { '--bg':'#190f09','--bg2':'#241710','--panel':'#2c1d12','--ink':'#f0e4d2','--dim':'#b09a82','--faint':'#7c6650','--line':'rgba(240,228,210,.13)','--amber':'#dca85a','--amber-soft':'rgba(220,168,90,.2)','--cool':'#9a7e74' },
  mist:  { '--bg':'#181b1d','--bg2':'#202427','--panel':'#272c2f','--ink':'#e8ebec','--dim':'#9aa3a6','--faint':'#6b7376','--line':'rgba(232,235,236,.12)','--amber':'#c2a06a','--amber-soft':'rgba(194,160,106,.14)','--cool':'#8fa6b4' }
};

const FONTS: Record<Typeface, string> = {
  shippori: "'Shippori Mincho',serif",
  zenold:   "'Zen Old Mincho',serif",
  hina:     "'Hina Mincho',serif"
};

const AMB_MAP = {
  night: { time:'20:40' },
  dusk:  { time:'17:30' },
  mist:  { time:'06:30' }
};

function statusColor(s: string) {
  return ({ '読んだ':'var(--amber)','読んでいる':'var(--cool)','読んでみたい':'var(--dim)','置いておきたい':'var(--faint)' } as Record<string,string>)[s] || 'var(--dim)';
}

function enrichBooks(raw: ApiBook[]): Book[] {
  return raw.map(b => ({
    ...b,
    spineColor: hashColor(b.isbn || b.title),
    statusColor: statusColor(b.status),
    hasCover: b.cover.length > 0,
    noCover: b.cover.length === 0,
  }));
}

// ---- sub-components ----

function ShelfCase({ colors, bg }: { colors: string[][], bg: string }) {
  return (
    <div style={{ border:'2px solid #281c12', borderTop:'5px solid #3a2a19', borderRadius:'2px', background:bg, boxShadow:'0 14px 22px -12px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.04)', padding:'4px 4px 5px' }}>
      {colors.map((row, ri) => {
        const items = row.filter(Boolean);
        const grad = `repeating-linear-gradient(90deg,${items.map((c,i) => `${c} ${i*12}px ${(i+1)*12-1}px,#231a13 ${(i+1)*12-1}px ${(i+1)*12}px`).join(',')})`;
        return (
          <div key={ri} style={{ height:'26px', borderRadius:'1px', background:grad, boxShadow:'inset 0 2px 4px rgba(0,0,0,.4)', borderBottom:'4px solid #281c12', ...(ri < colors.length - 1 ? { marginBottom:'4px' } : {}) }} />
        );
      })}
    </div>
  );
}

function PlantDecoration({ side }: { side: 'left' | 'right' }) {
  return (
    <div style={{ position:'absolute', [side]:'18px', top:'-66px', width:'42px', textAlign:'center' }}>
      <div style={{ width:'1.5px', height:'13px', background:'rgba(0,0,0,.45)', margin:'0 auto' }} />
      <div style={{ position:'relative', width:'28px', height:'13px', margin:'0 auto', background:'linear-gradient(180deg,#6a5238,#3a2c1d)', borderRadius:'3px 3px 12px 12px' }}>
        <div style={{ position:'absolute', left:'2px', top:'-3px', width:'7px', height:'14px', background:'#5e6b4a', borderRadius:'60% 40% 50% 50%', transform:'rotate(-18deg)' }} />
        <div style={{ position:'absolute', right:'2px', top:'-3px', width:'7px', height:'16px', background:'#56684a', borderRadius:'40% 60% 50% 50%', transform:'rotate(16deg)' }} />
        <div style={{ position:'absolute', left:'10px', top:'-5px', width:'8px', height:'18px', background:'#657456', borderRadius:'50%' }} />
      </div>
    </div>
  );
}

// ---- main component ----

export default function TamatamaShoten() {
  const tone = 'dusk' as Tone;
  const typeface = 'shippori' as Typeface;

  const [screen, setScreen] = useState<Screen>('entry');
  const [shelfId, setShelfId] = useState('');
  const [catKey, setCatKey] = useState('keeper');
  const [book, setBook] = useState<Book | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // API state
  const [apiShelves, setApiShelves] = useState<ApiShelf[]>([]);
  const [shelfBooks, setShelfBooks] = useState<Record<string, Book[]>>({});
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [badCovers, setBadCovers] = useState<Set<string>>(new Set());

  const markBadCover = (url: string) => setBadCovers(p => { const s = new Set(p); s.add(url); return s; });

  const audioRef = useRef<{master: GainNode; oscs: OscillatorNode[]; lfo: OscillatorNode; ctx: AudioContext} | null>(null);
  const actxRef = useRef<AudioContext | null>(null);

  // Fetch shelves on mount
  useEffect(() => {
    fetch('/api/shelves')
      .then(r => r.json())
      .then(data => setApiShelves(data.shelves ?? []))
      .catch(() => {});
  }, []);

  // Prefetch first shelf for 今日のたまたま本
  useEffect(() => {
    if (!apiShelves.length) return;
    const first = apiShelves[0];
    if (shelfBooks[first.id]) return;
    fetch(`/api/shelves/${first.id}`)
      .then(r => r.json())
      .then(data => setShelfBooks(prev => ({ ...prev, [first.id]: enrichBooks(data.books ?? []) })))
      .catch(() => {});
  }, [apiShelves]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch books when opening a shelf
  useEffect(() => {
    if (screen !== 'shelf' || !shelfId || shelfBooks[shelfId]) return;
    setLoadingBooks(true);
    fetch(`/api/shelves/${shelfId}`)
      .then(r => r.json())
      .then(data => setShelfBooks(prev => ({ ...prev, [shelfId]: enrichBooks(data.books ?? []) })))
      .catch(() => {})
      .finally(() => setLoadingBooks(false));
  }, [screen, shelfId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 4500);
    return () => clearInterval(id);
  }, []);

  const startMusic = useCallback(() => {
    try {
      const AC = window.AudioContext || (window as unknown as {webkitAudioContext: typeof AudioContext}).webkitAudioContext;
      if (!AC) return;
      const ctx = actxRef.current || (actxRef.current = new AC());
      if (ctx.state === 'suspended') ctx.resume();
      const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 760; lp.connect(master);
      const freqs = [146.83, 196.00, 246.94, 293.66];
      const oscs = freqs.map(f => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = 0.26; o.connect(g); g.connect(lp); o.start(); return o;
      });
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
      const lg = ctx.createGain(); lg.gain.value = 0.018; lfo.connect(lg); lg.connect(master.gain); lfo.start();
      master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2.5);
      audioRef.current = { master, oscs, lfo, ctx };
    } catch {}
  }, []);

  const stopMusic = useCallback(() => {
    if (!audioRef.current) return;
    try {
      const { master, oscs, lfo, ctx } = audioRef.current;
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.1);
      setTimeout(() => { oscs.forEach(o => { try { o.stop(); } catch {} }); try { lfo.stop(); } catch {}; }, 1200);
    } catch {}
    audioRef.current = null;
  }, []);

  const go = useCallback((s: Screen) => { setScreen(s); setNavOpen(false); setBook(null); }, []);
  const openShelf = useCallback((id: string, cat: string) => {
    setShelfId(id);
    setCatKey(cat || 'keeper');
    setScreen('shelf');
    setNavOpen(false);
    setBook(null);
  }, []);

  // ---- derived ----
  const th = THEMES[tone];
  const serif = FONTS[typeface];
  const ambience = AMB_MAP[tone];

  const shelves: Shelf[] = apiShelves.map(s => ({
    ...s,
    books: shelfBooks[s.id] ?? [],
    count: shelfBooks[s.id]?.length ?? 0,
  }));

  const activeShelf = shelves.find(s => s.id === shelfId) || (shelves[0] ?? null);
  const activeCat = CAT_META.find(c => c.key === catKey) || CAT_META[0];
  const catsWithShelves = CAT_META.map(c => ({ ...c, shelves: shelves.filter(s => s.category === c.key) }));
  const activeCatFull = catsWithShelves.find(c => c.key === catKey) || catsWithShelves[0];

  const layersOf = (files: string[]) => files.map((f, i) => ({
    bg: `url('/assets/photos/${f}.jpg')`,
    opacity: i === (tick % files.length) ? 1 : 0
  }));

  const entryLayers = layersOf(['karst','susuki','river-spring','ginkgo','forest-bench']);
  const tsunoThemes = TSUNO_THEMES.map(p => ({
    ...p,
    layers: layersOf(p.photos),
    dots: p.photos.map((_, i) => ({ on: i === (tick % p.photos.length) ? 'rgba(245,239,227,.95)' : 'rgba(245,239,227,.34)' }))
  }));

  const firstShelfId = apiShelves[0]?.id;
  const today = firstShelfId ? (shelfBooks[firstShelfId]?.[0] ?? null) : null;

  const cssVars = { ...th, '--serif': serif } as unknown as React.CSSProperties;

  return (
    <div style={{ minHeight:'100vh', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#0c0b0a', backgroundImage:'radial-gradient(120% 80% at 50% -10%, #1c1916 0%, #0c0b0a 60%)', padding:'12px 16px', fontFamily:"'Zen Kaku Gothic New',sans-serif" }}>
      <div style={cssVars}>
        {/* PHONE */}
        <div style={{ position:'relative', width:'390px', height:'968px', maxHeight:'calc(100vh - 18px)', borderRadius:'46px', overflow:'hidden', background:'var(--bg,#13100c)', boxShadow:'0 40px 90px -30px rgba(0,0,0,.8), 0 0 0 1px rgba(255,255,255,.04), inset 0 0 0 1px rgba(255,255,255,.03)', color:'var(--ink,#ece3d4)' }}>

          {/* status bar */}

          {/* ENTRY */}
          {screen === 'entry' && (
            <div style={{ position:'absolute', inset:0, overflow:'hidden' }}>
              {entryLayers.map((p, i) => (
                <div key={i} style={{ position:'absolute', inset:0, backgroundImage:p.bg, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.58) saturate(.88) contrast(1.02)', transform:'scale(1.05)', opacity:p.opacity, transition:'opacity 1.8s ease' }} />
              ))}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(12,10,8,.62) 0%, rgba(12,10,8,.2) 34%, rgba(12,10,8,.55) 66%, rgba(10,9,7,.94) 100%)' }} />
              <div style={{ position:'absolute', inset:0, padding:'78px 34px 30px', display:'flex', flexDirection:'column' }}>
                <div style={{ animation:'ttFade 1.1s ease both' }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'14px', letterSpacing:'.26em', color:'var(--amber,#caa463)', opacity:.92 }}>tamatama</div>
                  <h1 style={{ margin:'6px 0 0', fontFamily:'var(--serif)', fontWeight:600, fontSize:'48px', lineHeight:1.16, letterSpacing:'.06em', color:'var(--ink,#f3ecdf)', textShadow:'0 2px 30px rgba(0,0,0,.5)' }}>たまたま書店</h1>
                </div>
                <div style={{ marginTop:'auto', animation:'ttRise 1.2s .2s ease both' }}>
                  <p style={{ margin:'0 0 4px', fontFamily:'var(--serif)', fontSize:'16px', lineHeight:2.05, letterSpacing:'.08em', color:'var(--ink,#ece3d4)', opacity:.95 }}>素敵な本と<br />たまたま出会える小さな書店</p>
                  <p style={{ margin:'18px 0 26px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'11.5px', lineHeight:1.9, letterSpacing:'.16em', color:'var(--dim,#9b9081)' }}>高知県津野町の、小さなWeb本屋</p>
                  <button onClick={() => go('bookstore')} style={{ width:'100%', border:'none', cursor:'pointer', padding:'17px', borderRadius:'2px', background:'var(--amber,#caa463)', color:'#16110a', fontFamily:'var(--serif)', fontWeight:600, fontSize:'16px', letterSpacing:'.22em', boxShadow:'0 10px 30px -10px rgba(202,164,99,.5)' }}>本屋に入る</button>
                  <div style={{ marginTop:'20px', display:'flex', gap:0, borderTop:'1px solid var(--line,rgba(236,227,212,.12))' }}>
                    <button onClick={() => go('shelves')} style={{ flex:1, background:'none', border:'none', borderRight:'1px solid var(--line,rgba(236,227,212,.12))', cursor:'pointer', padding:'15px 4px', color:'var(--ink,#ece3d4)', fontFamily:'var(--serif)', fontSize:'13.5px', letterSpacing:'.14em' }}>棚をみる</button>
                    <button onClick={() => go('tsuno')} style={{ flex:1, background:'none', border:'none', borderRight:'1px solid var(--line,rgba(236,227,212,.12))', cursor:'pointer', padding:'15px 4px', color:'var(--ink,#ece3d4)', fontFamily:'var(--serif)', fontSize:'13.5px', letterSpacing:'.14em' }}>津野町</button>
                    <button onClick={() => go('about')} style={{ flex:1, background:'none', border:'none', cursor:'pointer', padding:'15px 4px', color:'var(--ink,#ece3d4)', fontFamily:'var(--serif)', fontSize:'13.5px', letterSpacing:'.14em' }}>このお店</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BOOKSTORE */}
          {screen === 'bookstore' && (
            <div style={{ position:'absolute', inset:0, background:'var(--bg,#13100c)', display:'flex', flexDirection:'column' }}>
              <div style={{ height:'44px' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px 4px' }}>
                <button onClick={() => go('entry')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', lineHeight:1, padding:'6px' }}>←</button>
                <div style={{ textAlign:'center', fontFamily:'var(--serif)', fontSize:'15px', letterSpacing:'.3em', color:'var(--ink,#ece3d4)' }}>本屋</div>
                <button onClick={() => setNavOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontSize:'18px', letterSpacing:'.1em', padding:'6px' }}>≡</button>
              </div>

              <div style={{ position:'relative', flex:1, overflow:'hidden', minHeight:'300px' }}>
                <div style={{ position:'absolute', left:0, top:0, right:0, height:'62%', background:'linear-gradient(180deg,#4a3623 0%,#34251700 100%),linear-gradient(180deg,#3c2c1b 0%,#2a1d12 100%)' }} />
                <div style={{ position:'absolute', left:0, top:'62%', right:0, height:'2px', background:'rgba(0,0,0,.4)', boxShadow:'0 -1px 0 rgba(255,255,255,.04)' }} />

                <div style={{ position:'absolute', right:'44px', top:'7%', width:'80px', height:'94px', borderRadius:'2px', background:'linear-gradient(180deg,#9cc8e6 0%,#bcdcef 52%,#e4f1f6 100%)', boxShadow:'0 0 30px 12px rgba(168,206,232,.3), inset 0 0 0 3px #4a3826', overflow:'hidden' }}>
                  <div style={{ position:'absolute', left:'8px', top:'18px', width:'32px', height:'11px', background:'rgba(255,255,255,.92)', borderRadius:'8px', filter:'blur(1.5px)' }} />
                  <div style={{ position:'absolute', right:'7px', top:'42px', width:'26px', height:'9px', background:'rgba(255,255,255,.82)', borderRadius:'7px', filter:'blur(1.5px)' }} />
                  <div style={{ position:'absolute', left:'50%', top:0, bottom:0, width:'3px', background:'#4a3826', transform:'translateX(-50%)' }} />
                  <div style={{ position:'absolute', top:'50%', left:0, right:0, height:'3px', background:'#4a3826', transform:'translateY(-50%)' }} />
                </div>
                <div style={{ position:'absolute', right:'6px', top:'14%', width:'152px', height:'240px', background:'linear-gradient(158deg, rgba(214,234,246,.22) 0%, rgba(214,234,246,.06) 38%, transparent 64%)', transform:'rotate(7deg)', transformOrigin:'top right', pointerEvents:'none' }} />

                {tone === 'night' && (
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'26%', overflow:'hidden' }}>
                    {[['14%','14%','3.5s'],['42%','28%','4.2s'],['24%','46%','3s'],['55%','60%','3.8s'],['30%','76%','4.6s'],['14%','88%','3.3s']].map(([top,left,dur],i) => (
                      <span key={i} style={{ position:'absolute', top, left, width:'2px', height:'2px', borderRadius:'50%', background:'#fff', animation:`ttTwinkle ${dur} ease-in-out infinite` }} />
                    ))}
                    <span style={{ position:'absolute', top:'8%', right:'22px', fontSize:'18px', lineHeight:1, color:'rgba(236,227,212,.5)' }}>☾</span>
                  </div>
                )}
                {tone === 'dusk' && <div style={{ position:'absolute', top:0, left:0, right:0, height:'26%', background:'linear-gradient(180deg, rgba(220,168,90,.26) 0%, rgba(154,126,116,.1) 60%, transparent 100%)' }} />}
                {tone === 'mist' && <div style={{ position:'absolute', top:0, left:0, right:0, height:'30%', background:'linear-gradient(180deg, rgba(232,235,236,.16) 0%, transparent 100%)', filter:'blur(1px)' }} />}

                <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'2px', height:'30px', background:'rgba(0,0,0,.5)' }} />
                <div style={{ position:'absolute', top:'28px', left:'50%', transform:'translateX(-50%)', width:'34px', height:'14px', borderRadius:'0 0 14px 14px', background:'linear-gradient(180deg,#5a4632,#3a2c1d)', boxShadow:'0 6px 10px -4px rgba(0,0,0,.6)' }} />
                <div style={{ position:'absolute', top:'34px', left:'50%', transform:'translateX(-50%)', width:'210px', height:'200px', borderRadius:'50%', background:'radial-gradient(closest-side, rgba(232,190,118,.24) 0%, rgba(214,168,92,.09) 45%, transparent 74%)', animation:'ttGlow 6s ease-in-out infinite' }} />

                <div style={{ position:'absolute', left:0, bottom:0, right:0, height:'38%', background:'linear-gradient(180deg,#5a4429 0%,#41301d 100%)' }} />
                <div style={{ position:'absolute', left:0, bottom:0, right:0, height:'38%', backgroundImage:'repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 1px, transparent 1px 30px)', opacity:.55 }} />
                <div style={{ position:'absolute', left:0, bottom:0, right:0, height:'3px', background:'rgba(255,255,255,.05)' }} />
                <div style={{ position:'absolute', left:'50%', bottom:'6%', transform:'translateX(-50%)', width:'340px', height:'150px', background:'radial-gradient(closest-side, rgba(226,180,108,.18) 0%, transparent 80%)' }} />

                <div style={{ position:'absolute', left:'24px', right:'24px', bottom:'23.5%', height:'18px', background:'radial-gradient(closest-side, rgba(0,0,0,.5), transparent 78%)', filter:'blur(4px)', zIndex:1 }} />
                <div style={{ position:'absolute', left:'12px', right:'12px', bottom:'24%', display:'flex', gap:'6px', alignItems:'flex-end', justifyContent:'center' }}>

                  <button onClick={() => { setCatKey('keeper'); go('category'); }} style={{ flex:1, maxWidth:'90px', background:'none', border:'none', padding:0, cursor:'pointer' }}>
                    <div style={{ height:'22px', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                      <div style={{ position:'relative', width:'30px', height:'30px' }}>
                        <div style={{ position:'absolute', left:'50%', top:'-2px', transform:'translateX(-7px)', width:'2px', height:'9px', background:'linear-gradient(180deg,transparent,rgba(236,227,212,.55))', borderRadius:'2px', filter:'blur(1px)', animation:'ttGlow 4s ease-in-out infinite' }} />
                        <div style={{ position:'absolute', left:'50%', top:'-4px', transform:'translateX(1px)', width:'2px', height:'11px', background:'linear-gradient(180deg,transparent,rgba(236,227,212,.5))', borderRadius:'2px', filter:'blur(1px)', animation:'ttGlow 5.2s ease-in-out .8s infinite' }} />
                        <div style={{ position:'absolute', left:'50%', bottom:'1px', transform:'translateX(-50%)', width:'27px', height:'5px', background:'linear-gradient(180deg,#e6dcc8,#bcae94)', borderRadius:'50%', boxShadow:'0 2px 4px -2px rgba(0,0,0,.5)' }} />
                        <div style={{ position:'absolute', left:'50%', bottom:'3px', transform:'translateX(-50%)', width:'18px', height:'13px', background:'linear-gradient(180deg,#efe7d6,#cdbfa6)', borderRadius:'2px 2px 6px 6px', boxShadow:'inset 0 1px 0 rgba(255,255,255,.4)' }} />
                        <div style={{ position:'absolute', left:'50%', bottom:'13px', transform:'translateX(-50%)', width:'14px', height:'4px', background:'#3a2415', borderRadius:'50%', boxShadow:'inset 0 1px 1px rgba(0,0,0,.4)' }} />
                        <div style={{ position:'absolute', left:'50%', bottom:'6px', transform:'translateX(7px)', width:'7px', height:'8px', border:'2px solid #d8c8a8', borderLeft:'none', borderRadius:'0 6px 6px 0' }} />
                      </div>
                    </div>
                    <ShelfCase colors={[['#a9794f','#7d6b86','#5d6b4f','#6e5a44'],['#5d6b86','#b59b6b','#86643f','#7d6b86'],['#6e7256','#a9794f','#5d6b86','#6e5a44']]} bg="#38291a" />
                    <div style={{ marginTop:'7px', textAlign:'center', fontFamily:'var(--serif)', fontSize:'11px', letterSpacing:'.04em', color:'var(--ink,#ece3d4)', whiteSpace:'nowrap' }}>店主のおすすめ</div>
                  </button>

                  <button onClick={() => { setCatKey('bun'); go('category'); }} style={{ flex:1, maxWidth:'90px', background:'none', border:'none', padding:0, cursor:'pointer' }}>
                    <div style={{ height:'22px', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                      <div style={{ position:'relative', width:'38px', height:'20px' }}>
                        <div style={{ position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%) rotate(-40deg)', display:'flex', alignItems:'center' }}>
                          <div style={{ width:0, height:0, borderTop:'4px solid transparent', borderBottom:'4px solid transparent', borderRight:'8px solid #c9b079' }} />
                          <div style={{ width:'2px', height:'7px', background:'#c9b079' }} />
                          <div style={{ width:'4px', height:'6px', background:'#3a2a19' }} />
                          <div style={{ width:'21px', height:'6px', background:'linear-gradient(180deg,#d9c089,#a9824a)', borderRadius:'0 3px 3px 0', boxShadow:'inset 0 1px 0 rgba(255,255,255,.28)' }} />
                        </div>
                      </div>
                    </div>
                    <ShelfCase colors={[['#5a3b46','#3f4a63','#4a4a6a','#6e5a44'],['#3f4a63','#5a3b46','#5d5a6e','#4a4a6a'],['#4a4a6a','#6e5a44','#5a3b46','#3f4a63']]} bg="#34261a" />
                    <div style={{ marginTop:'7px', textAlign:'center', fontFamily:'var(--serif)', fontSize:'13px', letterSpacing:'.16em', color:'var(--ink,#ece3d4)' }}>文学</div>
                  </button>

                  <button onClick={() => { setCatKey('shizen'); go('category'); }} style={{ flex:1, maxWidth:'90px', background:'none', border:'none', padding:0, cursor:'pointer' }}>
                    <div style={{ height:'22px', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                      <div style={{ position:'relative', width:'30px', height:'34px' }}>
                        {[{r:0,w:6,h:25,c:'#5e7245'},{r:-34,w:6,h:22,c:'#6e8257'},{r:34,w:6,h:22,c:'#52673d'},{r:-60,w:5,h:16,c:'#7a8a5f'},{r:60,w:5,h:16,c:'#62754a'}].map((l,i) => (
                          <div key={i} style={{ position:'absolute', left:'50%', bottom:'8px', width:l.w+'px', height:l.h+'px', background:l.c, borderRadius:'60% 60% 50% 50%', transform:`translateX(-50%) rotate(${l.r}deg)`, transformOrigin:'bottom center' }} />
                        ))}
                        <div style={{ position:'absolute', left:'50%', bottom:0, transform:'translateX(-50%)', width:'17px', height:'11px', background:'linear-gradient(180deg,#b07f49,#86592f)', borderRadius:'2px 2px 4px 4px' }} />
                        <div style={{ position:'absolute', left:'50%', bottom:'9px', transform:'translateX(-50%)', width:'20px', height:'4px', background:'#c0904f', borderRadius:'2px' }} />
                      </div>
                    </div>
                    <ShelfCase colors={[['#4f6048','#5f6e80','#6e7256','#5d6b4f'],['#5d6b86','#5d6b4f','#76795e','#4f6048'],['#6e7256','#4f6048','#5f6e80','#5d6b4f']]} bg="#2d3326" />
                    <div style={{ marginTop:'7px', textAlign:'center', fontFamily:'var(--serif)', fontSize:'13px', letterSpacing:'.16em', color:'var(--ink,#ece3d4)' }}>自然</div>
                  </button>

                  <button onClick={() => { setCatKey('shakai'); go('category'); }} style={{ flex:1, maxWidth:'90px', background:'none', border:'none', padding:0, cursor:'pointer' }}>
                    <div style={{ height:'22px', position:'relative', width:'48px', margin:'0 auto' }}>
                      <div style={{ position:'absolute', left:'50%', bottom:0, transform:'translateX(-50%)', width:'26px', height:'16px', background:'#c79a63', borderRadius:'11px 11px 7px 7px' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:0, transform:'translateX(-9px)', width:'7px', height:'6px', background:'#bb8d57', borderRadius:'3px 3px 2px 2px' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:0, transform:'translateX(2px)', width:'7px', height:'6px', background:'#bb8d57', borderRadius:'3px 3px 2px 2px' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'13px', transform:'translateX(-18px)', width:'9px', height:'16px', background:'#a87b46', borderRadius:'6px 6px 7px 7px' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'13px', transform:'translateX(9px)', width:'9px', height:'16px', background:'#a87b46', borderRadius:'6px 6px 7px 7px' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'11px', transform:'translateX(-50%)', width:'24px', height:'21px', background:'#c79a63', borderRadius:'50%' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'20px', transform:'translateX(-7px)', width:'3px', height:'3px', background:'#2a201a', borderRadius:'50%' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'20px', transform:'translateX(4px)', width:'3px', height:'3px', background:'#2a201a', borderRadius:'50%' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'12px', transform:'translateX(-50%)', width:'13px', height:'9px', background:'#e0bd8e', borderRadius:'50%' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'17px', transform:'translateX(-50%)', width:'4px', height:'3px', background:'#2a201a', borderRadius:'50%' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'13px', transform:'translateX(-6px)', width:'6px', height:'4px', border:'1.5px solid #2a201a', borderTop:'none', borderRight:'none', borderRadius:'0 0 0 6px' }} />
                      <div style={{ position:'absolute', left:'50%', bottom:'13px', width:'6px', height:'4px', border:'1.5px solid #2a201a', borderTop:'none', borderLeft:'none', borderRadius:'0 0 6px 0' }} />
                    </div>
                    <ShelfCase colors={[['#86643f','#7a5a52','#6b5e4a','#8a6b4a'],['#736455','#86643f','#7a5a52',''],['#6b5e4a','#8a6b4a','#86643f','#736455']]} bg="#34281a" />
                    <div style={{ marginTop:'7px', textAlign:'center', fontFamily:'var(--serif)', fontSize:'13px', letterSpacing:'.16em', color:'var(--ink,#ece3d4)' }}>社会</div>
                  </button>

                  <PlantDecoration side="left" />
                  <PlantDecoration side="right" />
                </div>

                {/* floor items */}
                <div style={{ position:'absolute', left:0, right:0, bottom:'4%', height:'64px', pointerEvents:'none' }}>
                  <div style={{ position:'absolute', left:'50%', bottom:'3px', transform:'translateX(-50%)', width:'188px', height:'36px', borderRadius:'50%', background:'radial-gradient(closest-side, rgba(158,96,74,.36), rgba(120,72,56,.14) 66%, transparent)' }} />
                  <div style={{ position:'absolute', left:'50%', bottom:'8px', transform:'translateX(-50%)', width:'150px', height:'22px', borderRadius:'50%', background:'repeating-radial-gradient(circle at 50% 50%, rgba(214,180,130,.2) 0 4px, transparent 4px 8px)', opacity:.7 }} />
                  <div style={{ position:'absolute', left:'50%', bottom:'11px', transform:'translateX(-74px)', width:'54px' }}>
                    {[{c:'linear-gradient(90deg,#7a5a52,#8a6658)',r:'-2deg'},{c:'linear-gradient(90deg,#5d6b4f,#6b7a5b)',r:'1.5deg',w:'48px'},{c:'linear-gradient(90deg,#6e5a44,#7e6850)',r:'0'},{c:'linear-gradient(90deg,#5f5a6e,#6c6680)',r:'-1deg',w:'44px'}].map((b,i) => (
                      <div key={i} style={{ height:'7px', ...(i>0?{marginTop:'1px'}:{}), ...(b.w ? {width:b.w}:{}), background:b.c, borderRadius:'1px 2px 2px 1px', boxShadow:'inset 2px 0 0 rgba(255,255,255,.16)', transform:`rotate(${b.r})` }} />
                    ))}
                  </div>
                  <div style={{ position:'absolute', left:'50%', bottom:'9px', transform:'translateX(16px)', width:'46px', height:'26px' }}>
                    <div style={{ position:'absolute', bottom:0, left:0, width:'46px', height:'20px', background:'linear-gradient(180deg,#7c726a,#5f574f)', borderRadius:'50%' }} />
                    <div style={{ position:'absolute', bottom:'1px', left:'28px', width:'22px', height:'9px', background:'#857a70', borderRadius:'50%', transform:'rotate(18deg)' }} />
                    <div style={{ position:'absolute', bottom:'6px', left:'-1px', width:'17px', height:'15px', background:'#7c726a', borderRadius:'50%' }} />
                    <div style={{ position:'absolute', bottom:'17px', left:'1px', width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderBottom:'7px solid #7c726a' }} />
                    <div style={{ position:'absolute', bottom:'17px', left:'9px', width:0, height:0, borderLeft:'4px solid transparent', borderRight:'4px solid transparent', borderBottom:'7px solid #7c726a' }} />
                    <div style={{ position:'absolute', bottom:'11px', left:'2px', width:'5px', height:'2px', borderBottom:'1.5px solid #3a332e', borderRadius:'0 0 4px 4px' }} />
                    <div style={{ position:'absolute', bottom:'13px', left:'20px', width:'14px', height:'2px', background:'rgba(58,51,46,.4)', borderRadius:'2px', transform:'rotate(-8deg)' }} />
                    <div style={{ position:'absolute', bottom:'9px', left:'22px', width:'16px', height:'2px', background:'rgba(58,51,46,.34)', borderRadius:'2px', transform:'rotate(-4deg)' }} />
                  </div>
                </div>
              </div>

              {/* today bar */}
              <div style={{ padding:'12px 18px 18px', borderTop:'1px solid var(--line,rgba(236,227,212,.1))', display:'flex', alignItems:'center', gap:'12px' }}>
                <div style={{ width:'38px', height:'38px', flex:'none', borderRadius:'50%', background:'var(--amber-soft,rgba(202,164,99,.16))', border:'1px solid var(--line,rgba(236,227,212,.14))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Hina Mincho',serif", fontSize:'18px', color:'var(--amber,#caa463)' }}>本</div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'9px', letterSpacing:'.2em', color:'var(--dim,#9b9081)' }}>今日のたまたま本</div>
                  {today ? (
                    <button onClick={() => setBook(today)} style={{ background:'none', border:'none', padding:'2px 0 0', cursor:'pointer', textAlign:'left', color:'var(--ink,#ece3d4)', fontFamily:'var(--serif)', fontSize:'14.5px', letterSpacing:'.04em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'260px' }}>{today.title}</button>
                  ) : (
                    <div style={{ paddingTop:'2px', color:'var(--faint,#6f655a)', fontFamily:'var(--serif)', fontSize:'13px', letterSpacing:'.04em' }}>読み込み中…</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SHELVES */}
          {screen === 'shelves' && (
            <div style={{ position:'absolute', inset:0, background:'var(--bg,#13100c)', display:'flex', flexDirection:'column' }}>
              <div style={{ height:'44px' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px 4px' }}>
                <button onClick={() => go('entry')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', lineHeight:1, padding:'6px' }}>←</button>
                <button onClick={() => setNavOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontSize:'18px', padding:'6px' }}>≡</button>
              </div>
              <div style={{ padding:'6px 28px 14px' }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'13px', letterSpacing:'.2em', color:'var(--amber,#caa463)' }}>shelves</div>
                <h2 style={{ margin:'2px 0 0', fontFamily:'var(--serif)', fontWeight:600, fontSize:'30px', letterSpacing:'.14em', color:'var(--ink,#ece3d4)' }}>棚</h2>
              </div>
              <div style={{ flex:1, overflowY:'auto', paddingBottom:'28px' }}>
                {catsWithShelves.map(c => (
                  <div key={c.key}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:'10px', padding:'20px 28px 8px' }}>
                      <span style={{ fontFamily:'var(--serif)', fontSize:'16px', letterSpacing:'.22em', color:'var(--amber,#caa463)' }}>{c.name}</span>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'11px', letterSpacing:'.14em', color:'var(--faint,#6f655a)' }}>{c.en}</span>
                    </div>
                    {c.shelves.map(s => (
                      <button key={s.id} onClick={() => openShelf(s.id, s.category)} style={{ display:'flex', width:'100%', alignItems:'baseline', gap:'14px', textAlign:'left', cursor:'pointer', background:'none', border:'none', borderTop:'1px solid var(--line,rgba(236,227,212,.1))', padding:'14px 28px' }}>
                        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'14px', color:'var(--faint,#6f655a)', width:'22px', flex:'none', fontVariantNumeric:'tabular-nums' }}>{s.num}</span>
                        <span style={{ flex:1, minWidth:0 }}>
                          <span style={{ display:'block', fontFamily:'var(--serif)', fontSize:'17px', letterSpacing:'.05em', color:'var(--ink,#ece3d4)' }}>{s.name}</span>
                          <span style={{ display:'block', marginTop:'3px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'10px', lineHeight:1.7, letterSpacing:'.04em', color:'var(--dim,#9b9081)' }}>{s.note}</span>
                        </span>
                        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'13px', color:'var(--faint,#6f655a)', flex:'none' }}>{s.count || ''}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CATEGORY */}
          {screen === 'category' && (
            <div style={{ position:'absolute', inset:0, background:'var(--bg,#13100c)', display:'flex', flexDirection:'column' }}>
              <div style={{ position:'relative', height:'188px', flex:'none', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:`url('/assets/photos/${activeCat.photo}.jpg')`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.46) saturate(.8)' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(12,10,8,.5) 0%, rgba(12,10,8,.2) 40%, var(--bg,#13100c) 100%)' }} />
                <div style={{ position:'absolute', top:0, left:0, right:0, height:'44px' }} />
                <button onClick={() => go('bookstore')} style={{ position:'absolute', top:'50px', left:'16px', background:'rgba(12,10,8,.4)', border:'1px solid var(--line,rgba(236,227,212,.16))', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'var(--ink,#ece3d4)', fontFamily:"'Cormorant Garamond',serif", fontSize:'18px' }}>←</button>
                <div style={{ position:'absolute', left:'28px', bottom:'16px', right:'28px' }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'12px', letterSpacing:'.18em', color:'var(--amber,#caa463)' }}>{activeCat.en}</div>
                  <h2 style={{ margin:'3px 0 0', fontFamily:'var(--serif)', fontWeight:600, fontSize:'30px', letterSpacing:'.18em', color:'var(--ink,#f3ecdf)' }}>{activeCat.name}</h2>
                </div>
              </div>
              <p style={{ margin:0, padding:'16px 28px 14px', fontFamily:'var(--serif)', fontSize:'13px', lineHeight:2, letterSpacing:'.04em', color:'var(--dim,#b6aa98)' }}>{activeCat.note}</p>
              <div style={{ flex:1, overflowY:'auto', paddingBottom:'28px' }}>
                {activeCatFull.shelves.map(s => (
                  <button key={s.id} onClick={() => openShelf(s.id, s.category)} style={{ display:'flex', width:'100%', alignItems:'baseline', gap:'14px', textAlign:'left', cursor:'pointer', background:'none', border:'none', borderTop:'1px solid var(--line,rgba(236,227,212,.1))', padding:'16px 28px' }}>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'14px', color:'var(--faint,#6f655a)', width:'22px', flex:'none', fontVariantNumeric:'tabular-nums' }}>{s.num}</span>
                    <span style={{ flex:1, minWidth:0 }}>
                      <span style={{ display:'block', fontFamily:'var(--serif)', fontSize:'18px', letterSpacing:'.05em', color:'var(--ink,#ece3d4)' }}>{s.name}</span>
                      <span style={{ display:'block', marginTop:'3px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'10.5px', lineHeight:1.7, letterSpacing:'.04em', color:'var(--dim,#9b9081)' }}>{s.note}</span>
                    </span>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'13px', color:'var(--faint,#6f655a)', flex:'none' }}>{s.count || ''}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SHELF DETAIL */}
          {screen === 'shelf' && activeShelf && (
            <div style={{ position:'absolute', inset:0, background:'var(--bg,#13100c)', display:'flex', flexDirection:'column' }}>
              <div style={{ position:'relative', height:'200px', flex:'none', overflow:'hidden' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:`url('/assets/photos/${activeShelf.photo}.jpg')`, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.46) saturate(.8)' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(12,10,8,.5) 0%, rgba(12,10,8,.2) 40%, var(--bg,#13100c) 100%)' }} />
                <button onClick={() => setScreen('category')} style={{ position:'absolute', top:'50px', left:'16px', background:'rgba(12,10,8,.4)', border:'1px solid var(--line,rgba(236,227,212,.16))', borderRadius:'50%', width:'34px', height:'34px', cursor:'pointer', color:'var(--ink,#ece3d4)', fontFamily:"'Cormorant Garamond',serif", fontSize:'18px' }}>←</button>
                <div style={{ position:'absolute', left:'28px', bottom:'18px', right:'28px' }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'12px', letterSpacing:'.18em', color:'var(--amber,#caa463)' }}>{activeShelf.sub}</div>
                  <h2 style={{ margin:'3px 0 0', fontFamily:'var(--serif)', fontWeight:600, fontSize:'27px', letterSpacing:'.08em', color:'var(--ink,#f3ecdf)' }}>{activeShelf.name}</h2>
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                <p style={{ margin:0, padding:'16px 28px 20px', fontFamily:'var(--serif)', fontSize:'13.5px', lineHeight:2, letterSpacing:'.04em', color:'var(--dim,#b6aa98)' }}>{activeShelf.note}</p>
                {loadingBooks ? (
                  <div style={{ padding:'40px 28px', textAlign:'center', fontFamily:'var(--serif)', fontSize:'13px', letterSpacing:'.1em', color:'var(--faint,#6f655a)' }}>読み込み中…</div>
                ) : activeShelf.books.length === 0 ? (
                  <div style={{ padding:'40px 28px', textAlign:'center', fontFamily:'var(--serif)', fontSize:'13px', letterSpacing:'.1em', color:'var(--faint,#6f655a)' }}>本がまだありません</div>
                ) : (
                  <>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'15px 14px', padding:'2px 24px 26px' }}>
                      {activeShelf.books.map((b, i) => (
                        <button key={i} onClick={() => setBook(b)} title={b.title} style={{ background:'none', border:'none', padding:0, cursor:'pointer', display:'block', animation:'ttFade .5s ease both' }}>
                          {b.hasCover && !badCovers.has(b.cover) ? (
                            <div style={{ position:'relative', width:'100%', aspectRatio:'2/3', borderRadius:'2px', overflow:'hidden', backgroundColor:b.spineColor, boxShadow:'0 12px 22px -10px rgba(0,0,0,.75), 0 0 0 1px rgba(0,0,0,.35)' }}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={b.cover} alt={b.title} onError={() => markBadCover(b.cover)} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'4px', background:'linear-gradient(90deg,rgba(0,0,0,.28),transparent)' }} />
                            </div>
                          ) : (
                            <div style={{ position:'relative', width:'100%', aspectRatio:'2/3', borderRadius:'2px', overflow:'hidden', background:b.spineColor, boxShadow:'0 12px 22px -10px rgba(0,0,0,.75), 0 0 0 1px rgba(0,0,0,.35)', display:'flex', alignItems:'flex-start', padding:'11px 9px' }}>
                              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'5px', background:'rgba(255,255,255,.16)' }} />
                              <span style={{ fontFamily:'var(--serif)', fontSize:'11px', lineHeight:1.45, letterSpacing:'.02em', color:'rgba(255,255,255,.92)', textShadow:'0 1px 4px rgba(0,0,0,.4)' }}>{b.title}</span>
                            </div>
                          )}
                          <div style={{ marginTop:'6px', fontFamily:'var(--serif)', fontSize:'10.5px', lineHeight:1.35, letterSpacing:'.02em', color:'var(--ink,#ece3d4)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{b.title}</div>
                          <div style={{ marginTop:'2px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'9px', letterSpacing:'.03em', color:'var(--dim,#9b9081)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.author}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ paddingBottom:'30px' }}>
                      {activeShelf.books.map((b, i) => (
                        <button key={i} onClick={() => setBook(b)} style={{ display:'flex', width:'100%', gap:'14px', alignItems:'center', textAlign:'left', cursor:'pointer', background:'none', border:'none', borderTop:'1px solid var(--line,rgba(236,227,212,.1))', padding:'13px 28px' }}>
                          <span style={{ flex:'none', width:'34px', height:'48px', borderRadius:'1px', background:b.spineColor, boxShadow:'0 4px 8px -3px rgba(0,0,0,.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ writingMode:'vertical-rl', fontFamily:'var(--serif)', fontSize:'7px', color:'rgba(255,255,255,.8)', maxHeight:'40px', overflow:'hidden', paddingTop:'3px' }}>{b.title}</span>
                          </span>
                          <span style={{ flex:1, minWidth:0 }}>
                            <span style={{ display:'block', fontFamily:'var(--serif)', fontSize:'14.5px', letterSpacing:'.03em', color:'var(--ink,#ece3d4)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{b.title}</span>
                            <span style={{ display:'block', marginTop:'2px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'10px', letterSpacing:'.04em', color:'var(--dim,#9b9081)' }}>{b.author}</span>
                          </span>
                          <span style={{ flex:'none', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'9px', letterSpacing:'.08em', color:b.statusColor }}>{b.status}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ABOUT */}
          {screen === 'about' && (
            <div style={{ position:'absolute', inset:0, background:'var(--bg,#13100c)', display:'flex', flexDirection:'column' }}>
              <div style={{ height:'44px' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px 4px' }}>
                <button onClick={() => go('entry')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', padding:'6px' }}>←</button>
                <button onClick={() => setNavOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontSize:'18px', padding:'6px' }}>≡</button>
              </div>
              <div style={{ flex:1, overflowY:'auto', paddingBottom:'36px' }}>
                <div style={{ padding:'8px 28px 22px' }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'13px', letterSpacing:'.2em', color:'var(--amber,#caa463)' }}>about</div>
                  <h2 style={{ margin:'2px 0 0', fontFamily:'var(--serif)', fontWeight:600, fontSize:'27px', letterSpacing:'.1em', color:'var(--ink,#ece3d4)' }}>たまたま書店のこと</h2>
                </div>
                <div style={{ position:'relative', height:'172px', margin:'0 0 22px', overflow:'hidden' }}>
                  <div style={{ position:'absolute', inset:0, backgroundImage:"url('/assets/photos/mist.jpg')", backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.6) saturate(.82)' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 40%, var(--bg,#13100c) 100%)' }} />
                </div>
                <div style={{ padding:'0 28px' }}>
                  <p style={{ margin:'0 0 18px', fontFamily:'var(--serif)', fontSize:'14.5px', lineHeight:2.15, letterSpacing:'.05em', color:'var(--ink,#ddd2c0)' }}>たまたま書店は、店主が置きたい本を気ままに並べる、高知県津野町の小さなWeb本屋です。</p>
                  <p style={{ margin:'0 0 28px', fontFamily:'var(--serif)', fontSize:'13.5px', lineHeight:2.1, letterSpacing:'.04em', color:'var(--dim,#b6aa98)' }}>書店のよさは、知らなかった本にたまたま出会えることだと思っています。<br />普段なら選ばない本に出会って頂けたら幸いです。</p>
                  <div style={{ borderTop:'1px solid var(--line,rgba(236,227,212,.12))', paddingTop:'24px' }}>
                    <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'12px', letterSpacing:'.2em', color:'var(--amber,#caa463)' }}>the keeper</div>
                    <h3 style={{ margin:'3px 0 16px', fontFamily:'var(--serif)', fontWeight:600, fontSize:'19px', letterSpacing:'.08em', color:'var(--ink,#ece3d4)' }}>店主のこと</h3>
                    <div style={{ display:'flex', gap:'14px', alignItems:'center', marginBottom:'18px' }}>
                      <div style={{ width:'60px', height:'60px', flex:'none', borderRadius:'50%', border:'1px dashed var(--line,rgba(236,227,212,.22))', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'8px', letterSpacing:'.1em', color:'var(--faint,#6f655a)', textAlign:'center' }}>店主<br />写真</div>
                      <div>
                        <div style={{ fontFamily:'var(--serif)', fontSize:'16px', letterSpacing:'.06em', color:'var(--ink,#ece3d4)' }}>店主 ○○○○</div>
                        <div style={{ marginTop:'4px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'10px', lineHeight:1.7, letterSpacing:'.06em', color:'var(--dim,#9b9081)' }}>津野町 地域おこし協力隊<br />小中学校 ICT支援員</div>
                      </div>
                    </div>
                    <p style={{ margin:0, padding:'14px 16px', border:'1px solid var(--line,rgba(236,227,212,.12))', borderRadius:'2px', fontFamily:'var(--serif)', fontSize:'12.5px', lineHeight:2, letterSpacing:'.03em', color:'var(--faint,#8a7f70)' }}>（ここに店主本人のプロフィール文が入ります。）</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TSUNO */}
          {screen === 'tsuno' && (
            <div style={{ position:'absolute', inset:0, background:'var(--bg,#13100c)', display:'flex', flexDirection:'column' }}>
              <div style={{ height:'44px' }} />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 18px 6px' }}>
                <button onClick={() => go('entry')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', padding:'6px' }}>←</button>
                <div style={{ fontFamily:'var(--serif)', fontSize:'15px', letterSpacing:'.3em', color:'var(--ink,#ece3d4)' }}>津野町</div>
                <button onClick={() => setNavOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--dim,#9b9081)', fontSize:'18px', padding:'6px' }}>≡</button>
              </div>
              <div style={{ flex:1, overflowY:'auto' }}>
                <div style={{ padding:'16px 28px 24px' }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'12px', letterSpacing:'.2em', color:'var(--amber,#caa463)' }}>about tsuno</div>
                  <h3 style={{ margin:'3px 0 16px', fontFamily:'var(--serif)', fontWeight:600, fontSize:'23px', letterSpacing:'.08em', color:'var(--ink,#ece3d4)' }}>津野町のこと</h3>
                  <p style={{ margin:'0 0 16px', fontFamily:'var(--serif)', fontSize:'13.5px', lineHeight:2.1, letterSpacing:'.05em', color:'var(--ink,#ddd2c0)' }}>高知県の北西部、四国山地のただなかにある小さな町。標高1,400mの四国カルストから源流の清流、棚田や大銀杏のある里まで、自然と人の暮らしがすぐ隣り合っています。</p>
                  <p style={{ margin:0, padding:'14px 16px', border:'1px solid var(--line,rgba(236,227,212,.12))', borderRadius:'2px', fontFamily:'var(--serif)', fontSize:'12.5px', lineHeight:2, letterSpacing:'.03em', color:'var(--faint,#8a7f70)' }}>（ここに店主が、津野町の簡単な説明や、好きな場所のことを書けます。）</p>
                </div>
                {tsunoThemes.map((p, pi) => (
                  <div key={pi} style={{ padding:'4px 24px 24px' }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:'10px', margin:'0 4px 10px' }}>
                      <span style={{ fontFamily:'var(--serif)', fontSize:'18px', letterSpacing:'.16em', color:'var(--ink,#ece3d4)' }}>{p.title}</span>
                      <span style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'11px', letterSpacing:'.14em', color:'var(--amber,#caa463)' }}>{p.en}</span>
                    </div>
                    <div style={{ position:'relative', height:'228px', borderRadius:'3px', overflow:'hidden', boxShadow:'0 16px 32px -18px rgba(0,0,0,.75)' }}>
                      {p.layers.map((l, li) => (
                        <div key={li} style={{ position:'absolute', inset:0, backgroundImage:l.bg, backgroundSize:'cover', backgroundPosition:'center', filter:'brightness(.78) saturate(.94)', opacity:l.opacity, transition:'opacity 1.8s ease' }} />
                      ))}
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(8,7,5,.18) 0%, transparent 36%, rgba(8,7,5,.72) 100%)' }} />
                      <div style={{ position:'absolute', right:'14px', top:'13px', display:'flex', gap:'6px' }}>
                        {p.dots.map((d, di) => (
                          <span key={di} style={{ width:'5px', height:'5px', borderRadius:'50%', background:d.on, boxShadow:'0 1px 3px rgba(0,0,0,.5)' }} />
                        ))}
                      </div>
                      <p style={{ position:'absolute', left:'18px', right:'18px', bottom:'14px', margin:0, fontFamily:'var(--serif)', fontSize:'12.5px', lineHeight:1.85, letterSpacing:'.04em', color:'rgba(245,239,227,.94)', textShadow:'0 1px 10px rgba(0,0,0,.7)' }}>{p.note}</p>
                    </div>
                  </div>
                ))}
                <div style={{ height:'24px' }} />
              </div>
            </div>
          )}

          {/* BOOK BOTTOM SHEET */}
          {book && (
            <div style={{ position:'absolute', inset:0, zIndex:80 }}>
              <div onClick={() => setBook(null)} style={{ position:'absolute', inset:0, background:'rgba(6,5,4,.72)', animation:'ttFade .3s ease' }} />
              <div style={{ position:'absolute', left:0, right:0, bottom:0, background:'var(--bg2,#1b1610)', borderRadius:'18px 18px 0 0', boxShadow:'0 -20px 50px -20px rgba(0,0,0,.7)', borderTop:'1px solid var(--line,rgba(236,227,212,.14))', padding:'12px 26px 30px', animation:'ttSheet .42s cubic-bezier(.22,1,.36,1)' }}>
                <div style={{ width:'42px', height:'4px', borderRadius:'2px', background:'var(--line,rgba(236,227,212,.2))', margin:'0 auto 20px' }} />
                <div style={{ display:'flex', gap:'18px' }}>
                  {book.hasCover && !badCovers.has(book.cover) ? (
                    <div style={{ flex:'none', width:'96px', height:'140px', borderRadius:'2px', boxShadow:'0 14px 28px -10px rgba(0,0,0,.7)', overflow:'hidden', backgroundColor:book.spineColor, position:'relative' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={book.cover} alt={book.title} onError={() => markBadCover(book.cover)} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    </div>
                  ) : (
                    <div style={{ flex:'none', width:'96px', height:'140px', borderRadius:'2px', background:book.spineColor, boxShadow:'0 14px 28px -10px rgba(0,0,0,.7)', overflow:'hidden', padding:'14px 10px', display:'flex', flexDirection:'column', position:'relative' }}>
                      <div style={{ position:'absolute', left:'7px', top:0, bottom:0, width:'1px', background:'rgba(255,255,255,.18)' }} />
                      <div style={{ fontFamily:'var(--serif)', fontSize:'13px', lineHeight:1.4, letterSpacing:'.02em', color:'rgba(255,255,255,.92)' }}>{book.title}</div>
                      <div style={{ marginTop:'auto', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'7.5px', letterSpacing:'.06em', color:'rgba(255,255,255,.6)' }}>{book.author}</div>
                    </div>
                  )}
                  <div style={{ flex:1, minWidth:0, paddingTop:'4px' }}>
                    <span style={{ display:'inline-block', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'9px', letterSpacing:'.12em', color:book.statusColor, border:'1px solid currentColor', borderRadius:'1px', padding:'2px 7px' }}>{book.status}</span>
                    <h3 style={{ margin:'11px 0 5px', fontFamily:'var(--serif)', fontWeight:600, fontSize:'20px', lineHeight:1.4, letterSpacing:'.03em', color:'var(--ink,#ece3d4)' }}>{book.title}</h3>
                    <div style={{ fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'11px', letterSpacing:'.04em', color:'var(--dim,#9b9081)' }}>{book.author}</div>
                    {book.publisher && <div style={{ marginTop:'2px', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'10px', letterSpacing:'.04em', color:'var(--faint,#6f655a)' }}>{book.publisher}</div>}
                  </div>
                </div>
                {book.comment && (
                  <div style={{ margin:'20px 0 0', padding:'15px 16px', background:'var(--panel,#221c15)', borderRadius:'2px', borderLeft:'2px solid var(--amber,#caa463)' }}>
                    <div style={{ fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'8.5px', letterSpacing:'.18em', color:'var(--amber,#caa463)', marginBottom:'6px' }}>店主より</div>
                    <p style={{ margin:0, fontFamily:'var(--serif)', fontSize:'13px', lineHeight:1.95, letterSpacing:'.03em', color:'var(--ink,#ddd2c0)' }}>{book.comment}</p>
                  </div>
                )}
                <div style={{ display:'flex', gap:'10px', marginTop:'22px' }}>
                  <a href={book.amazonUrl} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:'center', textDecoration:'none', padding:'14px', borderRadius:'2px', background:'var(--amber,#caa463)', color:'#16110a', fontFamily:'var(--serif)', fontWeight:600, fontSize:'13.5px', letterSpacing:'.1em' }}>Amazon</a>
                  {book.rakutenUrl && (
                    <a href={book.rakutenUrl} target="_blank" rel="noopener noreferrer" style={{ flex:1, textAlign:'center', textDecoration:'none', padding:'14px', borderRadius:'2px', background:'none', border:'1px solid var(--line,rgba(236,227,212,.22))', color:'var(--ink,#ece3d4)', fontFamily:'var(--serif)', fontWeight:600, fontSize:'13.5px', letterSpacing:'.1em' }}>楽天ブックス</a>
                  )}
                </div>
                <p style={{ margin:'14px 0 0', textAlign:'center', fontFamily:"'Zen Kaku Gothic New',sans-serif", fontSize:'9px', letterSpacing:'.06em', color:'var(--faint,#6f655a)' }}>※ Amazon / 楽天のアフィリエイトリンクを利用しています</p>
              </div>
            </div>
          )}

          {/* NAV OVERLAY */}
          {navOpen && (
            <div style={{ position:'absolute', inset:0, zIndex:90 }}>
              <div onClick={() => setNavOpen(false)} style={{ position:'absolute', inset:0, background:'rgba(8,7,6,.9)', backdropFilter:'blur(3px)', animation:'ttFade .3s ease' }} />
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 44px' }}>
                <button onClick={() => setNavOpen(false)} style={{ position:'absolute', top:'52px', right:'24px', background:'none', border:'none', color:'var(--dim,#9b9081)', fontSize:'24px', cursor:'pointer' }}>✕</button>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontStyle:'italic', fontSize:'14px', letterSpacing:'.2em', color:'var(--amber,#caa463)', marginBottom:'22px' }}>menu</div>
                {[
                  { label:'入口', fn: () => go('entry') },
                  { label:'本屋に入る', fn: () => go('bookstore') },
                  { label:'棚をみる', fn: () => go('shelves') },
                  { label:'津野町', fn: () => go('tsuno') },
                  { label:'このお店について', fn: () => go('about') },
                ].map((item, i, arr) => (
                  <button key={item.label} onClick={item.fn} style={{ display:'block', textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:'13px 0', borderTop:'1px solid var(--line,rgba(236,227,212,.12))', ...(i === arr.length - 1 ? { borderBottom:'1px solid var(--line,rgba(236,227,212,.12))' } : {}), fontFamily:'var(--serif)', fontSize:'21px', letterSpacing:'.1em', color:'var(--ink,#ece3d4)' }}>{item.label}</button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
