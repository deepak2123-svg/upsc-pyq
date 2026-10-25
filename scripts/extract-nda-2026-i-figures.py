"""Deterministic crops of the original source scan; no redraw or answer overlays."""
import hashlib
from pathlib import Path
from PIL import Image

source = Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf')
assert hashlib.sha256(source.read_bytes()).hexdigest() == '1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930'
out = Path('public/figures/nda-2026-i')
out.mkdir(parents=True, exist_ok=True)
for number, page, box in [(72, 15, (760, 1128, 1160, 1290)), (73, 17, (120, 280, 610, 1505)), (74, 17, (810, 425, 1115, 600))]:
    image = Image.open(f'tmp/nda-2026-i/page-{page:02}.jpg')
    assert image.width in range(1280, 1310) and image.height == 1700
    target = out / f'q{number}.png'
    if number == 73:
        # A compact contact sheet preserves every original diagram and letter.
        sheet = Image.new('RGB', (700, 700), 'white')
        sheet.paste(image.crop((245, 280, 470, 450)), (237, 5))
        for rect, position in [((145,575,480,790),(5,185)), ((145,795,480,1010),(355,185)), ((145,1035,480,1255),(5,440)), ((145,1275,480,1510),(355,440))]:
            sheet.paste(image.crop(rect), position)
        sheet.save(target)
    else:
        image.crop(box).save(target)
    print(number, hashlib.sha256(target.read_bytes()).hexdigest())
