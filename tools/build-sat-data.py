"""Regenerate browser data after editing per-test JSON (no build dependencies)."""
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1]/'pages/SAT/data'
for folder in sorted(path.parent for path in root.glob('*/metadata.json')):
 metadata=json.loads((folder/'metadata.json').read_text())
 metadata['questions']=json.loads((folder/'questions.json').read_text())
 metadata['answerKey']=json.loads((folder/'answer-key.json').read_text())['answers']
 (root/(metadata['id']+'.js')).write_text('window.SAT_TESTS = window.SAT_TESTS || {};\nwindow.SAT_TESTS['+json.dumps(metadata['id'])+'] = '+json.dumps(metadata,ensure_ascii=False,indent=2)+';\n')
 print('Built',metadata['id'])
