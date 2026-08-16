import { NextResponse } from "next/server";
import { getExamQuestions, getQuestionPath, isPyqExam, type PyqExam } from "../../../lib/pyq-catalog";
import type { PracticeQuestion, PracticeRecipe, PracticeSnapshot } from "../../../lib/practice-types";

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
  if (!input || !input.exam || !isPyqExam(input.exam)) {
    return NextResponse.json({ error: "Choose a valid examination." }, { status: 400 });
  }
  const exam = input.exam.toUpperCase() as PyqExam;
  const all = getExamQuestions(exam);
  const availableYears = [...new Set(all.map((question) => question.year))].sort((a, b) => a - b);
  const yearFrom = Number(input.yearFrom) || availableYears[0];
  const yearTo = Number(input.yearTo) || availableYears.at(-1)!;
  const taxonomyIds = Array.isArray(input.taxonomyIds) ? [...new Set(input.taxonomyIds.filter((value): value is string => typeof value === "string"))] : [];
  const order = input.order === "shuffle" ? "shuffle" : "newest";
  const count = input.count === "all" ? "all" : Math.max(1, Math.min(100, Number(input.count) || 10));
  let eligible = getExamQuestions(exam, yearFrom, yearTo).filter((question) => {
    if (!taxonomyIds.length) return true;
    const path = getQuestionPath(question);
    return Boolean(path && taxonomyIds.includes(path.subtopicId));
  });
  eligible.sort((a, b) => b.year - a.year || a.paper.localeCompare(b.paper) || a.questionNumber - b.questionNumber);
  const id = crypto.randomUUID();
  if (order === "shuffle") eligible = seededShuffle(eligible, id);
  if (count !== "all") eligible = eligible.slice(0, count);
  if (!eligible.length) return NextResponse.json({ error: "No PYQs match this selection." }, { status: 409 });

  const questions: PracticeQuestion[] = eligible.map((question) => ({
    id: question.id,
    exam: question.exam,
    year: question.year,
    paper: question.paper,
    questionNumber: question.questionNumber,
    subject: question.subject,
    topic: question.taxonomyChapter || question.topic,
    subtopic: question.taxonomySubtopic || question.subtopic,
    promptLines: question.promptLines,
    options: question.options,
    sourceTextHash: question.sourceTextHash,
  }));
  const recipe: PracticeRecipe = { exam, yearFrom, yearTo, taxonomyIds, count, order };
  const snapshot: PracticeSnapshot = { id, contentVersion: "pyq-2026-08", createdAt: new Date().toISOString(), recipe, questions };
  return NextResponse.json(snapshot, { status: 201 });
}
