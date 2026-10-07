// ===== 計算問題ジェネレータ（数値は毎回ランダム） =====
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const fx=(v,d)=>{const s=(Math.round(v*10**d)/10**d).toFixed(d);return Number(s)===0?s.replace('-',''):s;};
const sq=Math.sqrt;
// 選択肢を作る：正解の大小順位（最小〜最大）を毎回ランダムに決め、その順位になるように誤答を選ぶ。
// 誤答は「よくある計算ミス」の候補を優先し、足りない側は正解から8〜50%ずらした近傍値で補う。
function mc(ans,wrong,fmt){
  const A=fmt(ans),set=new Set([A]);
  const dec=(String(A).match(/\.(\d+)/)||['',''])[1].length,step=10**-dec;
  const lo=[],hi=[];
  for(const w of wrong){if(w==null||!isFinite(w))continue;const s=fmt(w);if(set.has(s))continue;set.add(s);(w<ans?lo:hi).push([w,s]);}
  // 値域の推定：正解と誤答候補がすべて0〜1なら確率とみなし、近傍値も0〜1に収める
  const all=[ans,...lo.map(x=>x[0]),...hi.map(x=>x[0])];
  const prob=all.every(v=>v>=0&&v<=1),pos=ans>0;
  const near=(side,base=ans)=>{for(let t=0;t<40;t++){
      const d=0.08+Math.random()*0.42;let v=base*(1+side*d);
      if(Math.abs(v-ans)<step)v=ans+side*step*(1+Math.floor(Math.random()*3));
      if(prob&&v>=1)v=base+(1-base)*(0.2+Math.random()*0.7);if(pos&&v<=0)v=base*(0.2+Math.random()*0.6);
      if(Math.abs(v-ans)<step*0.5)continue;
      const s=fmt(v);if(!set.has(s)){set.add(s);return[v,s];}}
    return null;};
  const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  shuffle(lo);shuffle(hi);
  // 目標の順位 r：正解より小さい誤答の数（0〜3）
  const order=shuffle([0,1,2,3]);
  for(const r of order){
    const L=lo.slice(0,r),H=hi.slice(0,3-r);
    // 近傍値は外側へ連ねて作る（正解のまわりに誤答が集まり、真ん中の値が正解だと見抜かれるのを防ぐ）
    while(L.length<r){const b=Math.min(ans,...L.map(x=>x[0]));const x=near(-1,b);if(!x)break;L.push(x);}
    while(H.length<3-r){const b=Math.max(ans,...H.map(x=>x[0]));const x=near(1,b);if(!x)break;H.push(x);}
    if(L.length===r&&H.length===3-r)return[A,...L.map(x=>x[1]),...H.map(x=>x[1])];
  }
  // どの順位でも作れない場合（値域が狭いなど）は、作れたものから4つにする
  const out=[A,...lo.map(x=>x[1]),...hi.map(x=>x[1])];
  while(out.length<4){const x=near(out.length%2?1:-1)||near(1)||near(-1);if(!x)break;out.push(x[1]);}
  return out.slice(0,4);
}
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

// 0.001 mm 単位で丸める（浮動小数の誤差を出さない）
const r3=v=>Math.round(v*1000)/1000;
const mm=v=>fx(v,3);
// 合否つきの選択肢：[値, 公差] の組から「φ値 → 合格/不合格」の文を作る。重複は除き、足りなければ近傍値で補う
function verdictChoices(val,tol,alts){
  const s=(v,t)=>`位置度 φ${mm(v)}、許容 φ${mm(t)} → ${v<=t+1e-9?'合格':'不合格'}`;
  const out=[s(val,tol)],seen=new Set(out);
  const add=(v,t,flip)=>{let x=`位置度 φ${mm(v)}、許容 φ${mm(t)} → ${(v<=t+1e-9)!==!!flip?'合格':'不合格'}`;if(!seen.has(x)){seen.add(x);out.push(x);}};
  for(const [v,t,flip] of alts)add(v,t,flip);
  for(let k=1;out.length<4&&k<10;k++)add(r3(val*(1+0.1*k)),tol,false);
  return out.slice(0,4);
}
// 幾何特性ごとの短い説明（記号の識別の解説で使う）
const SYMX={str:'線や軸線のまっすぐさ',flat:'平面のたいらさ',circ:'横断面の丸さ',cyl:'円筒面全体の形（丸さ・まっすぐさ・テーパ）',lprof:'各断面での曲線の形',sprof:'曲面全体の形',par:'データムに対する平行の度合い',perp:'データムに対する直角の度合い',ang:'データムに対する理論的に正確な角度からの傾き',pos:'真位置からの位置のずれ',coax:'データム軸線（中心）に対する軸線（中心）のずれ',sym:'データム中心平面に対する中心平面のずれ',run:'データム軸線のまわりに1回転させたときの振れ',trun:'回転させながら表面全体で評価する振れ'};
const SYMC={str:'形状公差',flat:'形状公差',circ:'形状公差',cyl:'形状公差',par:'姿勢公差',perp:'姿勢公差',ang:'姿勢公差',pos:'位置公差',coax:'位置公差',sym:'位置公差',run:'振れ公差',trun:'振れ公差'};
const FORM=new Set(['str','flat','circ','cyl','lprof','sprof']);

