// ルール本体（DOMに依存しない）
const DIRS4=[[1,0],[-1,0],[0,1],[0,-1]],DIRS8=[...DIRS4,[1,1],[1,-1],[-1,1],[-1,-1]];
const C=(o)=>o;
const dmg=v=>({k:'dmg',v}),block=v=>({k:'block',v}),st=(s,v,self)=>({k:'status',s,v,self:!!self});
const CARDS={
 // 移動
 walk:{n:'歩く',c:1,t:'move',icon:'boot-prints',r:{s:'walk',n:3},aim:'empty',e:[{k:'moveTo'}],d:'3マス歩いて移動する。'},
 tiptoe:{n:'忍び足',c:0,t:'move',icon:'footprint',r:{s:'walk',n:1},aim:'empty',e:[{k:'moveTo'}],d:'1マス移動する。'},
 sprint:{n:'疾走',c:2,t:'move',icon:'run',r:{s:'walk',n:6},aim:'empty',e:[{k:'moveTo'}],d:'6マス歩いて移動する。'},
 leap:{n:'跳躍',c:1,t:'move',icon:'jump-across',r:{s:'leap',n:3},aim:'empty',e:[{k:'moveTo',jump:1}],d:'障害物や敵を飛び越えて、3マス以内へ着地する。'},
 sidestep:{n:'斜め踏み',c:0,t:'move',icon:'sprint',r:{s:'diag',n:2},aim:'empty',e:[{k:'moveTo'}],d:'斜めに2マスまで移動する。'},
 knightstep:{n:'変則歩法',c:0,t:'move',icon:'chess-knight',r:{s:'knight'},aim:'empty',e:[{k:'moveTo',jump:1}],d:'桂馬の形に跳ぶ。障害物を越えられる。'},
 blink:{n:'転移',c:1,t:'move',icon:'teleport',r:{s:'leap',n:5},aim:'empty',e:[{k:'moveTo',blink:1}],d:'5マス以内の空きマスへ瞬間移動する。'},
 shadow:{n:'影渡り',c:1,t:'move',icon:'ninja-head',r:{s:'walk',n:4},aim:'empty',e:[{k:'moveTo'},block(4)],d:'4マス移動し、ガード4を得る。'},
 // 剣
 slash:{n:'斬撃',c:1,t:'atk',icon:'broadsword',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[dmg(6)],d:'周囲8マスの敵に6ダメージ。'},
 dashcut:{n:'踏み込み斬り',c:2,t:'atk',move:1,icon:'saber-slash',anim:'weapon',r:{s:'line',n:4,min:2},aim:'enemy',e:[{k:'dash'},dmg(9)],d:'直線4マス以内の敵の前まで走り、9ダメージ。'},
 sweep:{n:'薙ぎ払い',c:2,t:'atk',icon:'whirlwind',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(7)],d:'周囲8マスすべてに7ダメージ。'},
 cleave:{n:'三日月斬り',c:1,t:'atk',icon:'crossed-slashes',anim:'weapon',r:{s:'adj'},aim:'any',a:'fan',e:[dmg(5)],d:'前方3マスに5ダメージ。'},
 hitrun:{n:'一撃離脱',c:1,t:'atk',move:1,icon:'quick-slash',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(5),{k:'retreat',v:2}],d:'隣の敵に5ダメージ、その後2マス下がる。'},
 execute:{n:'断罪',c:3,t:'atk',icon:'bloody-sword',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[dmg(16),st('vuln',1)],d:'周囲の敵に16ダメージ。脆弱1を与える。'},
 // 槍
 thrust:{n:'突き',c:1,t:'atk',icon:'spear-hook',anim:'weapon',r:{s:'line',n:2,pierce:1},aim:'any',a:'pierce',e:[dmg(5)],d:'直線2マスを貫き5ダメージ。'},
 impale:{n:'串刺し',c:2,t:'atk',icon:'thrust',anim:'weapon',r:{s:'line',n:3,pierce:1},aim:'any',a:'pierce',e:[dmg(9)],d:'直線3マスを貫き9ダメージ。'},
 buttstrike:{n:'石突き',c:1,t:'atk',icon:'boot-kick',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(3),{k:'push',v:2}],d:'隣の敵に3ダメージ、2マス押す。壁に当たると+3。'},
 hookpull:{n:'鉤引き',c:1,t:'atk',icon:'grapple',anim:'weapon',r:{s:'line',n:4,min:2},aim:'enemy',e:[dmg(3),{k:'pull',v:3}],d:'直線4マスの敵に3ダメージ、3マス引き寄せる。'},
 vault:{n:'棒高跳び',c:1,t:'atk',move:1,icon:'high-kick',r:{s:'leap',n:3},aim:'empty',e:[{k:'moveTo',jump:1},block(4)],d:'3マス以内へ跳び、ガード4を得る。'},
 // 魔法
 bolt:{n:'魔弾',c:1,t:'atk',icon:'magic-swirl',anim:'spell',fx:'bolt',r:{s:'dia',n:4},aim:'enemy',e:[dmg(4)],d:'射程4の敵に4ダメージ。'},
 fireball:{n:'爆炎',c:2,t:'atk',icon:'fire-bomb',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'any',a:'plus',e:[dmg(6),st('burn',2)],d:'着弾点と上下左右に6ダメージ、火傷2。'},
 frost:{n:'氷縛',c:1,t:'atk',icon:'frozen-orb',anim:'spell',fx:'ice',r:{s:'dia',n:3},aim:'enemy',e:[dmg(2),st('root',1)],d:'2ダメージ。拘束1：次の手番、移動カードを使えない。'},
 meteor:{n:'隕石',c:3,t:'atk',icon:'meteor-impact',anim:'spell',fx:'fire',r:{s:'dia',n:6,nolos:1},aim:'any',a:'sq',e:[dmg(11)],d:'射程6（遮蔽無視）の3×3に11ダメージ。'},
 chain:{n:'雷鎖',c:2,t:'atk',icon:'chain-lightning',anim:'spell',fx:'bolt',r:{s:'star',n:5},aim:'any',a:'pierce',e:[dmg(6)],d:'8方向いずれかの直線5マスを貫き6ダメージ。'},
 gust:{n:'烈風',c:1,t:'atk',icon:'wind-slap',anim:'spell',fx:'bolt',r:{s:'self'},aim:'self',a:'around',e:[dmg(1),{k:'push',v:2}],d:'周囲8マスに1ダメージ、外へ2マス押す。'},
 // 弓
 shot:{n:'射撃',c:1,t:'atk',icon:'bow-arrow',anim:'weapon',fx:'arrow',r:{s:'star',n:4,min:2},aim:'enemy',e:[dmg(5)],d:'8方向の直線、距離2〜4の敵に5ダメージ。'},
 snipe:{n:'狙撃',c:2,t:'atk',icon:'arrow-scope',anim:'weapon',fx:'arrow',r:{s:'line',n:8,min:3},aim:'enemy',e:[dmg(11)],d:'縦横の直線、距離3〜8の敵に11ダメージ。'},
 rain:{n:'矢の雨',c:2,t:'atk',icon:'arrow-cluster',anim:'weapon',fx:'arrow',r:{s:'dia',n:5,min:2,nolos:1},aim:'any',a:'sq',e:[dmg(4)],d:'射程2〜5（遮蔽無視）の3×3に4ダメージ。'},
 pin:{n:'足縫い',c:1,t:'atk',icon:'barbed-arrow',anim:'weapon',fx:'arrow',r:{s:'star',n:4,min:1},aim:'enemy',e:[dmg(2),st('root',1)],d:'2ダメージ。拘束1を与える。'},
 kickoff:{n:'蹴り跳び',c:1,t:'atk',move:1,icon:'boot-stomp',r:{s:'adj'},aim:'enemy',e:[dmg(2),{k:'retreat',v:3}],d:'隣の敵に2ダメージ、3マス下がる。'},
 fire_arrow:{n:'火矢',c:1,t:'atk',icon:'flaming-arrow',anim:'weapon',fx:'fire',r:{s:'star',n:5,min:2},aim:'enemy',e:[dmg(3),st('burn',3)],d:'距離2〜5の敵に3ダメージ、火傷3。'},
 // 補助
 guard:{n:'防御',c:1,t:'skill',icon:'checked-shield',r:{s:'self'},aim:'self',e:[block(6)],d:'ガード6を得る（次の自分の手番まで）。'},
 ward:{n:'魔力障壁',c:1,t:'skill',icon:'magic-shield',anim:'spell',r:{s:'self'},aim:'self',e:[block(5),{k:'draw',v:1}],d:'ガード5を得て、1枚引く。'},
 iron:{n:'鉄壁',c:2,t:'skill',icon:'bordered-shield',r:{s:'self'},aim:'self',e:[block(13)],d:'ガード13を得る。'},
 focus:{n:'集中',c:0,t:'skill',icon:'meditation',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'draw',v:2}],once:1,d:'2枚引く。戦闘中1回。'},
 surge:{n:'魔力解放',c:0,t:'skill',icon:'lightning-frequency',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'mana',v:1}],once:1,d:'マナ+1（このターンだけ上限を超える）。戦闘中1回。'},
 rally:{n:'鼓舞',c:1,t:'skill',icon:'muscle-up',anim:'spell',r:{s:'self'},aim:'self',e:[st('str',2,1)],once:1,d:'この戦闘中、攻撃+2。戦闘中1回。'},
 salve:{n:'傷薬',c:1,t:'skill',icon:'health-potion',r:{s:'self'},aim:'self',e:[{k:'heal',v:8}],once:1,d:'HPを8回復。戦闘中1回。'},
 // 敵専用
 bite:{n:'噛みつき',c:1,t:'atk',icon:'fangs',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(5),st('weak',1)],d:'5ダメージ。衰弱1。',foe:1},
 shamble:{n:'這いずり',c:1,t:'move',icon:'footprint',r:{s:'walk',n:2},aim:'empty',e:[{k:'moveTo'}],d:'2マス移動。',foe:1},
 stab:{n:'刺す',c:1,t:'atk',icon:'broadsword',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[dmg(4)],d:'4ダメージ。',foe:1},
 club:{n:'叩き潰し',c:2,t:'atk',icon:'broadsword',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(8),{k:'push',v:1}],d:'8ダメージ、1マス押す。',foe:1},
 darkbolt:{n:'闇弾',c:1,t:'atk',icon:'magic-swirl',anim:'spell',fx:'dark',r:{s:'dia',n:4},aim:'enemy',e:[dmg(4)],d:'射程4に4ダメージ。',foe:1},
 hex:{n:'呪い',c:1,t:'atk',icon:'daemon-skull',anim:'spell',fx:'dark',r:{s:'dia',n:4},aim:'enemy',e:[st('vuln',2)],d:'脆弱2を与える。',foe:1},
 bossreap:{n:'死の大薙ぎ',c:3,t:'atk',icon:'whirlwind',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(12)],d:'周囲8マスに12ダメージ。',foe:1},
 bosscharge:{n:'黒騎の突進',c:2,t:'atk',move:1,icon:'saber-slash',anim:'weapon',r:{s:'line',n:5,min:2},aim:'enemy',e:[{k:'dash'},dmg(9)],d:'直線5マスの敵まで走り9ダメージ。',foe:1},
};
const STATUS={burn:{n:'火傷',d:'手番開始時に値ぶんダメージ、1減る',icon:'fire'},root:{n:'拘束',d:'移動カードを使えない',icon:'manacles'},weak:{n:'衰弱',d:'与えるダメージ-25%',icon:'despair'},vuln:{n:'脆弱',d:'受けるダメージ+50%',icon:'cracked-shield'},str:{n:'筋力',d:'与えるダメージに加算',icon:'muscle-up'}};
const CLASSES={
 sword:{n:'剣士',w:'w_sword',hp:46,icon:'broadsword',desc:'近接特化。周囲8マスを斬る。耐久が高い。',deck:['slash','slash','slash','slash','guard','guard','walk','walk','walk','tiptoe','dashcut','sweep']},
 spear:{n:'槍兵',w:'w_spear',hp:40,icon:'spears',desc:'直線を貫き、敵を押して引く間合いの達人。',deck:['thrust','thrust','thrust','thrust','guard','guard','walk','walk','walk','leap','buttstrike','impale']},
 mage:{n:'魔術師',w:'w_staff',hp:32,icon:'wizard-staff',desc:'射程と範囲が広く脆い。転移で逃げる。',deck:['bolt','bolt','bolt','bolt','ward','ward','walk','walk','tiptoe','blink','frost','fireball']},
 bow:{n:'弓手',w:'w_bow',hp:36,icon:'high-shot',desc:'離れるほど強い。隣接されると撃てない。',deck:['shot','shot','shot','shot','guard','walk','walk','walk','sidestep','kickoff','pin','snipe']},
};
const REWARD=['sprint','leap','sidestep','knightstep','blink','shadow','slash','dashcut','sweep','cleave','hitrun','execute','thrust','impale','buttstrike','hookpull','vault','bolt','fireball','frost','meteor','chain','gust','shot','snipe','rain','pin','kickoff','fire_arrow','guard','ward','iron','focus','surge','rally','salve'];
const CLASS_POOL={sword:['slash','dashcut','sweep','cleave','hitrun','execute','iron','rally','shadow','sprint','knightstep','focus','salve','buttstrike'],spear:['thrust','impale','buttstrike','hookpull','vault','leap','iron','rally','sprint','knightstep','focus','salve','shadow'],mage:['bolt','fireball','frost','meteor','chain','gust','ward','blink','focus','surge','salve','shadow','knightstep'],bow:['shot','snipe','rain','pin','kickoff','fire_arrow','sidestep','leap','sprint','focus','surge','salve','guard','shadow']};
const FOES={
 goblin:{n:'ゴブリン',hp:13,hand:2,pref:1,deck:['stab','stab','stab','walk','walk','tiptoe'],look:{g:'male',skin:'green',head:'head_goblin',top:'top_short',topc:'brown',legc:'walnut',w:'w_sword'}},
 zombie:{n:'亡者',hp:22,hand:2,pref:1,deck:['bite','bite','shamble','shamble','shamble','stab'],look:{g:'male',body:'zombie',head:'head_zombie',top:'top_short',topc:'gray',legc:'charcoal'}},
 skel:{n:'骸骨兵',hp:17,hand:2,pref:1,deck:['slash','slash','stab','walk','walk','guard'],look:{g:'male',body:'skeleton',head:'head_skel',w:'w_sword'}},
 archer:{n:'骸骨弓兵',hp:13,hand:2,pref:4,deck:['shot','shot','shot','walk','walk','tiptoe'],look:{g:'male',body:'skeleton',head:'head_skel',w:'w_bow',hat:'hat_hood',hatc:'charcoal'}},
 orc:{n:'オーク',hp:26,hand:3,pref:1,deck:['club','club','stab','walk','walk','guard'],look:{g:'male',skin:'green',head:'head_orc',top:'top_leather',legc:'brown',feet:'boots',w:'w_spear'}},
 cultist:{n:'邪教徒',hp:15,hand:2,pref:3,deck:['darkbolt','darkbolt','hex','fireball','walk','walk'],look:{g:'female',skin:'light',head:'head_f',top:'top_long',topc:'purple',legc:'black',hat:'hat_wizard',w:'w_staff'}},
 knight:{n:'黒騎士',hp:60,hand:4,pref:1,boss:1,deck:['slash','slash','slash','bosscharge','bosscharge','bossreap','iron','walk','walk','sprint'],look:{g:'male',skin:'zombie_green',head:'head_m',top:'top_plate',topc:'iron',legc:'black',feet:'boots',hat:'hat_bascinet',w:'w_sword'}},
};
const STAGES=[
 {n:'森の入口',theme:'forest',w:8,h:8,foes:['goblin','goblin']},
 {n:'川べりの小径',theme:'forest',w:10,h:8,foes:['goblin','goblin','archer']},
 {n:'荒れた墓地',theme:'grave',w:9,h:10,foes:['skel','zombie','zombie']},
 {n:'弓兵の丘',theme:'grave',w:12,h:8,foes:['skel','archer','archer']},
 {n:'雪の峠',theme:'snow',w:10,h:10,foes:['orc','goblin']},
 {n:'凍った湖',theme:'snow',w:11,h:9,foes:['orc','cultist','skel']},
 {n:'灰の火口',theme:'ash',w:10,h:11,foes:['orc','orc','cultist']},
 {n:'黒騎士の間',theme:'ash',w:12,h:12,foes:['knight','skel'],boss:1},
];
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,R){for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const inb=(G,x,y)=>x>=0&&y>=0&&x<G.w&&y<G.h&&G.cells[y][x].t!=='void';
const unitAt=(G,x,y)=>G.units.find(u=>!u.dead&&u.x===x&&u.y===y);
const solid=(G,x,y)=>!inb(G,x,y)||G.cells[y][x].t==='block';
const blocked=(G,x,y)=>!inb(G,x,y)||['block','water'].includes(G.cells[y][x].t);
const free=(G,x,y)=>!blocked(G,x,y)&&!unitAt(G,x,y);
const man=(a,b,c,d)=>Math.abs(a-c)+Math.abs(b-d);
function los(G,x0,y0,x1,y1){ // 中心線が壁を通らないか
 const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))*4;
 for(let i=1;i<n;i++){const x=x0+(x1-x0)*i/n,y=y0+(y1-y0)*i/n,rx=Math.round(x),ry=Math.round(y);
  if((rx!==x0||ry!==y0)&&(rx!==x1||ry!==y1)&&solid(G,rx,ry))return false}
 return true}
