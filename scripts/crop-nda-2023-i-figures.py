"""Deterministic original-scan option crops; no redrawn or inferred diagrams."""
from pathlib import Path
import hashlib, json
import pymupdf
from PIL import Image

source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2023-1.pdf')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='974d6dd6b6e49a6f5bcab3b75a509edd5b76ac5706b07adcbee33e5e3315e13e'
doc=pymupdf.open(source)
specs=[
 (51,10,[(.145,.225,.29,.485)],'Original S₁/S₂ spring balances with W₁/W₂ reading arrows and suspended 10 kg mass'),
 (54,10,[(.54,.58,.86,.755)],'Original connected X/Y containers, liquid height h and valve'),
 (85,14,[(.545,.56,.94,.71)],'Original concave mirror with rectangle ABCD and f, 2f, 3f distances'),
 (86,15,[(.105,.24,.48,.41)],'Original perpendicular mirrors XY/YZ, rotated X′YZ′, ray arrows and θ'),
 (128,21,[(.54,.12,.88,.215)],'Original pair of parallel resistors R followed by series R')
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
 target=out/f'nda-2023-i-q{number}.png';canvas.save(target)
 manifest.append(dict(number=number,pdfPage=pdf_page,printedPage=2*pdf_page-9,relativeBounds=bounds,asset='/'+str(target.relative_to('public')).replace('\\','/'),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),description=description,reviewStatus='pending'))
Path('content/audits/nda-2023-i-figure-manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
print('Five original figure assets generated; visual approval required.')