const G = {
// 記号の識別（計算ではないので nocalc）
g_symid:{cat:'sym',nocalc:true,f(){
  const k=pick(Object.keys(SYMP)),others=shuf(Object.keys(SYMP).filter(x=>x!==k)).slice(0,3);
  const tol=k==='pos'||k==='coax'?'φ0.05':'0.05',dats=FORM.has(k)?[]:k==='pos'?['A','B']:['A'];
  return{q:'図の公差記入枠の記号が表す幾何特性はどれか。',fig:['fcf',{sym:k,tol,dats}],
  ch:[SYMN[k],...others.map(x=>SYMN[x])],
  ex:`この記号は${SYMN[k]}。${SYMX[k]}を規制する。${FORM.has(k)&&!['lprof','sprof'].includes(k)?'形状公差なので、データムを指示しない。':['lprof','sprof'].includes(k)?'データムを付けなければ形状公差、付ければ姿勢または位置の公差になる。':'データムに関連させて指示する。'}`};}},
// 記号の分類
g_symcls:{cat:'basic',nocalc:true,f(){
  const k=pick(Object.keys(SYMC)),c=SYMC[k],dats=FORM.has(k)?[]:k==='pos'?['A','B']:['A'];
  return{q:'図の公差記入枠の幾何特性は、どの種類の公差に分類されるか。',fig:['fcf',{sym:k,tol:k==='pos'||k==='coax'?'φ0.05':'0.05',dats}],
  ch:[c,...['形状公差','姿勢公差','位置公差','振れ公差'].filter(x=>x!==c)],
  ex:`記号は${SYMN[k]}で、${c}に分類する。形状公差（真直度・平面度・真円度・円筒度）はデータムを使わず、姿勢公差（平行度・直角度・傾斜度）・位置公差（位置度・同軸度・対称度）・振れ公差（円周振れ・全振れ）はデータムに関連させる。`};}},
// 位置度の偏差：2√(Δx²+Δy²)
g_posdev:{cat:'loc',f(){
  const dx=rnd(4,60)/1000*pick([1,-1]),dy=rnd(4,60)/1000*pick([1,-1]),v=r3(2*sq(dx*dx+dy*dy)),r=r3(sq(dx*dx+dy*dy));
  return{q:`穴の位置を測定したところ、真位置に対する穴の中心のずれは x 方向 ${mm(dx)} mm、y 方向 ${mm(dy)} mm だった。位置度の偏差（この穴の軸線を含む、真位置を中心とする円の最小の直径）はいくらか。`,
  fig:['pos',{dx,dy,lx:mm(dx),ly:mm(dy)}],
  ch:mc(v,[r,r3(2*(Math.abs(dx)+Math.abs(dy))),r3(Math.abs(dx)+Math.abs(dy)),r3(2*Math.max(Math.abs(dx),Math.abs(dy)))],mm),
  ex:`位置度の公差域は直径で表すので、中心のずれ（半径）を2倍する。√(${mm(dx)}²＋${mm(dy)}²)＝${fx(sq(dx*dx+dy*dy),4)}、2倍して φ${mm(v)}。半径のまま ${mm(r)} とするのは誤り。`};}},
// 位置度の合否（Ⓜ なし）
g_posjudge:{cat:'loc',f(){
  const t=pick([0.05,0.08,0.1,0.12,0.15,0.2]);let dx,dy,v;
  do{dx=rnd(5,Math.round(t*700))/1000;dy=rnd(5,Math.round(t*700))/1000;v=r3(2*sq(dx*dx+dy*dy));}while(Math.abs(v-t)<0.003||v<0.5*t||v>1.4*t);
  const r=r3(sq(dx*dx+dy*dy));
  return{q:`位置度 φ${t}（データム A・B・C、Ⓜ なし）を指示した穴を測定した。真位置に対する中心のずれは Δx＝${mm(dx)} mm、Δy＝${mm(dy)} mm だった。判定として正しいものはどれか。`,
  fig:['fcf',{sym:'pos',tol:'φ'+t,dats:['A','B','C']}],
  ch:verdictChoices(v,t,[[r,t],[v,t,true],[r3(2*(dx+dy)),t]]),
  ex:`位置度の偏差は 2√(Δx²＋Δy²)＝2√(${mm(dx)}²＋${mm(dy)}²)＝φ${mm(v)}。公差 φ${t} ${v<=t?'以内なので合格':'を超えるので不合格'}。Ⓜ がないので、穴の実寸法によって公差は増えない。`};}},
// ボーナス公差（Ⓜ）
g_bonus:{cat:'mmc',f(){
  const hole=Math.random()<0.6,D=pick([6,8,10,12,16,20,25]),a=pick([0.1,0.15,0.2,0.25,0.3]),t=pick([0.05,0.1,0.15,0.2]);
  const k=rnd(2,Math.round(a*100)),d=r3(hole?D+k/100:D-k/100),b=r3(Math.abs(d-D)),ans=r3(t+b);
  const lab=hole?`穴 φ${D} +${a}/0`:`軸 φ${D} 0/−${a}`;
  return{q:`${lab} に、図の位置度（Ⓜ）を指示した。仕上がった${hole?'穴':'軸'}の実寸法は φ${d.toFixed(2)} だった。この${hole?'穴':'軸'}に許される位置度の公差はいくらか。`,
  fig:['fcf',{sym:'pos',tol:`φ${t}(M)`,dats:['A','B']}],
  exfig:['dyn',{mms:D,lms:hole?D+a:D-a,t,act:d,lact:d.toFixed(2)}],
  ch:mc(ans,[t,r3(t+a),r3(t+b/2),r3(Math.max(0.005,t-b)),r3(t+a-b)],mm),
  ex:`最大実体寸法（MMS）は${hole?'穴なので最小の φ'+D:'軸なので最大の φ'+D}。実寸法 φ${d.toFixed(2)} は MMS から ${mm(b)} 離れているので、その分がボーナス公差になる。許される位置度は ${t}＋${mm(b)}＝φ${mm(ans)}。`};}},
// 実効寸法
g_vc:{cat:'mmc',f(){
  const hole=Math.random()<0.5,D=pick([8,10,12,16,20]),a=pick([0.1,0.2,0.3]),t=pick([0.05,0.1,0.2,0.3]);
  const mms=hole?D:D,lms=hole?D+a:D-a,vc=r3(hole?mms-t:mms+t);
  return{q:`${hole?`穴 φ${D} +${a}/0`:`軸 φ${D} 0/−${a}`} の軸線に、位置度 φ${t} Ⓜ を指示した。この${hole?'穴':'軸'}の実効寸法はいくらか。`,
  fig:['fcf',{sym:'pos',tol:`φ${t}(M)`,dats:['A']}],
  ch:mc(vc,[hole?r3(mms+t):r3(mms-t),hole?r3(lms-t):r3(lms+t),hole?r3(lms+t):r3(lms-t),mms],v=>fx(v,2)),
  ex:`実効寸法は、最大実体寸法と幾何公差を合わせた、はめあいの最も厳しい境界。${hole?`穴は MMS−t＝${mms}−${t}＝φ${fx(vc,2)}。この直径のピン（機能ゲージ）が入れば組み付けられる。`:`軸は MMS＋t＝${mms}＋${t}＝φ${fx(vc,2)}。この直径の穴（機能ゲージ）に入れば組み付けられる。`}`};}},
// Ⓜ 付き位置度の合否
g_mmcjudge:{cat:'mmc',f(){
  const D=pick([8,10,12]),a=pick([0.1,0.2]),t=pick([0.1,0.15,0.2]);let d,dx,dy,v,al;
  do{d=r3(D+rnd(1,Math.round(a*100))/100);al=r3(t+d-D);dx=rnd(10,Math.round(al*650))/1000;dy=rnd(10,Math.round(al*650))/1000;v=r3(2*sq(dx*dx+dy*dy));}
  while(Math.abs(v-al)<0.003||Math.abs(v-t)<0.003||v<0.6*t||(v<=t));
  return{q:`穴 φ${D} +${a}/0 に位置度 φ${t} Ⓜ（データム A・B・C）を指示した。穴の実寸法は φ${d.toFixed(2)}、真位置に対する中心のずれは Δx＝${mm(dx)}、Δy＝${mm(dy)}［mm］だった。判定として正しいものはどれか。`,
  fig:['plate',{d:'φ'+D,tol:`+${a}/0`,fcf:{sym:'pos',tol:`φ${t}(M)`,dats:['A','B','C']}}],
  exfig:['dyn',{mms:D,lms:D+a,t,act:d,lact:d.toFixed(2)}],
  ch:verdictChoices(v,al,[[v,t],[r3(v/2),al],[v,al,true]]),
  ex:`位置度の偏差は 2√(${mm(dx)}²＋${mm(dy)}²)＝φ${mm(v)}。Ⓜ があるので、実寸法 φ${d.toFixed(2)} と MMS φ${D} の差 ${mm(d-D)} が公差に加わり、許容は φ${t}＋${mm(d-D)}＝φ${mm(al)}。${v<=al?'許容以内なので合格。':'許容を超えるので不合格。'}${v>t?'Ⓜ を忘れて φ'+t+' と比べると、'+(v<=al?'合格品を不合格と誤判定する。':'判定は同じでも根拠が違う。'):''}`};}},
// 円周振れ：指示値の最大−最小
g_runout:{cat:'run',f(){
  const n=8,base=rnd(-5,5)/1000,amp=rnd(8,30)/1000,ph=Math.random()*6.28,vals=[...Array(n)].map((_,i)=>r3(base+amp/2*Math.sin(ph+i*Math.PI/4)+rnd(-3,3)/1000));
  const mx=Math.max(...vals),mn=Math.min(...vals),v=r3(mx-mn),t=pick([0.02,0.03,0.04]);
  return{q:`図の軸をデータム A で支持して1回転させ、45°ごとに読んだダイヤルゲージの指示値［mm］は次のとおり。\n${vals.map(x=>(x>=0?'+':'')+mm(x)).join('、')}\nこの断面の円周振れはいくらか。`,
  fig:['shaft',{fcf:{sym:'run',tol:String(t),dats:['A']}}],
  ch:mc(v,[r3(v/2),r3(Math.max(Math.abs(mx),Math.abs(mn))),r3(mx-vals[0]),r3((Math.abs(mx)+Math.abs(mn))/2)],mm),
  ex:`円周振れは、1回転のあいだの指示値の最大と最小の差。${mm(mx)}−(${mm(mn)})＝${mm(v)} mm。公差 ${t} ${v<=t?'以内なので合格':'を超えるので不合格'}。半分にする（${mm(v/2)}）のは、偏心量を求めるときの計算で、振れの値ではない。`};}},
// 普通幾何公差（JIS B 0419）
g_gen0419:{cat:'size',nocalc:false,f(){
  const T=pick(B0419),cls=pick(['H','K','L']);const ri=rnd(0,T.ranges.length-1);
  const L=T.ranges.length===1?pick([20,50,120]):(()=>{const [lo,hi]=T.bounds[ri];return Math.round(lo+(hi-lo)*(0.2+Math.random()*0.6));})();
  const ans=T.v[cls][ri],pool=[...new Set([...['H','K','L'].map(c=>T.v[c][ri]),...['H','K','L'].flatMap(c=>T.v[c]),0.05,0.3,0.4,1])].filter(x=>x!==ans);
  return{q:`図面に「JIS B 0419-m${cls}」と指示されている。${T.name}の普通公差を、呼び長さ ${L} mm で表から引くといくらか。${T.ranges.length===1?'（円周振れは長さによらない）':''}`,
  ch:[String(ans),...shuf(pool).slice(0,3).map(String)],
  ex:`${T.name}の普通公差（等級 ${cls}、${T.ranges[ri]}）は ${ans} mm。${T.note||''}早見表の「普通幾何公差」で確認できる。`};}},
// 浮動締結・固定締結の位置度（設計の慣用式）
g_float:{cat:'mmc',f(){
  const [F,H]=pick([[6,6.6],[8,9],[10,11],[12,13.5],[5,5.5]]),fl=Math.random()<0.5,ans=r3(fl?H-F:(H-F)/2);
  return{q:`${fl?'2つの部品を、どちらにも通し穴（φ'+H+'）をあけてボルト（M'+F+'）とナットで締結する（浮動締結）':'一方の部品のねじ穴（M'+F+'）に、他方の部品の通し穴（φ'+H+'）を通したボルトをねじ込む（固定締結）'}。穴の位置度（Ⓜ、両部品で同じ値）を、組み付けを保証できる最大の値にするといくらか。穴は最大実体寸法、ボルトは呼び径で考える。`,
  ch:mc(ans,[r3(fl?(H-F)/2:H-F),r3((H-F)/4),r3(2*(H-F))],mm),
  ex:`設計でよく使う式は、浮動締結 T＝H−F、固定締結 T＝(H−F)／2（H：穴の最大実体寸法、F：ボルトの径）。${fl?`浮動締結なので ${H}−${F}＝φ${mm(ans)}。`:`固定締結は、ねじ穴側の位置のずれをボルトがそのまま受けるので、すき間を2部品で分け合い (${H}−${F})／2＝φ${mm(ans)}。`}ねじ穴側には、ボルトの傾きを考えて突出公差域 Ⓟ を使うこともある。`};}},
// 同軸度：偏心の2倍
g_coax:{cat:'loc',f(){
  const e=rnd(3,25)/1000,v=r3(2*e),t=pick([0.02,0.03,0.04,0.05]);
  return{q:`図の小径部の軸線を測定したところ、データム軸線 A から最も離れた点の距離（偏心）は ${mm(e)} mm だった。同軸度の偏差（公差域の直径に相当する値）はいくらか。`,
  fig:['shaft',{fcf:{sym:'coax',tol:'φ'+t,dats:['A']}}],
  ch:mc(v,[e,r3(e/2),r3(4*e)],mm),
  ex:`同軸度の公差域は、データム軸線と同軸の直径 t の円筒。軸線がデータムから ${mm(e)} 離れた点を含むには、直径 2×${mm(e)}＝φ${mm(v)} が必要。公差 φ${t} ${v<=t?'以内なので合格':'を超えるので不合格'}。`};}},
// 座標公差（±a の正方形）と同じ最大のずれを全方向に許す位置度
g_square:{cat:'loc',f(){
  const a=pick([0.02,0.03,0.05,0.08,0.1,0.15]),v=r3(2*Math.SQRT2*a);
  return{q:`穴の位置を x・y 方向とも ±${a} mm の座標寸法公差で指示していた。この正方形の公差域の対角方向に許されていたずれを、全方向に許す位置度（円の公差域）に置き換えると、公差値はいくらか。`,
  ch:mc(v,[r3(2*a),r3(Math.SQRT2*a),r3(4*a)],mm),
  ex:`±${a} の正方形は1辺 ${r3(2*a)}。対角線の長さ（外接円の直径）は ${r3(2*a)}×√2＝φ${mm(v)}。円にすると面積は正方形の約1.57倍になり、機能上は問題のない部品を不合格にしにくくなる。`};}},
};

