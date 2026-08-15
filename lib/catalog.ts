export const catalogExams = {
  CSE: { name: "Civil Services Examination", paper: "General Studies Paper I", description: "Build focused practice sets for UPSC Civil Services General Studies, with exact previous-year wording and editorial explanations." },
  CAPF: { name: "Central Armed Police Forces", paper: "Paper I", description: "Practise General Ability and Intelligence questions for the CAPF Assistant Commandants examination." },
  CDS: { name: "Combined Defence Services", paper: "General Knowledge", description: "Revise the General Knowledge paper with compact, exam-aligned practice sessions." },
  NDA: { name: "National Defence Academy", paper: "General Ability", description: "Train across the General Ability syllabus with adjustable difficulty and timed tests." },
} as const;

export type CatalogExam = keyof typeof catalogExams;

export const catalogSubjects = ["History", "Geography", "Polity", "Economy", "Environment", "Science"] as const;
