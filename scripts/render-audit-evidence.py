"""Read-only PDF rendering for answer-table review (does not alter source PDFs)."""
import sys
from pathlib import Path
import pypdfium2 as pdfium

source = Path(sys.argv[1]).resolve()
output = Path('tmp/answer-audit-renders') / source.stem
output.mkdir(parents=True, exist_ok=True)
document = pdfium.PdfDocument(source)
for index in range(len(document)):
    document[index].render(scale=2).to_pil().save(output / f'page-{index + 1}.png')
print(output.resolve())