// ---- 追加の計算問題 ----
const nm=v=>String(+(+v).toFixed(3));
const sg=v=>(v>=0?'+':'−')+mm(Math.abs(v));
Object.assign(G,{
// 3次元測定機の座標から位置度
g_cmm:{cat:'meas',f(){
  const tx=pick([20,25,30,40,50,60]),ty=pick([15,20,25,30,40]),t=pick([0.1,0.15,0.2]);
  const dx=rnd(4,60)/1000*pick([1,-1]),dy=rnd(4,60)/1000*pick([1,-1]),mx=r3(tx+dx),my=r3(ty+dy),v=r3(2*sq(dx*dx+dy*dy)),r=r3(sq(dx*dx+dy*dy));
  return{q:`板の穴を3次元測定機で測った。データム A・B・C の順に座標系を作り、穴の中心は x＝${mx.toFixed(3)}、y＝${my.toFixed(3)} だった。真位置は理論的に正確な寸法で x＝${tx}、y＝${ty}。位置度の偏差はいくらか。`,
  fig:['plate',{tx,ty,fcf:{sym:'pos',tol:'φ'+t,dats:['A','B','C']}}],
  ch:mc(v,[r,r3(2*(Math.abs(dx)+Math.abs(dy))),r3(Math.abs(dx)+Math.abs(dy)),r3(2*Math.max(Math.abs(dx),Math.abs(dy)))],mm),
  ex:`真位置からのずれは Δx＝${mx.toFixed(3)}−${tx}＝${sg(dx)}、Δy＝${my.toFixed(3)}−${ty}＝${sg(dy)}。位置度の偏差は 2√(Δx²＋Δy²)＝φ${mm(v)}。公差 φ${t} ${v<=t?'以内なので合格':'を超えるので不合格'}。座標系をデータムの順と違う面で作ると、同じ部品でも値が変わる。`};}},
// ゼロ幾何公差の合否
g_zero:{cat:'zero',f(){
  const D=pick([6,8,10,12]),a=pick([0.2,0.3]);let d,al,dx,dy,v;
  do{d=r3(D+rnd(2,Math.round(a*100))/100);al=r3(d-D);dx=rnd(5,Math.round(al*650))/1000;dy=rnd(5,Math.round(al*650))/1000;v=r3(2*sq(dx*dx+dy*dy));}
  while(Math.abs(v-al)<0.004||v<0.5*al);
  return{q:`穴 φ${D} +${a}/0 に位置度 φ0 Ⓜ（データム A・B・C）を指示した。穴の実寸法は φ${d.toFixed(2)}、真位置に対する中心のずれは Δx＝${mm(dx)}、Δy＝${mm(dy)}［mm］だった。判定として正しいものはどれか。`,
  fig:['fcf',{sym:'pos',tol:'φ0(M)',dats:['A','B','C']}],exfig:['dyn',{mms:D,lms:D+a,t:0,act:d,lact:d.toFixed(2),lt:'0'}],
  ch:verdictChoices(v,al,[[v,a],[r3(v/2),al],[v,al,true]]),
  ex:`位置度の偏差は 2√(${mm(dx)}²＋${mm(dy)}²)＝φ${mm(v)}。ゼロ幾何公差なので、許される位置度は実寸法と MMS の差だけ：${d.toFixed(2)}−${D}＝φ${mm(al)}。${v<=al?'許容以内なので合格。':'許容を超えるので不合格。'}`};}},
// ゼロ幾何公差への書き換え
g_zeroconv:{cat:'zero',nocalc:false,f(){
  const hole=Math.random()<0.6,D=pick([6,8,10,12,16]),a=pick([0.1,0.15,0.2,0.25]),t=pick([0.05,0.1,0.15,0.2]);
  const ans=hole?`穴 φ${nm(D-t)} +${nm(a+t)}/0、位置度 φ0 Ⓜ`:`軸 φ${nm(D+t)} 0/−${nm(a+t)}、位置度 φ0 Ⓜ`;
  const alt=hole?[`穴 φ${D} +${nm(a+t)}/0、位置度 φ0 Ⓜ`,`穴 φ${nm(D-t)} +${a}/0、位置度 φ0 Ⓜ`,`穴 φ${nm(D+t)} +${nm(Math.max(0.05,a-t))}/0、位置度 φ0 Ⓜ`,`穴 φ${nm(D-t)} +${nm(a+2*t)}/0、位置度 φ0 Ⓜ`]
    :[`軸 φ${D} 0/−${nm(a+t)}、位置度 φ0 Ⓜ`,`軸 φ${nm(D+t)} 0/−${a}、位置度 φ0 Ⓜ`,`軸 φ${nm(D-t)} 0/−${nm(Math.max(0.05,a-t))}、位置度 φ0 Ⓜ`,`軸 φ${nm(D+t)} 0/−${nm(a+2*t)}、位置度 φ0 Ⓜ`];
  const ch=[ans];for(const x of alt)if(!ch.includes(x)&&ch.length<4)ch.push(x);
  return{q:`${hole?`穴 φ${D} +${a}/0`:`軸 φ${D} 0/−${a}`} に位置度 φ${t} Ⓜ を指示した図面を、組付けの条件（実効寸法）を変えずにゼロ幾何公差に書き換える。正しいものはどれか。`,
  fig:['fcf',{sym:'pos',tol:`φ${t}(M)`,dats:['A','B']}],ch,
  ex:`元の実効寸法は ${hole?`MMS−t＝${D}−${t}＝φ${nm(D-t)}`:`MMS＋t＝${D}＋${t}＝φ${nm(D+t)}`}。ゼロ幾何公差では MMS が実効寸法になるので、${hole?'穴の下限':'軸の上限'}を φ${nm(hole?D-t:D+t)} にする。${hole?'上限 φ'+nm(D+a):'下限 φ'+nm(D-a)}（最小実体寸法）は変えないので、サイズ公差は ${a}＋${t}＝${nm(a+t)} に広がる。`};}},
// 定盤とダイヤルゲージによる平行度
g_parallel:{cat:'orient',f(){
  const t=pick([0.03,0.05,0.08]),base=rnd(-10,10)/1000,gx=rnd(-12,12)/1000,gy=rnd(-12,12)/1000;
  const vals=[...Array(9)].map((_,i)=>r3(base+gx*((i%3)-1)+gy*(Math.floor(i/3)-1)+rnd(-6,6)/1000));
  const mx=Math.max(...vals),mn=Math.min(...vals),v=r3(mx-mn);
  return{q:`図の部品の下面（データム A）を定盤に置き、上面の9点をダイヤルゲージで測った指示値［mm］は次のとおり。\n${vals.map(sg).join('、')}\n上面の平行度（データム A）の値はいくらか。`,
  fig:['block',{fcf:{sym:'par',tol:String(t),dats:['A']}}],exfig:['zone',{k:'par'}],
  ch:mc(v,[r3(v/2),r3(Math.max(Math.abs(mx),Math.abs(mn))),r3(Math.abs(mx-vals[0])),r3(Math.abs(mn-vals[0]))],mm),
  ex:`定盤がデータム A を模擬するので、指示値の最大と最小の差が平行度になる：${sg(mx)}−(${sg(mn)})＝${mm(v)}。公差 ${t} ${v<=t?'以内なので合格':'を超えるので不合格'}。上面の平面度は、傾きを除くのでこの値以下になる。`};}},
// 全振れ
g_trun:{cat:'run',f(){
  const t=pick([0.03,0.05,0.08]),off=rnd(-4,4)/1000;
  const sec=[...Array(3)].map((_,k)=>{const c=off+(k-1)*rnd(0,8)/1000*pick([1,-1]),h=rnd(4,14)/1000;return[r3(c+h+rnd(0,3)/1000),r3(c-h)];});
  const mx=Math.max(...sec.map(x=>x[0])),mn=Math.min(...sec.map(x=>x[1])),v=r3(mx-mn),rs=sec.map(x=>r3(x[0]-x[1]));
  return{q:`図の軸をデータム A・B で支えて回転させ、中央の外周を、測定子を軸方向に動かしながら3つの断面で測った。指示値（ゲージの 0 点は途中で変えていない）［mm］は次のとおり。\n断面1：最大 ${sg(sec[0][0])}、最小 ${sg(sec[0][1])}\n断面2：最大 ${sg(sec[1][0])}、最小 ${sg(sec[1][1])}\n断面3：最大 ${sg(sec[2][0])}、最小 ${sg(sec[2][1])}\n全振れの値はいくらか。`,
  fig:['shaft2',{fcf:{sym:'trun',tol:String(t),dats:['A-B']}}],
  ch:mc(v,[Math.max(...rs),r3(rs.reduce((a,b)=>a+b)/3),r3(rs.reduce((a,b)=>a+b)),r3(Math.max(Math.abs(mx),Math.abs(mn)))],mm),
  ex:`全振れは、表面全体での指示値の最大と最小の差。全体の最大 ${sg(mx)}、最小 ${sg(mn)} なので ${mm(v)}。断面ごとの差（円周振れ）の最大 ${mm(Math.max(...rs))} より大きくなることがある。公差 ${t} ${v<=t?'以内なので合格':'を超えるので不合格'}。`};}},
// 面の輪郭度の判定（データムあり）
g_profjudge:{cat:'prof',f(){
  const t=pick([0.2,0.3,0.4]),h=t/2;let d,mxa,rg;
  // 合格・不合格がほぼ半々になるよう、ずれの幅を2通りにする
  const k=Math.random()<0.5?0.95:1.35;
  do{d=[...Array(6)].map(()=>r3(rnd(-Math.round(h*k*1000),Math.round(h*k*1000))/1000));mxa=Math.max(...d.map(Math.abs));rg=r3(Math.max(...d)-Math.min(...d));}
  while(Math.abs(mxa-h)<0.008||Math.abs(rg-t)<0.008||Math.abs(mxa-t)<0.008);
  const V=(lab,x,lim,ok)=>`${lab} ${mm(x)}、許容 ${lim} → ${ok?'合格':'不合格'}`;
  const ok=mxa<=h;
  return{q:`図の曲面（面の輪郭度 ${t}、データム A・B・C）を3次元測定機で測った。理論的に正確な輪郭からの、法線方向のずれ［mm］は次のとおり。\n${d.map(sg).join('、')}\n判定として正しいものはどれか。`,
  fig:['curve',{fcf:{sym:'sprof',tol:String(t),dats:['A','B','C']}}],
  ch:[V('ずれの最大',mxa,'±'+mm(h),ok),V('ずれの最大',mxa,'±'+mm(h),!ok),V('ずれの範囲',rg,mm(t),rg<=t),V('ずれの最大',mxa,'±'+mm(t),mxa<=t)],
  ex:`公差域は理論的に正確な輪郭の両側に ${mm(h)} ずつ。データムに固定されているので、各点のずれが ±${mm(h)} 以内かで判定する。ずれの最大は ${mm(mxa)} なので${ok?'合格':'不合格'}。ずれの範囲（${mm(rg)}）を ${t} と比べるのは、データムがなく輪郭を自由に動かせる場合の目安で、ここでは使えない。`};}},
// 機能ゲージのピン・穴の寸法
g_gauge:{cat:'gauge',f(){
  const hole=Math.random()<0.6,n=pick([2,3,4,6]),D=pick([5,6,8,10,12]),a=pick([0.1,0.15,0.2]),t=pick([0.05,0.1,0.15,0.2]),ans=r3(hole?D-t:D+t);
  return{q:`${hole?`板の ${n} 個の穴 φ${D} +${a}/0`:`部品の ${n} 本のピン φ${D} 0/−${a}`} に、図の位置度を指示した。${hole?'検査用の機能ゲージのピンの直径':'検査用の機能ゲージの穴の直径'}（ゲージの製作公差は考えない）はいくらか。`,
  fig:['fcf',{sym:'pos',tol:`φ${t}(M)`,dats:['A','B','C']}],
  ch:mc(ans,[D,hole?r3(D+t):r3(D-t),hole?r3(D+a-t):r3(D-a+t),hole?r3(D+a):r3(D-a)],v=>fx(v,2)),
  ex:`機能ゲージは実効寸法で作る。${hole?`穴の実効寸法＝MMS−t＝${D}−${t}＝φ${fx(ans,2)}。`:`ピンの実効寸法＝MMS＋t＝${D}＋${t}＝φ${fx(ans,2)}。`}ゲージの位置は理論的に正確な寸法で決め、データムの受けは優先順位どおりに当てる。サイズは別に検査する。`};}},
});

