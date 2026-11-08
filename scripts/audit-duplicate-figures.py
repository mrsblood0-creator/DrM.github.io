"""Identify identical figures and PowerPoint raster/vector alternatives without guessing from similarity."""
import json, hashlib, zipfile, posixpath
from pathlib import Path
from xml.etree import ElementTree as ET
from PIL import Image
root=Path(__file__).resolve().parent.parent
assets=root/'slide-assets'
aliases={};pixels={};scanned=0
for path in sorted(assets.glob('*')):
 try:
  with Image.open(path) as im:
   im=im.convert('RGBA'); key=(im.size,hashlib.sha256(im.tobytes()).hexdigest())
   name='slide-assets/'+path.name
   if key in pixels: aliases[name]=pixels[key]
   else: pixels[key]=name
 except Exception: pass
paths={d['path'] for d in json.loads((root/'deck-inventory.json').read_text(encoding='utf8'))}
for file in root.glob('slide-map-*.json'):
 for item in json.loads(file.read_text(encoding='utf8')).values():paths.update(item.get('decks',[]))
for path in sorted(paths):
 if not Path(path).exists():continue
 try:
  with zipfile.ZipFile(path) as z:
   scanned+=1
   for part in z.namelist():
    if not part.startswith('ppt/slides/slide') or not part.endswith('.xml'):continue
    folder=posixpath.dirname(part);relfile=folder+'/_rels/'+posixpath.basename(part)+'.rels'
    if relfile not in z.namelist():continue
    rels={r.attrib['Id']:posixpath.normpath(folder+'/'+r.attrib['Target']) for r in ET.fromstring(z.read(relfile)) if r.attrib.get('TargetMode')!='External'}
    for blip in ET.fromstring(z.read(part)).iter():
     if blip.tag.rsplit('}',1)[-1]!='blip':continue
     names=[]
     for node in [blip]+[n for n in blip.iter() if n.tag.rsplit('}',1)[-1]=='svgBlip']:
      rid=node.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed');target=rels.get(rid)
      if not target or target not in z.namelist():continue
      ext=Path(target).suffix.lower();ext='.jpg' if ext=='.jfif' else ext
      name='slide-assets/'+hashlib.sha256(z.read(target)).hexdigest()[:24]+ext
      if (root/name).exists():names.append(name)
     if len(names)>1:
      for name in names[1:]:aliases[name]=names[0]
 except (zipfile.BadZipFile,ET.ParseError):pass
reviewed=root/'content/reviewed-figure-aliases.json'
if reviewed.exists(): aliases.update(json.loads(reviewed.read_text(encoding='utf8')))
(root/'content/figure-aliases.json').write_text(json.dumps(aliases,indent=2),encoding='utf8')
print(f'{scanned} presentations scanned; {len(aliases)} verified duplicate asset aliases')
