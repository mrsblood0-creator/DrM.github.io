from pathlib import Path
import json,re,sys
from PIL import Image
from slide_image_filter import annotation_only
refs=set()
for name in ['slide-notes.json','content/pathology-slide-notes.json','content/pharmacology-slide-notes.json']:
 for v in json.loads(Path(name).read_text(encoding='utf-8')).values(): refs.update(re.findall(r'src="(slide-assets/[^"]+)"',v['html']))
excluded=json.loads(Path('content/annotation-layer-manual-exclusions.json').read_text())
for name in refs:
 try:
  with Image.open(name) as im:
   if annotation_only(im): excluded.append(name)
 except (OSError,ValueError): pass
Path('content/annotation-layer-exclusions.json').write_text(json.dumps(sorted(excluded),indent=2))
print('Excluded isolated pen layers:',len(excluded))
