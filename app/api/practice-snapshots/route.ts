import { NextResponse } from "next/server";
import { PYQ_EXAMS, getExamQuestions, getQuestionPath, getSubjectPracticeInventory, isPyqExam, pyqQuestions, type PyqExam } from "../../../lib/pyq-catalog";
import type { LegacyPracticeRecipe, PracticePathSelection, PracticeQuestion, PracticeRecipe, PracticeRecipeV2, PracticeSnapshot } from "../../../lib/practice-types";

function seededShuffle<T>(items: T[], seed: string) {
  let state = [...seed].reduce((value, character) => Math.imul(value ^ character.charCodeAt(0), 2654435761), 2166136261) >>> 0;
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as Partial<PracticeRecipe> | null;
  if (!input) return NextResponse.json({ error: "Choose at least one subject." }, { status: 400 });

  const order = input.order === "shuffle" ? "shuffle" : "newest";
  const requestedCount = input.count === "all" ? "all" : Math.max(1, Math.min(100, Number(input.count) || 10));
  let recipe: PracticeRecipe;
  let eligible = [] as typeof pyqQuestions;

  if ("version" in input && input.version === 2) {
    const inventory = getSubjectPracticeInventory();
    const subjectIds = Array.isArray(input.subjectIds)
      ? [...new Set(input.subjectIds.filter((value): value is string => typeof value === "string" && inventory.subjects.some((subject) => subject.id === value)))]
      : [];
    const allowedSubjects = new Set(subjectIds);
    const subtopics = new Map(inventory.nodes.filter((node) => node.kind === "subtopic").map((node) => [node.id, node]));
    const pathExams = new Map<string, Set<PyqExam>>();

    if (Array.isArray(input.paths)) {
      for (const candidate of input.paths as PracticePathSelection[]) {
        const node = candidate && typeof candidate.subtopicId === "string" ? subtopics.get(candidate.subtopicId) : undefined;
        if (!node || !allowedSubjects.has(node.subjectId) || !Array.isArray(candidate.exams)) continue;
        const exams = pathExams.get(node.id) || new Set<PyqExam>();
        candidate.exams.forEach((exam) => {
          if (isPyqExam(exam) && node.examCounts[exam.toUpperCase() as PyqExam] > 0) exams.add(exam.toUpperCase() as PyqExam);
        });
        if (exams.size) pathExams.set(node.id, exams);
      }
    }

    if (!subjectIds.length || !pathExams.size) {
      return NextResponse.json({ error: "Choose at least one subject and subtopic." }, { status: 400 });
    }

    eligible = pyqQuestions.filter((question) => {
      const path = getQuestionPath(question);
      return Boolean(path && pathExams.get(path.subtopicId)?.has(question.exam));
    });

    const paths: PracticePathSelection[] = [...pathExams.entries()].map(([subtopicId, exams]) => ({
      subtopicId,
      exams: PYQ_EXAMS.filter((exam) => exams.has(exam)),
    }));
    recipe = { version: 2, subjectIds, paths, count: requestedCount, order } satisfies PracticeRecipeV2;
  } else {
    const legacy = input as Partial<LegacyPracticeRecipe>;
    if (!legacy.exam || !isPyqExam(legacy.exam)) return NextResponse.json({ error: "Choose a valid examination." }, { status: 400 });
    const exam = legacy.exam.toUpperCase() as PyqExam;
    const all = getExamQuestions(exam);
    const availableYears = [...new Set(all.map((question) => question.year))].sort((a, b) => a - b);
    const yearFrom = Number(legacy.yearFrom) || availableYears[0];
    const yearTo = Number(legacy.yearTo) || availableYears.at(-1)!;
    const taxonomyIds = Array.isArray(legacy.taxonomyIds) ? [...new Set(legacy.taxonomyIds.filter((value): value is string => typeof value === "string"))] : [];
    eligible = getExamQuestions(exam, yearFrom, yearTo).filter((question) => {
      if (!taxonomyIds.length) return true;
      const path = getQuestionPath(question);
      return Boolean(path && taxonomyIds.includes(path.subtopicId));
    });
    recipe = { exam, yearFrom, yearTo, taxonomyIds, count: requestedCount, order };
  }

  eligible.sort((a, b) => b.year - a.year || a.paper.localeCompare(b.paper) || a.questionNumber - b.questionNumber);
  if (!eligible.length) return NextResponse.json({ error: "No PYQs match this selection." }, { status: 409 });
  if (requestedCount !== "all" && requestedCount > eligible.length) {
    return NextResponse.json({ error: `Only ${eligible.length} PYQs are available for this selection.`, available: eligible.length }, { status: 409 });
  }
  const id = crypto.randomUUID();
  if (order === "shuffle") eligible = seededShuffle(eligible, id);
  if (requestedCount !== "all") eligible = eligible.slice(0, requestedCount);

  const questions: PracticeQuestion[] = eligible.map((question) => {
    const path = getQuestionPath(question);
    return {
      id: question.id,
      exam: question.exam,
      year: question.year,
      paper: question.paper,
      questionNumber: question.questionNumber,
      subject: path?.subject || question.subject,
      topic: path?.topic || question.taxonomyChapter || question.topic,
      subtopic: path?.subtopic || question.taxonomySubtopic || question.subtopic,
      promptLines: question.promptLines,
      options: question.options,
      sourceTextHash: question.sourceTextHash,
    };
  });
  const snapshot: PracticeSnapshot = { id, contentVersion: "pyq-2026-08-subject-v2", createdAt: new Date().toISOString(), recipe, questions };
  return NextResponse.json(snapshot, { status: 201 });
}
