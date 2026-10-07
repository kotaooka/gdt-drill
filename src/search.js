// ===== 検索：問題・大問・出題範囲・早見表・公式・関連規格・動く図を、言葉で横断して探す =====
const SR={q:''};
// 言い換え（どれかで探すと、同じグループの言葉でも見つかる）
const SR_SYN=[
 ['最大実体','mmc','mmr','mmb'],['最小実体','lmc','lmr'],['3次元測定機','三次元測定機','cmm'],['理論的に正確な寸法','ted','basic','基本寸法'],
 ['共通公差域','cz'],['二乗和','rss'],['工程能力','cpk','cp'],['ゲージ','gauge','gage','検具','治具'],['データム','datum'],
 ['位置度','position'],['平面度','flatness'],['真円度','circularity','roundness'],['円筒度','cylindricity'],['真直度','straightness'],
 ['平行度','parallelism'],['直角度','perpendicularity'],['傾斜度','angularity'],['同軸度','同心度','coaxiality','concentricity'],['対称度','symmetry'],
 ['振れ','runout'],['輪郭度','profile'],['記入枠','fcf','feature control frame'],['不確かさ','uncertainty'],['積み上げ','stack'],
];
// 比較用の正規化：Ⓜ・(M) は「最大実体」に、全角・半角と大文字・小文字をそろえ、ひらがなはカタカナにする
const srNorm=t=>String(t).replace(/Ⓜ|\(M\)/g,'最大実体').replace(/Ⓛ|\(L\)/g,'最小実体').normalize('NFKC').toLowerCase().replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
let SR_IDX=null;
function srIndex(){
  if(SR_IDX)return SR_IDX;
  const L=[];
  ITEMS.filter(i=>i.kind==='k').forEach(i=>L.push({t:'k',id:i.id,text:i.q+' '+i.ch.join(' ')+' '+i.ex,i}));
  DAI.forEach(s=>L.push({t:'x',id:s.id,text:s.title+' '+s.stem+' '+(s.ex||[]).join(' ')+' '+(s.items||[]).map(x=>x[0]+' '+x[2]).join(' '),s}));
  SYLX.forEach(s=>s.ids.length&&L.push({t:'syl',id:s.key,text:s.name+' '+s.h,s}));
  QREF.forEach(T=>T.rows.forEach((r,ri)=>L.push({t:'tbl',id:T.k+ri,text:T.label+' '+r.map(v=>typeof v==='object'&&v&&v.sym?SYMN[v.sym]:v).join(' '),T,r})));
  FORMULAS.forEach(g=>g.items.forEach(([n,f,d])=>L.push({t:'fml',id:n,text:g.h+' '+n+' '+f+' '+(d||''),g,n,f})));
  Object.entries(REFS).forEach(([k,r])=>r.forEach(([no,t])=>L.push({t:'ref',id:k+no,text:no+' '+t+' '+CATS[k].name,k,no,tt:t})));
  LABS.forEach(x=>L.push({t:'lab',id:x.k,text:x.h+' '+x.intro,x}));
  L.forEach(o=>o.n=srNorm(o.text));
  return SR_IDX=L;
}
// 検索語を空白で区切り、すべての語（またはその言い換え）を含むものを返す
function srTerms(q){
  return srNorm(q).split(/[\s　]+/).filter(Boolean).map(w=>{const g=SR_SYN.find(G=>G.some(x=>srNorm(x)===w||(w.length>=2&&srNorm(x).startsWith(w)&&/^[a-z]+$/.test(w))));return g?[...new Set([w,...g.map(srNorm)])]:[w];});
}
function srFind(q){const T=srTerms(q);if(!T.length)return [];return srIndex().filter(o=>T.every(alts=>alts.some(a=>o.n.includes(a))));}
// 見つかった語を強調する（表示用。言い換えも含む）
function srMark(text,q,max){
  let t=String(text);if(max&&t.length>max)t=t.slice(0,max)+'…';
  const raw=[...new Set(srTerms(q).flat().concat(String(q).split(/[\s　]+/)).filter(w=>w&&w.length))].sort((a,b)=>b.length-a.length);
  if(!raw.length)return esc(t);
  // エスケープ前の文字列を一致部分で分け、部分ごとにエスケープしてからつなぐ（&lt; などを壊さないように）
  const re=new RegExp('('+raw.map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','gi');
  return t.split(re).map((x,i)=>i%2?`<mark>${esc(x)}</mark>`:esc(x)).join('');
}
function srOut(){
  const q=SR.q.trim();
  if(!q)return `<p class="note">例：「最大実体」「データムシフト」「B 0419」「振れ」「CZ」「ゲージ」。空白で区切ると、すべての語を含むものを探します。英語の略語（MMC・CMM・RSS など）でも探せます。</p>`;
  const R=srFind(q),by=t=>R.filter(o=>o.t===t);
  if(!R.length)return `<p class="note">「${esc(q)}」を含むものは見つかりませんでした。語を短くするか、別の言い方で探してください。</p>`;
  const K=by('k'),X=by('x'),S=by('syl'),TB=by('tbl'),F=by('fml'),RF=by('ref'),LB=by('lab');
  const sec=(h,n,body)=>n?`<h3 class="srh">${h}<span>${n}件</span></h3>${body}`:'';
  return `<p class="note">${R.length}件見つかりました。</p>
  ${sec('知識問題',K.length,`${K.length>1?`<div class="actions" style="margin:0 0 8px"><button class="btn tonal sm" data-act="srdrill">見つかった問題を演習する（${Math.min(K.length,20)}問）</button></div>`:''}<div class="panel srl">${K.slice(0,40).map(o=>`<details class="sri"><summary>${srMark(o.i.q,q,90)}<span class="lbl">${esc(CATS[o.i.cat].name)}</span></summary><p class="sra"><b>正解</b>${srMark(optText(o.i.ch[0]),q)}</p><p class="note">${srMark(o.i.ex,q)}</p></details>`).join('')}${K.length>40?`<p class="note">ほか ${K.length-40}件（語を足して絞り込んでください）</p>`:''}</div>`)}
  ${sec('大問（図面を読む・記入枠を組む・検図）',X.length,`<div class="panel srl">${X.map(o=>`<div class="srrow"><div>${srMark(o.s.title,q)}<span class="lbl">${KLAB[xkOf(o.s)]}</span></div><button class="btn ghost sm" data-srset="${o.s.id}">解く</button></div>`).join('')}</div>`)}
  ${sec('出題範囲の項目',S.length,`<div class="panel srl">${S.map(o=>`<div class="srrow"><div>${srMark(o.s.name,q)}<span class="lbl">${esc(o.s.f)}</span></div><button class="btn ghost sm" data-syl="${o.s.key}">演習</button></div>`).join('')}</div>`)}
  ${sec('早見表',TB.length,`<div class="panel srl">${TB.map(o=>`<div class="srrow"><div>${srMark(o.r.map(v=>typeof v==='object'&&v&&v.sym?SYMN[v.sym]:v).join('／'),q,120)}<span class="lbl">${esc(o.T.label)}</span></div><button class="btn ghost sm" data-ttopen="${o.T.k}">表を見る</button></div>`).join('')}</div>`)}
  ${sec('計算式',F.length,`<div class="panel srl">${F.map(o=>`<div class="srrow"><div><b>${srMark(o.n,q)}</b><div class="note" style="margin:2px 0 0">${srMark(o.f,q)}</div></div><button class="btn ghost sm" data-ttopen="calc">公式を見る</button></div>`).join('')}</div>`)}
  ${sec('関連規格',RF.length,`<div class="panel srl">${RF.map(o=>`<div class="srrow"><div><b class="jis">${srMark(o.no,q)}</b> ${srMark(o.tt,q)}<span class="lbl">${esc(CATS[o.k].name)}</span></div><button class="btn ghost sm" data-res="${o.k}">資料</button></div>`).join('')}</div>`)}
  ${sec('動く図',LB.length,`<div class="panel srl">${LB.map(o=>`<div class="srrow"><div>${srMark(o.x.h,q)}</div><button class="btn ghost sm" data-labopen="${o.x.k}">開く</button></div>`).join('')}</div>`)}`;
}
function searchHTML(){
  return `<h2>検索</h2>
  <div class="srbox"><input type="search" id="srchQ" data-srch="1" value="${esc(SR.q)}" placeholder="言葉で探す（例：データムシフト）" aria-label="検索語" enterkeyhint="search" autocomplete="off"></div>
  <div id="srout">${srOut()}</div>`;
}
