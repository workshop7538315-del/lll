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
a=arena({},[[3,0],[2,0]]);const ev=P(a,'dive',{x:3,y:1});ok(a.u.y===1&&a.f.hp===45&&a.G.units[2].hp===45,'dive');ok(ev.some(e=>e.t==='swing'),'dive anim');
a=arena({});P(a,'scorch',{x:3,y:1});ok(a.G.cells[1][3].t==='fire'&&a.G.cells[1][2].t==='fire','scorch');
a=arena({});P(a,'icewall',{x:2,y:2});ok(a.G.cells[2][2].t==='block'&&a.u.block===3,'icewall');
a=arena({},[[3,1]]);P(a,"pincer",{x:3,y:1});ok(a.f.y===2,'pincer');
a=arena({});a.u.mana=0;P(a,'timewarp',{x:3,y:3});ok(a.u.mana===2,'timewarp');
// 固有システム
a=arena({retainGuard:25});a.u.block=40;R.startTurn(a.G,a.u);ok(a.u.block===25,'retainGuard');
a=arena({hpCost:3},[[3,2]]);a.u.mana=0;ok(R.canPlay(a.G,a.u,R.CARDS.slash),'hpCost可');P(a,'slash',{x:3,y:2});ok(a.u.hp===27&&a.u.mana===0&&a.f.hp===44,'hpCost支払い');a=arena({hpCost:3});a.u.mana=0;a.u.hp=3;ok(!R.canPlay(a.G,a.u,R.CARDS.slash),'hpCost致死不可');a=arena({});a.u.mana=0;ok(!R.canPlay(a.G,a.u,R.CARDS.slash),'hpCostなし');
a=arena({combo:3},[[3,2]]);P(a,'bolt',{x:3,y:2});ok(a.f.hp===46&&a.u.nextAtk===3,'combo魔法');a.u.mana=3;P(a,'slash',{x:3,y:2});ok(a.f.hp===46-9&&a.u.nextAtk===0,'combo武器強化');ok(R.costOf(a.u,R.CARDS.bolt)===0,'combo無料');P(a,'bolt',{x:3,y:2});ok(a.u.mana===2,'combo無料消費');ok(R.costOf(a.u,R.CARDS.fireball)===2,'combo切替え');
a=arena({},[[3,2]]);a.u.hand=['soar'];R.play(a.G,a.u,0,{x:3,y:0});ok(a.u.air&&!R.canPlay(a.G,a.u,R.CARDS.slash),'soar空中');ok(!R.targets(a.G,a.f,R.CARDS.stab).length,'soar回避');a.f.y=1;R.startTurn(a.G,a.u);ok(!a.u.air&&a.u.y===0&&a.f.hp===42,'soar降下');
a=arena({wallDmg:0,collide:6},[[3,2],[3,1]]);P(a,'buttstrike',{x:3,y:2});ok(a.G.units[2].hp===44&&a.f.hp===44,'collide');
a=arena({},[[3,1]]);P(a,'swap',{x:3,y:1});ok(a.u.y===1&&a.f.y===3&&a.f.hp===47,'swap');
a=arena({overwatch:5},[[3,0]]);a.u.mana=2;R.endTurn(a.G,a.u);ok(a.u.over===2,'over溜め');a.f.hand=['walk'];R.play(a.G,a.f,0,{x:3,y:1});ok(a.f.hp===45&&a.u.over===1,'over発動');a.f.hand=['tiptoe'];R.play(a.G,a.f,0,{x:3,y:2});ok(a.f.hp===40&&a.u.over===0,'over2回');R.startTurn(a.G,a.u);ok(a.u.over===0,'overリセット');
a=arena({spread:1,burnPlus:0},[[3,1],[4,1]]);P(a,'ignite',{x:3,y:1});R.startTurn(a.G,a.f);ok(a.G.units[2].status.burn===1,'spread');
a=arena({});P(a,'deepfreeze',{x:3,y:1});ok(a.f.status.freeze===1&&R.skipsTurn(a.f)&&!R.skipsTurn(a.f),'freeze');a=arena({});a.f.boss=1;P(a,'deepfreeze',{x:3,y:1});ok(!a.f.status.freeze&&a.f.status.root===1,'boss拘束');
a=arena({summonAtk:2,summonHp:8});P(a,'raise',{x:3,y:2});const al=a.G.units[2];ok(al&&al.side==='hero'&&al.summon&&al.status.str===2&&al.maxHp===25,'summon');P(a,'raise',{x:2,y:3});ok(!R.canPlay(a.G,a.u,R.CARDS.raise),'summon上限');a.u.dead=false;al.dead=true;a.f.dead=true;a.G.units[3].dead=true;ok(R.outcome(a.G)==='win','outcome');a=arena({});P(a,'raise',{x:3,y:2});a.u.dead=true;ok(R.outcome(a.G)==='lose','本体死亡');
a=arena({stillMana:1});R.endTurn(a.G,a.u);R.startTurn(a.G,a.u);ok(a.u.mana===4,'stillMana');P(a,'walk',{x:3,y:1});R.endTurn(a.G,a.u);R.startTurn(a.G,a.u);ok(a.u.mana===3,'stillMana移動');
a=arena({});P(a,'mark',{x:3,y:1});P(a,'bolt',{x:3,y:1});ok(a.f.hp===43,'mark');
a=arena({});P(a,'trap',{x:3,y:1});a.f.x=3;a.f.y=0;a.f.hand=['tiptoe'];R.play(a.G,a.f,0,{x:3,y:1});ok(a.f.hp===41&&a.f.status.root===1&&!a.G.traps.length,'trap');
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
a=arena({});P(a,'deepfreeze',{x:3,y:1});R.skipsTurn(a.f);R.endTurn(a.G,a.f);a.u.mana=3;P(a,'deepfreeze',{x:3,y:1});ok(!a.f.status.freeze&&a.f.status.root===1,'連続凍結不可');
a=arena({cornerAtk:2},[[3,1]]);a.G.cells[0][3].t='block';P(a,'bolt',{x:3,y:1});ok(a.f.hp===44,'壁際');
{const G0=R.setupBattle(0,R.newRun(R.newHero(1,'x','sword',{}),5),5);const f=G0.units[1];ok(f.hand.length===f.handSize,'敵は先に手札を持つ');const before=f.hand.slice();R.startTurn(G0,f);ok(f.hand.join()===before.join(),'予告した手札のまま');R.endTurn(G0,f);ok(f.hand.length===f.handSize,'次の手札を予告');
 const a3=arena({},[[3,1]]);a3.f.hand=['slash','walk'];const m3=R.threatMap(a3.G,a3.f);ok(m3.get('3,2')===6,'隣接の脅威');ok(m3.get('3,3')>=6,'移動込みの脅威');a3.f.status.root=1;const m4=R.threatMap(a3.G,a3.f);ok(!m4.get('3,5'),'拘束中は移動なし')}
