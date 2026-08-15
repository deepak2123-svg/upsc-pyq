"use client";

import { useEffect, useMemo, useState } from "react";
import questionBank from "../content/question-bank.json";
import { signInWithGoogle, signOut } from "../lib/auth/client";
import { getSupabaseBrowser } from "../lib/supabase/client";
import { TAXONOMY_VERSION, chapterSubtopicIds, taxonomyGroupsForSubjects, taxonomyIdForQuestion, taxonomyNode, taxonomyNodesForSubjects } from "../lib/taxonomy";

type Screen = "dashboard" | "builder" | "attempts" | "attempt" | "results" | "admin" | "legal";
type Mode = "Exam" | "Practice";
type QuestionDifficulty = "Easy" | "Moderate" | "Hard";
type Difficulty = "All types" | QuestionDifficulty | "Mixed";

type Question = {
  id: string;
  origin: "pyq" | "generated";
  sourceTextLocked: boolean;
  sourceText: string;
  sourceTextHash: string;
  source: {
    dataset: string;
    year: number | null;
    paper: string;
    questionNumber: number;
    answerStatus: string;
    answerSource: string | null;
    rawQuestionText: string | null;
  };
  subject: string;
  topic: string;
  subtopic: string;
  difficulty: QuestionDifficulty;
  year: number | null;
  exam: string;
  paper: string;
  questionNumber: number;
  promptLines: string[];
  options: Record<string, string>;
  answer?: string;
  correctOption?: string;
  explanation: string;
  requiresFigure: boolean;
  taxonomyVersion?: string | null;
  taxonomyHead?: string | null;
  taxonomyChapter?: string | null;
  taxonomySubtopic?: string | null;
  taxonomyId?: string | null;
};

const questions = (questionBank.questions as Question[]).map((question) => {
  const taxonomyId = question.taxonomyId ?? taxonomyIdForQuestion(question.id) ?? null;
  const node = taxonomyId ? taxonomyNode(taxonomyId) : undefined;
  return {
    ...question,
    taxonomyVersion: question.taxonomyVersion ?? (node ? TAXONOMY_VERSION : null),
    taxonomyHead: question.taxonomyHead ?? node?.head ?? null,
    taxonomyChapter: question.taxonomyChapter ?? node?.chapter ?? null,
    taxonomySubtopic: question.taxonomySubtopic ?? node?.subtopic ?? null,
    taxonomyId,
  };
});

function mapServerQuestion(value: Record<string, unknown>): Question {
  return {
    id: String(value.id),
    origin: value.origin === "generated" ? "generated" : "pyq",
    sourceTextLocked: Boolean(value.sourceTextLocked ?? true),
    sourceText: String(value.stem ?? ""),
    sourceTextHash: String(value.sourceTextHash ?? ""),
    source: (value.source as Question["source"]) ?? { dataset: "", year: null, paper: "", questionNumber: 0, answerStatus: "", answerSource: null, rawQuestionText: null },
    subject: String(value.subject ?? ""),
    topic: String(value.topic ?? ""),
    subtopic: String(value.subtopic ?? ""),
    difficulty: (value.difficulty === "Easy" || value.difficulty === "Hard" ? value.difficulty : "Moderate") as QuestionDifficulty,
    year: typeof value.year === "number" ? value.year : null,
    exam: String(value.exam ?? ""),
    paper: String(value.paper ?? ""),
    questionNumber: Number(value.sourceQuestionNumber ?? 0),
    promptLines: Array.isArray(value.promptLines) ? value.promptLines.map(String) : [String(value.stem ?? "")],
    options: (value.options as Record<string, string>) ?? {},
    answer: typeof value.correctOption === "string" ? value.correctOption : undefined,
    correctOption: typeof value.correctOption === "string" ? value.correctOption : undefined,
    explanation: typeof value.explanation === "string" ? value.explanation : "",
    requiresFigure: Boolean(value.requiresFigure),
    taxonomyVersion: typeof value.taxonomyVersion === "string" ? value.taxonomyVersion : null,
    taxonomyHead: typeof value.taxonomyHead === "string" ? value.taxonomyHead : null,
    taxonomyChapter: typeof value.taxonomyChapter === "string" ? value.taxonomyChapter : null,
    taxonomySubtopic: typeof value.taxonomySubtopic === "string" ? value.taxonomySubtopic : null,
    taxonomyId: typeof value.taxonomyId === "string" ? value.taxonomyId : taxonomyIdForQuestion(String(value.id)) ?? null,
  };
}

type CloudAttempt = {
  test?: {
    id?: string;
    exam?: string;
    status?: string;
    recipe?: { exam?: string; subjects?: string[]; count?: number; mode?: string };
    submittedAt?: string | null;
    startedAt?: string | null;
  };
  result?: { score?: number | string; maxScore?: number | string; accuracy?: number | string; timeUsedSeconds?: number } | null;
};

const localScoring: Record<string, { marksPerQuestion: number; negativeMarksPerQuestion: number }> = {
  CSE: { marksPerQuestion: 2, negativeMarksPerQuestion: 2 / 3 },
  CAPF: { marksPerQuestion: 2, negativeMarksPerQuestion: 2 / 3 },
  CDS: { marksPerQuestion: 1, negativeMarksPerQuestion: 1 / 3 },
  NDA: { marksPerQuestion: 4, negativeMarksPerQuestion: 4 / 3 },
};

