/** Preparation target is deliberately separate from a question's source exam. */
export const PREPARATION_EXAMS = ['NDA', 'CDS', 'CSE'] as const;
export type PreparationExam = typeof PREPARATION_EXAMS[number];
export function isPreparationExam(value: unknown): value is PreparationExam {
  return typeof value === 'string' && PREPARATION_EXAMS.includes(value as PreparationExam);
}
export type PreparationView = { id: string; paper: string; label: string; subjectIds: string[] };
export const PREPARATION_VERSION = 'preparation-v1.2-nda-science';
export function preparationDraftKey(exam: PreparationExam) { return `upsc-pyq-builder:preparation-v1:${exam}`; }
/** NDA's single-subject views open their sections, not a wrapper card. */
export function preparationLandingScope(exam:PreparationExam|undefined,view:PreparationView|undefined){
  return exam==='NDA'&&view&&['nda-science','nda-english','nda-maths'].includes(view.id)?view.subjectIds[0]:undefined;
}
