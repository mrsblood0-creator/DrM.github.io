"""Losslessly optimize deployable raster assets; source originals are untouched."""
from pathlib import Path
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
import io,json,os,re
ROOT=Path(__file__).resolve().parent.parent
DIST=(ROOT/'dist').resolve()

def size(): return sum(p.stat().st_size for p in DIST.rglob('*') if p.is_file())
def optimize(p):
 try:
  with Image.open(p) as im:
   if getattr(im,'is_animated',False):return None
   if im.mode not in ('RGB','RGBA','P','L','LA'):return None
   # Preserve color profiles and orientation metadata when present.
   options={k:im.info[k] for k in ('icc_profile','exif') if im.info.get(k)}
   original=im.convert('RGBA')
   output=io.BytesIO()
   original.save(output,format='WEBP',lossless=True,quality=60,method=2,exact=True,**options)
   encoded=output.getvalue()
   if len(encoded)>=p.stat().st_size:return None
   with Image.open(io.BytesIO(encoded)) as decoded:
    if decoded.size!=original.size or decoded.convert('RGBA').tobytes()!=original.tobytes():return None
    for key,value in options.items():
     if decoded.info.get(key)!=value:return None
   target=p.with_name(p.name+'.lossless.webp')
   if not target.resolve().is_relative_to(DIST):raise ValueError('Outside deployment')
   target.write_bytes(encoded)
   return {'old':p.relative_to(DIST).as_posix(),'new':target.relative_to(DIST).as_posix(),'before':p.stat().st_size,'after':len(encoded)}
 except Exception as e:
  print('Kept original:',p.name,type(e).__name__,flush=True)
 return None

def main():
 import runpy
 runpy.run_path(str(ROOT/'scripts/browser-images.py'),run_name='__main__')
 # Ignore leftover trial outputs from an interrupted run when the original exists.
 for p in DIST.rglob('*.lossless.webp'):
  original=p.with_name(p.name.removesuffix('.lossless.webp'))
  if original.exists() and p.resolve().is_relative_to(DIST):p.unlink()
 before=size()
 candidates=[p for folder in ('slide-assets','images','video-frames') for p in (DIST/folder).glob('*') if p.suffix.lower() in ('.png','.jpg','.jpeg','.bmp')]
 changes=[]
 with ThreadPoolExecutor(max_workers=4) as pool:
  for n,future in enumerate(as_completed([pool.submit(optimize,p) for p in candidates]),1):
   result=future.result()
   if result:changes.append(result)
   if n%50==0:print(f'Checked {n}/{len(candidates)} images; optimized {len(changes)}',flush=True)
 # Replace full asset path segments in HTML, CSS, and the app data bundle.
 mapping={item['old']:item['new'] for item in changes}
 if mapping:
  pattern=re.compile('|'.join(re.escape(x) for x in sorted(mapping,key=len,reverse=True)))
  for p in DIST.rglob('*'):
   if p.suffix.lower() in ('.html','.js','.css','.json','.xml'):
    text=p.read_text(encoding='utf8');updated=pattern.sub(lambda m:mapping[m[0]],text)
    if text!=updated:p.write_text(updated,encoding='utf8')
  for item in changes:
   old=(DIST/item['old']).resolve()
   if not old.is_relative_to(DIST):raise ValueError('Outside deployment')
   old.unlink()
 report={'beforeBytes':before,'afterBytes':size(),'optimizedImages':len(changes),'checkedImages':len(candidates),'pixelVerification':'Exact RGBA bytes, dimensions and preserved color/orientation metadata','changes':changes}
 (ROOT/'content/image-optimization-report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
 print(json.dumps({k:v for k,v in report.items() if k!='changes'}),flush=True)
if __name__=='__main__':main()

