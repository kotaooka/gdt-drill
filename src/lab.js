// ===== 動く図（資料タブ）：スライダーで値を動かし、公差域と合否の変化を確かめる教材 =====
// 各教材は {k, h, intro, ctrls:[{id,label,min,max,step,fmt}], modes?, draw(state)→{svg,vb,out}} で定義する。
// スライダーを動かしても入力欄は作り直さず、図と結果の欄だけを書き換える（ドラッグが途切れないように）。
const LAB={
 mmc:{mode:'M',d:10.10,r:0.07,ang:40},
 sq:{dx:0.04,dy:0.035},
 st:{ta:0.10,tb:0.05,tc:0.05,tp:0.10},
};
const LABS=[
 {k:'mmc',h:'最大実体公差方式（Ⓜ）とゼロ幾何公差',
  intro:'穴 φ10 +0.2/0 に位置度 φ0.1 を指示した場合（ゼロ幾何公差では φ9.9 +0.3/0、位置度 φ0 Ⓜ）。穴の実寸法と中心のずれを動かして、許される位置度と合否を確かめる。',
  modes:[['RFS','Ⓜ なし'],['M','Ⓜ あり'],['Z','ゼロ幾何公差']],
  ctrls:[{id:'d',label:'穴の実寸法',min:9.90,max:10.20,step:0.01,fmt:v=>'φ'+v.toFixed(2)},{id:'r',label:'中心のずれ（真位置からの距離）',min:0,max:0.18,step:0.005,fmt:v=>v.toFixed(3)+' mm'},{id:'ang',label:'ずれの向き',min:0,max:350,step:10,fmt:v=>v+'°'}],
  draw(st){
   const Z=st.mode==='Z',mms=Z?9.9:10.0,lms=10.2,t=Z?0:0.1,d=Math.max(mms,Math.min(lms,st.d)),inSize=st.d>=mms-1e-9&&st.d<=lms+1e-9;
   const bonus=st.mode==='RFS'?0:Math.max(0,d-mms),allow=+(t+bonus).toFixed(3),dev=+(2*st.r).toFixed(3),posOK=dev<=allow+1e-9;
   // 左：動的公差線図
   const X0=30,X1=170,Y0=150,Y1=26,span=lms-mms,tmax=t+span,X=v=>X0+(v-mms)/span*(X1-X0),Y=v=>Y0-v/(tmax||0.3)*(Y0-Y1);
   let s=`<path class="f-axis" d="M${X0} ${Y0}H${X1+6}M${X0} ${Y0}V${Y1-8}"/>`;
   s+=st.mode==='RFS'?`<path class="g-zone" d="M${X0} ${Y0}V${Y(t)}H${X1}V${Y0}Z"/>`:`<path class="g-zone" d="M${X0} ${Y0}V${Y(t)}L${X1} ${Y(tmax)}V${Y0}Z"/>`;
   if(inSize){const yy=Y(allow);s+=`<path class="g-hid" d="M${X(d)} ${Y0}V${yy}H${X0}"/><circle class="g-dot" cx="${X(d)}" cy="${yy}" r="3.5"/>`;}
   s+=`<circle cx="${X(d)}" cy="${Y(dev)}" r="4" style="fill:${posOK&&inSize?'var(--ok)':'var(--ucl)'}"/><text class="g-ts" x="${X(d)+6}" y="${Y(dev)+4}">偏差</text>`;
   if(inSize)s+=`<text class="g-ts" x="${X(d)-6}" y="${Y(allow)-5}" text-anchor="end">許容</text>`;
   s+=`<text class="g-ts" x="${X0}" y="${Y0+13}" text-anchor="middle">${mms.toFixed(1)}</text><text class="g-ts" x="${X1}" y="${Y0+13}" text-anchor="middle">${lms.toFixed(1)}</text><text class="g-ts" x="${(X0+X1)/2}" y="${Y0+26}" text-anchor="middle">穴の実寸法</text><text class="g-ts" x="${X0+4}" y="${Y1-10}">許される位置度</text>`;
   // 右：上から見た公差域（円）と穴の中心
   const C=[250,90],S=300,a=st.ang*Math.PI/180,px=C[0]+st.r*S*Math.cos(a),py=C[1]-st.r*S*Math.sin(a);
   s+=`<path class="g-ctr" d="M${C[0]-62} ${C[1]}H${C[0]+62}M${C[0]} ${C[1]-62}V${C[1]+62}"/>`;
   if(t>0)s+=`<circle class="g-zl" cx="${C[0]}" cy="${C[1]}" r="${t/2*S}"/>`;
   s+=`<circle class="g-zone" cx="${C[0]}" cy="${C[1]}" r="${Math.max(0.6,allow/2*S)}"/><circle cx="${px}" cy="${py}" r="4" style="fill:${posOK&&inSize?'var(--ok)':'var(--ucl)'}"/>`;
   s+=`<text class="g-ts" x="${C[0]}" y="${C[1]+78}" text-anchor="middle">上から見た公差域</text>`;
   const out=`<div class="labout"><div><span class="lbl">許される位置度</span><b>φ${allow.toFixed(3)}</b><span class="note">${st.mode==='RFS'?'Ⓜ なしなので実寸法によらない':`図面の値 φ${t} ＋ ボーナス ${bonus.toFixed(3)}`}</span></div>
     <div><span class="lbl">位置度の偏差</span><b>φ${dev.toFixed(3)}</b><span class="note">ずれ ${st.r.toFixed(3)} の2倍</span></div>
     <div><span class="lbl">判定</span><b style="color:var(--${posOK&&inSize?'ok':'ucl'})">${!inSize?'サイズで不合格':posOK?'合格':'位置度で不合格'}</b><span class="note">${!inSize?`穴の実寸法が φ${mms.toFixed(1)}〜φ${lms.toFixed(1)} の外`:`実効寸法 φ${(mms-t).toFixed(2)}`}</span></div></div>`;
   return{svg:s,vb:'0 0 320 180',out};}},
 {k:'sq',h:'位置度の円と、座標の ± の正方形',
  intro:'位置度 φ0.1（円の公差域）と、x・y それぞれ ±0.05 の座標公差（正方形）を比べる。中心のずれを動かして、判定が分かれる場所を確かめる。',
  ctrls:[{id:'dx',label:'Δx',min:-0.075,max:0.075,step:0.0025,fmt:v=>(v>=0?'+':'')+v.toFixed(4)},{id:'dy',label:'Δy',min:-0.075,max:0.075,step:0.0025,fmt:v=>(v>=0?'+':'')+v.toFixed(4)}],
  draw(st){
   const C=[160,92],S=900,t=0.1,dev=2*Math.hypot(st.dx,st.dy),cOK=dev<=t+1e-9,sOK=Math.abs(st.dx)<=t/2+1e-9&&Math.abs(st.dy)<=t/2+1e-9;
   let s=`<rect class="g-zl" x="${C[0]-t/2*S}" y="${C[1]-t/2*S}" width="${t*S}" height="${t*S}" style="stroke:var(--accent)"/><circle class="g-zone" cx="${C[0]}" cy="${C[1]}" r="${t/2*S}"/>`;
   s+=`<path class="g-ctr" d="M${C[0]-80} ${C[1]}H${C[0]+80}M${C[0]} ${C[1]-80}V${C[1]+80}"/>`;
   const px=C[0]+st.dx*S,py=C[1]-st.dy*S;s+=`<path class="g-act" d="M${C[0]} ${C[1]}L${px} ${py}"/><circle cx="${px}" cy="${py}" r="4.5" style="fill:var(--${cOK?'ok':'ucl'})"/>`;
   s+=`<text class="g-ts" x="${C[0]+t/2*S+4}" y="${C[1]-t/2*S+10}" style="fill:var(--accent)">±0.05 の正方形</text><text class="g-tr" x="${C[0]-t/2*S-4}" y="${C[1]+t/2*S+14}" text-anchor="end">φ0.1 の円</text>`;
   const out=`<div class="labout"><div><span class="lbl">位置度の偏差</span><b>φ${dev.toFixed(4)}</b><span class="note">2√(Δx²＋Δy²)</span></div>
     <div><span class="lbl">位置度 φ0.1（円）</span><b style="color:var(--${cOK?'ok':'ucl'})">${cOK?'合格':'不合格'}</b></div>
     <div><span class="lbl">座標 ±0.05（正方形）</span><b style="color:var(--${sOK?'ok':'ucl'})">${sOK?'合格':'不合格'}</b>${cOK!==sOK?`<span class="note" style="color:var(--ucl)">判定が分かれる位置（${sOK?'正方形の隅：円では不合格':'円の中だが正方形の外'}）</span>`:''}</div></div>`;
   return{svg:s,vb:'0 0 320 184',out};}},
 {k:'st',h:'公差の積み上げ：最悪値法と RSS',
  intro:'すき間 G＝A−B−C に、穴の位置度 φt（1方向に ±t/2）が加わる場合。各公差を動かして、最悪値法と二乗和平方根（RSS）の差を確かめる。',
  ctrls:[{id:'ta',label:'A の公差 ±',min:0.01,max:0.2,step:0.01,fmt:v=>'±'+v.toFixed(2)},{id:'tb',label:'B の公差 ±',min:0.01,max:0.2,step:0.01,fmt:v=>'±'+v.toFixed(2)},{id:'tc',label:'C の公差 ±',min:0.01,max:0.2,step:0.01,fmt:v=>'±'+v.toFixed(2)},{id:'tp',label:'位置度 φt',min:0,max:0.3,step:0.01,fmt:v=>'φ'+v.toFixed(2)}],
  draw(st){
   const parts=[['A',st.ta],['B',st.tb],['C',st.tc],['位置度',st.tp/2]],W=parts.reduce((a,x)=>a+x[1],0),R=Math.sqrt(parts.reduce((a,x)=>a+x[1]*x[1],0)),Xs=230/0.7;
   let s='',x=70;
   s+=`<text class="g-t" x="4" y="40">最悪値法</text>`;parts.forEach(([n,v],i)=>{const w=v*Xs;s+=`<rect x="${x}" y="28" width="${w}" height="18" style="fill:var(--accent);opacity:${0.35+0.15*i};stroke:var(--card)"/>`;x+=w;});
   s+=`<text class="g-tb" x="${x+4}" y="42">±${W.toFixed(3)}</text>`;
   s+=`<text class="g-t" x="4" y="84">RSS</text><rect x="70" y="72" width="${R*Xs}" height="18" style="fill:var(--ok);opacity:.6"/><text class="g-tb" x="${70+R*Xs+4}" y="86">±${R.toFixed(3)}</text>`;
   s+=`<text class="g-ts" x="70" y="120">濃さの違う帯：A・B・C・位置度（t/2）の順</text><text class="g-ts" x="70" y="136">RSS は最悪値法の ${(R/W*100).toFixed(0)}%</text>`;
   const out=`<div class="labout"><div><span class="lbl">最悪値法</span><b>±${W.toFixed(3)}</b><span class="note">全部が最悪の向きにそろった場合</span></div><div><span class="lbl">RSS</span><b>±${R.toFixed(3)}</b><span class="note">独立・正規分布が前提</span></div><div><span class="lbl">いちばん効いている要素</span><b>${parts.slice().sort((a,b)=>b[1]-a[1])[0][0]}</b><span class="note">RSS では大きい公差ほど強く効く</span></div></div>`;
   return{svg:s,vb:'0 0 320 146',out};}},
];
function labWidget(L){
 const st=LAB[L.k],r=L.draw(st);
 return `<section class="panel labw" id="lab-${L.k}"><h3>${esc(L.h)}</h3><p class="note">${esc(L.intro)}</p>
  ${L.modes?`<div class="seg" style="margin:6px 0 8px">${L.modes.map(([v,l])=>`<button data-labmode="${L.k}" data-val="${v}" aria-pressed="${st.mode===v}">${l}</button>`).join('')}</div>`:''}
  <div class="labfig" id="labfig-${L.k}"><figure class="qfig q"><svg viewBox="${r.vb}" role="img" aria-label="${esc(L.h)}">${r.svg}</svg></figure>${r.out}</div>
  ${L.ctrls.map(c=>`<label class="labc"><span>${esc(c.label)}<b id="labv-${L.k}-${c.id}">${c.fmt(st[c.id])}</b></span><input type="range" min="${c.min}" max="${c.max}" step="${c.step}" value="${st[c.id]}" data-lab="${L.k}" data-id="${c.id}"></label>`).join('')}
 </section>`;
}
function labHTML(){return `<h2>動く図</h2><p class="note" style="margin-top:0">スライダーを動かすと、図と判定がすぐに変わります。</p>${LABS.map(labWidget).join('')}`;}
function labRedraw(k){const L=LABS.find(x=>x.k===k);if(!L)return;const r=L.draw(LAB[k]),el=document.getElementById('labfig-'+k);
 if(el)el.innerHTML=`<figure class="qfig q"><svg viewBox="${r.vb}" role="img" aria-label="${esc(L.h)}">${r.svg}</svg></figure>${r.out}`;}
// 解説から開く教材：分類ごとに対応する教材
const LABFOR={mmc:'mmc',zero:'mmc',loc:'sq',stack:'st'};
