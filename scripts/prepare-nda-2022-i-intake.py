"""Render original pages and produce unapproved OCR drafts. Never publishes records."""
from pathlib import Path
import hashlib, json, subprocess, concurrent.futures
import pymupdf

source = Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2022-1.pdf')
expected = 'bbad095a0e5a323aef8f839bd9ac2fbfa9a255c5ba8cd0479a5d17d93d569002'
assert hashlib.sha256(source.read_bytes()).hexdigest() == expected
out = Path('tmp/nda-2022-i')
out.mkdir(parents=True, exist_ok=True)
doc = pymupdf.open(source)
targets = []
for i, page in enumerate(doc):
    target = out / f'source-{i+1:02}.png'
    if not target.exists():
        page.get_pixmap(matrix=pymupdf.Matrix(1.6, 1.6)).save(target)
    targets.append(target)

def ocr(target):
    result = subprocess.run(['C:/Program Files/Tesseract-OCR/tesseract.exe', str(target), 'stdout', '-l', 'eng', '--psm', '3'], capture_output=True, text=True, encoding='utf-8')
    result.check_returncode()
    target.with_suffix('.ocr.txt').write_text(result.stdout, encoding='utf-8')
    return {'pdfPage': int(target.stem.split('-')[-1]), 'render': target.as_posix(), 'reviewStatus': 'not-reviewed'}

with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    rows = list(pool.map(ocr, targets))
(out / 'ocr-manifest.json').write_text(json.dumps({'source': str(source), 'sha256': expected, 'pages': rows, 'publicationApproved': False}, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'pages': len(doc), 'sha256': expected, 'ocrDrafts': len(rows), 'publicationApproved': False}))
