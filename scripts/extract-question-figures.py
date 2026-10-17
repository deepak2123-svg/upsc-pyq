from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]

# Coordinates are reviewed against the rendered original paper page. Cropping is
# deliberately lossless: no redrawing, OCR reconstruction, or generative repair.
FIGURES = [
    {
        "source": PROJECT_ROOT.parent / ".tmp" / "full_reaudit_pages" / "CAPF" / "2019" / "page-43.jpg",
        "crop": (300, 272, 521, 489),
        "output": PROJECT_ROOT / "public" / "question-figures" / "capf-2019-i-q120-map.png",
    },
]


def main() -> None:
    for figure in FIGURES:
        source = figure["source"]
        output = figure["output"]
        if not source.exists():
            raise FileNotFoundError(f"Original rendered paper page is missing: {source}")
        output.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(source) as page:
            page.crop(figure["crop"]).save(output, format="PNG", optimize=True)
        print(f"Wrote {output}")


if __name__ == "__main__":
    main()
