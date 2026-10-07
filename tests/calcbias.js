// 計算問題の選択肢の偏りを測る：数値で並べたときの正解の順位（最小・2番目・3番目・最大）の分布
const fs=require('fs');globalThis.esc=s=>String(s);
eval(['bank.js','res.js','figs.js','gen.js'].map(f=>fs.readFileSync(__dirname+'/../src/'+f,'utf8')).join('\n')+';globalThis.G=G;');
const num=s=>{const m=String(s).replace(/,/g,'').match(/−?-?\d+(\.\d+)?/);return m?parseFloat(m[0].replace('−','-')):NaN;};
const tot=[0,0,0,0];let n=0,nonnum=0;const per={};
for(const [k,g] of Object.entries(G)){if(g.nocalc)continue;const r=[0,0,0,0];let c=0;
  for(let t=0;t<200;t++){const o=g.f();const v=o.ch.map(num);if(v.some(isNaN)||new Set(v).size<4){nonnum++;continue;}
    const sorted=[...v].sort((a,b)=>a-b);r[sorted.indexOf(v[0])]++;c++;}
  if(c){r.forEach((x,i)=>tot[i]+=x/c);n++;per[k]=r.map(x=>Math.round(x/c*100));}}
console.log('生成器',n,'順位分布（最小,2番,3番,最大）%:',tot.map(x=>(x/n*100).toFixed(1)).join(' / '),' 非数値/同値の試行',nonnum);
if(process.env.SHOW)for(const[k,v]of Object.entries(per))if(Math.max(...v)>=60)console.log(k,v.join('/'));
// 追加の戦略：他の3つの平均に最も近い選択肢／他と最も離れた選択肢を選ぶ
{let a=0,b=0,c=0;for(const g of Object.values(G))for(let t=0;t<200;t++){const v=g.f().ch.map(num);if(v.some(isNaN)||new Set(v).size<4)continue;c++;
 const m=v.reduce((x,y)=>x+y)/4;const d=v.map(x=>Math.abs(x-m));const sc=v.map((x,i)=>v.reduce((s,y,j)=>s+(i===j?0:Math.abs(Math.log(Math.abs(x)+1e-9)-Math.log(Math.abs(y)+1e-9))),0));
 // 同点のときは等分して数える（選択肢は画面でシャッフルされるので、先頭が有利になることはない）
 const eq=(arr)=>{const m=Math.min(...arr),k=arr.filter(x=>Math.abs(x-m)<1e-9).length;return Math.abs(arr[0]-m)<1e-9?1/k:0;};a+=eq(d);b+=eq(sc);}
 console.log('平均に最も近いものを選ぶ：',(a/c*100).toFixed(1)+'%','他の選択肢との距離の和が最小のものを選ぶ：',(b/c*100).toFixed(1)+'%');}