// ---- 組付け・積み上げ・工程能力・データムシフト・不確かさ ----
Object.assign(G,{
// 実効寸法による最悪のすき間（固定締結：一方の部品の穴に、他方の部品のピンを入れる）
g_clear:{cat:'stack',f(){
  const [Dh,Dp]=pick([[8.2,8],[8.4,8],[10.2,10],[10.5,10],[12.3,12],[6.2,6]]),ah=pick([0.1,0.15,0.2]),ap=pick([0.05,0.1]),t1=pick([0.05,0.1,0.15]),t2=pick([0.05,0.1]);
  const v=r3((Dh-t1)-(Dp+t2));
  return{q:`部品1の穴 φ${Dh} +${ah}/0 に位置度 φ${t1} Ⓜ、部品2のピン φ${Dp} 0/−${ap} に位置度 φ${t2} Ⓜ を指示した（データムは両部品で対応している）。どの組合せでも組み付くかを確かめるため、最悪の場合のすき間（直径の差）を求めよ。負の値は干渉を表す。`,
  ch:mc(v,[r3(Dh-Dp),r3((Dh+ah)-(Dp-ap)),r3((Dh-t1/2)-(Dp+t2/2)),r3((Dh-Dp)-t1),r3(Dh-t1-Dp)],x=>fx(x,2)),
  ex:`最悪の組合せは、穴の実効寸法（${Dh}−${t1}＝φ${nm(Dh-t1)}）と、ピンの実効寸法（${Dp}＋${t2}＝φ${nm(Dp+t2)}）。すき間は ${nm(Dh-t1)}−${nm(Dp+t2)}＝${fx(v,2)}。${v>=0?'0 以上なので、どの組合せでも組み付く。':'負なので、最悪の組合せでは組み付かない（干渉する）。'}サイズだけの差（${fx(Dh-Dp,2)}）で判断すると、位置のずれを見落とす。`};}},
// 公差の積み上げ（最悪値法・RSS）。位置度は1方向に ±t/2 として入れる
g_stack:{cat:'stack',f(){
  const A=pick([60,80,100]),ta=pick([0.05,0.1,0.15]),B=pick([30,35,40]),tb=pick([0.03,0.05,0.08]),C=r3(A-B-pick([0.3,0.4,0.5,0.6])),tc=pick([0.03,0.05]),tp=pick([0.1,0.2]),wc=Math.random()<0.5;
  const G0=r3(A-B-C),W=r3(ta+tb+tc+tp/2),R=r3(sq(ta*ta+tb*tb+tc*tc+(tp/2)**2)),ans=wc?W:R;
  const f=x=>'±'+fx(x,3);
  return{q:`すき間 G＝A−B−C を考える。A＝${A}±${ta}、B＝${B}±${tb}、C＝${C}±${tc}［mm］で、さらに穴の位置度 φ${tp}（Ⓜ なし）による位置のずれが G に1方向に加わる。G の公差を${wc?'最悪値法（ワーストケース）':'二乗和平方根（RSS）'}で求めよ。`,
  ch:mc(ans,[wc?R:W,r3(ta+tb+tc+tp),r3(sq(ta*ta+tb*tb+tc*tc+tp*tp)),wc?r3(ta+tb+tc):r3(sq(ta*ta+tb*tb+tc*tc))],f),
  ex:`G の基準値は ${A}−${B}−${C}＝${nm(G0)}。位置度 φ${tp} は1方向に ±${nm(tp/2)} として入れる。${wc?`最悪値法：${ta}＋${tb}＋${tc}＋${nm(tp/2)}＝±${fx(W,3)}。G は ${nm(G0-W)}〜${nm(G0+W)} になりうる。`:`RSS：√(${ta}²＋${tb}²＋${tc}²＋${nm(tp/2)}²)＝±${fx(R,3)}。各要素が独立で、中心付近に正規分布でばらつくことが前提。`}`};}},
// 幾何特性（片側）の工程能力
g_cpkgdt:{cat:'cap',f(){
  const k=pick(['平面度','位置度','直角度']),t=pick([0.03,0.05,0.08,0.1]),m=r3(t*rnd(25,55)/100),s=Math.max(0.001,r3(t*rnd(4,12)/100)),v=(t-m)/(3*s);
  return{q:`ある部品の${k}（公差 ${t}）を量産品で測り、平均 ${mm(m)}、標準偏差 ${mm(s)} を得た。この特性の工程能力指数はいくらか（分布の形は考えない）。`,
  ch:mc(v,[t/(6*s),(t-m)/(6*s),m/(3*s),(t/2-m)/(3*s)],x=>fx(x,2)),
  ex:`${k}は 0 が下限の片側の特性なので、上限（公差値）に対する片側の指数で評価する：(${t}−${mm(m)})／(3×${mm(s)})＝${fx(v,2)}。両側の規格幅を使う Cp（t／6s）は使わない。${k==='位置度'?'位置度の偏差は 0 以上で右に裾を引く分布になるので、正規分布を前提にした不良率の推定には注意が要る。':''}`};}},
// データムシフト（データム B の穴に Ⓜ）
g_dshift:{cat:'mmc',f(){
  const Db=pick([16,20,25]),ab=pick([0.1,0.15,0.2]),perp=Math.random()<0.5,tp=pick([0.02,0.05]),db=r3(Db+rnd(2,Math.round(ab*100))/100),bd=perp?r3(Db-tp):Db,v=r3(db-bd);
  return{q:`データム B は穴 φ${Db} +${ab}/0 で、${perp?`データム A に対する直角度 φ${tp} Ⓜ が指示されている`:'データム A 以外に幾何公差は指示されていない'}。4つの穴に位置度 φ0.2 Ⓜ | A | B Ⓜ を指示した。データム B の実寸法が φ${db.toFixed(2)} のとき、データム B を模擬する境界（ゲージのピン）とのすき間（直径の差）はいくらか。`,
  fig:['fcf',{sym:'pos',tol:'φ0.2(M)',dats:['A','B(M)']}],
  ch:mc(v,[r3(db-Db),r3(v/2),r3(ab),r3(db-Db+tp)],x=>fx(x,2)),
  ex:`データム B を模擬する境界は、${perp?`最大実体実効寸法：MMS−直角度＝${Db}−${tp}＝φ${nm(bd)}`:`最大実体寸法 φ${Db}`}。すき間は ${db.toFixed(2)}−${nm(bd)}＝${fx(v,2)}。この範囲で4つの穴のパターン全体を動かして評価してよい（データムシフト）。ずれはパターン全体の動きで、各穴の公差にそのまま足すものではない。`};}},
// 測定の不確かさを考えた判定（ISO 14253-1 の既定の考え方。片側の特性）
g_guard:{cat:'meas',nocalc:true,f(){
  const t=pick([0.05,0.08,0.1,0.2]),U=r3(t*pick([0.1,0.15,0.2])),zone=pick([0,1,2]);let m;
  do{m=zone===0?r3(rnd(Math.round(t*300),Math.round((t-U)*1000))/1000):zone===1?r3(rnd(Math.round((t-U)*1000),Math.round((t+U)*1000))/1000):r3(rnd(Math.round((t+U)*1000),Math.round((t+U*2.5)*1000))/1000);}
  while(Math.abs(m-(t-U))<0.0015||Math.abs(m-(t+U))<0.0015||Math.abs(m-t)<0.0005);
  const S=['供給者は適合を示せる／受入側は不適合を示せない','供給者は適合を示せない／受入側も不適合を示せない','供給者は適合を示せない／受入側は不適合を示せる','供給者は適合を示せる／受入側も不適合を示せる'];
  const k=m<=t-U?0:m<=t+U?1:2;
  return{q:`平面度 ${t} の部品を測り、測定値 ${mm(m)}、測定の拡張不確かさ U＝${mm(U)} を得た。ISO 14253-1（JIS B 0641-1）の既定の判定ルールで、正しいものはどれか。`,
  ch:[S[k],...S.filter((_,i)=>i!==k)],
  ex:`適合を示すには、測定値が公差を U だけ狭めた範囲（${mm(t-U)} 以下）にあること。不適合を示すには、公差を U だけ広げた範囲（${mm(t+U)}）を超えること。測定値 ${mm(m)} は${k===0?`${mm(t-U)} 以下なので、供給者は適合を示せる。`:k===1?`${mm(t-U)}〜${mm(t+U)} のあいだなので、どちらも示せない（判定できない範囲）。`:`${mm(t+U)} を超えるので、受入側は不適合を示せる。`}`};}},
});

