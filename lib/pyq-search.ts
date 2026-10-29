import { historicalPyqQuestions, type PyqQuestion } from './pyq-catalog';
import { questionEligible } from './question-review';

export type PyqSearchResult = Pick<PyqQuestion,'id'|'exam'|'year'|'paper'|'questionNumber'|'subject'|'topic'|'subtopic'|'promptLines'|'options'>;

const normalize=(value:string)=>value.toLocaleLowerCase('en-IN').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();

export function searchPyqs(rawQuery:string,limit=50){
 const query=normalize(rawQuery).slice(0,160),terms=query.split(' ').filter(Boolean);
 if(!terms.length)return {query:'',total:0,results:[] as PyqSearchResult[]};
 const matches=historicalPyqQuestions.filter(question=>questionEligible(question.id)).map(question=>{
  const prompt=normalize(question.promptLines.join(' ')),options=normalize(Object.values(question.options).join(' '));
  const metadata=normalize(`${question.exam} ${question.year} ${question.paper} question ${question.questionNumber} ${question.subject} ${question.topic} ${question.subtopic}`);
  const searchable=`${prompt} ${options} ${metadata}`;
  if(!terms.every(term=>searchable.includes(term)))return null;
  const score=(prompt.includes(query)?12:0)+(options.includes(query)?8:0)+(metadata.includes(query)?6:0)+terms.reduce((sum,term)=>sum+(prompt.includes(term)?3:0)+(metadata.includes(term)?2:0)+(options.includes(term)?1:0),0);
  return {question,score};
 }).filter((value):value is {question:PyqQuestion;score:number}=>!!value).sort((a,b)=>b.score-a.score||b.question.year-a.question.year||a.question.exam.localeCompare(b.question.exam)||a.question.questionNumber-b.question.questionNumber);
 return {query:rawQuery.trim(),total:matches.length,results:matches.slice(0,Math.max(1,Math.min(limit,100))).map(({question})=>({id:question.id,exam:question.exam,year:question.year,paper:question.paper,questionNumber:question.questionNumber,subject:question.subject,topic:question.topic,subtopic:question.subtopic,promptLines:question.promptLines,options:question.options}))};
}
