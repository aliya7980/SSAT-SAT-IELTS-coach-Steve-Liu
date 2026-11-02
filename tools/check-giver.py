"""Structural checks for the buildless Giver course; browser QA is recorded separately."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json
R=Path(__file__).resolve().parents[1];D=R/'pages/READINGS/the-giver'
class Page(HTMLParser):
 def __init__(self,s):
  super().__init__();self.ids=[];self.links=[];self.labels=[];self.fields=[];self.current=0;self.h1=0;self.feed(s)
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if 'id' in a:self.ids.append(a['id'])
  if tag in ('a','link','script'):
   u=a.get('href',a.get('src'))
   if u:self.links.append(u)
  if tag=='label' and 'for' in a:self.labels.append(a['for'])
  if tag in ('textarea','select'):self.fields.append(a.get('id'))
  if tag=='a' and a.get('aria-current')=='page':self.current+=1
  if tag=='h1':self.h1+=1
pages={p:Page(p.read_text()) for p in D.glob('*.html')}
assert len(pages)==18,len(pages)
for p,parsed in pages.items():
 assert len(parsed.ids)==len(set(parsed.ids)),f'duplicate IDs: {p}'
 assert parsed.current==1 and parsed.h1==1,p
 assert set(parsed.fields)<=set(parsed.labels),f'unlabelled form field {p}'
 for u in parsed.links:
  parts=urlsplit(u)
  if parts.scheme or parts.netloc:continue
  dest=(p.parent/unquote(parts.path)).resolve() if parts.path else p
  assert dest.exists(),f'missing link {p}: {u}'
  if parts.fragment and dest in pages:assert parts.fragment in pages[dest].ids,f'missing fragment {u}'
cs=json.loads((D/'chapters.json').read_text())
assert [c['number'] for c in cs]==list(range(1,24))
for c in cs:
 assert 100<=len(c['summary'].split())<=150,(c['number'],len(c['summary'].split()))
 assert len(c['developments'])==3
 for k in ('characters','focus','theme','comprehension','analysis','prompt','answer','comprehensionAnswer'):assert c[k],(c['number'],k)
 assert (D/(c['theme']+'.html')).exists()
 assert f'id="chapter-{c["number"]}" data-chapter="{c["number"]}" hidden' in (D/'chapters.html').read_text()
for slug in ('freedom','memory','individuality','love','language','responsibility'):
 s=(D/(slug+'.html')).read_text()
 for phrase in ('Essential question','Two defensible arguments','Model analytical paragraph','Scaffolded paragraph','Independent writing','A common misconception','full-content" hidden'):assert phrase in s,(slug,phrase)
assert 'READINGS/the-giver/index.html' in (R/'pages/readingtips.html').read_text()
assert 'Monte Cristo</a>\n          <a href="READINGS/the-giver/index.html"' in (R/'pages/readingtips.html').read_text()
print('PASS: 18 pages; local links/assets/fragments; unique IDs; form labels; active navigation; 23 ordered chapter records; 100–150-word summaries; six complete theme pages; reading-page integration.')
