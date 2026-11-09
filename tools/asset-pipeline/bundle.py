import json,sys,os,io,base64,hashlib,re
from PIL import Image
S=sys.argv[1];L=S+'/dl/lpc';T=S+'/dl/tiles';K=S+'/dl/kenney-uipack/UIPackAdventure/PNG/Double/'
plan=json.load(open(S+'/build/plan.json'))
pal={m:json.load(open(f'{L}/palette_definitions/{m}/{m}_ulpc.json')) for m in('body','hair','cloth','metal','eye','wood')}
import numpy as np
def b64(im):
    b=io.BytesIO();a=np.array(im.convert('RGBA'));key=(a[...,0].astype(np.uint32)<<24)|(a[...,1].astype(np.uint32)<<16)|(a[...,2].astype(np.uint32)<<8)|a[...,3]
    u,inv=np.unique(key,return_inverse=True)
    if len(u)<=256:
        idx=inv.reshape(key.shape).astype(np.uint8);q=Image.fromarray(idx,'P');pal=[]
        for v in u: pal+=[int(v)>>24&255,int(v)>>16&255,int(v)>>8&255]
        q.putpalette(pal);q.save(b,'PNG',optimize=True,transparency=bytes(int(v)&255 for v in u))
    else: im.save(b,'PNG',optimize=True)
    return 'data:image/png;base64,'+base64.b64encode(b.getvalue()).decode()
def hx(c): return '#%02x%02x%02x'%c[:3]
def detect(cols,pref):
    res=[]
    order=[pref]+[m for m in pal if m!=pref] if pref else list(pal)
    lc={c.lower() for c in cols}
    for m in order:
        best=max(pal[m].items(),key=lambda kv:len(lc&{x.lower() for x in kv[1]}))
        hit=len(lc&{x.lower() for x in best[1]})
        if (hit>=4 and hit>=len(best[1])*.6) or (m==pref and hit>=2): return m,best[0],hit
    return None,None,0
imgs={};parts={};A=0
for pid,v in plan.items():
    rec=v['rec'] or {}
    pref=rec.get('material') or (rec.get('color_1') or {}).get('material') or ('hair' if pid.startswith(('beard','hx_')) else 'cloth' if pid.startswith(('leg','top','hat')) else None)
    parts[pid]={'male':[],'female':[],'teen':[]}
    for l in v['layers']:
        ims=[];h=0;w=0;meta={}
        for a,(p,c) in l['paths'].items():
            im=Image.open(f'{L}/spritesheets/{p}').convert('RGBA')
            if c<0: fw=-c;c=im.width//fw
            else: fw=im.width//c
            meta[a]={'y':h,'h':im.height,'fw':fw,'cols':c}
            ims.append((h,im));h+=im.height;w=max(w,im.width)
        sh=Image.new('RGBA',(w,h),(0,0,0,0))
        for y,im in ims: sh.paste(im,(0,y))
        cols=[hx(c) for n,c in (sh.getcolors(100000) or []) if c[3]>0]
        mat,base,hit=detect(cols,pref)
        k=hashlib.md5(sh.tobytes()+bytes(str(sh.size),'ascii')).hexdigest()[:10]
        if k not in imgs: imgs[k]=b64(sh)
        e=dict(z=l['z'],img=k,mat=mat,base=base,anims=meta)
        if pid.startswith('head_') and pid not in('head_skel',):
            lc={c.lower() for c in cols};eb=max(pal['eye'].items(),key=lambda kv:len(lc&{x.lower() for x in kv[1]}))
            if len(lc&{x.lower() for x in eb[1]})>=2: e['eye']=eb[0]
        parts[pid][l['bt']].append(e)
    x=parts[pid]['male'] or parts[pid]['female']
    if not any(y['mat'] for y in x): print('nomat',pid,end=' ')
# palettes (only names)
P={m:{k:[c.lower() for c in v] for k,v in pal[m].items()} for m in pal}
# terrain
t=Image.open(T+'/terrain-v7.png').convert('RGBA').crop((0,0,1024,672))
tiles=b64(t)
# objects via contact json
cs=json.load(open(S+'/contact.png.json'))
OB={'tree1':205,'tree2':206,'pine':214,'pine2':216,'stump':191,'bush':172,'bush2':176,'bushd':182,'tomb1':12,'tomb2':13,'tomb3':14,'cross':0,'angel':39,'statue':41,'hay':64,'wood':65,'barrel':72,'bucket':53,'fire':94,'mush1':168,'mush2':170,'flower1':112,'flower2':114,'flower3':117,'tuft':123,'snowpine':223,'snowpine2':226,'cauldron':101}
objs={}
for k,i in OB.items():
    f,box=cs[i]; im=Image.open(T+'/'+f).convert('RGBA').crop(tuple(box)); objs[k]=b64(im)
ui={}
for n in 'panel_brown panel_brown_dark panel_grey_bolts panel_grey_dark panel_border_brown_detail banner_hanging banner_classic_curtain button_brown button_red button_grey hexagon_brown hexagon_grey_red hexagon_grey_green hexagon_grey_dark hexagon_grey progress_red progress_red_border progress_blue progress_blue_border progress_green progress_green_border checkbox_brown_empty checkbox_brown_checked panel_grid_paper pattern_diagonal_transparent_small'.split():
    p=K+n+'.png'
    try: 
        import subprocess
        subprocess.run(['git','-C',S+'/dl/kenney-uipack','checkout','-q','HEAD','--','UIPackAdventure/PNG/Double/'+n+'.png'],check=True,capture_output=True)
        ui[n]=b64(Image.open(p).convert('RGBA'));print(n,Image.open(p).size,end=';')
    except Exception as e: print('MISS',n)
# credits
cr=[]
for pid,v in plan.items():
    for c in v['credits']:
        cr.append((tuple(c.get('authors',[])),tuple(c.get('licenses',[])),tuple(c.get('urls',[]))))
cr=list(dict.fromkeys(cr))
authors=sorted({a for c in cr for a in c[0]})
lic=sorted({a for c in cr for a in c[1]})
urls=sorted({a for c in cr for a in c[2]})
json.dump({'img':imgs,'parts':parts,'pal':P,'tiles':tiles,'objs':objs,'ui':ui,'catalog':json.load(open(S+'/build/catalog.json')),'credits':{'authors':authors,'licenses':lic,'urls':urls}},open(S+'/build/assets.json','w'))
print('\nsize',os.path.getsize(S+'/build/assets.json')/1e6,len(imgs),len(authors),lic)
