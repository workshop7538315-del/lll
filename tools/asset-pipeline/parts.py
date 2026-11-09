"""LPCの定義ファイルから必要なスプライトの一覧を作る。 usage: parts.py <作業dir>"""
import json,os,sys,glob
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import importlib.util as U
sp=U.spec_from_file_location('catalog',os.path.join(os.path.dirname(os.path.abspath(__file__)),'catalog.py'));C=U.module_from_spec(sp);sp.loader.exec_module(C)
S=sys.argv[1];os.chdir(S+'/dl/lpc')
ANIMS={'walk':9,'slash':6,'thrust':8,'spellcast':7,'shoot':13,'hurt':6}
CUSTOM={'slash_128':('slash',128),'slash_oversize':('slash',192),'walk_128':('walk',128),'thrust_oversize':('thrust',192)}
BT=('male','female','teen')
defs={os.path.basename(f)[:-5]:f for f in glob.glob('sheet_definitions/**/*.json',recursive=True)}
files={l.strip() for l in open(S+'/dl/lpc_files.txt')}
P={'body':('body',None),'skeleton':('body_skeleton',None),'zombie':('body_zombie','zombie')}
for k,v in C.HEADPARTS.items():P[k]=(v,None)
P['head_zombie']=('heads_zombie',None);P['head_skel']=('heads_skeleton',None)
for L in (C.HAIR,C.BEARD,C.EARS,C.TOP,C.LEG,C.FEET,C.HAT,C.FACE,C.ARM,C.CAPE):
    for pid,_,d,v in L:P[pid]=(d,v)
for pid,d,v in C.W+C.SHIELD:P[pid]=(d,v)
plan={};bad=[]
for pid,(name,var) in P.items():
    if name not in defs: bad.append((pid,name));continue
    d=json.load(open(defs[name]));vs=d.get('variants') or []
    if var and vs and var not in vs:
        var=next((x for x in ('brown','iron','medium','black') if x in vs),vs[0])
    if not var and vs: var=next((x for x in ('brown','iron','medium','black') if x in vs),vs[0])
    plan[pid]=dict(d=d,var=var,layers=[])
    for ln,l in d.items():
        if not ln.startswith('layer') or not isinstance(l,dict):continue
        for bt in BT:
            b=l.get(bt)
            if not b:continue
            ca=l.get('custom_animation');lay=dict(bt=bt,z=l.get('zPos',50),paths={})
            if ca:
                if ca not in CUSTOM:continue
                a,fw=CUSTOM[ca]
                for n in ([b+var+'.png'] if var else [])+[b.rstrip('/')+'.png']:
                    if 'spritesheets/'+n in files: lay['paths'][a]=(n,-fw);break
            else:
                for a,c in ANIMS.items():
                    for n in ([b+a+'/'+var+'.png'] if var else [])+[b+a+'.png']:
                        if 'spritesheets/'+n in files: lay['paths'][a]=(n,c);break
            if lay['paths']:plan[pid]['layers'].append(lay)
print('undefined',bad)
print('empty',[k for k,v in plan.items() if not v['layers']])
need=sorted({'spritesheets/'+p for v in plan.values() for l in v['layers'] for p,_ in l['paths'].values()})
open(S+'/build/need.txt','w').write('\n'.join(need));print('files',len(need))
json.dump({k:{'var':v['var'],'layers':v['layers'],'credits':v['d'].get('credits',[]),'rec':v['d'].get('recolors')} for k,v in plan.items()},open(S+'/build/plan.json','w'))
cat={k:[(a,b) for a,b,*_ in getattr(C,k)] for k in('HAIR','BEARD','EARS','TOP','LEG','FEET','HAT','FACE','ARM','CAPE')}
cat['HEAD']=[list(x) for x in C.HEADS]
json.dump(cat,open(S+'/build/catalog.json','w'),ensure_ascii=False)
