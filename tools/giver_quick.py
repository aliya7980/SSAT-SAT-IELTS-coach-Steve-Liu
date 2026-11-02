"""Final presentation pass for the student quick-reference edition."""
import json
from giver_visuals import DOM, Node, el, fragment, serial, classes

SUMMARIES = [
'Eleven-year-old Jonas feels apprehensive about the Ceremony of Twelve. His family shares feelings at dinner, and his father worries about a struggling newchild. A pilot’s punishment introduces the community’s strict rules and the mysterious idea of release.',
'Jonas’s parents explain how the Elders observe children and choose their adult jobs. They reassure him that his assignment will suit him, but he remains uncertain about his future.',
'Father brings Gabriel home for extra care. Jonas notices that they share unusual pale eyes. He also remembers an apple briefly changing as he tossed it with Asher, hinting at an ability he cannot yet explain.',
'Jonas volunteers at the House of the Old with Asher and Fiona. While bathing Larissa, he hears about Roberto’s cheerful release ceremony, but nobody explains exactly where released people go.',
'Jonas describes a dream about wanting Fiona to bathe with him. His mother calls these feelings Stirrings and gives him daily pills to suppress them. Jonas accepts this as another normal community rule.',
'The December Ceremonies mark each age group’s new responsibilities. Children receive family placements, clothing, volunteer duties, and bicycles. Gabriel receives an extra year of nurturing, while Jonas waits for his assignment.',
'At the Ceremony of Twelve, the Chief Elder gives Jonas’s friends their jobs but skips his number. Jonas feels frightened and humiliated, wondering what he has done wrong.',
'The Chief Elder explains that Jonas has been selected as the next Receiver of Memory. The role requires intelligence, courage, integrity, wisdom, and the Capacity to See Beyond. His training will involve pain and isolation.',
'Jonas reads his unusual instructions: he may ask rude questions and lie, but must keep his training secret and cannot request release or medication for training-related pain. Permission to lie makes him question whether others also lie.',
'Jonas meets the old Receiver in the Annex, a private room filled with books. The Receiver explains that Jonas will inherit memories of the world’s past, transmitted through touch rather than ordinary lessons.',
'Jonas receives his first memories: sledding through snow, sunshine, and painful sunburn. He learns that Sameness removed snow and hills to make life predictable. The old Receiver tells Jonas to call him the Giver.',
'Jonas sees Fiona’s hair change and learns that he is beginning to perceive the colour red. The Giver explains that the community gave up colour and other differences when it adopted Sameness.',
'Jonas wants people to choose for themselves, but the Giver explains why the community fears wrong choices. Jonas cannot make Asher see red. A memory of an elephant killed by hunters teaches him grief and cruelty.',
'A sledding memory gives Jonas the agony of a broken leg. The Giver explains how painful memories provide wisdom. At home, Jonas discovers that he can transfer a calming memory to Gabriel and help him sleep.',
'The Giver asks Jonas to take a terrible memory of war. On a battlefield, Jonas gives water to a dying boy and experiences injury, suffering, and death. The Giver apologizes for sharing so much pain.',
'Happy memories introduce Jonas to birthdays, grandparents, and Christmas. He learns what love feels like, but his parents dismiss the word as imprecise. Jonas secretly stops taking his Stirrings pills.',
'On an unscheduled holiday, Jonas sees his friends playing a war game. His memories make the game unbearable, but Asher cannot understand his reaction. Jonas realizes how deeply his new feelings separate him from his friends.',
'The Giver tells Jonas about Rosemary, the previous Receiver-in-training. Overwhelmed by memories of loss and loneliness, she requested release. Her memories returned to the community, leaving its people distressed and unprepared.',
'Jonas watches a recording of his father releasing the smaller of two newborn twins. He sees his father kill the baby with an injection and discard the body. He finally understands that release means death, including Rosemary’s release.',
'Jonas refuses to return home. He and the Giver plan his escape so that his memories will return to the community. The Giver will stay to help people cope and reveals that Rosemary was his daughter.',
'When Jonas learns that Gabriel will be released the next morning, he escapes early with the baby on his father’s bicycle. They travel at night and hide from search planes, using memories of cold to reduce their body heat.',
'Beyond the community, the landscape becomes rough and unfamiliar. Jonas hurts his ankle, and food runs short. Although he fears starvation, he knows staying would have meant Gabriel’s death.',
'Weak with hunger and cold, Jonas carries Gabriel up a snowy hill and finds a sled. They descend toward lights and music. The novel leaves their immediate fate uncertain: the scene can suggest rescue, a vision, or death.'
]

