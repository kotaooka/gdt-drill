// ===== 図（SVG）：公差記入枠・データム記号・部品図・公差域 =====
// 問題文の図は問題データの fig（['図の名前', {引数}]）で指定し、figQ() で描く。解説の図は figFor() が言葉から選ぶ。
// 図はすべてこのアプリ用に描き起こしたもので、規格票の図を写したものではない。色はテーマの色（CSS 変数）に従う。

// --- 幾何特性の記号（20×20 の枠に描く） ---
const SYMP={
  str:'<path d="M3 10H17"/>',
  flat:'<path d="M7 6H17L13 14H3Z"/>',
  circ:'<circle cx="10" cy="10" r="6"/>',
  cyl:'<circle cx="10" cy="10" r="5"/><path d="M17.8 6.4L10.8 18.6M9.2 1.4L2.2 13.6"/>',
  lprof:'<path d="M3 14A7 7 0 0 1 17 14"/>',
  sprof:'<path d="M3 14A7 7 0 0 1 17 14Z"/>',
  par:'<path d="M4 16L10 4M10 16L16 4"/>',
  perp:'<path d="M10 4V16M3 16H17"/>',
  ang:'<path d="M3 16H17M3 16L15 6"/>',
  pos:'<circle cx="10" cy="10" r="5"/><path d="M10 2V18M2 10H18"/>',
  coax:'<circle cx="10" cy="10" r="3"/><circle cx="10" cy="10" r="7"/>',
  sym:'<path d="M5 6H15M2 10H18M5 14H15"/>',
  run:'<path d="M5 16L14 7"/><path class="g-symf" d="M16 5L10.4 7.2L13.8 10.6Z"/>',
  trun:'<path d="M2 16H18M3 16L10 9M10 16L17 9"/><path class="g-symf" d="M12 7L6.9 8.9L10.1 12.1Z"/><path class="g-symf" d="M19 7L13.9 8.9L17.1 12.1Z"/>'
};
// 記号の名前と分類（早見表・問題で使う）
const SYMN={str:'真直度',flat:'平面度',circ:'真円度',cyl:'円筒度',lprof:'線の輪郭度',sprof:'面の輪郭度',par:'平行度',perp:'直角度',ang:'傾斜度',pos:'位置度',coax:'同軸度・同心度',sym:'対称度',run:'円周振れ',trun:'全振れ'};
const symG=(k,x,y,s=20)=>`<g class="g-sym" transform="translate(${x} ${y}) scale(${s/20})">${SYMP[k]}</g>`;
const symSVG=k=>`<svg viewBox="0 0 20 20" role="img" aria-label="${SYMN[k]||k}">${symG(k,0,0)}</svg>`;

