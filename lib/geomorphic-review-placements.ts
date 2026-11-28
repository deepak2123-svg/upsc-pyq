import audit from "../content/audits/geomorphic-95-review/decisions.json" with { type: "json" };
import { defenceWorldHistory } from "./preparation-syllabus.ts";

type Placement = {
  questionId: string;
  expectedSourceTextHash: string;
  primaryId: string | null;
  additionalIds: string[];
  scope: "prelims" | "defence-only" | "original-paper-only";
  tag: "Static" | "Event-based";
  rationale: string;
};

const placements = audit.records as Placement[];
export const geomorphicReviewPlacements = new Map(placements.map((row) => [row.questionId, row]));
export const geomorphicClassificationRevision = audit.classificationRevision;
if (placements.length !== 95 || geomorphicReviewPlacements.size !== 95) {
  throw new Error("Expected 95 distinct reviewed geomorphology questions");
}

const slug = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const defencePaths = new Map(defenceWorldHistory.flatMap(([section, chapters]) =>
  chapters.flatMap(([chapter, labels]) => labels.map((subtopic) => {
    const id = ["subtopic", "history", slug(section), slug(chapter), slug(subtopic)].join(":");
    return [id, { id, subject: "History", head: section, chapter, subtopic }] as const;
  })),
));
export const getGeomorphicDefencePath = (id: string) => defencePaths.get(id);

export const geomorphicDefenceTransfers = placements.flatMap((row) =>
  row.scope === "defence-only" && row.primaryId
    ? [{ questionId: row.questionId, subtopicId: row.primaryId }]
    : [],
);
