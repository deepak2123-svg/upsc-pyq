import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bookRoot = path.resolve(root, "..");
const candidates = JSON.parse(fs.readFileSync(path.join(root, "content/taxonomy/indian-geography-v1.3-source-candidates.json"), "utf8"));
const classification = JSON.parse(fs.readFileSync(path.join(root, "content/taxonomy/indian-geography-v1.3-classification-draft.json"), "utf8"));
const included = new Set(classification.records.filter((record) => record.scopeDecision === "include").map((record) => record.sourceIdentity.label));

const ocrRoot = path.join(bookRoot, ".tmp/full_reaudit_ocr");
const exams = ["CSE", "CAPF", "CDS", "NDA"];
const ocr = Object.fromEntries(exams.map((exam) => {
  const payload = JSON.parse(fs.readFileSync(path.join(ocrRoot, `${exam}.json`), "utf8").replace(/^\uFEFF/, ""));
  const papers = new Map();
  for (const page of payload.pages) {
    const pages = papers.get(page.paper) ?? [];
    pages.push(page);
    papers.set(page.paper, pages);
  }
  return [exam, papers];
}));

const stopwords = new Set("a an the is are was were be been being of in on at to from for and or but with without by as this that these those which one following given below above select correct answer using code consider statements statement only not among reference india indian".split(" "));
const normalize = (value) => String(value ?? "")
  .normalize("NFKD")
  .replace(/\p{M}/gu, "")
  .replace(/[‘’]/g, "'")
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .trim()
  .toLowerCase();
const tokenList = (value) => normalize(value).split(" ").filter((token) => token.length > 1 && !stopwords.has(token));
const tokenSet = (value) => new Set(tokenList(value));
const coverage = (needle, haystack) => {
  const tokens = tokenList(needle);
  if (!tokens.length) return 0;
  const unique = [...new Set(tokens)];
  return Number((unique.filter((token) => haystack.has(token)).length / unique.length).toFixed(5));
};

const paperKey = (identity) => {
  if (identity.exam === "CSE" || identity.exam === "CAPF") return String(identity.year);
  const term = String(identity.term).match(/\d+/)?.[0] ?? ({ I: "1", II: "2" }[identity.term] ?? identity.term);
  if (identity.exam === "NDA" && identity.year === 2020) return "2020-1 and 2";
  return `${identity.year}-${term}`;
};

const records = candidates.candidates
  .filter((candidate) => included.has(candidate.sourceIdentity.label))
  .map((candidate) => {
    const identity = candidate.sourceIdentity;
    const paper = paperKey(identity);
    const pages = ocr[identity.exam].get(paper) ?? [];
    const ranked = pages.map((page) => {
      const pageTokens = tokenSet(page.text);
      const questionCoverage = coverage(candidate.sourceText, pageTokens);
      const optionCoverages = ["A", "B", "C", "D"].map((key) => coverage(candidate.options[key], pageTokens));
      const optionMean = Number((optionCoverages.reduce((sum, value) => sum + value, 0) / 4).toFixed(5));
      const optionStrongCount = optionCoverages.filter((value) => value >= 0.75).length;
      const score = Number((questionCoverage * 0.72 + optionMean * 0.28).toFixed(5));
      return { page, questionCoverage, optionCoverages, optionMean, optionStrongCount, score };
    }).sort((a, b) => b.score - a.score);
    const best = ranked[0] ?? null;
    let status = "no-original-paper-match";
    if (best?.questionCoverage >= 0.88 && best.optionStrongCount >= 3 && best.optionMean >= 0.78) status = "high-confidence-original-page-match";
    else if (best?.questionCoverage >= 0.72 && best.optionStrongCount >= 2 && best.optionMean >= 0.6) status = "manual-original-page-review";

    return {
      sourceIdentity: identity,
      paperKey: paper,
      status,
      bestPage: best ? {
        page: best.page.page,
        image: best.page.image,
        questionCoverage: best.questionCoverage,
        optionCoverages: best.optionCoverages,
        optionMean: best.optionMean,
        optionStrongCount: best.optionStrongCount,
        score: best.score,
      } : null,
    };
  });

const byStatus = Object.fromEntries([...records.reduce((map, record) => map.set(record.status, (map.get(record.status) ?? 0) + 1), new Map())].sort());
const output = {
  version: "indian-geography-original-pdf-audit-v1",
  status: "machine-audit-with-manual-review-queue",
  generatedAt: new Date().toISOString(),
  recordCount: records.length,
  methodology: [
    "Each candidate is searched only within the OCR pages of its original exam/year/term paper.",
    "Common instruction words are excluded before calculating normalized token coverage.",
    "High confidence requires at least 88% question-token coverage, three strongly matching options and at least 78% mean option coverage on one page.",
    "This confirms reproduction against an original-paper page; it does not verify the answer key.",
  ],
  summary: { byStatus },
  records,
};

fs.writeFileSync(path.join(root, "content/taxonomy/indian-geography-v1.3-original-pdf-audit.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output.summary, null, 2));
