"""Crop original source diagrams; never redraw or infer their content."""
from pathlib import Path
import hashlib,json
import pymupdf
from PIL import Image
source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2024-1.pdf')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='1672d68a9b43bcba608b647852536472aa1c4bc810299faae2f203bc02d5c9f1'
doc=pymupdf.open(source);out=Path('tmp/nda-2024-i/figures');out.mkdir(parents=True,exist_ok=True)
regions={51:(10,[(.045,.195,.485,.29)]),52:(10,[(.085,.45,.34,.547),(.085,.63,.41,.718)]),54:(10,[(.535,.485,.70,.88)]),56:(11,[(.14,.45,.30,.56)]),89:(17,[(.62,.145,.86,.37)]),124:(23,[(.53,.64,.94,.73)]),126:(24,[(.065,.34,.475,.515)]),128:(24,[(.535,.175,.87,.89)])}
rows=[]
for n,(page,boxes) in regions.items():
    pix=doc[page-1].get_pixmap(matrix=pymupdf.Matrix(3,3))
    image=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
    crops=[image.crop(tuple(round(v*(image.width if i%2==0 else image.height)) for i,v in enumerate(box))) for box in boxes]
    if len(crops)==1:result=crops[0]
    else:
        result=Image.new('RGB',(max(c.width for c in crops),sum(c.height for c in crops)+24),'white');y=0
        for c in crops:result.paste(c,(0,y));y+=c.height+24
    target=out/f'q{n}.png';result.save(target)
    rows.append({'number':n,'pdfPage':page,'printedPage':page if page<=9 else 2*page-9,'relativeBounds':boxes,'asset':f'/question-figures/nda-2024-i-q{n}.png','localCrop':str(target).replace('\\','/'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'description':'Original diagram(s) and labels from source question '+str(n),'reviewStatus':'pending'})
(out/'manifest.json').write_text(json.dumps(rows,indent=2)+'\n',encoding='utf-8')
print('Eight original figure assets generated; visual crop review required.')
