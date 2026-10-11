/** Safe shared constants: never import the answer-bearing catalog into clients. */
export const PYQ_EXAMS = ["CSE", "CAPF", "CDS", "NDA"] as const;
export type PyqExam = (typeof PYQ_EXAMS)[number];
