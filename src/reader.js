// ===== 記入枠を読む（資料タブ）：公差記入枠を組むと、意味・公差域・データム・Ⓜ・測り方と、不適切な指示を返す =====
// 規格の本文は転載せず、JIS B 0021（ISO 1101 系）の考え方を自分の言葉で書く。ASME と違う点は「注意」で示す。
const RD={feat:'hole',sym:'pos',tol:'0.1',dia:true,m:false,d1:'A',d2:'B',d3:'C',mms:'10.0',lms:'10.2'};
const RD_FEAT=[['plane','平面'],['hole','穴'],['shaft','軸'],['slot','溝の幅'],['surf','曲面']];
const RD_SYMS=['str','flat','circ','cyl','lprof','sprof','par','perp','ang','pos','coax','sym','run','trun'];
const RD_DATS=['—','A','B','C','A-B','A(M)','B(M)','C(M)'];
const RD_GRP={str:'form',flat:'form',circ:'form',cyl:'form',lprof:'prof',sprof:'prof',par:'orient',perp:'orient',ang:'orient',pos:'loc',coax:'loc',sym:'loc',run:'run',trun:'run'};
const RD_GNAME={form:'形状公差',prof:'輪郭度',orient:'姿勢公差',loc:'位置公差',run:'振れ公差'};
// 測り方の例（代表的なもの。実際はデータムの設定方法と測定の不確かさを含めて決める）
const RD_MEAS={
 str:['表面の線：定盤とダイヤルゲージ、またはナイフエッジ・すき間で測る','軸線（φ付き）：3次元測定機で断面の中心を求めて評価する。真円度測定機の円筒度の機能でも求められる'],
 flat:['定盤の上で3点支持し、ダイヤルゲージで面を走査する（最大−最小は目安。正しくは最小領域で評価）','3次元測定機で多点を取り、最小領域平面で評価する','小さな精密面は、オプチカルフラットの干渉じまでも見られる'],
 circ:['真円度測定機（半径法）で断面ごとに測る','マイクロメータなどの2点測定では、奇数山（3山・5山など）の形が見えない。V ブロック法は山の数と V の角度で倍率が変わり、60° では3山が約3倍に出る一方、2山・4山・5山・7山は見えない（90° では3山・5山が約2倍、4山・7山はほぼ見えない）。どちらも真円度の値とは一致しない'],
 cyl:['真円度測定機の円筒度の機能で、複数の断面と母線を測る','3次元測定機で多点を取り、同軸2円筒の最小領域で評価する'],
 lprof:['輪郭形状測定機で断面ごとに測る','3次元測定機で測り、CAD の理想輪郭と比べる'],
 sprof:['3次元測定機・非接触の形状測定機で測り、CAD の理想面と比べる（データム系に合わせてから偏差を見る）','検査治具：データムの当て位置で部品を受け、測定点のすき間をすき間ゲージ・ダイヤルゲージで読む（外装部品で多い）'],
 par:['データム面を定盤に置き、ダイヤルゲージで対象面を走査する（最大−最小）','穴の軸線は、穴にマンドレルを入れて両端の高さの差から求める（長さで換算する）'],
 perp:['定盤と直角定規（スコヤ）でデータム面に当て、すき間やダイヤルゲージで読む','3次元測定機で、データム平面に対する直角を評価する'],
 ang:['サインバーで理論的に正確な角度に傾け、対象面を定盤と平行にしてダイヤルゲージで走査する','3次元測定機で評価する'],
 pos:['3次元測定機で図面のデータム系（第1次→第2次→第3次）を作り、穴の中心の座標から 2√(Δx²＋Δy²) で位置度の偏差を求める'],
 coax:['真円度測定機で、データム軸線を求めてから対象の断面中心のずれを測る','3次元測定機で評価する。円周振れで代用すると形のくずれも含むので、同軸度とは一致しない'],
 sym:['3次元測定機で、データムの中心平面と溝の中心平面を求めて比べる','定盤の上で、部品を裏返して両側の高さを測る方法もある'],
 run:['データム軸線を V ブロック・センタ・チャックで支持し、1回転させたときのダイヤルゲージの最大−最小を、測定位置ごと（外周は横断面ごと、端面は半径位置ごと）に読む'],
 trun:['データム軸線で支持して回転させながら、ダイヤルゲージをデータム軸線に平行に（端面では直角に）動かし、面全体の最大−最小を読む'],
};
const rdNum=v=>{const t=String(v).normalize('NFKC').replace(/[−ー]/g,'-').trim();return /^-?\d+(\.\d+)?$|^-?\.\d+$/.test(t)?parseFloat(t):null;};
const rdFmt=v=>(+v.toFixed(4)).toString();
function rdDats(){const a=[RD.d1,RD.d2,RD.d3];return a;}
function rdDlist(){return rdDats().filter(d=>d!=='—');}
function rdTolText(){return (RD.dia?'φ':'')+(RD.tol||'?')+(RD.m?'(M)':'');}
const rdInternal=()=>RD.feat==='hole'||RD.feat==='slot';
const rdSize=()=>RD.feat==='hole'||RD.feat==='shaft'||RD.feat==='slot';
// 規制する対象（表面か、軸線・中心平面か）
function rdTarget(){
  const s=RD.sym,f=RD.feat,surfOnly=['circ','cyl','lprof','sprof','run','trun'].includes(s);
  if(f==='plane')return s==='run'||s==='trun'?'この端面（データム軸線に直角な面）':'この面';if(f==='surf')return 'この曲面';
  if(f==='slot')return surfOnly?'溝の両側の面':'溝の幅の中心平面';
  const w=f==='hole'?'穴':'軸';
  if(surfOnly)return w+'の表面';
  if(s==='flat')return w+'の表面';
  if(s==='pos'||s==='coax'||RD.dia)return w+'の軸線';
  if(['par','perp','ang'].includes(s))return w+'の軸線（指示線の方向）';
  if(s==='sym')return w+'の軸線';
  return w+'の表面の線（母線）';
}
function rdZone(){
  const s=RD.sym,t=RD.tol||'?',D=rdDlist(),p=D.length?'データム '+D.join('｜'):'データム（未指定）',p1=D[0]?'データム '+D[0]:'データム（未指定）';
  switch(s){
   case 'flat':return `距離 ${t} の平行2平面のあいだ`;
   case 'str':return RD.dia?`直径 ${t} の円筒の中`:RD.feat==='plane'?`指示した方向の各断面で、距離 ${t} の平行2直線のあいだ`:`各母線について、距離 ${t} の平行2直線のあいだ`;
   case 'circ':return `各断面で、半径の差が ${t} の同心2円のあいだ`;
   case 'cyl':return `半径の差が ${t} の同軸2円筒のあいだ`;
   case 'lprof':return `各断面で、理論的に正確な輪郭線の上に中心をもつ直径 ${t} の円の包絡線2本のあいだ`;
   case 'sprof':return `理論的に正確な輪郭面の上に中心をもつ直径 ${t} の球の包絡面2つのあいだ`;
   case 'par':return RD.dia?`${p1}（軸線）に平行な、直径 ${t} の円筒の中`:`${p1} に平行な、距離 ${t} の平行2平面のあいだ`;
   case 'perp':return RD.dia?`${p1} に直角な、直径 ${t} の円筒の中`:`${p1} に直角な、距離 ${t} の平行2平面のあいだ`;
   case 'ang':return RD.dia?`${p1}（軸線）に対して理論的に正確な角度で傾いた、直径 ${t} の円筒の中`:`${p1} に対して理論的に正確な角度で傾いた、距離 ${t} の平行2平面のあいだ`;
   case 'pos':return RD.dia?`${p} と理論的に正確な寸法で決まる真位置を軸線とする、直径 ${t} の円筒の中`:`${p} と理論的に正確な寸法で決まる真位置に対して対称な、距離 ${t} の平行2平面のあいだ`;
   case 'coax':return `${p1} の軸線と同軸の、直径 ${t} の円筒の中`;
   case 'sym':return `${p1} の中心平面に対して対称な、距離 ${t} の平行2平面のあいだ`;
   case 'run':return `${p1} の軸線のまわりに1回転させたとき、各測定位置での振れ（指示値の最大−最小）が ${t} 以内`;
   case 'trun':return `${p1} の軸線と同軸の、半径の差が ${t} の2円筒のあいだ`;
  }
  return '';
}
// 不適切な指示の指摘：[重さ 'ng'|'warn', 内容]
function rdIssues(){
  const s=RD.sym,g=RD_GRP[s],f=RD.feat,d=rdDats(),D=rdDlist(),t=rdNum(RD.tol),out=[];
  const ng=x=>out.push(['ng',x]),warn=x=>out.push(['warn',x]);
  if(t==null||t<0)ng('公差値が数値になっていない。');
  if(t===0&&!RD.m)ng('公差値 0 は、Ⓜ（または Ⓛ）と組み合わせたゼロ幾何公差のときだけ使える。Ⓜ なしの 0 は、形体を完全な形・位置に作れという意味になり、製作も検査もできない。');
  // データムの有無
  if(g==='form'&&D.length)ng(`${SYMN[s]}は形状公差なので、データムを書かない。データムに対する向きまで規制したいなら、${s==='flat'?'平行度・直角度':'姿勢公差'}を使う。`);
  if((g==='orient'||g==='run'||s==='coax'||s==='sym')&&!D.length)ng(`${SYMN[s]}にはデータムが必要。何に対して${g==='run'?'回転させるか':'の関係か'}が決まらない。`);
  if(s==='pos'&&!D.length)warn('データムのない位置度は、穴どうしの位置関係（パターン）だけを規制し、部品の外形に対する位置は規制しない（JIS B 0021・JIS B 0025 の考え方）。ISO 1101:2017・ISO 5458:2018 では、パターンとして1つにまとめるなら CZ を明記する。外形に対する位置が必要ならデータムを付ける。ASME は原則としてデータムを付ける。');
  if(d[0]==='—'&&(d[1]!=='—'||d[2]!=='—')||d[1]==='—'&&d[2]!=='—')ng('データムの区画が飛んでいる。第1次から順に詰めて書く。');
  const base=D.map(x=>x.replace('(M)','')),dup=base.some((x,i)=>base.indexOf(x)!==i||(x==='A-B'&&base.some(y=>y==='A'||y==='B')));
  if(dup)ng('同じデータムが2回出てくる。1つの文字は1つの区画にだけ書く。');
  if(g==='orient'&&D.length===3)warn('姿勢公差は向き（回転）だけを規制するので、第3次データムまで要ることは少ない。位置を決めたいなら位置度か輪郭度を使う。');
  // φ の付け方
  if(RD.dia&&['flat','circ','cyl','run','trun','sym','lprof','sprof'].includes(s))ng(`${SYMN[s]}の公差域は円筒ではない（${s==='circ'||s==='cyl'||s==='run'||s==='trun'?'半径の差で決まる':s==='lprof'||s==='sprof'?'輪郭に沿った帯の':'平行2平面の'}公差域）ので、φ を付けない。`);
  if(RD.dia&&(f==='plane'||f==='slot'||f==='surf')&&['str','par','perp','ang','pos','coax'].includes(s))ng('平面・幅の中心平面の公差域は2平面なので、φ を付けない。φ は穴・軸の軸線のように、円筒の公差域にするときだけ付ける。');
  if(!RD.dia&&s==='coax')ng('同軸度の公差域は円筒なので、公差値に φ を付ける。');
  if(!RD.dia&&s==='pos'&&(f==='hole'||f==='shaft'))warn('穴・軸の位置度で φ を付けないと、指示線の方向だけの2平面の公差域になる。全方向に同じだけ許すなら φ を付ける。');
  // Ⓜ の付け方
  if(RD.m&&!rdSize())ng('Ⓜ はサイズ形体（穴・軸・溝などの幅）にだけ使える。平面や曲面には最大実体寸法がないので、Ⓜ を付けられない。');
  if(RD.m&&['circ','cyl','lprof','sprof','run','trun'].includes(s))ng(`${SYMN[s]}には Ⓜ を使えない（表面そのものを規制する特性なので、サイズによるボーナスの考え方が当てはまらない）。`);
  if(RD.m&&s==='str'&&!RD.dia&&(f==='hole'||f==='shaft'))ng('φ のない真直度は表面の線を規制するので、Ⓜ を付けられない。Ⓜ を使うなら、寸法線の延長上に指示して φ を付け、軸線の真直度にする。');
  if(g==='run'&&D.some(x=>/\(M\)/.test(x)))ng('振れ公差は、データム軸線のまわりに実際に回して測るので、データムに Ⓜ を付けない（ASME もデータムは RMB に限る）。');
  // 形体と記号の組合せ
  if((f==='plane'||f==='slot')&&['circ','cyl','coax'].includes(s))ng(`${SYMN[s]}は円筒・円すいなどの回転形体に使う。${f==='plane'?'平面':'溝の幅'}には使えない。`);
  if(f==='slot'&&(s==='run'||s==='trun'))ng(`${SYMN[s]}は回転形体の表面か、軸の端面に使う。溝の幅には使えない。`);
  if((f==='hole'||f==='shaft')&&s==='flat')ng('円筒の面に平面度は使えない。円筒の形なら円筒度、断面の丸さなら真円度を使う。');
  if((f==='hole'||f==='shaft')&&s==='sym')warn('対称度は幅の中心平面に使う。穴・軸の中心のずれなら、位置度か同軸度を使う。');
  if(f==='surf'&&!['lprof','sprof','run','trun'].includes(s))warn('曲面には、ふつう線の輪郭度・面の輪郭度を使う（円すい面の振れは除く）。');
  // ASME との違い
  if(s==='coax'||s==='sym')warn(`ASME Y14.5-2018 では${s==='coax'?'同心度（同軸度）':'対称度'}の記号が廃止された。ASME の図面では位置度・輪郭度・振れで指示する。`);
  if(RD.m&&s==='pos'&&D.some(x=>/\(M\)/.test(x)))warn('データムにも Ⓜ を付けたので、データム形体が最大実体寸法から離れた分だけ、パターン全体がずれてよい（データムシフト）。機能ゲージでは自然に表れるが、3次元測定機では別に考える。');
  return out;
}
function rdMMC(){
  if(!RD.m||!rdSize())return '';
  const t=rdNum(RD.tol),mms=rdNum(RD.mms),lms=rdNum(RD.lms),inner=rdInternal();
  if(t==null||mms==null||lms==null)return `<p class="note">最大実体寸法と最小実体寸法を入れると、ボーナス公差と実効寸法を計算します。</p>`;
  const wrong=inner?mms>lms:mms<lms;
  const bon=Math.abs(lms-mms),vc=inner?mms-t:mms+t,mid=(mms+lms)/2;
  const w=inner?(RD.feat==='hole'?'穴':'溝'):'軸';
  return `${wrong?`<p class="rd-ng">${w}の最大実体寸法は${inner?'小さいほう（下の許容寸法）':'大きいほう（上の許容寸法）'}の寸法。入力が逆になっている。</p>`:''}
  <table class="nt qref"><thead><tr><th>${w}の実寸法</th><th>許される幾何公差</th></tr></thead><tbody>
   <tr><th>${rdFmt(mms)}（最大実体寸法）</th><td><b>${RD.dia?'φ':''}${rdFmt(t)}</b>${t===0?'（ゼロ幾何公差）':''}</td></tr>
   <tr><th>${rdFmt(mid)}</th><td>${RD.dia?'φ':''}${rdFmt(t+Math.abs(mid-mms))}</td></tr>
   <tr><th>${rdFmt(lms)}（最小実体寸法）</th><td>${RD.dia?'φ':''}${rdFmt(t+bon)}（最大）</td></tr></tbody></table>
  <p>実効寸法：${inner?'MMS − t':'MMS ＋ t'} ＝ <b>${rdFmt(vc)}</b>。${['pos','perp','par','ang','str'].includes(RD.sym)?`機能ゲージは${RD.feat==='slot'?'この幅のブロック':inner?'このピン径':'この穴径'}で作れる（${inner?'ゲージが入れば':'ゲージに入れば'}幾何公差は合格。サイズは別に測る）。`:''}</p>`;
}
function rdOut(){
  const s=RD.sym,D=rdDlist(),iss=rdIssues(),grp=RD_GRP[s];
  const fig=figQ(['fcf',{sym:s,tol:rdTolText(),dats:D,cap:'組み立てた公差記入枠'}]);
  const dtx=['最初に部品を当てる面・形体。いちばん多くの自由度を止める','第1次に当てた状態のまま、次に当てる','最後に当てて、残りの自由度を止める'];
  const datHTML=D.length?`<ul class="rdl">${D.map((x,i)=>`<li><b>第${i+1}次 ${esc(optText(x))}</b>：${x.startsWith('A-B')?'2つの形体から作る1本の共通の軸線・平面。A と B に優先順位はない':dtx[i]}${/\(M\)/.test(x)?'。Ⓜ 付きなので、データム形体の実寸法に応じて基準がずれてよい（データムシフト）':''}</li>`).join('')}</ul>
   <p class="note">データムの順序は、図の文字の順ではなく、組立て・機能で当たる順に合わせる。${grp==='orient'?'姿勢公差なので、データムは向きだけを決め、位置は決めない。':''}</p>`:`<p>データムなし。${grp==='form'?'形状公差なので、形だけを規制する（向き・位置は自由）。':grp==='prof'?'形だけを規制し、位置・姿勢は自由。':''}</p>`;
  const ngs=iss.filter(x=>x[0]==='ng'),warns=iss.filter(x=>x[0]==='warn');
  return `${fig}
  <section class="panel rd">
   ${iss.length?`<div class="rd-iss">${ngs.map(x=>`<p class="rd-ng"><b>誤り</b>${esc(x[1])}</p>`).join('')}${warns.map(x=>`<p class="rd-warn"><b>注意</b>${esc(x[1])}</p>`).join('')}</div>`:`<p class="rd-ok"><b>不適切な点は見つかりませんでした</b>（記号・φ・Ⓜ・データムの組合せの範囲で確認）</p>`}
   <h3>この指示の意味</h3>
   <p class="rd-main">${esc(rdTarget())}は、${esc(rdZone())}${/以内$/.test(rdZone())?'でなければならない':'になければならない'}。</p>
   ${grp==='prof'?`<p class="note">${D.length?'データム系に対して、輪郭の形だけでなく位置・姿勢も固定される。':'データムがないので、形だけを規制する（位置・姿勢は自由に合わせて評価する）。'}</p>`:''}
   ${s==='run'?'<p class="note">半径方向に指示すると同心2円、端面に指示すると軸方向に距離 '+esc(RD.tol)+' の2円が、各測定位置の公差域になる。</p>':''}${s==='trun'?'<p class="note">端面に指示した場合は、データム軸線に直角な距離 '+esc(RD.tol)+' の2平面のあいだになる。</p>':''}
   <p class="note">分類：${RD_GNAME[grp]}（${esc(SYMN[s])}）${['pos','lprof','sprof','ang'].includes(s)&&D.length?'。真位置・理想輪郭・角度は、枠で囲んだ理論的に正確な寸法で決める（± の公差は付けない）':''}</p>
   <h3>データム</h3>${datHTML}
   ${RD.m&&rdSize()?`<h3>最大実体公差方式（Ⓜ）</h3>${rdMMC()}`:''}
   <h3>測り方の例</h3><ul class="rdl">${(RD_MEAS[s]||[]).map(x=>`<li>${esc(x)}</li>`).join('')}${RD.m&&rdSize()&&['pos','perp','par','ang','str'].includes(s)?`<li>Ⓜ 付きなので、実効寸法で作った機能ゲージ（${RD.feat==='slot'?'ブロック':RD.feat==='hole'?'固定ピン':'穴'}）でも検査できる</li>`:''}</ul>
   <div class="actions" style="margin-top:10px"><button class="btn ghost sm" data-rdq="${grp}">${RD_GNAME[grp]}の問題を解く</button>${RD.m?`<button class="btn ghost sm" data-rdq="mmc">Ⓜ の問題を解く</button>`:''}</div>
  </section>`;
}
function readerHTML(){
  const dsel=(k,lbl)=>`<label class="rdsel"><span>${lbl}</span><select data-rdin="${k}">${RD_DATS.map(v=>`<option value="${v}"${RD[k]===v?' selected':''}>${esc(optText(v))}</option>`).join('')}</select></label>`;
  return `<h2>記入枠を読む</h2>
  <p class="note" style="margin-top:0">公差記入枠を組むと、指示の意味・公差域・データムの役割・測り方を表示し、不適切な組合せを指摘します。図面の確認や、仕入先への説明の下書きに使えます。</p>
  <div class="panel rdin">
   <div class="lbl">指示する形体</div>
   <div class="seg" style="flex-wrap:wrap;margin:4px 0 10px">${RD_FEAT.map(([v,l])=>`<button data-rdset="feat" data-val="${v}" aria-pressed="${RD.feat===v}">${l}</button>`).join('')}</div>
   <div class="lbl">幾何特性</div>
   <div class="rdsym">${RD_SYMS.map(k=>`<button data-rdset="sym" data-val="${k}" aria-pressed="${RD.sym===k}" title="${esc(SYMN[k])}">${symSVG(k)}</button>`).join('')}</div>
   <p class="note" style="margin:4px 0 10px">${esc(SYMN[RD.sym])}</p>
   <div class="lbl">公差値</div>
   <div class="rdtol"><button class="chip" data-rdset="dia" aria-pressed="${RD.dia}">φ</button><input type="text" inputmode="decimal" data-rdin="tol" value="${esc(RD.tol)}" aria-label="公差値"><button class="chip" data-rdset="m" aria-pressed="${RD.m}">Ⓜ</button></div>
   <div class="lbl" style="margin-top:10px">データム</div>
   <div class="rddat">${dsel('d1','第1次')}${dsel('d2','第2次')}${dsel('d3','第3次')}</div>
   ${RD.m&&rdSize()?`<div class="lbl" style="margin-top:10px">サイズ（ボーナス公差の計算用）</div><div class="rddat"><label class="rdsel"><span>最大実体寸法</span><input type="text" inputmode="decimal" data-rdin="mms" value="${esc(RD.mms)}"></label><label class="rdsel"><span>最小実体寸法</span><input type="text" inputmode="decimal" data-rdin="lms" value="${esc(RD.lms)}"></label></div>`:''}
  </div>
  <div id="rdout">${rdOut()}</div>`;
}
// 形体を変えたときに、よくある組合せに寄せる（穴・軸は φ を付け、平面・曲面は外す）
function rdSet(k,v){
  if(k==='dia'||k==='m'){RD[k]=!RD[k];return;}
  RD[k]=v;
  if(k==='feat'){RD.dia=(v==='hole'||v==='shaft')&&['pos','coax','str','par','perp','ang'].includes(RD.sym);if(!rdSize())RD.m=false;
    if(v==='shaft'&&rdNum(RD.mms)!=null&&rdNum(RD.lms)!=null&&rdNum(RD.mms)<rdNum(RD.lms))[RD.mms,RD.lms]=[RD.lms,RD.mms];
    if((v==='hole'||v==='slot')&&rdNum(RD.mms)!=null&&rdNum(RD.lms)!=null&&rdNum(RD.mms)>rdNum(RD.lms))[RD.mms,RD.lms]=[RD.lms,RD.mms];}
  if(k==='sym'){const g=RD_GRP[v];
    RD.dia=(RD.feat==='hole'||RD.feat==='shaft')&&['pos','coax'].includes(v)||(RD.dia&&['str','par','perp','ang'].includes(v)&&RD.feat!=='plane');
    if(['circ','cyl','lprof','sprof','run','trun'].includes(v))RD.m=false;
    if(g==='form'){RD.d1=RD.d2=RD.d3='—';}
    else if(g==='orient'||g==='run'||v==='coax'||v==='sym'){if(RD.d1==='—')RD.d1='A';RD.d2=RD.d3='—';}
    else if(v==='pos'&&RD.d1==='—'){RD.d1='A';RD.d2='B';RD.d3='C';}}
}
