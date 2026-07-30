"use client";

import { useEffect, useMemo, useState } from "react";
import questionBank from "../content/question-bank.json";

type Screen = "dashboard" | "builder" | "attempt" | "results" | "admin" | "legal";
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
  answer: string;
  explanation: string;
  requiresFigure: boolean;
};

const questions = questionBank.questions as Question[];

const attempts = [
  { title: "CSE · Geography mixed", date: "Today, 09:42", score: "36.8 / 50", accuracy: "78%", time: "38m", tone: "good" },
  { title: "CAPF · Polity & History", date: "28 Jul, 18:10", score: "24.2 / 40", accuracy: "66%", time: "31m", tone: "mid" },
  { title: "NDA · Physical Geography", date: "26 Jul, 07:15", score: "31.3 / 40", accuracy: "81%", time: "27m", tone: "good" },
];

export function UPSCPuraanApp() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [exam, setExam] = useState("CSE");
  const [subjects, setSubjects] = useState<string[]>([]);
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

  const availableSubjects = useMemo(() => {
    const pool = sourceMix ? questions : questions.filter((q) => q.exam === exam);
    return [...new Set(pool.map((q) => q.subject))].sort((a, b) => a.localeCompare(b));
  }, [exam, sourceMix]);

  useEffect(() => {
    setSubjects((currentSubjects) => currentSubjects.filter((subject) => availableSubjects.includes(subject)));
  }, [availableSubjects]);

  const eligibleQuestions = useMemo(() => {
    const examPool = sourceMix ? questions : questions.filter((q) => q.exam === exam);
    const subjectPool = examPool.filter((q) => subjects.length === 0 || subjects.includes(q.subject));
    if (difficulty === "All types") return subjectPool;
    if (difficulty !== "Mixed") return subjectPool.filter((q) => q.difficulty === difficulty);

    const buckets: Record<QuestionDifficulty, Question[]> = {
      Easy: subjectPool.filter((q) => q.difficulty === "Easy"),
      Moderate: subjectPool.filter((q) => q.difficulty === "Moderate"),
      Hard: subjectPool.filter((q) => q.difficulty === "Hard"),
    };
    const balanced: Question[] = [];
    const depth = Math.max(buckets.Easy.length, buckets.Moderate.length, buckets.Hard.length);
    for (let index = 0; index < depth; index += 1) {
      for (const level of ["Easy", "Moderate", "Hard"] as QuestionDifficulty[]) {
        if (buckets[level][index]) balanced.push(buckets[level][index]);
      }
    }
    return balanced;
  }, [exam, sourceMix, subjects, difficulty]);

  const visibleQuestions = useMemo(() => eligibleQuestions.slice(0, count), [eligibleQuestions, count]);

  useEffect(() => {
    if (screen !== "attempt" || mode !== "Exam") return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          setScreen("results");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen, mode]);

  function toggleSubject(value: string) {
    if (value === "All subjects") {
      setSubjects([]);
      return;
    }
    setSubjects((currentSubjects) =>
      currentSubjects.includes(value)
        ? currentSubjects.filter((subject) => subject !== value)
        : [...currentSubjects, value],
    );
  }

  function beginTest() {
    if (visibleQuestions.length < count) return;
    setCurrent(0);
    setAnswers({});
    setReview([]);
    setRevealed([]);
    setSeconds(duration * 60);
    setScreen("attempt");
  }

  function answerQuestion(key: string) {
    setAnswers((existing) => ({ ...existing, [current]: key }));
    if (mode === "Practice") {
      setRevealed((existing) => existing.includes(current) ? existing : [...existing, current]);
    }
  }

  function navigate(target: number) {
    setCurrent(Math.max(0, Math.min(visibleQuestions.length - 1, target)));
  }

  const navItems: { label: string; icon: string; target: Screen }[] = [
    { label: "Home", icon: "⌂", target: "dashboard" },
    { label: "Create test", icon: "＋", target: "builder" },
    { label: "Attempts", icon: "◷", target: "dashboard" },
    { label: "Editorial", icon: "✎", target: "admin" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
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
      </aside>

      <main className="main">
        {screen !== "attempt" && (
          <header className="topbar">
            <div className="eyebrow">{screen === "admin" ? "Editorial workspace" : "UPSC test lab"}</div>
            <button className="avatar" aria-label="Open profile">AS</button>
          </header>
        )}

        {screen === "dashboard" && <Dashboard onCreate={() => setScreen("builder")} onResume={() => setScreen("attempt")} />}
        {screen === "builder" && (
          <Builder
            exam={exam}
            setExam={setExam}
            subjects={subjects}
            toggleSubject={toggleSubject}
            availableSubjects={availableSubjects}
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
          />
        )}
        {screen === "attempt" && (
          <Attempt
            exam={exam}
            mode={mode}
            questions={visibleQuestions}
            current={current}
            answers={answers}
            review={review}
            revealed={revealed}
            seconds={seconds}
            answerQuestion={answerQuestion}
            navigate={navigate}
            toggleReview={() => setReview((items) => items.includes(current) ? items.filter((n) => n !== current) : [...items, current])}
            submit={() => setScreen("results")}
          />
        )}
        {screen === "results" && <Results onRetake={beginTest} onHome={() => setScreen("dashboard")} />}
        {screen === "admin" && <Admin />}
        {screen === "legal" && <Legal />}
      </main>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navItems.map((item) => (
          <button key={item.label} className={screen === item.target ? "active" : ""} onClick={() => setScreen(item.target)}>
            <span style={{display:"block", fontSize:16, marginBottom:2}}>{item.icon}</span>{item.label}
          </button>
        ))}
      </nav>
    </div>
  );
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

      <div className="section-head"><h2>Recent attempts</h2><button className="quiet">View all</button></div>
      <div className="card">
        {attempts.map((attempt) => (
          <div className="attempt-row" key={attempt.title}>
            <div><div className="attempt-title">{attempt.title}</div><div className="meta">{attempt.date}</div></div>
            <div><div className="meta">Score</div><span className={`score ${attempt.tone}`}>{attempt.score}</span></div>
            <div><div className="meta">Accuracy</div><strong>{attempt.accuracy}</strong></div>
            <div><div className="meta">Time</div><strong>{attempt.time}</strong></div>
            <button className="quiet">Review</button>
          </div>
        ))}
      </div>

      <div className="section-head"><h2>Needs attention</h2><span className="meta">Based on your last 10 tests</span></div>
      <div className="weak-grid">
        {[
          ["Physical geography", "58%", 58],
          ["Constitutional bodies", "63%", 63],
          ["Ancient India", "69%", 69],
        ].map(([name, value, width], index) => (
          <div className="card weak-card" key={String(name)}>
            <div className="weak-top"><strong>{name}</strong><span className="meta">{value}</span></div>
            <div className={`bar ${index < 2 ? "warn" : ""}`}><span style={{width:`${width}%`}} /></div>
          </div>
        ))}
      </div>
    </>
  );
}

