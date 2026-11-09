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
 fireball:{el:'fire',n:'爆炎',c:2,t:'atk',icon:'fire-bomb',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'any',a:'plus',e:[dmg(6),st('burn',2)],d:'着弾点と上下左右に6ダメージ、火傷2。'},
 frost:{el:'ice',n:'氷縛',c:1,t:'atk',icon:'frozen-orb',anim:'spell',fx:'ice',r:{s:'dia',n:3},aim:'enemy',e:[dmg(2),st('root',1)],d:'2ダメージ。拘束1：次の手番、移動カードを使えない。'},
 meteor:{el:'fire',n:'隕石',c:3,t:'atk',icon:'meteor-impact',anim:'spell',fx:'fire',r:{s:'dia',n:6,nolos:1},aim:'any',a:'sq',e:[dmg(11)],d:'射程6（遮蔽無視）の3×3に11ダメージ。'},
 chain:{el:'thunder',n:'雷鎖',c:2,t:'atk',icon:'chain-lightning',anim:'spell',fx:'bolt',r:{s:'star',n:5},aim:'any',a:'pierce',e:[dmg(6)],d:'8方向いずれかの直線5マスを貫き6ダメージ。水辺の敵には感電が広がる。'},
 gust:{n:'烈風',c:1,t:'atk',icon:'wind-slap',anim:'spell',fx:'bolt',r:{s:'self'},aim:'self',a:'around',e:[dmg(1),{k:'push',v:2}],d:'周囲8マスに1ダメージ、外へ2マス押す。'},
 // 弓
 shot:{n:'射撃',c:1,t:'atk',icon:'bow-arrow',anim:'weapon',fx:'arrow',r:{s:'star',n:4,min:2},aim:'enemy',e:[dmg(5)],d:'8方向の直線、距離2〜4の敵に5ダメージ。'},
 snipe:{n:'狙撃',c:2,t:'atk',icon:'arrow-scope',anim:'weapon',fx:'arrow',r:{s:'line',n:8,min:3},aim:'enemy',e:[dmg(11)],d:'縦横の直線、距離3〜8の敵に11ダメージ。'},
 rain:{n:'矢の雨',c:2,t:'atk',icon:'arrow-cluster',anim:'weapon',fx:'arrow',r:{s:'dia',n:5,min:2,nolos:1},aim:'any',a:'sq',e:[dmg(4)],d:'射程2〜5（遮蔽無視）の3×3に4ダメージ。'},
 pin:{n:'足縫い',c:1,t:'atk',icon:'barbed-arrow',anim:'weapon',fx:'arrow',r:{s:'star',n:4,min:1},aim:'enemy',e:[dmg(2),st('root',1)],d:'2ダメージ。拘束1を与える。'},
 kickoff:{n:'蹴り跳び',c:1,t:'atk',move:1,icon:'boot-stomp',r:{s:'adj'},aim:'enemy',e:[dmg(2),{k:'retreat',v:3}],d:'隣の敵に2ダメージ、3マス下がる。'},
 fire_arrow:{el:'fire',n:'火矢',c:1,t:'atk',icon:'flaming-arrow',anim:'weapon',fx:'fire',r:{s:'star',n:5,min:2},aim:'enemy',e:[dmg(3),st('burn',3)],d:'距離2〜5の敵に3ダメージ、火傷3。'},
 // 補助
 guard:{n:'防御',c:1,t:'skill',icon:'checked-shield',r:{s:'self'},aim:'self',e:[block(6)],d:'ガード6を得る（次の自分の手番まで）。'},
 ward:{n:'魔力障壁',c:1,t:'skill',icon:'magic-shield',anim:'spell',r:{s:'self'},aim:'self',e:[block(5),{k:'draw',v:1}],d:'ガード5を得て、1枚引く。'},
 iron:{n:'鉄壁',c:2,t:'skill',icon:'bordered-shield',r:{s:'self'},aim:'self',e:[block(13)],d:'ガード13を得る。'},
 focus:{n:'集中',c:0,t:'skill',icon:'meditation',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'draw',v:2}],once:1,d:'2枚引く。戦闘中1回。'},
 surge:{n:'魔力解放',c:0,t:'skill',icon:'lightning-frequency',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'mana',v:1}],once:1,d:'マナ+1（このターンだけ上限を超える）。戦闘中1回。'},
 rally:{n:'鼓舞',c:1,t:'skill',icon:'muscle-up',anim:'spell',r:{s:'self'},aim:'self',e:[st('str',2,1)],once:1,d:'この戦闘中、攻撃+2。戦闘中1回。'},
 salve:{n:'傷薬',c:1,t:'skill',icon:'health-potion',r:{s:'self'},aim:'self',e:[{k:'heal',v:8}],once:1,d:'HPを8回復。戦闘中1回。'},
 // 上級職
 shieldbash:{n:'盾撃',c:1,t:'atk',icon:'shield-bash',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[{k:'dmgBlock',v:3}],d:'周囲の敵に「ガードの半分+3」ダメージ。'},
 holyward:{n:'聖壁',c:1,t:'skill',icon:'shield-reflect',anim:'spell',r:{s:'self'},aim:'self',e:[block(9)],d:'ガード9を得る。'},
 judgment:{n:'裁きの光',c:2,t:'atk',icon:'sun-radiations',anim:'spell',fx:'bolt',r:{s:'dia',n:3,nolos:1},aim:'any',a:'plus',e:[dmg(8)],d:'射程3（遮蔽無視）の十字に8ダメージ。'},
 sanctuary:{n:'聖域',c:2,t:'skill',icon:'holy-symbol',anim:'spell',r:{s:'self'},aim:'self',e:[block(12),{k:'heal',v:6}],once:1,d:'ガード12、HP6回復。戦闘中1回。'},
 bloodhit:{n:'血の一撃',c:0,t:'atk',icon:'bloody-stash',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[{k:'selfDmg',v:3},dmg(8)],d:'自分に3ダメージ。周囲の敵に8ダメージ。'},
 rampage:{n:'猛襲',c:2,t:'atk',move:1,icon:'charging-bull',anim:'weapon',r:{s:'line',n:3,min:2},aim:'enemy',e:[{k:'dash'},dmg(7),dmg(4)],d:'直線3マスの敵の前まで走り、7と4の2回攻撃。'},
 warcry:{n:'雄叫び',c:0,t:'skill',icon:'shouting',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'selfDmg',v:4},st('str',3,1)],once:1,d:'自分に4ダメージ。この戦闘中、攻撃+3。戦闘中1回。'},
 musou:{n:'無双',c:3,t:'atk',icon:'sword-spin',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(9),dmg(9)],d:'周囲8マスに9の2回攻撃。'},
 dive:{n:'急降下',c:2,t:'atk',move:1,icon:'fall-down',anim:'weapon',r:{s:'leap',n:4},aim:'empty',a:'land',e:[{k:'moveTo',jump:1},dmg(5)],d:'4マス以内へ跳び、着地点の周囲8マスに5ダメージ。'},
 jumpthrust:{n:'跳躍突き',c:1,t:'atk',move:1,icon:'jump-across',anim:'weapon',r:{s:'leap',n:2},aim:'empty',a:'land',e:[{k:'moveTo',jump:1},dmg(3)],d:'2マス以内へ跳び、着地点の周囲8マスに3ダメージ。'},
 skyfall:{n:'天崩し',c:3,t:'atk',move:1,icon:'falling-boulder',anim:'weapon',r:{s:'leap',n:6},aim:'empty',a:'land',e:[{k:'moveTo',jump:1},dmg(9)],d:'6マス以内へ跳び、着地点の周囲8マスに9ダメージ。'},
 dragonroar:{n:'竜の咆哮',c:2,t:'atk',icon:'dragon-breath',anim:'weapon',fx:'fire',r:{s:'star',n:4,pierce:1},aim:'any',a:'pierce',e:[dmg(9),st('vuln',1)],d:'8方向の直線4マスを貫き9ダメージ、脆弱1。'},
 shove:{n:'押し出し',c:1,t:'atk',icon:'push',anim:'weapon',r:{s:'adj'},aim:'any',a:'fan',e:[dmg(4),{k:'push',v:2}],d:'前方3マスに4ダメージ、2マス押す。'},
 formation:{n:'布陣',c:1,t:'skill',icon:'chess-rook',r:{s:'self'},aim:'self',e:[block(5),{k:'draw',v:1}],d:'ガード5を得て1枚引く。'},
 pincer:{n:'挟撃',c:1,t:'atk',icon:'pincers',anim:'weapon',r:{s:'line',n:5,min:2},aim:'enemy',e:[dmg(6),{k:'pull',v:5}],d:'直線5マスの敵に6ダメージ、目の前まで引き寄せる。'},
 shockwave:{n:'衝撃波',c:2,t:'atk',icon:'wave-strike',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(4),{k:'push',v:3}],d:'周囲8マスに4ダメージ、外へ3マス押す。'},
 ignite:{el:'fire',n:'点火',c:1,t:'atk',icon:'burning-embers',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'enemy',e:[dmg(2),st('burn',4)],d:'射程4の敵に2ダメージ、火傷4。'},
 flamejet:{el:'fire',n:'火炎放射',c:2,t:'atk',icon:'flame',anim:'spell',fx:'fire',r:{s:'line',n:4,pierce:1},aim:'any',a:'pierce',e:[dmg(6),st('burn',2)],d:'直線4マスを貫き6ダメージ、火傷2。'},
 scorch:{el:'fire',n:'焦土',c:2,t:'atk',icon:'fire-ring',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'any',a:'plus',e:[dmg(4),{k:'setTile',t:'fire'}],d:'十字に4ダメージ。その範囲の地面を燃やす。'},
 phoenix:{el:'fire',n:'鳳凰',c:3,t:'atk',icon:'small-fire',anim:'spell',fx:'fire',r:{s:'dia',n:6,nolos:1},aim:'any',a:'sq',e:[dmg(9),st('burn',3)],d:'射程6（遮蔽無視）の3×3に9ダメージ、火傷3。'},
 icewall:{n:'氷壁',c:1,t:'skill',icon:'ice-cube',anim:'spell',r:{s:'dia',n:3},aim:'empty',e:[{k:'setTile',t:'block'},block(3)],d:'空きマスに壁を作り、ガード3を得る。'},
 shatter:{el:'ice',n:'砕氷',c:1,t:'atk',icon:'ice-spear',anim:'spell',fx:'ice',r:{s:'dia',n:4},aim:'enemy',e:[dmg(5)],d:'射程4の敵に5ダメージ。'},
 blizzard:{el:'ice',n:'吹雪',c:3,t:'atk',icon:'snowing',anim:'spell',fx:'ice',r:{s:'dia',n:5,nolos:1},aim:'any',a:'sq',e:[dmg(7),st('root',1)],d:'射程5（遮蔽無視）の3×3に7ダメージ、拘束1。'},
 timewarp:{n:'時間歪曲',c:0,t:'skill',icon:'time-trap',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'mana',v:2},{k:'draw',v:1}],once:1,d:'マナ+2、1枚引く。戦闘中1回。'},
 deadeye:{n:'心眼',c:2,t:'atk',icon:'eye-target',anim:'weapon',fx:'arrow',r:{s:'dia',n:6,min:3,nolos:1},aim:'enemy',e:[dmg(9)],d:'距離3〜6（遮蔽無視）の敵に9ダメージ。'},
 piercer:{n:'貫通矢',c:2,t:'atk',icon:'striking-arrows',anim:'weapon',fx:'arrow',r:{s:'line',n:8,pierce:1},aim:'any',a:'pierce',e:[dmg(8)],d:'縦横の直線8マスを貫き8ダメージ。'},
 aim:{n:'照準',c:0,t:'skill',icon:'targeted',r:{s:'self'},aim:'self',e:[st('str',2,1)],once:1,d:'この戦闘中、攻撃+2。戦闘中1回。'},
 hawkstrike:{n:'鷹撃',c:3,t:'atk',icon:'hawk-emblem',anim:'weapon',fx:'arrow',r:{s:'star',n:8,min:3},aim:'enemy',e:[dmg(18)],d:'8方向の直線、距離3〜8の敵に18ダメージ。'},
 backshot:{n:'跳び射ち',c:1,t:'atk',move:1,icon:'backward-time',anim:'weapon',fx:'arrow',r:{s:'star',n:3},aim:'enemy',e:[dmg(4),{k:'retreat',v:2}],d:'8方向3マスの敵に4ダメージ、2マス下がる。'},
 volley:{n:'連射',c:2,t:'atk',icon:'arrow-flights',anim:'weapon',fx:'arrow',r:{s:'star',n:5,min:2},aim:'enemy',e:[dmg(5),dmg(5),dmg(5)],d:'距離2〜5の敵に5の3回攻撃。'},
 smokestep:{n:'煙渡り',c:0,t:'move',icon:'smoke-bomb',r:{s:'leap',n:3},aim:'empty',e:[{k:'moveTo',blink:1},block(3)],d:'3マス以内へ消えて現れ、ガード3を得る。'},
 net:{n:'投網',c:1,t:'atk',icon:'fishing-net',anim:'weapon',r:{s:'dia',n:4,nolos:1},aim:'any',a:'sq',e:[st('root',1)],d:'射程4の3×3に拘束1。'},
 // 固有システム
 flameblade:{el:'fire',n:'炎刃',c:1,t:'atk',icon:'flaming-claw',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[dmg(5),st('burn',2)],d:'周囲の敵に5ダメージ、火傷2。'},
 runeslash:{n:'符撃',c:1,t:'atk',icon:'rune-sword',anim:'spell',fx:'bolt',r:{s:'dia',n:3},aim:'enemy',e:[dmg(5)],d:'射程3の敵に5ダメージ（魔法）。'},
 arcstorm:{n:'魔剣乱舞',c:3,t:'atk',icon:'spinning-sword',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(7),dmg(7),st('burn',2)],d:'周囲8マスに7の2回攻撃、火傷2。'},
 soar:{n:'飛翔',c:3,t:'skill',icon:'feathered-wing',anim:'weapon',r:{s:'leap',n:6},aim:'empty',e:[{k:'soar',v:8}],d:'空へ舞い上がり、次の手番の開始時に指定マスへ降下。周囲8マスに8ダメージ。空中では攻撃を受けない。降下した手番には使えない。'},
 swap:{n:'入れ替え',c:0,t:'atk',move:1,icon:'swap-bag',r:{s:'line',n:4},aim:'enemy',e:[{k:'swap'},dmg(3)],d:'直線4マスの敵と位置を入れ替え、3ダメージ。'},
 collideslam:{n:'叩きつけ',c:2,t:'atk',icon:'pummeled',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(8),{k:'push',v:4}],d:'隣の敵に8ダメージ、4マス押す。'},
 brace:{n:'構え',c:0,t:'skill',icon:'spear-feather',r:{s:'self'},aim:'self',e:[block(3),{k:'over',v:1}],d:'ガード3。迎撃の回数+1。'},
 thousand:{n:'千本突き',c:3,t:'atk',icon:'stone-spear',anim:'weapon',r:{s:'line',n:3,pierce:1},aim:'any',a:'pierce',e:[dmg(6),dmg(6),dmg(6)],d:'直線3マスを貫き6の3回攻撃。'},
 deepfreeze:{el:'ice',n:'氷結',c:3,t:'atk',icon:'frozen-block',anim:'spell',fx:'ice',r:{s:'dia',n:4},aim:'enemy',e:[dmg(1),st('freeze',1)],d:'1ダメージ。凍結：敵は次の手番に何もできない。解けた直後とボスには拘束になる。'},
 raise:{n:'骸骨召喚',c:2,t:'skill',icon:'raise-skeleton',anim:'spell',r:{s:'dia',n:3},aim:'empty',e:[{k:'summon',f:'skel'}],d:'空きマスに味方の骸骨兵を呼ぶ。最大2体。'},
 raisezombie:{n:'亡者召喚',c:1,t:'skill',icon:'raise-zombie',anim:'spell',r:{s:'dia',n:3},aim:'empty',e:[{k:'summon',f:'zombie'}],d:'空きマスに味方の亡者を呼ぶ。'},
 drain:{n:'魂吸い',c:1,t:'atk',icon:'life-tap',anim:'spell',fx:'dark',r:{s:'dia',n:4},aim:'enemy',e:[dmg(5),{k:'heal',v:4}],d:'射程4の敵に5ダメージ、HP4回復。'},
 deathwave:{n:'死の波',c:3,t:'atk',icon:'death-zone',anim:'spell',fx:'dark',r:{s:'dia',n:5,nolos:1},aim:'any',a:'sq',e:[dmg(9),st('weak',2)],d:'射程5（遮蔽無視）の3×3に9ダメージ、衰弱2。'},
 mark:{n:'標的',c:1,t:'skill',icon:'on-target',r:{s:'star',n:8},aim:'enemy',e:[st('mark',2)],d:'敵に標的2：受ける攻撃+3。'},
 trap:{n:'虎挟み',c:1,t:'skill',icon:'wolf-trap',r:{s:'dia',n:3},aim:'empty',e:[{k:'trap',v:9}],d:'空きマスに罠を置く。敵が止まると9ダメージ、拘束1。最大3個。'},
 trapfire:{n:'火炎罠',c:1,t:'skill',icon:'fire-bomb',r:{s:'dia',n:4},aim:'empty',e:[{k:'trap',v:4,burn:3}],d:'空きマスに罠を置く。敵が止まると4ダメージ、火傷3、拘束1。'},
 ricochet:{n:'跳弾',c:1,t:'atk',icon:'bouncing-sword',anim:'weapon',fx:'arrow',r:{s:'star',n:5},aim:'enemy',e:[dmg(5)],d:'8方向5マスの敵に5ダメージ。'},
 stardrop:{n:'星落とし',c:3,t:'atk',icon:'falling-star',anim:'weapon',fx:'arrow',r:{s:'dia',n:7,nolos:1},aim:'enemy',e:[dmg(7),dmg(7)],d:'射程7（遮蔽無視）の敵に7の2回攻撃。'},
 thunderclap:{el:'thunder',n:'雷撃',c:1,t:'atk',icon:'lightning-storm',anim:'spell',fx:'bolt',r:{s:'dia',n:4},aim:'enemy',e:[dmg(4)],d:'射程4の敵に4ダメージ。水辺の敵には感電が広がる。'},
 // 秘伝
 sandstep:{n:'砂渡り',c:0,t:'move',icon:'footprint',r:{s:'walk',n:2},aim:'empty',e:[{k:'moveTo'}],d:'2マス移動する。'},
 wheelcut:{n:'輪舞',c:1,t:'atk',icon:'sword-spin',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(4)],d:'周囲8マスに4ダメージ。'},
 dancestep:{n:'舞い斬り',c:1,t:'atk',move:1,icon:'saber-slash',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[dmg(4),{k:'retreat',v:3}],d:'周囲の敵に4ダメージ、3マス下がる。'},
 dunestorm:{n:'砂嵐の剣',c:3,t:'atk',icon:'whirlwind',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(8),dmg(8)],d:'周囲8マスに8の2回攻撃。'},
 venomthrust:{n:'毒突き',c:1,t:'atk',icon:'spear-hook',anim:'weapon',r:{s:'line',n:2,pierce:1},aim:'any',a:'pierce',e:[dmg(3),st('poison',2)],d:'直線2マスを貫き3ダメージ、毒2。'},
 toxicfield:{n:'毒沼撒き',c:2,t:'atk',icon:'poison-cloud',anim:'spell',fx:'dark',r:{s:'dia',n:3},aim:'any',a:'plus',e:[dmg(2),st('poison',1),{k:'setTile',t:'bog'}],d:'十字に2ダメージ、毒1。地面を毒沼にする。'},
 detonate:{n:'毒爆',c:1,t:'atk',icon:'bubbling-flask',anim:'weapon',r:{s:'line',n:3},aim:'enemy',e:[{k:'poisonBurst',v:2}],d:'直線3マスの敵の毒を全部消し、毒の2倍のダメージ。'},
 plague:{n:'疫病の穂先',c:3,t:'atk',icon:'stone-spear',anim:'weapon',r:{s:'line',n:4,pierce:1},aim:'any',a:'pierce',e:[dmg(7),st('poison',3)],d:'直線4マスを貫き7ダメージ、毒3。'},
 oilflask:{n:'油の瓶',c:1,t:'skill',icon:'round-bottom-flask',anim:'spell',r:{s:'dia',n:4,nolos:1},aim:'any',a:'plus',e:[{k:'setTile',t:'oil'}],d:'十字の地面を油にする。'},
 waterflask:{n:'水の瓶',c:1,t:'skill',icon:'water-flask',anim:'spell',r:{s:'dia',n:4,nolos:1},aim:'any',a:'plus',e:[{k:'setTile',t:'water'}],d:'十字の空いた地面を水にする。'},
 alchfire:{el:'fire',n:'火種',c:0,t:'atk',icon:'flame',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'any',e:[dmg(2)],d:'対象マスに2ダメージ（火）。油に当てると爆発する。'},
 frostflask:{el:'ice',n:'冷気の瓶',c:1,t:'atk',icon:'frozen-orb',anim:'spell',fx:'ice',r:{s:'dia',n:4},aim:'any',a:'sq',e:[dmg(3)],d:'3×3に3ダメージ（氷）。水を凍らせる。'},
 grandwork:{el:'fire',n:'大錬成',c:3,t:'atk',icon:'bubbling-flask',anim:'spell',fx:'fire',r:{s:'dia',n:5,nolos:1},aim:'any',a:'sq',e:[{k:'setTile',t:'oil'},dmg(8)],d:'3×3を油にしてから火をつけ、8ダメージ。'},
 cursearrow:{n:'呪矢',c:1,t:'atk',icon:'barbed-arrow',anim:'weapon',fx:'dark',r:{s:'star',n:5},aim:'enemy',e:[dmg(3),st('curse',1)],d:'3ダメージ。呪い1：次の手番、最初のカードのコスト+1。'},
 hexbolt:{n:'呪縛の矢',c:2,t:'atk',icon:'arrow-scope',anim:'weapon',fx:'dark',r:{s:'star',n:6,min:2},aim:'enemy',e:[dmg(6),st('curse',1),st('weak',1)],d:'6ダメージ、呪い1、衰弱1。'},
 soulsnare:{n:'魂縛',c:1,t:'skill',icon:'daemon-skull',r:{s:'star',n:8},aim:'enemy',e:[st('curse',1),st('vuln',1)],d:'呪い1、脆弱1。'},
 doomshot:{n:'終焉の矢',c:3,t:'atk',icon:'striking-arrows',anim:'weapon',fx:'dark',r:{s:'star',n:8,min:2},aim:'enemy',e:[dmg(14),st('curse',1)],d:'距離2〜8の敵に14ダメージ、呪い1。'},
 // エリア敵
 poisonbite:{n:'毒牙',c:1,t:'atk',icon:'snake-bite',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(3),st('poison',1)],d:'3ダメージ、毒1。',foe:1},
 poisoncloud:{n:'毒霧',c:2,t:'atk',icon:'poison-cloud',anim:'spell',fx:'dark',r:{s:'dia',n:4,nolos:1},aim:'any',a:'sq',e:[dmg(2),st('poison',2)],d:'3×3に2ダメージ、毒2。',foe:1},
 sandblast:{n:'砂嵐',c:2,t:'atk',icon:'whirlwind',anim:'spell',fx:'arrow',r:{s:'dia',n:3},aim:'any',a:'plus',e:[dmg(4),{k:'setTile',t:'quick'}],d:'十字に4ダメージ。地面を流砂にする。',foe:1},
 drainbite:{n:'吸血',c:1,t:'atk',icon:'fangs',anim:'weapon',r:{s:'adj'},aim:'enemy',e:[dmg(4),{k:'heal',v:3}],d:'4ダメージ、HP3回復。',foe:1},
 hellbreath:{n:'獄炎の息',c:2,t:'atk',el:'fire',icon:'fire-breath',anim:'spell',fx:'fire',r:{s:'line',n:3,pierce:1},aim:'any',a:'pierce',e:[dmg(6),st('burn',2)],d:'直線3マスを貫き6ダメージ、火傷2。',foe:1},
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
const STATUS={burn:{n:'火傷',d:'手番開始時に値ぶんダメージ、1減る',icon:'fire'},root:{n:'拘束',d:'移動カードを使えない',icon:'manacles'},weak:{n:'衰弱',d:'与えるダメージ-25%',icon:'despair'},vuln:{n:'脆弱',d:'受けるダメージ+50%',icon:'cracked-shield'},str:{n:'筋力',d:'与えるダメージに加算',icon:'muscle-up'},freeze:{n:'凍結',d:'次の手番に何もできない',icon:'frozen-block'},mark:{n:'標的',d:'受ける攻撃+3',icon:'on-target'},curse:{n:'呪い',d:'手番の最初のカードのコスト+1',icon:'daemon-skull'},poison:{n:'毒',d:'手番開始時に値ぶんダメージ。減らない（最大6）',icon:'poison-bottle'}};
const CLASSES={
 sword:{n:'剣士',w:'w_sword',hp:46,icon:'broadsword',desc:'近接特化。周囲8マスを斬る。耐久が高い。',deck:['slash','slash','slash','slash','guard','guard','walk','walk','walk','tiptoe','dashcut','sweep']},
 spear:{n:'槍兵',w:'w_spear',hp:40,icon:'spears',desc:'直線を貫き、敵を押して引く間合いの達人。',deck:['thrust','thrust','thrust','thrust','guard','guard','walk','walk','walk','leap','buttstrike','impale']},
 mage:{n:'魔術師',w:'w_staff',hp:32,icon:'wizard-staff',desc:'射程と範囲が広く脆い。転移で逃げる。',deck:['bolt','bolt','bolt','bolt','ward','ward','walk','walk','tiptoe','blink','frost','fireball']},
 bow:{n:'弓手',w:'w_bow',hp:36,icon:'high-shot',desc:'離れるほど強い。隣接されると撃てない。',deck:['shot','shot','shot','shot','guard','walk','walk','walk','sidestep','kickoff','pin','snipe']},
};
const REWARD=['sprint','leap','sidestep','knightstep','blink','shadow','slash','dashcut','sweep','cleave','hitrun','execute','thrust','impale','buttstrike','hookpull','vault','bolt','fireball','frost','meteor','chain','gust','shot','snipe','rain','pin','kickoff','fire_arrow','guard','ward','iron','focus','surge','rally','salve'];
const CLASS_POOL={sword:['slash','dashcut','sweep','cleave','hitrun','execute','iron','rally','shadow','sprint','knightstep','focus','salve','buttstrike'],spear:['thrust','impale','buttstrike','hookpull','vault','leap','iron','rally','sprint','knightstep','focus','salve','shadow'],mage:['thunderclap','bolt','fireball','frost','meteor','chain','gust','ward','blink','focus','surge','salve','shadow','knightstep'],bow:['shot','snipe','rain','pin','kickoff','fire_arrow','sidestep','leap','sprint','focus','surge','salve','guard','shadow']};
const FOES={
 goblin:{n:'ゴブリン',hp:13,hand:2,pref:1,deck:['stab','stab','stab','walk','walk','tiptoe'],look:{g:'male',skin:'green',head:'head_goblin',top:'top_short',topc:'brown',legc:'walnut',w:'w_sword'}},
 zombie:{n:'亡者',hp:22,hand:2,pref:1,deck:['bite','bite','shamble','shamble','shamble','stab'],look:{g:'male',body:'zombie',head:'head_zombie',top:'top_short',topc:'gray',legc:'charcoal'}},
 skel:{n:'骸骨兵',hp:17,hand:2,pref:1,deck:['slash','slash','stab','walk','walk','guard'],look:{g:'male',body:'skeleton',head:'head_skel',w:'w_sword'}},
 archer:{n:'骸骨弓兵',hp:13,hand:2,pref:4,deck:['shot','shot','shot','walk','walk','tiptoe'],look:{g:'male',body:'skeleton',head:'head_skel',w:'w_bow',hat:'hat_hood',hatc:'charcoal'}},
 orc:{n:'オーク',hp:26,hand:3,pref:1,deck:['club','club','stab','walk','walk','guard'],look:{g:'male',skin:'green',head:'head_orc',top:'top_leather',legc:'brown',feet:'boots',w:'w_spear'}},
 cultist:{n:'邪教徒',hp:15,hand:2,pref:3,deck:['darkbolt','darkbolt','hex','fireball','walk','walk'],look:{g:'female',skin:'light',head:'head_f',top:'top_long',topc:'purple',legc:'black',hat:'hat_wizard',w:'w_staff'}},
 necro:{n:'死霊使い',hp:15,hand:2,pref:3,deck:['raise','darkbolt','darkbolt','hex','walk','walk'],look:{g:'male',skin:'olive',head:'head_old_m',top:'top_long',topc:'charcoal',legc:'black',hat:'hat_hood',hatc:'charcoal',w:'w_gnarled'}},
 witch:{n:'氷の魔女',hp:13,hand:2,pref:3,deck:['frost','frost','shatter','shatter','walk','walk'],look:{g:'female',skin:'blue',head:'head_f',hair:'hair_long',hairc:'white',top:'top_long',topc:'sky',legc:'white',hat:'hat_celestial',w:'w_crystal'}},
 guardian:{n:'鉄の守り手',hp:20,hand:2,pref:1,t:{retainGuard:12},deck:['iron','guard','guard','slash','slash','walk','walk'],look:{g:'male',skin:'bronze',head:'head_m',top:'top_plate',topc:'steel',legc:'charcoal',feet:'boots',hat:'hat_great',hatc:'steel',w:'w_mace',sh:'sh_crusader'}},
 wolf:{n:'人狼',hp:16,hand:2,pref:1,deck:['dashcut','slash','slash','sprint','walk','walk'],look:{g:'male',skin:'brown',head:'head_wolf',top:'top_sl',topc:'maroon',legc:'walnut'}},
 bandit:{n:'砂の盗賊',hp:15,hand:2,pref:1,deck:['stab','stab','slash','sprint','walk','walk'],look:{g:'male',skin:'bronze',head:'head_m',top:'top_sl',topc:'tan',legc:'tan',feet:'sandals',feetc:'brown',hat:'hat_bandana',hatc:'orange',w:'w_scimitar'}},
 sandlizard:{n:'砂トカゲ兵',hp:18,hand:2,pref:1,deck:['slash','slash','guard','walk','walk','tiptoe'],look:{g:'male',skin:'olive',head:'head_lizard',top:'top_leather',topc:'tan',legc:'tan',w:'w_spear'}},
 sandmage:{n:'砂の呪術師',hp:13,hand:2,pref:3,deck:['sandblast','darkbolt','darkbolt','walk','walk'],look:{g:'female',skin:'bronze',head:'head_f',top:'top_long',topc:'yellow',legc:'tan',hat:'hat_hood',hatc:'tan',w:'w_staff'}},
 duneking:{n:'砂塵の王',hp:55,hand:3,pref:1,boss:1,deck:['sandblast','sandblast','slash','slash','bosscharge','sprint','walk'],look:{g:'male',skin:'olive',head:'head_lizard',top:'top_plate',topc:'gold',legc:'tan',feet:'boots',hat:'hat_crown',w:'w_scimitar'}},
 swamplizard:{n:'沼トカゲ',hp:20,hand:2,pref:1,deck:['poisonbite','poisonbite','slash','walk','walk'],look:{g:'male',skin:'green',head:'head_lizard',top:'top_sl',topc:'forest',legc:'forest',w:'w_trident'}},
 bogzombie:{n:'毒亡者',hp:26,hand:2,pref:1,deck:['poisonbite','poisonbite','poisonbite','shamble','shamble','shamble'],look:{g:'male',body:'zombie',head:'head_zombie',top:'top_short',topc:'forest',legc:'charcoal'}},
 toad:{n:'呪沼師',hp:15,hand:2,pref:3,deck:['poisoncloud','darkbolt','darkbolt','walk','walk'],look:{g:'male',skin:'green',head:'head_rat',top:'top_long',topc:'forest',legc:'black',hat:'hat_hood',hatc:'forest',w:'w_gnarled'}},
 swamplord:{n:'沼の主',hp:65,hand:3,pref:1,boss:1,deck:['poisoncloud','poisoncloud','poisonbite','club','club','sprint','walk'],look:{g:'male',skin:'green',head:'head_troll',top:'top_leather',topc:'forest',legc:'forest',feet:'boots',w:'w_mace'}},
 armor:{n:'動く鎧',hp:22,hand:2,pref:1,t:{retainGuard:10},deck:['guard','slash','slash','iron','walk','walk'],look:{g:'male',body:'skeleton',head:'head_skel',top:'top_plate',topc:'iron',hat:'hat_great',hatc:'iron',w:'w_longsword',sh:'sh_round'}},
 vampire:{n:'吸血鬼',hp:18,hand:2,pref:1,deck:['drainbite','drainbite','darkbolt','blink','walk'],look:{g:'female',skin:'light',head:'head_vamp',top:'top_bodice',topc:'black',legc:'maroon',hair:'hair_long',hairc:'black',w:'w_rapier'}},
 gargoyle:{n:'石像鬼',hp:24,hand:2,pref:1,deck:['slash','slash','leap','leap','guard'],look:{g:'male',skin:'black',head:'head_goblin',top:'top_plate',topc:'iron',legc:'charcoal',ear:'horn_curl'}},
 vampirelord:{n:'吸血公',hp:70,hand:3,pref:1,boss:1,t:{killHeal:10},deck:['drainbite','drainbite','drainbite','darkbolt','raise','blink','walk'],look:{g:'male',skin:'light',head:'head_vamp',top:'top_long',topc:'black',legc:'black',feet:'boots',feetc:'black',cape:'cape_trim',capec:'maroon',hair:'hair_parted',hairc:'black',w:'w_rapier'}},
 imp:{n:'小悪魔',hp:14,hand:2,pref:3,deck:['ignite','darkbolt','darkbolt','blink','walk'],look:{g:'teen',skin:'lavender',head:'head_goblin',top:'top_sl',topc:'maroon',legc:'black',ear:'horn_back',w:'w_wand'}},
 minotaur:{n:'牛頭',hp:32,hand:2,pref:1,deck:['club','club','rampage','sprint','walk'],look:{g:'male',skin:'brown',head:'head_mino',legc:'maroon',top:'top_sl',topc:'maroon',w:'w_waraxe'}},
 demon:{n:'魔族',hp:22,hand:3,pref:2,deck:['hellbreath','shot','slash','walk','walk'],look:{g:'male',skin:'lavender',head:'head_m',top:'top_plate',topc:'copper',legc:'maroon',feet:'boots',ear:'horn_curl',w:'w_halberd'}},
 gatekeeper:{n:'門の番人',hp:85,hand:4,pref:1,boss:1,t:{thorns:2},deck:['bossreap','bosscharge','bosscharge','club','hellbreath','slash','sprint','walk'],look:{g:'male',skin:'black',head:'head_mino',top:'top_plate',topc:'obsidian',legc:'black',feet:'boots',ear:'horn_curl',cape:'cape_tatter',capec:'maroon',w:'w_waraxe'}},
 knight:{n:'黒騎士',hp:60,hand:4,pref:1,boss:1,deck:['slash','slash','slash','bosscharge','bosscharge','bossreap','iron','walk','walk','sprint'],look:{g:'male',skin:'zombie_green',head:'head_m',top:'top_plate',topc:'iron',legc:'black',feet:'boots',hat:'hat_bascinet',w:'w_sword'}},
};
const STAGES=[
 {n:'森の入口',theme:'forest',w:8,h:8,foes:['goblin','goblin']},
 {n:'川べりの小径',theme:'forest',w:10,h:8,foes:['goblin','goblin','archer']},
 {n:'荒れた墓地',theme:'grave',w:9,h:10,foes:['skel','zombie','zombie']},
 {n:'弓兵の丘',theme:'grave',w:12,h:8,foes:['skel','archer','witch']},
 {n:'雪の峠',theme:'snow',w:10,h:10,foes:['orc','wolf']},
 {n:'凍った湖',theme:'snow',w:11,h:9,foes:['guardian','cultist','skel']},
 {n:'灰の火口',theme:'ash',w:10,h:11,foes:['orc','necro','wolf']},
 {n:'黒騎士の間',theme:'ash',w:12,h:12,foes:['knight','skel'],boss:1},
 {n:'砂の入口',theme:'desert',ti:1,w:9,h:8,foes:['bandit','bandit']},{n:'干上がった川',theme:'desert',ti:2,w:10,h:9,foes:['bandit','sandlizard','sandmage']},{n:'砂丘の群れ',theme:'desert',ti:3,w:12,h:8,foes:['sandlizard','bandit']},{n:'風の谷',theme:'desert',ti:4,w:10,h:10,foes:['bandit','sandlizard','sandmage']},{n:'砂塵の玉座',theme:'desert',ti:5,w:11,h:11,foes:['duneking','bandit'],boss:1},
 {n:'霧の沼地',theme:'swamp',ti:2,w:9,h:9,foes:['swamplizard','bogzombie']},{n:'泥の小道',theme:'swamp',ti:3,w:11,h:8,foes:['swamplizard','toad','bogzombie']},{n:'腐れ谷',theme:'swamp',ti:4,w:10,h:10,foes:['bogzombie','bogzombie','toad']},{n:'毒の庭',theme:'swamp',ti:5,w:12,h:9,foes:['swamplizard','swamplizard','toad','bogzombie']},{n:'沼の主の住処',theme:'swamp',ti:6,w:12,h:11,foes:['swamplord','toad'],boss:1},
 {n:'崩れた門',theme:'castle',ti:3,w:9,h:9,foes:['armor','gargoyle']},{n:'地下回廊',theme:'castle',ti:4,w:12,h:8,foes:['armor','vampire','gargoyle']},{n:'血の広間',theme:'castle',ti:5,w:10,h:10,foes:['vampire','vampire','gargoyle']},{n:'鎧の間',theme:'castle',ti:6,w:11,h:10,foes:['armor','armor','vampire','gargoyle']},{n:'吸血公の寝所',theme:'castle',ti:7,w:12,h:12,foes:['vampirelord','vampire'],boss:1},
 {n:'魔界の入口',theme:'abyss',ti:4,w:10,h:9,foes:['imp','imp','minotaur']},{n:'溶岩の橋',theme:'abyss',ti:5,w:12,h:9,foes:['demon','imp','minotaur']},{n:'叫びの原',theme:'abyss',ti:6,w:11,h:11,foes:['demon','demon','imp','imp']},{n:'処刑場',theme:'abyss',ti:7,w:12,h:10,foes:['minotaur','minotaur','demon','imp']},{n:'門の番人',theme:'abyss',ti:8,w:12,h:12,foes:['gatekeeper','imp','imp'],boss:1},
 {n:'修練の一の間',theme:'forest',ti:0,w:8,h:8,foes:['goblin','goblin']},{n:'修練の二の間',theme:'grave',ti:1,w:9,h:9,foes:['goblin','goblin']},{n:'修練の三の間',theme:'castle',ti:2,w:10,h:10,foes:['goblin','goblin','goblin']},
];
const AREAS={main:{n:'黒騎士の道',base:0,len:8,lv:1,theme:'forest'},desert:{n:'灼熱の砂漠',base:8,len:5,lv:5,theme:'desert'},swamp:{n:'毒の沼地',base:13,len:5,lv:10,theme:'swamp'},castle:{n:'古城の地下',base:18,len:5,lv:15,theme:'castle'},abyss:{n:'魔界の門',base:23,len:5,lv:20,theme:'abyss'},train:{n:'修練の洞窟',base:28,len:3,lv:1,theme:'forest',train:1}};
const TRAIN_BANDS=[[0,['goblin','skel','archer','zombie']],[8,['skel','orc','bandit','sandlizard','archer']],[15,['orc','swamplizard','wolf','vampire','armor']],[22,['minotaur','demon','imp','armor','vampire']]];
const trainXp=lv=>30+lv*9;
function trainFoes(lv,n,R){let list=TRAIN_BANDS[0][1];for(const[l,x]of TRAIN_BANDS)if(lv>=l)list=x;const o=[];for(let i=0;i<n;i++)o.push(list[Math.floor(R()*list.length)]);return o}
function mulberry(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffle(a,R){for(let i=a.length-1;i>0;i--){const j=Math.floor(R()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const inb=(G,x,y)=>x>=0&&y>=0&&x<G.w&&y<G.h&&G.cells[y][x].t!=='void';
const unitAt=(G,x,y)=>G.units.find(u=>!u.dead&&!u.air&&u.x===x&&u.y===y);
const solid=(G,x,y)=>!inb(G,x,y)||G.cells[y][x].t==='block';
const blocked=(G,x,y)=>!inb(G,x,y)||['block','water'].includes(G.cells[y][x].t);
const TILE_INFO={fire:'燃える地面: ここで手番を終えると3ダメージ。氷の攻撃で消える',water:'水: 通れない。雷の攻撃は水辺の敵全員に広がる。氷の攻撃で凍る',ice:'氷: 通れる。ここにいる敵は押される距離+1。火の攻撃で水に戻る',oil:'油: 通れる。火の攻撃で爆発して連鎖する',quick:'流砂: 通れる。ここで手番を終えると拘束1',bog:'毒沼: 通れる。ここで手番を終えると毒1',spike:'棘の床: 通れる。ここで手番を終えると3ダメージ'};
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
 else if(a==='land'){DIRS8.forEach(([p,q])=>add(t.x+p,t.y+q))}
 else if(a==='pierce'){const n=c.r.n;for(let i=1;i<=n;i++){const x=u.x+dx*i,y=u.y+dy*i;if(solid(G,x,y))break;add(x,y)}}
 else if(a==='fan'){add(t.x,t.y);if(dx)for(const q of[-1,1])add(t.x,t.y+q);else for(const p of[-1,1])add(t.x+p,t.y)}
 return out}
function targets(G,u,c){const rt=rangeTiles(G,u,c);
 if(c.aim==='self')return rt;
 if(c.aim==='empty')return rt.filter(t=>free(G,t.x,t.y));
 if(c.aim==='enemy')return rt.filter(t=>{const v=unitAt(G,t.x,t.y);if(!v||!foeOf(u,v))return false;if(c.e.some(e=>e.k==='dash'))return dashTile(G,u,t)!==null;return true});
 return rt}
function dashTile(G,u,t){const [dx,dy]=dirOf(u,t);let x=u.x,y=u.y;for(;;){const a=x+dx,b=y+dy;if(a===t.x&&b===t.y)return(x===u.x&&y===u.y)?null:{x,y};if(!free(G,a,b))return null;x=a;y=b}}
const isMoveCard=c=>c.t==='move'||!!c.move;
const isJump=c=>c.e.some(e=>e.k==='moveTo'&&e.jump);
const isSpell=c=>c.anim==='spell';
function costOf(u,c){let n=c.c;const T=u.t||{},F=u.flags||{};if(T.moveFree&&!F.movedFree&&isMoveCard(c)&&!c.e.some(e=>e.k==='dmg'))n=0;if(T.jumpFree&&!F.jumpedFree&&isJump(c))n=0;if(T.spellCut&&!F.spellCut&&isSpell(c))n=Math.max(0,n-T.spellCut);if(T.combo&&F.freeSpell&&isSpell(c))n=0;if(u.status.curse>0&&!F.curseUsed)n+=1;return n}
const HP_RATE=u=>(u.t&&u.t.hpCost)||0;
function canPlay(G,u,c){if(u.air)return false;if(u.soarCd>0&&c.e.some(e=>e.k==='soar'))return false;const co=costOf(u,c);if(co>u.mana){const r=HP_RATE(u);if(!r||u.hp<=(co-u.mana)*r)return false}if(c.e.some(e=>e.k==='summon')&&G.units.filter(x=>x.summon&&!x.dead).length>=2+((u.t&&u.t.summonCap)||0))return false;if((c.t==='move'||c.move)&&u.status.root>0)return false;return true}
function calcDmg(a,d,v,c){let n=v+(a.status.str||0);const T=a.t||{};if(T.lowAtk&&a.hp*2<a.maxHp)n+=T.lowAtk;if(a.nextAtk&&!(c&&isSpell(c)))n+=a.nextAtk;if(d.status.mark>0)n+=3;if(T.firstAtk&&!(a.flags&&a.flags.atked))n+=T.firstAtk;if(T.rootDmg&&(d.status.root>0||d.status.freeze>0))n+=T.rootDmg;if(T.distAtk&&man(a.x,a.y,d.x,d.y)>=4)n+=T.distAtk;if(T.aoeAtk&&c&&c.a)n+=T.aoeAtk;if(T.hazardAtk&&a._G&&['fire','oil','bog','quick','spike','ice'].includes(a._G.cells[d.y][d.x].t))n+=T.hazardAtk;if(T.poisonAtk&&d.status.poison>0)n+=T.poisonAtk;if(T.hexAtk&&d.status.curse>0)n+=T.hexAtk;if(T.cornerAtk&&a._G&&DIRS4.some(([p,q])=>solid(a._G,d.x+p,d.y+q)))n+=T.cornerAtk;if(a.status.weak>0)n=Math.floor(n*.75);if(d.status.vuln>0)n=Math.floor(n*1.5);return Math.max(0,n)}
function hurt(G,v,n,evs,src){const blk=Math.min(v.block,n);v.block-=blk;const hp=n-blk;v.hp-=hp;evs.push({t:'dmg',u:v.id,v:hp,blk,src});if(v.hp<=0&&!v.dead){v.hp=0;v.dead=true;evs.push({t:'die',u:v.id})}}
function displace(G,v,dx,dy,n,evs,a){if(G.cells[v.y][v.x].t==='ice')n++;let x=v.x,y=v.y,moved=0,hit=false,other=null;const p=[[x,y]];for(let i=0;i<n;i++){const X=x+dx,Y=y+dy;if(!free(G,X,Y)){hit=true;other=unitAt(G,X,Y);break}x=X;y=Y;moved++;p.push([x,y])}
 v.x=x;v.y=y;if(moved)evs.push({t:'slide',u:v.id,p});if(hit&&!v.dead)hurt(G,v,3+((a&&a.t&&a.t.wallDmg)||0),evs,'wall');if(hit&&other&&a&&a.t&&a.t.collide&&foeOf(a,other)&&!other.dead)hurt(G,other,a.t.collide,evs,'wall');if(moved&&!v.dead)afterMove(G,v,evs)}
function afterMove(G,v,evs){const tr=G.traps&&G.traps.findIndex(t=>t.x===v.x&&t.y===v.y&&t.side!==v.side);if(tr>=0){const t=G.traps.splice(tr,1)[0];evs.push({t:'trapHit',x:t.x,y:t.y});hurt(G,v,t.dmg,evs,'trap');if(!v.dead){v.status.root=(v.status.root||0)+1;evs.push({t:'status',u:v.id,s:'root',v:1});if(t.burn){v.status.burn=(v.status.burn||0)+t.burn;evs.push({t:'status',u:v.id,s:'burn',v:t.burn})}}}
 if(v.dead)return;for(const w of G.units){if(w.dead||w.air||!foeOf(w,v)||!(w.over>0)||!(w.t&&w.t.overwatch))continue;const dx=v.x-w.x,dy=v.y-w.y,d=Math.max(Math.abs(dx),Math.abs(dy));if(d<1||d>2||(dx&&dy)||!los(G,w.x,w.y,v.x,v.y))continue;w.over--;evs.push({t:'swing',u:w.id,x:v.x,y:v.y,anim:'weapon',card:'thrust',area:[{x:v.x,y:v.y}]});hurt(G,v,w.t.overwatch+(w.status.str||0),evs,'hit');if(v.dead)return}}
function retreatTile(G,u,from){let best=null,score=-1,d;const {out}=bfs(G,u,from.n);for(const t of out){d=man(t.x,t.y,from.x,from.y);if(d>score){score=d;best=t}}return best}
function shuffleIn(u,R){shuffle(u.discard,R);u.draw.push(...u.discard);u.discard=[]}
function drawN(G,u,n,evs){for(let i=0;i<n;i++){if(!u.draw.length){if(!u.discard.length)break;shuffleIn(u,G.R);evs&&evs.push({t:'reshuffle',u:u.id})}u.hand.push(u.draw.pop());evs&&evs.push({t:'draw',u:u.id})}}
function play(G,u,idx,t){u._G=G;const id=u.hand[idx],c=CARDS[id],evs=[],T=u.t||{},F=u.flags=u.flags||{},cost=costOf(u,c),deadBefore=new Set(G.units.filter(x=>x.dead).map(x=>x.id));{const d=cost-u.mana;if(d>0){u.mana=0;hurt(G,u,d*HP_RATE(u),evs,'self')}else u.mana-=cost}u.hand.splice(idx,1);if(T.combo&&isSpell(c)&&F.freeSpell&&!c.e.some(e=>e.k==='dmg'))F.freeSpell=0;
 if(T.moveFree&&!F.movedFree&&isMoveCard(c)&&!c.e.some(e=>e.k==='dmg'))F.movedFree=1;if(T.jumpFree&&!F.jumpedFree&&isJump(c))F.jumpedFree=1;if(T.spellCut&&!F.spellCut&&isSpell(c))F.spellCut=1;if(u.status.curse>0)F.curseUsed=1;
 if(c.once)(u.exhaust=u.exhaust||[]).push(id);else u.discard.push(id);
 evs.push({t:'play',u:u.id,card:id,tx:t.x,ty:t.y});
 const area=areaTiles(G,u,c,t);
 const victims=(c.aim==='self'&&!c.a)?[]:area.map(p=>unitAt(G,p.x,p.y)).filter(v=>v&&foeOf(u,v));
 const hasDash=c.e.some(e=>e.k==='dash');
 if(!hasDash&&(c.t==='atk'&&!c.e.some(e=>e.k==='moveTo')))evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});
 else if(c.t==='skill')evs.push({t:'cast',u:u.id,anim:c.anim,card:id});
 for(const e of c.e){switch(e.k){
  case'moveTo':{if(c.a==='land'){}const p=c.r.s==='walk'?pathTo(G,u,c.r.n+(u.walkBonus||0),t.x,t.y):[[u.x,u.y],[t.x,t.y]];F.moved=1;{const st=c.r.s==='walk'?p.length-1:man(p[0][0],p[0][1],t.x,t.y);if(T.dance)u.nextAtk=Math.min((u.nextAtk||0)+st*T.dance,6+(T.danceCap||0));if(T.moveDraw&&!F.moveDrew){F.moveDrew=1;drawN(G,u,T.moveDraw,evs)}}u.x=t.x;u.y=t.y;evs.push({t:'move',u:u.id,p,jump:e.jump,blink:e.blink});afterMove(G,u,evs);if(c.a==='land')evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});if(e.jump&&T.jumpAtk)u.nextAtk=T.jumpAtk;if(T.moveGuard){u.block+=T.moveGuard;evs.push({t:'block',u:u.id,v:T.moveGuard})}break}
  case'dash':{const d=dashTile(G,u,t),p=[[u.x,u.y],[d.x,d.y]];F.moved=1;u.x=d.x;u.y=d.y;evs.push({t:'move',u:u.id,p,dash:1});afterMove(G,u,evs);evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});break}
  case'dmg':for(const v of victims)if(!v.dead){const amt=calcDmg(u,v,e.v,c);hurt(G,v,amt,evs,'hit');thorn(G,u,v,evs);if(T.bounce&&!c.a)bounce(G,u,v,amt,T.bounce,evs);if(T.poisonOn&&!v.dead&&!isSpell(c)&&c.t==='atk'&&(v.status.poison||0)<6){v.status.poison=(v.status.poison||0)+T.poisonOn;evs.push({t:'status',u:v.id,s:'poison',v:T.poisonOn})}}break;
  case'poisonBurst':for(const v of victims)if(!v.dead){const n=(v.status.poison||0)*e.v;v.status.poison=0;if(n>0)hurt(G,v,n,evs,'hit');evs.push({t:'status',u:v.id,s:'poison',v:0,txt:'毒爆'})}break;
  case'over':u.over=(u.over||0)+e.v;evs.push({t:'status',u:u.id,s:'str',v:0,txt:'迎撃+'+e.v});break;
  case'swap':for(const v of victims){const[x0,y0]=[u.x,u.y];u.x=v.x;u.y=v.y;v.x=x0;v.y=y0;F.moved=1;evs.push({t:'move',u:u.id,p:[[x0,y0],[u.x,u.y]],blink:1});evs.push({t:'slide',u:v.id,p:[[u.x,u.y],[x0,y0]]});afterMove(G,v,evs)}break;
  case'soar':u.air={x:t.x,y:t.y,dmg:e.v+(T.soarDmg||0)};evs.push({t:'air',u:u.id,x:t.x,y:t.y});break;
  case'trap':G.traps=G.traps||[];if(G.traps.filter(x=>x.side===u.side).length>=3)G.traps.splice(G.traps.findIndex(x=>x.side===u.side),1);G.traps.push({x:t.x,y:t.y,side:u.side,dmg:e.v+(T.trapDmg||0),burn:e.burn||0});evs.push({t:'trapSet'});break;
  case'summon':{const d=FOES[e.f],id=G.units.length,ally=makeUnit(id,u.side,{...d,hp:d.hp+(T.summonHp||0),n:'使役: '+d.n,hand:Math.max(2,d.hand),kind:e.f});ally.deck=e.f==='skel'?['slash','slash','stab','walk','walk','tiptoe']:d.deck.slice();ally.summon=1;ally.x=t.x;ally.y=t.y;ally.t={};if(T.summonAtk)ally.status.str=T.summonAtk;ally.draw=shuffle(ally.deck.slice(),G.R);G.units.push(ally);evs.push({t:'summon',u:id});break}
  case'dmgBlock':for(const v of victims)if(!v.dead){hurt(G,v,calcDmg(u,v,Math.floor(u.block/2)+e.v,c),evs,'hit');thorn(G,u,v,evs)}break;
  case'selfDmg':hurt(G,u,e.v,evs,'self');break;
  case'setTile':for(const p of area){const C=G.cells[p.y][p.x];if(!['floor','fire','quick','bog','spike','oil','ice'].includes(C.t))continue;if((e.t==='block'||e.t==='water')&&unitAt(G,p.x,p.y))continue;C.t=e.t;if(e.t==='block')C.v=C.v||.5}evs.push({t:'terrain'});break;
  case'block':u.block+=e.v;evs.push({t:'block',u:u.id,v:e.v});break;
  case'heal':{const n=Math.min(e.v,u.maxHp-u.hp);u.hp+=n;evs.push({t:'heal',u:u.id,v:n});break}
  case'draw':drawN(G,u,e.v,evs);break;
  case'mana':u.mana+=e.v;evs.push({t:'mana',u:u.id,v:e.v});break;
  case'status':if(e.self){u.status[e.s]=(u.status[e.s]||0)+e.v;evs.push({t:'status',u:u.id,s:e.s,v:e.v})}else for(const v of victims)if(!v.dead){let nv=e.v+(e.s==='burn'?(T.burnPlus||0):0),sk=e.s;if(sk==='poison')nv=Math.min(nv,6-(v.status.poison||0));if(sk==='freeze'&&(v.boss||v.frzCd>0)){sk='root';nv=1}if(sk==='burn'&&T.spread)v.spread=1;v.status[sk]=(v.status[sk]||0)+nv;evs.push({t:'status',u:v.id,s:e.s,v:nv})}break;
  case'push':for(const v of victims){if(v.dead)continue;let[dx,dy]=[Math.sign(v.x-u.x),Math.sign(v.y-u.y)];displace(G,v,dx,dy,e.v+(T.pushExtra||0),evs,u)}break;
  case'pull':for(const v of victims){if(v.dead)continue;let[dx,dy]=[Math.sign(u.x-v.x),Math.sign(u.y-v.y)];const n=Math.min(e.v,Math.max(Math.abs(u.x-v.x),Math.abs(u.y-v.y))-1);if(n>0)displace(G,v,dx,dy,n,evs)}break;
  case'retreat':{const foe=victims[0]||{x:t.x,y:t.y};const b=retreatTile(G,u,{x:foe.x,y:foe.y,n:e.v});if(b){const p=pathTo(G,u,e.v,b.x,b.y);F.moved=1;u.x=b.x;u.y=b.y;evs.push({t:'move',u:u.id,p});afterMove(G,u,evs)}break}
 }}
 if(c.el)react(G,u,c,area,victims,evs);
 if(c.t==='atk'&&c.e.some(e=>e.k==='dmg'||e.k==='dmgBlock')){F.atked=1;if(!isSpell(c)||!T.combo)u.nextAtk=0;if(T.combo){if(isSpell(c)){u.nextAtk=T.combo;F.freeSpell=0}else F.freeSpell=1}if(T.atkGuard){u.block+=T.atkGuard;evs.push({t:'block',u:u.id,v:T.atkGuard})}}
 const kills=G.units.filter(x=>x.dead&&!deadBefore.has(x.id)&&foeOf(u,x)).length;
 if(kills&&!u.dead){if(T.killMana){u.mana+=T.killMana*kills;evs.push({t:'mana',u:u.id,v:T.killMana*kills})}if(T.killDraw)drawN(G,u,T.killDraw*kills,evs);if(T.killHeal){const n=Math.min(T.killHeal*kills,u.maxHp-u.hp);if(n>0){u.hp+=n;evs.push({t:'heal',u:u.id,v:n})}}}
 return evs}
