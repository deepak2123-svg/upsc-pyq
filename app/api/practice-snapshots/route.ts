import { NextResponse } from "next/server";
import { PYQ_EXAMS, getExamQuestions, getQuestionPath, getSubjectPracticeInventory, isPyqExam, pyqQuestions, type PracticeInventoryNode, type PyqExam } from "../../../lib/pyq-catalog";
import type { PracticePathSelection, PracticeQuestion, PracticeRecipe, PracticeRecipeV2, PracticeRecipeV3, PracticeSnapshot } from "../../../lib/practice-types";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExactExam(value: unknown): value is PyqExam {
  return typeof value === "string" && PYQ_EXAMS.includes(value as PyqExam);
}

function resolveSubtopics(id: string, subtopics: Map<string, PracticeInventoryNode>, aliases: Record<string, string[]>, allowLegacy: boolean) {
  if (subtopics.has(id)) return [id];
  const candidates = allowLegacy && Object.hasOwn(aliases, id) ? aliases[id] : [];
  return candidates.filter((value) => subtopics.has(value));
}

export async function POST(request: Request) {
  const input: unknown = await request.json().catch(() => null);
  if (!isRecord(input)) return NextResponse.json({ error: "Choose at least one subject." }, { status: 400 });
  if ("version" in input && input.version !== 2 && input.version !== 3) {
    return NextResponse.json({ error: "Choose a supported practice recipe version." }, { status: 400 });
  }

  const strict = input.version === 3;
  if (strict && input.count !== "all" && (typeof input.count !== "number" || !Number.isInteger(input.count) || input.count < 1 || input.count > 100)) {
    return NextResponse.json({ error: "Question count must be an integer from 1 to 100, or all." }, { status: 400 });
  }
  if (strict && input.order !== "newest" && input.order !== "shuffle") {
    return NextResponse.json({ error: "Choose newest or shuffle order." }, { status: 400 });
  }
  if (strict && input.durationMinutes !== undefined && input.durationMinutes !== null && (typeof input.durationMinutes !== "number" || !Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 720)) {
    return NextResponse.json({ error: "Test duration must be a whole number of minutes from 1 to 720, or null for untimed." }, { status: 400 });
  }

  const order = input.order === "shuffle" ? "shuffle" : "newest";
  const requestedCount: number | "all" = input.count === "all" ? "all" : strict
    ? input.count as number
    : Math.max(1, Math.min(100, Number(input.count) || 10));
  let recipe: PracticeRecipe;
  let eligible = [] as typeof pyqQuestions;

  if (input.version === 2 || input.version === 3) {
    const inventory = getSubjectPracticeInventory();
    const availableSubjects = new Set(inventory.subjects.map((subject) => subject.id));
    if (strict && (!Array.isArray(input.subjectIds) || !input.subjectIds.length || input.subjectIds.some((value: unknown) => typeof value !== "string" || !availableSubjects.has(value)))) {
      return NextResponse.json({ error: "Choose valid subject IDs." }, { status: 400 });
    }
    const subjectIds = Array.isArray(input.subjectIds)
      ? [...new Set(input.subjectIds.filter((value): value is string => typeof value === "string" && availableSubjects.has(value)))]
      : [];
    const allowedSubjects = new Set(subjectIds);
    const subtopics = new Map(inventory.nodes.filter((node) => node.kind === "subtopic").map((node) => [node.id, node]));
    const pathExams = new Map<string, Set<PyqExam>>();

    if (strict && (!Array.isArray(input.paths) || !input.paths.length)) {
      return NextResponse.json({ error: "Choose at least one subtopic and examination source." }, { status: 400 });
    }
    if (Array.isArray(input.paths)) {
      for (const candidate of input.paths as unknown[]) {
        if (!isRecord(candidate) || typeof candidate.subtopicId !== "string" || !Array.isArray(candidate.exams)) {
          if (strict) return NextResponse.json({ error: "Choose valid subtopic paths and examination sources." }, { status: 400 });
          continue;
        }
        const resolvedIds = resolveSubtopics(candidate.subtopicId, subtopics, inventory.legacyAliases, !strict);
        const nodes = resolvedIds.map((id) => subtopics.get(id)!);
        if (!nodes.length || nodes.some((node) => !allowedSubjects.has(node.subjectId))) {
          if (strict) return NextResponse.json({ error: "Every subtopic must belong to a selected subject." }, { status: 400 });
          continue;
        }
        if (strict && (!candidate.exams.length || candidate.exams.some((exam: unknown) => !isExactExam(exam)))) {
          return NextResponse.json({ error: "Choose valid examination sources for every subtopic." }, { status: 400 });
        }
        for (const node of nodes) {
          if (strict && candidate.exams.some((exam) => node.examCounts[exam as PyqExam] === 0)) {
            return NextResponse.json({ error: "An examination source has no questions for its selected subtopic." }, { status: 400 });
          }
          const exams = pathExams.get(node.id) || new Set<PyqExam>();
          candidate.exams.forEach((exam: unknown) => {
            if (isPyqExam(exam)) {
              const normalized = exam.toUpperCase() as PyqExam;
              if (node.examCounts[normalized] > 0) exams.add(normalized);
            }
          });
          if (exams.size) pathExams.set(node.id, exams);
        }
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
    recipe = strict
      ? { version: 3, subjectIds, paths, count: requestedCount, order, durationMinutes: typeof input.durationMinutes === "number" ? input.durationMinutes : null } satisfies PracticeRecipeV3
      : { version: 2, subjectIds, paths, count: requestedCount, order } satisfies PracticeRecipeV2;
  } else {
    if (!isPyqExam(input.exam)) return NextResponse.json({ error: "Choose a valid examination." }, { status: 400 });
    const exam = input.exam.toUpperCase() as PyqExam;
    const all = getExamQuestions(exam);
    const availableYears = [...new Set(all.map((question) => question.year))].sort((a, b) => a - b);
    const yearFrom = Number(input.yearFrom) || availableYears[0];
    const yearTo = Number(input.yearTo) || availableYears.at(-1)!;
    const taxonomyIds = Array.isArray(input.taxonomyIds) ? [...new Set(input.taxonomyIds.filter((value): value is string => typeof value === "string"))] : [];
    const inventory = getSubjectPracticeInventory();
    const subtopics = new Map(inventory.nodes.filter((node) => node.kind === "subtopic").map((node) => [node.id, node]));
    const selectedIds = new Set(taxonomyIds.flatMap((id) => resolveSubtopics(id, subtopics, inventory.legacyAliases, true)));
    eligible = getExamQuestions(exam, yearFrom, yearTo).filter((question) => {
      if (!taxonomyIds.length) return true;
      const path = getQuestionPath(question);
      return Boolean(path && selectedIds.has(path.subtopicId));
    });
    recipe = { exam, yearFrom, yearTo, taxonomyIds, count: requestedCount, order };
  }

  const matchingCount = eligible.length;
  eligible.sort((a, b) => b.year - a.year || a.paper.localeCompare(b.paper) || a.questionNumber - b.questionNumber);
  if (!matchingCount) return NextResponse.json({ error: "No PYQs match this selection." }, { status: 409 });
  if (requestedCount !== "all" && requestedCount > matchingCount) {
    return NextResponse.json({ error: "Only " + matchingCount + " PYQs are available for this selection.", available: matchingCount }, { status: 409 });
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
      section: path?.head || question.taxonomyHead || undefined,
      topic: path?.topic || question.taxonomyChapter || question.topic,
      subtopic: path?.subtopic || question.taxonomySubtopic || question.subtopic,
      promptLines: question.promptLines,
      options: question.options,
      sourceTextHash: question.sourceTextHash,
    };
  });
  const snapshot: PracticeSnapshot = { id, contentVersion: "pyq-2026-08-subject-v3", createdAt: new Date().toISOString(), recipe, matchingCount, questions };
  return NextResponse.json(snapshot, { status: 201 });
}
