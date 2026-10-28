"""Build the deployable site using only the Python standard library."""
from pathlib import Path
import shutil

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'_site'
if OUT.exists():shutil.rmtree(OUT)
OUT.mkdir()
for name in ['index.html','.nojekyll','assets','experiments']:
 source=ROOT/name;target=OUT/name
 if source.is_dir():shutil.copytree(source,target)
 else:shutil.copy2(source,target)
print('Built _site: static HTML, styles, scripts, media and the playable experiment.')
