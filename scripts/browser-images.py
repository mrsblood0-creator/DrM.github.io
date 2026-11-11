"""Convert deployment metafiles to browser-readable PNGs; retain source originals."""
from pathlib import Path
from PIL import Image
import json
ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'

def main():
    changes = {}
    for source in list(DIST.rglob('*')):
        if source.suffix.lower() not in ('.emf', '.wmf'):
            continue
        target = source.with_name(source.name + '.png')
        with Image.open(source) as image:
            image.load(dpi=144)
            pixels = image.convert('RGB')
            pixels.save(target, optimize=True)
            with Image.open(target) as check:
                assert check.size == pixels.size
                assert check.convert('RGB').tobytes() == pixels.tobytes()
        changes[source.relative_to(DIST).as_posix()] = target.relative_to(DIST).as_posix()
    if changes:
        for page in DIST.rglob('*'):
            if page.suffix.lower() in ('.html', '.css', '.js', '.json', '.xml'):
                original = page.read_text(encoding='utf8')
                updated = original
                for old, new in changes.items():
                    updated = updated.replace(old, new)
                if original != updated:
                    temporary = page.with_name(page.name + '.tmp')
                    temporary.write_text(updated, encoding='utf8')
                    temporary.replace(page)
        for old in changes:
            (DIST / old).unlink()
        (ROOT / 'content/browser-image-conversions.json').write_text(json.dumps(changes, indent=2), encoding='utf8')
    print(f'Browser-compatible images: converted {len(changes)} metafiles')

if __name__ == '__main__':
    main()