function numberValue(value: unknown, fallback = 0) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value: unknown, digits = 1) {
  return numberValue(value).toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function questionSourceLabel(question: Question) {
  if (question.origin !== "pyq") return "Reviewed MCQ";
  return [question.exam, question.year, question.paper, question.questionNumber ? `Q${question.questionNumber}` : null].filter(Boolean).join(" · ");
}

function calculateLocalResult(exam: string, questionList: Question[], answerMap: Record<number, string>, durationMinutes: number, secondsRemaining: number) {
  const scoring = localScoring[exam] ?? localScoring.CSE;
  let correctCount = 0;
  let incorrectCount = 0;
  const breakdown: Record<string, { total: number; correct: number; incorrect: number; unattempted: number; score: number }> = {};
  questionList.forEach((question, index) => {
    const subject = question.subject || "Uncategorised";
    const bucket = breakdown[subject] ?? { total: 0, correct: 0, incorrect: 0, unattempted: 0, score: 0 };
    const selected = answerMap[index];
    const correctOption = question.answer ?? question.correctOption;
    bucket.total += 1;
    if (!selected) bucket.unattempted += 1;
    else if (selected === correctOption) { correctCount += 1; bucket.correct += 1; bucket.score += scoring.marksPerQuestion; }
    else { incorrectCount += 1; bucket.incorrect += 1; bucket.score -= scoring.negativeMarksPerQuestion; }
    breakdown[subject] = bucket;
  });
  const unattemptedCount = questionList.length - correctCount - incorrectCount;
  const score = correctCount * scoring.marksPerQuestion - incorrectCount * scoring.negativeMarksPerQuestion;
  const maxScore = questionList.length * scoring.marksPerQuestion;
  const accuracy = correctCount + incorrectCount ? (correctCount / (correctCount + incorrectCount)) * 100 : 0;
  const weakAreas = Object.entries(breakdown)
    .map(([subject, value]) => ({ subject, accuracy: value.correct + value.incorrect ? value.correct / (value.correct + value.incorrect) : 0 }))
    .filter((value) => value.accuracy < 0.7)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((value) => value.subject);
  return {
    score: Number(score.toFixed(4)),
    maxScore: Number(maxScore.toFixed(4)),
    accuracy: Number(accuracy.toFixed(4)),
    correctCount,
    incorrectCount,
    unattemptedCount,
    timeUsedSeconds: Math.min(durationMinutes * 60, Math.max(0, durationMinutes * 60 - secondsRemaining)),
    breakdown,
    weakAreas,
  };
}

export function UPSCPuraanApp({ initialScreen = "dashboard", initialTestId }: { initialScreen?: Screen; initialTestId?: string } = {}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [exam, setExam] = useState("CSE");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>("All types");
  const [mode, setMode] = useState<Mode>("Exam");
  const [count, setCount] = useState(20);
  const [duration, setDuration] = useState(30);
  const [sourceMix, setSourceMix] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [review, setReview] = useState<number[]>([]);
  const [revealed, setRevealed] = useState<number[]>([]);
  const [seconds, setSeconds] = useState(30 * 60);
  const [liveTestId, setLiveTestId] = useState<string | null>(null);
  const [liveDeadline, setLiveDeadline] = useState<number | null>(null);
  const [liveResult, setLiveResult] = useState<Record<string, unknown> | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isStaff, setIsStaff] = useState(false);
  const [questionsOverride, setQuestionsOverride] = useState<Question[] | null>(null);
  const [cloudAttempts, setCloudAttempts] = useState<CloudAttempt[]>([]);

  useEffect(() => {
    fetch("/api/me")
      .then((response) => response.ok ? response.json() : null)
      .then((body) => setIsStaff(Boolean(body?.role === "editor" || body?.role === "admin")))
      .catch(() => setIsStaff(false));
    fetch("/api/attempts")
      .then((response) => response.ok ? response.json() : null)
      .then((body) => setCloudAttempts(Array.isArray(body?.attempts) ? body.attempts : []))
      .catch(() => setCloudAttempts([]));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = "upscpuraan_guest_state";
    if (screen === "dashboard" && !liveTestId) return;
    window.localStorage.setItem(key, JSON.stringify({ screen, liveTestId, current, answers, review, seconds, exam, subjects, subtopics, difficulty, mode, count, duration, sourceMix }));
  }, [screen, liveTestId, current, answers, review, seconds, exam, subjects, subtopics, difficulty, mode, count, duration, sourceMix]);

  useEffect(() => {
    if (typeof window === "undefined" || initialScreen !== "dashboard") return;
    const raw = window.localStorage.getItem("upscpuraan_guest_state");
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { screen?: Screen; liveTestId?: string | null; current?: number; answers?: Record<number, string>; review?: number[]; seconds?: number; exam?: string; subjects?: string[]; subtopics?: string[]; difficulty?: Difficulty; mode?: Mode; count?: number; duration?: number; sourceMix?: boolean };
      if (saved.exam) setExam(saved.exam);
      if (saved.subjects) setSubjects(saved.subjects);
      if (saved.subtopics) setSubtopics(saved.subtopics);
      if (saved.difficulty) setDifficulty(saved.difficulty);
      if (saved.mode) setMode(saved.mode);
      if (saved.count) setCount(saved.count);
      if (saved.duration) setDuration(saved.duration);
      if (typeof saved.sourceMix === "boolean") setSourceMix(saved.sourceMix);
      if (saved.answers) setAnswers(saved.answers);
      if (saved.review) setReview(saved.review);
      if (typeof saved.current === "number") setCurrent(saved.current);
      if (typeof saved.seconds === "number") setSeconds(saved.seconds);
      if (saved.liveTestId) {
        void fetch(`/api/tests/${saved.liveTestId}`).then(async (response) => {
          if (!response.ok) return;
          const body = await response.json();
          if (!body.test) return;
          setLiveTestId(saved.liveTestId ?? null);
          setLiveDeadline(body.test.deadlineAt ? new Date(body.test.deadlineAt).getTime() : null);
          setQuestionsOverride((body.test.questions as Record<string, unknown>[]).map(mapServerQuestion));
          if (Array.isArray(body.test.answers)) {
            const positions = new Map((body.test.questions as Record<string, unknown>[]).map((question, index) => [String(question.id), index]));
            setAnswers(Object.fromEntries(body.test.answers.filter((answer: { selectedOption?: string | null }) => answer.selectedOption).map((answer: { questionId: string; selectedOption: string }) => [positions.get(answer.questionId) ?? 0, answer.selectedOption])));
          }
          if (saved.screen === "attempt") setScreen("attempt");
        }).catch(() => undefined);
      } else if (saved.screen === "attempt" && saved.answers && Object.keys(saved.answers).length) {
        setScreen("attempt");
      }
    } catch {
      window.localStorage.removeItem("upscpuraan_guest_state");
    }
  }, [initialScreen]);

  useEffect(() => {
    if (!initialTestId) return;
    void fetch("/api/tests/" + encodeURIComponent(initialTestId)).then(async (response) => {
      if (!response.ok) throw new Error("This test could not be loaded.");
      const body = await response.json();
      if (!body.test) return;
      const test = body.test as { id: string; recipe?: { exam?: string; subjects?: string[]; difficulty?: Difficulty; mode?: Mode; durationMinutes?: number }; deadlineAt?: string | null; questions: Record<string, unknown>[]; answers?: Array<{ questionId: string; selectedOption?: string | null; markedForReview?: boolean }> };
      const mapped = test.questions.map(mapServerQuestion);
      const positions = new Map(test.questions.map((question, index) => [String(question.id), index]));
      setLiveTestId(test.id);
      setExam(test.recipe?.exam ?? "CSE");
      setSubjects(Array.isArray(test.recipe?.subjects) ? test.recipe.subjects : []);
      if (test.recipe?.difficulty) setDifficulty(test.recipe.difficulty);
      setMode(test.recipe?.mode === "Practice" ? "Practice" : "Exam");
      setDuration(typeof test.recipe?.durationMinutes === "number" ? test.recipe.durationMinutes : 30);
      setLiveDeadline(test.deadlineAt ? new Date(test.deadlineAt).getTime() : null);
      setQuestionsOverride(mapped);
      setAnswers(Object.fromEntries((test.answers ?? []).filter((answer) => answer.selectedOption).map((answer) => [positions.get(answer.questionId) ?? 0, answer.selectedOption as string])));
      setReview((test.answers ?? []).flatMap((answer) => answer.markedForReview ? [positions.get(answer.questionId) ?? 0] : []));
      if (initialScreen === "results") {
        const resultResponse = await fetch("/api/tests/" + encodeURIComponent(initialTestId) + "/results");
        if (resultResponse.ok) setLiveResult((await resultResponse.json()).result ?? null);
      }
      setScreen(initialScreen);
    }).catch((reason: unknown) => setServerError(reason instanceof Error ? reason.message : "This test could not be loaded."));
  }, [initialScreen, initialTestId]);

  const availableSubjects = useMemo(() => {
    const pool = sourceMix ? questions : questions.filter((q) => q.exam === exam);
    return [...new Set(pool.map((q) => q.subject))].sort((a, b) => a.localeCompare(b));
  }, [exam, sourceMix]);

  useEffect(() => {
    setSubjects((currentSubjects) => currentSubjects.filter((subject) => availableSubjects.includes(subject)));
  }, [availableSubjects]);

  const taxonomyGroups = useMemo(() => taxonomyGroupsForSubjects(subjects), [subjects]);
  const availableTaxonomyIds = useMemo(() => new Set(taxonomyNodesForSubjects(subjects).map((node) => node.id)), [subjects]);
  useEffect(() => {
    setSubtopics((current) => current.filter((id) => availableTaxonomyIds.has(id)));
  }, [availableTaxonomyIds]);

  const eligibleQuestions = useMemo(() => {
    const examPool = sourceMix ? questions : questions.filter((q) => q.exam === exam);
    const subjectPool = examPool.filter((q) => subjects.length === 0 || subjects.includes(q.subject));
    const subsectionPool = subtopics.length ? subjectPool.filter((q) => q.taxonomyId && subtopics.includes(q.taxonomyId)) : subjectPool;
    // The legacy unrestricted path remains subjectPool when no subsection is selected.
    if (difficulty === "All types") return subtopics.length ? subsectionPool : subjectPool;
    const scopedPool = subsectionPool;
    if (difficulty !== "Mixed") return scopedPool.filter((q) => q.difficulty === difficulty);

    const buckets: Record<QuestionDifficulty, Question[]> = {
      Easy: scopedPool.filter((q) => q.difficulty === "Easy"),
      Moderate: scopedPool.filter((q) => q.difficulty === "Moderate"),
      Hard: scopedPool.filter((q) => q.difficulty === "Hard"),
    };
    const balanced: Question[] = [];
    const depth = Math.max(buckets.Easy.length, buckets.Moderate.length, buckets.Hard.length);
    for (let index = 0; index < depth; index += 1) {
      for (const level of ["Easy", "Moderate", "Hard"] as QuestionDifficulty[]) {
        if (buckets[level][index]) balanced.push(buckets[level][index]);
      }
    }
    return balanced;
  }, [exam, sourceMix, subjects, subtopics, difficulty]);

  const visibleQuestions = useMemo(() => eligibleQuestions.slice(0, count), [eligibleQuestions, count]);

  useEffect(() => {
    if (screen !== "attempt") return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (liveDeadline) {
          const remaining = Math.max(0, Math.ceil((liveDeadline - Date.now()) / 1000));
          if (remaining <= 0) {
            window.clearInterval(timer);
            void submitTest();
          }
          return remaining;
        }
        if (value <= 1) {
          window.clearInterval(timer);
          void submitTest();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  // submitTest is intentionally read from the latest render by the timer.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, mode, liveDeadline, liveTestId]);

  function toggleSubject(value: string) {
    if (value === "All subjects") {
      setSubjects([]);
      return;
    }
    setSubjects((currentSubjects) => {
      const next = currentSubjects.includes(value)
        ? currentSubjects.filter((subject) => subject !== value)
        : [...currentSubjects, value];
      return next;
    });
  }

  function toggleSubtopic(value: string) {
    setSubtopics((current) => current.includes(value) ? current.filter((id) => id !== value) : [...current, value]);
  }

  function toggleChapter(head: string, chapter: string) {
    const ids = chapterSubtopicIds(head, chapter);
    setSubtopics((current) => ids.every((id) => current.includes(id)) ? current.filter((id) => !ids.includes(id)) : [...new Set([...current, ...ids])]);
  }

  async function beginTest() {
    if (visibleQuestions.length < count) return;
    setCurrent(0);
    setAnswers({});
    setReview([]);
    setRevealed([]);
    setSeconds(duration * 60);
    setLiveResult(null);
    setServerError(null);

    try {
      const response = await fetch("/api/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipe: { exam, subjects, subtopics, difficulty, count, durationMinutes: duration, sourceMix, mode } }),
      });
      const body = await response.json();
      if (response.ok && body.test) {
        const serverQuestions = (body.test.questions as Record<string, unknown>[]).map(mapServerQuestion);
        setLiveTestId(body.test.id);
        setLiveDeadline(body.test.deadlineAt ? new Date(body.test.deadlineAt).getTime() : null);
        setQuestionsOverride(serverQuestions);
        setScreen("attempt");
        return;
      }
      if (body.code !== "DATABASE_UNCONFIGURED") {
        setServerError(body.error ?? "The test could not be created.");
        return;
      }
    } catch {
      // Vercel can still run the anonymous local beta before Supabase is configured.
    }

    setLiveTestId(null);
    setLiveDeadline(null);
    setQuestionsOverride(null);
    setScreen("attempt");
  }

  function answerQuestion(key: string) {
    setAnswers((existing) => ({ ...existing, [current]: key }));
    const question = (questionsOverride ?? visibleQuestions)[current];
    if (liveTestId && question) {
      void fetch(`/api/tests/${liveTestId}/answers/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedOption: key, markedForReview: review.includes(current), secondsSpent: 0 }),
      });
    }
    if (mode === "Practice") {
      setRevealed((existing) => existing.includes(current) ? existing : [...existing, current]);
    }
  }

  async function submitTest() {
    if (!liveTestId) {
      setLiveResult(calculateLocalResult(exam, questionsOverride ?? visibleQuestions, answers, duration, seconds));
      setScreen("results");
      return;
    }
    const response = await fetch(`/api/tests/${liveTestId}/submit`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) {
      setServerError(body.error ?? "The test could not be submitted.");
      return;
    }
    const refreshed = await fetch("/api/tests/" + encodeURIComponent(liveTestId));
    if (refreshed.ok) {
      const refreshedBody = await refreshed.json();
      if (refreshedBody.test?.questions) setQuestionsOverride((refreshedBody.test.questions as Record<string, unknown>[]).map(mapServerQuestion));
    }
    setLiveResult(body.result ?? null);
    setScreen("results");
  }

  function toggleCurrentReview() {
    const next = review.includes(current) ? review.filter((item) => item !== current) : [...review, current];
    setReview(next);
    const question = (questionsOverride ?? visibleQuestions)[current];
    if (liveTestId && question) {
      void fetch(`/api/tests/${liveTestId}/answers/${question.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ selectedOption: answers[current] ?? null, markedForReview: !review.includes(current), secondsSpent: 0 }) });
    }
  }

  function navigate(target: number) {
    const activeQuestions = questionsOverride ?? visibleQuestions;
    setCurrent(Math.max(0, Math.min(activeQuestions.length - 1, target)));
  }

  async function saveRecipe() {
    const response = await fetch("/api/saved-tests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: exam + " " + (subjects.length ? subjects.join(" & ") : "All subjects") + " test", recipe: { exam, subjects, subtopics, difficulty, count, durationMinutes: duration, sourceMix, mode } }),
    });
    const body = await response.json();
    if (!response.ok) setServerError(body.error ?? "Sign in to save this recipe.");
    else setServerError("Saved test recipe. You can reuse it from your account.");
  }

  const navItems: { label: string; icon: string; target: Screen }[] = [
    { label: "Home", icon: "⌂", target: "dashboard" },
    { label: "Create test", icon: "＋", target: "builder" },
    { label: "Attempts", icon: "◷", target: "attempts" },
    ...(isStaff ? [{ label: "Editorial", icon: "✎", target: "admin" as Screen }] : []),
  ];

  return (
    <div className={screen === "attempt" ? "app-shell attempt-app-shell" : "app-shell"}>
      {screen !== "attempt" && <aside className="sidebar">
        <button className="brand" onClick={() => setScreen("dashboard")} aria-label="UPSCPuraan home">
          <span className="brand-mark">U</span>
          UPSCPuraan
        </button>
        <nav className="nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={screen === item.target ? "active" : ""}
              onClick={() => setScreen(item.target)}
            >
              <span className="nav-icon">{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          Beta workspace<br />
          Verified PYQs · English
        </div>
      </aside>}

      <main className="main">
        {screen !== "attempt" && (
          <header className="topbar">
            <div className="eyebrow">{screen === "admin" ? "Editorial workspace" : "UPSC test lab"}</div>
            <AuthControl />
          </header>
        )}

        {serverError && <div className="inventory-error" role="alert" style={{ marginBottom: 18 }}>{serverError}</div>}

        {screen === "dashboard" && <Dashboard onCreate={() => setScreen("builder")} onResume={() => setScreen("attempt")} />}
        {screen === "attempts" && <AttemptsView cloudAttempts={cloudAttempts} />}
        {screen === "builder" && (
          <Builder
            exam={exam}
            setExam={setExam}
            subjects={subjects}
            toggleSubject={toggleSubject}
            availableSubjects={availableSubjects}
            subtopics={subtopics}
            taxonomyGroups={taxonomyGroups}
            toggleSubtopic={toggleSubtopic}
            toggleChapter={toggleChapter}
            clearSubtopics={() => setSubtopics([])}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            mode={mode}
            setMode={setMode}
            count={count}
            setCount={setCount}
            duration={duration}
            setDuration={setDuration}
            sourceMix={sourceMix}
            setSourceMix={setSourceMix}
            inventoryCount={eligibleQuestions.length}
            beginTest={beginTest}
            saveRecipe={() => void saveRecipe()}
          />
        )}
        {screen === "attempt" && (
          <Attempt
            exam={exam}
            mode={mode}
            questions={questionsOverride ?? visibleQuestions}
            current={current}
            answers={answers}
            review={review}
            revealed={revealed}
            seconds={seconds}
            answerQuestion={answerQuestion}
            navigate={navigate}
            toggleReview={toggleCurrentReview}
            submit={() => void submitTest()}
          />
        )}
        {screen === "results" && <Results result={liveResult ?? calculateLocalResult(exam, questionsOverride ?? visibleQuestions, answers, duration, seconds)} questions={questionsOverride ?? visibleQuestions} answers={answers} exam={exam} subjects={subjects} difficulty={difficulty} mode={mode} onRetake={beginTest} onHome={() => setScreen("dashboard")} />}
        {screen === "admin" && <Admin />}
        {screen === "legal" && <Legal />}
      </main>

      {screen !== "attempt" && <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button key={item.label} className={screen === item.target ? "active" : ""} onClick={() => setScreen(item.target)}>
            <span style={{display:"block", fontSize:16, marginBottom:2}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>}
    </div>
  );
}

function AuthControl() {
  const [email, setEmail] = useState<string | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    setConfigured(true);
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setEmail(session?.user?.email ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  if (email) return <button className="avatar" title={email} aria-label={`Sign out ${email}`} onClick={() => void signOut().then(() => setEmail(null))}>✓</button>;
  if (!configured) return <span className="guest-badge">Guest mode</span>;
  return <button className="secondary auth-button" onClick={() => void signInWithGoogle("/app")}>Sign in with Google</button>;
}

function Dashboard({ onCreate, onResume }: { onCreate: () => void; onResume: () => void }) {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow" style={{marginBottom:12}}>Wednesday, 29 July</div>
          <h1>Your syllabus.<br />Your test.</h1>
          <p>Build a focused paper from verified questions, practise with intent, and know exactly where to improve.</p>
        </div>
        <button className="primary" onClick={onCreate}>＋ Create a test</button>
      </section>

      <div className="stat-grid">
        <div className="stat"><div className="stat-label">Tests completed</div><strong>18</strong><small>+4 this week</small></div>
        <div className="stat"><div className="stat-label">Average accuracy</div><strong>74%</strong><small>↑ 6%</small></div>
        <div className="stat"><div className="stat-label">Questions practised</div><strong>436</strong><small>92 PYQs</small></div>
      </div>

      <div className="section-head"><h2>Continue where you left off</h2><button className="quiet" onClick={onResume}>Resume test →</button></div>
      <div className="card attempt-row" style={{borderLeft:"3px solid var(--accent)"}}>
        <div><div className="attempt-title">CSE · Indian Polity</div><div className="meta">12 of 25 answered · Exam mode</div></div>
        <div><div className="meta">Time left</div><strong>18:42</strong></div>
        <div><div className="meta">Saved</div><strong>Just now</strong></div>
        <div></div>
        <button className="secondary" onClick={onResume}>Resume</button>
      </div>

    </>
  );
}

function AttemptsView({ cloudAttempts }: { cloudAttempts: CloudAttempt[] }) {
  const rows = cloudAttempts.length
    ? cloudAttempts.map((entry) => {
      const recipe = entry.test?.recipe;
      const exam = recipe?.exam ?? entry.test?.exam ?? "UPSC";
      const subjects = Array.isArray(recipe?.subjects) && recipe.subjects.length ? recipe.subjects.join(" & ") : "All subjects";
      const score = entry.result?.score !== undefined
        ? `${entry.result.score}${entry.result.maxScore !== undefined ? ` / ${entry.result.maxScore}` : ""}`
        : "—";
      const accuracy = entry.result?.accuracy !== undefined ? `${Math.round(Number(entry.result.accuracy))}%` : "—";
      const time = typeof entry.result?.timeUsedSeconds === "number" ? `${Math.round(entry.result.timeUsedSeconds / 60)}m` : "—";
      const accuracyValue = Number(entry.result?.accuracy ?? 0);
      return {
        id: entry.test?.id,
        status: entry.test?.status,
        title: `${exam} · ${subjects}`,
        date: entry.test?.submittedAt ? new Date(entry.test.submittedAt).toLocaleString() : entry.test?.startedAt ? `Started ${new Date(entry.test.startedAt).toLocaleString()}` : "In progress",
        score,
        accuracy,
        time,
        tone: accuracyValue >= 70 ? "good" : "mid",
      };
    })
    : [];

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow" style={{marginBottom:12}}>Student workspace</div>
          <h1>Recent attempts</h1>
          <p>Review completed papers and continue any test still in progress.</p>
        </div>
        <span className="meta">{rows.length} {rows.length === 1 ? "attempt" : "attempts"}</span>
      </section>
      <div className="card attempts-list" style={{marginTop:28}}>
        {!rows.length && <p className="muted" style={{padding:20,margin:0}}>No cloud attempts yet. Complete a test to see it here.</p>}
        {rows.map((attempt) => (
          <div className="attempt-row" key={attempt.id ?? attempt.title}>
            <div><div className="attempt-title">{attempt.title}</div><div className="meta">{attempt.date}</div></div>
            <div><div className="meta">Score</div><span className={`score ${attempt.tone}`}>{attempt.score}</span></div>
            <div><div className="meta">Accuracy</div><strong>{attempt.accuracy}</strong></div>
            <div><div className="meta">Time</div><strong>{attempt.time}</strong></div>
            {attempt.id ? <a className="quiet" href={(attempt.status === "submitted" ? "/app/results/" : "/app/tests/") + attempt.id}>Review</a> : <button className="quiet">Review</button>}
          </div>
        ))}
      </div>
    </>
  );
}

