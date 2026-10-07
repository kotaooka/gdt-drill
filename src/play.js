// ===== 記号フラッシュ（14の記号を次々に答えるミニゲーム）と実績（バッジ） =====
// 記号フラッシュ：記号→名前、名前→記号をランダムにまぜて14問。1問まちがえるごとに3秒を加算し、合計タイムを競う。
const FLASH_PEN=3;
let FL=null; // {qs, i, miss, t0, t1, lock, done, best:前回までの自己ベスト}
function flashNew(){
  const keys=shuffle(Object.keys(SYMP));
  const qs=keys.map(k=>{const dir=Math.random()<0.5?'s2n':'n2s',others=shuffle(keys.filter(x=>x!==k)).slice(0,3);return{k,dir,ch:shuffle([k,...others])};});
  FL={qs,i:0,miss:0,t0:Date.now(),t1:null,lock:false,done:false,best:(P.flash||{}).best||null,wrongAt:null};
}
function flashTime(){return ((FL.t1||Date.now())-FL.t0)/1000;}
function flashHTML(){
  const F=P.flash||{};
  if(!FL)return `<h2>記号フラッシュ</h2><div class="panel"><p style="margin-top:0">14の幾何特性の記号を、記号から名前、名前から記号の両方向でテンポよく答えます。1問まちがえるごとに ${FLASH_PEN} 秒を加算します。</p>
    <div class="kpis" style="margin:8px 0"><div class="panel kpi"><div class="lbl">自己ベスト</div><div class="v">${F.best?F.best.toFixed(1):'—'}<small>${F.best?'秒':''}</small></div></div><div class="panel kpi"><div class="lbl">挑戦した回数</div><div class="v">${F.plays||0}<small>回</small></div></div></div>
    <div class="mstart"><button class="btn" data-act="flashgo"><b>スタート</b><span>14問・まちがいは +${FLASH_PEN} 秒</span></button></div></div>
    <div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="flashexit">ホームへ戻る</button></div>`;
  if(FL.done){const tot=FL.score,isBest=FL.best==null||tot<FL.best;
    return `<h2>記号フラッシュの結果</h2><div class="panel" style="text-align:center"><div class="lbl">合計タイム</div><div class="flbig">${tot.toFixed(1)}<small>秒</small></div>
      <p class="note">解答 ${FL.t.toFixed(1)} 秒 ＋ まちがい ${FL.miss} 回 × ${FLASH_PEN} 秒</p>${isBest?'<div class="verdict pass" style="font-size:1.3rem">自己ベスト更新！</div>':`<p class="note">自己ベスト ${FL.best.toFixed(1)} 秒</p>`}</div>
      <div class="actions" style="margin-top:12px"><button class="btn" data-act="flashgo">もう一度</button><button class="btn ghost" data-act="flashexit">ホームへ戻る</button></div>`;}
  const q=FL.qs[FL.i],n=FL.qs.length;
  const prompt=q.dir==='s2n'?`<div class="flsym">${symSVG(q.k)}</div><div class="note">この記号の名前は？</div>`:`<div class="flname">${esc(SYMN[q.k])}</div><div class="note">この幾何特性の記号は？</div>`;
  const opts=q.ch.map(k=>{const cl=FL.wrongAt===k?'wrong':FL.lock&&k===q.k?'right':'';return `<button class="opt flopt ${cl}" data-flash="${k}" ${FL.lock?'disabled':''}>${q.dir==='s2n'?`<span class="tx">${esc(SYMN[k])}</span>`:`<span class="gsym big">${symSVG(k)}</span>`}</button>`;}).join('');
  return `<div class="mockhead"><span class="timer-lbl" style="font-weight:700">${FL.i+1} / ${n}<span class="note" style="margin:0">・まちがい ${FL.miss}</span></span><span class="timer" id="fltime">${flashTime().toFixed(1)}</span></div>
    <div class="qtop" style="margin:0 0 8px"><div class="prog"><i style="width:${FL.i/n*100}%"></i></div></div>
    <div class="qcard flcard">${prompt}<div class="flopts${q.dir==='n2s'?' syms':''}">${opts}</div></div>
    <div class="actions" style="margin-top:12px"><button class="btn ghost" data-act="flashquit">やめる</button></div>`;
}
let flTimer=null;
function flashTick(){clearInterval(flTimer);if(!FL||FL.done)return;flTimer=setInterval(()=>{if(!FL||FL.done||view!=='flash'){clearInterval(flTimer);return;}const el=document.getElementById('fltime');if(el)el.textContent=flashTime().toFixed(1);},100);}
function flashAnswer(k){
  if(!FL||FL.done||FL.lock)return;const q=FL.qs[FL.i];
  if(k===q.k){sfx('right');FL.i++;FL.wrongAt=null;
    if(FL.i>=FL.qs.length){FL.t1=Date.now();FL.t=flashTime();FL.score=FL.t+FL.miss*FLASH_PEN;FL.done=true;clearInterval(flTimer);
      const F=P.flash=P.flash||{plays:0};F.plays=(F.plays||0)+1;if(F.best==null||FL.score<F.best)F.best=+FL.score.toFixed(1);if(!FL.miss)F.perfect=true;
      sfx(FL.best==null||FL.score<FL.best?'fanfare':'end');persist();}
    render();return;}
  // まちがえたら、正解を一瞬見せてから次へ進む
  sfx('wrong');FL.miss++;FL.wrongAt=k;FL.lock=true;render();
  setTimeout(()=>{if(!FL||FL.done)return;FL.lock=false;FL.wrongAt=null;FL.i++;if(FL.i>=FL.qs.length){FL.i--;flashAnswer(FL.qs[FL.i].k);return;}render();},650);
}

