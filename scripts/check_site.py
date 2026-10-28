"""Check local references, deployable file sizes and JavaScript syntax."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
import json,re,shutil,subprocess,sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]
def check_ref(raw,source):
 if not raw or raw.startswith(('#','data:','blob:','mailto:','tel:','javascript:','about:')):return
 parsed=urlsplit(raw)
 if parsed.scheme or parsed.netloc:return
 path=unquote(parsed.path)
 if not path:return
 if path.startswith('/'):errors.append(f'{source.relative_to(ROOT)}: root-relative URL breaks project Pages: {raw}');return
 target=(source.parent/path).resolve()
 if not target.is_relative_to(ROOT.resolve()) or not target.exists():errors.append(f'{source.relative_to(ROOT)}: missing local target {raw}')
class References(HTMLParser):
 def __init__(self,source):super().__init__();self.source=source
 def handle_starttag(self,tag,attrs):
  for key,value in attrs:
   if key in ('src','href','poster'):check_ref(value,self.source)
for name in ['index.html','experiments/fall-into-me/index.html','experiments/fall-into-me/assets/game.html']:
 p=ROOT/name;parser=References(p);parser.feed(p.read_text())
for p in (ROOT/'assets/css').glob('*.css'):
 for match in re.finditer(r'url\(\s*[\"\']?([^\)\"\']+)',p.read_text()):check_ref(match[1],p)
manifest=json.loads((ROOT/'ASSET_MANIFEST.json').read_text())
for name,info in manifest.items():
 p=ROOT/name
 if not p.is_file() or p.stat().st_size!=info['bytes']:errors.append('Missing or changed media: '+name)
frames=list((ROOT/'experiments/fall-into-me/assets/frames').glob('f*.webp'))
if len(frames)!=240:errors.append('Fall Into Me must contain 240 frame assets.')
files=[p for base in ['assets','experiments'] for p in (ROOT/base).rglob('*') if p.is_file()]
for p in files:
 if p.stat().st_size>=25*1024*1024:errors.append('File exceeds 25 MiB: '+str(p.relative_to(ROOT)))
node=shutil.which('node')
if node:
 for p in [p for p in files if p.suffix=='.js']:
  result=subprocess.run([node,'--check',str(p)],capture_output=True,text=True)
  if result.returncode:errors.append(result.stderr)
 # Check scripts retained inside the experiment HTML documents too.
 import tempfile
 for name in ['experiments/fall-into-me/index.html','experiments/fall-into-me/assets/game.html']:
  for script in re.findall(r'<script\b[^>]*>([\s\S]*?)</script>',(ROOT/name).read_text()):
   with tempfile.NamedTemporaryFile(mode='w',suffix='.js') as temp:
    temp.write(script);temp.flush();result=subprocess.run([node,'--check',temp.name],capture_output=True,text=True)
    if result.returncode:errors.append(result.stderr)
else:print('Node is unavailable: skipped JavaScript syntax checks.')
if errors:
 print('\n'.join(errors));sys.exit(1)
print(f'PASS: local references, {len(manifest)} media assets, 240 experiment frames, file sizes'+(' and JavaScript syntax.' if node else '.'))
