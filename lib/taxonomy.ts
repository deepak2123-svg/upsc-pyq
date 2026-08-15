import taxonomySource from "../content/taxonomy/upsc-geography-v1.1.json";
import questionMap01 from "../content/taxonomy/question-map-01.json";
import questionMap02 from "../content/taxonomy/question-map-02.json";
import questionMap03 from "../content/taxonomy/question-map-03.json";
import questionMap04 from "../content/taxonomy/question-map-04.json";
import questionMap05 from "../content/taxonomy/question-map-05.json";
import questionMap06 from "../content/taxonomy/question-map-06.json";

export const TAXONOMY_VERSION = taxonomySource.version;
export type TaxonomySubject = "Geography" | "Environment";
export type TaxonomyHead = { name: string; chapters: Record<string, string[]> };
export type TaxonomyGroup = TaxonomyHead & { subject: TaxonomySubject };
export type TaxonomyNode = { id: string; subject: TaxonomySubject; head: string; chapter: string; subtopic: string };

const slug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const subjectForHead = (head: string): TaxonomySubject => head === "Environment & Ecology" ? "Environment" : "Geography";

export const taxonomyGroups: TaxonomyGroup[] = taxonomySource.meta_heads.map((head) => ({ ...head, subject: subjectForHead(head.name) }));
export const taxonomyNodes: TaxonomyNode[] = taxonomyGroups.flatMap((group) => Object.entries(group.chapters).flatMap(([chapter, subtopics]) => subtopics.map((subtopic) => ({
  id: `${slug(group.name)}/${slug(chapter)}/${slug(subtopic)}`,
  subject: group.subject,
  head: group.name,
  chapter,
  subtopic,
}))));
const nodeById = new Map(taxonomyNodes.map((node) => [node.id, node]));

export function taxonomyGroupsForSubjects(subjects: string[]): TaxonomyGroup[] {
  const selected = new Set(subjects.length ? subjects : ["Geography", "Environment"]);
  return taxonomyGroups.filter((group) => selected.has(group.subject));
}

export function taxonomyNodesForSubjects(subjects: string[]): TaxonomyNode[] {
  const allowed = new Set(taxonomyGroupsForSubjects(subjects).map((group) => group.name));
  return taxonomyNodes.filter((node) => allowed.has(node.head));
}

export function taxonomyNode(id: string): TaxonomyNode | undefined { return nodeById.get(id); }
export function validTaxonomyIds(ids: unknown, subjects: string[] = []): string[] {
  const allowed = new Set(taxonomyNodesForSubjects(subjects).map((node) => node.id));
  return Array.isArray(ids) ? [...new Set(ids.filter((value): value is string => typeof value === "string" && allowed.has(value)))] : [];
}
export function chapterSubtopicIds(head: string, chapter: string): string[] {
  return taxonomyNodes.filter((node) => node.head === head && node.chapter === chapter).map((node) => node.id);
}
export function taxonomyIdForPath(head: string, chapter: string, subtopic: string): string {
  return `${slug(head)}/${slug(chapter)}/${slug(subtopic)}`;
}

export type QuestionTaxonomy = { taxonomyVersion: string; taxonomyHead: string; taxonomyChapter: string; taxonomySubtopic: string; taxonomyId: string; taxonomyStatus: "mapped" };

const questionMapParts = [questionMap01, questionMap02, questionMap03, questionMap04, questionMap05, questionMap06];
const questionTaxonomyById = new Map(questionMapParts.flatMap((part) => Object.entries(part.pairs)).map(([questionId, taxonomyIndex]) => [questionId, questionMapParts[0].ids[taxonomyIndex]]));
export function taxonomyIdForQuestion(questionId: string): string | undefined { return questionTaxonomyById.get(questionId); }