// ----- 実績（バッジ） -----
// test(P) が true になったときに獲得する。獲得日時は P.badges に残る（記録の書き出しにも含まれる）
const setDone=sid=>SETS[sid].ids.every(id=>(P.stats[id]||{}).c>0);
const BADGES=[
 {id:'first',name:'はじめの一歩',desc:'1問解いた',test:()=>Object.keys(P.stats).length>0},
 {id:'flash1',name:'記号フラッシュ完走',desc:'記号フラッシュを最後まで解いた',test:()=>(P.flash||{}).plays>0},
 {id:'flashp',name:'記号を覚えた',desc:'記号フラッシュをまちがいなしで完走',test:()=>!!(P.flash||{}).perfect},
 {id:'flash30',name:'記号マスター',desc:'記号フラッシュを30秒以内',test:()=>(P.flash||{}).best!=null&&P.flash.best<=30},
 {id:'diag1',name:'腕だめし',desc:'実力診断を受けた',test:()=>(P.mocks||[]).some(m=>m.f)},
 {id:'diag80',name:'実力者',desc:'実力診断で総合80%以上',test:()=>(P.mocks||[]).some(m=>m.f&&m.tot>=80)},
 {id:'fields',name:'穴のない実力',desc:'全分野で正答率70%以上（各分野20回以上解答）',test:()=>{const f=fieldAcc();return FK.every(k=>f[k].n>=20&&f[k].c/f[k].n>=0.7);}},
 {id:'fcf10',name:'記入枠の職人',desc:'記入枠を組む大問を10題、全区画正解',test:()=>Object.values(SETS).filter(S=>xkOf(S)==='f'&&setDone(S.id)).length>=10},
 {id:'chk10',name:'検図の目',desc:'検図の大問を10題、全問正解',test:()=>Object.values(SETS).filter(S=>xkOf(S)==='c'&&setDone(S.id)).length>=10},
 {id:'zero',name:'ゼロの理解者',desc:'ゼロ幾何公差の知識問題をすべて正解',test:()=>ITEMS.filter(i=>i.cat==='zero'&&i.kind==='k').every(i=>(P.stats[i.id]||{}).c>0)},
 {id:'judge20',name:'判定の目',desc:'合否を判定する問題に20回正解',test:()=>ITEMS.filter(i=>i.kind==='g'&&G[i.id].judge).reduce((a,i)=>a+((P.stats[i.id]||{}).c||0),0)>=20},
 {id:'calc100',name:'計算の鬼',desc:'計算問題に100回正解',test:()=>ITEMS.filter(i=>i.kind==='g'&&!G[i.id].nocalc).reduce((a,i)=>a+((P.stats[i.id]||{}).c||0),0)>=100},
 {id:'streak7',name:'1週間つづけた',desc:'連続記録7日',test:()=>streakInfo().best>=7},
 {id:'streak30',name:'習慣になった',desc:'連続記録30日',test:()=>streakInfo().best>=30},
 {id:'road',name:'ロード完走',desc:'学習ロードの全章を修了',test:()=>PATH.every(ch=>chapDone(ch))},
];
// 新しく獲得した実績を記録し、通知する
function checkBadges(){
  P.badges=P.badges||{};const got=[];
  for(const b of BADGES){if(P.badges[b.id])continue;let ok=false;try{ok=b.test();}catch(e){}if(ok){P.badges[b.id]=Date.now();got.push(b);}}
  if(got.length){setTimeout(()=>{toast('実績を獲得：'+got.map(b=>b.name).join('、'));sfx('goal');},600);}
  return got.length;
}
function badgesHTML(){
  const B=P.badges||{},n=BADGES.filter(b=>B[b.id]).length;
  return `<h2>実績（${n}／${BADGES.length}）</h2><div class="badges">${BADGES.map(b=>`<div class="badge ${B[b.id]?'on':''}"><div class="bi">${B[b.id]?'★':'☆'}</div><b>${esc(b.name)}</b><span>${esc(b.desc)}</span>${B[b.id]?`<small>${new Date(B[b.id]).toLocaleDateString('ja-JP')}</small>`:''}</div>`).join('')}</div>`;
}

