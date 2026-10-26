import historicalBank from '../content/question-bank.json' with { type: 'json' };
import pilotImports from '../content/reviewed-prelims-imports.json' with { type: 'json' };
import importPolicy from '../content/prelims-import-review-policy.json' with { type: 'json' };
import reproductionOverrides from '../content/prelims-reproduction-overrides.json' with { type: 'json' };
import materialSourceRepairs from '../content/prelims-material-source-repairs.json' with { type: 'json' };
import officialNdaPaper from '../content/nda-2026-i-official-paper.json' with { type: 'json' };
import officialNdaIIPaper from '../content/nda-2026-ii-official-paper.json' with { type: 'json' };
import officialNda2025IIPaper from '../content/nda-2025-ii-official-paper.json' with { type: 'json' };
import {prelimsPath,reviewedPrelimsPlacements,PRELIMS_TAXONOMY_VERSION} from './prelims-taxonomy.ts';

const cleared = new Set(['official-final', 'official-provisional', 'reasoned-verified']);
const policy: Record<string, {status: string}> = importPolicy;
// Missing import-policy entries fail closed; the legacy bank keeps its existing gate.
const approvedImports = pilotImports.questions.filter(q => cleared.has(policy[q.id]?.status));
const ids = new Set(historicalBank.questions.map(q => q.id));
for (const question of approvedImports) {
  if (ids.has(question.id)) throw new Error(`Duplicate imported question ID: ${question.id}`);
  ids.add(question.id);
}
const placements = new Map(pilotImports.placements.filter(p => p.status === 'approved' && p.rationale && p.secondPass).map(p => [p.questionId, p]));
export const legacyQuestions = [...historicalBank.questions.map(question => {
  const placement = placements.get(question.id);
  return placement ? { ...question, subject: placement.subject, topic: placement.topic, subtopic: placement.subtopic, taxonomyHead: placement.taxonomyHead } : question;
}), ...approvedImports];
const patches:Record<string,{promptLines:string[];sourceText:string;sourceTextHash:string;options?:{A:string;B:string;C:string;D:string}}>={...reproductionOverrides,...materialSourceRepairs};
const reviewedBaseQuestions=legacyQuestions.map(question=>{
  const patch=patches[question.id];
  const reviewedQuestion=patch?{...question,promptLines:patch.promptLines,sourceText:patch.sourceText,sourceTextHash:patch.sourceTextHash,...(patch.options?{options:patch.options}:{})}:question;
  const placement=reviewedPrelimsPlacements.get(question.id);
  if(!placement?.primaryId)return reviewedQuestion;
  const primary=prelimsPath(placement.primaryId);
  if(!primary)throw new Error(`Unknown approved primary: ${question.id}`);
  const additionalPaths=(placement.additionalIds||[]).map(id=>{
    const path=prelimsPath(id);
    if(!path)throw new Error(`Unknown approved additional placement: ${question.id}`);
    return {subject:path.subject,head:path.head,chapter:path.chapter,subtopic:path.subtopic,taxonomyId:path.id};
  });
  return {...reviewedQuestion,subject:primary.subject,topic:primary.chapter,subtopic:primary.subtopic,taxonomyHead:primary.head,taxonomyChapter:primary.chapter,taxonomySubtopic:primary.subtopic,taxonomyId:primary.id,taxonomyVersion:PRELIMS_TAXONOMY_VERSION,additionalPaths};
});
// Approved official-key overlay: raw imports, historical IDs and old snapshots
// remain immutable. The build validates all 63 expected pre-change hashes.
const officialQuestions=[...officialNdaPaper.questions,...officialNdaIIPaper.questions,...officialNda2025IIPaper.questions];
const officialById=new Map(officialQuestions.map(q=>[q.id,q]));
const priorIds=new Set(reviewedBaseQuestions.map(q=>q.id));
export const combinedQuestions=[...reviewedBaseQuestions.map(question=>{
  const official=officialById.get(question.id);
  const priorAdditionalPaths='additionalPaths' in question?question.additionalPaths:undefined;
  return official?{...question,...official,additionalPaths:official.preparationScope==='gs'?(priorAdditionalPaths??official.additionalPaths):official.additionalPaths}:question;
}),...officialQuestions.filter(q=>!priorIds.has(q.id))];
export default { ...historicalBank, questions: combinedQuestions };