function bfs(G,u,n){const key=(x,y)=>x+','+y,seen=new Map([[key(u.x,u.y),null]]);let q=[[u.x,u.y,0]],out=[];
 while(q.length){const [x,y,d]=q.shift();if(d>0)out.push({x,y,d});if(d===n)continue;
  for(const [dx,dy] of DIRS4){const a=x+dx,b=y+dy,k=key(a,b);if(seen.has(k)||!free(G,a,b))continue;seen.set(k,[x,y]);q.push([a,b,d+1])}}
 return{out,seen}}
function pathTo(G,u,n,x,y){const {seen}=bfs(G,u,n);const key=(a,b)=>a+','+b;let p=[[x,y]],c=seen.get(key(x,y));while(c){p.unshift(c);c=seen.get(key(c[0],c[1]))}return p}
function rays(G,u,dirs,n,min,pierce){const o=[];for(const [dx,dy] of dirs){for(let i=1;i<=n;i++){const x=u.x+dx*i,y=u.y+dy*i;if(solid(G,x,y))break;if(i>=(min||1))o.push({x,y});if(!pierce&&unitAt(G,x,y))break}}return o}
// 射程内のマス
function rangeTiles(G,u,c){const r=c.r;switch(r.s){
 case'self':return[{x:u.x,y:u.y}];
 case'adj':return DIRS4.map(([a,b])=>({x:u.x+a,y:u.y+b})).filter(t=>inb(G,t.x,t.y)&&!solid(G,t.x,t.y));
 case'adj8':return DIRS8.map(([a,b])=>({x:u.x+a,y:u.y+b})).filter(t=>inb(G,t.x,t.y)&&!solid(G,t.x,t.y));
 case'line':return rays(G,u,DIRS4,r.n,r.min,r.pierce);
 case'diag':return rays(G,u,DIRS8.slice(4),r.n,r.min,r.pierce);
 case'star':return rays(G,u,DIRS8,r.n,r.min,r.pierce);
 case'walk':return bfs(G,u,r.n+(u.walkBonus||0)).out.map(t=>({x:t.x,y:t.y}));
 case'knight':return[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]].map(([a,b])=>({x:u.x+a,y:u.y+b})).filter(t=>inb(G,t.x,t.y));
 case'leap':case'dia':{const o=[];for(let y=0;y<G.h;y++)for(let x=0;x<G.w;x++){const d=man(u.x,u.y,x,y);if(d<(r.min||1)||d>r.n||!inb(G,x,y))continue;if(solid(G,x,y)&&r.s==='dia')continue;if(r.s==='dia'&&!r.nolos&&!los(G,u.x,u.y,x,y))continue;o.push({x,y})}return o}
 }return[]}
