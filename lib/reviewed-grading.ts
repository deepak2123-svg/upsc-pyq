import bank from './combined-question-bank.ts';
import {questionExclusion,questionReviewRevision} from './question-review.ts';

const canonical = new Map(bank.questions.map(q=>[q.id,q]));
export function reviewedAnswer(question:{id:string;contentRevision?:number;correctOption?:string;answer?:string;explanation?:string|null}) {
  const exclusionReason=questionExclusion(question.id,question.contentRevision??0);
  return {disposition:exclusionReason?'excluded' as const:'scored' as const,
    correctOption:exclusionReason?null:canonical.get(question.id)?.answer??question.correctOption??question.answer??null,
    exclusionReason,explanation:exclusionReason??canonical.get(question.id)?.explanation??question.explanation??null,reviewRevision:questionReviewRevision(question.id)};
}

export function scoreReviewedQuestions(questionList: readonly {id:string;subject:string;contentRevision?:number;correctOption?:string}[], answers: ReadonlyMap<string,string|null>, scoring:{marksPerQuestion:number;negativeMarksPerQuestion:number}) {
  let correctCount=0,incorrectCount=0,excludedCount=0;
  const breakdown:Record<string,{total:number;correct:number;incorrect:number;unattempted:number;excluded:number;score:number}>={};
  for(const question of questionList) {
    const bucket=breakdown[question.subject]??={total:0,correct:0,incorrect:0,unattempted:0,excluded:0,score:0};
    const review=reviewedAnswer(question);
    if(review.disposition==='excluded') {excludedCount++;bucket.excluded++;continue;}
    bucket.total++;
    const answer=answers.get(question.id);
    if(!answer) bucket.unattempted++;
    else if(answer===review.correctOption) {correctCount++;bucket.correct++;bucket.score+=scoring.marksPerQuestion;}
    else {incorrectCount++;bucket.incorrect++;bucket.score-=scoring.negativeMarksPerQuestion;}
  }
  const scoredCount=questionList.length-excludedCount;
  return {correctCount,incorrectCount,excludedCount,scoredCount,unattemptedCount:scoredCount-correctCount-incorrectCount,
    score:Number((correctCount*scoring.marksPerQuestion-incorrectCount*scoring.negativeMarksPerQuestion).toFixed(4)),
    maxScore:Number((scoredCount*scoring.marksPerQuestion).toFixed(4)),
    accuracy:Number((correctCount+incorrectCount?correctCount/(correctCount+incorrectCount)*100:0).toFixed(4)),breakdown,
    weakAreas:Object.entries(breakdown).filter(([,v])=>v.total>0).map(([subject,v])=>({subject,accuracy:v.correct+v.incorrect?v.correct/(v.correct+v.incorrect):0})).filter(v=>v.accuracy<.7).sort((a,b)=>a.accuracy-b.accuracy).map(v=>v.subject)};
}
