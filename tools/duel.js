// 職業どうしをAIで戦わせ、相性を見る。 node tools/duel.js [対戦数] [Lv]
const R=require('../src/rules.js');const N=+process.argv[2]||10,LV=+process.argv[3]||30;
const rnd=R.mulberry(9);
const pri=n=>{const s=n.id.split('.')[1];return s.length===1||/\.(root|r1l|r1r|r1c)$/.test(n.id)?0:1};
function mk(cls,side){const h=R.newHero(1,cls+side,cls,{});h.level=LV;const ns=R.TREES[cls].slice().sort((a,b)=>(pri(a)-pri(b))||(a.r-b.r));for(let g=true;g;){g=false;for(const n of ns){const s=n.id.split('.')[1];if(s.length===1&&s!==side)continue;if(R.canLearn(h,n.id)){R.learn(h,n.id);g=true}}}return h}
function fight(a,b,seed){const G=R.setupDuel(R.duelRun(a),R.duelRun(b),seed);for(;;){for(const u of G.units){if(u.dead)continue;R.startTurn(G,u);if(R.outcome(G))return R.outcome(G);if(R.skipsTurn(u)){R.endTurn(G,u);continue}let m,g=0;while(!u.dead&&(m=R.chooseAI(G,u))&&g++<12){R.play(G,u,m.i,m.t);if(R.outcome(G))return R.outcome(G)}R.endTurn(G,u);if(R.outcome(G))return R.outcome(G)}G.turn++;const r=R.duelResult(G);if(r)return r}}
const js=[];for(const c of Object.keys(R.CLASSES))for(const s of['a','b','c'])js.push(mk(c,s));
const W=js.map(()=>0),T=js.map(()=>0),pairs=[];
js.forEach((a,i)=>js.forEach((b,j)=>{if(i>=j)return;let w=0;for(let k=0;k<N*2;k++){const swap=k%2;const r=swap?fight(b,a,Math.floor(rnd()*1e8)):fight(a,b,Math.floor(rnd()*1e8));const aw=r==='draw'?.5:(r==='win')!==!!swap?1:0;w+=aw}W[i]+=w;W[j]+=N*2-w;T[i]+=N*2;T[j]+=N*2;pairs.push([R.jobName(a),R.jobName(b),Math.round(w/(N*2)*100)])}));
js.map((a,i)=>[R.jobName(a),Math.round(W[i]/T[i]*100)]).sort((x,y)=>y[1]-x[1]).forEach(x=>console.log(x[0],x[1]+'%'));
pairs.sort((a,b)=>Math.abs(b[2]-50)-Math.abs(a[2]-50));console.log('極端な相性:',pairs.slice(0,8).map(p=>`${p[0]} vs ${p[1]} ${p[2]}%`).join(' / '));
