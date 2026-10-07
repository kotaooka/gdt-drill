// 「一番長い選択肢を選ぶ」戦略の期待正答率（同じ長さは等分）と、「一番短い」戦略、否定形設問の割合
const fs=require('fs');
eval(fs.readFileSync(__dirname+'/../src/bank.js','utf8')+';globalThis.KB=KB;');
let L=0,S=0,neg=0;
for(const k of KB){const len=k[2].map(x=>x.length),mx=Math.max(...len),mn=Math.min(...len);
  if(len[0]===mx)L+=1/len.filter(x=>x===mx).length; if(len[0]===mn)S+=1/len.filter(x=>x===mn).length;
  if(/適切でない|含まれない|挙げられていない|当たらない|反する|誤っている|正しくない|合わない|必要でない/.test(k[1]))neg++;}
const n=KB.length;console.log(`${n}問  最長を選ぶ：${(L/n*100).toFixed(1)}%  最短を選ぶ：${(S/n*100).toFixed(1)}%  否定形：${(neg/n*100).toFixed(1)}%（${neg}問）`);
