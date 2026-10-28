"""Draft OCR and original page renders; never an approval or runtime import."""
from pathlib import Path
import concurrent.futures, hashlib, json, subprocess
import pymupdf
source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2023-2.pdf')
expected='a1203c10476b980b796fe81592b22d1de6708745980737fa3f8ad9181ee261b8'
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
out=Path('tmp/nda-2023-ii');out.mkdir(parents=True,exist_ok=True)
doc=pymupdf.open(source);assert len(doc)==26
def prepare(i):
    page=doc[i];target=out/f'source-{i+1:02}.png'
    if not target.exists():page.get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save(str(target))
    return target
targets=[prepare(i) for i in range(len(doc))]
def ocr(target):
    r=subprocess.run(['C:/Program Files/Tesseract-OCR/tesseract.exe',str(target),'stdout','-l','eng','--psm','3'],capture_output=True,text=True,encoding='utf-8');r.check_returncode()
    target.with_suffix('.ocr.txt').write_text(r.stdout,encoding='utf-8')
    return {'pdfPage':int(target.stem.split('-')[-1]),'render':str(target).replace('\\','/'),'ocrSuggestion':str(target.with_suffix('.ocr.txt')).replace('\\','/'),'reviewStatus':'not-reviewed'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(ocr,targets))
(out/'ocr-manifest.json').write_text(json.dumps({'source':str(source),'sha256':expected,'pages':rows,'publicationApproved':False},indent=2)+'\n',encoding='utf-8')
print(f'{len(rows)} page drafts prepared; visual comparison required.')
