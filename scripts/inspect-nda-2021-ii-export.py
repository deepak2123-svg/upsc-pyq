"""Read-only export QA: page renders, contact sheets, text/figure inventory."""
from pathlib import Path
import json
import pymupdf
from PIL import Image,ImageDraw
pdf=next(Path('test-results').rglob('nda-2021-ii-reviewed.pdf'))
doc=pymupdf.open(pdf);out=Path('tmp/nda-2021-ii/export');out.mkdir(parents=True,exist_ok=True)
text='\n'.join(p.get_text() for p in doc)
assert 'Answer key' in text
pages=[]
for i,page in enumerate(doc):
 target=out/f'page-{i+1:02}.png';page.get_pixmap(matrix=pymupdf.Matrix(1.2,1.2)).save(target)
 pages.append(target)
for start in range(0,len(pages),12):
 sheet=Image.new('RGB',(1200,4*440),'#ddd');draw=ImageDraw.Draw(sheet)
 for j,path in enumerate(pages[start:start+12]):
  img=Image.open(path);img.thumbnail((390,410));x=(j%3)*400;y=(j//3)*440;sheet.paste(img,(x,y+22));draw.text((x+5,y+5),f'Page {start+j+1}',fill='black')
 sheet.save(out/f'contact-{start//12+1}.png')
(out/'inspection.json').write_text(json.dumps({'pdf':str(pdf),'pages':len(doc),'embeddedImageOccurrences':sum(len(p.get_images()) for p in doc),'renderedPages':len(pages)},indent=2)+'\n')
print((out/'inspection.json').read_text())