const foeOf=(u,v)=>u.side!==v.side;
function dirOf(u,t){return[Math.sign(t.x-u.x),Math.sign(t.y-u.y)]}
// 効果範囲
function areaTiles(G,u,c,t){const a=c.a||'one',[dx,dy]=dirOf(u,t),out=[];const add=(x,y)=>{if(inb(G,x,y)&&!solid(G,x,y))out.push({x,y})};
 if(a==='one')add(t.x,t.y);
 else if(a==='plus'){add(t.x,t.y);DIRS4.forEach(([p,q])=>add(t.x+p,t.y+q))}
 else if(a==='sq'){for(let p=-1;p<=1;p++)for(let q=-1;q<=1;q++)add(t.x+p,t.y+q)}
 else if(a==='around'){DIRS8.forEach(([p,q])=>add(u.x+p,u.y+q))}
 else if(a==='pierce'){const n=c.r.n;for(let i=1;i<=n;i++){const x=u.x+dx*i,y=u.y+dy*i;if(solid(G,x,y))break;add(x,y)}}
 else if(a==='fan'){add(t.x,t.y);if(dx)for(const q of[-1,1])add(t.x,t.y+q);else for(const p of[-1,1])add(t.x+p,t.y)}
 return out}
function targets(G,u,c){const rt=rangeTiles(G,u,c);
 if(c.aim==='self')return rt;
 if(c.aim==='empty')return rt.filter(t=>free(G,t.x,t.y));
 if(c.aim==='enemy')return rt.filter(t=>{const v=unitAt(G,t.x,t.y);if(!v||!foeOf(u,v))return false;if(c.e.some(e=>e.k==='dash'))return dashTile(G,u,t)!==null;return true});
 return rt}
