import {combinedQuestions} from './combined-question-bank';
import {questionEligible} from './question-review';
import type {PyqExam} from './pyq-exams';

export type TrendQuestion={exam:PyqExam;paper:string;term:string;year:number;subject:string;topic:string;subtopic:string;taxonomyId?:string|null;count:number};

function termOf(question:{exam:string;paper:string}){
 if(question.exam==='NDA')return /(^|\s|·)II(\s|·|$)/.test(question.paper)?'II':'I';
 if(question.exam==='CDS')return question.paper==='2'||/(^|\s|·)II(\s|·|$)/.test(question.paper)?'II':'I';
 return '—';
}
function paperOf(question:{exam:string;paper:string;subject:string}){
 if(question.exam==='NDA')return /math/i.test(`${question.paper} ${question.subject}`)?'Mathematics':'GAT';
 if(question.exam==='CDS'){
  if(/english/i.test(question.subject))return 'English';
  if(/math/i.test(question.subject))return 'Elementary Mathematics';
  return 'General Knowledge';
 }
 if(question.exam==='CSE')return 'GS Paper I';
 return 'Paper I';
}

export function getTrendQuestions():TrendQuestion[]{
 const rows=new Map<string,TrendQuestion>();
 for(const question of combinedQuestions){
  if(!questionEligible(question.id))continue;
  const row:TrendQuestion={exam:question.exam as PyqExam,paper:paperOf(question),term:termOf(question),year:question.year,
   subject:question.subject,topic:question.taxonomyChapter||question.topic||question.subject,
   subtopic:question.taxonomySubtopic||question.subtopic||question.topic||question.subject,
   taxonomyId:question.taxonomyId,count:1};
  const key=[row.exam,row.paper,row.term,row.year,row.subject,row.topic,row.subtopic].join('\u0000');
  const existing=rows.get(key);if(existing)existing.count++;else rows.set(key,row);
 }
 return [...rows.values()];
}
