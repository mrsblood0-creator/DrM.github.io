import json
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
sources=json.load(open('video-frame-sources.json',encoding='utf8'));out={};excluded=[];root=Path('video-frames');root.mkdir(exist_ok=True)
for vid,d in sources.items():
 if not d.get('sheets'):continue
 frames=[];previous=None;last=None
 for sheetno,path in enumerate(d['sheets']):
  sheet=Image.open(path).convert('RGB')
  for slot in range(d['cols']*d['rows']):
   index=sheetno*d['cols']*d['rows']+slot
   if index>=d['frames']:break
   x=(slot%d['cols'])*d['width'];y=(slot//d['cols'])*d['height'];frame=sheet.crop((x,y,x+d['width'],y+d['height']));small=frame.resize((64,36)).convert('L')
   if ImageStat.Stat(small).stddev[0] < 3:
    excluded.append({'lectureId':vid,'seconds':round(index*d['interval']/1000),'reason':'Nearly uniform frame without readable text or an illustration'})
    continue
   difference=100 if previous is None else ImageStat.Stat(ImageChops.difference(small,previous)).mean[0]
   if difference>2.5:
    file=f'{vid}-{index}.jpg';frame.save(root/file,quality=92);frames.append({'src':str(root/file).replace('\\','/'),'seconds':round(index*d['interval']/1000)})
    previous=small
 out[vid]={'frames':frames,'width':d['width'],'height':d['height'],'intervalSeconds':d['interval']/1000,'source':'YouTube preview frames; sampled, not a complete or verified slide transcript'}
json.dump(out,open('video-frame-notes.json','w',encoding='utf8'),ensure_ascii=False)
json.dump(excluded,open('excluded-video-frames.json','w',encoding='utf8'),indent=2)
print('Video galleries',len(out),'selected frames',sum(len(d['frames']) for d in out.values()))
