import json,zipfile,html,posixpath,xml.etree.ElementTree as ET,hashlib,io
from PIL import Image
from slide_image_filter import annotation_only
from pathlib import Path
root=Path(r'D:\2 Pathology\13 Pathology')
mapping={
'eFmMnrv5gHA':'2 Causes of cell injury/Causes of cell injury.pptx',
'ARd1AOM8sxk':'3 Types of necrosis/Typesofnecros.pptx',
'DHphsnW-nYo':'4 Growth Adaptations/Growth Adaptations.pptx',
'kHhJRk4qxPQ':'5 Cell injury/Cell injury new.pptx',
'I-_HV25j_9s':'6 Cell Death/Cell Death.pptx',
'n9brM9pTw6I':'7 Mechanisms for cell injury and cell death/Free radical injury.pptx',
'I0ygFfqwhHw':'8 Amyloidosis/Amyloidosis.pptx',
'iFo2ROztdGs':'9 Intracellular accumulations/Intracellular accumulations.pptx',
'IdO0f5klcXI':'11 Questions chp 1/Questions.pptx',
'esgddQPQqSQ':'12 Questions part 2/Questions part 2.pptx'}
import sys
prefix='pathology'
if len(sys.argv)>1:
 config=json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
 root=Path(config['root']);mapping=config['mapping'];prefix=config['outputPrefix']
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
out={};audit=[]
assets=Path('slide-assets');assets.mkdir(exist_ok=True)
for vid,relative in mapping.items():
 path=root/relative
 with zipfile.ZipFile(path) as z:
  rels=ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'))
  targets={r.attrib['Id']:posixpath.normpath('ppt/'+r.attrib['Target']) for r in rels}
  ids=ET.fromstring(z.read('ppt/presentation.xml')).findall('p:sldIdLst/p:sldId',ns)
  sections=[];outline=[];empty=[];image_slides=[];figure_count=0;text_count=0;excluded=[]
  for no,sid in enumerate(ids,1):
   part=targets[sid.attrib['{'+ns['r']+'}id']];tree=ET.fromstring(z.read(part))
   paragraphs=[]
   for shape in tree.findall('.//p:sp',ns):
    for p in shape.findall('p:txBody/a:p',ns):
     text=''.join(t.text or '' for t in p.findall('.//a:t',ns)).strip()
     if text:paragraphs.append(text)
   if tree.findall('.//p:pic',ns):image_slides.append(no)
   tables=[]
   for table in tree.findall('.//a:tbl',ns):
    rows=[]
    for i,row in enumerate(table.findall('a:tr',ns)):
     cells=[]
     for cell in row.findall('a:tc',ns):
      if cell.get('hMerge')=='1' or cell.get('vMerge')=='1':continue
      tag='th' if i==0 else 'td';attrs=''
      for key,attr in [('gridSpan','colspan'),('rowSpan','rowspan')]:
       if cell.get(key):attrs+=f' {attr}="{cell.get(key)}"'
      txt='<br>'.join(html.escape(''.join(t.text or '' for t in p.findall('.//a:t',ns))) for p in cell.findall('a:txBody/a:p',ns))
      cells.append(f'<{tag}{attrs}>{txt}</{tag}>')
     rows.append('<tr>'+''.join(cells)+'</tr>')
    tables.append('<table>'+''.join(rows)+'</table>')
   if not paragraphs and not tables:empty.append(no)
   else:text_count+=1
   folder=posixpath.dirname(part);rels_part=folder+'/_rels/'+posixpath.basename(part)+'.rels'
   media={}
   if rels_part in z.namelist():
    media={r.attrib['Id']:posixpath.normpath(folder+'/'+r.attrib['Target']) for r in ET.fromstring(z.read(rels_part)) if r.attrib.get('TargetMode')!='External'}
   figures=[];seen=set()
   for blip in (node for node in tree.iter() if node.tag.rsplit('}',1)[-1] in ('blip','svgBlip')):
    target=media.get(blip.get('{'+ns['r']+'}embed'))
    if not target or target not in z.namelist():continue
    data=z.read(target);digest=hashlib.sha256(data).hexdigest()[:24]
    if digest in seen:continue
    seen.add(digest);ext=Path(target).suffix.lower()
    try:
     image=Image.open(io.BytesIO(data))
     if image.width<130 or image.height<60 or annotation_only(image):
      excluded.append({'slide':no,'source':target,'reason':'Small decorative asset, blank image or annotation-only layer'});continue
    except Exception:
     if ext not in ['.svg']:
      excluded.append({'slide':no,'source':target,'reason':'Unsupported image format '+ext});continue
    if ext=='.bmp':
     output=io.BytesIO();image.save(output,format='PNG');data=output.getvalue();ext='.png'
    name=digest+ext;(assets/name).write_bytes(data)
    src='slide-assets/'+name
    credit=' '.join(p for p in paragraphs if any(t in p.lower() for t in ['wikimedia','creative commons','cc by','public domain','robbins']))
    caption=f'Figure from {path.name}, slide {no}.'+(' '+credit if credit else ' Courtesy of the supplied lecture presentation; original creator not identified in slide text.')
    figures.append(f'<figure><a href="{src}" target="_blank" rel="noopener"><img src="{src}" alt="{html.escape(path.stem)} — source slide {no} figure" loading="lazy"></a><figcaption>{html.escape(caption)}</figcaption></figure>');figure_count+=1
   if not paragraphs and not tables and not figures:continue
   title=paragraphs[0] if paragraphs and len(paragraphs[0])<160 else f'Slide {no}'
   content=paragraphs[1:] if paragraphs and title==paragraphs[0] else paragraphs
   # Preserve title-only slides too; the renderer may omit non-instructional separators.
   body=''.join('<p>'+html.escape(t)+'</p>' for t in content)+''.join(tables)+('<div class="slide-gallery">'+''.join(figures)+'</div>' if figures else '')
   sections.append(f'<section class="slide-section"><h3>{html.escape(title)}</h3>{body}</section>')
   outline.append({'slide':no,'heading':title,'summary':' '.join(content)})
  out[vid]={'html':''.join(sections),'sources':[path.name],'sourcePath':str(path),'slideCount':len(ids),'outline':outline,'imageOnlySlideNumbers':empty,'slidesWithImages':image_slides,'reason':'User-supplied presentation folder; matched by lecture topic, deck title and content. Full video comparison pending.'}
  audit.append({'lectureId':vid,'file':str(path),'slides':len(ids),'slidesWithText':text_count,'imageOnlySlides':empty,'slidesWithImages':image_slides,'importedFigures':figure_count,'excludedImages':excluded})
Path(f'content/{prefix}-slide-notes.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
Path(f'content/{prefix}-deck-import-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2),encoding='utf-8')
print('Imported',len(out),'decks;',sum(r['slides'] for r in audit),'slides;',sum(r['slidesWithText'] for r in audit),'slides with text')
for r in audit:print(r['lectureId'],r['slidesWithText'],'text slides;',len(r['imageOnlySlides']),'without native text')
