"""Build a review draft for NDA II 2024 Mathematics from a structured transcript.

The resulting JSON remains staging evidence.  It is compared with the original
UPSC scan before the reviewed paper builder is allowed to publish it.
"""

from __future__ import annotations

import hashlib
import json
import re
import urllib.request
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://www.wishwas.in/nda/papers/2024-ii-maths"
PUBLISHER_KEY_URL = "https://edurev.in/p/383349/previous-year-question-paper-nda-mathematics-2024"
OUTPUT = ROOT / "content/staging/nda-2024-ii-maths-source-transcript.json"


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return response.read()


def inline_text(node: Tag) -> str:
    chunks: list[str] = []

    def walk(item: Tag | NavigableString) -> None:
        if isinstance(item, NavigableString):
            chunks.append(str(item))
            return
        if item.name == "br":
            chunks.append("\n")
            return
        classes = item.get("class", [])
        if "tex" in classes or "tex-d" in classes:
            value = item.get_text(" ", strip=True)
            chunks.append(f"\\({value}\\)")
            return
        for child in item.children:
            walk(child)

    walk(node)
    value = "".join(chunks).replace("\u200b", "").replace("\xa0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    value = re.sub(r" *\n *", "\n", value)
    return value.strip()


def prompt_lines(value: str) -> list[str]:
    # WishWas keeps printed Roman statements inline.  Restore the source marker
    # boundaries conservatively so the shared formatter can render them as rows.
    value = re.sub(r" (?=(?:I|II|III|IV|V)\. )", "\n", value)
    value = re.sub(
        r" (?=(?:Select the answer|Which of the statements|Which one of the following|Consider the following))",
        "\n",
        value,
    )
    return [line.strip() for line in value.splitlines() if line.strip()]


def normalize(value: str) -> str:
    value = BeautifulSoup(value, "html.parser").get_text(" ", strip=True)
    value = value.replace("\u200b", "").replace("−", "-").replace("–", "-")
    value = re.sub(r"\\[()]", "", value)
    value = re.sub(r"[^a-z0-9]+", "", value.lower())
    return value


def infer_answer(solution_html: str, options: dict[str, str]) -> tuple[str | None, str]:
    text = BeautifulSoup(solution_html, "html.parser").get_text(" ", strip=True)
    explicit = re.findall(r"(?:working gives|answer:)\s*(?:option\s*)?\(([a-d])\)", text, re.I)
    if explicit:
        return explicit[-1].upper(), "explicit-letter"

    tail_matches = re.findall(r"Answer:\s*(.+?)(?:\.|$)", text, re.I)
    tail = tail_matches[-1] if tail_matches else text[-250:]
    normalized_tail = normalize(tail)
    candidates = []
    for key, option in options.items():
        normalized_option = normalize(option)
        if normalized_option and (
            normalized_option in normalized_tail or normalized_tail in normalized_option
        ):
            candidates.append(key)
    if len(candidates) == 1:
        return candidates[0], "solution-tail-option-text"
    return None, "unresolved"


def main() -> None:
    questions: list[dict] = []
    source_pages: list[dict] = []

    for part in range(1, 5):
        page_url = BASE_URL if part == 1 else f"{BASE_URL}/{part}"
        html_bytes = fetch(page_url)
        solution_bytes = fetch(f"{BASE_URL}/solutions/{part}")
        solution_map = json.loads(solution_bytes)
        soup = BeautifulSoup(html_bytes, "html.parser")
        source_pages.append(
            {
                "part": part,
                "url": page_url,
                "sha256": hashlib.sha256(html_bytes).hexdigest(),
                "solutionsUrl": f"{BASE_URL}/solutions/{part}",
                "solutionsSha256": hashlib.sha256(solution_bytes).hexdigest(),
            }
        )

        for item in soup.select("li[id^='q']"):
            number = int(item["id"][1:])
            frozen = item.select_one("div[data-frozen]")
            if frozen is None:
                continue
            direct_divs = frozen.find_all("div", recursive=False)
            header_index = next(
                (
                    index
                    for index, child in enumerate(direct_divs)
                    if re.search(rf"\bQuestion\s+{number}\b", child.get_text(" ", strip=True))
                ),
                None,
            )
            header = direct_divs[header_index] if header_index is not None else None
            prompt = (
                direct_divs[header_index + 1]
                if header_index is not None and header_index + 1 < len(direct_divs)
                else None
            )
            options_list = frozen.find("ol")
            if prompt is None or options_list is None:
                raise RuntimeError(f"Incomplete structured transcript at Q{number}")

            topic_link = header.find("a") if header else None
            options: dict[str, str] = {}
            for option in options_list.find_all("li", recursive=False):
                pieces = option.find_all("span", recursive=False)
                if len(pieces) < 2:
                    raise RuntimeError(f"Malformed option at Q{number}")
                key_match = re.search(r"[a-d]", pieces[0].get_text(" ", strip=True), re.I)
                if not key_match:
                    raise RuntimeError(f"Missing option key at Q{number}")
                options[key_match.group(0).upper()] = inline_text(pieces[1])

            solution_html = solution_map.get(str(number), "")
            answer, answer_method = infer_answer(solution_html, options)
            shared_context = [inline_text(child) for child in direct_divs[:header_index]]
            page_text = "\n".join([*shared_context, inline_text(prompt)])
            # The English booklet pages do not keep a uniform five-item layout.
            # These ranges were checked visually against every English scan page.
            page_ranges = [
                (1, 5, 3), (6, 10, 5), (11, 15, 7), (16, 20, 9),
                (21, 26, 11), (27, 33, 13), (34, 40, 15), (41, 46, 17),
                (47, 50, 19), (51, 57, 21), (58, 64, 23), (65, 70, 25),
                (71, 76, 27), (77, 83, 29), (84, 87, 31), (88, 93, 33),
                (94, 98, 35), (99, 103, 37), (104, 110, 39),
                (111, 115, 41), (116, 120, 43),
            ]
            pdf_page = next(page for first, last, page in page_ranges if first <= number <= last)
            questions.append(
                {
                    "number": number,
                    "promptLines": prompt_lines(page_text),
                    "options": options,
                    "topicLabel": topic_link.get_text(" ", strip=True) if topic_link else None,
                    "topicHref": topic_link.get("href") if topic_link else None,
                    "pdfPage": pdf_page,
                    "printedPage": pdf_page,
                    "answerDraft": answer,
                    "answerInference": answer_method,
                    "solutionHtml": solution_html,
                }
            )

    questions.sort(key=lambda row: row["number"])
    expected = list(range(1, 121))
    actual = [row["number"] for row in questions]
    if actual != expected:
        raise RuntimeError(f"Expected Q1-Q120, got {actual}")
    for row in questions:
        if list(row["options"]) != list("ABCD"):
            raise RuntimeError(f"Expected four ordered options at Q{row['number']}")

    publisher_bytes = fetch(PUBLISHER_KEY_URL)
    publisher_text = BeautifulSoup(publisher_bytes, "html.parser").get_text(" ", strip=True)
    start = publisher_text.index("NDA 2024-2 Answer Key NDA Mathematics (SET-A)")
    end = publisher_text.index("Read More", start)
    letters = re.findall(r"\b[A-D]\b", publisher_text[start:end].split("(SET-A)", 1)[1])
    grid_numbers = [number for row in range(1, 31) for number in (row, row + 30, row + 60, row + 90)]
    if len(letters) != 120:
        raise RuntimeError(f"Expected 120 publisher-key letters, got {len(letters)}")
    publisher_key = dict(zip(grid_numbers, letters, strict=True))
    for row in questions:
        row["publisherKeyDraft"] = publisher_key[row["number"]]
        row["draftsAgree"] = (
            row["answerDraft"] is None or row["answerDraft"] == row["publisherKeyDraft"]
        )

    payload = {
        "paper": {
            "exam": "NDA",
            "year": 2024,
            "session": "II",
            "subject": "Mathematics",
            "bookletSeries": "A",
            "paperCode": "SURN-B-MTH/81A",
            "examDate": "2024-09-01",
            "questionPaperUrl": "https://www.upsc.gov.in/sites/default/files/QP-NDA-NA-II-24-MATHEMATICS-020924.pdf",
        },
        "transcriptionAid": {
            "name": "WishWas Training Academy solved-paper transcript",
            "baseUrl": BASE_URL,
            "notice": "Secondary structured transcript and worked solutions; never official answer evidence.",
            "pages": source_pages,
        },
        "publisherKeyAid": {
            "name": "EduRev NDA II 2024 Mathematics Set A key",
            "url": PUBLISHER_KEY_URL,
            "sha256": hashlib.sha256(publisher_bytes).hexdigest(),
            "notice": "Secondary publisher answer table; never official UPSC answer evidence.",
            "gridOrder": grid_numbers,
            "letters": letters,
        },
        "questions": questions,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    unresolved = [row["number"] for row in questions if row["answerDraft"] is None]
    disagreements = [row["number"] for row in questions if not row["draftsAgree"]]
    print(json.dumps({"questions": len(questions), "unresolvedAnswers": unresolved, "draftDisagreements": disagreements}))


if __name__ == "__main__":
    main()
