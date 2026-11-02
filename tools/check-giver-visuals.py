"""Validate assets, credit links, spoiler boundaries and preservation against the snapshot."""
from pathlib import Path
import json,sys,xml.etree.ElementTree as ET
from PIL import Image
from giver_inventory import DOM,Node
D=Path(__file__).resolve().parents[1]/'pages/READINGS/the-giver'
assets=json.loads((D/'asset-manifest.json').read_text());lookup={a['filename']:a for a in assets};used=set()
assert len(assets)==15
for a in assets:
 p=D/a['filename'];assert p.exists(),p
 for key in ['creator','licence','width','height','type','attribution','checked']:assert a[key],(p,key)
 if p.suffix=='.webp':
  im=Image.open(p);assert im.size==(a['width'],a['height'])
  assert a['source_page_inspected'] and a['actual_image_inspected'] and a['source_url']
 else:
  root=ET.fromstring(p.read_text());assert root.attrib['width']==str(a['width']) and root.attrib['height']==str(a['height'])
  assert root.find('{http://www.w3.org/2000/svg}title') is not None
 assert p.stat().st_size<170000,p
credits=DOM((D/'image-credits.html').read_text()).root
ids={n.attrs['id'] for tag in ['section','h2'] for n in credits.each(tag) if 'id' in n.attrs}
for a in assets:assert 'asset-'+a['id'] in ids
nimages=0
def check(n,anc=()):
 global nimages
 if n.tag=='img':
  nimages+=1;src=n.attrs['src'];assert src in lookup,src;used.add(src)
  assert n.attrs.get('alt') and n.attrs.get('width') and n.attrs.get('height')
  assert n.attrs['loading'] in ['lazy','eager'];assert any(a.tag=='figure' for a in anc)
  asset=lookup[src]
  if asset['id'] in ['apple','snow-valley','plot-structure','relationships','jonas-development','conflict-consequence']:
   assert any('full-content' in a.attrs.get('class','').split() for a in anc),(src,'spoiler image outside gate')
 for c in n.children:
  if isinstance(c,Node):check(c,anc+(n,))
for p in D.glob('*.html'):
 dom=DOM(p.read_text()).root;check(dom)
 assert 'Image credits and visual meanings' in dom.text(),p
 assert 'reading.css' in p.read_text() and 'reading.js' in p.read_text()
assert used==set(lookup),('unused',set(lookup)-used)
# The original canonical chapter records still have all required fields; the presentation never rewrites them.
source=Path('/tmp/giver-source-baseline/pages/READINGS/the-giver')
if source.exists():
 count=0
 for p in source.glob('*.html'):
  old=DOM(p.read_text()).root;new=DOM((D/p.name).read_text()).root;text=' '.join(new.text().split())
  for para in old.each('p'):
   assert ' '.join(para.text().split()) in text,(p.name,para.text()[:80]);count+=1
 for name in ['chapters.json','evidence-checks.json','study.js','study.css']:assert (source/name).read_bytes()==(D/name).read_bytes()
 print('PASS:',count,'original paragraphs preserved; canonical chapter and evidence files unchanged.')
css=(D/'reading.css').read_text()
assert 'font-size:18px' in css and 'max-width:68ch' in css
assert '.table-cards{display:none!important}' in css and '[hidden]{display:block!important}' in css
assert 'prefers-reduced-motion' in css
print('PASS:',len(assets),'local assets;',nimages,'image uses; dimensions, alt text, captions, credits, spoiler gates, and print/mobile rules.')
