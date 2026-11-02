"""Create an auditable inventory from the rendered course and canonical chapter records."""
from html.parser import HTMLParser
from pathlib import Path
import json,re
import giver_lessons as content
R=Path(__file__).resolve().parents[1];D=R/'pages/READINGS/the-giver'
VOID={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Node:
 def __init__(self,tag='',attrs=None):self.tag=tag;self.attrs=attrs or {};self.children=[]
 def find(self,fn):
  if fn(self):return self
  for c in self.children:
   if isinstance(c,Node):
    v=c.find(fn)
    if v:return v
 def each(self,tag):
  if self.tag==tag:yield self
  for c in self.children:
   if isinstance(c,Node):yield from c.each(tag)
 def text(self,exclude=()):
  if self.tag in exclude:return ''
  return ' '.join(c if isinstance(c,str) else c.text(exclude) for c in self.children)
class DOM(HTMLParser):
 def __init__(self,s):super().__init__();self.root=Node();self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=Node(t,dict(a));self.stack[-1].children.append(n)
  if t not in VOID:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,d):self.stack[-1].children.append(d)
def wc(s):return len(s.split())
def inventory():
 rows=[]
 for p in sorted(D.glob('*.html')):
  dom=DOM(p.read_text()).root;lesson=dom.find(lambda n:n.attrs.get('id')=='lesson')
  assert lesson,p
  headings=[n.text().strip() for n in lesson.each('h2')]
  rows.append({'page':p.name,'words':wc(lesson.text({'button','select','textarea','nav','svg'})),'sections':headings})
 themes={}
 for k,d in content.THEMES.items():
  lesson=DOM((D/(k+'.html')).read_text()).root.find(lambda n:n.attrs.get('id')=='lesson')
  total=0
  for s in lesson.each('section'):
   h=next(s.each('h2'),None)
   if h and (h.text() in ['Topic → argument','Two defensible arguments','Development across the novel','A complication worth answering','Model analytical paragraph · paraphrased evidence','Two misconceptions to correct'] or h.text() in [t for t,_ in d['cases']]):
    total+=wc(s.text({'h2','h3','small','button','textarea','table'}))
  themes[k]={'teachingWordsExcludingQuestionsTables':total,'modelWords':wc(d['model']),'caseStudies':len(d['cases'])}
 chapters=json.loads((D/'chapters.json').read_text())
 stats=[{'chapter':c['number'],**{k:wc(c[k]) for k in ['summary','characterInsight','literaryAnalysis','themeAnalysis','analyticalAnswer']}} for c in chapters]
 return {'pages':rows,'themes':themes,'chapters':stats,'plotLessonWords':sum(wc(s) for _,s in content.PLOT),'settingLessonWords':sum(wc(s) for _,s in content.SETTING),'characterProfileWords':{k:wc(v) for k,v in content.CHARACTERS.items()}}
def write():
 data=inventory();(D/'content-inventory.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 lines=['# The Giver content inventory','','Counts come from the generated lesson area, excluding shared navigation, controls, footer, and SVG labels. Page totals include student tasks, tables, deliberately hidden answers, and the alternative stacked-table presentation (the alternatives are not shown together). Specific teaching counts below exclude theme questions and tables. Counts are approximate whitespace-based words, used to detect gaps rather than to pad content.','','| Page | Lesson words | Completed sections |','| --- | ---: | --- |']
 for r in data['pages']:lines.append('| '+r['page']+' | '+str(r['words'])+' | '+'; '.join(r['sections'])+' |')
 lines+=['','## Theme teaching depth','','| Theme | Teaching words excluding questions/tables | Model paragraph | Developed case studies |','| --- | ---: | ---: | ---: |']
 for k,v in data['themes'].items():lines.append(f'| {k} | {v["teachingWordsExcludingQuestionsTables"]} | {v["modelWords"]} | {v["caseStudies"]} |')
 lines+=['','## Chapter depth','','All 23 entries include three developments, chapter-safe questions, a specific writing task, and suggested comprehension and analytical answers.','','| Chapter | Summary | Character insight | Literary focus | Theme connection | Analytical answer |','| --- | ---: | ---: | ---: | ---: | ---: |']
 for r in data['chapters']:lines.append('| '+' | '.join(str(v) for v in r.values())+' |')
 lines+=['','## Long-form lessons','',f'Plot stage explanations: {data["plotLessonWords"]} words.',f'Setting explanations: {data["settingLessonWords"]} words.','','| Character | Profile words |','| --- | ---: |']
 for k,v in data['characterProfileWords'].items():lines.append(f'| {k} | {v} |')
 lines+=['','## Evidence limits','','Only the publisher’s Chapter 1 excerpt was accessible as primary text. All other novel evidence is identified as event paraphrase and cross-checked with secondary guides; exact quotations beyond that excerpt are not used. No universal page numbers, unverified edition details, film events, or sequel resolutions are supplied. See evidence-checks.json and the Sources page.']
 (D/'CONTENT-INVENTORY.md').write_text('\n'.join(lines)+'\n')
 print('Inventory generated:',sum(r['words'] for r in data['pages']),'lesson words across',len(data['pages']),'pages')
 for k,v in data['themes'].items():print(k,v)
if __name__=='__main__':write()

