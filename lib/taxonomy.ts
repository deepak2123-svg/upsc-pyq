import taxonomySource from "../content/taxonomy/upsc-geography-v1.2.json";
import questionMap01 from "../content/taxonomy/question-map-01.json";
import questionMap02 from "../content/taxonomy/question-map-02.json";
import questionMap03 from "../content/taxonomy/question-map-03.json";
import questionMap04 from "../content/taxonomy/question-map-04.json";
import questionMap05 from "../content/taxonomy/question-map-05.json";
import questionMap06 from "../content/taxonomy/question-map-06.json";
import cdsGeographyAliases from "../content/taxonomy/cds-geography-aliases.json";
import physicalReview from "../content/taxonomy/physical-geography-v1.2-review.json";
import {prelimsPaths,canonicalSubjectLabel} from './prelims-taxonomy';

export const TAXONOMY_VERSION = taxonomySource.version;
export type TaxonomySubject = "Geography" | "Environment" | "Polity" | "History" | "Polity & Governance" | "Economy" | "Environment & Ecology" | "Science & Technology" | "Social Development" | "International Relations & Organisations" | "Current Affairs";
export type TaxonomyChapter = { name: string; order: number; subtopics: { name: string; order: number }[] };
export type TaxonomyHead = { name: string; chapters: TaxonomyChapter[] };
export type TaxonomyGroup = TaxonomyHead & { subject: TaxonomySubject };
export type TaxonomyNode = { id: string; subject: TaxonomySubject; head: string; chapter: string; subtopic: string; chapterOrder: number; subtopicOrder: number; headOrder?:number };

export const slug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const subjectForHead = (head: string): TaxonomySubject => head === "Environment & Ecology" ? "Environment" : "Geography";
const normalizeChapter = (chapter: { name: string; order?: number; subtopics: (string | { name: string; order?: number })[] }, index: number): TaxonomyChapter => ({
  name: chapter.name,
  order: chapter.order ?? index + 1,
  subtopics: chapter.subtopics.map((subtopic, subtopicIndex) => typeof subtopic === "string"
    ? { name: subtopic, order: subtopicIndex + 1 }
    : { name: subtopic.name, order: subtopic.order ?? subtopicIndex + 1 }),
});

export const taxonomyGroups: TaxonomyGroup[] = taxonomySource.meta_heads.map((head) => ({
  name: head.name,
  subject: subjectForHead(head.name),
  chapters: head.chapters.map(normalizeChapter),
}));
export const taxonomyNodes: TaxonomyNode[] = taxonomyGroups.flatMap((group) => group.chapters.flatMap((chapter) => chapter.subtopics.map((subtopic) => ({
  id: `${slug(group.name)}/${slug(chapter.name)}/${slug(subtopic.name)}`,
  subject: group.subject,
  head: group.name,
  chapter: chapter.name,
  subtopic: subtopic.name,
  chapterOrder: chapter.order,
  subtopicOrder: subtopic.order,
}))));
const nodeById = new Map(taxonomyNodes.map((node) => [node.id, node]));
const nodeBySubtopic = new Map(taxonomyNodes.map((node) => [node.subtopic, node]));

export function taxonomyGroupsForSubjects(subjects: string[]): TaxonomyGroup[] {
  const selected = new Set(subjects.length ? subjects : ["Geography", "Environment"]);
  return taxonomyGroups.filter((group) => selected.has(group.subject));
}
export function taxonomyNodesForSubjects(subjects: string[]): TaxonomyNode[] {
  const selected=new Set(subjects.map(canonicalSubjectLabel));
  return [...taxonomyNodes,...prelimsPaths as TaxonomyNode[]].filter(node=>!selected.size||selected.has(canonicalSubjectLabel(node.subject)));
}
const prelimsById=new Map(prelimsPaths.map(node=>[node.id,node as TaxonomyNode]));
export function taxonomyNode(id: string): TaxonomyNode | undefined { return nodeById.get(id)||prelimsById.get(id); }
export function validTaxonomyIds(ids: unknown, subjects: string[] = []): string[] {
  const allowed = new Set(taxonomyNodesForSubjects(subjects).map((node) => node.id));
  return Array.isArray(ids) ? [...new Set(ids.filter((value): value is string => typeof value === "string" && allowed.has(value)))] : [];
}
export function chapterSubtopicIds(head: string, chapter: string): string[] {
  return taxonomyNodes.filter((node) => node.head === head && node.chapter === chapter).sort((a, b) => a.subtopicOrder - b.subtopicOrder).map((node) => node.id);
}
export function taxonomyIdForPath(head: string, chapter: string, subtopic: string): string { return `${slug(head)}/${slug(chapter)}/${slug(subtopic)}`; }

export type QuestionTaxonomy = { taxonomyVersion: string; taxonomyHead: string; taxonomyChapter: string; taxonomySubtopic: string; taxonomyId: string; taxonomyStatus: "mapped" };
const questionMapParts = [questionMap01, questionMap02, questionMap03, questionMap04, questionMap05, questionMap06];
const legacyMappedIdByQuestion = new Map(questionMapParts.flatMap((part) => Object.entries(part.pairs)).map(([questionId, taxonomyIndex]) => [questionId, questionMapParts[0].ids[taxonomyIndex]]));
const physicalRecords = physicalReview.records;
const physicalIdByQuestion = new Map(physicalRecords.map((record) => [record.questionId, record.newTaxonomyId]));
const oldPhysicalQuestionSets = new Map<string, string[]>();
const oldPhysicalNewIds = new Map<string, Set<string>>();
for (const record of physicalRecords) {
  const ids = oldPhysicalQuestionSets.get(record.oldTaxonomyId) || [];
  ids.push(record.questionId);
  oldPhysicalQuestionSets.set(record.oldTaxonomyId, ids);
  const targets = oldPhysicalNewIds.get(record.oldTaxonomyId) || new Set<string>();
  targets.add(record.newTaxonomyId);
  oldPhysicalNewIds.set(record.oldTaxonomyId, targets);
}
export const historicalPhysicalQuestionSets = Object.fromEntries([...oldPhysicalQuestionSets].map(([id, ids]) => [id, ids.sort()]));
export const historicalPhysicalTargets = Object.fromEntries([...oldPhysicalNewIds].map(([id, ids]) => [id, [...ids]]));

export function taxonomyIdForQuestion(questionId: string): string | undefined {
  const physical = physicalIdByQuestion.get(questionId);
  if (physical) return physical;
  const legacy = legacyMappedIdByQuestion.get(questionId);
  return legacy && nodeById.has(legacy) ? legacy : undefined;
}
export function taxonomyIdForLegacyQuestion(question: { id: string; exam: string; subject: string; subtopic: string }): string | undefined {
  const physical = physicalIdByQuestion.get(question.id);
  if (physical) return physical;
  if (question.exam !== "CDS" || question.subject !== "Geography") return undefined;
  const questionAliases = cdsGeographyAliases.questions as Record<string, string>;
  const subtopicAliases = cdsGeographyAliases.subtopics as Record<string, string>;
  const canonicalLabel = questionAliases[question.id] || subtopicAliases[question.subtopic];
  return canonicalLabel ? nodeBySubtopic.get(canonicalLabel)?.id : undefined;
}
