import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import registry from "../content/taxonomy/indian-geography-v1.3-draft.json";
import { getQuestionPath, pyqQuestions } from "../lib/pyq-catalog";
import { slug } from "../lib/taxonomy";

const defaultTargetByOldSubtopic: Record<string, [string, string]> = {
  "Location, States & Regional Setting": ["India: Location and Political Geography", "States, Union Territories and Capitals"],
  "Physiographic Divisions, Mountains, Plateaus & Passes": ["Geological Structure and Physiography", "Physiographic Divisions of India"],
  "Coasts, Islands & Coastal Features": ["Coasts and Islands", "Deltas, Estuaries, Lagoons and Beaches"],
  "Monsoon, Seasons & Rainfall": ["Climate of India", "Indian Monsoon Mechanism"],
  "Soils & Soil Conservation": ["Soils of India", "Soil Formation and Classification"],
  "Natural Vegetation & Forests": ["Natural Vegetation and Forests", "Controls and Distribution of Natural Vegetation"],
  "River Systems, Lakes, Dams & River-Valley Projects": ["Drainage Systems", "Tributaries, Confluences and River Basins"],
  "Groundwater, Irrigation, Floods & Water Management": ["Water Resources and River Projects", "Groundwater"],
  "Agriculture, Crops & Land Use": ["Agriculture and Land Use", "Land-Use and Cropping Patterns"],
  "Minerals, Energy & Power": ["Minerals and Energy Resources", "Mineral Distribution and Mineral Belts"],
  "Industries & Industrial Regions": ["Industries and Industrial Regions", "Factors Affecting Industrial Location"],
  "Roads, Railways & Inland Transport": ["Transport, Infrastructure and Trade", "Road Transport"],
  "Ports, Sea/Air Routes, Trade & Infrastructure": ["Transport, Infrastructure and Trade", "Major Seaports"],
  "Population, Census, Settlements & Tribes": ["Population and Settlements", "Population Distribution and Density"],
  "Regional Development, Places & Institutions": ["Regional and Map-Based Geography of India", "Important Cities and Places"],
};

const knownTargets = new Set(registry.chapters.flatMap((chapter) => chapter.subtopics.map((subtopic) =>
  `indian-geography/${slug(chapter.name)}/${slug(subtopic.name)}`,
)));

const records = pyqQuestions.flatMap((question) => {
  const path = getQuestionPath(question);
  if (path?.head !== "Indian Geography") return [];
  const target = defaultTargetByOldSubtopic[path.subtopic];
  if (!target) throw new Error(`No draft migration target for ${path.subtopic}`);
  const newTaxonomyId = `indian-geography/${slug(target[0])}/${slug(target[1])}`;
  if (!knownTargets.has(newTaxonomyId)) throw new Error(`Unknown draft target ${newTaxonomyId}`);
  return [{
    questionId: question.id,
    exam: question.exam,
    year: question.year,
    paper: question.paper,
    questionNumber: question.questionNumber,
    oldTaxonomyId: `indian-geography/${slug(path.topic)}/${slug(path.subtopic)}`,
    oldChapter: path.topic,
    oldSubtopic: path.subtopic,
    proposedTaxonomyId: newTaxonomyId,
    proposedChapter: target[0],
    proposedSubtopic: target[1],
    reviewStatus: "needs-review",
    sourcePdfStatus: "not-yet-verified",
    verbatimStatus: "not-yet-verified",
    answerKeyStatus: "not-yet-verified",
  }];
});

const examCounts = Object.fromEntries(["CSE", "CAPF", "CDS", "NDA"].map((exam) => [exam, records.filter((record) => record.exam === exam).length]));
const output = {
  version: registry.version,
  generatedAt: new Date().toISOString(),
  status: "draft-only-do-not-publish",
  recordCount: records.length,
  examCounts,
  notes: [
    "Proposed paths are broad mechanical seeds from the previous taxonomy, not editorial classifications.",
    "Every record requires question-level review against its original paper and answer key before publication.",
    "Question text, options, source hashes and answers are not modified by this manifest.",
  ],
  records,
};

await writeFile(resolve("content/taxonomy/indian-geography-v1.3-migration-draft.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ recordCount: records.length, examCounts }, null, 2));
