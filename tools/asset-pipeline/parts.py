import json,os,sys,subprocess,glob,base64,io,hashlib
from PIL import Image
S=sys.argv[1]; L=S+'/dl/lpc'; os.chdir(L)
ANIMS={'walk':9,'slash':6,'thrust':8,'spellcast':7,'shoot':13,'hurt':6}
CUSTOM={'slash_128':('slash',6),'slash_oversize':('slash',6),'walk_128':('walk',13)}
P={ # id:(def file, variant or None, label)
'body':'body/body','skeleton':'body/special/body_skeleton','zombie':('body/special/body_zombie','zombie'),
'head_m':'head/heads/human/heads_human_male','head_f':'head/heads/human/heads_human_female',
'head_skel':None,'head_orc':'head/heads/fantasy/heads_orc_male','head_goblin':'head/heads/fantasy/heads_goblin','head_zombie':None,
'top_long':'torso/shirts/longsleeve/torso_clothes_longsleeve','top_short':'torso/shirts/shortsleeve/torso_clothes_shortsleeve',
'top_leather':'torso/armour/torso_armour_leather','top_plate':'torso/armour/torso_armour_plate',
'legs':'legs/pants/legs_pants','boots':'feet/boots/feet_boots_basic','shoes':'feet/shoes/feet_shoes_basic',
'hat_hood':'headwear/coverings/hoods/hat_hood_cloth','hat_wizard':'headwear/hats/magic/hat_magic_wizard','hat_kettle':'headwear/helmets/helmets/hat_helmet_kettle','hat_bascinet':'headwear/helmets/helmets/hat_helmet_bascinet',
'w_sword':('weapons/sword/weapon_sword_arming','iron'),'w_spear':('weapons/polearm/weapon_polearm_spear','iron'),'w_staff':('weapons/magic/weapon_magic_simple','simple'),'w_bow':('weapons/ranged/bow/weapon_ranged_bow_normal','medium'),
}
for h in 'hair_plain hair_bangs hair_bob hair_long hair_ponytail hair_pixie hair_messy1 hair_spiked hair_curly_short hair_braid hair_buzzcut hair_pigtails'.split(): P[h]=h
defs={}
for f in glob.glob('sheet_definitions/**/*.json',recursive=True): defs[os.path.basename(f)[:-5]]=f
def load(v):
    for n in (v,):
        if v in defs: return json.load(open(defs[v]))
    p='sheet_definitions/'+v+'.json'
    return json.load(open(p))
files=set(l.strip() for l in open(S+'/dl/lpc_files.txt'))
plan={}
for pid,spec in P.items():
    if spec is None: continue
    var=None
    if isinstance(spec,tuple): spec,var=spec
    d=load(spec); plan[pid]=dict(d=d,var=var,layers=[])
    # bodies
    seen={}
    for ln,l in d.items():
        if not ln.startswith('layer'): continue
        for bt in ('male','female'):
            b=l.get(bt)
            if not b: continue
            ca=l.get('custom_animation')
            lay=dict(bt=bt,z=l.get('zPos',50),paths={})
            if ca:
                if ca not in CUSTOM: continue
                a,c=CUSTOM[ca]
                for n in ([b+var+'.png'] if var else [])+[b.rstrip('/')+'.png']:
                    if 'spritesheets/'+n in files: lay['paths'][a]=(n,c);break
            else:
                for a,c in ANIMS.items():
                    for n in ([b+a+'/'+var+'.png'] if var else [])+[b+a+'.png']:
                        if 'spritesheets/'+n in files: lay['paths'][a]=(n,c);break
            if lay['paths']: plan[pid]['layers'].append(lay)
# manual
def manual(pid,base,z=100):
    plan[pid]=dict(d={'credits':[]},var=None,layers=[{'bt':bt,'z':z,'paths':{a:(base+a+'.png',c) for a,c in ANIMS.items() if 'spritesheets/'+base+a+'.png' in files}} for bt in('male','female')])
manual('head_skel','head/heads/skeleton/adult/'); manual('head_zombie','head/heads/zombie/adult/')
plan['head_skel']['d']['credits']=load('head/heads/undead/heads_skeleton').get('credits',[]);plan['head_zombie']['d']['credits']=load('head/heads/undead/heads_zombie').get('credits',[])
for pid,v in plan.items():
    miss=[bt for bt in('male','female') if not any(x['bt']==bt for x in v['layers'])]
    print(pid,len(v['layers']),'missing',miss,[sorted(x['paths']) for x in v['layers'][:1]],'|',str(v['d'].get('recolors'))[:50])
need=sorted({'spritesheets/'+p for v in plan.values() for l in v['layers'] for p,_ in l['paths'].values()})
open(S+'/build/need.txt','w').write('\n'.join(need))
json.dump({k:{'var':v['var'],'layers':v['layers'],'credits':v['d'].get('credits',[]),'rec':v['d'].get('recolors')} for k,v in plan.items()},open(S+'/build/plan.json','w'))
print(len(need))
