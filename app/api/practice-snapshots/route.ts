import { NextResponse } from "next/server";
import {readFrozenScopes} from '../../../lib/practice-draft-membership';
import {legacySnapshotQuestionIds} from '../../../lib/legacy-placement-bridge';
import { questionContentRevision,questionReview } from '../../../lib/question-review';
import { getPreparationInventory, preparationQuestionIds, getPreparationQuestions, preparationPathResolver } from '../../../lib/preparation-catalog';
import { isPreparationExam } from '../../../lib/preparation-exams';
import { PYQ_EXAMS, getExamQuestions, getLegacyQuestionPath, getSubjectPracticeInventory, isPyqExam, pyqQuestions, type PracticeInventoryNode, type PyqExam } from "../../../lib/pyq-catalog";
import type { PracticeFrozenScope, PracticePathSelection, PracticeQuestion, PracticeRecipe, PracticeRecipeV2, PracticeRecipeV3, PracticeRecipeV4, PracticeSnapshot } from "../../../lib/practice-types";

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
  if (input.preparationExam !== undefined && (!isPreparationExam(input.preparationExam) || input.version !== 4)) {
    return NextResponse.json({ error: 'Choose a valid preparation exam with a V4 recipe.' }, { status: 400 });
  }
  const preparationExam = isPreparationExam(input.preparationExam) ? input.preparationExam : undefined;
  if ("version" in input && input.version !== 2 && input.version !== 3 && input.version !== 4) {
    return NextResponse.json({ error: "Choose a supported practice recipe version." }, { status: 400 });
  }
  if(input.frozenScopes!==undefined&&input.version!==4)return NextResponse.json({error:'Exact question membership requires a V4 recipe.'},{status:400});

  const strict = input.version === 3 || input.version === 4;
  if (strict && input.count !== "all" && (typeof input.count !== "number" || !Number.isInteger(input.count) || input.count < 1 || input.count > 5000)) {
    return NextResponse.json({ error: "Question count must be a positive whole number, or all." }, { status: 400 });
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

  if (input.version === 2 || input.version === 3 || input.version === 4) {
    const inventory = preparationExam ? getPreparationInventory(preparationExam) : getSubjectPracticeInventory(input.version === 4);
    const preparationIds = preparationExam ? preparationQuestionIds(inventory) : undefined;
    const questionPool = preparationExam ? getPreparationQuestions(inventory) : pyqQuestions;
    const preparationSubjectIds = new Map<string, Set<string>>();
    if (preparationExam) for (const leaf of inventory.nodes) if (leaf.kind === 'subtopic') {
      const ids = preparationSubjectIds.get(leaf.subjectId) || new Set<string>();
      for (const exam of PYQ_EXAMS) for (const id of leaf.questionIdsByExam?.[exam] || []) ids.add(id);
      preparationSubjectIds.set(leaf.subjectId, ids);
    }
    if(input.version===4&&input.taxonomyVersion!==undefined&&typeof input.taxonomyVersion!=='string')return NextResponse.json({error:'Choose a valid syllabus version.'},{status:400});
    if(input.version===4&&input.frozenScopes===undefined&&input.taxonomyVersion!==undefined&&input.taxonomyVersion!==inventory.taxonomyVersion)return NextResponse.json({error:'The syllabus has changed. Refresh the library before starting a new test.'},{status:409});
    const availableSubjects = new Set(inventory.subjects.map((subject) => subject.id));
    if (strict && (!Array.isArray(input.subjectIds) || !input.subjectIds.length || input.subjectIds.some((value: unknown) => typeof value !== "string" || !availableSubjects.has(value)))) {
      return NextResponse.json({ error: "Choose valid subject IDs." }, { status: 400 });
    }
    const subjectIds = Array.isArray(input.subjectIds)
      ? [...new Set(input.subjectIds.filter((value): value is string => typeof value === "string" && availableSubjects.has(value)))]
      : [];
    const allowedSubjects = new Set(subjectIds);
    const subtopics = new Map(inventory.nodes.filter((node) => node.kind === "subtopic").map((node) => [node.id, node]));
    let frozenScopes:PracticeFrozenScope[]=[];
    if(input.frozenScopes!==undefined) {
      try {frozenScopes=readFrozenScopes(input.frozenScopes);} catch {return NextResponse.json({error:'Choose a valid saved question membership.'},{status:400});}
      const eligibleById=new Map(questionPool.map(question=>[question.id,question]));
      for(const scope of frozenScopes) {
        if(!allowedSubjects.has(scope.subjectId)||(!subtopics.has(scope.id)&&!scope.id.startsWith('draft:'))||(subtopics.has(scope.id)&&subtopics.get(scope.id)!.subjectId!==scope.subjectId))return NextResponse.json({error:'Every saved scope must belong to a selected subject.'},{status:400});
        for(const exam of PYQ_EXAMS)for(const id of scope.questionIdsByExam[exam]) {
          const question=eligibleById.get(id);
          if(!question)return NextResponse.json({error:'Some saved questions are no longer eligible. Refresh the library to review the selection.'},{status:409});
          if(question.exam!==exam)return NextResponse.json({error:'A saved question has a different examination source.'},{status:400});
          if (preparationExam && !preparationSubjectIds.get(scope.subjectId)?.has(id)) {
            return NextResponse.json({ error: 'A saved question does not belong to this preparation subject.' }, { status: 400 });
          }
        }
      }
    }
    const frozenById=new Map(frozenScopes.map(scope=>[scope.id,scope]));
    const pathExams = new Map<string, Set<PyqExam>>();
    const legacyPathExams = new Map<string, Set<PyqExam>>();

    if (strict && (!Array.isArray(input.paths) || !input.paths.length)) {
      return NextResponse.json({ error: "Choose at least one subtopic and examination source." }, { status: 400 });
    }
    if (Array.isArray(input.paths)) {
      for (const candidate of input.paths as unknown[]) {
        if (!isRecord(candidate) || typeof candidate.subtopicId !== "string" || !Array.isArray(candidate.exams)) {
          if (strict) return NextResponse.json({ error: "Choose valid subtopic paths and examination sources." }, { status: 400 });
          continue;
        }
        const frozen=frozenById.get(candidate.subtopicId);
        if(input.frozenScopes!==undefined&&!frozen)return NextResponse.json({error:'Every saved path requires exact question membership.'},{status:400});
        if(frozen) {
          if(!candidate.exams.length||candidate.exams.some(exam=>!isExactExam(exam)||!frozen.questionIdsByExam[exam].length))return NextResponse.json({error:'Choose valid examination sources for the saved scope.'},{status:400});
          const sources=pathExams.get(frozen.id)||new Set<PyqExam>();
          for(const exam of candidate.exams as PyqExam[])sources.add(exam);
          pathExams.set(frozen.id,sources);continue;
        }
        const scopeId=input.version===4&&input.taxonomyVersion!==inventory.taxonomyVersion?(inventory.legacyRestoreAliases?.[candidate.subtopicId]||candidate.subtopicId):candidate.subtopicId;
        const historicalIds = inventory.legacyQuestionSets[scopeId];
        const isHistoricalPath = Boolean(historicalIds);
        const resolvedIds = isHistoricalPath ? [] : resolveSubtopics(scopeId, subtopics, inventory.legacyAliases, !strict);
        const nodes = resolvedIds.map((id) => subtopics.get(id)!);
        const historicalQuestions = isHistoricalPath
          ? pyqQuestions.filter((question) => historicalIds.includes(question.id))
          : [];
        if ((!nodes.length && !historicalQuestions.length) || nodes.some((node) => !allowedSubjects.has(node.subjectId)) || (historicalQuestions.length && !allowedSubjects.has("subject:geography"))) {
          if (strict) return NextResponse.json({ error: "Every subtopic must belong to a selected subject." }, { status: 400 });
          continue;
        }
        if (strict && (!candidate.exams.length || candidate.exams.some((exam: unknown) => !isExactExam(exam)))) {
          return NextResponse.json({ error: "Choose valid examination sources for every subtopic." }, { status: 400 });
        }
        if (isHistoricalPath) {
          const exams = legacyPathExams.get(scopeId) || new Set<PyqExam>();
          for (const exam of candidate.exams as unknown[]) {
            if (!isExactExam(exam)) continue;
            if (!historicalQuestions.some((question) => question.exam === exam)) {
              if (strict) return NextResponse.json({ error: "An examination source has no questions for its selected historical subtopic." }, { status: 400 });
              continue;
            }
            exams.add(exam);
          }
          if (exams.size) legacyPathExams.set(scopeId, exams);
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

    if (!subjectIds.length || (!pathExams.size && !legacyPathExams.size)) {
      return NextResponse.json({ error: "Choose at least one subject and subtopic." }, { status: 400 });
    }
    if(frozenScopes.some(scope=>!pathExams.has(scope.id)))return NextResponse.json({error:'Saved memberships must match the selected paths.'},{status:400});

    const selectedIds=new Set<string>();
    if(input.version===4)for(const [id,exams]of pathExams)for(const exam of exams)for(const questionId of (frozenById.get(id)?.questionIdsByExam[exam]||subtopics.get(id)?.questionIdsByExam?.[exam]||[]))selectedIds.add(questionId);
    eligible = questionPool.filter((question) => {
      if (preparationIds && !preparationIds.has(question.id)) return false;
      if(input.version===3&&!legacySnapshotQuestionIds.has(question.id))return false;
      const path = getLegacyQuestionPath(question);
      if (input.version===4?selectedIds.has(question.id):Boolean(path&&pathExams.get(path.subtopicId)?.has(question.exam))) return true;
      return [...legacyPathExams].some(([legacyId, exams]) => exams.has(question.exam) && inventory.legacyQuestionSets[legacyId].includes(question.id));
    });

    const paths: PracticePathSelection[] = [...pathExams.entries(), ...legacyPathExams.entries()].map(([subtopicId, exams]) => ({
      subtopicId,
      exams: PYQ_EXAMS.filter((exam) => exams.has(exam)),
    }));
    recipe = strict
      ? { version: input.version === 4 ? 4 : 3, ...(input.version===4?{taxonomyVersion:inventory.taxonomyVersion,...(preparationExam?{preparationExam}:{}),...(input.frozenScopes!==undefined?{frozenScopes}:{} )}:{}), subjectIds, paths, count: requestedCount, order, durationMinutes: typeof input.durationMinutes === "number" ? input.durationMinutes : null } satisfies PracticeRecipeV3 | PracticeRecipeV4
      : { version: 2, subjectIds, paths, count: requestedCount, order } satisfies PracticeRecipeV2;
  } else {
    if (!isPyqExam(input.exam)) return NextResponse.json({ error: "Choose a valid examination." }, { status: 400 });
    const exam = input.exam.toUpperCase() as PyqExam;
    const all = getExamQuestions(exam);
    const availableYears = [...new Set(all.map((question) => question.year))].sort((a, b) => a - b);
    const yearFrom = Number(input.yearFrom) || availableYears[0];
    const yearTo = Number(input.yearTo) || availableYears.at(-1)!;
    const taxonomyIds = Array.isArray(input.taxonomyIds) ? [...new Set(input.taxonomyIds.filter((value): value is string => typeof value === "string"))] : [];
    const inventory = getSubjectPracticeInventory(false);
    const subtopics = new Map(inventory.nodes.filter((node) => node.kind === "subtopic").map((node) => [node.id, node]));
    const selectedIds = new Set(taxonomyIds.flatMap((id) => resolveSubtopics(id, subtopics, inventory.legacyAliases, true)));
    eligible = getExamQuestions(exam, yearFrom, yearTo).filter((question) => {
      if (!taxonomyIds.length) return true;
      const path = getLegacyQuestionPath(question);
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

  const resolvePath=preparationPathResolver(preparationExam?getPreparationInventory(preparationExam):undefined);
  const questions: PracticeQuestion[] = eligible.map((question) => {
    const path = resolvePath(question);
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
      ...(question.sharedContext?{sharedContext:question.sharedContext}:{}),
      ...(question.underlined?.length?{underlined:question.underlined}:{}),
      options: question.options,
      sourceTextHash: question.sourceTextHash,
      contentRevision: questionContentRevision(question.id),
      ...(['official-provisional','reasoned-verified'].includes(questionReview(question.id)?.status??'')?{answerKeyStatus:questionReview(question.id)!.status as 'official-provisional'|'reasoned-verified'}:{}),
      figure: question.requiresFigure && question.figureKey ? {
        src: question.figureKey,
        alt: question.figureAlt || "Original figure supplied with this question",
      } : undefined,
    };
  });
  const snapshot: PracticeSnapshot = { id, contentVersion: "pyq-2026-10-physical-v1.2", createdAt: new Date().toISOString(), recipe, matchingCount, questions };
  return NextResponse.json(snapshot, { status: 201 });
}
