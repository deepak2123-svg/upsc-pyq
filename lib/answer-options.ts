import type {AnswerFeedback} from './practice-types';

/** Server-side question input only. Never include this set in a test payload. */
export function acceptedAnswerOptions(question:{answer:string;acceptedAnswers?:readonly string[];options:Record<string,string>}):string[]{
 const values=question.acceptedAnswers??[question.answer];
 if(!values.length||new Set(values).size!==values.length||values.some(v=>!Object.hasOwn(question.options,v))||!values.includes(question.answer))throw new Error('Invalid accepted answer set');
 return [...values];
}
/** Answer-free client code consumes this only after the grading response. */
export function feedbackAnswerOptions(feedback?:Pick<AnswerFeedback,'correctAnswer'|'correctAnswers'>):string[]{
 if(!feedback?.correctAnswer)return [];
 return feedback.correctAnswers??[feedback.correctAnswer];
}
export function feedbackAnswerLabel(feedback?:Pick<AnswerFeedback,'correctAnswer'|'correctAnswers'>){return feedbackAnswerOptions(feedback).join(' / ')||'—';}
export function feedbackAcceptsOption(feedback:Pick<AnswerFeedback,'correctAnswer'|'correctAnswers'>|undefined,option:string|undefined){return option!==undefined&&feedbackAnswerOptions(feedback).includes(option);}