def apply(R):
 records=json.loads((R/'chapters.json').read_text())
 for c,s in zip(records,SUMMARIES): c['summary']=s
 (R/'chapters.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
 for path in R.glob('*.html'):
  root=DOM(path.read_text()).root
  def clean(n):
   kept=[]
   for child in n.children:
    if not isinstance(child,Node): kept.append(child); continue
    cs=set(classes(child)); tag=child.tag
    if tag in {'script','img','picture','figure','svg','noscript','button','textarea','select','input','footer'} or cs & {'toolbar','book-mark','page-toc','learning-focus','word-guide','response','teacher-content','spoiler-gate','tab-list','table-cards','print-controls'} or child.attrs.get('role')=='tablist' or child.attrs.get('id')=='mode-note': continue
    if tag=='link' and child.attrs.get('href')=='reading.css': continue
    child.attrs.pop('hidden',None)
    for key in ['role','aria-labelledby','tabindex']:
     if child.attrs.get('role')=='tabpanel' or key=='tabindex': child.attrs.pop(key,None)
    clean(child);kept.append(child)
   n.children=kept
  clean(root)
  head=next(root.each('head'));head.children.append(el('link',{'rel':'stylesheet','href':'quick.css'}))
  lesson=root.find(lambda n:n.attrs.get('id')=='lesson')
  body=next(root.each('body'))
  if body.attrs.get('data-page') in {'index','chapters'}:
   ishome=body.attrs.get('data-page')=='index'
   heading=next(root.each('h1'));heading.children=['The Giver: Quick Study Guide' if ishome else 'Chapter Summaries']
   lede=root.find(lambda n:'lede' in classes(n));lede.children=['Short summaries and essential notes. Full story spoilers included.']
   links='<nav class="quick-links" aria-label="Quick reference"><a href="chapters.html">Chapter summaries</a><a href="characters.html">Characters</a><a href="themes.html">Themes</a><a href="plot.html">Plot</a><a href="symbols.html">Symbols</a></nav>'
   sections=links
   if ishome:
    sections+='<section><h2>The story in one minute</h2><p>Jonas grows up in a community that removes choice, strong feelings, and memories to keep life orderly. Selected as Receiver of Memory, he learns about colour, love, suffering, and death. When he discovers that “release” means killing, he rejects the system and escapes with Gabriel, a baby marked for death. The final sled ride offers hope but leaves their immediate fate uncertain.</p><p><a href="chapters.html">Read all 23 short chapter summaries →</a></p></section>'
   else:
    sections+='<nav class="chapter-menu" aria-label="Jump to chapter">'+''.join(f'<a href="#chapter-{i}">{i}</a>' for i in range(1,24))+'</nav>'
    for title,lo,hi in [('Part 1: The Community and Rules',1,6),('Part 2: The Selection and Memories',7,16),('Part 3: Rebellion and Escape',17,23)]:
     sections+=f'<section><h2>{title}</h2>'+''.join(f'<article id="chapter-{i}"><h3>Chapter {i}</h3><p>{SUMMARIES[i-1]}</p></article>' for i in range(lo,hi+1))+'</section>'
   lesson.children=fragment(sections)
  # A compact menu replaces the permanent sidebar.
  menu=root.find(lambda n:'course-menu' in classes(n))
  if menu:menu.attrs.pop('open',None)
  path.write_text('<!doctype html>\n'+serial(root).rstrip()+'\n')

if __name__=='__main__':
 from pathlib import Path
 apply(Path(__file__).resolve().parents[1]/'pages/READINGS/the-giver')
