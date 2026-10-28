"""Deterministic original-scan option crops; no redrawn or inferred diagrams."""
from pathlib import Path
import hashlib, json
import pymupdf
from PIL import Image

source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2023-2.pdf')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='a1203c10476b980b796fe81592b22d1de6708745980737fa3f8ad9181ee261b8'
doc=pymupdf.open(source)
specs=[
 (59,11,[(.145,.57,.39,.905),(.56,.06,.80,.385)],'All four original semiconductor I–V graphs, with source option labels and axes'),
 (109,19,[(.135,.115,.465,.535)],'All four original resistor arrangements, with resistance values and X/Y terminals'),
 (116,20,[(.145,.515,.285,.90)],'All four original Dalton element symbols, retaining printed option labels'),
 (131,23,[(.135,.175,.345,.735)],'All four original graphs, preserving the printed distance (m) and time (s) axes')
]
out=Path('public/question-figures');out.mkdir(parents=True,exist_ok=True)
manifest=[]
for number,pdf_page,bounds,description in specs:
 page=doc[pdf_page-1];parts=[]
 for x0,y0,x1,y1 in bounds:
  r=page.rect; pix=page.get_pixmap(matrix=pymupdf.Matrix(3,3),clip=pymupdf.Rect(x0*r.width,y0*r.height,x1*r.width,y1*r.height))
  parts.append(Image.frombytes('RGB',[pix.width,pix.height],pix.samples))
 canvas=Image.new('RGB',(sum(p.width for p in parts)+20*(len(parts)-1),max(p.height for p in parts)),'white')
 x=0
 for p in parts:canvas.paste(p,(x,0));x+=p.width+20
 target=out/f'nda-2023-ii-q{number}.png';canvas.save(target)
 manifest.append(dict(number=number,pdfPage=pdf_page,printedPage=2*pdf_page-9,relativeBounds=bounds,asset='/'+str(target.relative_to('public')).replace('\\','/'),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),description=description,reviewStatus='pending'))
Path('content/audits/nda-2023-ii-figure-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Four original figure assets generated; visual approval required.')
