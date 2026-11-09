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
 // 上級職
 shieldbash:{n:'盾撃',c:1,t:'atk',icon:'shield-bash',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[{k:'dmgBlock',v:3}],d:'周囲の敵に「ガードの半分+3」ダメージ。'},
 holyward:{n:'聖壁',c:1,t:'skill',icon:'shield-reflect',anim:'spell',r:{s:'self'},aim:'self',e:[block(9)],d:'ガード9を得る。'},
 judgment:{n:'裁きの光',c:2,t:'atk',icon:'sun-radiations',anim:'spell',fx:'bolt',r:{s:'dia',n:3,nolos:1},aim:'any',a:'plus',e:[dmg(8)],d:'射程3（遮蔽無視）の十字に8ダメージ。'},
 sanctuary:{n:'聖域',c:2,t:'skill',icon:'holy-symbol',anim:'spell',r:{s:'self'},aim:'self',e:[block(12),{k:'heal',v:6}],once:1,d:'ガード12、HP6回復。戦闘中1回。'},
 bloodhit:{n:'血の一撃',c:0,t:'atk',icon:'bloody-stash',anim:'weapon',r:{s:'adj8'},aim:'enemy',e:[{k:'selfDmg',v:3},dmg(8)],d:'自分に3ダメージ。周囲の敵に8ダメージ。'},
 rampage:{n:'猛襲',c:2,t:'atk',move:1,icon:'charging-bull',anim:'weapon',r:{s:'line',n:3,min:2},aim:'enemy',e:[{k:'dash'},dmg(7),dmg(4)],d:'直線3マスの敵の前まで走り、7と4の2回攻撃。'},
 warcry:{n:'雄叫び',c:0,t:'skill',icon:'shouting',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'selfDmg',v:4},st('str',3,1)],once:1,d:'自分に4ダメージ。この戦闘中、攻撃+3。戦闘中1回。'},
 musou:{n:'無双',c:3,t:'atk',icon:'sword-spin',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(9),dmg(9)],d:'周囲8マスに9の2回攻撃。'},
 dive:{n:'急降下',c:2,t:'atk',move:1,icon:'fall-down',anim:'weapon',r:{s:'leap',n:4},aim:'empty',a:'land',e:[{k:'moveTo',jump:1},dmg(6)],d:'4マス以内へ跳び、着地点の周囲8マスに6ダメージ。'},
 jumpthrust:{n:'跳躍突き',c:1,t:'atk',move:1,icon:'jump-across',anim:'weapon',r:{s:'leap',n:2},aim:'empty',a:'land',e:[{k:'moveTo',jump:1},dmg(3)],d:'2マス以内へ跳び、着地点の周囲8マスに3ダメージ。'},
 skyfall:{n:'天崩し',c:3,t:'atk',move:1,icon:'falling-boulder',anim:'weapon',r:{s:'leap',n:6},aim:'empty',a:'land',e:[{k:'moveTo',jump:1},dmg(11)],d:'6マス以内へ跳び、着地点の周囲8マスに11ダメージ。'},
 dragonroar:{n:'竜の咆哮',c:2,t:'atk',icon:'dragon-breath',anim:'weapon',fx:'fire',r:{s:'star',n:4,pierce:1},aim:'any',a:'pierce',e:[dmg(9),st('vuln',1)],d:'8方向の直線4マスを貫き9ダメージ、脆弱1。'},
 shove:{n:'押し出し',c:1,t:'atk',icon:'push',anim:'weapon',r:{s:'adj'},aim:'any',a:'fan',e:[dmg(4),{k:'push',v:2}],d:'前方3マスに4ダメージ、2マス押す。'},
 formation:{n:'布陣',c:1,t:'skill',icon:'chess-rook',r:{s:'self'},aim:'self',e:[block(5),{k:'draw',v:1}],d:'ガード5を得て1枚引く。'},
 pincer:{n:'挟撃',c:1,t:'atk',icon:'pincers',anim:'weapon',r:{s:'line',n:5,min:2},aim:'enemy',e:[dmg(6),{k:'pull',v:5}],d:'直線5マスの敵に6ダメージ、目の前まで引き寄せる。'},
 shockwave:{n:'衝撃波',c:2,t:'atk',icon:'wave-strike',anim:'weapon',r:{s:'self'},aim:'self',a:'around',e:[dmg(4),{k:'push',v:3}],d:'周囲8マスに4ダメージ、外へ3マス押す。'},
 ignite:{n:'点火',c:1,t:'atk',icon:'burning-embers',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'enemy',e:[dmg(2),st('burn',4)],d:'射程4の敵に2ダメージ、火傷4。'},
 flamejet:{n:'火炎放射',c:2,t:'atk',icon:'flame',anim:'spell',fx:'fire',r:{s:'line',n:4,pierce:1},aim:'any',a:'pierce',e:[dmg(6),st('burn',2)],d:'直線4マスを貫き6ダメージ、火傷2。'},
 scorch:{n:'焦土',c:2,t:'atk',icon:'fire-ring',anim:'spell',fx:'fire',r:{s:'dia',n:4},aim:'any',a:'plus',e:[dmg(4),{k:'setTile',t:'fire'}],d:'十字に4ダメージ。その範囲の地面を燃やす。'},
 phoenix:{n:'鳳凰',c:3,t:'atk',icon:'small-fire',anim:'spell',fx:'fire',r:{s:'dia',n:6,nolos:1},aim:'any',a:'sq',e:[dmg(9),st('burn',3)],d:'射程6（遮蔽無視）の3×3に9ダメージ、火傷3。'},
 icewall:{n:'氷壁',c:1,t:'skill',icon:'ice-cube',anim:'spell',r:{s:'dia',n:3},aim:'empty',e:[{k:'setTile',t:'block'},block(3)],d:'空きマスに壁を作り、ガード3を得る。'},
 shatter:{n:'砕氷',c:1,t:'atk',icon:'ice-spear',anim:'spell',fx:'ice',r:{s:'dia',n:4},aim:'enemy',e:[dmg(5)],d:'射程4の敵に5ダメージ。'},
 blizzard:{n:'吹雪',c:3,t:'atk',icon:'snowing',anim:'spell',fx:'ice',r:{s:'dia',n:5,nolos:1},aim:'any',a:'sq',e:[dmg(7),st('root',1)],d:'射程5（遮蔽無視）の3×3に7ダメージ、拘束1。'},
 timewarp:{n:'時間歪曲',c:0,t:'skill',icon:'time-trap',anim:'spell',r:{s:'self'},aim:'self',e:[{k:'mana',v:2},{k:'draw',v:1}],once:1,d:'マナ+2、1枚引く。戦闘中1回。'},
 deadeye:{n:'心眼',c:2,t:'atk',icon:'eye-target',anim:'weapon',fx:'arrow',r:{s:'dia',n:6,min:3,nolos:1},aim:'enemy',e:[dmg(9)],d:'距離3〜6（遮蔽無視）の敵に9ダメージ。'},
 piercer:{n:'貫通矢',c:2,t:'atk',icon:'striking-arrows',anim:'weapon',fx:'arrow',r:{s:'line',n:8,pierce:1},aim:'any',a:'pierce',e:[dmg(8)],d:'縦横の直線8マスを貫き8ダメージ。'},
 aim:{n:'照準',c:0,t:'skill',icon:'targeted',r:{s:'self'},aim:'self',e:[st('str',2,1)],once:1,d:'この戦闘中、攻撃+2。戦闘中1回。'},
 hawkstrike:{n:'鷹撃',c:3,t:'atk',icon:'hawk-emblem',anim:'weapon',fx:'arrow',r:{s:'star',n:8,min:3},aim:'enemy',e:[dmg(18)],d:'8方向の直線、距離3〜8の敵に18ダメージ。'},
 backshot:{n:'跳び射ち',c:1,t:'atk',move:1,icon:'backward-time',anim:'weapon',fx:'arrow',r:{s:'star',n:3},aim:'enemy',e:[dmg(4),{k:'retreat',v:2}],d:'8方向3マスの敵に4ダメージ、2マス下がる。'},
 volley:{n:'連射',c:2,t:'atk',icon:'arrow-flights',anim:'weapon',fx:'arrow',r:{s:'star',n:5,min:2},aim:'enemy',e:[dmg(4),dmg(4),dmg(4)],d:'距離2〜5の敵に4の3回攻撃。'},
 smokestep:{n:'煙渡り',c:0,t:'move',icon:'smoke-bomb',r:{s:'leap',n:3},aim:'empty',e:[{k:'moveTo',blink:1},block(3)],d:'3マス以内へ消えて現れ、ガード3を得る。'},
 net:{n:'投網',c:1,t:'atk',icon:'fishing-net',anim:'weapon',r:{s:'dia',n:4,nolos:1},aim:'any',a:'sq',e:[st('root',1)],d:'射程4の3×3に拘束1。'},
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
function costOf(u,c){let n=c.c;const T=u.t||{},F=u.flags||{};if(T.moveFree&&!F.movedFree&&isMoveCard(c)&&!c.e.some(e=>e.k==='dmg'))n=0;if(T.jumpFree&&!F.jumpedFree&&isJump(c))n=0;if(T.spellCut&&!F.spellCut&&isSpell(c))n=Math.max(0,n-T.spellCut);return n}
function canPlay(G,u,c){if(costOf(u,c)>u.mana)return false;if((c.t==='move'||c.move)&&u.status.root>0)return false;return true}
function calcDmg(a,d,v,c){let n=v+(a.status.str||0);const T=a.t||{};if(T.lowAtk&&a.hp*2<a.maxHp)n+=T.lowAtk;if(a.nextAtk)n+=a.nextAtk;if(T.firstAtk&&!(a.flags&&a.flags.atked))n+=T.firstAtk;if(T.rootDmg&&d.status.root>0)n+=T.rootDmg;if(T.distAtk&&man(a.x,a.y,d.x,d.y)>=4)n+=T.distAtk;if(T.aoeAtk&&c&&c.a)n+=T.aoeAtk;if(a.status.weak>0)n=Math.floor(n*.75);if(d.status.vuln>0)n=Math.floor(n*1.5);return Math.max(0,n)}
function hurt(G,v,n,evs,src){const blk=Math.min(v.block,n);v.block-=blk;const hp=n-blk;v.hp-=hp;evs.push({t:'dmg',u:v.id,v:hp,blk,src});if(v.hp<=0&&!v.dead){v.hp=0;v.dead=true;evs.push({t:'die',u:v.id})}}
function displace(G,v,dx,dy,n,evs,a){let x=v.x,y=v.y,moved=0,hit=false;const p=[[x,y]];for(let i=0;i<n;i++){const X=x+dx,Y=y+dy;if(!free(G,X,Y)){hit=true;break}x=X;y=Y;moved++;p.push([x,y])}
 v.x=x;v.y=y;if(moved)evs.push({t:'slide',u:v.id,p});if(hit&&!v.dead)hurt(G,v,3+((a&&a.t&&a.t.wallDmg)||0),evs,'wall')}
