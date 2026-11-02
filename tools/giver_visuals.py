"""Presentation layer: preserves lesson wording and adds credited, spoiler-aware visuals."""
from pathlib import Path
import html,json,re,hashlib
from giver_inventory import DOM,Node
ESC=html.escape

def el(tag,attrs=None,*children):
 n=Node(tag,attrs or {});n.children=list(children);return n
def fragment(s):return DOM(s).root.children
def serial(n):
 if isinstance(n,str):return ESC(n,quote=False)
 if not n.tag:return ''.join(serial(c) for c in n.children)
 attrs=''.join(' '+k if v is None else ' '+k+'="'+ESC(str(v),quote=True)+'"' for k,v in n.attrs.items())
 if n.tag in {'img','input','meta','link','br','hr','source','wbr'}:return '<'+n.tag+attrs+'>'
 return '<'+n.tag+attrs+'>'+''.join(serial(c) for c in n.children)+'</'+n.tag+'>'
def classes(n):return n.attrs.get('class','').split()
def walk(n,fn,anc=()):
 fn(n,anc)
 for c in list(n.children):
  if isinstance(c,Node):walk(c,fn,anc+(n,))
def plain(n):return ' '.join(n.text().split())

def svg(title,body,w=960,h=320):
 return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>{ESC(title)}</title><rect width="{w}" height="{h}" fill="#eeece6"/><style>text{{font-family:Arial,sans-serif;fill:#292929}}.small{{font-size:18px}}.label{{font-size:22px;font-weight:600}}.muted{{fill:#625c54}}.line{{fill:none;stroke:#7c7770;stroke-width:3}}.red{{stroke:#963b35}}</style>{body}</svg>'
def box(x,y,w,h,title,subtitle='',fill='#fff'):
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="#c9c3b9"/><text x="{x+w/2}" y="{y+35}" text-anchor="middle" class="label">{ESC(title)}</text>'+ (f'<text x="{x+w/2}" y="{y+65}" text-anchor="middle" class="small">{ESC(subtitle)}</text>' if subtitle else '')

def create_assets(R):
 assets=[]
 photos=[
 ('apple','Sprinno','https://commons.wikimedia.org/wiki/File:Red_apple_on_white_background.jpg','https://upload.wikimedia.org/wikipedia/commons/1/1f/Red_apple_on_white_background.jpg','CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/',281,303,'Literal object photograph. Red comparison shown only in Full novel mode.','No attribution required by CC0; creator credited voluntarily.'),
 ('snow-valley','Goldmann Jo, U.S. Fish and Wildlife Service','https://commons.wikimedia.org/wiki/File:Valley_in_winter_snowy_winter_landscape.jpg','https://upload.wikimedia.org/wikipedia/commons/a/a8/Valley_in_winter_snowy_winter_landscape.jpg','Public-domain dedication by the author','https://commons.wikimedia.org/wiki/File:Valley_in_winter_snowy_winter_landscape.jpg#Licensing',1280,836,'Illustrative landscape, not the novel’s actual community or a confirmed destination.','Source states unrestricted reuse; credit supplied to the named creator.'),
 ('library-shelves','Scntst0009','https://commons.wikimedia.org/wiki/File:Library_shelves_iitd.jpg','https://upload.wikimedia.org/wikipedia/commons/a/ac/Library_shelves_iitd.jpg','CC0 1.0','https://creativecommons.org/publicdomain/zero/1.0/',1280,736,'Real shelves at IIT Delhi’s Central Library; illustration of stored knowledge, not the Annex.','No attribution required by CC0; creator credited voluntarily.')]
 for id,creator,url,original,license,licenseurl,w,h,meaning,attr in photos:
  assets.append(dict(id=id,filename='images/'+id+'.webp',creator=creator,source_url=url,original_url=original,licence=license,licence_url=licenseurl,width=w,height=h,type='photograph',meaning=meaning,attribution=attr,modifications='Resized with aspect ratio preserved; WebP compression. Apple comparison applies a labelled CSS grayscale filter.',source_page_inspected=True,actual_image_inspected=True,checked='2026-11-02'))
 shapes={}
 houses=''
 for row in range(2):
  for col in range(7):
   x=45+col*128;y=35+row*126
   houses+=f'<path d="M{x} {y+40}l48-34 48 34v69h-96z" fill="'+('#ddd8d0' if row==0 else '#d3d0c8')+'" stroke="#9d978e" stroke-width="2"/>'
   houses+=f'<rect x="{x+39}" y="{y+68}" width="20" height="41" fill="#8e8b85"/><rect x="{x+12}" y="{y+49}" width="19" height="22" fill="#f8f6f0"/><rect x="{x+64}" y="{y+49}" width="19" height="22" fill="#f8f6f0"/>'
 shapes['uniform-community']=('Uniform buildings as a conceptual illustration',houses,960,320)
 shapes['choice-paths']=('One path branches into several possible choices','<path d="M60 160h300m0 0Q520 160 590 65h280M360 160h510M360 160Q520 160 590 255h280" class="line"/><circle cx="360" cy="160" r="12" fill="#963b35"/><text x="65" y="130" class="label">A decision</text><text x="680" y="45" class="small">Possibility</text><text x="680" y="140" class="small">Possibility</text><text x="680" y="295" class="small">Possibility</text>',960,320)
 shapes['human-connection']=('Care connects people with different needs','<circle cx="330" cy="155" r="96" fill="#d6c4af"/><circle cx="625" cy="155" r="64" fill="#e7d7c2"/><path d="M410 155h160" fill="none" stroke="#963b35" stroke-width="6"/><circle cx="490" cy="155" r="10" fill="#963b35"/><text x="330" y="164" text-anchor="middle" class="label">Care</text><text x="625" y="164" text-anchor="middle" class="label">Need</text><text x="480" y="292" text-anchor="middle" class="small">Connection brings responsibility.</text>',960,320)
 shapes['language-lenses']=('Test a label against an event before making a judgement',box(45,105,235,95,'A label','What is it called?')+'<path d="M280 154h70" class="line"/>'+box(360,105,235,95,'An event','What happens?')+'<path d="M595 154h70" class="line red"/>'+box(675,105,235,95,'A judgement','Does the label fit?'),960,320)
 shapes['responsibility-route']=('Understanding, judgement and action develop together','<path d="M130 240L390 170 650 105 855 55" class="line"/>'+''.join(f'<circle cx="{x}" cy="{y}" r="12" fill="#963b35"/><text x="{x}" y="{y+44}" text-anchor="middle" class="label">{t}</text>' for x,y,t in [(130,240,'Notice'),(390,170,'Question'),(650,105,'Judge'),(855,55,'Act')]),960,320)
 shapes['evidence-chain']=('Claim, evidence, explanation and theme form a chain of reasoning',''.join(box(25+i*235,105,210,100,t,s) for i,(t,s) in enumerate([('Claim','Your argument'),('Evidence','A precise detail'),('Explanation','How it works'),('Theme','Why it matters')]))+'<path d="M235 154h25m210 0h25m210 0h25" class="line red"/>',960,320)
 shapes['conflict-consequence']=('A Chapter 21 example connects pressure, choice, consequence, and theme',''.join(box(25+i*235,105,210,100,t,sub) for i,(t,sub) in enumerate([('Pressure','Gabriel is in danger'),('Choice','Jonas leaves early'),('Consequence','Escape brings risk'),('Theme','Care demands action')]))+'<path d="M235 154h25m210 0h25m210 0h25" class="line red"/>',960,320)
 shapes['jonas-development']=('Five phases of Jonas’s development across the novel','<path d="M70 145h820" class="line"/>'+''.join(f'<circle cx="{x}" cy="145" r="10" fill="#963b35"/><text x="{x}" y="105" text-anchor="middle" class="label">{title}</text><text x="{x}" y="195" text-anchor="middle" class="small">{ch}</text>' for x,title,ch in [(80,'Trust','Chs. 1–5'),(280,'Learning','Chs. 8–12'),(480,'Questioning','Chs. 13–17'),(680,'Judgement','Chs. 19–21'),(875,'Care','Chs. 22–23')]),960,280)
 shapes['revision-cycle']=('Revision returns from feedback to a stronger draft',''.join(box(40+i*305,105,265,95,t,s) for i,(t,s) in enumerate([('Notice a strength','Keep what works'),('Choose a priority','Name one problem'),('Make a change','Test the next draft')]))+'<path d="M150 220v55h660v-55" class="line red"/>',960,320)
 # The plot stages are an interpretation, not a claim that all action descends smoothly.
 shapes['plot-structure']=('One interpretation of the plot: revelation in Chapter 19, followed by renewed danger','<path d="M65 245L245 215 480 95 675 160 895 205" class="line"/>'+''.join(f'<circle cx="{x}" cy="{y}" r="9" fill="#963b35"/><text x="{x}" y="{ty}" text-anchor="middle" class="small">{t}</text><text x="{x}" y="{ty+25}" text-anchor="middle" class="small">{ch}</text>' for x,y,ty,t,ch in [(95,240,290,'Exposition','Chs. 1–8'),(280,194,240,'Rising action','Chs. 9–18'),(480,95,25,'Revelation','Ch. 19'),(690,166,210,'Renewed danger','Chs. 20–22'),(865,200,265,'Open ending','Ch. 23')]),960,330)
 shapes['relationships']=('Relationships around Jonas with different kinds of influence','<path d="M480 230L185 85M480 230L775 85M480 230L175 390M480 230L775 390" class="line"/>'+box(345,185,270,105,'Jonas','Learns and chooses', '#e8d5cd')+box(50,30,270,95,'The Giver','Memory and guidance')+box(640,30,270,95,'Gabriel','Need and protection')+box(40,345,290,95,'Parents and Lily','Family and expectations')+box(625,345,310,95,'Asher and Fiona','Friendship and difference'),960,480)
 labels=[('Freedom','choice'),('Memory','experience'),('Individuality','difference'),('Love','connection'),('Language','understanding'),('Responsibility','action')]
 circles=''
 for i,(title,sub) in enumerate(labels):
  x=35+(i%3)*310;y=32+(i//3)*153
  circles+=box(x,y,270,115,title,sub, '#f9f6ef')
 shapes['theme-connections']=('Six related investigations, linked by questions rather than fixed answers',circles,960,340)
 for id,(title,body,w,h) in shapes.items():
  path=R/'images'/(id+'.svg');path.write_text(svg(title,body,w,h))
  assets.append(dict(id=id,filename='images/'+id+'.svg',creator='HuskyDaddy teaching materials, created for this course',source_url=None,licence='Original course visual; no third-party imagery',licence_url=None,width=w,height=h,type='original conceptual diagram',meaning=title,attribution='Original HuskyDaddy teaching diagram.',spoilers='Full novel' if id in ['plot-structure','relationships','conflict-consequence','jonas-development'] else 'No event spoilers',checked='2026-11-02'))
 (R/'asset-manifest.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
 return {a['id']:a for a in assets}

FOCUS={
'index':('Read, notice, explain.','Follow one chapter at a time. Then use specific details to build an argument about the novel.'),
'chapters':('Keep events and interpretation separate.','Read the summary to check events; use the analysis to ask how those events create meaning.'),
'plot':('A turning point depends on the conflict you trace.','Compare a revelation, a decisive choice, and a physical crisis before defending your plot map.'),
'setting':('A setting does more than provide scenery.','Study how the community’s spaces, rules, and routines shape what people can choose.'),
'characters':('A trait needs evidence.','Compare what people say about a character with the choices that character makes.'),
'conflicts':('Follow pressure through a choice and its cost.','A disagreement matters because it changes a relationship, an action, or a way of thinking.'),
'themes':('A topic names; a theme statement argues.','Build a complete claim that explains a pattern and leaves room for a complication.'),
'freedom':('Protection can have a cost.','Test what people gain from safety and what they lose when decisions are made for them.'),
'memory':('Knowledge changes judgement.','Trace how experience can deepen care while placing painful demands on a person.'),
'individuality':('Noticing difference is only a beginning.','Ask how a person learns to name a new experience—and what makes sharing it difficult.'),
'love':('Care becomes meaningful through action.','Compare a comforting routine with the responsibility of responding to someone’s particular need.'),
'language':('Test a word against what actually happens.','Careful language can clarify experience, but an accepted label can also prevent questioning.'),
'responsibility':('Growing up includes learning to judge.','Ask how understanding changes a person’s obligations, even when the outcome remains uncertain.'),
'symbols':('Trace a pattern before assigning a meaning.','Explain what changes across appearances instead of translating an object into one fixed answer.'),
 'techniques':('A term matters when it explains an effect.','Identify a method, locate an example, and show what it makes a reader notice or reconsider.'),
'writing':('Analysis explains a relationship.','Move from a precise detail to a claim about how or why it matters.'),
'assessment':('Choose a revision you can carry out.','Use evidence from your draft to identify a strength, a priority, and one specific next step.'),
'sources':('Know what your evidence can establish.','Use the novel for textual evidence and distinguish verified events from interpretations.')}
GLOSSARY={
'plot':[('Climax','A decisive turning point in the main conflict.'),('Ambiguity','More than one interpretation remains supported by the evidence.')],
'setting':[('Institution','An organized system with roles and rules.'),('Sameness','The community’s organized control of differences in experience and life.')],
'characters':[('Infer','Reach a reasoned conclusion from evidence.'),('Foil','A character whose differences help reveal another character.')],
'conflicts':[('Internal conflict','Competing needs or values within a character.'),('Consequence','A result of a choice or event.')],
'freedom':[('Agency','The ability to make choices and act on them.'),('Consent','Informed agreement, rather than a decision made for someone.')],
'memory':[('Empathy','An effort to understand another person’s experience.'),('Collective','Shared by a group rather than held by only one person.')],
'individuality':[('Perception','How someone notices and understands experience.'),('Conformity','Adjusting to a shared standard or expectation.')],
'love':[('Attachment','A lasting emotional bond.'),('Juxtaposition','Placing things beside each other so a comparison becomes noticeable.')],
'language':[('Diction','A writer’s choice of words.'),('Euphemism','A mild expression used in place of a troubling reality.')],
'responsibility':[('Ethical','Concerned with judging actions and their effects on others.'),('Qualification','A limit or complication that makes a claim more accurate.')],
'symbols':[('Motif','An element that recurs and develops meaning.'),('Symbol','An object, image, or action that means more than its literal role.')],
'writing':[('Paraphrase','An accurate restatement using your own wording and sentence structure.'),('Interpretation','A reasoned explanation of what evidence may suggest.')],
'assessment':[('Proficient','Meets the expected Grade 8 learning for this task.'),('Extending','Shows greater depth, nuance, and purposeful control.')],
 'techniques':[('Technique','A method a writer uses to shape meaning.'),('Effect','What a choice makes a reader notice, feel, infer, or reconsider.')],
 'themes':[('Topic','A subject, such as memory or freedom.'),('Theme statement','A complete argument about what a text suggests about a topic.')],
 'chapters':[('Summary','A concise account of what happens.'),('Analysis','An explanation of how details work and why they matter.')],
 'sources':[('Primary source','The work being studied: here, the novel.'),('Secondary source','Someone else’s explanation or interpretation of that work.')],
 'index':[('Evidence','A specific detail that supports or challenges a claim.'),('Claim','An argument that can be tested with evidence.')]
}

def improve(g):
 R=g['R'];assets=create_assets(R)
 # A separate credits page uses the same shared shell; existing study order stays intact.
 g['pages'].append(('image-credits','Image Credits'));g['titles']['image-credits']='Image Credits'
 rows=[]
 for a in assets.values():
  source='<a href="'+a['source_url']+'">Source page</a>' if a['source_url'] else 'Created for this course'
  licence='<a href="'+a['licence_url']+'">'+a['licence']+'</a>' if a['licence_url'] else a['licence']
  rows.append([a['id'],a['creator'],source,licence,a['attribution']])
 body=g['section']('Images are illustrations, not evidence of a fictional place',g['p']('The photographs below show real objects and places. They help introduce an idea; they do not depict the novel’s actual community, characters, or a confirmed destination. Original diagrams organize interpretations and reasoning. Novel events—not actors, photographs, or film scenes—remain the evidence for analysis.'))
 body+=g['section']('Creators and permission',g['p']('Each entry identifies the asset, creator, and reuse basis. Credits also appear beside the image in the study pages.'))
 for a,row in zip(assets.values(),rows):
  body+=g['section'](a['id'],g['p']('<strong>Creator:</strong> '+a['creator'])+g['p'](row[2]+' · '+row[3])+g['p'](a['meaning']+' '+a['attribution']),id='asset-'+a['id'])
 body+=g['section']('Changes made to photographs',g['p']('Images are stored locally as compressed WebP files. Snow and library photographs were reduced in size without changing their aspect ratios. The apple remains at its small original resolution; the colour comparison applies a clearly labelled CSS grayscale filter. No image was cropped to imply an event or remove a credit.'))
 body+=g['section']('Spoilers and adaptations',g['p']('The apple comparison, snow illustration, plot stages, and character relationships appear only in Full novel analysis. The chapter reading guide uses a neutral library photograph; it does not reveal later events through captions or alt text. No film posters or stills are reproduced. Their public availability was not treated as permission, and no film-only detail has been added to the teaching content.'))
 body+=g['section']('Maintain these records',g['p']('The asset-manifest.json file records filenames, creators, source URLs, licence or original-work basis, image dimensions, modifications, and the inspection date. Image permission statements were checked on 2 November 2026. CC0 assets require no attribution; credits are supplied voluntarily. The winter image’s author dedication is recorded on its Commons file page.'))
 g['shell']('image-credits',body,'Know what each visual represents and where it came from.')

 def figure(asset_id,caption,alt,kind='diagram',opening=False):
  a=assets[asset_id]
  image=el('img',{'src':a['filename'],'alt':alt,'width':str(a['width']),'height':str(a['height']),'decoding':'async','loading':'eager' if opening else 'lazy'})
  credit='Photo: '+a['creator'] if a['type']=='photograph' else 'Original HuskyDaddy diagram'
  return el('figure',{'class':'teaching-figure '+kind,'data-asset':asset_id},image,el('figcaption',{},el('span',{'class':'visual-kind'},'Illustrative photograph' if a['type']=='photograph' else 'Original conceptual diagram'),el('span',{},caption),el('a',{'href':'image-credits.html#asset-'+asset_id,'class':'figure-credit'},credit+' · credits')))

 for path in R.glob('*.html'):
  dom=DOM(path.read_text()).root;lesson=dom.find(lambda n:n.attrs.get('id')=='lesson');slug=path.stem
  if not lesson:continue
  # Add visual CSS/JS through explicit local assets, preserving existing script order.
  head=dom.find(lambda n:n.tag=='head');head.children+=[el('link',{'rel':'stylesheet','href':'reading.css'}),el('script',{'src':'reading.js','defer':None})]
  footer=dom.find(lambda n:n.tag=='footer');footer.children.append(el('p',{},el('a',{'href':'image-credits.html'},'Image credits and visual meanings')))
  # Paragraph division changes no words. Models deliberately remain single analytical paragraphs.
  splits=[0]
  def split_prose(n,anc):
   if n.tag!='p' or any(isinstance(x,Node) for x in n.children):return
   if any('model-paragraph' in classes(a) or a.attrs.get('id') in ['workshop-model','workshop-compare','model-overview'] for a in anc):return
   if any(a.tag=='section' and next(a.each('h2'),None) and next(a.each('h2')).text() in ['Original flawed paragraph','Improved version'] for a in anc):return
   text=n.text();sent=re.split(r'(?<=[.!?])\s+(?=[A-Z“])',text)
   if len(sent)<5 or len(text.split())<60:return
   chunks=[]
   while len(sent)>4:chunks.append(' '.join(sent[:3]));sent=sent[3:]
   chunks.append(' '.join(sent))
   parent=anc[-1];idx=parent.children.index(n);parent.children[idx:idx+1]=[el('p',dict(n.attrs),x) for x in chunks];splits[0]+=1
  walk(lesson,split_prose)
  if slug in FOCUS:
   idea,how=FOCUS[slug]
   focus=el('section',{'class':'learning-focus'},el('p',{'class':'focus-label'},'KEY IDEA'),el('p',{'class':'focus-idea'},idea),el('p',{},how))
   lesson.children.insert(0,focus)
   terms=GLOSSARY.get(slug,[])
   if terms:
    glossary=el('details',{'class':'word-guide'},el('summary',{},'Words to know before you read'),el('dl',{},*[child for term,meaning in terms for child in [el('dt',{},term),el('dd',{},meaning)]]))
    lesson.children.insert(1,glossary)
  full=lesson.find(lambda n:'full-content' in classes(n))
  # Purposeful opening visuals; none is treated as a novel illustration.
  if slug=='index':lesson.children.insert(2,figure('uniform-community','Repeated forms suggest conformity. This invented scene is not a map of the novel’s community.','Two rows of similar grayscale buildings.','opening',True))
  if slug=='chapters':
   first=next((i for i,n in enumerate(lesson.children) if isinstance(n,Node) and n.tag=='section' and 'panel' in classes(n)),1)
   lesson.children.insert(first+1,figure('library-shelves','These are real shelves at IIT Delhi’s Central Library. Use the photograph to think about reading and access to knowledge, not as a picture of the Annex.','An aisle between full bookshelves leads toward a window and chairs.','photo compact'))
  mapping={
   'conflicts':('conflict-consequence','A Chapter 21 example: protecting Gabriel removes an immediate danger and creates new risks. The theme is an interpretation of the choice, not a quotation.','Pressure: Gabriel is in danger. Choice: Jonas leaves early. Consequence: escape brings risk. Theme: care demands action.'),
   'setting':('uniform-community','An illustration of conformity: similar buildings suggest organized routines, not the community’s literal architecture.','Rows of similar houses drawn in neutral colours.'),
   'freedom':('choice-paths','A conceptual model: having alternatives is different from knowing which choice is wise.','One path reaches a decision point and branches into three possibilities.'),
   'memory':('snow-valley','A real winter landscape illustrates an environment Jonas learns to imagine. It is not a verified location in the novel or proof of its ending.','A broad snow-covered valley surrounded by ridges. No people or sled appear.'),
   'love':('human-connection','Two unequal shapes stand for different needs. The link suggests care as a responsibility, not a portrait of any character.','Two circles labelled Care and Need are joined by a red line.'),
   'language':('language-lenses','Test an accepted label against an event, then explain your judgement with evidence.','A sequence moves from A label to An event to A judgement.'),
   'responsibility':('responsibility-route','A conceptual route from noticing to acting. Development may involve hesitation and revision rather than a straight climb.','A rising path connects Notice, Question, Judge, and Act.'),
   'writing':('evidence-chain','An argument connects these moves. They are functions, not a rule that every paragraph must have four sentences.','Four linked boxes name Claim, Evidence, Explanation, and Theme.'),
   'assessment':('revision-cycle','Use a strength and a priority to make a specific change, then read the draft again.','Three boxes connect noticing a strength, choosing a priority, and making a change.'),
   'themes':('theme-connections','The six investigations overlap. These labels are topics, not complete theme statements.','Six topic cards pair Freedom with choice, Memory with experience, Individuality with difference, Love with connection, Language with understanding, and Responsibility with action.')}
  if slug in mapping:
   id,cap,alt=mapping[slug];fig=figure(id,cap,alt,'photo' if id=='snow-valley' else 'diagram',False)
   target=full if full is not None and slug not in ['writing','assessment','themes'] else lesson
   target.children.insert(0 if target is full else 2,fig)
  if slug in ['individuality','symbols'] and full:
   a=assets['apple']
   pair=el('figure',{'class':'teaching-figure apple-pair','data-asset':'apple'},el('div',{'class':'apple-views'},el('div',{},el('img',{'src':a['filename'],'alt':'The same apple photograph displayed in grayscale.','width':'281','height':'303','class':'grayscale','loading':'lazy','decoding':'async'}),el('span',{},'Grayscale rendering')),el('div',{},el('img',{'src':a['filename'],'alt':'The apple photograph in its original red colour.','width':'281','height':'303','loading':'lazy','decoding':'async'}),el('span',{},'Original colour'))),el('figcaption',{},el('span',{'class':'visual-kind'},'Literal object photograph · illustrative comparison'),el('span',{},'The same photograph is shown with and without a grayscale filter. This teaching comparison does not reproduce the exact appearance of Jonas’s perception. The Chapter 12 explanation belongs to full-novel analysis.'),el('a',{'href':'image-credits.html#asset-apple','class':'figure-credit'},'Photo: Sprinno · CC0 · credits')))
   full.children.insert(0,pair)
  # A precise plot diagram replaces the earlier unlabeled SVG; the complete stage text stays visible.
  if slug=='plot' and full:
   def plot(n,anc):
    if n.tag=='svg' and 'plot' in classes(n):
     parent=anc[-1];i=parent.children.index(n);parent.children[i]=figure('plot-structure','One defensible interpretation uses Chapter 19 as the climax. The renewed survival danger means the rest does not descend in one simple curve.','Plot stages: exposition in Chapters 1–8, rising action in 9–18, revelation in 19, renewed danger in 20–22, and an open ending in 23.','precision')
    if n.tag=='details' and not any('teacher-content' in classes(a) for a in anc):
     summary=next((c for c in n.children if isinstance(c,Node) and c.tag=='summary'),None)
     if summary and re.match(r'[1-5] · ',summary.text()):n.tag='article';n.attrs['class']='plot-stage';summary.tag='h3'
   walk(full,plot)
  if slug=='characters' and full:
   mapnode=full.find(lambda n:'relationship-map' in classes(n))
   if mapnode:
    parent=full.find(lambda n:mapnode in n.children);i=parent.children.index(mapnode)
    parent.children.insert(i,figure('relationships','A selected map of relationships. The profiles and text map also cover Lily, the Chief Elder, and other important connections.','Jonas connects with the Giver through guidance, Gabriel through care, family through expectations, and Asher and Fiona through friendship.','precision'))
    textmap=el('details',{'class':'depth'},el('summary',{},'Look more closely: read the relationships as text'),mapnode)
    parent.children[parent.children.index(mapnode)]=textmap
  if slug=='characters' and full:
   timeline=full.find(lambda n:'timeline' in classes(n))
   if timeline:
    parent=full.find(lambda n:timeline in n.children);parent.children.insert(parent.children.index(timeline),figure('jonas-development','A selected development timeline. The list below explains each phase; these stages overlap rather than replacing one another completely.','Five phases: trust in Chapters 1–5, learning in 8–12, questioning in 13–17, judgement in 19–21, and continued care in 22–23.','precision'))
  # Keep the qualification visible as a heading, with optional depth deliberately labelled.
  for section in list(lesson.each('section')):
   heading=next(section.each('h2'),None)
   if heading and heading.text()=='A complication worth answering':
    content=[c for c in section.children if c is not heading]
    section.children=[heading,el('details',{'class':'depth'},el('summary',{},'Look more closely: test the argument'),*content)]
  # Per-chapter scan links point to available content only; the original chapter controls still govern it.
  for chapter in lesson.each('details'):
   if 'chapter' not in classes(chapter):continue
   id=chapter.attrs['id'];targets=[]
   summary=chapter.find(lambda n:'chapter-summary' in classes(n))
   analysis=chapter.find(lambda n:'analysis-box' in classes(n))
   question=next((n for n in chapter.each('h3') if n.text()=='Reading questions'),None)
   for node,suffix,label in [(summary,'summary','Summary'),(analysis,'analysis','Analysis'),(question,'respond','Questions & writing')]:
    if node:node.attrs['id']=id+'-'+suffix;targets.append(el('a',{'href':'#'+id+'-'+suffix},label))
   chapter.children.insert(1,el('nav',{'class':'chapter-scan','aria-label':id+' sections'},*targets))
  # Mobile stacked tables are generated from existing cells, so there is only one canonical table to edit.
  tables=list(lesson.each('div'))
  for wrapper in tables:
   if 'table-wrap' not in classes(wrapper):continue
   if any(wrapper is n for n in (lesson.find(lambda n:n.attrs.get('id')=='reading-log'),)):continue
   table=wrapper.find(lambda n:n.tag=='table')
   if not table:continue
   # The blank reading log remains a table in every mode.
   headers=[plain(n) for n in next(table.each('thead')).each('th')]
   if headers==['Chapter','Main event','Character insight','Question','Theme']:continue
   body=table.find(lambda n:n.tag=='tbody');rows=[n for n in body.children if isinstance(n,Node) and n.tag=='tr']
   cards=el('div',{'class':'table-cards','hidden':None})
   for row in rows:
    cells=[n for n in row.children if isinstance(n,Node) and n.tag in ['td','th']]
    if not cells:continue
    card=el('article',{'class':'table-card'},el('h3',{},plain(cells[0])))
    dl=el('dl')
    for i,cell in enumerate(cells[1:],1):dl.children.extend([el('dt',{},headers[i] if i<len(headers) else 'Detail'),el('dd',{},*fragment(''.join(serial(c) for c in cell.children)))])
    card.children.append(dl);cards.children.append(card)
   host=el('div',{'class':'study-table'},el('div',{'class':'table-tools'},el('p',{},'Read across to compare; use stacked rows for a closer view.'),el('button',{'type':'button','class':'table-view-toggle','aria-pressed':'false'},'Use stacked rows')),wrapper,cards)
   parent=lesson.find(lambda n:wrapper in n.children)
   if parent:parent.children[parent.children.index(wrapper)]=host
  # In-page navigation uses heading IDs; reading.js omits spoiler-hidden destinations.
  headings=[]
  for i,h in enumerate(lesson.each('h2'),1):
   h.attrs.setdefault('id','section-'+str(i));headings.append(h)
  if slug=='image-credits':
   # Source rows get stable credit anchors in both the table and its phone cards.
   for card in lesson.each('article'):
    if 'table-card' in classes(card):
     h=next(card.each('h3'),None)
     if h:card.attrs['id']='asset-'+h.text()
   # Anchor on the table row too is unnecessary; the credit link opens the source page and row text is searchable.
  if len(headings)>=4 and slug!='chapters':
   toc=el('details',{'class':'page-toc'},el('summary',{},'On this page'),el('nav',{'aria-label':'On this page'},*[el('a',{'href':'#'+h.attrs['id'],'data-toc-target':h.attrs['id']},h.text()) for h in headings]))
   lesson.children.insert(2,toc)
  # A permanent hub link makes the course entry discoverable at the bottom of every page.
  pager=dom.find(lambda n:'pager' in classes(n))
  if pager:pager.children.insert(1,el('a',{'href':'index.html','class':'hub-link'},'Study hub'))
  path.write_text('<!doctype html>\n'+serial(dom)+'\n')