function dashTile(G,u,t){const [dx,dy]=dirOf(u,t);let x=u.x,y=u.y;for(;;){const a=x+dx,b=y+dy;if(a===t.x&&b===t.y)return(x===u.x&&y===u.y)?null:{x,y};if(!free(G,a,b))return null;x=a;y=b}}
function canPlay(G,u,c){if(c.c>u.mana)return false;if((c.t==='move'||c.move)&&u.status.root>0)return false;return true}
function calcDmg(a,d,v){let n=v+(a.status.str||0);if(a.status.weak>0)n=Math.floor(n*.75);if(d.status.vuln>0)n=Math.floor(n*1.5);return Math.max(0,n)}
function hurt(G,v,n,evs,src){const blk=Math.min(v.block,n);v.block-=blk;const hp=n-blk;v.hp-=hp;evs.push({t:'dmg',u:v.id,v:hp,blk,src});if(v.hp<=0&&!v.dead){v.hp=0;v.dead=true;evs.push({t:'die',u:v.id})}}
function displace(G,v,dx,dy,n,evs,a){let x=v.x,y=v.y,moved=0,hit=false;const p=[[x,y]];for(let i=0;i<n;i++){const X=x+dx,Y=y+dy;if(!free(G,X,Y)){hit=true;break}x=X;y=Y;moved++;p.push([x,y])}
 v.x=x;v.y=y;if(moved)evs.push({t:'slide',u:v.id,p});if(hit&&!v.dead)hurt(G,v,3,evs,'wall')}