type BuilderProps = {
  exam: string; setExam: (v:string)=>void;
  subjects: string[]; toggleSubject:(v:string)=>void; availableSubjects:string[];
  difficulty: Difficulty; setDifficulty:(v:Difficulty)=>void;
  mode: Mode; setMode:(v:Mode)=>void;
  count:number; setCount:(v:number)=>void;
  duration:number; setDuration:(v:number)=>void;
  sourceMix:boolean; setSourceMix:(v:boolean)=>void;
  inventoryCount:number;
  beginTest:()=>void;
};

function Builder(props: BuilderProps) {
  return (
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
        <div><h3>Difficulty</h3><div className="choice-grid">
          {(["All types","Easy","Moderate","Hard","Mixed"] as Difficulty[]).map((value)=><button key={value} className={`choice ${props.difficulty===value?"selected":""}`} onClick={()=>props.setDifficulty(value)}><strong>{value}</strong><small>{value==="All types"?"No difficulty filter":value==="Mixed"?"Balanced selection":`${value} questions`}</small></button>)}
        </div></div>
      </div>

      <div className="step">
        <div className="step-no">4</div>
        <div><h3>Length and pace</h3><div className="range-row">
          <div className="field"><label>Questions: {props.count}</label><input type="range" min="5" max="100" step="5" value={props.count} onChange={(e)=>props.setCount(Number(e.target.value))} /></div>
          <div className="field"><label>Duration: {props.duration} minutes</label><input type="range" min="10" max="120" step="5" value={props.duration} onChange={(e)=>props.setDuration(Number(e.target.value))} /></div>
        </div></div>
      </div>

      <div className="step">
        <div className="step-no">5</div>
        <div><h3>Attempt style</h3><div className="choice-grid" style={{gridTemplateColumns:"repeat(2,1fr)"}}>
          {(["Exam","Practice"] as Mode[]).map((value)=><button key={value} className={`choice ${props.mode===value?"selected":""}`} onClick={()=>props.setMode(value)}><strong>{value} mode</strong><small>{value==="Exam"?"Timed, answers after submit":"Instant feedback and explanations"}</small></button>)}
        </div>
        <label style={{display:"flex",gap:10,alignItems:"center",marginTop:16,fontSize:13}}><input type="checkbox" checked={props.sourceMix} onChange={(e)=>props.setSourceMix(e.target.checked)} /> Include relevant questions from sibling UPSC exams</label>
        </div>
      </div>

      <div className="card builder-summary">
        <div><strong>{props.exam}{props.sourceMix ? " + sibling exams" : ""} · {props.count} questions · {props.duration} min</strong><div className="meta">{props.difficulty === "All types" ? "All difficulty types" : props.difficulty} · {props.mode} mode · {props.subjects.join(", ") || "All subjects"}</div>{props.inventoryCount===0 && <div className="inventory-error" role="alert">No eligible questions match these filters. Choose a broader subject or difficulty.</div>}{props.inventoryCount>0 && props.inventoryCount<props.count && <div className="inventory-error" role="alert">Only {props.inventoryCount} eligible questions match these filters; choose a broader recipe or fewer questions.</div>}</div>
        <button className="primary" onClick={props.beginTest} disabled={props.inventoryCount<props.count}>Generate test →</button>
      </div>
    </div>
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
  return (
    <div className="test-shell">
      <header className="test-head">
        <div><strong>{exam} · Focus test</strong><div className="meta">{mode} mode · Autosaved</div></div>
        <div className="timer" aria-label={`${mm} minutes ${ss} seconds remaining`}>{mode==="Exam" ? `${mm}:${ss}` : "Practice"}</div>
        <button className="secondary" onClick={submit}>Submit</button>
      </header>
      <div className="test-grid">
        <section className="card question-card">
          <div className="q-meta"><span>Question {current+1} of {qs.length}</span><span>{q.subject} · {q.difficulty} · {q.exam} {q.year} {q.paper} Q{q.questionNumber}</span></div>
          <div className="source-lock" aria-label="Original exam wording">PYQ · Source verbatim</div>
          <div className="prompt-lines">
            {q.promptLines.map((line, index) => <p key={`${q.id}-line-${index}`}>{line}</p>)}
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

function Results({onRetake,onHome}:{onRetake:()=>void;onHome:()=>void}) {
  return (
    <>
      <div className="eyebrow">Test complete</div><h1 style={{marginTop:10}}>A solid attempt.</h1><p className="muted">Your accuracy is improving. Physical geography needs another focused round.</p>
      <section className="card results-hero">
        <div className="score-ring"><div><strong>36.8</strong><span className="meta">out of 50</span></div></div>
        <div>
          <h2>CSE · Geography mixed</h2>
          <div className="meta">20 questions · 27 min 42 sec · Exam scoring</div>
          <div className="breakdown"><div><strong>14</strong><div className="meta">Correct</div></div><div><strong>4</strong><div className="meta">Incorrect</div></div><div><strong>2</strong><div className="meta">Unattempted</div></div></div>
          <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap"}}><button className="primary">Review solutions</button><button className="secondary" onClick={onRetake}>Retake</button><button className="quiet" onClick={onHome}>Dashboard</button></div>
        </div>
      </section>
      <div className="section-head"><h2>Subject breakdown</h2><span className="meta">Accuracy</span></div>
      <div className="weak-grid">
        {[["Indian geography","82%",82],["Physical geography","58%",58],["Human geography","76%",76]].map(([name,value,width],index)=><div className="card weak-card" key={String(name)}><div className="weak-top"><strong>{name}</strong><span>{value}</span></div><div className={`bar ${index===1?"warn":""}`}><span style={{width:`${width}%`}} /></div></div>)}
      </div>
      <div className="section-head"><h2>Recommended next step</h2></div>
      <div className="card" style={{padding:20,display:"flex",justifyContent:"space-between",alignItems:"center",gap:20}}>
        <div><strong>10-question Physical Geography drill</strong><div className="meta">Moderate difficulty · Practice mode · about 12 minutes</div></div><button className="secondary" onClick={onRetake}>Start drill →</button>
      </div>
    </>
  );
}

function Admin() {
  const [status, setStatus] = useState<Record<number,string>>({});
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
            <div className="queue-top"><div><div className="meta">{item.exam} · {item.subject}</div><strong style={{display:"block",marginTop:7,lineHeight:1.5}}>{item.text}</strong></div><span className={`badge ${status[index]==="Published"?"ready":item.type}`}>{status[index]||item.badge}</span></div>
            <div className="meta" style={{marginTop:10}}>Source verified · Difficulty suggestion: Moderate · Explanation present</div>
            <div className="queue-actions"><button className="secondary">Open editor</button><button className="primary" onClick={()=>setStatus((s)=>({...s,[index]:"Published"}))}>Approve & publish</button><button className="quiet" onClick={()=>setStatus((s)=>({...s,[index]:"Rejected"}))}>Reject</button></div>
          </div>)}
        </section>
      </div>
    </>
  );
}

function Legal() {
  return <article className="legal"><div className="eyebrow">Legal</div><h1 style={{marginTop:10}}>Trust and transparency</h1><h2>Independent preparation platform</h2><p>UPSCPuraan is an independent educational product and is not affiliated with, endorsed by, or connected to the Union Public Service Commission.</p><h2>Question provenance</h2><p>Previous-year questions retain exam, year, paper and source references. Generated questions are labelled and must pass editorial review before publication.</p><h2>Privacy</h2><p>We collect only the account and attempt information needed to save progress and provide performance analysis. We do not sell student data.</p></article>;
}
