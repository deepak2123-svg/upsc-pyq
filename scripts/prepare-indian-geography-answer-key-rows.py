from __future__ import annotations

from pathlib import Path
import json

import numpy as np
from PIL import Image, ImageEnhance


BOOK_ROOT = Path(__file__).resolve().parents[2]
PAGE_ROOT = BOOK_ROOT / ".tmp" / "indian_geography_answer_key_pages"
ROW_ROOT = BOOK_ROOT / ".tmp" / "indian_geography_answer_key_rows_v4"


def clusters(values: np.ndarray, maximum_gap: int = 3) -> list[list[int]]:
    if not len(values):
        return []
    result = [[int(values[0])]]
    for value in values[1:]:
        value = int(value)
        if value - result[-1][-1] <= maximum_gap:
            result[-1].append(value)
        else:
            result.append([value])
    return result


def centers(groups: list[list[int]]) -> list[int]:
    return [round(sum(group) / len(group)) for group in groups]


def detect_horizontal_rules(gray: np.ndarray) -> list[int]:
    """Return horizontal and vertical rule centres for the densest answer table.

    UPSC answer keys use long, dark rules. Text may create short projection peaks,
    so a candidate rule must remain dark across a substantial part of the page.
    Thresholds intentionally err towards retaining rules; later validation rejects
    grids without enough paired columns and data rows.
    """

    dark = gray < 205
    height, width = dark.shape
    horizontal_values = np.where(dark.mean(axis=1) >= 0.24)[0]
    horizontal = centers(clusters(horizontal_values, maximum_gap=4))

    # Ignore page borders and ornamental header rules.
    horizontal = [value for value in horizontal if 0.12 * height < value < 0.96 * height]
    return horizontal


def detect_vertical_rules(gray: np.ndarray, rows: list[int]) -> list[int]:
    if len(rows) < 2:
        return []
    # Restrict the projection to the table body. Page headings otherwise dilute
    # thin vertical rules enough for them to fall below the detection threshold.
    body = gray[rows[0] : rows[-1] + 1]
    dark = body < 220
    values = np.where(dark.mean(axis=0) >= 0.34)[0]
    vertical = centers(clusters(values, maximum_gap=4))
    width = gray.shape[1]
    return [value for value in vertical if 0.02 * width < value < 0.98 * width]


def contiguous_table_rows(horizontal: list[int], image_height: int) -> list[int]:
    """Choose the longest run of near-even horizontal table separators."""

    best: list[int] = []
    for start in range(len(horizontal)):
        run = [horizontal[start]]
        for value in horizontal[start + 1 :]:
            gap = value - run[-1]
            if 24 <= gap <= 130:
                run.append(value)
            elif len(run) >= 5:
                break
            elif gap > 130:
                run = [value]
        if len(run) > len(best):
            best = run
    # At least five data rows are required to treat this as an answer table.
    if len(best) < 6 or best[-1] - best[0] < image_height * 0.18:
        return []
    return best


def table_columns(vertical: list[int], width: int) -> list[int]:
    """Choose the widest plausible run of paired No./Key column rules."""

    candidates = [value for value in vertical if 0.03 * width < value < 0.97 * width]
    if len(candidates) < 5:
        return []
    # Keep rules with broadly regular spacing, allowing the No. and Key columns
    # to have different widths. The outermost detected rules bound the row crop.
    best: list[int] = []
    for start in range(len(candidates)):
        run = [candidates[start]]
        for value in candidates[start + 1 :]:
            gap = value - run[-1]
            if 18 <= gap <= width * 0.12:
                run.append(value)
            elif len(run) >= 5:
                break
            elif gap > width * 0.12:
                run = [value]
        if len(run) > len(best):
            best = run
    if len(best) < 5:
        return []
    gaps = np.diff(best)
    regular = gaps[(gaps >= 18) & (gaps <= width * 0.12)]
    if not len(regular):
        return best
    spacing = float(np.median(regular))
    # Scanned rules are often faint at one side of the page. Once a long regular
    # run is established, extend that grid to the table margins rather than
    # cropping away later question/key pairs.
    extended = list(best)
    while extended[0] - spacing > width * 0.06:
        extended.insert(0, round(extended[0] - spacing))
    while extended[-1] + spacing < width * 0.97:
        extended.append(round(extended[-1] + spacing))
    return extended


def prepare_page(image_path: Path) -> dict:
    image = Image.open(image_path).convert("RGB")
    gray = np.array(image.convert("L"))
    horizontal = detect_horizontal_rules(gray)
    rows = contiguous_table_rows(horizontal, gray.shape[0])
    vertical = detect_vertical_rules(gray, rows)
    columns = table_columns(vertical, gray.shape[1])
    page_number = int(image_path.stem.split("-")[-1])
    page_output = ROW_ROOT / image_path.parent.name
    page_output.mkdir(parents=True, exist_ok=True)

    outputs = []
    if rows and columns:
        left = max(0, columns[0] - 8)
        right = min(image.width, columns[-1] + 8)
        for row_index, (top_rule, bottom_rule) in enumerate(zip(rows, rows[1:]), start=1):
            if bottom_rule - top_rule < 22:
                continue
            crop = image.crop((left, top_rule + 2, right, bottom_rule - 2)).convert("L")
            data = np.array(crop)
            for column in columns:
                local = column - left
                data[:, max(0, local - 5) : min(data.shape[1], local + 6)] = 255
            prepared = Image.fromarray(data)
            prepared = ImageEnhance.Contrast(prepared).enhance(2.0)
            target_height = 220
            target_width = max(1, round(prepared.width * target_height / prepared.height))
            if target_width > 3800:
                target_height = max(1, round(target_height * 3800 / target_width))
                target_width = 3800
            prepared = prepared.resize((target_width, target_height), Image.Resampling.LANCZOS)
            output = page_output / f"page-{page_number:02d}-{row_index:02d}.jpg"
            prepared.save(output, quality=96)
            outputs.append(str(output))

    return {
        "paper": image_path.parent.name,
        "page": page_number,
        "image": str(image_path),
        "horizontalRules": rows,
        "verticalRules": columns,
        "rowImages": outputs,
        "status": "prepared" if outputs else "grid-review-required",
    }


def main() -> None:
    ROW_ROOT.mkdir(parents=True, exist_ok=True)
    pages = [prepare_page(path) for path in sorted(PAGE_ROOT.glob("*/page-*.jpg"))]
    manifest = {
        "version": "indian-geography-answer-key-row-preparation-v1",
        "method": "projection-detected official answer-key grid; one enlarged image per data row",
        "pages": pages,
        "summary": {
            "pageCount": len(pages),
            "prepared": sum(page["status"] == "prepared" for page in pages),
            "reviewRequired": sum(page["status"] != "prepared" for page in pages),
            "rowImageCount": sum(len(page["rowImages"]) for page in pages),
        },
    }
    (ROW_ROOT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest["summary"], indent=2))


if __name__ == "__main__":
    main()