function retreatTile(G,u,from){let best=null,score=-1,d;const {out}=bfs(G,u,from.n);for(const t of out){d=man(t.x,t.y,from.x,from.y);if(d>score){score=d;best=t}}return best}
function shuffleIn(u,R){shuffle(u.discard,R);u.draw.push(...u.discard);u.discard=[]}
function drawN(G,u,n,evs){for(let i=0;i<n;i++){if(!u.draw.length){if(!u.discard.length)break;shuffleIn(u,G.R);evs&&evs.push({t:'reshuffle',u:u.id})}u.hand.push(u.draw.pop());evs&&evs.push({t:'draw',u:u.id})}}
function play(G,u,idx,t){const id=u.hand[idx],c=CARDS[id],evs=[];u.mana-=c.c;u.hand.splice(idx,1);
 if(c.once)(u.exhaust=u.exhaust||[]).push(id);else u.discard.push(id);
 evs.push({t:'play',u:u.id,card:id,tx:t.x,ty:t.y});
 const area=areaTiles(G,u,c,t);
 const victims=(c.aim==='self'&&!c.a)?[]:area.map(p=>unitAt(G,p.x,p.y)).filter(v=>v&&foeOf(u,v));
 const hasDash=c.e.some(e=>e.k==='dash');
 if(!hasDash&&(c.t==='atk'&&!c.e.some(e=>e.k==='moveTo')))evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});
 else if(c.t==='skill')evs.push({t:'cast',u:u.id,anim:c.anim,card:id});
 for(const e of c.e){switch(e.k){
  case'moveTo':{const p=c.r.s==='walk'?pathTo(G,u,c.r.n+(u.walkBonus||0),t.x,t.y):[[u.x,u.y],[t.x,t.y]];u.x=t.x;u.y=t.y;evs.push({t:'move',u:u.id,p,jump:e.jump,blink:e.blink});break}
  case'dash':{const d=dashTile(G,u,t),p=[[u.x,u.y],[d.x,d.y]];u.x=d.x;u.y=d.y;evs.push({t:'move',u:u.id,p,dash:1});evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});break}
  case'dmg':for(const v of victims)if(!v.dead)hurt(G,v,calcDmg(u,v,e.v),evs,'hit');break;
  case'block':u.block+=e.v;evs.push({t:'block',u:u.id,v:e.v});break;
  case'heal':{const n=Math.min(e.v,u.maxHp-u.hp);u.hp+=n;evs.push({t:'heal',u:u.id,v:n});break}
  case'draw':drawN(G,u,e.v,evs);break;
  case'mana':u.mana+=e.v;evs.push({t:'mana',u:u.id,v:e.v});break;
  case'status':if(e.self){u.status[e.s]=(u.status[e.s]||0)+e.v;evs.push({t:'status',u:u.id,s:e.s,v:e.v})}else for(const v of victims)if(!v.dead){v.status[e.s]=(v.status[e.s]||0)+e.v;evs.push({t:'status',u:v.id,s:e.s,v:e.v})}break;
  case'push':for(const v of victims){if(v.dead)continue;let[dx,dy]=[Math.sign(v.x-u.x),Math.sign(v.y-u.y)];displace(G,v,dx,dy,e.v,evs)}break;
  case'pull':for(const v of victims){if(v.dead)continue;let[dx,dy]=[Math.sign(u.x-v.x),Math.sign(u.y-v.y)];const n=Math.min(e.v,Math.max(Math.abs(u.x-v.x),Math.abs(u.y-v.y))-1);if(n>0)displace(G,v,dx,dy,n,evs)}break;
  case'retreat':{const foe=victims[0]||{x:t.x,y:t.y};const b=retreatTile(G,u,{x:foe.x,y:foe.y,n:e.v});if(b){const p=pathTo(G,u,e.v,b.x,b.y);u.x=b.x;u.y=b.y;evs.push({t:'move',u:u.id,p})}break}
 }}
 return evs}
