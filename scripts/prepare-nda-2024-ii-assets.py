"""Render/crop original source evidence, not substitute diagrams or publication approval."""
from pathlib import Path
import hashlib,json
import pypdfium2 as pdfium

source=Path('C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2024-2.pdf')
assert hashlib.sha256(source.read_bytes()).hexdigest()=='f29ca30df4cc2a58ab10f0784041075444edf1e3631fbde47e96a05482c7e819'
out=Path('tmp/nda-2024-ii/figures');out.mkdir(parents=True,exist_ok=True)
doc=pdfium.PdfDocument(source)
regions={64:(13,(.565,.65,.90,.77)),67:(15,(.55,.18,.90,.57)),69:(17,(.12,.16,.49,.90)),70:(17,(.55,.15,.89,.90)),71:(19,(.12,.14,.48,.65)),72:(19,(.11,.76,.48,.91)),125:(35,(.13,.61,.47,.80))}
manifest=[]
for number,(page,box) in regions.items():
    image=doc[page-1].render(scale=3).to_pil()
    pixels=tuple(round(value*(image.width if i%2==0 else image.height)) for i,value in enumerate(box))
    target=out/f'q{number}.png';image.crop(pixels).save(target)
    manifest.append({'number':number,'page':page,'relativeBounds':box,'path':str(target).replace('\\','/'),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'reviewStatus':'pending'})
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n',encoding='utf8')
print(json.dumps(manifest))
