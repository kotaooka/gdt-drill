// 生成問題・知識問題・総合問題・出題範囲の自己検査と、独立検算用のサンプル出力
// 使い方（リポジトリ直下で）: node tests/test.js
const fs=require('fs');
const src=f=>fs.readFileSync(__dirname+'/../src/'+f,'utf8');
const esc=s=>String(s);
eval(['bank.js','res.js','figs.js','dai.js','syllabus.js','path.js','gen.js'].map(src).join('\n')+';globalThis.SYMP=SYMP;globalThis.G=G;globalThis.KB=KB;globalThis.CATS=CATS;globalThis.DAI=DAI;globalThis.SYL=SYL;globalThis.FIG=FIG;globalThis.FIELDS=FIELDS;globalThis.DIAG=DIAG;globalThis.PATH=PATH;');
let bad=0;const fail=(...a)=>{bad++;if(bad<40)console.log('NG',...a);};
const figOK=spec=>{if(!spec)return true;try{const f=FIG[spec[0]](spec[1]||{});return f&&f.svg&&!/NaN|undefined/.test(f.svg);}catch(e){return false;}};
// 分野の定義
const FKs=new Set(FIELDS.map(f=>f.k));
for(const [k,c] of Object.entries(CATS))if(!FKs.has(c.field))fail('分野が FIELDS にない',k,c.field);
for(const k of FKs)if(!(k in DIAG.n))fail('実力診断の問数がない',k);
// 計算問題：各3,000回生成し、選択肢の重複・非数値・正解の重複・図の不備を検査
for(const [id,g] of Object.entries(G)){if(!CATS[g.cat])fail('cat?',id);
  for(let i=0;i<3000;i++){const r=g.f();
    if(r.ch.length!==(g.judge?2:4))fail('選択肢の数',id,r.ch);
    if(new Set(r.ch).size!==r.ch.length)fail('選択肢の重複',id,r.ch);
    if(r.ch.some(c=>/NaN|undefined|Infinity/.test(c))||/NaN|undefined|Infinity/.test(r.q+r.ex))fail('非数値',id,r.ch,r.q);
    if(!figOK(r.fig)||!figOK(r.exfig))fail('図の不備',id,JSON.stringify(r.fig));}}
// 知識問題
const hashq=s=>{let h=5381;for(const c of s)h=(h*33+c.charCodeAt(0))>>>0;return 'k'+h.toString(36);};const ids=new Set(),qs=new Set();
for(const k of KB){const id=k[4]||hashq(k[1]);
  if(ids.has(id))fail('ID重複',k[1]);ids.add(id);
  if(!CATS[k[0]])fail('cat?',k[0],k[1]);
  if(k[2].length!==4||new Set(k[2]).size!==4)fail('選択肢',k[1]);
  if(qs.has(k[1]))fail('同じ問題文',k[1]);qs.add(k[1]);
  if(!k[3]||!/。/.test(k[3]))fail('解説',k[1]);
  if(!figOK(k[5]))fail('図の不備',k[1]);}