a=arena({});a.G.cells[1][3].t='water';a.f.y=2;P(a,'frost',{x:3,y:2});ok(a.G.cells[1][3].t==='water','単体の氷は対象マスのみ');a=arena({});a.G.cells[1][3].t='water';P(a,'blizzard',{x:3,y:0});ok(a.G.cells[1][3].t==='ice','水が凍る');ok(!R.targets(a.G,a.u,R.CARDS.tiptoe).some(t=>t.x===9),'');
a=arena({});a.G.cells[1][2].t='ice';a.G.cells[1][3].t='fire';P(a,'blizzard',{x:3,y:1});ok(a.G.cells[1][3].t==='floor','氷で消火');P(a,'fireball',{x:2,y:1});ok(a.G.cells[1][2].t==='water','火で溶ける');
a=arena({},[[3,1],[5,1]]);a.G.cells[1][4].t='oil';a.G.cells[2][4].t='oil';P(a,'fireball',{x:4,y:2});ok(a.G.cells[1][4].t==='fire'&&a.G.cells[2][4].t==='fire','油の連鎖');ok(a.G.units[2].hp===45,'爆発');
a=arena({},[[3,1],[3,5]]);for(const y of[1,2,3,4,5])a.G.cells[y][4].t='water';P(a,'thunderclap',{x:3,y:1});ok(a.f.hp===46&&a.G.units[2].hp===46,'感電');
a=arena({},[[3,1]]);a.u.y=2;a.G.cells[1][3].t='ice';P(a,'buttstrike',{x:3,y:1});ok(a.f.y===0&&a.f.hp===44,'氷で滑る')||0;
{const rt=R.genRoute(12345);ok(rt.length===R.STAGES.length&&rt[rt.length-1][0]==='boss','道のり');ok(rt.every(f=>f.some(k=>['battle','elite','boss'].includes(k))),'各階に戦闘');const r=R.newRun(R.newHero(1,'x','sword',{}),5);r.cur={kind:'elite'};const G1=R.setupBattle(0,r,5);ok(G1.units.length===4&&G1.units[1].maxHp>R.FOES.goblin.hp,'精鋭');const a0=r.bonus.atk;R.applyBoon(r,'atk');ok(r.bonus.atk===a0+1,'祝福');const hp0=r.maxHp;R.applyBoon(r,'hp');ok(r.maxHp===hp0+10,'祝福HP')}
// デッキ、刻印、ビルド、対戦
{const h=R.newHero(1,'x','sword',{});ok(R.deckIssues(h).length===0,'初期デッキ有効');ok(h.deck.length===12,'初期枚数');
 h.ench.slash='heavy';ok(R.runDeck(h).filter(x=>x==='slash~heavy').length===4,'刻印反映');ok(R.CARDS['slash~heavy'].e[0].v===8&&R.CARDS.slash.e[0].v===6,'刻印が元を変えない');
 for(const [k,r] of Object.entries(R.RUNES))for(const [id,c] of Object.entries(R.CARDS)){if(c.rune||id.includes('~')||c.foe||!r.ok(c))continue;const cid=R.ensureCard(id+'~'+k);const b=arena({},[[3,1],[4,3]]);let ts=R.targets(b.G,b.u,R.CARDS[cid]);if(!ts.length){const c2=arena({},[[3,0]]);ts=R.targets(c2.G,c2.u,R.CARDS[cid]);if(!ts.length)continue;c2.u.hand=[cid];c2.u.mana=3;c2.u.discard=['walk'];try{R.play(c2.G,c2.u,0,ts[0])}catch(e){ok(false,cid+e)}continue}b.u.hand=[cid];b.u.mana=3;b.u.discard=['walk'];try{R.play(b.G,b.u,0,ts[0])}catch(e){ok(false,cid+' '+e.message)}}
 const m=R.CARDS['bolt~light']||R.CARDS[R.ensureCard('bolt~light')];ok(m.c===0,'軽量');ok(R.CARDS[R.ensureCard('bolt~reach')].r.n===5,'長柄');
 h.level=30;h.deck=h.deck.filter(x=>x!=='walk'&&x!=='tiptoe');ok(R.deckIssues(h).length>0,'移動不足');
 h.deck=[...Array(5).fill('slash')];R.trimDeck(h);ok(h.deck.length===4,'所持数で制限');
 const a2=R.newHero(1,'x','spear',{});a2.level=30;R.learn(a2,'spear.root');a2.tree['spear.a.intro']=undefined;delete a2.tree['spear.a.intro'];R.learn(a2,'spear.r1l');R.learn(a2,'spear.a.intro');ok(a2.deck.includes('vault'),'習得で自動追加');R.forget(a2,'spear.a.intro');ok(!a2.deck.includes('vault'),'戻すと除外');
 const b2=R.newHero(1,'x','bow',{});R.learn(b2,'bow.root');b2.level=5;R.learn(b2,'bow.root');const t0=JSON.stringify(b2.tree);R.switchBuild(b2,1);ok(b2.cur===1&&JSON.stringify(b2.tree)===t0,'枠切替でコピー');b2.tree={};b2.deck.pop();R.switchBuild(b2,0);ok(JSON.stringify(b2.tree)===t0&&b2.deck.length===12,'枠復元');
 const eq=R.newHero(1,'x','sword',{});eq.equip={weapon:'sw_iron',armor:'ar_chain',off:'of_buckler',charm:'ch_iron'};ok(R.heroStats(eq).bonus.guard>=3+4,'セット2');const hp2=R.heroStats(eq).maxHp;ok(hp2>=R.CLASSES.sword.hp+9+4+12,'セット3');
 const c1=R.newHero(1,'A','mage',{g:'male'});c1.level=12;c1.ench.bolt='heavy';const o=R.fromCode(JSON.parse(JSON.stringify(R.buildCode(c1))));ok(o.cls==='mage'&&o.level===12&&o.ench.bolt==='heavy','コード往復');try{R.fromCode({v:1,c:'mage',l:{},d:['slash']});ok(false,'不正コード')}catch(e){}
 const bad=R.fromCode({v:1,n:'x',c:'mage',l:{},lv:99,t:{'sword.root':1,'mage.root':9},e:{weapon:'ch_star'},d:Array(14).fill('bolt').concat(['stab','__x']),en:{bolt:'nope'}});ok(bad.level===30&&bad.tree['mage.root']===1&&!bad.tree['sword.root']&&bad.equip.weapon===R.ITEMS?true:bad.equip.weapon==='st_simple','コード検証');ok(!bad.deck.includes('stab')&&!bad.deck.includes('__x'),'敵専用除外');
 const G=R.setupDuel(R.duelRun(R.newHero(1,'a','sword',{})),R.duelRun(R.newHero(2,'b','bow',{})),7);ok(G.units.length===2&&G.units[1].side==='foe'&&G.units[0].maxHp===G.units[1].maxHp+10,'対戦準備');G.turn=99;G.units[0].hp=1;ok(R.duelResult(G)==='lose','判定');}
console.log(fail?fail+'件失敗':'全て成功');process.exit(fail?1:0)