type BuilderProps = {
  exam: string; setExam: (v:string)=>void;
  subjects: string[]; toggleSubject:(v:string)=>void; availableSubjects:string[];
  subtopics: string[];
  taxonomyGroups: ReturnType<typeof taxonomyGroupsForSubjects>;
  toggleSubtopic: (v:string)=>void;
  toggleChapter: (head:string, chapter:string)=>void;
  clearSubtopics: ()=>void;
  difficulty: Difficulty; setDifficulty:(v:Difficulty)=>void;
  mode: Mode; setMode:(v:Mode)=>void;
  count:number; setCount:(v:number)=>void;
  duration:number; setDuration:(v:number)=>void;
  sourceMix:boolean; setSourceMix:(v:boolean)=>void;
  inventoryCount:number;
  beginTest:()=>void;
  saveRecipe:()=>void;
};

function Builder(props: BuilderProps) {
  const selectedSubtopicNames = taxonomyNodesForSubjects([]).filter((node) => props.subtopics.includes(node.id)).map((node) => node.subtopic);
  const subsectionSummary = selectedSubtopicNames.length
    ? `${selectedSubtopicNames.slice(0, 2).join(", ")}${selectedSubtopicNames.length > 2 ? ` +${selectedSubtopicNames.length - 2}` : ""}`
    : "All subsections";
  return (
    <div className="builder-layout">
    <div className="builder">
      <div className="eyebrow">Guided test builder</div>
      <h1 style={{marginTop:10}}>Build your test</h1>
      <p className="muted">Choose the ingredients. UPSCPuraan will balance the paper.</p>

      <div className="step">
        <div className="step-no">1</div>
        <div><h3>Target examination</h3><div className="choice-grid">
          {[
            ["CSE","GS Paper I"],["CAPF","Paper I"],["CDS","General Knowledge"],["NDA","General Ability"],
          ].map(([name, note]) => <button key={name} className={`choice ${props.exam===name?"selected":""}`} onClick={()=>props.setExam(name)}><strong>{name}</strong><small>{note}</small></button>)}
        </div></div>
      </div>

      <div className="step">
        <div className="step-no">2</div>
        <div><h3>Subjects</h3><div className="chips">
          {["All subjects", ...props.availableSubjects].map((subject)=><button key={subject} className={`chip ${(subject==="All subjects" ? props.subjects.length===0 : props.subjects.includes(subject))?"selected":""}`} onClick={()=>props.toggleSubject(subject)}>{subject}</button>)}
        </div></div>
      </div>

      <div className="step">
        <div className="step-no">3</div>
        <div><h3>Subsections</h3><p className="step-help">Choose chapters or narrow the paper to specific subtopics. Your selection matches any chosen subtopic.</p>
          <div className="subsection-toolbar"><button className={`chip ${props.subtopics.length === 0 ? "selected" : ""}`} onClick={props.clearSubtopics} aria-pressed={props.subtopics.length === 0}>All subsections</button><span className="meta">{props.subtopics.length ? `${props.subtopics.length} selected` : "No subsection filter"}</span></div>
          <div className="taxonomy-groups">
            {props.taxonomyGroups.map((group) => <details className="taxonomy-group" key={group.name}>
              <summary>{group.name}<span className="meta">{Object.values(group.chapters).flat().length} subtopics</span></summary>
              <div className="taxonomy-chapters">
                {Object.entries(group.chapters).map(([chapter, children]) => {
                  const ids = children.map((subtopic) => {
                    const node = taxonomyNodesForSubjects([group.subject]).find((candidate) => candidate.head === group.name && candidate.chapter === chapter && candidate.subtopic === subtopic);
                    return node?.id ?? "";
                  }).filter(Boolean);
                  const selectedCount = ids.filter((id) => props.subtopics.includes(id)).length;
                  const allSelected = ids.length > 0 && selectedCount === ids.length;
                  return <div className="taxonomy-chapter" key={chapter}>
                    <button className={`taxonomy-chapter-toggle ${allSelected ? "selected" : ""} ${selectedCount > 0 && !allSelected ? "partial" : ""}`} onClick={() => props.toggleChapter(group.name, chapter)} role="checkbox" aria-checked={allSelected ? "true" : selectedCount > 0 ? "mixed" : "false"}><span>{chapter}</span><span className="meta">{selectedCount}/{ids.length}</span></button>
                    <div className="subtopic-chips">
                      {children.map((subtopic) => {
                        const id = ids[children.indexOf(subtopic)];
                        const selected = props.subtopics.includes(id);
                        return <button key={id} className={`subtopic-chip ${selected ? "selected" : ""}`} onClick={() => props.toggleSubtopic(id)} aria-pressed={selected}>{subtopic}</button>;
                      })}
                    </div>
                  </div>;
                })}
              </div>
            </details>)}
            {!props.taxonomyGroups.length && <p className="meta">This subject does not have a published PDF taxonomy yet. All subsections remains available.</p>}
          </div>
        </div>
      </div>

      <div className="step">
        <div className="step-no">4</div>
        <div><h3>Difficulty</h3><div className="choice-grid">
          {(["All types","Easy","Moderate","Hard","Mixed"] as Difficulty[]).map((value)=><button key={value} className={`choice ${props.difficulty===value?"selected":""}`} onClick={()=>props.setDifficulty(value)}><strong>{value}</strong><small>{value==="All types"?"No difficulty filter":value==="Mixed"?"Balanced selection":`${value} questions`}</small></button>)}
        </div></div>
      </div>

      <div className="step">
        <div className="step-no">5</div>
        <div><h3>Length and pace</h3><div className="range-row">
          <div className="field"><label>Questions: {props.count}</label><input type="range" min="5" max="100" step="5" value={props.count} onChange={(e)=>props.setCount(Number(e.target.value))} /></div>
          <div className="field"><label>Duration: {props.duration} minutes</label><input type="range" min="10" max="120" step="5" value={props.duration} onChange={(e)=>props.setDuration(Number(e.target.value))} /></div>
        </div></div>
      </div>

      <div className="step">
        <div className="step-no">6</div>
        <div><h3>Attempt style</h3><div className="choice-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
          {(["Exam","Practice"] as Mode[]).map((value)=><button key={value} className={`choice ${props.mode===value?"selected":""}`} onClick={()=>props.setMode(value)}><strong>{value} mode</strong><small>{value==="Exam"?"Timed, answers after submit":"Instant feedback and explanations"}</small></button>)}
        </div>
        <label style={{display:"flex",gap:10,alignItems:"center",marginTop:16,fontSize:13}}><input type="checkbox" checked={props.sourceMix} onChange={(e)=>props.setSourceMix(e.target.checked)} /> Include relevant questions from sibling UPSC exams</label>
        </div>
      </div>

      <div className="card builder-summary">
        <div><strong>{props.exam}{props.sourceMix ? " + sibling exams" : ""} · {props.count} questions · {props.duration} min</strong><div className="meta">{props.difficulty === "All types" ? "All difficulty types" : props.difficulty} · {props.mode} mode · {props.subjects.join(", ") || "All subjects"} · {props.subtopics.length ? `${props.subtopics.length} subsections: ${subsectionSummary}` : subsectionSummary}</div>{props.inventoryCount===0 && <div className="inventory-error" role="alert">No eligible questions match these filters. Choose a broader subject, subsection, or difficulty.</div>}{props.inventoryCount>0 && props.inventoryCount<props.count && <div className="inventory-error" role="alert">Only {props.inventoryCount} eligible questions match these filters; choose a broader recipe or fewer questions.</div>}</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"end"}}><button className="secondary" onClick={props.saveRecipe}>Save recipe</button><button className="primary" onClick={props.beginTest} disabled={props.inventoryCount<props.count}>Generate test →</button></div>
      </div>
    </div>
    <PaperPreview {...props} subsectionSummary={subsectionSummary} />
    </div>
  );
}