function startTurn(G,u){const evs=[];u.block=0;u.mana=u.maxMana;let extra=0;if(!u.opened){u.opened=1;u.block=u.startBlock||0;u.mana+=u.mana1||0;extra=u.firstDraw||0}if(u.status.burn>0){hurt(G,u,u.status.burn,evs,'burn');u.status.burn--}drawN(G,u,Math.max(0,u.handSize+extra-u.hand.length),evs);return evs}
function endTurn(G,u){const evs=[];u.discard.push(...u.hand);u.hand=[];for(const s of['root','weak','vuln'])if(u.status[s]>0)u.status[s]--;if(!u.dead&&G.cells[u.y][u.x].t==='fire')hurt(G,u,3,evs,'fire');return evs}
function makeUnit(id,side,o){const u={id,side,x:0,y:0,hp:o.hp,maxHp:o.maxHp||o.hp,mana:3,maxMana:3,block:0,status:{},hand:[],discard:[],draw:[],exhaust:[],handSize:o.hand||5,deck:o.deck.slice(),name:o.n,look:o.look,pref:o.pref||1,boss:o.boss,kind:o.kind};return u}
function genMap(stage,R){const{w,h,theme}=stage;for(let tries=0;tries<300;tries++){const cells=[];for(let y=0;y<h;y++){const r=[];for(let x=0;x<w;x++)r.push({t:'floor',v:R()});cells.push(r)}
 const G={w,h,cells,theme,units:[]};
 // 四隅を欠けさせて不定形に
 if(w*h>=80){const cut=1+Math.floor(R()*2);for(const[cx,cy]of[[0,0],[w-1,0],[0,h-1],[w-1,h-1]]){if(R()<.65)for(let a=0;a<cut;a++)for(let b=0;b<cut-a;b++){cells[Math.abs(cy-b)][Math.abs(cx-a)].t='void'}}}
 const liquid={forest:'water',grave:'water',snow:'water',ash:'fire'}[theme],blobs=Math.round(w*h/40);
 for(let i=0;i<blobs;i++){let x=1+Math.floor(R()*(w-2)),y=2+Math.floor(R()*(h-4)),L=4+Math.floor(R()*6);while(L-->0){for(const[p,q]of[[0,0],[1,0],[0,1],[1,1]])if(inb(G,x+p,y+q)&&y+q<h-1)cells[y+q][x+p].t=liquid;const[d,e]=DIRS4[Math.floor(R()*4)];x+=d;y+=e}}
 const nb=Math.round(w*h*.11);for(let i=0;i<nb;i++){const x=Math.floor(R()*w),y=1+Math.floor(R()*(h-2));if(inb(G,x,y)&&cells[y][x].t==='floor')cells[y][x].t='block'}
 const px=Math.floor(w/2),py=h-1;let pSpot=null;for(let d=0;d<w&&!pSpot;d++)for(const x of[px-d,px+d])for(let y=h-1;y>=h-2;y--)if(!pSpot&&inb(G,x,y)&&cells[y][x].t==='floor')pSpot={x,y};
 if(!pSpot)continue;
 const seen=new Set([pSpot.x+','+pSpot.y]),q=[pSpot];while(q.length){const c=q.shift();for(const[a,b]of DIRS4){const x=c.x+a,y=c.y+b,k=x+','+y;if(seen.has(k)||!inb(G,x,y)||['block','water'].includes(cells[y][x].t))continue;seen.add(k);q.push({x,y})}}
 let walk=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(inb(G,x,y)&&!['block','water'].includes(cells[y][x].t))walk++;let tot=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(inb(G,x,y))tot++;
 if(seen.size<walk||walk<tot*.65)continue;
 const spots=[...seen].map(k=>k.split(',').map(Number)).filter(([x,y])=>y<=Math.ceil(h*.34)&&cells[y][x].t==='floor');
 if(spots.length<stage.foes.length+3)continue;
 shuffle(spots,R);G.pSpot=pSpot;G.fSpots=spots;return G}
 throw new Error('map')}
function setupBattle(stageIdx,hero,seed){const R=mulberry(seed),s=STAGES[stageIdx],G=genMap(s,R);G.R=R;G.stage=stageIdx;G.turn=1;
 const p=makeUnit(0,'hero',{n:hero.name,hp:hero.hp,maxHp:hero.maxHp,deck:hero.deck,hand:5,look:hero.look,kind:'hero',pref:hero.pref});{const b=hero.bonus||{};if(b.atk)p.status.str=b.atk;p.startBlock=b.guard||0;p.firstDraw=b.draw||0;p.walkBonus=b.walk||0;p.mana1=b.mana1||0}p.x=G.pSpot.x;p.y=G.pSpot.y;p.facing=1;p.draw=shuffle(p.deck.slice(),R);{const top=p.draw.length-1;if(!p.draw.slice(-5).some(id=>CARDS[id].t==='move')){const j=p.draw.findIndex(id=>CARDS[id].t==='move');if(j>=0)[p.draw[j],p.draw[top]]=[p.draw[top],p.draw[j]]}}G.units.push(p);
 s.foes.forEach((f,i)=>{const d=FOES[f],df=hero.diff||0,u=makeUnit(i+1,'foe',{...d,hp:Math.round(d.hp*(1+df*.3)),kind:f});if(df)u.status.str=df;[u.x,u.y]=G.fSpots[i];u.facing=0;u.draw=shuffle(u.deck.slice(),R);G.units.push(u)});return G}