// --- 文字幅の目安（11px） ---
const tw=(t,fs=11)=>[...String(t)].reduce((a,c)=>a+(/[0-9A-Za-z+\-.,()−±]/.test(c)?(c==='.'||c===','?0.32:0.6):c==='φ'?0.7:1)*fs,0);
// 丸囲みの付加記号（Ⓜ など）
const modG=(L,x,y,r=6.2)=>`<circle class="g-sym" cx="${x}" cy="${y}" r="${r}"/><text class="g-t" x="${x}" y="${y+3.6}" text-anchor="middle" style="font-size:${r*1.45}px">${L}</text>`;
// 「φ0.1(M)」のような文字列を描く。(M)(L)(P)(E)(F) は丸囲みの記号にする。戻り値は {svg, w}
function txtG(t,x,y,cls='g-t'){
  let svg='',cx=x;
  for(const part of String(t).split(/(\([MLPEF]\))/)){if(!part)continue;
    const m=part.match(/^\(([MLPEF])\)$/);
    if(m){svg+=modG(m[1],cx+7,y-4);cx+=15;}
    else{svg+=`<text class="${cls}" x="${cx}" y="${y}">${esc(part)}</text>`;cx+=tw(part);}}
  return{svg,w:cx-x};
}
// --- 公差記入枠：o={sym, tol, dats:[], h} 左上 (x,y)。戻り値 {svg, w, h} ---
function fcfG(o,x,y,noSym){
  const h=o.h||22;let cx=x,svg='';
  const box=w=>{svg+=`<rect class="g-fcf" x="${cx}" y="${y}" width="${w}" height="${h}"/>`;};
  if(!noSym){box(h);svg+=symG(o.sym,cx+2,y+1,h-2);}cx+=h;
  const tt=txtG(o.tol,0,0),tw1=Math.max(30,tt.w+12);box(tw1);svg+=txtG(o.tol,cx+6,y+h/2+4).svg;cx+=tw1;
  for(const d of o.dats||[]){const dt=txtG(d,0,0),w=Math.max(22,dt.w+12);box(w);svg+=txtG(d,cx+(w-dt.w)/2,y+h/2+4).svg;cx+=w;}
  return{svg,w:cx-x,h};
}
// 複数段の公差記入枠。composite は記号を1つにして全段にまたがせる（ASME の複合位置度など）。
// そうでなければ、段ごとに記号をもつ単一の枠を上下に重ねる
function fcfMulti(o,x,y){
  if(!o.rows)return fcfG(o,x,y);
  const h=o.h||22;let svg='',W=0;
  if(o.composite){
    const n=o.rows.length;svg+=`<rect class="g-fcf" x="${x}" y="${y}" width="${h}" height="${h*n}"/>`+symG(o.rows[0].sym||o.sym,x+2,y+(h*n-h)/2+1,h-2);
    o.rows.forEach((r,i)=>{const f=fcfG({tol:r.tol,dats:r.dats,h},x,y+i*h,true);svg+=f.svg;W=Math.max(W,f.w);});
  }else{
    o.rows.forEach((r,i)=>{const f=fcfG({sym:r.sym,tol:r.tol,dats:r.dats,h},x,y+i*h);svg+=f.svg;W=Math.max(W,f.w);});
  }
  return{svg,w:W,h:h*o.rows.length};
}
// --- 矢印・線・寸法 ---
function arrowG(x1,y1,x2,y2,cls='g-arwi',L=7,W=2.6){
  const dx=x2-x1,dy=y2-y1,d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,bx=x2-ux*L,by=y2-uy*L;
  return `<path class="g-thin" style="stroke:var(--ink)" d="M${x1} ${y1}L${bx} ${by}"/><path class="${cls}" d="M${x2} ${y2}L${bx-uy*W} ${by+ux*W}L${bx+uy*W} ${by-ux*W}Z"/>`;
}
// 指示線：公差記入枠の端 (x1,y1) から折れ点 (xm,ym) を経て矢印 (x2,y2)
const leadG=(x1,y1,xm,ym,x2,y2)=>`<path class="g-thin" style="stroke:var(--ink)" d="M${x1} ${y1}L${xm} ${ym}"/>`+arrowG(xm,ym,x2,y2);
// 寸法線（水平）：x1〜x2、高さ y、引出線は y0 から。ted=true で理論的に正確な寸法（枠囲み）
function dimH(x1,x2,y,t,o={}){
  const a=(xa,xb)=>arrowG(xa,y,xb,y,'g-arw',6,2.2);
  let s='';if(o.y0!=null)s+=`<path class="g-thin" d="M${x1} ${o.y0}V${y+(y>o.y0?3:-3)}M${x2} ${o.y0}V${y+(y>o.y0?3:-3)}"/>`;
  s+=`<path class="g-thin" d="M${x1+6} ${y}H${x2-6}"/>`+a((x1+x2)/2,x1)+a((x1+x2)/2,x2);
  const w=tw(t),cx=(x1+x2)/2;
  if(o.ted)s+=`<rect class="g-fcf" x="${cx-w/2-3}" y="${y-15}" width="${w+6}" height="13"/>`;
  return s+`<text class="g-t" x="${cx}" y="${y-4.5}" text-anchor="middle">${esc(t)}</text>`;
}
function dimV(y1,y2,x,t,o={}){
  const a=(ya,yb)=>arrowG(x,ya,x,yb,'g-arw',6,2.2);
  let s='';if(o.x0!=null)s+=`<path class="g-thin" d="M${o.x0} ${y1}H${x+(x>o.x0?3:-3)}M${o.x0} ${y2}H${x+(x>o.x0?3:-3)}"/>`;
  s+=`<path class="g-thin" d="M${x} ${y1+6}V${y2-6}"/>`+a((y1+y2)/2,y1)+a((y1+y2)/2,y2);
  const w=tw(t),cy=(y1+y2)/2;
  const tr=`transform="rotate(-90 ${x-4.5} ${cy})"`;
  if(o.ted)s+=`<rect class="g-fcf" x="${x-4.5-w/2-3}" y="${cy-10}" width="${w+6}" height="13" ${tr}/>`;
  return s+`<text class="g-t" x="${x-4.5}" y="${cy}" text-anchor="middle" ${tr}>${esc(t)}</text>`;
}
// データム記号：三角形の底辺の中点 (x,y)、枠は dir 方向（'d' 下,'u' 上,'l' 左,'r' 右）に出す
function datG(L,x,y,dir='d',len=16){
  const v={d:[0,1],u:[0,-1],l:[-1,0],r:[1,0]}[dir],n=[-v[1],v[0]],tx=x+v[0]*7,ty=y+v[1]*7;
  const tri=`<path class="g-dat" d="M${x+n[0]*5} ${y+n[1]*5}L${x-n[0]*5} ${y-n[1]*5}L${tx} ${ty}Z"/>`;
  const bx=x+v[0]*(7+len),by=y+v[1]*(7+len),S=18,rx=bx-S/2+v[0]*S/2,ry=by-S/2+v[1]*S/2;
  return tri+`<path class="g-thin" style="stroke:var(--ink)" d="M${tx} ${ty}L${bx} ${by}"/><rect class="g-fcf" x="${rx}" y="${ry}" width="${S}" height="${S}"/><text class="g-tb" x="${rx+S/2}" y="${ry+S/2+4.2}" text-anchor="middle">${L}</text>`;
}

