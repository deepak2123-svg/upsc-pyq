import {combinedQuestions} from './combined-question-bank';
import {getPreparationInventory} from './preparation-catalog';
import {PREPARATION_EXAMS,type PreparationExam} from './preparation-exams';
import {questionEligible} from './question-review';
import type {PyqExam} from './pyq-exams';

export type TrendQuestion={exam:PyqExam;paper:string;branch:string;component:string;term:string;year:number;subject:string;topic:string;subtopic:string;taxonomyId?:string|null;count:number};
type ThematicPlacement={paper:string;branch:string;component:string};

function thematicPlacements(){
 const placements=new Map<string,ThematicPlacement>();
 for(const exam of PREPARATION_EXAMS){
  const inventory=getPreparationInventory(exam),nodes=new Map(inventory.nodes.map(node=>[node.id,node]));
  const subjects=new Map(inventory.subjects.map(subject=>[subject.id,subject.label]));
  for(const leaf of inventory.nodes.filter(node=>node.kind==='subtopic')){
   const view=inventory.preparationViews.find(item=>item.subjectIds.includes(leaf.subjectId));
   if(!view)continue;
   let component=subjects.get(leaf.subjectId)||leaf.label;
   if(view.subjectIds.length===1){
    let node=leaf;
    while(node.parentId&&node.parentId!==leaf.subjectId){const parent=nodes.get(node.parentId);if(!parent)break;node=parent;}
    component=node.label;
   }
   const placement={paper:view.paper,branch:exam==='NDA'&&view.paper==='GAT'?view.label:'All',component};
   for(const questionId of leaf.questionIdsByExam?.[exam]||[])if(!placements.has(`${exam}:${questionId}`))placements.set(`${exam}:${questionId}`,placement);
  }
 }
 return placements;
}

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
function branchOf(question:{exam:string;subject:string}){
 if(question.exam!=='NDA')return 'All';
 if(question.subject==='English')return 'English';
 if(question.subject==='Science & Technology')return 'Science';
 return 'GS';
}

export function getTrendQuestions():TrendQuestion[]{
 const placements=thematicPlacements();
 const rows=new Map<string,TrendQuestion>();
 for(const question of combinedQuestions){
  if(!questionEligible(question.id))continue;
  const placement=PREPARATION_EXAMS.includes(question.exam as PreparationExam)?placements.get(`${question.exam}:${question.id}`):undefined;
  const row:TrendQuestion={exam:question.exam as PyqExam,paper:placement?.paper||paperOf(question),branch:placement?.branch||branchOf(question),component:placement?.component||question.subject,term:termOf(question),year:question.year,
   subject:question.subject,topic:question.taxonomyChapter||question.topic||question.subject,
   subtopic:question.taxonomySubtopic||question.subtopic||question.topic||question.subject,
   taxonomyId:question.taxonomyId,count:1};
  const key=[row.exam,row.paper,row.branch,row.component,row.term,row.year,row.subject,row.topic,row.subtopic].join('\u0000');
  const existing=rows.get(key);if(existing)existing.count++;else rows.set(key,row);
 }
 return [...rows.values()];
}