// 総合問題
const KANA='アイウエオカキクケコサシスセソタチツテト';const seen=new Set();
for(const s of DAI){
  if(seen.has(s.id))fail('id重複',s.id);seen.add(s.id);
  if(!CATS[s.cat])fail('cat?',s.id);
  if(!figOK(s.fig))fail('図の不備',s.id);
  if(s.type==='fcf'){
    // 公差記入枠の組み立て：先頭は記号、2番目は公差値、3番目以降はデータム（または「—」）
    if(s.ans.length<3||s.ex.length!==s.ans.length)fail('fcf の区画数・解説数',s.id);
    if(new Set(s.opts).size!==s.opts.length)fail('選択肢重複',s.id);
    s.opts.forEach(o=>{if(o[0]==='@'&&!SYMP[o.slice(1)])fail('記号がない',s.id,o);});
    if(s.ans.some(a=>a<0||a>=s.opts.length))fail('正解範囲外',s.id);
    else{const R=s.rows||[s.ans.map((_,j)=>j)],o=j=>s.opts[s.ans[j]],isS=j=>o(j)[0]==='@',isT=j=>/^(φ)?[\d.]+(\([MLP]\))?$/.test(o(j)),isD=j=>/^([A-Z](-[A-Z])?(\([MLP]\))?|—)$/.test(o(j));
      const flat=R.flat();if(flat.length!==s.ans.length||new Set(flat).size!==flat.length||flat.some(j=>j<0||j>=s.ans.length))fail('rows が区画と合わない',s.id);
      R.forEach((r,i)=>{const sym=!(s.composite&&i>0);
        if(sym&&!isS(r[0]))fail('段の先頭が記号でない',s.id,i);
        const rest=sym?r.slice(1):r;if(!isT(rest[0]))fail('公差値の区画でない',s.id,i);if(rest.slice(1).some(j=>!isD(j)))fail('データムの区画',s.id,i);
        if(!sym&&isS(r[0]))fail('複合の下段に記号',s.id,i);});}
    continue;}
  if(s.type==='ox'){for(const it of s.items)if(typeof it[1]!=='boolean'||!it[2]||(it[3]&&!CATS[it[3]])||(it[3]&&CATS[it[3]].field!==CATS[s.cat].field))fail('ox不備',s.id,it[0]);continue;}
  const nums=[...new Set((s.stem.match(/\{(\d+)\}/g)||[]).map(x=>+x.slice(1,-1)))].sort((a,b)=>a-b);
  if(nums.length!==s.ans.length||nums.some((n,i)=>n!==i+1))fail('空欄数不一致',s.id);
  if(s.ex.length!==s.ans.length)fail('解説数不一致',s.id);
  if(new Set(s.opts).size!==s.opts.length)fail('選択肢重複',s.id);
  if(s.opts.length>KANA.length||s.ans.some(a=>a<0||a>=s.opts.length))fail('正解範囲外',s.id);}
// 出題範囲：すべての項目に問題が割り当てられているか
const txt=[];KB.forEach(k=>txt.push({cat:k[0],t:k[1]+' '+k[2].join(' ')+' '+k[3]}));
const optT=o=>o[0]==='@'?'記号：'+o.slice(1):o;
DAI.forEach(d=>{if(d.type==='ox')d.items.forEach(i=>txt.push({cat:i[3]||d.cat,t:i[0]+' '+i[2]}));else d.ans.forEach((a,k)=>txt.push({cat:d.cat,t:d.stem+' '+optT(d.opts[a])+' '+d.ex[k]}));});
let nitems=0;
for(const g of SYL){if(!FKs.has(g.f))fail('SYL の分野',g.f);for(const [name,lv,re,gens] of g.items){nitems++;
  const ng=(gens||[]).filter(id=>{if(!G[id])fail('未定義のジェネレータ',id);return G[id]&&CATS[G[id].cat].field===g.f;}).length;
  const nk=txt.filter(x=>CATS[x.cat].field===g.f&&re.test(x.t)).length;
  if(ng+nk===0)fail('問題なし:',g.f,g.h,name);
  if(process.env.SHOW)console.log(String(nk).padStart(3),String(ng).padStart(2),g.f,name);}}
// 学習ロード：ステージの分類・大問が存在するか
for(const ch of PATH)for(const sg of ch.stages){(sg.cats||[]).forEach(c=>{if(!CATS[c])fail('ステージの分類',sg.id,c);});(sg.sets||[]).forEach(s=>{if(!seen.has(s))fail('ステージの大問',sg.id,s);});}
const cnt={};for(const k of KB)cnt[k[0]]=(cnt[k[0]]||0)+1;for(const g of Object.values(G))cnt[g.cat+'(生成)']=(cnt[g.cat+'(生成)']||0)+1;
console.log('KB',KB.length,'G',Object.keys(G).length,'DAI',DAI.length,'SYL',nitems,'bad',bad);console.log(JSON.stringify(cnt));
// 独立検算用のサンプル（tests/verify.py が読む）
const out=[];for(const id of ['g_posdev','g_posjudge','g_bonus','g_vc','g_mmcjudge','g_runout','g_gen0419','g_float','g_coax','g_square','g_cmm','g_zero','g_zeroconv','g_parallel','g_trun','g_profjudge','g_gauge','g_clear','g_stack','g_cpkgdt','g_dshift','g_guard','g_jpos','g_jpar','g_jrun','g_jprof'])for(let i=0;i<300;i++){const r=G[id].f();out.push({id,q:r.q,a:r.ch[0],fig:r.fig||null});}
fs.writeFileSync(__dirname+'/samples.json',JSON.stringify(out));
if(bad)process.exit(1);