// ===== 問題用の図 =====
const FIG={
 // 公差記入枠だけを大きく表示する。o={sym,tol,dats,labels:true（区画に番号をふる）}
 fcf(o){const sc=o.rows?1.3:1.5,f=fcfMulti(o,0,0),W=f.w*sc,x=(320-W)/2,y=16;
  let s=`<g transform="translate(${x} ${y}) scale(${sc})">${f.svg}</g>`;
  if(o.labels){const xs=[];let cx=0;const h=f.h;xs.push(cx+h/2);cx+=h;const t=txtG(o.tol,0,0);const w1=Math.max(30,t.w+12);xs.push(cx+w1/2);cx+=w1;
    for(const d of o.dats||[]){const w=Math.max(22,txtG(d,0,0).w+12);xs.push(cx+w/2);cx+=w;}
    s+=xs.map((v,i)=>`<text class="g-tr" x="${x+v*sc}" y="${y+f.h*sc+16}" text-anchor="middle">${'①②③④⑤'[i]}</text>`).join('');}
  return{svg:s,vb:`0 0 320 ${Math.round(f.h*sc+(o.labels?46:32))}`,cap:o.cap||'公差記入枠'};},

 // 板の穴の位置度：正面図（データム B・C は側面）と右側面図（データム A は裏面）
 // o={d:'φ10', tol:'+0.2/0', fcf:{sym,tol,dats}, tx, ty（理論的に正確な寸法）, n:穴の数(1|2)}
 plate(o){
  const X0=46,Y0=60,W=150,H=100,sx=X0+W+40,T=14,tx=o.tx||40,ty=o.ty||30,S=W/100;
  const hx=X0+tx*S,hy=Y0+H-ty*S,r=o.r||9;
  let s=`<rect class="g-objf" x="${X0}" y="${Y0}" width="${W}" height="${H}"/>`;
  s+=`<circle class="g-obj" cx="${hx}" cy="${hy}" r="${r}"/><path class="g-ctr" d="M${hx-r-6} ${hy}H${hx+r+6}M${hx} ${hy-r-6}V${hy+r+6}"/>`;
  // 側面図
  s+=`<rect class="g-objf" x="${sx}" y="${Y0}" width="${T}" height="${H}"/><path class="g-hid" d="M${sx} ${hy-r}H${sx+T}M${sx} ${hy+r}H${sx+T}"/><path class="g-ctr" d="M${sx-5} ${hy}H${sx+T+5}"/>`;
  // 理論的に正確な寸法（データム C：左端面から x、データム B：下端面から y）
  s+=dimH(X0,hx,Y0+H+18,o.pm?`${tx}±${o.pm}`:String(tx),{y0:Y0+H,ted:!o.pm});
  s+=dimV(hy,Y0+H,X0-16,o.pm?`${ty}±${o.pm}`:String(ty),{x0:X0,ted:!o.pm});
  // データム記号
  s+=datG(o.dB||'B',X0+W*0.78,Y0+H,'d',10);s+=datG(o.dC||'C',X0,Y0+H*0.28,'l',8);s+=datG(o.dA||'A',sx+T,Y0+H*0.8,'r',8);
  // 穴の寸法と公差記入枠
  const fx=hx+26,fy=14,lab=`${o.n>1?o.n+'×':''}${o.d||'φ10'} ${o.tol||'+0.2/0'}`;
  s+=`<text class="g-t" x="${fx}" y="${fy}">${esc(lab)}</text>`;
  if(o.nofcf)s+=`<path class="g-thin" style="stroke:var(--ink)" d="M${fx-2} ${fy+4}L${fx-8} ${fy+4}"/>`+arrowG(fx-8,fy+4,hx+r*0.72,hy-r*0.72);
  else{const f=fcfG(o.fcf||{sym:'pos',tol:'φ0.2',dats:['A','B','C']},fx,fy+5);s+=f.svg+leadG(fx,fy+16,fx-8,fy+16,hx+r*0.72,hy-r*0.72);}
  return{svg:s,vb:`0 0 320 ${Y0+H+46}`,cap:o.cap||'板の穴の位置度（左：正面図、右：右側面図）'};},

 // 直方体：データム A は下面。o={face:'top'|'side', fcf, zone:true（公差域を表示）, flat:false}
 block(o){
  const X0=o.face==='side'?34:60,Y0=40,W=o.face==='side'?150:170,H=70;let s=`<rect class="g-objf" x="${X0}" y="${Y0}" width="${W}" height="${H}"/>`;
  const f=o.fcf||{sym:'par',tol:'0.05',dats:['A']},hasA=(f.dats||[]).length||o.datum;
  if(hasA)s+=datG('A',X0+W*0.3,Y0+H,'d',10);
  if(o.nofcf){const ax=o.face==='side';s+=ax?`<text class="g-tr" x="${X0+W+8}" y="${Y0+H*0.4+4}">◀ この面</text>`:`<text class="g-tr" x="${X0+W*0.45}" y="${Y0-10}" text-anchor="middle">▼ この面</text>`;}
  else if(o.face==='side'){const F=fcfG(f,X0+W+12,Y0-32);s+=F.svg+leadG(X0+W+22,Y0-10,X0+W+22,Y0+H*0.4,X0+W,Y0+H*0.4);
    if(o.zone){const t=6;s+=`<rect class="g-zone" x="${X0+W-t}" y="${Y0}" width="${t}" height="${H}"/><text class="g-tr" x="${X0+W+6}" y="${Y0+H-4}">t</text>`;}}
  else{const F=fcfG(f,X0+W*0.55,Y0-28);s+=F.svg+leadG(X0+W*0.55,Y0-17,X0+W*0.45,Y0-17,X0+W*0.45,Y0);
    if(o.zone){const t=6;s+=`<rect class="g-zone" x="${X0}" y="${Y0}" width="${W}" height="${t}"/><text class="g-tr" x="${X0-12}" y="${Y0+6}">t</text>`;}}
  return{svg:s,vb:'0 0 320 150',cap:o.cap||'直方体の部品（データム A は下面）'};},

 // 段付き軸：左の大径部の軸線がデータム A、右の小径部に公差を指示。o={fcf, onAxis:true（矢印を寸法線の延長上に置く）, dl:'φ40', dr:'φ20'}
 shaft(o){
  const y=78,L1=[24,140],L2=[140,250],R1=34,R2=20;let s='';
  s+=`<rect class="g-objf" x="${L1[0]}" y="${y-R1}" width="${L1[1]-L1[0]}" height="${R1*2}"/><rect class="g-objf" x="${L2[0]}" y="${y-R2}" width="${L2[1]-L2[0]}" height="${R2*2}"/>`;
  s+=`<path class="g-ctr" d="M${L1[0]-10} ${y}H${L2[1]+12}"/>`;
  // 直径の寸法線（データム A は寸法線の延長上＝軸線）
  const dx1=70;s+=`<path class="g-thin" d="M${dx1} ${y-R1}V${y+R1}"/>`+arrowG(dx1,y,dx1,y-R1,'g-arw',6,2.2)+arrowG(dx1,y,dx1,y+R1,'g-arw',6,2.2)+`<text class="g-t" x="${dx1-4}" y="${y-6}" text-anchor="end">${esc(o.dl||'φ40')}</text>`;
  s+=datG('A',dx1,y+R1,'d',8);
  const dx2=200;s+=`<path class="g-thin" d="M${dx2} ${y-R2}V${y+R2}"/>`+arrowG(dx2,y,dx2,y-R2,'g-arw',6,2.2)+arrowG(dx2,y,dx2,y+R2,'g-arw',6,2.2)+`<text class="g-t" x="${dx2+4}" y="${y+14}">${esc(o.dr||'φ20')}</text>`;
  if(o.nofcf)s+=`<text class="g-tr" x="${dx2}" y="${y-R2-10}" text-anchor="middle">▼ この形体</text>`;
  else{const f=o.fcf||{sym:'run',tol:'0.03',dats:['A']},F=fcfG(f,o.onAxis===false?176:150,10);s+=F.svg;
  const ax=o.onAxis===false?226:dx2;s+=arrowG(ax,32,ax,y-R2);}
  return{svg:s,vb:'0 0 320 150',cap:o.cap||'段付き軸（データム A は左の大径部の軸線）'};},

 // 両端の軸受部 A・B（共通データム A-B）と、中央の大径部。o={nofcf, fcf, mark:'中央の外周'}
 shaft2(o){
  const y=76,J=17,M=32,xa=[26,92],xm=[92,214],xb=[214,282];let s='';
  s+=`<rect class="g-objf" x="${xa[0]}" y="${y-J}" width="${xa[1]-xa[0]}" height="${J*2}"/><rect class="g-objf" x="${xm[0]}" y="${y-M}" width="${xm[1]-xm[0]}" height="${M*2}"/><rect class="g-objf" x="${xb[0]}" y="${y-J}" width="${xb[1]-xb[0]}" height="${J*2}"/>`;
  s+=`<path class="g-ctr" d="M${xa[0]-10} ${y}H${xb[1]+10}"/>`;
  const dim=(x,R,t,d)=>`<path class="g-thin" d="M${x} ${y-R}V${y+R}"/>`+arrowG(x,y,x,y-R,'g-arw',6,2.2)+arrowG(x,y,x,y+R,'g-arw',6,2.2)+`<text class="g-t" x="${x+4}" y="${y-5}">${t}</text>`;
  s+=dim(52,J,'φ20')+datG('A',52,y+J,'d',8)+dim(248,J,'φ20')+datG('B',248,y+J,'d',8)+dim(170,M,'φ50');
  if(o.nofcf)s+=`<text class="g-tr" x="140" y="${y-M-10}" text-anchor="middle">▼ ${esc(o.mark||'この外周面')}</text>`;
  else{const F=fcfG(o.fcf||{sym:'run',tol:'0.03',dats:['A-B']},104,4);s+=F.svg+arrowG(130,26,130,y-M);}
  return{svg:s,vb:'0 0 320 140',cap:o.cap||'両端の軸受部 A・B で支える軸'};},
 // 溝付きのブロック（上から見た図）。データム A は外側の幅の中心平面。o={nofcf, fcf}
 slot(o){
  const X0=60,Y0=34,W=200,H=84,sw=40,cx=X0+W/2;let s='';
  s+=`<path class="g-objf" d="M${X0} ${Y0}H${cx-sw/2}V${Y0+48}H${cx+sw/2}V${Y0}H${X0+W}V${Y0+H}H${X0}Z"/><path class="g-ctr" d="M${cx} ${Y0-14}V${Y0+H+10}"/>`;
  // 外側の幅の寸法（データム A は寸法線の延長上）
  const yd=Y0+H+18;s+=`<path class="g-thin" d="M${X0} ${Y0+H}V${yd+3}M${X0+W} ${Y0+H}V${yd+3}M${X0+6} ${yd}H${X0+W-6}"/>`+arrowG(cx,yd,X0,yd,'g-arw',6,2.2)+arrowG(cx,yd,X0+W,yd,'g-arw',6,2.2)+`<text class="g-t" x="${cx+30}" y="${yd-4}">80</text>`;
  s+=datG('A',cx-40,yd,'d',6);
  const ys=Y0+24;s+=`<path class="g-thin" d="M${cx-sw/2+6} ${ys}H${cx+sw/2-6}"/>`+arrowG(cx,ys,cx-sw/2,ys,'g-arw',6,2.2)+arrowG(cx,ys,cx+sw/2,ys,'g-arw',6,2.2)+`<text class="g-t" x="${cx+sw/2+4}" y="${ys+4}">16</text>`;
  if(o.nofcf)s+=`<text class="g-tr" x="${cx}" y="${Y0-14}" text-anchor="middle">▼ 溝の中心平面</text>`;
  else{const F=fcfG(o.fcf||{sym:'sym',tol:'0.1',dats:['A']},cx-11,2);s+=F.svg+arrowG(cx,24,cx,ys-2);}
  return{svg:s,vb:'0 0 320 178',cap:o.cap||'溝付きのブロック（データム A は外側の幅 80 の中心平面）'};},
 // 曲面をもつ部品：理論的に正確な寸法で輪郭を定める。o={nofcf, fcf}
 curve(o){
  const X0=50,Y0=100,W=200;let s='';
  s+=`<path class="g-objf" d="M${X0} ${Y0}V60Q${X0+W/2} 4 ${X0+W} 60V${Y0}Z"/>`;
  s+=datG('B',X0+W*0.86,Y0,'d',24)+datG('C',X0,Y0-22,'l',8);
  s+=dimH(X0,X0+W,Y0+20,'100',{y0:Y0,ted:true});
  s+=`<text class="g-ts" x="${X0+W/2}" y="${Y0-14}" text-anchor="middle">R・高さは理論的に正確な寸法（省略）</text>`;
  if(o.nofcf)s+=`<text class="g-tr" x="${X0+W*0.5}" y="22" text-anchor="middle">▼ この曲面</text>`;
  else{const F=fcfG(o.fcf||{sym:'sprof',tol:'0.2',dats:['A','B','C']},X0+W*0.55,0);s+=F.svg+arrowG(X0+W*0.6,22,X0+W*0.6,34);}
  return{svg:s,vb:'0 0 320 156',cap:o.cap||'曲面をもつ部品（データム A は裏面、B は下面、C は左面）'};},
 // 4つの穴のパターン（データム A は裏面、B は下面、C は左面）。o={fcf（rows・composite も可）, nofcf}
 pattern(o){
  const X0=44,Y0=o.nofcf?34:(o.fcf&&o.fcf.rows?82:62),S=1.25,W=160*S,H=100*S,r=7;let s=`<rect class="g-objf" x="${X0}" y="${Y0}" width="${W}" height="${H}"/>`;
  const P=[[30,25],[130,25],[30,75],[130,75]].map(([x,y])=>[X0+x*S,Y0+H-y*S]);
  P.forEach(([x,y])=>{s+=`<circle class="g-obj" cx="${x}" cy="${y}" r="${r}"/><path class="g-ctr" d="M${x-r-5} ${y}H${x+r+5}M${x} ${y-r-5}V${y+r+5}"/>`;});
  // 理論的に正確な寸法（左端・下端から、穴どうしの間隔）
  const TD=!o.noted;
  s+=dimH(X0,P[0][0],Y0+H+16,'30',{y0:Y0+H,ted:TD})+dimH(P[0][0],P[1][0],Y0+H+16,'100',{y0:Y0+H,ted:TD});
  s+=dimV(P[0][1],Y0+H,X0-14,'25',{x0:X0,ted:TD})+dimV(P[2][1],P[0][1],X0-14,'50',{x0:X0,ted:TD});
  s+=datG('B',X0+W*0.8,Y0+H,'d',30)+datG('C',X0,Y0+H*0.12,'l',4);
  s+=`<text class="g-ts" x="${X0+W+8}" y="${Y0+H-4}">A：裏面</text>`;
  const fx=X0+W*0.55,fy=14;s+=`<text class="g-t" x="${fx}" y="${fy}">4×φ8 +0.1/0</text>`;
  if(o.nofcf)s+=arrowG(fx-4,fy-4,P[3][0]+r*0.7,P[3][1]-r*0.7);
  else{const F=fcfMulti(o.fcf||{sym:'pos',tol:'φ0.2(M)',dats:['A','B','C']},fx,fy+5);s+=F.svg+`<path class="g-thin" style="stroke:var(--ink)" d="M${fx} ${fy+16}H${fx-10}"/>`+arrowG(fx-10,fy+16,P[3][0]+r*0.7,P[3][1]-r*0.7);}
  return{svg:s,vb:`0 0 320 ${Y0+H+66}`,cap:o.cap||'4つの穴をもつ板（データム A は裏面、B は下面、C は左面）'};},
 // 測定値の並び（判定問題用）。o={vals:[], band:[下,上]（答え合わせで重ねる公差域）, base:0 の線の名前, unit}
 readings(o){
  const v=o.vals,n=v.length,X0=40,X1=300,yc=82,mx=Math.max(...v.map(Math.abs),o.band?Math.max(...o.band.map(Math.abs)):0)*1.25||0.05,Y=x=>yc-x/mx*58,X=i=>X0+(i+0.5)*(X1-X0)/n;
  let s=`<path class="f-axis" d="M${X0} ${yc}H${X1}"/><text class="g-ts" x="${X0-4}" y="${yc+3}" text-anchor="end">0</text>`;
  if(o.base)s+=`<text class="g-ts" x="${X1}" y="${yc+12}" text-anchor="end">${esc(o.base)}</text>`;
  if(o.band){const [lo,hi]=o.band;s+=`<rect class="g-zone" x="${X0}" y="${Y(hi)}" width="${X1-X0}" height="${Y(lo)-Y(hi)}"/><text class="g-tr" x="${X0+2}" y="${Y(hi)-3}">上限 ${(hi>=0?'+':'')+(+hi).toFixed(3)}</text><text class="g-tr" x="${X0+2}" y="${Y(lo)+11}">下限 ${(lo>=0?'+':'')+(+lo).toFixed(3)}</text>`;}
  s+=`<polyline class="f-line thin" points="${v.map((x,i)=>`${X(i)},${Y(x)}`).join(' ')}"/>`;
  v.forEach((x,i)=>{const out=o.band&&(x<o.band[0]-1e-9||x>o.band[1]+1e-9);s+=`<circle cx="${X(i)}" cy="${Y(x)}" r="3.6" style="fill:var(--${out?'ucl':'pri'})"/><text class="g-ts" x="${X(i)}" y="${Y(x)+(x>=0?-8:15)}" text-anchor="middle">${(x>=0?'+':'')+x.toFixed(3)}</text>`;});
  return{svg:s,vb:'0 0 320 164',cap:o.cap||'測定した値'};},
 // 振れの指示値を、データム軸線のまわりに極座標で描く（判定問題用）。o={vals:[]（等間隔）, band:[下,上]}
 polar(o){
  const v=o.vals,n=v.length,C=[160,84],R0=46,mx=Math.max(...v.map(Math.abs),o.band?Math.max(...o.band.map(Math.abs)):0)*1.3||0.05,K=26/mx,P=(x,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R0+x*K;return[C[0]+r*Math.cos(a),C[1]+r*Math.sin(a)];};
  let s=`<circle class="g-ctr" cx="${C[0]}" cy="${C[1]}" r="${R0}" style="fill:none"/><path class="g-ctr" d="M${C[0]-80} ${C[1]}H${C[0]+80}M${C[0]} ${C[1]-80}V${C[1]+80}"/>`;
  if(o.band){const [lo,hi]=o.band;s+=`<path class="g-zone" fill-rule="evenodd" d="M${C[0]+R0+hi*K} ${C[1]}A${R0+hi*K} ${R0+hi*K} 0 1 0 ${C[0]-R0-hi*K} ${C[1]}A${R0+hi*K} ${R0+hi*K} 0 1 0 ${C[0]+R0+hi*K} ${C[1]}ZM${C[0]+R0+lo*K} ${C[1]}A${R0+lo*K} ${R0+lo*K} 0 1 1 ${C[0]-R0-lo*K} ${C[1]}A${R0+lo*K} ${R0+lo*K} 0 1 1 ${C[0]+R0+lo*K} ${C[1]}Z"/>`;}
  s+=`<polygon class="f-line thin" points="${v.map((x,i)=>P(x,i).join(',')).join(' ')}" style="fill:none"/>`;
  v.forEach((x,i)=>{const [px,py]=P(x,i),out=o.band&&(x<o.band[0]-1e-9||x>o.band[1]+1e-9),[tx,ty]=P(x+mx*0.55,i);s+=`<circle cx="${px}" cy="${py}" r="3.4" style="fill:var(--${out?'ucl':'pri'})"/><text class="g-ts" x="${tx}" y="${ty+3}" text-anchor="middle">${(x>=0?'+':'')+x.toFixed(3)}</text>`;});
  s+=`<text class="g-ts" x="${C[0]}" y="${C[1]+4}" text-anchor="middle">データム軸線</text>`;
  return{svg:s,vb:'0 0 320 170',cap:o.cap||'1回転の指示値（外側ほど大きい。ずれは誇張）'};},
 // 検査成績書（測定結果の表）。o={cols:[見出し], w:[列幅], rows:[[セル]], mark:[強調する行の番号], cap}
 report(o){
  const W=o.w||[24,88,96,70,34],X0=(320-W.reduce((a,b)=>a+b,0))/2,RH=19,HH=20;let s='',y=6;
  const row=(cells,yy,h,head)=>{let x=X0;cells.forEach((c,i)=>{s+=`<rect class="g-fcf" x="${x}" y="${yy}" width="${W[i]}" height="${h}"${head?' style="fill:var(--surf2)"':''}/>`;
    const t=txtG(c,0,0);const tx=i===0||String(c).length<=3?x+(W[i]-t.w)/2:x+4;s+=txtG(c,tx,yy+h/2+4,head?'g-tb':'g-t').svg;x+=W[i];});};
  row(o.cols,y,HH,true);y+=HH;
  o.rows.forEach((r,i)=>{if((o.mark||[]).includes(i))s+=`<rect x="${X0}" y="${y}" width="${W.reduce((a,b)=>a+b,0)}" height="${RH}" style="fill:var(--accent-soft)"/>`;row(r,y,RH);y+=RH;});
  return{svg:s,vb:`0 0 320 ${y+8}`,cap:o.cap||'検査成績書（抜粋）'};},
 // 指示線の位置の比較：ア＝寸法線の延長上、イ＝寸法線からずらす
 leader(o){
  const one=(x0,lab,onAx,tol)=>{const y=74,R=24,w=96;let s=`<rect class="g-objf" x="${x0}" y="${y-R}" width="${w}" height="${R*2}"/><path class="g-ctr" d="M${x0-6} ${y}H${x0+w+6}"/>`;
    const dx=x0+60;s+=`<path class="g-thin" d="M${dx} ${y-R}V${y+R}"/>`+arrowG(dx,y,dx,y-R,'g-arw',6,2.2)+arrowG(dx,y,dx,y+R,'g-arw',6,2.2)+`<text class="g-t" x="${dx+4}" y="${y+16}">φ20</text>`;
    const ax=onAx?dx:x0+28,F=fcfG({sym:o.sym||'str',tol},ax-30,10);s+=F.svg+arrowG(ax,32,ax,y-R)+`<text class="g-tr" x="${x0+w/2}" y="${y+R+20}" text-anchor="middle">${lab}</text>`;return s;};
  return{svg:one(24,'ア',true,o.tolA||'φ0.02')+one(180,'イ',false,o.tolB||'0.02'),vb:'0 0 320 128',cap:o.cap||'指示線の矢印の位置（ア：寸法線の延長上、イ：寸法線からずらす）'};},

 // 位置度の判定：真位置（十字）と測定した穴の中心（点）、公差域（円）
 pos(o){
  const C=[110,80],dx=o.dx!=null?o.dx:0.03,dy=o.dy!=null?o.dy:0.04,t=o.t,S=o.scale||Math.min(900,60/Math.max(Math.abs(dx),Math.abs(dy),t?t/2:0));
  let s=`<path class="g-ctr" d="M${C[0]-70} ${C[1]}H${C[0]+70}M${C[0]} ${C[1]-66}V${C[1]+66}"/>`;
  if(t)s+=`<circle class="g-zone" cx="${C[0]}" cy="${C[1]}" r="${t/2*S}"/>`;
  const px=C[0]+dx*S,py=C[1]-dy*S;s+=`<path class="g-act" d="M${C[0]} ${C[1]}L${px} ${py}"/><circle class="g-dot" cx="${px}" cy="${py}" r="3.4"/>`;
  s+=`<text class="g-t" x="${C[0]+4}" y="${C[1]+14}">真位置</text><text class="g-t" x="${px+6}" y="${py-6}">測定した中心</text>`;
  s+=`<text class="g-ts" x="200" y="112">Δx＝${o.lx||dx}</text><text class="g-ts" x="200" y="128">Δy＝${o.ly||dy}</text>${t?`<text class="g-ts" x="200" y="144">公差域：直径 ${o.lt||t} の円</text>`:''}`;
  return{svg:s,vb:'0 0 320 160',cap:o.cap||(t?'位置度の公差域（円）と、測定した穴の中心':'真位置と、測定した穴の中心（図の縮尺は誇張）')};},

 // 動的公差線図（最大実体公差方式）：横軸は実寸法、縦軸は許される幾何公差
 dyn(o){
  const mms=o.mms,lms=o.lms,t=o.t,hole=lms>mms,X0=52,X1=286,Y0=128,Y1=18;
  const span=Math.abs(lms-mms),tmax=t+span,X=v=>X0+Math.abs(v-mms)/span*(X1-X0),Y=v=>Y0-v/tmax*(Y0-Y1);
  let s=`<path class="f-axis" d="M${X0} ${Y0}H${X1+10}M${X0} ${Y0}V${Y1-6}"/>`;
  s+=`<path class="g-zone" d="M${X(mms)} ${Y0}L${X(mms)} ${Y(t)}L${X(lms)} ${Y(tmax)}L${X(lms)} ${Y0}Z"/>`;
  s+=`<text class="g-ts" x="${X(mms)}" y="${Y0+13}" text-anchor="middle">${o.lmms||mms}（MMS）</text><text class="g-ts" x="${X(lms)}" y="${Y0+13}" text-anchor="middle">${o.llms||lms}（LMS）</text>`;
  s+=`<text class="g-ts" x="${X0-4}" y="${Y(t)+3}" text-anchor="end">${o.lt||t}</text><text class="g-ts" x="${X0-4}" y="${Y(tmax)+3}" text-anchor="end">${o.ltmax||+tmax.toFixed(3)}</text>`;
  if(o.act!=null){const a=o.act,ya=Y(t+Math.abs(a-mms));s+=`<path class="g-hid" d="M${X(a)} ${Y0}V${ya}H${X0}"/><circle class="g-dot" cx="${X(a)}" cy="${ya}" r="3.4"/><text class="g-t" x="${X(a)+5}" y="${ya-6}">実寸法 ${o.lact||a}</text>`;}
  s+=`<text class="g-ts" x="${X1}" y="${Y0+26}" text-anchor="end">${hole?'穴の実寸法 →':'軸の実寸法 →'}</text><text class="g-ts" x="${X0+4}" y="${Y1-8}">許される幾何公差</text>`;
  return{svg:s,vb:'0 0 320 160',cap:o.cap||'動的公差線図（塗りの範囲なら合格）'};},

 // 公差域の形の図（解説用）。o={k:'flat'|'round'|'cylax'|'par'|'run'}
 zone(o){
  let s='',cap='';
  if(o.k==='flat'){const p=(y)=>`M40 ${y}L200 ${y}L280 ${y-40}L120 ${y-40}Z`;
    s=`<path class="g-zl" d="${p(118)}"/><path class="g-zl" d="${p(98)}"/><path class="g-act" d="M44 108C90 100 140 116 190 104S250 74 270 70"/><path class="g-thin" d="M298 98V118"/><text class="g-tr" x="303" y="112">t</text>`;cap='平面度の公差域：距離 t だけ離れた平行な2平面のあいだ';}
  if(o.k==='round'){s=`<circle class="g-zl" cx="110" cy="80" r="56"/><circle class="g-zl" cx="110" cy="80" r="46"/><path class="g-act" d="M110 29C140 30 160 52 161 76S148 128 112 131S58 112 58 80S80 31 110 29Z"/><path class="g-thin" d="M156 80H166"/><text class="g-tr" x="172" y="84">t（半径の差）</text>`;cap='真円度の公差域：同じ断面で、半径の差が t の同心の2円のあいだ';}
  if(o.k==='cylax'){s=`<ellipse class="g-zl" cx="60" cy="80" rx="8" ry="22"/><ellipse class="g-zl" cx="260" cy="80" rx="8" ry="22"/><path class="g-zl" d="M60 58H260M60 102H260"/><path class="g-act" d="M60 84C110 70 170 92 260 76"/><path class="g-ctr" d="M40 80H280"/><text class="g-tr" x="270" y="56">φt</text>`;cap='軸線の真直度（φ付き）の公差域：直径 t の円筒の中';}
  if(o.k==='par'){s=`<path class="g-objf" d="M40 130H280V140H40Z"/><text class="g-tb" x="44" y="156">A</text><path class="g-zl" d="M40 50H280M40 74H280"/><path class="g-act" d="M40 64C100 56 160 70 220 58S270 66 280 60"/><path class="g-thin" d="M290 50V74"/><text class="g-tr" x="295" y="66">t</text>`;cap='平行度（面）の公差域：データム A に平行で、距離 t の2平面のあいだ';}
  if(o.k==='run'){s=`<circle class="g-zl" cx="110" cy="80" r="52"/><circle class="g-zl" cx="110" cy="80" r="44"/><path class="g-act" d="M110 30C140 31 162 52 160 80S140 126 110 127S60 108 61 80S82 30 110 30Z"/><path class="g-ctr" d="M50 80H170M110 20V140"/><text class="g-ts" x="113" y="92">データム軸線</text><text class="g-tr" x="168" y="54">t</text>`;cap='円周振れの公差域：データム軸線に直角な各断面で、データム軸線を中心とする半径の差 t の2円のあいだ';}
  return{svg:s,vb:'0 0 320 162',cap};}
};
// 解説の図：問題文・解説の言葉から図を1つ選ぶ（問題に図の指定があるときはそちらを使う）
const FIGRULES=[['flat',/平面度の公差域|2平面のあいだ|平面度/],['round',/真円度/],['run',/円周振れ/],['par',/平行度/],['cylax',/軸線の真直度/]];
function figFor(text){for(const [k,re] of FIGRULES)if(re.test(text))return figHTML(FIG.zone({k}));return '';}
function figHTML(f,q){return `<figure class="qfig${q?' q':''}"><svg viewBox="${f.vb||'0 0 320 156'}" role="img" aria-label="${esc(f.cap)}">${f.svg}</svg><figcaption>${esc(f.cap)}</figcaption></figure>`;}
function figQ(spec){try{const f=FIG[spec[0]](spec[1]||{});return figHTML(f,true);}catch(e){return '';}}