function PaperPreview(props: BuilderProps & { subsectionSummary: string }) {
  const paperNames: Record<string, string> = {
    CSE: "GS Paper I",
    CAPF: "Paper I",
    CDS: "General Knowledge",
    NDA: "General Ability",
  };
  const subject = props.subjects.length ? props.subjects.join(" · ") : "All subjects";
  const difficulty = props.difficulty === "All types" ? "All types" : props.difficulty;
  const pace = `${(props.duration / props.count).toFixed(1)} min/Q`;
  const dots = Math.min(props.count, 20);
  return (
    <aside className="paper-preview" aria-label="Paper preview">
      <div className="paper-preview-kicker">Paper preview</div>
      <h2>{props.exam}</h2>
      <p className="paper-preview-paper">{paperNames[props.exam] ?? "General Ability"}</p>
      <div className="preview-seal" aria-hidden="true"><span>UP</span></div>
      <div className="preview-divider" />
      <div className="preview-rows">
        <div><span>Subject</span><strong>{subject}</strong></div>
        <div><span>Difficulty</span><strong>{difficulty}</strong></div>
        <div><span>Questions</span><strong>{props.count}</strong></div>
        <div><span>Duration</span><strong>{props.duration} min</strong></div>
        <div><span>Pace</span><strong>{pace}</strong></div>
      </div>
      {props.subtopics.length > 0 && <p className="preview-subsection">{props.subsectionSummary}</p>}
      <div className="preview-dots" aria-hidden="true">{Array.from({ length: dots }, (_, index) => <i key={index} />)}</div>
      <button className="preview-generate primary" onClick={props.beginTest} disabled={props.inventoryCount < props.count}>Generate test <span aria-hidden="true">→</span></button>
      <p className="preview-note">Auto-balanced against {props.exam} weightage</p>
      <div className="preview-instructions">
        <strong>Instructions</strong>
        <ol>
          <li>Each question has one correct answer from four options.</li>
          <li>A wrong answer attracts a penalty of one-third of the marks assigned to that question. There is no penalty for an unanswered question.</li>
          <li>Mark only one option. The paper auto-submits when the timer ends.</li>
        </ol>
        <small>Independent practice platform · Not affiliated with UPSC</small>
      </div>
    </aside>
  );
}