function retreatTile(G,u,from){let best=null,score=-1,d;const {out}=bfs(G,u,from.n);for(const t of out){d=man(t.x,t.y,from.x,from.y);if(d>score){score=d;best=t}}return best}
function shuffleIn(u,R){shuffle(u.discard,R);u.draw.push(...u.discard);u.discard=[]}
function drawN(G,u,n,evs){for(let i=0;i<n;i++){if(!u.draw.length){if(!u.discard.length)break;shuffleIn(u,G.R);evs&&evs.push({t:'reshuffle',u:u.id})}u.hand.push(u.draw.pop());evs&&evs.push({t:'draw',u:u.id})}}
function play(G,u,idx,t){const id=u.hand[idx],c=CARDS[id],evs=[],T=u.t||{},F=u.flags=u.flags||{},cost=costOf(u,c),deadBefore=new Set(G.units.filter(x=>x.dead).map(x=>x.id));u.mana-=cost;u.hand.splice(idx,1);
 if(T.moveFree&&!F.movedFree&&isMoveCard(c)&&!c.e.some(e=>e.k==='dmg'))F.movedFree=1;if(T.jumpFree&&!F.jumpedFree&&isJump(c))F.jumpedFree=1;if(T.spellCut&&!F.spellCut&&isSpell(c))F.spellCut=1;
 if(c.once)(u.exhaust=u.exhaust||[]).push(id);else u.discard.push(id);
 evs.push({t:'play',u:u.id,card:id,tx:t.x,ty:t.y});
 const area=areaTiles(G,u,c,t);
 const victims=(c.aim==='self'&&!c.a)?[]:area.map(p=>unitAt(G,p.x,p.y)).filter(v=>v&&foeOf(u,v));
 const hasDash=c.e.some(e=>e.k==='dash');
 if(!hasDash&&(c.t==='atk'&&!c.e.some(e=>e.k==='moveTo')))evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});
 else if(c.t==='skill')evs.push({t:'cast',u:u.id,anim:c.anim,card:id});
 for(const e of c.e){switch(e.k){
  case'moveTo':{if(c.a==='land'){}const p=c.r.s==='walk'?pathTo(G,u,c.r.n+(u.walkBonus||0),t.x,t.y):[[u.x,u.y],[t.x,t.y]];u.x=t.x;u.y=t.y;evs.push({t:'move',u:u.id,p,jump:e.jump,blink:e.blink});if(c.a==='land')evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});if(e.jump&&T.jumpAtk)u.nextAtk=T.jumpAtk;if(T.moveGuard){u.block+=T.moveGuard;evs.push({t:'block',u:u.id,v:T.moveGuard})}break}
  case'dash':{const d=dashTile(G,u,t),p=[[u.x,u.y],[d.x,d.y]];u.x=d.x;u.y=d.y;evs.push({t:'move',u:u.id,p,dash:1});evs.push({t:'swing',u:u.id,x:t.x,y:t.y,anim:c.anim,fx:c.fx,card:id,area});break}
  case'dmg':for(const v of victims)if(!v.dead){hurt(G,v,calcDmg(u,v,e.v,c),evs,'hit');thorn(G,u,v,evs)}break;
  case'dmgBlock':for(const v of victims)if(!v.dead){hurt(G,v,calcDmg(u,v,Math.floor(u.block/2)+e.v,c),evs,'hit');thorn(G,u,v,evs)}break;
  case'selfDmg':hurt(G,u,e.v,evs,'self');break;
  case'setTile':for(const p of area){const C=G.cells[p.y][p.x];if(C.t!=='floor'&&C.t!=='fire')continue;if(e.t==='block'&&unitAt(G,p.x,p.y))continue;C.t=e.t;if(e.t==='block')C.v=C.v||.5}evs.push({t:'terrain'});break;
  case'block':u.block+=e.v;evs.push({t:'block',u:u.id,v:e.v});break;
  case'heal':{const n=Math.min(e.v,u.maxHp-u.hp);u.hp+=n;evs.push({t:'heal',u:u.id,v:n});break}
  case'draw':drawN(G,u,e.v,evs);break;
  case'mana':u.mana+=e.v;evs.push({t:'mana',u:u.id,v:e.v});break;
  case'status':if(e.self){u.status[e.s]=(u.status[e.s]||0)+e.v;evs.push({t:'status',u:u.id,s:e.s,v:e.v})}else for(const v of victims)if(!v.dead){const nv=e.v+(e.s==='burn'?(T.burnPlus||0):0);v.status[e.s]=(v.status[e.s]||0)+nv;evs.push({t:'status',u:v.id,s:e.s,v:nv})}break;
  case'push':for(const v of victims){if(v.dead)continue;let[dx,dy]=[Math.sign(v.x-u.x),Math.sign(v.y-u.y)];displace(G,v,dx,dy,e.v+(T.pushExtra||0),evs,u)}break;
  case'pull':for(const v of victims){if(v.dead)continue;let[dx,dy]=[Math.sign(u.x-v.x),Math.sign(u.y-v.y)];const n=Math.min(e.v,Math.max(Math.abs(u.x-v.x),Math.abs(u.y-v.y))-1);if(n>0)displace(G,v,dx,dy,n,evs)}break;
  case'retreat':{const foe=victims[0]||{x:t.x,y:t.y};const b=retreatTile(G,u,{x:foe.x,y:foe.y,n:e.v});if(b){const p=pathTo(G,u,e.v,b.x,b.y);u.x=b.x;u.y=b.y;evs.push({t:'move',u:u.id,p})}break}
 }}
 if(c.t==='atk'&&c.e.some(e=>e.k==='dmg'||e.k==='dmgBlock')){F.atked=1;u.nextAtk=0;if(T.atkGuard){u.block+=T.atkGuard;evs.push({t:'block',u:u.id,v:T.atkGuard})}}
 const kills=G.units.filter(x=>x.dead&&!deadBefore.has(x.id)&&foeOf(u,x)).length;
 if(kills&&!u.dead){if(T.killMana){u.mana+=T.killMana*kills;evs.push({t:'mana',u:u.id,v:T.killMana*kills})}if(T.killDraw)drawN(G,u,T.killDraw*kills,evs);if(T.killHeal){const n=Math.min(T.killHeal*kills,u.maxHp-u.hp);if(n>0){u.hp+=n;evs.push({t:'heal',u:u.id,v:n})}}}
 return evs}
