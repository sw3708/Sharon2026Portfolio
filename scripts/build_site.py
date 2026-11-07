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
routes = {'ux': 'ui-ux', 'interactive': 'interactive', 'motion': 'motion', 'multimedia': 'multimedia',
          '3d': '3d', 'creative-tech': 'vibe-coding',
          'creative-technology': 'vibe-coding', 'vibe-coding': 'vibe-coding'}
multimedia_order = ('motion', 'ui-ux', '3d', 'interactive', 'vibe-coding')
creative_order = ('vibe-coding', 'interactive', 'ui-ux', 'motion', '3d')
for slug, category in routes.items():
    order = multimedia_order if category == 'multimedia' else creative_order if category == 'vibe-coding' else (
        category, *(item for item in categories if item != category)
    )
    target = '../?order=' + '%2C'.join(order)
    if slug == 'multimedia':
        target += '&amp;projects=logo-animations%2Cpuma-kiosk%2Cnyid'
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