type TestQuestion = Question;
function Attempt({ exam, mode, questions: qs, current, answers, review, revealed, seconds, answerQuestion, navigate, toggleReview, submit }: {
  exam:string; mode:Mode; questions:TestQuestion[]; current:number; answers:Record<number,string>; review:number[]; revealed:number[]; seconds:number;
  answerQuestion:(v:string)=>void; navigate:(n:number)=>void; toggleReview:()=>void; submit:()=>void;
}) {
  const q = qs[current];
  const mm = String(Math.floor(seconds/60)).padStart(2,"0");
  const ss = String(seconds%60).padStart(2,"0");
  const showAnswer = revealed.includes(current);
  const sourceLabel = q.origin === "pyq"
    ? [q.exam, q.year, q.paper, q.questionNumber ? "Q" + q.questionNumber : null].filter(Boolean).join(" · ")
    : "Reviewed question";
  return (
    <div className="test-shell">
      <header className="test-head">
        <div><strong>{exam} · Focus test</strong><div className="meta">{mode} mode · Autosaved</div></div>
        <div className="timer-block"><span>Time left</span><div className="timer" aria-label={`${mm} minutes ${ss} seconds remaining`}>{mm}:{ss}</div></div>
        <button className="secondary" onClick={submit}>Submit</button>
      </header>
      <div className="test-grid">
        <section className="card question-card">
          <div className="q-meta"><span>Question {current+1} of {qs.length}</span><span className="question-source">{q.subject} · {sourceLabel}</span></div>
          <div className="prompt-lines">
            {q.promptLines.map((line, index) => <p className={/^Statement\s/i.test(line) ? "statement-line" : ""} key={`${q.id}-line-${index}`}>{line}</p>)}
          </div>
          <div className="options">
            {Object.entries(q.options).map(([key,value]) => {
              let className = answers[current]===key ? "option selected" : "option";
              if (showAnswer && key===q.answer) className += " correct";
              if (showAnswer && answers[current]===key && key!==q.answer) className += " incorrect";
              return <button key={key} className={className} onClick={()=>answerQuestion(key)} disabled={showAnswer}><span className="option-key">{key}</span><span>{value}</span></button>;
            })}
          </div>
          {showAnswer && <div className="explanation"><strong>{answers[current]===q.answer ? "Correct." : `Correct answer: ${q.answer}.`}</strong><br />{q.explanation}</div>}
          <div className="test-actions" style={{marginTop:22}}>
            <button className="secondary" onClick={()=>navigate(current-1)} disabled={current===0}>← Previous</button>
            <button className="quiet" onClick={toggleReview}>{review.includes(current)?"Remove review":"Mark for review"}</button>
            {current===qs.length-1 ? <button className="primary" onClick={submit}>Finish test</button> : <button className="primary" onClick={()=>navigate(current+1)}>Next →</button>}
          </div>
        </section>
        <aside className="card palette">
          <strong>Question palette</strong>
          <div className="palette-grid">
            {qs.map((_,index)=><button key={index} className={`q-dot ${answers[index]?"answered":""} ${review.includes(index)?"review":""}`} onClick={()=>navigate(index)} aria-label={`Question ${index+1}`}>{index+1}</button>)}
          </div>
          <div className="legend"><span><i style={{background:"var(--accent)"}} />Answered</span><span><i style={{background:"#e2b86f"}} />Marked for review</span><span><i />Not answered</span></div>
          <hr style={{border:0,borderTop:"1px solid var(--line)",margin:"18px 0"}} />
          <div className="meta">{Object.keys(answers).length} answered · {qs.length-Object.keys(answers).length} remaining</div>
        </aside>
      </div>
    </div>
  );
}

