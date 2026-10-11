/** Safe shared constants: never import the answer-bearing catalog into clients. */
export const PYQ_EXAMS = ["CSE", "CAPF", "CDS", "NDA"] as const;
export type PyqExam = (typeof PYQ_EXAMS)[number];

/** A source keeps the same colour in the syllabus, practice and result sheet. */
export const PYQ_EXAM_COLORS: Record<PyqExam, string> = {
  CSE: "#2563eb",
  CAPF: "#b45309",
  CDS: "#0f766e",
  NDA: "#7c3aed",
};
