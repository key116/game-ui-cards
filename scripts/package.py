from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
version = __import__('json').loads((root / 'package.json').read_text())['version']
archive = root.parent / f'game-ui-cards-v{version}.zip'
with ZipFile(archive, 'w', ZIP_DEFLATED) as output:
    for name in ('_worker.js', 'index.html'):
        output.write(root / 'upload' / name, name)
print(f'Wrote {archive}')