function Results({result, questions, answers, exam, subjects, difficulty, mode, onRetake, onHome}:{result:Record<string, unknown>|null;questions:Question[];answers:Record<number,string>;exam:string;subjects:string[];difficulty:Difficulty;mode:Mode;onRetake:()=>void;onHome:()=>void}) {
  const [showSolutions, setShowSolutions] = useState(false);
  const scoreValue = numberValue(result?.score);
  const maxScoreValue = numberValue(result?.maxScore);
  const score = formatNumber(scoreValue);
  const maxScore = formatNumber(maxScoreValue);
  const scorePercent = maxScoreValue > 0 ? Math.max(0, Math.min(100, (scoreValue / maxScoreValue) * 100)) : 0;
  const correct = numberValue(result?.correctCount);
  const incorrect = numberValue(result?.incorrectCount);
  const unattempted = numberValue(result?.unattemptedCount);
  const accuracyValue = numberValue(result?.accuracy);
  const accuracy = `${formatNumber(accuracyValue, 0)}%`;
  const questionCount = questions.length || correct + incorrect + unattempted;
  const derivedSubjects = [...new Set(questions.map((question) => question.subject).filter(Boolean))];
  const subjectLabel = subjects.length ? subjects.join(" · ") : derivedSubjects.join(" · ") || "All subjects";
  const weakAreas = Array.isArray(result?.weakAreas) ? result.weakAreas.map(String) : [];
  const heading = accuracyValue >= 80 ? "Strong attempt." : accuracyValue >= 60 ? "A solid attempt." : "Keep building.";
  const description = weakAreas.length ? `${weakAreas.join(", ")} need another focused round.` : "Review the solutions and use this result to plan your next paper.";
  const timeUsed = numberValue(result?.timeUsedSeconds);
  const breakdown = result?.breakdown && typeof result.breakdown === "object" ? result.breakdown as Record<string, { total?: number; correct?: number; incorrect?: number; unattempted?: number }> : {};
  const breakdownRows = Object.entries(breakdown).map(([name, value]) => {
    const answered = numberValue(value.correct) + numberValue(value.incorrect);
    return { name, accuracy: answered ? Math.round((numberValue(value.correct) / answered) * 100) : 0 };
  });
  return (
    <>
      <div className="eyebrow">Test complete</div><h1 style={{marginTop:10}}>{heading}</h1><p className="muted">{description}</p>
      <section className="card results-hero">
        <div className="score-ring" style={{background:`conic-gradient(var(--accent) 0 ${scorePercent}%, #e5ebe7 ${scorePercent}% 100%)`}}><div><strong>{score}</strong><span className="meta">out of {maxScore}</span></div></div>
        <div>
          <h2>{exam} · {subjectLabel}</h2>
          <div className="meta">{questionCount} questions · {mode} mode · {difficulty} · {accuracy} accuracy{timeUsed ? ` · ${Math.round(timeUsed / 60)}m used` : ""}</div>
          <div className="breakdown"><div><strong>{correct}</strong><div className="meta">Correct</div></div><div><strong>{incorrect}</strong><div className="meta">Incorrect</div></div><div><strong>{unattempted}</strong><div className="meta">Unattempted</div></div></div>
          <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}><button className="primary" onClick={() => setShowSolutions((value) => !value)}>{showSolutions ? "Hide solutions" : "Review solutions"}</button><button className="secondary" onClick={onRetake}>Retake</button><button className="quiet" onClick={onHome}>Dashboard</button></div>
        </div>
      </section>
      {showSolutions && questions.length > 0 && <section className="card solution-list" style={{marginTop:22}}>
        <h2>Solutions</h2>
        {questions.map((question, index) => <article className="solution-row" key={question.id}>
          <div className="meta">Question {index + 1} · {questionSourceLabel(question)}</div>
          <div className="solution-prompt">{question.promptLines.map((line, lineIndex) => <p key={`${question.id}-solution-line-${lineIndex}`}>{line}</p>)}</div>
          <div className="solution-options">{Object.entries(question.options).map(([key, value]) => <div key={key}><span>{key}</span>{value}</div>)}</div>
          <div className="meta">Your answer: {answers[index] ?? "Unattempted"} · Correct answer: {question.answer ?? question.correctOption ?? "Unavailable"}</div>
          <p>{question.explanation || "No editorial explanation has been added yet."}</p>
        </article>)}
      </section>}
      <div className="section-head"><h2>Subject breakdown</h2><span className="meta">Accuracy</span></div>
      {breakdownRows.length ? <div className="weak-grid">
        {breakdownRows.map((row) => <div className="card weak-card" key={row.name}><div className="weak-top"><strong>{row.name}</strong><span>{row.accuracy}%</span></div><div className={`bar ${row.accuracy < 70 ? "warn" : ""}`}><span style={{width:`${row.accuracy}%`}} /></div></div>)}
      </div> : <div className="card" style={{padding:20}}><p className="muted">Subject breakdown is unavailable for this attempt.</p></div>}
    </>
  );
}