// ----- 実力診断の結果を画像（PNG）にする -----
// 上長などに送れるよう、氏名（任意）・日付・総合と分野ごとの正答率・弱い項目を1枚にまとめる
function diagCanvas(r,n,name){
  const W=1080,pad=64,font=getComputedStyle(document.body).fontFamily||'sans-serif';
  const weak=r.items.filter(o=>o.c<o.n).sort((a,b)=>a.c/a.n-b.c/b.n||b.n-a.n).slice(0,6);
  const code=mock&&mock.code,off=code?46:0,H=560+off+FIELDS.length*84+(weak.length?120+weak.length*52:0)+90;
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');
  const C={bg:'#ffffff',ink:'#1c2830',muted:'#5b6c74',line:'#d3ddda',pri:'#1d5c7a',ok:'#276f43',ng:'#b3372a',soft:'#e2eef3'};
  // mw を超える文字列は横に縮めて収める（長い氏名・項目名で右端が切れないように）
  const T=(t,x,y,sz,col,wt,al,mw)=>{g.font=`${wt||400} ${sz}px ${font}`;g.fillStyle=col||C.ink;g.textAlign=al||'left';mw?g.fillText(t,x,y,mw):g.fillText(t,x,y);};
  g.fillStyle=C.bg;g.fillRect(0,0,W,H);g.fillStyle=C.pri;g.fillRect(0,0,W,14);
  T('幾何公差ドリル　実力診断の結果',pad,100,44,C.ink,700);
  T(`${name?name+'　':''}${new Date().toLocaleDateString('ja-JP')}　${n}問`,pad,156,30,C.muted,400,'left',W-pad*2);
  if(code){T(`出題コード ${code}（v${mock.ver||APP.version}）`,pad,200,30,C.pri,700,'left',W-pad*2);g.translate(0,off);}
  g.fillStyle=C.soft;g.beginPath();g.roundRect?g.roundRect(pad,196,W-pad*2,200,24):g.rect(pad,196,W-pad*2,200);g.fill();
  T('総合',pad+40,262,30,C.muted);T(`${r.tot}%`,pad+40,360,96,r.tot>=70?C.ok:C.ng,800);
  if(r.prev)T(`前回 ${r.prev.tot}%（${r.tot-r.prev.tot>=0?'+':''}${r.tot-r.prev.tot}）`,W-pad-40,360,32,C.muted,400,'right');
  let y=460;T('分野ごとの正答率',pad,y,34,C.ink,700);y+=30;
  for(const F of FIELDS){const v=r.f[F.k];if(v==null)continue;y+=54;T(F.name,pad,y,28,C.ink);T(`${v}%`,W-pad,y,30,v>=70?C.ok:C.ng,700,'right');
    y+=16;g.fillStyle=C.line;g.fillRect(pad,y,W-pad*2,14);g.fillStyle=v>=70?C.pri:C.ng;g.fillRect(pad,y,(W-pad*2)*v/100,14);y+=14;}
  if(weak.length){y+=80;T('弱い項目（今回まちがえた問題を含む項目）',pad,y,34,C.ink,700);y+=12;
    for(const o of weak){y+=52;T(`・${o.name}`,pad,y,28,C.ink,400,'left',W-pad*2-120);T(`${o.c}／${o.n}`,W-pad,y,28,C.ng,700,'right');}}
  T(`幾何公差ドリル v${APP.version}・非公式の学習教材`,pad,H-40-off,24,C.muted);
  return cv;
}
async function saveDiagImage(){
  if(!mock||!mock.done)return;
  const name=(document.getElementById('diagName')||{}).value||'';try{localStorage.setItem('gdt-name',name);}catch(e){}
  const cv=diagCanvas(mock.res,mock.list.length,name.trim()),url=cv.toDataURL('image/png'),fn=`実力診断_${dayKey(new Date())}${mock.code?'_'+mock.code:''}${name.trim()?'_'+name.trim():''}.png`;
  const app=APPB();
  if(app&&app.saveImage){try{toast(app.saveImage(url.split(',')[1],fn));}catch(e){toast('保存できませんでした');}return;}
  try{const blob=await (await fetch(url)).blob(),file=new File([blob],fn,{type:'image/png'});
    if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'実力診断の結果'});return;}}catch(e){if(e&&e.name==='AbortError')return;}
  const a=document.createElement('a');a.href=url;a.download=fn;document.body.appendChild(a);a.click();a.remove();toast('画像を保存しました');
}
