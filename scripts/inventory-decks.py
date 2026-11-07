import os,zipfile,json,xml.etree.ElementTree as ET,re,posixpath,hashlib
root=r'D:\Youtube'
ns={'a':'http://schemas.openxmlformats.org/drawingml/2006/main','p':'http://schemas.openxmlformats.org/presentationml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
R='{http://schemas.openxmlformats.org/package/2006/relationships}'
out=[]
for folder,dirs,files in os.walk(root):
 for f in files:
  if not f.lower().endswith('.pptx') or f.startswith('~$'):continue
  path=os.path.join(folder,f)
  try:
   z=zipfile.ZipFile(path);pres=ET.fromstring(z.read('ppt/presentation.xml'));rels=ET.fromstring(z.read('ppt/_rels/presentation.xml.rels'));rm={x.attrib['Id']:posixpath.normpath('ppt/'+x.attrib['Target']) for x in rels};slides=[]
   for sid in pres.findall('p:sldIdLst/p:sldId',ns):
    name=rm[sid.attrib['{'+ns['r']+'}id']];tree=ET.fromstring(z.read(name));paras=[''.join(p.itertext()).strip() for p in []]
    paras=[''.join(t.text or '' for t in p.findall('.//a:t',ns)).strip() for p in tree.findall('.//a:p',ns)];paras=[p for p in paras if p]
    slides.append({'part':name,'text':paras})
   out.append({'path':path,'relative':os.path.relpath(path,root),'slides':slides,'videos':[v for v in files if v.lower().endswith('.mp4')]})
  except Exception as e: print('ERROR',path,str(e))
json.dump(out,open('deck-inventory.json','w',encoding='utf8'),ensure_ascii=False,indent=2)
print('DECKS',len(out),'SLIDES',sum(len(d['slides']) for d in out))