const alive=(G,side)=>G.units.filter(u=>!u.dead&&u.side===side);
const outcome=G=>!alive(G,'hero').length?'lose':!alive(G,'foe').length?'win':null;
// AI ------------------------------------------------
function estHit(G,u,c,t){let sum=0,kill=0;for(const p of areaTiles(G,u,c,t)){const v=unitAt(G,p.x,p.y);if(!v)continue;if(!foeOf(u,v))continue;let hit=0;for(const e of c.e)if(e.k==='dmg')hit+=calcDmg(u,v,e.v);const eff=Math.max(0,hit-v.block);sum+=eff+(c.e.some(e=>e.k==='status')?2:0);if(eff>=v.hp)kill++}return{sum,kill}}
function canHitFrom(G,u,x,y,ids,mana){const ox=u.x,oy=u.y;u.x=x;u.y=y;let best=0;for(const id of ids){const c=CARDS[id];if(c.c>mana||c.t!=='atk')continue;for(const t of targets(G,u,c)){const r=estHit(G,u,c,t);if(r.sum>best)best=r.sum}}u.x=ox;u.y=oy;return best}
function chooseAI(G,u){const foes=alive(G,u.side==='foe'?'hero':'foe');if(!foes.length)return null;const gap=(x,y)=>Math.min(...foes.map(f=>{const d=Math.max(Math.abs(x-f.x),Math.abs(y-f.y));return Math.abs(d-u.pref)+(d<u.pref?1:0)}));let best=null,bs=0;const curHit=canHitFrom(G,u,u.x,u.y,u.hand,u.mana);
 u.hand.forEach((id,i)=>{const c=CARDS[id];if(!canPlay(G,u,c))return;const rest=u.hand.filter((_,j)=>j!==i);
  for(const t of targets(G,u,c)){let s=0;
   if(c.t==='move'||c.e.some(e=>e.k==='moveTo')){const g0=gap(u.x,u.y),g1=gap(t.x,t.y);const h=canHitFrom(G,u,t.x,t.y,rest,u.mana-c.c);if(curHit>0&&h<=curHit)continue;s=(g0-g1)*2+h*3;if(G.cells[t.y][t.x].t==='fire')s-=6;if(s<=0)s=g0>g1?.5:0}
   else if(c.t==='atk'){const r=estHit(G,u,c,t);if(!r.sum&&!c.e.some(e=>e.k==='push'||e.k==='pull'))continue;if(!r.sum)continue;s=r.sum*3+r.kill*20-c.c*2}
   else{const near=foes.some(f=>man(f.x,f.y,u.x,u.y)<=5);if(c.e.some(e=>e.k==='block'))s=near&&curHit===0?4:(near?1:0);else if(c.e.some(e=>e.k==='heal'))s=u.hp<u.maxHp*.6?8:0;else s=3}
   s+=G.R()*.2;if(s>bs){bs=s;best={i,t}}}});return best}