// ---- 合否を判定する問題（図の測定結果を見て、合格・不合格を選ぶ。答え合わせで公差域を重ねる） ----
const J2=ok=>ok?['合格','不合格']:['不合格','合格'];
const jsg=v=>(v>=0?'+':'−')+Math.abs(v).toFixed(3);
Object.assign(G,{
g_jpos:{cat:'loc',judge:true,nocalc:true,f(){
  const M=Math.random()<0.5,a=pick([0.1,0.2]),t=pick([0.1,0.15,0.2]),want=Math.random()<0.5;let d,al,dx,dy,v;
  do{d=r3(10+rnd(0,Math.round(a*100))/100);al=r3(t+(M?d-10:0));const r=al/2*(want?rnd(45,92):rnd(108,150))/100,ang=Math.random()*6.283;dx=r3(r*Math.cos(ang));dy=r3(r*Math.sin(ang));v=r3(2*Math.hypot(dx,dy));}
  while(Math.abs(v-al)<0.004||(v<=al)!==want);
  return{q:`穴 φ10 +${a}/0 に位置度 φ${t}${M?' Ⓜ':''}（データム A・B・C）を指示した。穴の実寸法は φ${d.toFixed(2)}、図のように中心が真位置から Δx＝${jsg(dx)}、Δy＝${jsg(dy)}［mm］ずれていた。判定は？`,
  fig:['pos',{dx,dy,lx:jsg(dx),ly:jsg(dy),cap:'真位置と、測定した穴の中心（ずれは誇張）'}],exfig:['pos',{dx,dy,lx:jsg(dx),ly:jsg(dy),t:al,lt:'φ'+al.toFixed(3),cap:'許される公差域（円）を重ねた図'}],
  ch:J2(v<=al),
  ex:`位置度の偏差は 2√(Δx²＋Δy²)＝φ${v.toFixed(3)}。許される位置度は ${M?`φ${t}＋ボーナス ${(d-10).toFixed(2)}（実寸法−MMS）＝φ${al.toFixed(3)}`:`φ${t}（Ⓜ なしなので実寸法によらない）`}。${v<=al?'公差域の円の中にあるので合格。':'公差域の円の外にあるので不合格。'}`};}},
g_jpar:{cat:'orient',judge:true,nocalc:true,f(){
  const t=pick([0.03,0.05,0.08]),want=Math.random()<0.5;let v,rg;
  do{const tilt=rnd(-10,10)/1000,amp=t*(want?rnd(25,45):rnd(55,80))/100;v=[...Array(7)].map((_,i)=>r3(tilt*(i-3)/3+amp*Math.sin(i*1.3+Math.random())));rg=r3(Math.max(...v)-Math.min(...v));}
  while(Math.abs(rg-t)<0.003||(rg<=t)!==want);
  const lo=Math.min(...v);
  return{q:`下面（データム A）を定盤に置き、上面をダイヤルゲージでなぞって7点の指示値［mm］を読んだ（図）。\n${v.map(jsg).join('、')}\n上面の平行度 ${t}（データム A）の判定は？`,
  fig:['readings',{vals:v,base:'定盤（データム A）基準',cap:'上面の指示値'}],exfig:['readings',{vals:v,band:[lo,r3(lo+t)],base:'定盤（データム A）基準',cap:'データム A に平行な、幅 '+t+' の公差域を重ねた図'}],
  ch:J2(rg<=t),
  ex:`公差域はデータム A に平行な2平面（間隔 ${t}）。高さの位置は自由なので、指示値の最大と最小の差 ${rg.toFixed(3)} が ${t} 以内かで判定する。${rg<=t?'収まるので合格。':'収まらないので不合格。'}`};}},
g_jrun:{cat:'run',judge:true,nocalc:true,f(){
  const t=pick([0.02,0.03,0.05]),want=Math.random()<0.5;let v,rg;
  do{const e=t*(want?rnd(15,40):rnd(55,75))/100,ph=Math.random()*6.28;v=[...Array(8)].map((_,i)=>r3(e*Math.cos(ph+i*Math.PI/4)+rnd(-3,3)/1000));rg=r3(Math.max(...v)-Math.min(...v));}
  while(Math.abs(rg-t)<0.003||(rg<=t)!==want);
  const lo=Math.min(...v);
  return{q:`軸をデータム A で支えて1回転させ、45° ごとに8点の指示値［mm］を読んだ（図）。\n${v.map(jsg).join('、')}\nこの断面の円周振れ ${t}（データム A）の判定は？`,
  fig:['polar',{vals:v}],exfig:['polar',{vals:v,band:[lo,r3(lo+t)],cap:'半径の差 '+t+' の公差域を重ねた図'}],
  ch:J2(rg<=t),
  ex:`円周振れは、1回転のあいだの指示値の最大と最小の差：${Math.max(...v).toFixed(3)}−(${lo.toFixed(3)})＝${rg.toFixed(3)}。${rg<=t?`${t} 以内なので合格。`:`${t} を超えるので不合格。`}`};}},
g_jprof:{cat:'prof',judge:true,nocalc:true,f(){
  const t=pick([0.2,0.3,0.4]),h=t/2,want=Math.random()<0.5;let v,m;
  do{const k=want?rnd(60,92)/100:rnd(105,135)/100;v=[...Array(7)].map(()=>r3(rnd(-1000,1000)/1000*h*k));m=Math.max(...v.map(Math.abs));}
  while(Math.abs(m-h)<0.006||(m<=h)!==want);
  return{q:`曲面に面の輪郭度 ${t}（データム A・B・C）を指示した。3次元測定機で測った、理論的に正確な輪郭からの法線方向のずれ［mm］を図に示す。\n${v.map(jsg).join('、')}\n判定は？`,
  fig:['readings',{vals:v,base:'理論的に正確な輪郭',cap:'法線方向のずれ'}],exfig:['readings',{vals:v,band:[-h,h],base:'理論的に正確な輪郭',cap:'輪郭の両側に '+h.toFixed(2)+' ずつの公差域を重ねた図'}],
  ch:J2(m<=h),
  ex:`データムに固定された公差域は、理論的な輪郭の両側に ${h.toFixed(2)} ずつ。ずれの最大は ${m.toFixed(3)} なので${m<=h?'収まり合格。':'はみ出して不合格。'}ずれの範囲で判定するのは、データムがなく位置を動かせる場合の目安。`};}},
});