function Admin() {
  type EditorialQuestion = {
    id: string;
    exam: string;
    year: number | null;
    subject: string;
    topic: string;
    stem: string;
    explanation: string | null;
    workflowStatus: string;
    verificationStatus: string;
    origin: string;
  };
  const [queue, setQueue] = useState<EditorialQuestion[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQueue = () => {
    setLoading(true);
    fetch("/api/admin/questions?status=all")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body?.message ?? "Unable to load editorial queue.");
        setQueue(Array.isArray(body.questions) ? body.questions : []);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Unable to load editorial queue."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQueue(); }, []);

  const updateQuestion = async (item: EditorialQuestion, nextStatus: "approved" | "published" | "rejected") => {
    setError(null);
    if (nextStatus === "published" && !item.explanation) {
      setError("This question needs a detailed explanation before it can be published.");
      return;
    }
    const response = await fetch("/api/admin/questions/" + encodeURIComponent(item.id), {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        workflowStatus: nextStatus,
        verificationStatus: nextStatus === "published" ? "verified" : item.verificationStatus,
      }),
    });
    const body = await response.json();
    if (!response.ok) {
      setError(body?.message ?? "Editorial update failed.");
      return;
    }
    setStatus((current) => ({ ...current, [item.id]: nextStatus }));
    setQueue((current) => current.map((question) => question.id === item.id ? { ...question, workflowStatus: nextStatus, verificationStatus: nextStatus === "published" ? "verified" : question.verificationStatus } : question));
  };

  const reviewCount = queue.filter((item) => (status[item.id] ?? item.workflowStatus) === "review").length;
  const readyCount = queue.filter((item) => item.explanation && (status[item.id] ?? item.workflowStatus) !== "published").length;
  const publishedCount = queue.filter((item) => (status[item.id] ?? item.workflowStatus) === "published").length;

  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:20,marginBottom:24}}>
        <div><h1>Editorial queue</h1><p className="muted">Review provenance, difficulty and explanations before publishing.</p></div>
        <button className="secondary" onClick={loadQueue}>↻ Refresh queue</button>
      </div>
      <div className="stat-grid" style={{marginBottom:22}}>
        <div className="stat"><div className="stat-label">Awaiting review</div><strong>{reviewCount}</strong></div>
        <div className="stat"><div className="stat-label">Explanation ready</div><strong>{readyCount}</strong></div>
        <div className="stat"><div className="stat-label">Published questions</div><strong>{publishedCount}</strong></div>
      </div>
      {error && <div className="notice error" role="alert">{error}</div>}
      <div className="admin-grid">
        <aside className="card admin-filters">
          <strong>Queue filters</strong>
          {[["All imported", queue.length], ["Needs explanation", queue.filter((item) => !item.explanation).length], ["Verified", queue.filter((item) => item.verificationStatus === "verified").length], ["Published", publishedCount]].map(([label, value]) => <div className="filter-line" key={String(label)}><span>{label}</span><strong>{String(value)}</strong></div>)}
        </aside>
        <section className="card">
          {loading && <p className="muted">Loading imported questions…</p>}
          {!loading && queue.length === 0 && <p className="muted">No imported questions yet. Run the content import after configuring Supabase.</p>}
          {queue.map((item) => {
            const currentStatus = status[item.id] ?? item.workflowStatus;
            const badgeClass = currentStatus === "published" ? "ready" : currentStatus === "rejected" ? "review" : "ready";
            return <div className="queue-row" key={item.id}>
              <div className="queue-top"><div><div className="meta">{item.exam}{item.year ? " " + item.year : ""} · {item.subject} · {item.topic}</div><strong style={{display:"block",marginTop:7,lineHeight:1.5}}>{item.stem}</strong></div><span className={"badge " + badgeClass}>{currentStatus}</span></div>
              <div className="meta" style={{marginTop:10}}>{item.origin.toUpperCase()} · {item.verificationStatus} · {item.explanation ? "Explanation present" : "Needs explanation"}</div>
              <div className="queue-actions">
                <button className="secondary" onClick={() => void updateQuestion(item, "approved")}>Mark reviewed</button>
                <button className="primary" onClick={() => void updateQuestion(item, "published")} disabled={!item.explanation || currentStatus === "published"}>Approve & publish</button>
                <button className="quiet" onClick={() => void updateQuestion(item, "rejected")}>Reject</button>
              </div>
            </div>;
          })}
        </section>
      </div>
    </>
  );
}