// 成長と装備 ----------------------------------------
const RARITY={c:{n:'並',col:'#c9c2b0'},r:{n:'上',col:'#6fb6ff'},e:{n:'極',col:'#ffb547'}};
const I=(n,slot,rar,o)=>({n,slot,rar,...o});
const ITEMS={
 sw_iron:I('鉄の剣','weapon','c',{cls:'sword',sp:'w_sword'}),sw_dagger:I('短剣','weapon','c',{cls:'sword',sp:'w_dagger',card:'hitrun'}),sw_saber:I('サーベル','weapon','c',{cls:'sword',sp:'w_saber',card:'cleave'}),sw_scimitar:I('偃月刀','weapon','r',{cls:'sword',sp:'w_scimitar',atk:1,hp:3}),sw_rapier:I('細剣','weapon','r',{cls:'sword',sp:'w_rapier',card:'dashcut',walk:0}),sw_long:I('長剣','weapon','r',{cls:'sword',sp:'w_longsword',atk:1,card:'cleave'}),sw_mace:I('鎚矛','weapon','r',{cls:'sword',sp:'w_mace',atk:2,hp:-4}),sw_katana:I('刀','weapon','e',{cls:'sword',sp:'w_katana',atk:2,card:'hitrun'}),sw_axe:I('戦斧','weapon','e',{cls:'sword',sp:'w_waraxe',atk:2,card:'execute'}),
 sp_iron:I('鉄の槍','weapon','c',{cls:'spear',sp:'w_spear'}),sp_long:I('長槍','weapon','c',{cls:'spear',sp:'w_longspear',card:'hookpull'}),sp_trident:I('三叉槍','weapon','r',{cls:'spear',sp:'w_trident',atk:1,card:'buttstrike'}),sp_halberd:I('斧槍','weapon','r',{cls:'spear',sp:'w_halberd',atk:1,hp:4}),sp_scythe:I('大鎌','weapon','e',{cls:'spear',sp:'w_scythe',atk:2,card:'sweep'}),sp_dragon:I('竜槍','weapon','e',{cls:'spear',sp:'w_dragon',atk:2,card:'impale'}),
 st_simple:I('木の杖','weapon','c',{cls:'mage',sp:'w_staff'}),st_wand:I('小杖','weapon','c',{cls:'mage',sp:'w_wand',card:'gust'}),st_gnarled:I('節くれの杖','weapon','c',{cls:'mage',sp:'w_gnarled',hp:3}),st_loop:I('環の杖','weapon','r',{cls:'mage',sp:'w_loop',atk:1,card:'frost'}),st_diamond:I('菱石の杖','weapon','r',{cls:'mage',sp:'w_diamond',card:'chain'}),st_crystal:I('水晶の杖','weapon','e',{cls:'mage',sp:'w_crystal',atk:2,card:'meteor'}),
 bw_normal:I('狩人の弓','weapon','c',{cls:'bow',sp:'w_bow'}),bw_recurve:I('反り弓','weapon','r',{cls:'bow',sp:'w_recurve',atk:1,card:'fire_arrow'}),bw_great:I('大弓','weapon','e',{cls:'bow',sp:'w_great',atk:2,card:'snipe'}),
 ar_cloth:I('旅の服','armor','c',{hp:2}),ar_leather:I('革の胴着','armor','c',{hp:5}),ar_robe:I('魔導衣','armor','c',{hp:2,card:'ward'}),ar_chain:I('鎖帷子','armor','r',{hp:9}),ar_shadow:I('影の外套','armor','r',{hp:4,card:'shadow'}),ar_plate:I('板金鎧','armor','e',{hp:15,guard:2}),ar_dragon:I('竜鱗の鎧','armor','e',{hp:10,guard:4,atk:1}),
 of_buckler:I('木の盾','off','c',{guard:3,sp:'sh_round'}),of_tome:I('古い魔導書','off','c',{card:'focus'}),of_quiver:I('予備の矢筒','off','r',{card:'rain'}),of_crusader:I('聖騎士の盾','off','r',{guard:5,hp:3,sp:'sh_crusader'}),of_spartan:I('大円盾','off','e',{guard:8,card:'iron',sp:'sh_spartan'}),
 ch_iron:I('鉄の指輪','charm','c',{hp:4}),ch_boot:I('軽い靴紐','charm','c',{card:'sidestep'}),ch_salve:I('薬草袋','charm','c',{card:'salve'}),ch_lion:I('獅子の護符','charm','r',{atk:1}),ch_book:I('修行の書','charm','r',{xp:30}),ch_wing:I('風の羽','charm','r',{walk:1}),ch_hand:I('早指の手袋','charm','r',{draw:1}),ch_heart:I('治癒の心臓','charm','r',{heal:15}),ch_star:I('星の欠片','charm','e',{mana1:1}),ch_eye:I('賢者の瞳','charm','e',{picks:1,draw:1}),
};
const PERKS={hp:{n:'頑丈',d:'最大HP+5',max:6,cost:1},guard:{n:'受け身',d:'戦闘開始時のガード+3',max:4,cost:1},heal:{n:'回復力',d:'戦闘後の回復+10%',max:3,cost:1},draw:{n:'手際',d:'最初の手札+1',max:2,cost:2},picks:{n:'目利き',d:'カード報酬の候補+1',max:1,cost:2},atk:{n:'鍛錬',d:'攻撃のダメージ+1',max:3,cost:3},walk:{n:'健脚',d:'歩く系カードの距離+1',max:1,cost:3}};
const STARTER={sword:'sw_iron',spear:'sp_iron',mage:'st_simple',bow:'bw_normal'};
const LEVEL_CAP=30,xpNeed=lv=>90+lv*70;
function newHero(id,name,cls,look){return{id,name:name||'旅人',cls,look,level:1,xp:0,perks:{},equip:{weapon:STARTER[cls],armor:'ar_cloth',off:'',charm:''},inv:[STARTER[cls],'ar_cloth'],wins:0,best:0}}
function itemDesc(it){const a=[];if(it.atk)a.push('攻撃+'+it.atk);if(it.hp)a.push('HP'+(it.hp>0?'+':'')+it.hp);if(it.guard)a.push('開始ガード+'+it.guard);if(it.walk)a.push('歩く距離+'+it.walk);if(it.draw)a.push('初手+'+it.draw);if(it.mana1)a.push('初ターンのマナ+'+it.mana1);if(it.heal)a.push('戦後回復+'+it.heal+'%');if(it.picks)a.push('報酬候補+'+it.picks);if(it.xp)a.push('経験値+'+it.xp+'%');if(it.card)a.push('札「'+CARDS[it.card].n+'」');return a.join(' / ')||'初期装備'}
function heroStats(h){const b={atk:0,guard:0,walk:0,draw:0,heal:0,picks:0,xp:0,mana1:0},P=h.perks||{},k=CLASSES[h.cls];let hp=k.hp+(h.level-1)*2+(P.hp||0)*5;b.atk+=P.atk||0;b.guard+=(P.guard||0)*3;b.walk+=P.walk||0;b.draw+=P.draw||0;b.heal+=(P.heal||0)*10;b.picks+=P.picks||0;const cards=[];for(const s of['weapon','armor','off','charm']){const it=ITEMS[h.equip[s]];if(!it)continue;hp+=it.hp||0;for(const f of['atk','guard','walk','draw','heal','picks','xp','mana1'])b[f]+=it[f]||0;if(it.card)cards.push(it.card)}b.walk=Math.min(b.walk,2);return{maxHp:hp,bonus:b,cards}}
const perkSpent=h=>Object.entries(h.perks||{}).reduce((s,[k,v])=>s+PERKS[k].cost*v,0);
const perkLeft=h=>h.level-1-perkSpent(h);
function canPerk(h,k){return(h.perks[k]||0)<PERKS[k].max&&perkLeft(h)>=PERKS[k].cost}
function heroLook(h){const L={...h.look},w=ITEMS[h.equip.weapon],o=ITEMS[h.equip.off];L.w=w?w.sp:'';L.sh=o&&o.sp||'';return L}
function gainXp(h,n){const s=heroStats(h);n=Math.round(n*(1+s.bonus.xp/100));h.xp+=n;let up=0;while(h.level<LEVEL_CAP&&h.xp>=xpNeed(h.level)){h.xp-=xpNeed(h.level);h.level++;up++}if(h.level>=LEVEL_CAP)h.xp=0;return{xp:n,up}}
const stageXp=i=>30+i*12+(STAGES[i].boss?90:0);
function rollDrop(i,h,R){const boss=STAGES[i].boss;if(!boss&&R()>.7)return null;const r=R(),rar=boss?'e':i<3?(r<.8?'c':'r'):i<6?(r<.45?'c':r<.9?'r':'e'):(r<.6?'r':'e');const fits=id=>!ITEMS[id].cls||ITEMS[id].cls===h.cls,free=Object.keys(ITEMS).filter(id=>fits(id)&&!h.inv.includes(id));let pool=free.filter(id=>ITEMS[id].rar===rar);if(!pool.length)pool=free;return pool.length?pool[Math.floor(R()*pool.length)]:null}
function newRun(h,seed){const s=heroStats(h),k=CLASSES[h.cls];return{heroId:h.id,pref:{sword:1,spear:2,mage:3,bow:3}[h.cls],name:h.name,cls:h.cls,hp:s.maxHp,maxHp:s.maxHp,bonus:s.bonus,deck:[...k.deck,...s.cards],look:heroLook(h),diff:h.diff||0,stage:0,seed:seed||(Date.now()&0xffffff)}}
if(typeof module!=='undefined')module.exports={CARDS,CLASSES,FOES,STAGES,REWARD,CLASS_POOL,setupBattle,chooseAI,play,targets,startTurn,endTurn,outcome,alive,newRun,canPlay,mulberry,shuffle,areaTiles,ITEMS,PERKS,newHero,heroStats,gainXp,stageXp,rollDrop,canPerk,perkLeft};
