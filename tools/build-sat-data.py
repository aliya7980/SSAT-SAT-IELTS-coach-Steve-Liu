"""Build public question-only bundles. Answer keys belong only on the grading service."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'pages/SAT/data'
def reject_private(value):
 if isinstance(value,dict):
  for k,v in value.items():
   if k in {'answerKey','correctAnswer','explanation','answers'}:raise ValueError('Private field in public SAT data: '+k)
   reject_private(v)
 elif isinstance(value,list):
  for v in value:reject_private(v)
for folder in sorted(p.parent for p in root.glob('*/metadata.json')):
 data=json.loads((folder/'metadata.json').read_text());data['questions']=json.loads((folder/'questions.json').read_text())
 reject_private(data)
 (root/(data['id']+'.js')).write_text('window.SAT_TESTS = window.SAT_TESTS || {};\nwindow.SAT_TESTS['+json.dumps(data['id'])+'] = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
 print('Built public questions:',data['id'])
