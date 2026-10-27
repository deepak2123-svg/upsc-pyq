"""Source renders/OCR suggestions only. No answer or reproduction approval."""
from pathlib import Path
import concurrent.futures,hashlib,json,subprocess
import pymupdf

source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2024-1.pdf')
expected='1672d68a9b43bcba608b647852536472aa1c4bc810299faae2f203bc02d5c9f1'
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
out=Path('tmp/nda-2024-i');out.mkdir(parents=True,exist_ok=True)
doc=pymupdf.open(source)
assert len(doc)==28
jobs=[]
for i,page in enumerate(doc):
    target=out/f'source-{i+1:02}.png'
    if not target.exists():page.get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save(str(target))
    jobs.append(target)
def ocr(target):
    result=subprocess.run(['C:/Program Files/Tesseract-OCR/tesseract.exe',str(target),'stdout','-l','eng','--psm','3'],capture_output=True,text=True,encoding='utf-8')
    result.check_returncode()
    target.with_suffix('.ocr.txt').write_text(result.stdout,encoding='utf-8')
    return {'pdfPage':int(target.stem.split('-')[-1]),'render':str(target).replace('\\','/'),'ocrSuggestion':str(target.with_suffix('.ocr.txt')).replace('\\','/'),'reviewStatus':'not-reviewed'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    rows=list(executor.map(ocr,jobs))
(out/'ocr-manifest.json').write_text(json.dumps({'source':str(source),'sha256':expected,'pages':rows,'publicationApproved':False},indent=2)+'\n',encoding='utf-8')
print(f'Prepared {len(rows)} page suggestions; all require visual review.')
