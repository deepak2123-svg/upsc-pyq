"""Original page renders and OCR drafts; no publication or review approval."""
from pathlib import Path
import hashlib,json,subprocess,concurrent.futures
import pymupdf
source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2023-1.pdf')
expected='974d6dd6b6e49a6f5bcab3b75a509edd5b76ac5706b07adcbee33e5e3315e13e'
assert hashlib.sha256(source.read_bytes()).hexdigest()==expected
out=Path('tmp/nda-2023-i');out.mkdir(parents=True,exist_ok=True)
doc=pymupdf.open(source)
print(json.dumps({'source':str(source),'sha256':expected,'pdfPages':len(doc),'textCharacters':sum(len(p.get_text()) for p in doc)}))
targets=[]
for i,page in enumerate(doc):
 target=out/f'source-{i+1:02}.png'
 if not target.exists():page.get_pixmap(matrix=pymupdf.Matrix(1.6,1.6)).save(target)
 targets.append(target)
candidate=Path('../data/nda_answer_sources/answer_keys/2023_I.pdf')
key=pymupdf.open(candidate)
key[0].get_pixmap(matrix=pymupdf.Matrix(2,2)).save(out/'candidate-key-1.png')
print(json.dumps({'candidateKey':str(candidate),'sha256':hashlib.sha256(candidate.read_bytes()).hexdigest(),'pages':len(key),'text':key[0].get_text()[:1500]}))
def ocr(target):
 result=subprocess.run(['C:/Program Files/Tesseract-OCR/tesseract.exe',str(target),'stdout','-l','eng','--psm','3'],capture_output=True,text=True,encoding='utf-8');result.check_returncode()
 target.with_suffix('.ocr.txt').write_text(result.stdout,encoding='utf-8')
 return {'pdfPage':int(target.stem.split('-')[-1]),'render':str(target).replace('\\','/'),'reviewStatus':'not-reviewed'}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:rows=list(pool.map(ocr,targets))
(out/'ocr-manifest.json').write_text(json.dumps({'source':str(source),'sha256':expected,'pages':rows,'publicationApproved':False},indent=2)+'\n',encoding='utf-8')
