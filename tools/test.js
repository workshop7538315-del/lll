// 上級職の効果と全カードの検証
const R=require('../src/rules.js');let fail=0;const ok=(c,m)=>{if(!c){fail++;console.log('NG',m)}};
function arena(tr,foePos=[[3,1]]){const cells=[];for(let y=0;y<7;y++){const r=[];for(let x=0;x<7;x++)r.push({t:'floor',v:.5});cells.push(r)}const G={w:7,h:7,cells,theme:'forest',units:[],R:R.mulberry(1),turn:1};const u={id:0,side:'hero',x:3,y:3,hp:30,maxHp:30,mana:3,maxMana:3,block:0,status:{},hand:[],discard:[],draw:[],exhaust:[],handSize:5,deck:[],t:tr||{},flags:{}};G.units.push(u);foePos.forEach(([x,y],i)=>G.units.push({id:i+1,side:'foe',x,y,hp:50,maxHp:50,mana:3,maxMana:3,block:0,status:{},hand:[],discard:[],draw:[],exhaust:[],handSize:3,deck:[],t:{},flags:{}}));return{G,u,f:G.units[1]}}
const P=(a,id,t)=>{a.u.hand=[id];return R.play(a.G,a.u,0,t)};
let a=arena({endGuard:2});a.u.mana=2;R.endTurn(a.G,a.u);ok(a.u.block===4,'endGuard');
a=arena({lowAtk:3},[[3,2]]);a.u.hp=10;P(a,'slash',{x:3,y:2});ok(a.f.hp===50-9,'lowAtk');
a=arena({killMana:1,killHeal:4,killDraw:1},[[3,2]]);a.f.hp=1;a.u.hp=10;a.u.draw=['slash'];a.u.mana=3;P(a,'slash',{x:3,y:2});ok(a.u.mana===3&&a.u.hp===14&&a.u.hand.length===1,'kill rewards');
a=arena({jumpAtk:4},[[3,0]]);P(a,'leap',{x:3,y:1});P(a,'slash',{x:3,y:0});ok(a.f.hp===50-10,'jumpAtk once');P(a,'slash',{x:3,y:0});ok(a.f.hp===50-16,'jumpAtk consumed');
a=arena({jumpFree:1});ok(R.costOf(a.u,R.CARDS.leap)===0,'jumpFree');P(a,'leap',{x:3,y:1});ok(a.u.mana===3&&R.costOf(a.u,R.CARDS.leap)===1,'jumpFree once');
a=arena({wallDmg:4,pushExtra:1},[[3,1]]);a.u.y=2;a.G.cells[0][3].t='block';P(a,'buttstrike',{x:3,y:1});ok(a.f.hp===50-3-7&&a.f.y===1,'wallDmg');
a=arena({burnPlus:1,fireSafe:1});P(a,'ignite',{x:3,y:1});ok(a.f.status.burn===5,'burnPlus');a.G.cells[3][3].t='fire';R.endTurn(a.G,a.u);ok(a.u.hp===30,'fireSafe');
a=arena({rootDmg:3});a.f.status.root=1;P(a,'shatter',{x:3,y:1});ok(a.f.hp===50-8,'rootDmg');
a=arena({distAtk:3},[[3,0]]);a.u.y=4;P(a,'snipe',{x:3,y:0});ok(a.f.hp===50-14,'distAtk');
a=arena({firstAtk:2},[[3,2]]);P(a,'slash',{x:3,y:2});P(a,'slash',{x:3,y:2});ok(a.f.hp===50-8-6,'firstAtk');
a=arena({moveFree:1});P(a,'walk',{x:3,y:1});ok(a.u.mana===3,'moveFree');P(a,'walk',{x:3,y:0});ok(a.u.mana===2,'moveFree once');
a=arena({moveGuard:2});P(a,'walk',{x:3,y:1});ok(a.u.block===2,'moveGuard');
a=arena({aoeAtk:2},[[3,1]]);P(a,'fireball',{x:3,y:1});ok(a.f.hp===50-8,'aoeAtk');
a=arena({spellCut:1});ok(R.costOf(a.u,R.CARDS.fireball)===1,'spellCut');P(a,'bolt',{x:3,y:1});ok(a.u.mana===3,'spellCut applied');
a=arena({atkGuard:2},[[3,2]]);P(a,'slash',{x:3,y:2});ok(a.u.block===2,'atkGuard');
a=arena({},[[3,2]]);a.f.t={thorns:4};P(a,'slash',{x:3,y:2});ok(a.u.hp===26,'thorns');
a=arena({},[[3,2]]);a.u.block=10;P(a,'shieldbash',{x:3,y:2});ok(a.f.hp===50-8,'shieldbash');
a=arena({},[[3,2]]);P(a,'bloodhit',{x:3,y:2});ok(a.u.hp===27&&a.f.hp===42,'bloodhit');
a=arena({},[[3,0],[2,0]]);const ev=P(a,'dive',{x:3,y:1});ok(a.u.y===1&&a.f.hp===44&&a.G.units[2].hp===44,'dive');ok(ev.some(e=>e.t==='swing'),'dive anim');
a=arena({});P(a,'scorch',{x:3,y:1});ok(a.G.cells[1][3].t==='fire'&&a.G.cells[1][2].t==='fire','scorch');
a=arena({});P(a,'icewall',{x:2,y:2});ok(a.G.cells[2][2].t==='block'&&a.u.block===3,'icewall');
a=arena({},[[3,1]]);P(a,"pincer",{x:3,y:1});ok(a.f.y===2,'pincer');
a=arena({});a.u.mana=0;P(a,'timewarp',{x:3,y:3});ok(a.u.mana===2,'timewarp');
// 固有システム
a=arena({retainGuard:25});a.u.block=40;R.startTurn(a.G,a.u);ok(a.u.block===25,'retainGuard');
a=arena({hpCost:3},[[3,2]]);a.u.mana=0;ok(R.canPlay(a.G,a.u,R.CARDS.slash),'hpCost可');P(a,'slash',{x:3,y:2});ok(a.u.hp===27&&a.u.mana===0&&a.f.hp===44,'hpCost支払い');a=arena({hpCost:3});a.u.mana=0;a.u.hp=3;ok(!R.canPlay(a.G,a.u,R.CARDS.slash),'hpCost致死不可');a=arena({});a.u.mana=0;ok(!R.canPlay(a.G,a.u,R.CARDS.slash),'hpCostなし');
a=arena({combo:3},[[3,2]]);P(a,'bolt',{x:3,y:2});ok(a.f.hp===46&&a.u.nextAtk===3,'combo魔法');a.u.mana=3;P(a,'slash',{x:3,y:2});ok(a.f.hp===46-9&&a.u.nextAtk===0,'combo武器強化');ok(R.costOf(a.u,R.CARDS.bolt)===0,'combo無料');P(a,'bolt',{x:3,y:2});ok(a.u.mana===2,'combo無料消費');ok(R.costOf(a.u,R.CARDS.fireball)===2,'combo切替え');
a=arena({},[[3,2]]);a.u.hand=['soar'];R.play(a.G,a.u,0,{x:3,y:0});ok(a.u.air&&!R.canPlay(a.G,a.u,R.CARDS.slash),'soar空中');ok(!R.targets(a.G,a.f,R.CARDS.stab).length,'soar回避');a.f.y=1;R.startTurn(a.G,a.u);ok(!a.u.air&&a.u.y===0&&a.f.hp===41,'soar降下');
a=arena({wallDmg:0,collide:6},[[3,2],[3,1]]);P(a,'buttstrike',{x:3,y:2});ok(a.G.units[2].hp===44&&a.f.hp===44,'collide');
a=arena({},[[3,1]]);P(a,'swap',{x:3,y:1});ok(a.u.y===1&&a.f.y===3&&a.f.hp===47,'swap');
a=arena({overwatch:5},[[3,0]]);a.u.mana=2;R.endTurn(a.G,a.u);ok(a.u.over===2,'over溜め');a.f.hand=['walk'];R.play(a.G,a.f,0,{x:3,y:1});ok(a.f.hp===45&&a.u.over===1,'over発動');a.f.hand=['tiptoe'];R.play(a.G,a.f,0,{x:3,y:2});ok(a.f.hp===40&&a.u.over===0,'over2回');R.startTurn(a.G,a.u);ok(a.u.over===0,'overリセット');
a=arena({spread:1,burnPlus:0},[[3,1],[4,1]]);P(a,'ignite',{x:3,y:1});R.startTurn(a.G,a.f);ok(a.G.units[2].status.burn===1,'spread');
a=arena({});P(a,'deepfreeze',{x:3,y:1});ok(a.f.status.freeze===1&&R.skipsTurn(a.f)&&!R.skipsTurn(a.f),'freeze');a=arena({});a.f.boss=1;P(a,'deepfreeze',{x:3,y:1});ok(!a.f.status.freeze&&a.f.status.root===1,'boss拘束');
a=arena({summonAtk:2,summonHp:8});P(a,'raise',{x:3,y:2});const al=a.G.units[2];ok(al&&al.side==='hero'&&al.summon&&al.status.str===2&&al.maxHp===25,'summon');P(a,'raise',{x:2,y:3});ok(!R.canPlay(a.G,a.u,R.CARDS.raise),'summon上限');a.u.dead=false;al.dead=true;a.f.dead=true;a.G.units[3].dead=true;ok(R.outcome(a.G)==='win','outcome');a=arena({});P(a,'raise',{x:3,y:2});a.u.dead=true;ok(R.outcome(a.G)==='lose','本体死亡');
a=arena({stillMana:1});R.endTurn(a.G,a.u);R.startTurn(a.G,a.u);ok(a.u.mana===4,'stillMana');P(a,'walk',{x:3,y:1});R.endTurn(a.G,a.u);R.startTurn(a.G,a.u);ok(a.u.mana===3,'stillMana移動');
a=arena({});P(a,'mark',{x:3,y:1});P(a,'bolt',{x:3,y:1});ok(a.f.hp===43,'mark');
a=arena({});P(a,'trap',{x:3,y:1});a.f.x=3;a.f.y=0;a.f.hand=['tiptoe'];R.play(a.G,a.f,0,{x:3,y:1});ok(a.f.hp===44&&a.f.status.root===1&&!a.G.traps.length,'trap');
a=arena({bounce:1},[[3,1],[4,1]]);P(a,'bolt',{x:3,y:1});ok(a.f.hp===46&&a.G.units[2].hp===48,'bounce');
// カード定義の全数実行
for(const [id,c] of Object.entries(R.CARDS)){let b=arena({},[[3,1],[4,3],[3,2]]);let ts=R.targets(b.G,b.u,c);if(!ts.length){b=arena({},[[3,0]]);ts=R.targets(b.G,b.u,c)}b.u.hand=[id];b.u.mana=3;b.u.discard=['walk','walk'];ok(ts.length,'対象なし '+id);if(!ts.length)continue;try{R.play(b.G,b.u,0,ts[0])}catch(e){ok(false,'throw '+id+' '+e.message)}}
// ツリーの整合
for(const [k,t] of Object.entries(R.TREES)){const ids=new Set(t.map(n=>n.id));const seen=new Set;for(const n of t){const q=n.r+','+n.c;ok(!seen.has(q),'重複位置 '+n.id);seen.add(q);n.req.forEach(r=>ok(ids.has(r),'req '+n.id));if(n.card)ok(R.CARDS[n.card],'card '+n.id)}
 const h=R.newHero(1,'x',k,{});h.level=30;const cls=t.filter(n=>n.group==='adv');ok(cls.length===3,'3択 '+k);ok(new Set(cls.map(n=>n.uniq)).size===3&&cls.every(n=>n.uniq),'固有名 '+k);
 for(let again=true;again;){again=false;for(const n of t)if(n.id.includes('.a.')||!/\.[bc]\./.test(n.id))if(R.canLearn(h,n.id)&&n.r<=6){R.learn(h,n.id);again=true}}
 ok(h.tree[cls[0].id],'転職A '+k);ok(!R.canLearn(h,cls[1].id)&&!R.canLearn(h,cls[2].id),'排他 '+k);ok(R.perkLeft(h)>=0,'点数 '+k);
 ok(!R.canForget(h,cls[0].id)||!t.some(n=>n.req.includes(cls[0].id)&&h.tree[n.id]),'戻す順序 '+k);
 const m=t.find(n=>n.id===k+'.a.mas');console.log(k,'習得',Object.keys(h.tree).length,'残',R.perkLeft(h),R.jobName(h),'最上級到達',!!h.tree[m.id]);
 const h2=R.newHero(2,'x',k,{});h2.level=9;for(const id of [k+'.root',k+'.r1l',k+'.a.intro'])R.learn(h2,id);ok(!R.canLearn(h2,k+'.a.cls'),'Lv10制限 '+k);h2.level=10;ok(R.canLearn(h2,k+'.a.cls'),'Lv10で転職 '+k);
}
console.log(fail?fail+'件失敗':'全て成功');process.exit(fail?1:0)
