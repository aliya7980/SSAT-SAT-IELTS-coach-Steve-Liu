"""Build a static-only Pages artifact. Never publish backend source or private runtime files."""
from pathlib import Path
import shutil,subprocess,sys
root=Path(__file__).resolve().parents[1];out=root/'.site-public'
subprocess.run([sys.executable,str(root/'tools/build-sat-data.py')],check=True)
if out.exists():shutil.rmtree(out)
out.mkdir()
for p in root.iterdir():
 if p.is_file() and (p.suffix.lower() in {'.html','.css','.js','.ico','.png','.svg','.webmanifest'} or p.name in {'CNAME','robots.txt'}):shutil.copy2(p,out/p.name)
for name in ['pages','assets','ghost']:
 if (root/name).is_dir():shutil.copytree(root/name,out/name,ignore=shutil.ignore_patterns('.DS_Store','__pycache__','*.pyc','*.sqlite','*.sqlite-*','answer-key.json'))
(out/'.nojekyll').touch()
print('Static-only site artifact:',out)
