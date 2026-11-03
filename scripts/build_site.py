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

# Open the existing sorter with the requested category first.
categories = ('ui-ux', 'interactive', 'motion', '3d', 'vibe-coding')
for category in categories:
    slug = 'ux' if category == 'ui-ux' else category
    order = (category, *(item for item in categories if item != category))
    target = '../?order=' + '%2C'.join(order)
    page = OUT / slug / 'index.html'
    page.parent.mkdir()
    page.write_text(f'''<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url={target}">
<title>Sharon Wang Liu | Portfolio</title>
<a href="{target}">Open Sharon Wang Liu's portfolio</a>
</html>
''', encoding='utf-8')

print('Built _site: static HTML, styles, scripts, media and the playable experiment.')
