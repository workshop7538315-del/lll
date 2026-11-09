import sys,numpy as np,json
from PIL import Image,ImageDraw
from scipy import ndimage as N
out=[];sheets=sys.argv[2:]
W=1500;c=Image.new('RGBA',(W,1500),(60,80,60,255));d=ImageDraw.Draw(c);x=y=4;rowh=0;i=0
for s in sheets:
    a=Image.open(s).convert('RGBA');m=np.array(a)[:,:,3]>10;l,n=N.label(m,structure=np.ones((3,3)))
    for sl in N.find_objects(l):
        h=sl[0].stop-sl[0].start;w=sl[1].stop-sl[1].start
        if 22<=w<=110 and 22<=h<=130:
            if x+w+8>W: x=4;y+=rowh+16;rowh=0
            if y+h>1480: break
            box=(sl[1].start,sl[0].start,sl[1].stop,sl[0].stop);c.alpha_composite(a.crop(box),(x,y+11));d.text((x,y),str(i),fill='yellow');out.append((s,box));i+=1;x+=max(w,20)+8;rowh=max(rowh,h+11)
c=c.crop((0,0,W,min(1500,y+rowh+10)));c.save(sys.argv[1]);json.dump(out,open(sys.argv[1]+'.json','w'));print(i)