function thorn(G,a,v,evs){const n=v.t&&v.t.thorns;if(n&&!a.dead&&!v.dead&&Math.max(Math.abs(a.x-v.x),Math.abs(a.y-v.y))<=1)hurt(G,a,n,evs,'thorn')}
function startTurn(G,u){const evs=[];u.block=0;u.flags={};u.mana=u.maxMana;let extra=0;if(!u.opened){u.opened=1;u.block=u.startBlock||0;u.mana+=u.mana1||0;extra=u.firstDraw||0}if(u.status.burn>0){hurt(G,u,u.status.burn,evs,'burn');u.status.burn--}drawN(G,u,Math.max(0,u.handSize+extra-u.hand.length),evs);return evs}
function endTurn(G,u){const evs=[];if(u.t&&u.t.endGuard&&u.mana>0&&!u.dead){const g=u.t.endGuard*Math.min(3,u.mana);u.block+=g;evs.push({t:'block',u:u.id,v:g})}u.discard.push(...u.hand);u.hand=[];for(const s of['root','weak','vuln'])if(u.status[s]>0)u.status[s]--;if(!u.dead&&G.cells[u.y][u.x].t==='fire'&&!(u.t&&u.t.fireSafe))hurt(G,u,3,evs,'fire');return evs}
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
 const p=makeUnit(0,'hero',{n:hero.name,hp:hero.hp,maxHp:hero.maxHp,deck:hero.deck,hand:5,look:hero.look,kind:'hero',pref:hero.pref});{const b=hero.bonus||{};if(b.atk)p.status.str=b.atk;p.startBlock=b.guard||0;p.firstDraw=b.draw||0;p.walkBonus=b.walk||0;p.mana1=b.mana1||0;p.t=b.traits||{}}p.x=G.pSpot.x;p.y=G.pSpot.y;p.facing=1;p.draw=shuffle(p.deck.slice(),R);{const top=p.draw.length-1;if(!p.draw.slice(-5).some(id=>CARDS[id].t==='move')){const j=p.draw.findIndex(id=>CARDS[id].t==='move');if(j>=0)[p.draw[j],p.draw[top]]=[p.draw[top],p.draw[j]]}}G.units.push(p);
 s.foes.forEach((f,i)=>{const d=FOES[f],df=hero.diff||0,u=makeUnit(i+1,'foe',{...d,hp:Math.round(d.hp*(1+df*.3)),kind:f});if(df)u.status.str=df;[u.x,u.y]=G.fSpots[i];u.facing=0;u.draw=shuffle(u.deck.slice(),R);G.units.push(u)});return G}
