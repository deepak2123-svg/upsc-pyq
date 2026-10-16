from pathlib import Path
import json
import pypdfium2 as pdfium
import numpy as np
from PIL import Image

BOOK_ROOT = Path(__file__).resolve().parents[2]
SOURCE_ROOT = BOOK_ROOT / ".tmp" / "full_reaudit_reference"
OUTPUT_ROOT = BOOK_ROOT / ".tmp" / "indian_geography_answer_key_pages"

OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
manifest = []

for exam in ("CDS", "NDA"):
    for pdf_path in sorted((SOURCE_ROOT / exam).glob("*_answer_key.pdf")):
        paper_id = pdf_path.stem.removesuffix("_answer_key")
        paper_dir = OUTPUT_ROOT / f"{exam}_{paper_id}"
        paper_dir.mkdir(parents=True, exist_ok=True)
        document = pdfium.PdfDocument(str(pdf_path))
        for index, page in enumerate(document):
            output = paper_dir / f"page-{index + 1}.jpg"
            image = page.render(scale=2.25).to_pil().convert("RGB")
            width, height = image.size
            # Answer keys are dense tables. Removing the broad scan margins and
            # enlarging the table gives Windows OCR enough glyph height to read
            # individual question-number/answer cells.
            image = image.crop((int(width * 0.07), int(height * 0.08), int(width * 0.94), int(height * 0.91)))
            image = image.resize((int(image.width * 1.55), int(image.height * 1.55)))
            gray = np.array(image.convert("L"))
            dark = gray < 145
            horizontal = np.where(dark.mean(axis=1) > 0.48)[0]
            vertical = np.where(dark.mean(axis=0) > 0.48)[0]
            for row in horizontal:
                gray[max(0, row - 2):min(gray.shape[0], row + 3), :] = 255
            for column in vertical:
                gray[:, max(0, column - 2):min(gray.shape[1], column + 3)] = 255
            image = Image.fromarray(gray).convert("RGB")
            image.save(output, quality=96)
        manifest.append({
            "exam": exam,
            "paper": paper_id,
            "source": str(pdf_path),
            "pages": len(document),
            "output": str(paper_dir),
        })

(OUTPUT_ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
print(json.dumps({"papers": len(manifest), "pages": sum(row["pages"] for row in manifest)}, indent=2))