function AdminLegacy() {
  const [status, setStatus] = useState<Record<number,string>>({});
  void status;
  const queue = [
    { exam:"CSE 2022", subject:"Geography", text:"Consider the following statements regarding ocean currents…", badge:"Needs review", type:"review" },
    { exam:"CAPF 2020", subject:"Polity", text:"Which of the following is not a constitutional body?", badge:"Explanation ready", type:"ready" },
    { exam:"Generated MCQ", subject:"History", text:"With reference to the Sangam corpus, consider the following…", badge:"Needs review", type:"review" },
  ];
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"end",gap:20,marginBottom:24}}>
        <div><h1>Editorial queue</h1><p className="muted">Review provenance, difficulty and explanations before publishing.</p></div>
        <button className="primary">＋ Import batch</button>
      </div>
      <div className="stat-grid" style={{marginBottom:22}}>
        <div className="stat"><div className="stat-label">Awaiting review</div><strong>126</strong></div>
        <div className="stat"><div className="stat-label">Ready to publish</div><strong>48</strong></div>
        <div className="stat"><div className="stat-label">Published questions</div><strong>888</strong></div>
      </div>
      <div className="admin-grid">
        <aside className="card admin-filters">
          <strong>Queue filters</strong>
          {[["All drafts","126"],["Validation errors","9"],["Possible duplicates","14"],["Needs explanation","55"],["Ready","48"]].map(([label,value])=><div className="filter-line" key={label}><span>{label}</span><strong>{value}</strong></div>)}
        </aside>
        <section className="card">
          {queue.map((item,index)=><div className="queue-row" key={item.text}>
            <div className="meta" style={{marginTop:10}}>Source verified · Difficulty suggestion: Moderate · Explanation present</div>
            <div className="queue-actions"><button className="secondary">Open editor</button><button className="primary" onClick={()=>setStatus((s)=>({...s,[index]:"Published"}))}>Approve & publish</button><button className="quiet" onClick={()=>setStatus((s)=>({...s,[index]:"Rejected"}))}>Reject</button></div>
          </div>)}
        </section>
      </div>
    </>
  );
}

void AdminLegacy;

function Legal() {
  return <article className="legal"><div className="eyebrow">Legal</div><h1 style={{marginTop:10}}>Trust and transparency</h1><h2>Independent preparation platform</h2><p>UPSCPuraan is an independent educational product and is not affiliated with, endorsed by, or connected to the Union Public Service Commission.</p><h2>Question provenance</h2><p>Previous-year questions retain exam, year, paper and source references. Generated questions are labelled and must pass editorial review before publication.</p><h2>Privacy</h2><p>We collect only the account and attempt information needed to save progress and provide performance analysis. We do not sell student data.</p></article>;
}
