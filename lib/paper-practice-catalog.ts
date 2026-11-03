import {historicalPyqQuestions,type PyqQuestion} from './pyq-catalog';
import {questionEligible} from './question-review';
export type PaperPracticeExam='CSE'|'CAPF'|'CDS'|'NDA';
export type PaperPracticeRow={id:string;exam:PaperPracticeExam;label:string;color:string;counts:Record<number,number>};
const colors={CSE:'#2f67ed',CAPF:'#bd5500',CDS:'#087f78',NDA:'#7437ef'} as const;
const definitions=[['CSE:paper','CSE','CSE · General Studies'],['CAPF:paper','CAPF','CAPF · Paper I'],['CDS:I:English','CDS','CDS I · English'],['CDS:I:General Knowledge','CDS','CDS I · General Knowledge'],['CDS:I:Elementary Mathematics','CDS','CDS I · Elementary Mathematics'],['CDS:II:English','CDS','CDS II · English'],['CDS:II:General Knowledge','CDS','CDS II · General Knowledge'],['CDS:II:Elementary Mathematics','CDS','CDS II · Elementary Mathematics'],['NDA:I:Mathematics','NDA','NDA I · Mathematics'],['NDA:I:GAT','NDA','NDA I · GAT'],['NDA:II:Mathematics','NDA','NDA II · Mathematics'],['NDA:II:GAT','NDA','NDA II · GAT']] as const;
function cdsSubject(question:PyqQuestion){const value=`${question.subject} ${question.topic}`.toLowerCase();if(value.includes('english'))return 'English';if(value.includes('mathemat'))return 'Elementary Mathematics';return 'General Knowledge';}
function keyFor(question:PyqQuestion){if(question.exam==='CSE')return 'CSE:paper';if(question.exam==='CAPF')return 'CAPF:paper';if(question.exam==='CDS')return `CDS:${question.paper==='2'?'II':'I'}:${cdsSubject(question)}`;const term=question.paper.startsWith('II')?'II':'I';const paper=/mathemat/i.test(`${question.paper} ${question.subject}`)?'Mathematics':'GAT';return `NDA:${term}:${paper}`;}
const eligible=historicalPyqQuestions.filter(question=>questionEligible(question.id));
const byCell=new Map<string,PyqQuestion[]>();
for(const question of eligible){const key=`${keyFor(question)}:${question.year}`;const list=byCell.get(key)||[];list.push(question);byCell.set(key,list);}
export function getPaperPracticeRows():PaperPracticeRow[]{const years=[...new Set(eligible.map(question=>question.year))];return definitions.map(([id,exam,label])=>({id,exam,label,color:colors[exam],counts:Object.fromEntries(years.map(year=>[year,byCell.get(`${id}:${year}`)?.length||0]))}));}
export function getPaperPracticeYears(){return [...new Set(eligible.map(question=>question.year))].sort((a,b)=>a-b);}
export function isPaperPracticeKey(key:string){return byCell.has(key);}
export function resolvePaperKeys(keys:string[]){return [...new Set(keys)].flatMap(key=>byCell.get(key)||[]).filter((question,index,all)=>all.findIndex(item=>item.id===question.id)===index);}