function bounce(G,a,v,amt,n,evs){let cur=v,hit=new Set([v.id]),d=Math.floor(amt/2);for(let i=0;i<n&&d>0;i++){const nx=G.units.filter(x=>!x.dead&&!x.air&&foeOf(a,x)&&!hit.has(x.id)&&man(x.x,x.y,cur.x,cur.y)<=3).sort((p,q)=>man(p.x,p.y,cur.x,cur.y)-man(q.x,q.y,cur.x,cur.y))[0];if(!nx){if(!cur.dead){evs.push({t:'bounce',from:cur.id,u:cur.id});hurt(G,cur,d,evs,'hit');d=Math.floor(d/2);continue}break}hit.add(nx.id);evs.push({t:'bounce',from:cur.id,u:nx.id});hurt(G,nx,d,evs,'hit');cur=nx;d=Math.floor(d/2)}}
function react(G,u,c,area,victims,evs){let changed=false;const at=(x,y)=>G.cells[y][x];
 if(c.el==='ice')for(const p of area){const C=at(p.x,p.y);if(C.t==='water'){C.t='ice';changed=true}else if(C.t==='fire'){C.t='floor';changed=true}}
 if(c.el==='fire'){const seen=new Set,stack=area.filter(p=>at(p.x,p.y).t==='oil').map(p=>[p.x,p.y]),hurtSet=new Set;for(const p of area){const C=at(p.x,p.y);if(C.t==='ice'&&!unitAt(G,p.x,p.y)){C.t='water';changed=true}}
  while(stack.length){const[x,y]=stack.pop(),k=x+','+y;if(seen.has(k))continue;seen.add(k);at(x,y).t='fire';changed=true;evs.push({t:'blast',x,y});for(const[dx,dy]of DIRS8){const X=x+dx,Y=y+dy;if(!inb(G,X,Y))continue;if(at(X,Y).t==='oil')stack.push([X,Y])}for(const[dx,dy]of[[0,0],...DIRS8]){const v=unitAt(G,x+dx,y+dy);if(v&&foeOf(u,v))hurtSet.add(v.id)}}
  for(const id of hurtSet){const v=G.units[id];if(!v.dead)hurt(G,v,5+((u.t&&u.t.blastDmg)||0),evs,'blast')}}
 if(c.el==='thunder'){const wetNear=v=>DIRS8.map(([p,q])=>[v.x+p,v.y+q]).filter(([x,y])=>inb(G,x,y)&&at(x,y).t==='water');const wet=new Set;for(const v of victims)if(!v.dead)for(const[x,y]of wetNear(v)){const st=[[x,y]];while(st.length){const[a,b]=st.pop(),k=a+','+b;if(wet.has(k))continue;wet.add(k);for(const[p,q]of DIRS4)if(inb(G,a+p,b+q)&&at(a+p,b+q).t==='water')st.push([a+p,b+q])}}
  if(wet.size)for(const v of G.units){if(v.dead||v.air||!foeOf(u,v)||victims.includes(v))continue;if(wetNear(v).some(([x,y])=>wet.has(x+','+y))){evs.push({t:'bounce',from:u.id,u:v.id});hurt(G,v,4,evs,'shock')}}}
 if(changed)evs.push({t:'terrain'})}
