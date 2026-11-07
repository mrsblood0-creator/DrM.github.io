import os,json,zipfile,xml.etree.ElementTree as ET,posixpath,hashlib,html,io
import sys
from PIL import Image
from pathlib import Path
from slide_image_filter import annotation_only
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
asset=Path('slide-assets');asset.mkdir(exist_ok=True)
inv={d['path']:d for d in json.load(open('deck-inventory.json',encoding='utf8'))}
mapping={}
for file in Path('.').glob('slide-map-*.json'):mapping.update(json.load(open(file,encoding='utf8')))
E=html.escape
result={};issues=[];counts={'slides':0,'images':0,'tables':0}; filtered=[]; image_checks={}
selected=set(sys.argv[1:])
if selected:result=json.load(open('slide-notes.json',encoding='utf8'))
manual_exclusions=json.load(open('content/excluded-slide-images.json',encoding='utf8'))
keep_small={'23843b71a4d46de75bb0d624.jpeg'} # Reviewed ATLS head-tilt/chin-lift photograph.
for vid,m in mapping.items():
 if selected and vid not in selected:continue
 if not m['decks']:continue
 sections=[];sources=[];seen=set();number=0;figures=0;tables=0;outline=[]
 for path in m['decks']:
  deck=inv[path];z=zipfile.ZipFile(path);sources.append(os.path.basename(path))
  for no,s in enumerate(deck['slides'],1):
   if m.get('slideNumbers') and no not in m['slideNumbers']:continue
   tree=ET.fromstring(z.read(s['part']));folder=posixpath.dirname(s['part']);rname=folder+'/_rels/'+posixpath.basename(s['part'])+'.rels';rels={}
   if rname in z.namelist():
    for r in ET.fromstring(z.read(rname)):
     if r.attrib.get('TargetMode')!='External':rels[r.attrib['Id']]=posixpath.normpath(folder+'/'+r.attrib['Target'])
   texts=[]
   for shape in tree.findall('.//p:sp',ns):
    for p in shape.findall('p:txBody/a:p',ns):
     t=''.join(x.text or '' for x in p.findall('.//a:t',ns)).strip()
     if t and not t.isdigit():texts.append(t)
   heading=texts[0] if texts and len(texts[0])<180 else f'Slide {no}'
   body=''.join('<p>'+E(t)+'</p>' for t in (texts[1:] if heading!=f'Slide {no}' else texts))
   for table in tree.findall('.//a:tbl',ns):
    rows=[]
    for i,row in enumerate(table.findall('a:tr',ns)):
     cells=[]
     for cell in row.findall('a:tc',ns):
      if cell.get('hMerge')=='1' or cell.get('vMerge')=='1':continue
      tag='th' if i==0 else 'td';span=''
      if cell.get('gridSpan'):span+=' colspan="'+cell.get('gridSpan')+'"'
      if cell.get('rowSpan'):span+=' rowspan="'+cell.get('rowSpan')+'"'
      text='<br>'.join(E(''.join(t.text or '' for t in p.findall('.//a:t',ns))) for p in cell.findall('a:txBody/a:p',ns))
      cells.append(f'<{tag}{span}>{text}</{tag}>')
     rows.append('<tr>'+''.join(cells)+'</tr>')
    body+='<table class="slide-table"><caption>Table from slide '+str(no)+'</caption>'+''.join(rows)+'</table>';tables+=1
   pics=[];seen=set()
   for blip in (node for node in tree.iter() if node.tag.rsplit('}',1)[-1] in ('blip','svgBlip')):
    rid=blip.attrib.get('{'+ns['r']+'}embed');target=rels.get(rid)
    if not target or target not in z.namelist():continue
    data=z.read(target)
    asset_name=hashlib.sha256(data).hexdigest()[:24]+Path(target).suffix.lower()
    if asset_name in manual_exclusions:
     filtered.append({'video':vid,'deck':os.path.basename(path),'slide':no,'asset':asset_name,'reason':manual_exclusions[asset_name]})
     continue
    try:
     image=Image.open(io.BytesIO(data));w,h=image.size
     if (w<130 or h<60) and asset_name not in keep_small:continue
     image_key=hashlib.sha256(data).hexdigest()
     if image_key not in image_checks:image_checks[image_key]=annotation_only(image)
     if image_checks[image_key]:
      filtered.append({'video':vid,'deck':os.path.basename(path),'slide':no,'asset':image_key[:24]+Path(target).suffix.lower(),'reason':'Blank or isolated pen/highlighter layer'})
      continue
    except:pass
    digest=hashlib.sha256(data).hexdigest()[:24];ext=Path(target).suffix.lower()
    if ext=='.jfif':ext='.jpg'
    if digest in seen:continue
    if ext not in ['.png','.jpg','.jpeg','.gif','.svg','.webp','.bmp']:
     issues.append({'video':vid,'deck':os.path.basename(path),'slide':no,'issue':'Unsupported embedded figure '+ext});continue
    seen.add(digest);file=digest+ext
    if not (asset/file).exists():(asset/file).write_bytes(data)
    pics.append(f'<figure><a href="slide-assets/{file}" target="_blank" rel="noopener"><img src="slide-assets/{file}" alt="Figure from {E(heading)} (slide {no})" loading="lazy"></a><figcaption>Original slide {no} figure · Select to enlarge</figcaption></figure>');figures+=1
   if pics:body+='<div class="slide-gallery">'+''.join(pics)+'</div>'
   if not texts and not body:continue
   number+=1;outline.append({'heading':heading,'slide':no,'summary':' '.join(texts[1:])[:700]})
   sections.append(f'<section class="slide-section" id="source-slide-{number}"><span class="slide-number">SOURCE SLIDE {no}</span><h3>{E(heading)}</h3>{body}</section>')
 result[vid]={'html':''.join(sections),'sources':sources,'slideCount':number,'imageCount':figures,'tableCount':tables,'outline':outline,'reason':m['reason']}
 counts['slides']+=number;counts['images']+=figures;counts['tables']+=tables
json.dump(result,open('slide-notes.json','w',encoding='utf8'),ensure_ascii=False)
json.dump({'lectures':len(selected) if selected else len(result),**counts,'issues':issues},open('content/targeted-slide-extraction-audit.json' if selected else 'slide-extraction-audit.json','w',encoding='utf8'),ensure_ascii=False,indent=2)
json.dump(filtered,open('content/targeted-excluded-slide-annotations.json' if selected else 'excluded-slide-annotations.json','w',encoding='utf8'),ensure_ascii=False,indent=2)
print(json.dumps({'lectures':len(result),**counts,'issues':len(issues)}))
