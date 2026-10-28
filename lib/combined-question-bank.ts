import historicalBank from '../content/question-bank.json' with { type: 'json' };
import pilotImports from '../content/reviewed-prelims-imports.json' with { type: 'json' };
import importPolicy from '../content/prelims-import-review-policy.json' with { type: 'json' };
import reproductionOverrides from '../content/prelims-reproduction-overrides.json' with { type: 'json' };
import materialSourceRepairs from '../content/prelims-material-source-repairs.json' with { type: 'json' };
import officialNdaPaper from '../content/nda-2026-i-official-paper.json' with { type: 'json' };
import officialNdaIIPaper from '../content/nda-2026-ii-official-paper.json' with { type: 'json' };
import officialNda2025IIPaper from '../content/nda-2025-ii-official-paper.json' with { type: 'json' };
import officialNda2025IPaper from '../content/nda-2025-i-official-paper.json' with { type: 'json' };
import reviewedNda2024IIPaper from '../content/nda-2024-ii-reviewed-paper.json' with {type:'json'};
import officialNda2024IPaper from '../content/nda-2024-i-official-paper.json' with {type:'json'};
import officialNda2023IIPaper from '../content/nda-2023-ii-official-paper.json' with {type:'json'};
import {prelimsPath,reviewedPrelimsPlacements,PRELIMS_TAXONOMY_VERSION} from './prelims-taxonomy.ts';
import type {PyqQuestion} from './pyq-catalog';

// Bound the catalogue's TypeScript shape instead of constructing an exponentially
// large union from every imported JSON variant. This does not discard runtime fields.
type BankQuestion=Omit<PyqQuestion,'exam'|'origin'> & {exam:string;origin:string;sourceText:string;source:Record<string,unknown>;preparationScope?:string;taxonomyVersion?:string};

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
const reviewedBaseQuestions:BankQuestion[]=legacyQuestions.map(question=>{
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
// Approved paper overlays, each retaining its own official/reasoned evidence label.
// Raw imports, historical IDs and old snapshots remain immutable; builders guard
// the original records' hashes before applying any paper correction.
const freshPlacementIds=new Set([...reviewedNda2024IIPaper.questions,...officialNda2024IPaper.questions,...officialNda2023IIPaper.questions].map(q=>q.id));
const officialQuestions:BankQuestion[]=[...officialNdaPaper.questions,...officialNdaIIPaper.questions,...officialNda2025IIPaper.questions,...officialNda2025IPaper.questions,...reviewedNda2024IIPaper.questions,...officialNda2024IPaper.questions,...officialNda2023IIPaper.questions];
const officialById=new Map(officialQuestions.map(q=>[q.id,q]));
const priorIds=new Set(reviewedBaseQuestions.map(q=>q.id));
export const combinedQuestions=[...reviewedBaseQuestions.map(question=>{
  const official=officialById.get(question.id);
  const priorAdditionalPaths='additionalPaths' in question?question.additionalPaths:undefined;
  if(!official)return question;
  const merged={...question,...official};
  merged.additionalPaths=freshPlacementIds.has(official.id)?official.additionalPaths:official.preparationScope==='gs'?(priorAdditionalPaths??official.additionalPaths):official.additionalPaths;
  return merged;
}),...officialQuestions.filter(q=>!priorIds.has(q.id))];
export default { ...historicalBank, questions: combinedQuestions };