function thorn(G,a,v,evs){const n=v.t&&v.t.thorns;if(n&&!a.dead&&!v.dead&&Math.max(Math.abs(a.x-v.x),Math.abs(a.y-v.y))<=1)hurt(G,a,n,evs,'thorn')}
function startTurn(G,u){const evs=[];const T0=u.t||{};u.block=T0.retainGuard?Math.min(u.block,T0.retainGuard):0;u.flags={};u.over=0;if(u.air){const a=u.air;u.air=null;u.soarCd=1;let dest=null;if(free(G,a.x,a.y))dest=a;else for(const[dx,dy]of DIRS8)if(free(G,a.x+dx,a.y+dy)){dest={x:a.x+dx,y:a.y+dy};break}if(!dest)dest={x:u.x,y:u.y};const p=[[u.x,u.y],[dest.x,dest.y]];u.x=dest.x;u.y=dest.y;evs.push({t:'move',u:u.id,p,jump:1});const near=DIRS8.map(([q,r])=>unitAt(G,dest.x+q,dest.y+r)).filter(v=>v&&foeOf(u,v));evs.push({t:'swing',u:u.id,x:dest.x,y:dest.y,anim:'weapon',card:'slash',area:DIRS8.map(([q,r])=>({x:dest.x+q,y:dest.y+r})).filter(t=>inb(G,t.x,t.y)&&!solid(G,t.x,t.y))});for(const v of near)hurt(G,v,a.dmg+(u.status.str||0),evs,'hit');afterMove(G,u,evs)}u.mana=u.maxMana+(u.manaNext||0);u.manaNext=0;let extra=0;if(!u.opened){u.opened=1;u.block+=u.startBlock||0;u.mana+=u.mana1||0;extra=u.firstDraw||0}if(u.status.poison>0)hurt(G,u,u.status.poison,evs,'poison');if(u.status.burn>0){if(u.spread)for(const[dx,dy]of DIRS4){const o=unitAt(G,u.x+dx,u.y+dy);if(o&&o.side===u.side&&!o.dead){o.status.burn=(o.status.burn||0)+1;o.spread=1;evs.push({t:'status',u:o.id,s:'burn',v:1})}}hurt(G,u,u.status.burn,evs,'burn');u.status.burn--}drawN(G,u,Math.max(0,u.handSize+extra-u.hand.length),evs);return evs}
function endTurn(G,u){const evs=[];if(u.t&&u.t.overwatch&&!u.dead&&!u.air)u.over=(u.over||0)+u.mana+(u.t.overPlus||0);if(u.t&&u.t.stillMana&&!(u.flags&&u.flags.moved))u.manaNext=u.t.stillMana;if(u.t&&u.t.endGuard&&u.mana>0&&!u.dead){const g=u.t.endGuard*Math.min(3,u.mana);u.block+=g;evs.push({t:'block',u:u.id,v:g})}u.discard.push(...u.hand);u.hand=[];if(u.preDraw&&!u.dead)drawN(G,u,u.handSize);if(u.frzCd>0)u.frzCd--;if(u.soarCd>0)u.soarCd--;for(const s of['root','weak','vuln','mark','curse'])if(u.status[s]>0)u.status[s]--;if(!u.dead&&!u.air){const ct=G.cells[u.y][u.x].t;if(ct==='fire'&&!(u.t&&u.t.fireSafe))hurt(G,u,3,evs,'fire');if(ct==='spike')hurt(G,u,3,evs,'spike');if(ct==='quick'){u.status.root=(u.status.root||0)+1;evs.push({t:'status',u:u.id,s:'root',v:1})}if(ct==='bog'&&(u.status.poison||0)<6){u.status.poison=(u.status.poison||0)+1;evs.push({t:'status',u:u.id,s:'poison',v:1})}}return evs}
function makeUnit(id,side,o){const u={id,side,x:0,y:0,hp:o.hp,maxHp:o.maxHp||o.hp,mana:3,maxMana:3,block:0,status:{},hand:[],discard:[],draw:[],exhaust:[],handSize:o.hand||5,deck:o.deck.slice(),name:o.n,look:o.look,pref:o.pref||1,boss:o.boss,kind:o.kind};return u}
function genMap(stage,R){const{w,h,theme}=stage;for(let tries=0;tries<300;tries++){const cells=[];for(let y=0;y<h;y++){const r=[];for(let x=0;x<w;x++)r.push({t:'floor',v:R()});cells.push(r)}
 const G={w,h,cells,theme,units:[]};
 // 四隅を欠けさせて不定形に
 if(w*h>=80){const cut=1+Math.floor(R()*2);for(const[cx,cy]of[[0,0],[w-1,0],[0,h-1],[w-1,h-1]]){if(R()<.65)for(let a=0;a<cut;a++)for(let b=0;b<cut-a;b++){cells[Math.abs(cy-b)][Math.abs(cx-a)].t='void'}}}
 const liquid={forest:'water',grave:'water',snow:'water',ash:'fire',desert:'quick',swamp:'bog',castle:'spike',abyss:'fire'}[theme],blobs=Math.round(w*h/40);
 for(let i=0;i<blobs;i++){let x=1+Math.floor(R()*(w-2)),y=2+Math.floor(R()*(h-4)),L=4+Math.floor(R()*6);while(L-->0){for(const[p,q]of[[0,0],[1,0],[0,1],[1,1]])if(inb(G,x+p,y+q)&&y+q<h-1)cells[y+q][x+p].t=liquid;const[d,e]=DIRS4[Math.floor(R()*4)];x+=d;y+=e}}
 if(theme==='grave'||theme==='ash'||R()<.4){const n=1+Math.floor(R()*2);for(let i=0;i<n;i++){let x=1+Math.floor(R()*(w-2)),y=3+Math.floor(R()*Math.max(1,h-5)),L=3+Math.floor(R()*3);while(L-->0){if(inb(G,x,y)&&cells[y][x].t==='floor')cells[y][x].t='oil';const[d,e]=DIRS4[Math.floor(R()*4)];x+=d;y+=e}}}
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
function heroUnit(id,side,run,x,y,R){const p=makeUnit(id,side,{n:run.name,hp:run.hp,maxHp:run.maxHp,deck:run.deck,hand:5,look:run.look,kind:'hero',pref:run.pref});const b=run.bonus||{};if(b.atk)p.status.str=b.atk;p.startBlock=b.guard||0;p.firstDraw=b.draw||0;p.walkBonus=b.walk||0;p.mana1=b.mana1||0;p.t=b.traits||{};p.x=x;p.y=y;p.facing=1;p.draw=shuffle(p.deck.slice(),R);const top=p.draw.length-1;if(!p.draw.slice(-5).some(i=>CARDS[i].t==='move')){const j=p.draw.findIndex(i=>CARDS[i].t==='move');if(j>=0)[p.draw[j],p.draw[top]]=[p.draw[top],p.draw[j]]}return p}
function setupBattle(stageIdx,hero,seed){const elite=hero.cur&&hero.cur.kind==='elite',R=mulberry(seed),s0=STAGES[stageIdx],s=hero.train?{...s0,foes:trainFoes(hero.train,s0.foes.length,R)}:s0,G=genMap(s,R);G.R=R;G.stage=stageIdx;G.turn=1;
 hero.deck.forEach(ensureCard);const p=heroUnit(0,'hero',hero,G.pSpot.x,G.pSpot.y,R);G.units.push(p);
 (elite?[...s.foes,s.foes[0]]:s.foes).forEach((f,i)=>{const d=FOES[f],df=hero.diff||0,u=makeUnit(i+1,'foe',{...d,hp:Math.round(d.hp*(1+df*.3)*(elite?1.25:1)*(hero.train?.7+hero.train*.045:({desert:.8,swamp:1.3,castle:1.4,abyss:1.45}[s.theme]||1))),kind:f});if(df||hero.train)u.status.str=(df||0)+(hero.train?Math.floor(hero.train/7):0);[u.x,u.y]=G.fSpots[i];u.facing=0;u.draw=shuffle(u.deck.slice(),R);u.preDraw=1;drawN(G,u,u.handSize);G.units.push(u)});return G}
const alive=(G,side)=>G.units.filter(u=>!u.dead&&u.side===side);
function skipsTurn(u){if(u.status.freeze>0){u.status.freeze--;u.frzCd=3;return true}return false}
const outcome=G=>G.units[0].dead?'lose':!alive(G,'foe').length?'win':null;
// AI ------------------------------------------------
function estHit(G,u,c,t){let sum=0,kill=0;for(const p of areaTiles(G,u,c,t)){const v=unitAt(G,p.x,p.y);if(!v)continue;if(!foeOf(u,v))continue;let hit=0;for(const e of c.e){if(e.k==='dmg')hit+=calcDmg(u,v,e.v,c);if(e.k==='dmgBlock')hit+=calcDmg(u,v,Math.floor(u.block/2)+e.v,c)}const eff=Math.max(0,hit-v.block);sum+=eff+(c.e.some(e=>e.k==='status')?2:0);if(c.e.some(e=>e.k==='status'&&e.s==='freeze')&&!v.boss&&!(v.frzCd>0))sum+=14;const pu=c.e.find(e=>e.k==='push');if(pu){const dx=Math.sign(v.x-u.x),dy=Math.sign(v.y-u.y),T=u.t||{};let x=v.x,y=v.y,hit=false,other=null;for(let i=0;i<pu.v+(T.pushExtra||0);i++){if(!free(G,x+dx,y+dy)){hit=true;other=unitAt(G,x+dx,y+dy);break}x+=dx;y+=dy}if(hit)sum+=3+(T.wallDmg||0);if(other&&T.collide&&foeOf(u,other))sum+=T.collide}if(eff>=v.hp)kill++}return{sum,kill}}
function canHitFrom(G,u,x,y,ids,mana){const ox=u.x,oy=u.y;u.x=x;u.y=y;let best=0;for(const id of ids){const c=CARDS[id];if(costOf(u,c)>mana||c.t!=='atk')continue;for(const t of targets(G,u,c)){const r=estHit(G,u,c,t);if(r.sum>best)best=r.sum}}u.x=ox;u.y=oy;return best}
// 次の手番で相手が届くマスと、最大ダメージ
function threatMap(G,u){if(u.dead||u.air||!u.hand.length)return new Map;const str=u.status.str||0,atk=u.hand.map(id=>CARDS[id]).filter(c=>c.t==='atk'&&c.e.some(e=>e.k==='dmg'||e.k==='dmgBlock')),mv=u.status.root>0?[]:u.hand.map(id=>CARDS[id]).filter(c=>c.t==='move'||c.e.some(e=>e.k==='moveTo')&&c.t!=='atk');const pos=[{x:u.x,y:u.y,m:u.maxMana}];for(const c of mv)for(const t of targets(G,u,c))if(c.c<=u.maxMana)pos.push({x:t.x,y:t.y,m:u.maxMana-c.c});const ox=u.x,oy=u.y,out=new Map;for(const p of pos){u.x=p.x;u.y=p.y;const per=new Map;for(const c of atk){if(c.c>p.m)continue;const hits=c.e.filter(e=>e.k==='dmg').length||1,d=c.e.reduce((a,e)=>a+(e.k==='dmg'?e.v:e.k==='dmgBlock'?e.v:0),0)+str*hits,seen=new Set;for(const t of rangeTiles(G,u,c))for(const a of areaTiles(G,u,c,t)){const k=a.x+','+a.y;if(seen.has(k))continue;seen.add(k);if(!per.has(k))per.set(k,[]);per.get(k).push([c.c,d])}}for(const[k,l]of per){l.sort((a,b)=>b[1]/(b[0]||.5)-a[1]/(a[0]||.5));let m=p.m,sum=0;for(const[co,d]of l)if(co<=m){m-=co;sum+=d}if(sum>(out.get(k)||0))out.set(k,sum)}}u.x=ox;u.y=oy;return out}
function chooseAI(G,u){if(u.air)return null;const foes=alive(G,u.side==='foe'?'hero':'foe').filter(f=>!f.air);if(!foes.length)return null;const gap=(x,y)=>Math.min(...foes.map(f=>{const d=Math.max(Math.abs(x-f.x),Math.abs(y-f.y));return Math.abs(d-u.pref)+(d<u.pref?1:0)}));let best=null,bs=0;const curHit=canHitFrom(G,u,u.x,u.y,u.hand,u.mana);
 u.hand.forEach((id,i)=>{const c=CARDS[id];if(!canPlay(G,u,c)||(costOf(u,c)>u.mana&&u.hp<u.maxHp*.6)||false)return;const rest=u.hand.filter((_,j)=>j!==i);
  for(const t of targets(G,u,c)){let s=0;if(c.e.some(e=>e.k==='soar')){const adj=foes.filter(f=>Math.max(Math.abs(f.x-t.x),Math.abs(f.y-t.y))===1).length;if(!adj)continue;s=(curHit===0||u.hp<u.maxHp*.5)?10+adj*6:2;s+=G.R()*.2;if(s>bs){bs=s;best={i,t}}continue}if(c.e.some(e=>e.k==='trap')){const d=Math.min(...foes.map(f=>man(f.x,f.y,t.x,t.y)));if(d<1||d>2||(G.traps||[]).some(p=>man(p.x,p.y,t.x,t.y)<2))continue;s=7-d+G.R()*.2;if(curHit>=8)s=1;if(s>bs){bs=s;best={i,t}}continue}
   if((c.t==='move'||c.e.some(e=>e.k==='moveTo'))&&c.a!=='land'){const g0=gap(u.x,u.y),g1=gap(t.x,t.y);const h=canHitFrom(G,u,t.x,t.y,rest,u.mana-costOf(u,c));if(curHit>0&&h<=curHit)continue;s=(g0-g1)*2+h*3;if(['fire','spike','quick','bog'].includes(G.cells[t.y][t.x].t))s-=6;if(s<=0)s=g0>g1?.5:0}
   else if(c.t==='atk'){const r=estHit(G,u,c,t);if(!r.sum)continue;s=r.sum*3+r.kill*20-costOf(u,c)*2;if(c.e.some(e=>e.k==='selfDmg')&&u.hp<=8)continue}
   else if(c.t==='skill'&&c.e.some(e=>e.k==='setTile'))s=0;else if(c.e.some(e=>e.k==='summon'))s=9;else{const near=foes.some(f=>man(f.x,f.y,u.x,u.y)<=5);if(c.e.some(e=>e.k==='block'))s=(u.t&&u.t.retainGuard)?5:near&&curHit===0?4:(near?1:0);else if(c.e.some(e=>e.k==='heal'))s=u.hp<u.maxHp*.6?8:0;else s=3}
   s+=G.R()*.2;if(s>bs){bs=s;best={i,t}}}});return best}
// 成長と装備 ----------------------------------------
const RARITY={c:{n:'並',col:'#c9c2b0'},r:{n:'上',col:'#6fb6ff'},e:{n:'極',col:'#ffb547'}};
const I=(n,slot,rar,o)=>({n,slot,rar,...o});
const ITEMS_B={
 sw_iron:I('鉄の剣','weapon','c',{cls:'sword',sp:'w_sword'}),sw_dagger:I('短剣','weapon','c',{cls:'sword',sp:'w_dagger',card:'hitrun'}),sw_saber:I('サーベル','weapon','c',{cls:'sword',sp:'w_saber',card:'cleave'}),sw_scimitar:I('偃月刀','weapon','r',{cls:'sword',sp:'w_scimitar',atk:1,hp:3}),sw_rapier:I('細剣','weapon','r',{cls:'sword',sp:'w_rapier',card:'dashcut',walk:0}),sw_long:I('長剣','weapon','r',{cls:'sword',sp:'w_longsword',atk:1,card:'cleave'}),sw_mace:I('鎚矛','weapon','r',{cls:'sword',sp:'w_mace',atk:2,hp:-4}),sw_katana:I('刀','weapon','e',{cls:'sword',sp:'w_katana',atk:2,card:'hitrun'}),sw_axe:I('戦斧','weapon','e',{cls:'sword',sp:'w_waraxe',atk:2,card:'execute'}),
 sp_iron:I('鉄の槍','weapon','c',{cls:'spear',sp:'w_spear'}),sp_long:I('長槍','weapon','c',{cls:'spear',sp:'w_longspear',card:'hookpull'}),sp_trident:I('三叉槍','weapon','r',{cls:'spear',sp:'w_trident',atk:1,card:'buttstrike'}),sp_halberd:I('斧槍','weapon','r',{cls:'spear',sp:'w_halberd',atk:1,hp:4}),sp_scythe:I('大鎌','weapon','e',{cls:'spear',sp:'w_scythe',atk:2,card:'sweep'}),sp_dragon:I('竜槍','weapon','e',{cls:'spear',sp:'w_dragon',atk:2,card:'impale'}),
 st_simple:I('木の杖','weapon','c',{cls:'mage',sp:'w_staff'}),st_wand:I('小杖','weapon','c',{cls:'mage',sp:'w_wand',card:'gust'}),st_gnarled:I('節くれの杖','weapon','c',{cls:'mage',sp:'w_gnarled',hp:3}),st_loop:I('環の杖','weapon','r',{cls:'mage',sp:'w_loop',atk:1,card:'frost'}),st_diamond:I('菱石の杖','weapon','r',{cls:'mage',sp:'w_diamond',card:'chain'}),st_crystal:I('水晶の杖','weapon','e',{cls:'mage',sp:'w_crystal',atk:2,card:'meteor'}),
 bw_normal:I('狩人の弓','weapon','c',{cls:'bow',sp:'w_bow'}),bw_recurve:I('反り弓','weapon','r',{cls:'bow',sp:'w_recurve',atk:1,card:'fire_arrow'}),bw_great:I('大弓','weapon','e',{cls:'bow',sp:'w_great',atk:2,card:'snipe'}),
 ar_cloth:I('旅の服','armor','c',{hp:2}),ar_leather:I('革の胴着','armor','c',{hp:5}),ar_robe:I('魔導衣','armor','c',{hp:2,card:'ward'}),ar_chain:I('鎖帷子','armor','r',{hp:9}),ar_shadow:I('影の外套','armor','r',{hp:4,card:'shadow'}),ar_plate:I('板金鎧','armor','e',{hp:15,guard:2}),ar_dragon:I('竜鱗の鎧','armor','e',{hp:10,guard:4,atk:1}),
 of_buckler:I('木の盾','off','c',{guard:3,sp:'sh_round'}),of_tome:I('古い魔導書','off','c',{card:'focus'}),of_quiver:I('予備の矢筒','off','r',{card:'rain'}),of_crusader:I('聖騎士の盾','off','r',{guard:5,hp:3,sp:'sh_crusader'}),of_spartan:I('大円盾','off','e',{guard:8,card:'iron',sp:'sh_spartan'}),
 jb_paladin:I('聖盾の剣','weapon','e',{cls:'sword',job:'paladin',sp:'w_longsword',atk:1,guard:5,trait:{endGuard:1}}),jb_asura:I('修羅の大刀','weapon','e',{cls:'sword',job:'asura',sp:'w_katana',atk:3,trait:{killHeal:4}}),jb_dragoon:I('天翔ける槍','weapon','e',{cls:'spear',job:'dragoon',sp:'w_dragon',atk:2,trait:{jumpAtk:2}}),jb_marshal:I('軍配の鉾','weapon','e',{cls:'spear',job:'tactician',sp:'w_halberd',atk:2,trait:{wallDmg:3}}),jb_pyro:I('灰燼の杖','weapon','e',{cls:'mage',job:'pyro',sp:'w_diamond',atk:2,trait:{burnPlus:1}}),jb_cryo:I('氷晶の杖','weapon','e',{cls:'mage',job:'cryo',sp:'w_crystal',atk:2,trait:{rootDmg:2}}),jb_sniper:I('遠望の弓','weapon','e',{cls:'bow',job:'sniper',sp:'w_great',atk:2,trait:{distAtk:2}}),jb_ranger:I('森渡りの弓','weapon','e',{cls:'bow',job:'ranger',sp:'w_recurve',atk:2,trait:{moveGuard:1}}),
 jb_spellblade:I('魔導の剣','weapon','e',{cls:'sword',job:'spellblade',sp:'w_scimitar',atk:2,trait:{combo:2}}),jb_sentinel:I('守りの長槍','weapon','e',{cls:'spear',job:'sentinel',sp:'w_longspear',atk:1,guard:4,trait:{overwatch:3}}),jb_necro:I('骸の杖','weapon','e',{cls:'mage',job:'necro',sp:'w_gnarled',atk:1,trait:{summonHp:10,summonAtk:1}}),jb_trick:I('跳ね弓','weapon','e',{cls:'bow',job:'trickshot',sp:'w_recurve',atk:2,trait:{bounce:1}}),
 jb_dancer:I('舞姫の曲刀','weapon','e',{cls:'sword',job:'dancer',sp:'w_scimitar',atk:1,walk:1,trait:{dance:1}}),jb_venom:I('毒牙の槍','weapon','e',{cls:'spear',job:'venom',sp:'w_trident',atk:1,trait:{poisonOn:1,poisonAtk:1}}),jb_alchemist:I('実験の杖','weapon','e',{cls:'mage',job:'alchemist',sp:'w_loop',atk:1,trait:{hazardAtk:2,blastDmg:3}}),jb_hexer:I('怨念の弓','weapon','e',{cls:'bow',job:'hexer',sp:'w_great',atk:1,trait:{hexAtk:3}}),
 ch_iron:I('鉄の指輪','charm','c',{hp:4}),ch_boot:I('軽い靴紐','charm','c',{card:'sidestep'}),ch_salve:I('薬草袋','charm','c',{card:'salve'}),ch_lion:I('獅子の護符','charm','r',{atk:1}),ch_book:I('修行の書','charm','r',{xp:30}),ch_wing:I('風の羽','charm','r',{walk:1}),ch_hand:I('早指の手袋','charm','r',{draw:1}),ch_heart:I('治癒の心臓','charm','r',{heal:15}),ch_star:I('星の欠片','charm','e',{mana1:1}),ch_eye:I('賢者の瞳','charm','e',{picks:1,draw:1}),
};
const TINTS={moss:{n:'苔むす',cloth:'forest',metal:'bronze',wt:[110,170,100]},bark:{n:'樹皮の',cloth:'walnut',metal:'copper',wt:[180,130,80]},grave:{n:'墓土の',cloth:'gray',metal:'iron',wt:[130,130,140]},violet:{n:'紫紺の',cloth:'purple',metal:'steel',wt:[150,110,210]},frost:{n:'霜降る',cloth:'sky',metal:'silver',wt:[170,220,255]},snow:{n:'雪白の',cloth:'white',metal:'silver',wt:[235,240,255]},ember:{n:'熾火の',cloth:'red',metal:'copper',wt:[255,120,70]},obsidian:{n:'黒曜の',cloth:'black',metal:'steel',wt:[80,75,95]},bone:{n:'骨色の',cloth:'tan',metal:'brass',wt:[225,215,180]},royal:{n:'王家の',cloth:'navy',metal:'gold',wt:[255,205,90]},dune:{n:'砂塵の',cloth:'tan',metal:'brass',wt:[225,185,110]},mire:{n:'泥濘の',cloth:'forest',metal:'bronze',wt:[105,130,70]},noble:{n:'古城の',cloth:'navy',metal:'silver',wt:[170,185,225]},abyss:{n:'魔界の',cloth:'maroon',metal:'steel',wt:[200,50,70]}};
const TINT_THEME={forest:['moss','bark'],grave:['grave','violet'],snow:['frost','snow'],ash:['ember','obsidian'],desert:['dune','bark'],swamp:['mire','moss'],castle:['noble','grave'],abyss:['abyss','obsidian']};
const TINT_FOE={bandit:'dune',sandlizard:'dune',sandmage:'dune',duneking:'royal',swamplizard:'mire',bogzombie:'mire',toad:'moss',swamplord:'royal',armor:'noble',vampire:'noble',gargoyle:'grave',vampirelord:'royal',imp:'abyss',minotaur:'abyss',demon:'obsidian',gatekeeper:'royal',goblin:'bark',zombie:'grave',skel:'bone',archer:'bone',orc:'ember',cultist:'violet',necro:'violet',witch:'frost',guardian:'noble',wolf:'bark',knight:'royal'};
const ITEMS=new Proxy(ITEMS_B,{get(t,k){if(typeof k==='string'&&k.includes('@')){const[b,c]=k.split('@'),o=t[b];if(!o||!TINTS[c])return undefined;return{...o,n:TINTS[c].n+o.n,tint:c,base:b}}return t[k]}});
const UNDER={top:['top_sl2','top_sl','top_tee','top_short','top_long'],topc:'white',leg:['leg_shorts','legs','leg_skirt'],legc:'white',feet:''};
const ARMOR_LOOK={ar_cloth:{top:['top_short','top_tee','top_long'],topc:'tan',leg:'legs',legc:'walnut',feet:'shoes',feetc:'brown'},ar_leather:{top:['top_leather','top_long'],topc:'leather',leg:'legs',legc:'brown',feet:'boots',feetc:'brown'},ar_robe:{top:['top_long'],topc:'navy',leg:['leg_pantaloons','legs'],legc:'navy',feet:'shoes',feetc:'black'},ar_chain:{top:['top_legion','top_plate'],topc:'steel',leg:'legs',legc:'charcoal',feet:'boots',feetc:'charcoal',hat:'hat_mail',hatc:'steel'},ar_shadow:{top:['top_long'],topc:'black',leg:['leg_leggings','legs'],legc:'charcoal',feet:'boot_fold',feetc:'black',hat:'hat_hood',hatc:'charcoal',cape:'cape_tatter',capec:'black'},ar_plate:{top:['top_plate'],topc:'steel',leg:['leg_armour','legs'],legc:'steel',feet:['feet_armour','boots'],feetc:'steel',arm:'arm_armour',armc:'steel'},ar_dragon:{top:['top_plate'],topc:'gold',leg:['leg_armour','legs'],legc:'gold',feet:['feet_armour','boots'],feetc:'gold',arm:'arm_pauldron',armc:'gold',cape:'cape_trim',capec:'maroon'}};
const JOBS={};
const cardNode=c=>({n:CARDS[c].n,icon:CARDS[c].icon,card:c,d:'デッキに「'+CARDS[c].n+'」を加える。'+CARDS[c].d});
function branch(base,side,B){const L={a:0,b:2,c:4,d:2}[side],p=base+'.'+side+'.',r1={a:'r1l',b:'r1c',c:'r1r',d:'root'}[side],o=[];const add=(k,r,c,cost,req,x)=>o.push({id:p+k,r,c,cost,req,max:1,...x,...(B.area?{area:B.area,secret:1}:{})});
 add('intro',2,L,1,[base+'.'+r1],cardNode(B.intro));
 JOBS[B.cls.job]={n:B.cls.n,base,tier:1,icon:B.cls.icon,uniq:B.cls.uniq};JOBS[B.mas.job]={n:B.mas.n,base,tier:2,icon:B.mas.icon,uniq:B.mas.uniq};
 add('cls',3,L+.5,2,[p+'intro'],{...B.cls,lv:10,group:'adv',kind:'job'});
 add('r4o',4,L,2,[p+'cls'],cardNode(B.r4o));add('r4i',4,L+1,2,[p+'cls'],B.r4i);
 add('r5o',5,L,2,[p+'r4o'],B.r5o);add('r5i',5,L+1,2,[p+'r4i'],cardNode(B.r5i));
 add('mas',6,L+.5,3,[p+'r5o',p+'r5i'],{...B.mas,lv:20,kind:'job'});
 add('r7o',7,L,3,[p+'mas'],cardNode(B.r7o));add('r7i',7,L+1,3,[p+'mas'],B.r7i);return o}
function mkTree(base,A,B,Cc,Dd){const p=base+'.',N=(id,r,c,cost,req,x)=>({id:p+id,r,c,cost,req,max:1,...x});return[
 N('root',0,2.5,1,[],{n:'修行の始まり',icon:'laurels',e:{hp:3},d:'最大HP+3'}),
 N('r1l',1,0,1,[p+'root'],{n:'頑丈',icon:'heart-plus',max:3,e:{hp:5},d:'最大HP+5'}),
 N('r2c',1,1,2,[p+'r1l'],{n:'手際',icon:'card-draw',e:{draw:1},d:'最初の手札+1'}),
 N('r1c',1,2,1,[p+'root'],{n:'受け身',icon:'round-shield',max:2,e:{guard:3},d:'戦闘開始時のガード+3'}),
 N('r3c',1,3,3,[p+'r1c'],{n:'鍛錬',icon:'biceps',max:2,e:{atk:1},d:'攻撃のダメージ+1'}),
 N('r1r',1,4,1,[p+'root'],{n:'回復力',icon:'healing',max:2,e:{heal:10},d:'戦闘後の回復+10%'}),
 N('r4c',1,5,2,[p+'r1r'],{n:'目利き',icon:'magnifying-glass',e:{picks:1},d:'カード報酬の候補+1'}),
 N('r5c',2,1,3,[p+'r2c'],{n:'健脚',icon:'walking-boot',e:{walk:1},d:'歩く系カードの距離+1'}),
 N('r6c',2,3,4,[p+'r3c'],{n:'達人の体',icon:'body-balance',lv:20,e:{hp:12,guard:3},d:'最大HP+12、開始ガード+3'}),
 N('r7c',2,5,5,[p+'r4c'],{n:'大器',icon:'crown',lv:25,e:{mana1:1,atk:1},d:'初ターンのマナ+1、攻撃+1'}),
 ...branch(base,'a',A),...branch(base,'b',B),...branch(base,'c',Cc),...branch(base,'d',Dd)]}
const TR=(n,icon,trait,d)=>({n,icon,trait,d});
const J=(job,n,icon,hp,trait,card,uniq,d)=>({job,n,icon,e:{hp},trait,card,uniq,d:'【'+uniq+'】'+d+'（最大HP+'+hp+'、札「'+CARDS[card].n+'」）'});
const TREES={
 sword:mkTree('sword',
 {intro:'iron',cls:J('paladin','聖騎士','templar-shield',8,{retainGuard:15},'shieldbash','不滅の盾','ガードが手番をまたいで残る（上限15）。'),r4o:'holyward',r4i:TR('堅忍','shield-echoes',{atkGuard:1},'攻撃カードを使うたびガード+1'),r5o:{n:'不動',icon:'stone-wall',e:{guard:5},d:'開始ガード+5'},r5i:'judgment',mas:J('templar','神殿騎士','visored-helm',8,{thorns:3,retainGuard:5},'sanctuary','反撃の聖印','隣接する敵から攻撃されると3ダメージで反撃。ガード上限+5。'),r7o:'rally',r7i:TR('神の加護','angel-outfit',{killHeal:4,atkGuard:1},'敵を倒すとHP4回復、攻撃時ガード+1')},
 {intro:'execute',cls:J('berserker','狂戦士','barbarian',4,{lowAtk:3,hpCost:3},'bloodhit','血の代償','マナが足りないとき、不足1につきHP3で支払える。HP半分未満で攻撃+3。'),r4o:'rampage',r4i:TR('血の渇き','drop',{killHeal:5},'敵を倒すとHP5回復'),r5o:TR('捨て身','broken-skull',{lowAtk:2},'HPが半分未満の間の攻撃がさらに+2'),r5i:'warcry',mas:J('asura','修羅','daemon-pull',6,{killMana:1},'musou','屍の糧','敵を倒すとマナ+1。'),r7o:'sweep',r7i:TR('屍山血河','skull-crossed-bones',{killDraw:1,firstAtk:2},'敵を倒すと1枚引く。各手番の最初の攻撃+2')},
 {intro:'bolt',cls:J('spellblade','魔剣士','rune-sword',8,{combo:4},'flameblade','魔剣連携','魔法で攻撃すると次の武器攻撃+4。武器で攻撃すると次の魔法のコスト0。'),r4o:'runeslash',r4i:TR('刃の詠唱','magic-swirl',{firstAtk:1,aoeAtk:1},'最初の攻撃+1、範囲攻撃+1'),r5o:TR('属性付与','fire-gem',{burnPlus:1},'与える火傷+1'),r5i:'frost',mas:J('runeknight','魔導騎士','swordman',8,{combo:3,spellCut:1},'arcstorm','無限連携','連携の威力+3。各手番の最初の魔法のコスト-1。'),r7o:'meteor',r7i:TR('魔力循環','cycle',{killMana:1},'敵を倒すとマナ+1')},
 {area:'desert',intro:'sandstep',cls:J('dancer','砂塵の舞踏家','run',10,{dance:2,firstAtk:2},'dancestep','舞踏','移動した1マスにつき次の攻撃+2（上限+6）。最初の攻撃+2。'),r4o:'wheelcut',r4i:TR('軽業','acrobatic',{moveGuard:1},'移動のたびにガード+1'),r5o:TR('砂の足運び','walking-boot',{danceCap:2,firstAtk:1},'舞踏の上限+2、最初の攻撃+1'),r5i:'sprint',mas:J('sandsaint','砂嵐の剣聖','swordman',12,{moveDraw:1,danceCap:2,atkGuard:2},'dunestorm','旋風','各手番の最初の移動で1枚引く。舞踏の上限+2、攻撃時ガード+2。'),r7o:'cleave',r7i:TR('無限の舞','cycle',{dance:1},'舞踏の増加量+1')}),
 spear:mkTree('spear',
 {intro:'vault',cls:J('dragoon','竜騎士','spiked-dragon-head',6,{jumpAtk:2},'soar','飛翔','空へ上がって敵の攻撃を避け、次の手番に降下攻撃。跳んだ後の攻撃+2。'),r4o:'jumpthrust',r4i:TR('軽身','feather',{jumpFree:1},'各手番の最初の跳ぶカードのコスト0'),r5o:TR('竜鱗','dragon-shield',{moveGuard:2},'移動のたびにガード+2'),r5i:'dive',mas:J('dragonlord','竜王','dragon-head',8,{jumpAtk:1,soarDmg:3},'skyfall','竜の急襲','飛翔の降下+3ダメージ。跳んだ後の攻撃+1。'),r7o:'dragonroar',r7i:TR('竜の心臓','dragon-orb',{killMana:1,aoeAtk:1},'敵を倒すとマナ+1。範囲攻撃+1')},
 {intro:'hookpull',cls:J('tactician','戦術家','chess-queen',5,{wallDmg:5,collide:6,firstAtk:2,cornerAtk:2},'swap','衝突と入替','押した敵が別の敵に当たると、当たられた側にも6ダメージ。壁ダメージ+5、最初の攻撃+2、壁際の敵への攻撃+2。敵と位置を入れ替えられる。'),r4o:'shove',r4i:TR('間合い管理','path-distance',{pushExtra:1},'押す距離+1'),r5o:TR('読み','brain',{firstAtk:2},'各手番の最初の攻撃+2'),r5i:'pincer',mas:J('marshal','軍師','chess-king',12,{killDraw:1,collide:6,cornerAtk:2},'collideslam','連鎖衝突','衝突ダメージ+6。壁際の敵への攻撃さらに+2。敵を倒すと1枚引く。'),r7o:'shockwave',r7i:TR('勝ち筋','sinusoidal-beam',{wallDmg:4,atkGuard:2},'壁ダメージさらに+4、攻撃時ガード+2')},
 {intro:'guard',cls:J('sentinel','槍陣師','spear-feather',7,{overwatch:7,overPlus:1},'brace','迎撃','手番の終わりに「余ったマナ+1」回ぶん、直線2マスに入った敵を自動で突く（7ダメージ）。'),r4o:'impale',r4i:TR('待ち構え','guarded-tower',{overPlus:1},'迎撃の回数+1'),r5o:TR('鉄の穂先','spear-hook',{overwatch:2},'迎撃のダメージ+2'),r5i:'holyward',mas:J('spearsaint','槍聖','stone-spear',10,{overwatch:3,overPlus:1},'thousand','無窮の槍','迎撃のダメージ+3、回数+1。'),r7o:'formation',r7i:TR('不破の陣','guarded-tower',{retainGuard:20},'ガードが手番をまたいで残る（上限20）')},
 {area:'swamp',intro:'venomthrust',cls:J('venom','毒槍使い','poison-bottle',9,{poisonOn:2,poisonAtk:1},'detonate','蝕み','武器攻撃が当たるたび毒2を与える。毒の敵への攻撃+1。毒爆で一気に起爆できる。'),r4o:'toxicfield',r4i:TR('毒への耐性','bubbling-flask',{poisonAtk:1},'毒の敵への攻撃+1'),r5o:TR('腐食の穂先','spear-hook',{poisonAtk:1,firstAtk:1},'毒の敵への攻撃+1、最初の攻撃+1'),r5i:'impale',mas:J('plaguelord','腐蝕の王','crowned-skull',10,{poisonAtk:3},'plague','疫病','毒の敵への攻撃さらに+3。'),r7o:'hookpull',r7i:TR('万毒','skull-crossed-bones',{poisonOn:1,killMana:1},'武器攻撃の毒+1、撃破でマナ+1')}),
 mage:mkTree('mage',
 {intro:'gust',cls:J('pyro','炎術師','fire-spell-cast',3,{burnPlus:1,fireSafe:1,spread:1},'ignite','延焼','火傷の敵が手番を迎えると隣の敵へ燃え移る。与える火傷+1。燃える地面で無傷。'),r4o:'flamejet',r4i:TR('熱量','thermometer-hot',{aoeAtk:1},'範囲攻撃+1'),r5o:TR('火の呼吸','fire-breath',{spellCut:1},'各手番の最初の魔法のコスト-1'),r5i:'scorch',mas:J('inferno','獄炎の賢者','wizard-face',5,{burnPlus:1,aoeAtk:1},'phoenix','業火','火傷さらに+1、範囲攻撃+1。'),r7o:'meteor',r7i:TR('灰の王','campfire',{killMana:1},'敵を倒すとマナ+1')},
 {intro:'frost',cls:J('cryo','氷術師','snowflake-2',5,{rootDmg:2},'deepfreeze','凍結','敵を凍らせて手番を丸ごと奪う。拘束・凍結中の敵への攻撃+2。'),r4o:'icewall',r4i:TR('冷気の衣','frozen-body',{endGuard:2},'余りマナ1につき手番の終わりにガード+2'),r5o:TR('凍てつく手','frozen-arrow',{firstAtk:2},'各手番の最初の攻撃+2'),r5i:'shatter',mas:J('chrono','時の賢者','hourglass',8,{spellCut:1,stillMana:1},'timewarp','時の貯蓄','移動しなかった手番の次はマナ+1。最初の魔法のコスト-1。'),r7o:'blizzard',r7i:TR('静止の理','pocket-watch',{rootDmg:2,killDraw:1},'拘束への攻撃さらに+2、倒すと1枚引く')},
 {intro:'hex',cls:J('necro','死霊術師','death-note',8,{summonHp:6,summonAtk:1},'raise','死者の使役','骸骨兵を呼び出して一緒に戦う。使役は自分で動く。HP+6、攻撃+1の状態で現れる。'),r4o:'drain',r4i:TR('骨の補強','ribcage',{summonHp:8},'使役のHP+8'),r5o:TR('怨念','ghost',{summonAtk:2},'使役の攻撃+2'),r5i:'raisezombie',mas:J('lich','冥王','crowned-skull',10,{summonCap:1,summonAtk:3},'deathwave','死の軍勢','使役の上限+1、攻撃+3。'),r7o:'chain',r7i:TR('魂の収穫','soul-vessel',{killHeal:4,killMana:1},'敵を倒すとHP4回復、マナ+1')},
 {area:'castle',intro:'alchfire',cls:J('alchemist','錬金術師','round-bottom-flask',6,{hazardAtk:3},'oilflask','地形錬成','火、油、毒沼、流砂、棘、氷の上の敵への攻撃+3。地形を自由に作り変える。'),r4o:'waterflask',r4i:TR('爆発物の知識','fire-bomb',{blastDmg:4},'油の爆発ダメージ+4'),r5o:TR('触媒','bubbling-flask',{spellCut:1},'最初の魔法のコスト-1'),r5i:'frostflask',mas:J('philosopher','賢者の石','crystal-ball',8,{hazardAtk:2,blastDmg:4},'grandwork','万物変成','地形の上の敵への攻撃+2、爆発+4。'),r7o:'chain',r7i:TR('黄金律','cycle',{killMana:1,killDraw:1},'撃破でマナ+1、1枚引く')}),
 bow:mkTree('bow',
 {intro:'pin',cls:J('sniper','狙撃手','crosshair',4,{distAtk:3,stillMana:1},'mark','不動の狙い','移動しなかった手番の次はマナ+1。距離4以上の攻撃+3。'),r4o:'aim',r4i:TR('呼吸法','lungs',{firstAtk:2},'各手番の最初の攻撃+2'),r5o:TR('鷹の視界','eagle-emblem',{distAtk:2},'距離4以上の攻撃がさらに+2'),r5i:'deadeye',mas:J('hawkeye','鷹の目','hawk-emblem',6,{killDraw:1},'hawkstrike','必殺の眼','敵を倒すと1枚引く。'),r7o:'piercer',r7i:TR('必中','bullseye',{killMana:1,firstAtk:2},'敵を倒すとマナ+1、最初の攻撃さらに+2')},
 {intro:'sidestep',cls:J('ranger','狩人','hood',6,{moveFree:1,firstAtk:2},'trap','罠猟','マスに見えない罠を置ける。各手番の最初の移動カードのコスト0、最初の攻撃+2。'),r4o:'net',r4i:TR('身のこなし','acrobatic',{moveGuard:2},'移動のたびにガード+2'),r5o:TR('罠の知識','wolf-trap',{trapDmg:4,rootDmg:3},'罠のダメージ+4、拘束中の敵への攻撃+3'),r5i:'trapfire',mas:J('phantom','影の狩人','cloak-dagger',8,{moveGuard:2,trapDmg:4},'volley','影の罠師','移動のガード+2、罠のダメージ+4。'),r7o:'smokestep',r7i:TR('影縫い','shadow-follower',{killDraw:1,killMana:1},'敵を倒すと1枚引き、マナ+1')},
 {intro:'shot',cls:J('trickshot','曲射手','ricochet',5,{bounce:1},'ricochet','跳弾','単体攻撃が近くの別の敵へ半分のダメージで跳ねる。他に敵がいなければ同じ敵にもう一度当たる。'),r4o:'backshot',r4i:TR('連鎖の勘','chain-mail',{firstAtk:1,atkGuard:1},'最初の攻撃+1、攻撃時ガード+1'),r5o:TR('手数','quick-slash',{bounce:1},'跳弾の回数+1'),r5i:'pin',mas:J('godbow','神弓','high-shot',6,{distAtk:2},'stardrop','無尽の矢','距離4以上の攻撃+2。'),r7o:'rain',r7i:TR('流星','falling-star',{killMana:1,killDraw:1},'敵を倒すとマナ+1、1枚引く')},
 {area:'abyss',intro:'soulsnare',cls:J('hexer','呪矢の射手','daemon-skull',9,{hexAtk:3,firstAtk:2},'cursearrow','呪縛','相手に呪いをかけ、次の手番の最初のカードを重くする。呪いの敵への攻撃+3、最初の攻撃+2。'),r4o:'hexbolt',r4i:TR('怨みの弦','bow-arrow',{firstAtk:2},'最初の攻撃+2'),r5o:TR('魂の刻印','on-target',{hexAtk:2},'呪いの敵への攻撃+2'),r5i:'pin',mas:J('curselord','呪王','crowned-skull',8,{hexAtk:3,killMana:1},'doomshot','滅びの予告','呪いの敵への攻撃さらに+3、撃破でマナ+1。'),r7o:'rain',r7i:TR('終わらぬ呪い','skull-crossed-bones',{killDraw:1,hexAtk:1},'撃破で1枚引く、呪いの敵への攻撃+1')}),
};
const SETS={guard:{n:'鉄壁',b2:{guard:4},b3:{hp:12,trait:{atkGuard:2}},d2:'開始ガード+4',d3:'最大HP+12、攻撃時ガード+2'},swift:{n:'疾風',b2:{walk:1},b3:{draw:1,trait:{moveGuard:2}},d2:'歩く距離+1',d3:'初手+1、移動ガード+2'},mind:{n:'叡智',b2:{draw:1},b3:{mana1:1,trait:{killDraw:1}},d2:'初手+1',d3:'初ターンのマナ+1、撃破で1枚引く'},war:{n:'闘志',b2:{atk:1},b3:{atk:1,trait:{firstAtk:2,killHeal:3}},d2:'攻撃+1',d3:'攻撃+1、最初の攻撃+2、撃破でHP3回復'}};
const ITEM_SET_B={ar_chain:'guard',ar_plate:'guard',of_buckler:'guard',of_crusader:'guard',of_spartan:'guard',ch_iron:'guard',sw_dagger:'swift',sp_long:'swift',st_wand:'swift',bw_recurve:'swift',ar_shadow:'swift',ch_boot:'swift',ch_wing:'swift',ch_hand:'swift',st_loop:'mind',st_diamond:'mind',ar_robe:'mind',of_tome:'mind',ch_book:'mind',ch_eye:'mind',ch_star:'mind',sw_mace:'war',sw_axe:'war',sp_halberd:'war',sp_scythe:'war',bw_great:'war',ar_leather:'war',ar_dragon:'war',of_quiver:'war',ch_lion:'war',ch_heart:'war'};
const ITEM_SET=new Proxy(ITEM_SET_B,{get(t,k){return typeof k==='string'?t[k.split('@')[0]]:t[k]}});
function activeSets(h){const c={};for(const s of['weapon','armor','off','charm']){const id=h.equip[s];if(id&&itemOk(h,ITEMS[id])&&ITEM_SET[id])c[ITEM_SET[id]]=(c[ITEM_SET[id]]||0)+1}return c}
const NODE={};for(const k in TREES)for(const n of TREES[k])NODE[n.id]=n;
const STARTER={sword:'sw_iron',spear:'sp_iron',mage:'st_simple',bow:'bw_normal'};
const LEVEL_CAP=30,xpNeed=lv=>90+lv*70;
function newHero(id,name,cls,look){return initBuild({id,name:name||'旅人',cls,look,level:1,xp:0,tree:{},equip:{weapon:STARTER[cls],armor:'ar_cloth',off:'',charm:''},inv:[STARTER[cls],'ar_cloth'],wins:0,best:0})}
function itemDesc(it){const a=[];if(it.atk)a.push('攻撃+'+it.atk);if(it.hp)a.push('HP'+(it.hp>0?'+':'')+it.hp);if(it.guard)a.push('開始ガード+'+it.guard);if(it.walk)a.push('歩く距離+'+it.walk);if(it.draw)a.push('初手+'+it.draw);if(it.mana1)a.push('初ターンのマナ+'+it.mana1);if(it.heal)a.push('戦後回復+'+it.heal+'%');if(it.picks)a.push('報酬候補+'+it.picks);if(it.xp)a.push('経験値+'+it.xp+'%');if(it.card)a.push('札「'+CARDS[it.card].n+'」');if(it.trait)for(const k in it.trait)a.push(({endGuard:'余りマナのガード',killHeal:'撃破回復',jumpAtk:'跳躍後の攻撃',wallDmg:'壁ダメージ',burnPlus:'火傷',rootDmg:'拘束への攻撃',distAtk:'遠距離の攻撃',moveGuard:'移動ガード',combo:'連携',overwatch:'迎撃',summonHp:'使役HP',summonAtk:'使役の攻撃',bounce:'跳弾回数',dance:'舞踏',poisonOn:'与える毒',poisonAtk:'毒の敵への攻撃',hazardAtk:'地形の敵への攻撃',blastDmg:'爆発',hexAtk:'呪いの敵への攻撃'})[k]+'+'+it.trait[k]);if(it.job)a.push(JOBS[it.job].n+'専用');return a.join(' / ')||'初期装備'}
function jobLine(h){const t=h.tree||{};return TREES[h.cls].filter(n=>n.kind==='job'&&t[n.id]).map(n=>n.job)}
function jobName(h){const l=jobLine(h);return l.length?JOBS[l[l.length-1]].n:CLASSES[h.cls].n}
const itemOk=(h,it)=>it&&(!it.cls||it.cls===h.cls)&&(!it.job||jobLine(h).includes(it.job));
function heroStats(h){const b={atk:0,guard:0,walk:0,draw:0,heal:0,picks:0,xp:0,mana1:0,traits:{}},k=CLASSES[h.cls];let hp=k.hp+(h.level-1)*2;const cards=[],T=h.tree||{};const addE=(e,n=1)=>{if(!e)return;if(e.hp)hp+=e.hp*n;for(const f of['atk','guard','walk','draw','heal','picks','xp','mana1'])b[f]+=(e[f]||0)*n};const addT=t=>{if(t)for(const q in t)b.traits[q]=(b.traits[q]||0)+t[q]};
 for(const n of TREES[h.cls]){const r=T[n.id]||0;if(!r)continue;addE(n.e,r);addT(n.trait);if(n.card)cards.push(n.card)}
 for(const s of['weapon','armor','off','charm']){const it=ITEMS[h.equip[s]];if(!itemOk(h,it))continue;addE(it);addT(it.trait);if(it.card)cards.push(it.card)}for(const[k,n]of Object.entries(activeSets(h))){const S=SETS[k];if(n>=2){addE(S.b2);addT(S.b2.trait)}if(n>=3){addE(S.b3);addT(S.b3.trait)}}b.walk=Math.min(b.walk,2);return{maxHp:hp,bonus:b,cards}}
const treeSpent=h=>TREES[h.cls].reduce((s,n)=>s+n.cost*((h.tree||{})[n.id]||0),0);
const perkLeft=h=>h.level-1-treeSpent(h);
const groupTaken=(h,n)=>n.group&&TREES[h.cls].some(x=>x.group===n.group&&x.id!==n.id&&(h.tree||{})[x.id]);
const reqMet=(h,n)=>!n.req.length||n.req.some(id=>(h.tree||{})[id]);
function canLearn(h,id){const n=NODE[id],t=h.tree||{};if(n.area&&!(h.areas&&h.areas[n.area]))return false;return(t[id]||0)<n.max&&perkLeft(h)>=n.cost&&h.level>=(n.lv||1)&&reqMet(h,n)&&!groupTaken(h,n)}
function canForget(h,id){const t=h.tree||{};if(!t[id])return false;if(t[id]>1)return true;return!TREES[h.cls].some(n=>t[n.id]&&n.req.includes(id)&&!n.req.some(r=>r!==id&&t[r]))}
function learn(h,id){if(!canLearn(h,id))return false;h.tree=h.tree||{};h.tree[id]=(h.tree[id]||0)+1;fixEquip(h);if(h.deck&&NODE[id].card)addGranted(h,[NODE[id].card]);return true}
function forget(h,id){if(!canForget(h,id))return false;h.tree[id]--;if(!h.tree[id])delete h.tree[id];fixEquip(h);if(h.deck)trimDeck(h);return true}
function fixEquip(h){for(const s of['weapon','armor','off','charm']){const it=ITEMS[h.equip[s]];if(h.equip[s]&&!itemOk(h,it))h.equip[s]=s==='weapon'?STARTER[h.cls]:''}}
function heroLook(h){const L={...h.look},w=ITEMS[h.equip.weapon],o=ITEMS[h.equip.off];L.w=w?w.sp:'';L.sh=o&&o.sp||'';if(w&&w.tint)L.wt=TINTS[w.tint].wt;if(o&&o.tint)L.st=TINTS[o.tint].wt;if(!h.dress){const a=itemOk(h,ITEMS[h.equip.armor])?ITEMS[h.equip.armor]:null,v=a?ARMOR_LOOK[(a.base||h.equip.armor)]:UNDER;if(v){Object.assign(L,v);if(a&&a.tint){L._t=TINTS[a.tint];L._ts=Object.keys(v)}}}return L}
function gainXp(h,n){const s=heroStats(h);n=Math.round(n*(1+s.bonus.xp/100));h.xp+=n;let up=0;while(h.level<LEVEL_CAP&&h.xp>=xpNeed(h.level)){h.xp-=xpNeed(h.level);h.level++;up++}if(h.level>=LEVEL_CAP)h.xp=0;return{xp:n,up}}
const stageXp=i=>30+(STAGES[i].ti??i)*12+(STAGES[i].boss?90:0);
function rollRune(i,h,R){const boss=STAGES[i].boss;if(!boss&&R()>.3)return null;const free=Object.keys(RUNES).filter(k=>!h.runes.includes(k));return free.length?free[Math.floor(R()*free.length)]:null}
function pickTint(i,R){const st=STAGES[i];if(st.boss)return'royal';const th=TINT_THEME[st.theme]||['bark'];if(R()<.5){const f=st.foes[Math.floor(R()*st.foes.length)];if(TINT_FOE[f])return TINT_FOE[f]}return th[Math.floor(R()*th.length)]}
function rollDrop(i,h,R){const boss=STAGES[i].boss,ti=STAGES[i].ti??i;if(!boss&&R()>.7)return null;const r=R(),rar=boss?'e':(ti<3?(r<.8?'c':'r'):ti<6?(r<.45?'c':r<.9?'r':'e'):(r<.6?'r':'e')),t=pickTint(i,R),inst=id=>ITEMS[id].slot==='charm'?id:id+'@'+t,fits=id=>itemOk(h,ITEMS[id]),free=Object.keys(ITEMS).filter(id=>fits(id)&&!h.inv.includes(inst(id)));let pool=free.filter(id=>ITEMS[id].rar===rar);if(!pool.length)pool=free;return pool.length?inst(pool[Math.floor(R()*pool.length)]):null}
// カード刻印 ------------------------------------------
const hasDmg=c=>c.e.some(e=>e.k==='dmg'||e.k==='dmgBlock');
const RUNES={
 heavy:{n:'強打',d:'ダメージ+2',ok:hasDmg,mod:c=>{for(const e of c.e)if(e.k==='dmg'||e.k==='dmgBlock')e.v+=2}},
 light:{n:'軽量',d:'コスト-1',ok:c=>c.c>=1,mod:c=>{c.c--}},
 reach:{n:'長柄',d:'射程+1',ok:c=>c.r.n>0&&c.r.n<8,mod:c=>{c.r.n++}},
 spark:{n:'閃き',d:'使うと1枚引く',ok:()=>true,mod:c=>{c.e.push({k:'draw',v:1})}},
 guard:{n:'堅守',d:'使うとガード+3',ok:()=>true,mod:c=>{c.e.push(block(3))}},
 leech:{n:'吸血',d:'使うとHP2回復',ok:hasDmg,mod:c=>{c.e.push({k:'heal',v:2})}},
 burn:{n:'灼熱',d:'火傷2を与える',ok:hasDmg,mod:c=>{c.e.push(st('burn',2))}},
 bind:{n:'束縛',d:'拘束1を与える',ok:hasDmg,mod:c=>{c.e.push(st('root',1))}},
 shove:{n:'衝撃',d:'1マス押す',ok:hasDmg,mod:c=>{c.e.push({k:'push',v:1})}},
 twin:{n:'連撃',d:'半分の威力でもう1回',ok:c=>c.e.some(e=>e.k==='dmg'),mod:c=>{const d=c.e.find(e=>e.k==='dmg');c.e.splice(c.e.indexOf(d)+1,0,dmg(Math.ceil(d.v/2)))}},
 wide:{n:'拡散',d:'十字範囲になる・コスト+1',ok:c=>hasDmg(c)&&!c.a&&c.aim==='enemy'&&c.c<3&&!c.e.some(e=>e.k==='dash'||e.k==='retreat'),mod:c=>{c.a='plus';c.c++}},
 eternal:{n:'不滅',d:'戦闘中1回の制限がなくなる',ok:c=>!!c.once,mod:c=>{delete c.once}},
};
const baseCard=id=>id.split('~')[0];
function ensureCard(id){if(CARDS[id])return id;const[b,r]=id.split('~'),rn=RUNES[r],base=CARDS[b];if(!base||!rn)throw new Error('card '+id);const c=JSON.parse(JSON.stringify(base));rn.mod(c);c.n=base.n+'✦';c.rune=r;c.d=base.d+' ✦'+rn.n+'：'+rn.d;CARDS[id]=c;return id}
const runeSlots=h=>Math.min(6,1+Math.floor(h.level/6));
// デッキ ----------------------------------------------
const DECK_MIN=12,DECK_MAX=30,COPY_MAX=4,MOVE_MIN=3;
const granted=h=>{const g={};for(const c of heroStats(h).cards)g[c]=(g[c]||0)+1;return g};
function availCount(h,id){return Math.min(((h.cards||{})[id]||0)+(granted(h)[id]||0),CARDS[id].once?1:COPY_MAX+(granted(h)[id]||0))}
function initBuild(h){if(!h.cards){h.cards={};for(const c of CLASSES[h.cls].deck)h.cards[c]=(h.cards[c]||0)+1}if(!h.deck)h.deck=[...CLASSES[h.cls].deck,...heroStats(h).cards];h.ench=h.ench||{};h.runes=h.runes||['heavy','guard'];if(!h.builds){h.builds=[null,null,null];h.cur=0}h.builds=h.builds.map((b,i)=>i===h.cur?null:b);trimDeck(h);return h}
function trimDeck(h){const c={},d=[];for(const id of h.deck||[]){if(!CARDS[id])continue;c[id]=(c[id]||0)+1;if(c[id]<=availCount(h,id))d.push(id)}h.deck=d;for(const k in h.ench||{})if(!RUNES[h.ench[k]]||!RUNES[h.ench[k]].ok(CARDS[k]))delete h.ench[k]}
function addGranted(h,ids){for(const c of ids)if(!h.deck.includes(c))h.deck.push(c);trimDeck(h)}
function deckIssues(h){const a=[],n=h.deck.length;if(n<DECK_MIN)a.push(`デッキが${DECK_MIN}枚未満です`);if(n>DECK_MAX)a.push(`デッキが${DECK_MAX}枚を超えています`);if(h.deck.filter(id=>CARDS[id].t==='move'||CARDS[id].move).length<MOVE_MIN)a.push(`移動できるカードが${MOVE_MIN}枚必要です`);return a}
function runDeck(h){return h.deck.map(id=>h.ench&&h.ench[id]&&RUNES[h.ench[id]]?ensureCard(id+'~'+h.ench[id]):id)}
function snapBuild(h){return{tree:h.tree,equip:h.equip,deck:h.deck,ench:h.ench}}
function switchBuild(h,i){if(i===h.cur)return;h.builds[h.cur]=JSON.parse(JSON.stringify(snapBuild(h)));const b=h.builds[i]||JSON.parse(JSON.stringify(snapBuild(h)));h.builds[i]=null;h.cur=i;Object.assign(h,JSON.parse(JSON.stringify(b)));fixEquip(h);trimDeck(h)}
// 対戦の土台 ------------------------------------------
function buildCode(h){return{v:1,n:h.name,c:h.cls,l:h.look,lv:h.level,t:h.tree,e:h.equip,d:h.deck,en:h.ench}}
function fromCode(o){if(!o||o.v!==1||!CLASSES[o.c]||!o.l||!Array.isArray(o.d))throw new Error('bad');const h={id:'rival',name:String(o.n||'挑戦者').slice(0,10),cls:o.c,look:o.l,level:Math.min(LEVEL_CAP,Math.max(1,o.lv|0)),xp:0,tree:{},equip:{weapon:STARTER[o.c],armor:'',off:'',charm:''},inv:[],cards:{},ench:{},runes:[]};for(const k in o.t||{})if(NODE[k]&&NODE[k].id.startsWith(o.c+'.'))h.tree[k]=Math.min(NODE[k].max,o.t[k]|0);for(const k of['weapon','armor','off','charm'])if(o.e&&ITEMS[o.e[k]]&&ITEMS[o.e[k]].slot===k)h.equip[k]=o.e[k];fixEquip(h);h.deck=o.d.filter(id=>CARDS[id]&&!CARDS[id].foe).slice(0,DECK_MAX);if(h.deck.length<DECK_MIN)throw new Error('bad');for(const k in o.en||{})if(CARDS[k]&&RUNES[o.en[k]]&&RUNES[o.en[k]].ok(CARDS[k]))h.ench[k]=o.en[k];return h}
function duelRun(h){const r=newRun(h,1),lvHp=(LEVEL_CAP-h.level)*2;r.hp+=lvHp;r.maxHp+=lvHp;return r}
const DUEL_THEMES=['forest','grave','snow','ash','desert','swamp','castle','abyss'],DUEL_TURNS=30;
function setupDuel(a,b,seed){const R0=mulberry(seed),s={n:'模擬戦',theme:DUEL_THEMES[Math.floor(R0()*DUEL_THEMES.length)],w:10,h:10,foes:['x']},G=genMap(s,R0);G.R=R0;G.stage=-1;G.turn=1;G.duel=true;[...a.deck,...b.deck].forEach(ensureCard);G.units.push(heroUnit(0,'hero',a,G.pSpot.x,G.pSpot.y,R0));const[fx,fy]=G.fSpots[0],f=heroUnit(1,'foe',b,fx,fy,R0);f.firstDraw+=1;f.preDraw=1;drawN(G,f,f.handSize);G.units.push(f);return G}
function duelResult(G){const o=outcome(G);if(o)return o;if(G.turn<=DUEL_TURNS)return null;const a=G.units[0],b=G.units[1],p=a.hp/a.maxHp,q=b.hp/b.maxHp;return p>q?'win':p<q?'lose':'draw'}
// 道のり ----------------------------------------------
const NODE_KINDS={battle:{n:'戦闘',icon:'crossed-swords',d:'通常の戦闘。カード報酬あり'},elite:{n:'精鋭',icon:'daemon-skull',d:'敵が増えて強い。装備が確定で出る'},rest:{n:'休憩',icon:'campfire',d:'HPを回復するか、カードを1枚捨てる'},chest:{n:'宝箱',icon:'locked-chest',d:'この旅の間だけ効く祝福を選ぶ'},event:{n:'出来事',icon:'perspective-dice-six',d:'何が起きるかは行ってみるまで分からない'},boss:{n:'ボス',icon:'visored-helm',d:'このエリアの最後の戦い'}};
const BOONS={atk:{n:'戦神の加護',d:'攻撃+1',k:'atk',v:1},guard:{n:'守護の加護',d:'開始ガード+5',k:'guard',v:5},walk:{n:'風の加護',d:'歩く距離+1',k:'walk',v:1},draw:{n:'知恵の加護',d:'初手+1',k:'draw',v:1},heal:{n:'癒しの加護',d:'戦闘後の回復+15%',k:'heal',v:15},mana:{n:'魔力の加護',d:'初ターンのマナ+1',k:'mana1',v:1},hp:{n:'生命の加護',d:'最大HP+10',k:'hp',v:10}};
function genRoute(seed,base=0,len=8){const R=mulberry(seed^0x51ed),f=[];for(let i=0;i<len;i++){if(STAGES[base+i].boss){f.push(['boss']);continue}if(i===0){f.push(['battle','battle']);continue}const n=2+(R()<.5?1:0),o=[];const pool=i>=2?['battle','battle','elite','rest','chest','event']:['battle','battle','rest','event','chest'];while(o.length<n){const k=pool[Math.floor(R()*pool.length)];if(!o.includes(k)||k==='battle')o.push(k)}if(!o.some(k=>k==='battle'||k==='elite'))o[0]='battle';f.push(o)}return f}
function applyBoon(run,id){const b=BOONS[id];if(b.k==='hp'){run.maxHp+=b.v;run.hp+=b.v}else run.bonus[b.k]=(run.bonus[b.k]||0)+b.v;(run.boons=run.boons||[]).push(id)}
function newRun(h,seed,area='main'){const AR=AREAS[area];const s=heroStats(h),k=CLASSES[h.cls];const known=TREES[h.cls].filter(n=>n.card&&(h.tree||{})[n.id]).map(n=>n.card);return{extraPool:known,heroId:h.id,pref:{sword:1,spear:2,mage:3,bow:3}[h.cls],name:h.name,cls:h.cls,hp:s.maxHp,maxHp:s.maxHp,bonus:s.bonus,deck:h.deck?runDeck(h):[...k.deck,...s.cards],look:heroLook(h),diff:h.diff||0,area,base:AR.base,len:AR.len,train:AR.train?h.level:0,route:AR.train?null:genRoute(seed||(Date.now()&0xffffff),AR.base,AR.len),boons:[],stage:0,seed:seed||(Date.now()&0xffffff)}}
if(typeof module!=='undefined')module.exports={CARDS,CLASSES,FOES,STAGES,REWARD,CLASS_POOL,setupBattle,chooseAI,play,targets,startTurn,endTurn,outcome,alive,newRun,canPlay,mulberry,shuffle,areaTiles,ITEMS,newHero,heroStats,gainXp,stageXp,rollDrop,rollRune,perkLeft,RUNES,ensureCard,runeSlots,initBuild,trimDeck,deckIssues,runDeck,switchBuild,availCount,addGranted,buildCode,fromCode,duelRun,setupDuel,duelResult,DUEL_TURNS,activeSets,SETS,ITEM_SET,DECK_MIN,DECK_MAX,COPY_MAX,baseCard,TREES,NODE,JOBS,canLearn,learn,forget,canForget,jobLine,jobName,costOf,calcDmg,skipsTurn,threatMap,AREAS,trainXp,trainFoes,TINTS,heroLook,pickTint,UNDER,ARMOR_LOOK,genRoute,applyBoon,BOONS,NODE_KINDS};