const alive=(G,side)=>G.units.filter(u=>!u.dead&&u.side===side);
const outcome=G=>!alive(G,'hero').length?'lose':!alive(G,'foe').length?'win':null;
// AI ------------------------------------------------
function estHit(G,u,c,t){let sum=0,kill=0;for(const p of areaTiles(G,u,c,t)){const v=unitAt(G,p.x,p.y);if(!v)continue;if(!foeOf(u,v))continue;let hit=0;for(const e of c.e){if(e.k==='dmg')hit+=calcDmg(u,v,e.v,c);if(e.k==='dmgBlock')hit+=calcDmg(u,v,Math.floor(u.block/2)+e.v,c)}const eff=Math.max(0,hit-v.block);sum+=eff+(c.e.some(e=>e.k==='status')?2:0);if(eff>=v.hp)kill++}return{sum,kill}}
function canHitFrom(G,u,x,y,ids,mana){const ox=u.x,oy=u.y;u.x=x;u.y=y;let best=0;for(const id of ids){const c=CARDS[id];if(costOf(u,c)>mana||c.t!=='atk')continue;for(const t of targets(G,u,c)){const r=estHit(G,u,c,t);if(r.sum>best)best=r.sum}}u.x=ox;u.y=oy;return best}
function chooseAI(G,u){const foes=alive(G,u.side==='foe'?'hero':'foe');if(!foes.length)return null;const gap=(x,y)=>Math.min(...foes.map(f=>{const d=Math.max(Math.abs(x-f.x),Math.abs(y-f.y));return Math.abs(d-u.pref)+(d<u.pref?1:0)}));let best=null,bs=0;const curHit=canHitFrom(G,u,u.x,u.y,u.hand,u.mana);
 u.hand.forEach((id,i)=>{const c=CARDS[id];if(!canPlay(G,u,c))return;const rest=u.hand.filter((_,j)=>j!==i);
  for(const t of targets(G,u,c)){let s=0;
   if((c.t==='move'||c.e.some(e=>e.k==='moveTo'))&&c.a!=='land'){const g0=gap(u.x,u.y),g1=gap(t.x,t.y);const h=canHitFrom(G,u,t.x,t.y,rest,u.mana-costOf(u,c));if(curHit>0&&h<=curHit)continue;s=(g0-g1)*2+h*3;if(G.cells[t.y][t.x].t==='fire')s-=6;if(s<=0)s=g0>g1?.5:0}
   else if(c.t==='atk'){const r=estHit(G,u,c,t);if(!r.sum)continue;s=r.sum*3+r.kill*20-costOf(u,c)*2;if(c.e.some(e=>e.k==='selfDmg')&&u.hp<=8)continue}
   else if(c.e.some(e=>e.k==='setTile'))s=0;else{const near=foes.some(f=>man(f.x,f.y,u.x,u.y)<=5);if(c.e.some(e=>e.k==='block'))s=near&&curHit===0?4:(near?1:0);else if(c.e.some(e=>e.k==='heal'))s=u.hp<u.maxHp*.6?8:0;else s=3}
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
 jb_paladin:I('聖盾の剣','weapon','e',{cls:'sword',job:'paladin',sp:'w_longsword',atk:1,guard:5,trait:{endGuard:1}}),jb_asura:I('修羅の大刀','weapon','e',{cls:'sword',job:'asura',sp:'w_katana',atk:3,trait:{killHeal:4}}),jb_dragoon:I('天翔ける槍','weapon','e',{cls:'spear',job:'dragoon',sp:'w_dragon',atk:2,trait:{jumpAtk:2}}),jb_marshal:I('軍配の鉾','weapon','e',{cls:'spear',job:'tactician',sp:'w_halberd',atk:2,trait:{wallDmg:3}}),jb_pyro:I('灰燼の杖','weapon','e',{cls:'mage',job:'pyro',sp:'w_diamond',atk:2,trait:{burnPlus:1}}),jb_cryo:I('氷晶の杖','weapon','e',{cls:'mage',job:'cryo',sp:'w_crystal',atk:2,trait:{rootDmg:2}}),jb_sniper:I('遠望の弓','weapon','e',{cls:'bow',job:'sniper',sp:'w_great',atk:2,trait:{distAtk:2}}),jb_ranger:I('森渡りの弓','weapon','e',{cls:'bow',job:'ranger',sp:'w_recurve',atk:2,trait:{moveGuard:1}}),
 ch_iron:I('鉄の指輪','charm','c',{hp:4}),ch_boot:I('軽い靴紐','charm','c',{card:'sidestep'}),ch_salve:I('薬草袋','charm','c',{card:'salve'}),ch_lion:I('獅子の護符','charm','r',{atk:1}),ch_book:I('修行の書','charm','r',{xp:30}),ch_wing:I('風の羽','charm','r',{walk:1}),ch_hand:I('早指の手袋','charm','r',{draw:1}),ch_heart:I('治癒の心臓','charm','r',{heal:15}),ch_star:I('星の欠片','charm','e',{mana1:1}),ch_eye:I('賢者の瞳','charm','e',{picks:1,draw:1}),
};
const JOBS={};
const cardNode=c=>({n:CARDS[c].n,icon:CARDS[c].icon,card:c,d:'デッキに「'+CARDS[c].n+'」を加える。'+CARDS[c].d});
function branch(base,side,B){const inner=side==='a'?1:3,outer=side==='a'?0:4,p=base+'.'+side+'.',r1=base+'.r1'+(side==='a'?'l':'r'),o=[];const add=(k,r,c,cost,req,x)=>o.push({id:p+k,r,c,cost,req,max:1,...x});
 add('intro',2,inner,1,[r1],cardNode(B.intro));
 JOBS[B.cls.job]={n:B.cls.n,base,tier:1,icon:B.cls.icon};JOBS[B.mas.job]={n:B.mas.n,base,tier:2,icon:B.mas.icon};
 add('cls',3,inner,2,[p+'intro'],{...B.cls,lv:10,group:'adv',kind:'job',d:'【クラスチェンジ】'+B.cls.d});
 add('r4o',4,outer,2,[p+'cls'],cardNode(B.r4o));add('r4i',4,inner,2,[p+'cls'],B.r4i);
 add('r5o',5,outer,2,[p+'r4o'],B.r5o);add('r5i',5,inner,2,[p+'r4i'],cardNode(B.r5i));
 add('mas',6,inner,3,[p+'r5o',p+'r5i'],{...B.mas,lv:20,kind:'job',d:'【クラスチェンジ】'+B.mas.d});
 add('r7o',7,outer,3,[p+'mas'],cardNode(B.r7o));add('r7i',7,inner,3,[p+'mas'],B.r7i);return o}
function mkTree(base,A,B){const p=base+'.',N=(id,r,c,cost,req,x)=>({id:p+id,r,c,cost,req,max:1,...x});return[
 N('root',0,2,1,[],{n:'修行の始まり',icon:'laurels',e:{hp:3},d:'最大HP+3'}),
 N('r1l',1,1,1,[p+'root'],{n:'頑丈',icon:'heart-plus',max:3,e:{hp:5},d:'最大HP+5'}),
 N('r1c',1,2,1,[p+'root'],{n:'受け身',icon:'round-shield',max:2,e:{guard:3},d:'戦闘開始時のガード+3'}),
 N('r1r',1,3,1,[p+'root'],{n:'回復力',icon:'healing',max:2,e:{heal:10},d:'戦闘後の回復+10%'}),
 N('r2c',2,2,2,[p+'r1c'],{n:'手際',icon:'card-draw',e:{draw:1},d:'最初の手札+1'}),
 N('r3c',3,2,3,[p+'r2c'],{n:'鍛錬',icon:'biceps',max:2,e:{atk:1},d:'攻撃のダメージ+1'}),
 N('r4c',4,2,2,[p+'r3c'],{n:'目利き',icon:'magnifying-glass',e:{picks:1},d:'カード報酬の候補+1'}),
 N('r5c',5,2,3,[p+'r4c'],{n:'健脚',icon:'walking-boot',e:{walk:1},d:'歩く系カードの距離+1'}),
 N('r6c',6,2,4,[p+'r5c'],{n:'達人の体',icon:'body-balance',lv:20,e:{hp:12,guard:3},d:'最大HP+12、開始ガード+3'}),
 N('r7c',7,2,5,[p+'r6c'],{n:'大器',icon:'crown',lv:25,e:{mana1:1,atk:1},d:'初ターンのマナ+1、攻撃+1'}),
 ...branch(base,'a',A),...branch(base,'b',B)]}
const TR=(n,icon,trait,d)=>({n,icon,trait,d});
const TREES={
 sword:mkTree('sword',
 {intro:'iron',cls:{job:'paladin',n:'聖騎士',icon:'templar-shield',e:{hp:8},trait:{endGuard:2},card:'shieldbash',d:'最大HP+8。余ったマナ1につき、手番の終わりにガード+2。札「盾撃」を得る。'},r4o:'holyward',r4i:TR('堅忍','shield-echoes',{atkGuard:2},'攻撃カードを使うたびガード+2'),r5o:{n:'不動',icon:'stone-wall',e:{guard:5},d:'開始ガード+5'},r5i:'judgment',mas:{job:'templar',n:'神殿騎士',icon:'visored-helm',e:{hp:10},trait:{thorns:4},card:'sanctuary',d:'最大HP+10。隣接する敵から攻撃されると4ダメージで反撃。札「聖域」を得る。'},r7o:'rally',r7i:TR('神の加護','angel-outfit',{endGuard:2,killHeal:4},'余りマナのガード+2、敵を倒すとHP4回復')},
 {intro:'execute',cls:{job:'berserker',n:'狂戦士',icon:'barbarian',e:{hp:4},trait:{lowAtk:3},card:'bloodhit',d:'最大HP+4。HPが半分未満の間、攻撃+3。札「血の一撃」を得る。'},r4o:'rampage',r4i:TR('血の渇き','drop',{killHeal:5},'敵を倒すとHP5回復'),r5o:TR('捨て身','broken-skull',{lowAtk:2},'HPが半分未満の間の攻撃がさらに+2'),r5i:'warcry',mas:{job:'asura',n:'修羅',icon:'daemon-pull',e:{hp:6},trait:{killMana:1},card:'musou',d:'最大HP+6。敵を倒すとマナ+1。札「無双」を得る。'},r7o:'sweep',r7i:TR('屍山血河','skull-crossed-bones',{killDraw:1,firstAtk:2},'敵を倒すと1枚引く。各手番の最初の攻撃+2')}),
 spear:mkTree('spear',
 {intro:'vault',cls:{job:'dragoon',n:'竜騎士',icon:'spiked-dragon-head',e:{hp:6},trait:{jumpAtk:3},card:'dive',d:'最大HP+6。跳ぶ移動の後、次の攻撃+3。札「急降下」を得る。'},r4o:'jumpthrust',r4i:TR('軽身','feather',{jumpFree:1},'各手番の最初の跳ぶカードのコスト0'),r5o:TR('竜鱗','dragon-shield',{moveGuard:2},'移動のたびにガード+2'),r5i:'leap',mas:{job:'dragonlord',n:'竜王',icon:'dragon-head',e:{hp:8},trait:{jumpAtk:2},card:'skyfall',d:'最大HP+8。跳んだ後の攻撃がさらに+2。札「天崩し」を得る。'},r7o:'dragonroar',r7i:TR('竜の心臓','dragon-orb',{killMana:1,aoeAtk:2},'敵を倒すとマナ+1。範囲攻撃+2')},
 {intro:'hookpull',cls:{job:'tactician',n:'戦術家',icon:'chess-queen',e:{hp:5},trait:{wallDmg:4},card:'shove',d:'最大HP+5。押した敵が壁に当たるとさらに+4ダメージ。札「押し出し」を得る。'},r4o:'formation',r4i:TR('間合い管理','path-distance',{pushExtra:1},'押す距離+1'),r5o:TR('読み','brain',{firstAtk:2},'各手番の最初の攻撃+2'),r5i:'pincer',mas:{job:'marshal',n:'軍師',icon:'chess-king',e:{hp:12},trait:{killDraw:1,firstAtk:1},card:'shockwave',d:'最大HP+12。敵を倒すと1枚引く。各手番の最初の攻撃+1。札「衝撃波」を得る。'},r7o:'iron',r7i:TR('勝ち筋','sinusoidal-beam',{wallDmg:4,atkGuard:2},'壁ダメージさらに+4、攻撃するたびガード+2')}),
 mage:mkTree('mage',
 {intro:'gust',cls:{job:'pyro',n:'炎術師',icon:'fire-spell-cast',e:{hp:3},trait:{burnPlus:1,fireSafe:1},card:'ignite',d:'最大HP+3。与える火傷+1、燃える地面で無傷。札「点火」を得る。'},r4o:'flamejet',r4i:TR('熱量','thermometer-hot',{aoeAtk:1},'範囲攻撃+1'),r5o:TR('火の呼吸','fire-breath',{spellCut:1},'各手番の最初の魔法のコスト-1'),r5i:'scorch',mas:{job:'inferno',n:'獄炎の賢者',icon:'wizard-face',e:{hp:5},trait:{burnPlus:1,aoeAtk:2},card:'phoenix',d:'最大HP+5。火傷さらに+1、範囲攻撃+2。札「鳳凰」を得る。'},r7o:'meteor',r7i:TR('灰の王','campfire',{killMana:1},'敵を倒すとマナ+1')},
 {intro:'frost',cls:{job:'cryo',n:'氷術師',icon:'snowflake-2',e:{hp:5},trait:{rootDmg:3},card:'shatter',d:'最大HP+5。拘束中の敵への攻撃+3。札「砕氷」を得る。'},r4o:'icewall',r4i:TR('冷気の衣','frozen-body',{endGuard:2},'余りマナ1につき手番の終わりにガード+2'),r5o:TR('凍てつく手','frozen-arrow',{firstAtk:2},'各手番の最初の攻撃+2'),r5i:'chain',mas:{job:'chrono',n:'時の賢者',icon:'hourglass',e:{hp:8},trait:{spellCut:1},card:'timewarp',d:'最大HP+8。各手番の最初の魔法のコスト-1。札「時間歪曲」を得る。'},r7o:'blizzard',r7i:TR('静止の理','pocket-watch',{rootDmg:3,killDraw:1},'拘束中の敵への攻撃さらに+3、倒すと1枚引く')}),
 bow:mkTree('bow',
 {intro:'pin',cls:{job:'sniper',n:'狙撃手',icon:'crosshair',e:{hp:4},trait:{distAtk:3},card:'deadeye',d:'最大HP+4。距離4以上の敵への攻撃+3。札「心眼」を得る。'},r4o:'aim',r4i:TR('呼吸法','lungs',{firstAtk:2},'各手番の最初の攻撃+2'),r5o:TR('鷹の視界','eagle-emblem',{distAtk:2},'距離4以上の攻撃がさらに+2'),r5i:'piercer',mas:{job:'hawkeye',n:'鷹の目',icon:'hawk-emblem',e:{hp:6},trait:{killDraw:1},card:'hawkstrike',d:'最大HP+6。敵を倒すと1枚引く。札「鷹撃」を得る。'},r7o:'snipe',r7i:TR('必中','bullseye',{killMana:1,firstAtk:2},'敵を倒すとマナ+1、最初の攻撃さらに+2')},
 {intro:'sidestep',cls:{job:'ranger',n:'狩人',icon:'hood',e:{hp:6},trait:{moveFree:1},card:'backshot',d:'最大HP+6。各手番の最初の移動カードのコスト0。札「跳び射ち」を得る。'},r4o:'net',r4i:TR('身のこなし','acrobatic',{moveGuard:2},'移動のたびにガード+2'),r5o:TR('罠の知識','wolf-trap',{rootDmg:3},'拘束中の敵への攻撃+3'),r5i:'fire_arrow',mas:{job:'phantom',n:'影の狩人',icon:'cloak-dagger',e:{hp:8},trait:{moveGuard:2},card:'volley',d:'最大HP+8。移動のガードさらに+2。札「連射」を得る。'},r7o:'smokestep',r7i:TR('影縫い','shadow-follower',{killDraw:1,killMana:1},'敵を倒すと1枚引き、マナ+1')}),
};
const NODE={};for(const k in TREES)for(const n of TREES[k])NODE[n.id]=n;
const STARTER={sword:'sw_iron',spear:'sp_iron',mage:'st_simple',bow:'bw_normal'};
const LEVEL_CAP=30,xpNeed=lv=>90+lv*70;
function newHero(id,name,cls,look){return{id,name:name||'旅人',cls,look,level:1,xp:0,tree:{},equip:{weapon:STARTER[cls],armor:'ar_cloth',off:'',charm:''},inv:[STARTER[cls],'ar_cloth'],wins:0,best:0}}
function itemDesc(it){const a=[];if(it.atk)a.push('攻撃+'+it.atk);if(it.hp)a.push('HP'+(it.hp>0?'+':'')+it.hp);if(it.guard)a.push('開始ガード+'+it.guard);if(it.walk)a.push('歩く距離+'+it.walk);if(it.draw)a.push('初手+'+it.draw);if(it.mana1)a.push('初ターンのマナ+'+it.mana1);if(it.heal)a.push('戦後回復+'+it.heal+'%');if(it.picks)a.push('報酬候補+'+it.picks);if(it.xp)a.push('経験値+'+it.xp+'%');if(it.card)a.push('札「'+CARDS[it.card].n+'」');if(it.trait)for(const k in it.trait)a.push(({endGuard:'余りマナのガード',killHeal:'撃破回復',jumpAtk:'跳躍後の攻撃',wallDmg:'壁ダメージ',burnPlus:'火傷',rootDmg:'拘束への攻撃',distAtk:'遠距離の攻撃',moveGuard:'移動ガード'})[k]+'+'+it.trait[k]);if(it.job)a.push(JOBS[it.job].n+'専用');return a.join(' / ')||'初期装備'}
function jobLine(h){const t=h.tree||{};return TREES[h.cls].filter(n=>n.kind==='job'&&t[n.id]).map(n=>n.job)}
function jobName(h){const l=jobLine(h);return l.length?JOBS[l[l.length-1]].n:CLASSES[h.cls].n}
const itemOk=(h,it)=>it&&(!it.cls||it.cls===h.cls)&&(!it.job||jobLine(h).includes(it.job));
function heroStats(h){const b={atk:0,guard:0,walk:0,draw:0,heal:0,picks:0,xp:0,mana1:0,traits:{}},k=CLASSES[h.cls];let hp=k.hp+(h.level-1)*2;const cards=[],T=h.tree||{};const addE=(e,n=1)=>{if(!e)return;if(e.hp)hp+=e.hp*n;for(const f of['atk','guard','walk','draw','heal','picks','xp','mana1'])b[f]+=(e[f]||0)*n};const addT=t=>{if(t)for(const q in t)b.traits[q]=(b.traits[q]||0)+t[q]};
 for(const n of TREES[h.cls]){const r=T[n.id]||0;if(!r)continue;addE(n.e,r);addT(n.trait);if(n.card)cards.push(n.card)}
 for(const s of['weapon','armor','off','charm']){const it=ITEMS[h.equip[s]];if(!itemOk(h,it))continue;addE(it);addT(it.trait);if(it.card)cards.push(it.card)}b.walk=Math.min(b.walk,2);return{maxHp:hp,bonus:b,cards}}
const treeSpent=h=>TREES[h.cls].reduce((s,n)=>s+n.cost*((h.tree||{})[n.id]||0),0);
const perkLeft=h=>h.level-1-treeSpent(h);
const groupTaken=(h,n)=>n.group&&TREES[h.cls].some(x=>x.group===n.group&&x.id!==n.id&&(h.tree||{})[x.id]);
const reqMet=(h,n)=>!n.req.length||n.req.some(id=>(h.tree||{})[id]);
function canLearn(h,id){const n=NODE[id],t=h.tree||{};return(t[id]||0)<n.max&&perkLeft(h)>=n.cost&&h.level>=(n.lv||1)&&reqMet(h,n)&&!groupTaken(h,n)}
function canForget(h,id){const t=h.tree||{};if(!t[id])return false;if(t[id]>1)return true;return!TREES[h.cls].some(n=>t[n.id]&&n.req.includes(id)&&!n.req.some(r=>r!==id&&t[r]))}
function learn(h,id){if(!canLearn(h,id))return false;h.tree=h.tree||{};h.tree[id]=(h.tree[id]||0)+1;fixEquip(h);return true}
function forget(h,id){if(!canForget(h,id))return false;h.tree[id]--;if(!h.tree[id])delete h.tree[id];fixEquip(h);return true}
function fixEquip(h){for(const s of['weapon','armor','off','charm']){const it=ITEMS[h.equip[s]];if(h.equip[s]&&!itemOk(h,it))h.equip[s]=s==='weapon'?STARTER[h.cls]:''}}
function heroLook(h){const L={...h.look},w=ITEMS[h.equip.weapon],o=ITEMS[h.equip.off];L.w=w?w.sp:'';L.sh=o&&o.sp||'';return L}
function gainXp(h,n){const s=heroStats(h);n=Math.round(n*(1+s.bonus.xp/100));h.xp+=n;let up=0;while(h.level<LEVEL_CAP&&h.xp>=xpNeed(h.level)){h.xp-=xpNeed(h.level);h.level++;up++}if(h.level>=LEVEL_CAP)h.xp=0;return{xp:n,up}}
const stageXp=i=>30+i*12+(STAGES[i].boss?90:0);
function rollDrop(i,h,R){const boss=STAGES[i].boss;if(!boss&&R()>.7)return null;const r=R(),rar=boss?'e':i<3?(r<.8?'c':'r'):i<6?(r<.45?'c':r<.9?'r':'e'):(r<.6?'r':'e');const fits=id=>itemOk(h,ITEMS[id]),free=Object.keys(ITEMS).filter(id=>fits(id)&&!h.inv.includes(id));let pool=free.filter(id=>ITEMS[id].rar===rar);if(!pool.length)pool=free;return pool.length?pool[Math.floor(R()*pool.length)]:null}
function newRun(h,seed){const s=heroStats(h),k=CLASSES[h.cls];const known=TREES[h.cls].filter(n=>n.card&&(h.tree||{})[n.id]).map(n=>n.card);return{extraPool:known,heroId:h.id,pref:{sword:1,spear:2,mage:3,bow:3}[h.cls],name:h.name,cls:h.cls,hp:s.maxHp,maxHp:s.maxHp,bonus:s.bonus,deck:[...k.deck,...s.cards],look:heroLook(h),diff:h.diff||0,stage:0,seed:seed||(Date.now()&0xffffff)}}
if(typeof module!=='undefined')module.exports={CARDS,CLASSES,FOES,STAGES,REWARD,CLASS_POOL,setupBattle,chooseAI,play,targets,startTurn,endTurn,outcome,alive,newRun,canPlay,mulberry,shuffle,areaTiles,ITEMS,newHero,heroStats,gainXp,stageXp,rollDrop,perkLeft,TREES,NODE,JOBS,canLearn,learn,forget,canForget,jobLine,jobName,costOf,calcDmg};
