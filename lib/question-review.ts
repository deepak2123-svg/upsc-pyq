import policy from '../content/question-review-policy.json' with { type: 'json' };
import importPolicy from '../content/prelims-import-review-policy.json' with { type: 'json' };
import scopePolicy from '../content/prelims-gs-scope-policy.json' with { type: 'json' };
import aliasPolicy from '../content/prelims-question-alias-policy.json' with { type: 'json' };
import materialRepairPolicy from '../content/prelims-material-source-repair-policy.json' with { type: 'json' };
import officialNdaPolicy from '../content/nda-2026-i-official-review-policy.json' with {type:'json'};
import officialNdaIIPolicy from '../content/nda-2026-ii-official-review-policy.json' with {type:'json'};

export type QuestionReview = {
  status: string; revision: number; contentRevision: number;
  sourceCorrection?: {exam:string;year:number;paper:string;questionNumber:number};
};
const officialPolicies={...officialNdaPolicy,...officialNdaIIPolicy};
const records: Readonly<Record<string, QuestionReview>> = { ...policy, ...importPolicy, ...aliasPolicy, ...materialRepairPolicy, ...officialPolicies };
const cleared = new Set(['official-final', 'official-provisional', 'reasoned-verified']);
export function questionReview(id: string) { return records[id]; }
export function questionEligible(id: string) { const row = records[id]; return !row || cleared.has(row.status); }
export const gsOutOfScopeIds=Object.keys(scopePolicy);
const outsideGs=new Set([...gsOutOfScopeIds,...Object.entries(officialPolicies).filter(([,row])=>row.preparationScope!=='gs').map(([id])=>id)]);
export function questionInGsScope(id:string){return !outsideGs.has(id);}
export function questionReviewRevision(id: string) { return records[id]?.revision ?? 0; }
export function questionContentRevision(id: string) { return records[id]?.contentRevision ?? 0; }
export const heldQuestionIds = Object.keys(records).filter(id => !questionEligible(id));
export function questionCorrectionNotice(question:{id:string;exam:string;year:number;paper:string;questionNumber:number}) {
  const source=records[question.id]?.sourceCorrection;
  if(!source||(['exam','year','paper','questionNumber'] as const).every(k=>source[k]===question[k])) return null;
  return `Source corrected to ${source.exam} ${source.year} · ${source.paper} · Q${source.questionNumber}. Your saved question is unchanged.`;
}
export function questionExclusion(id: string, snapshotRevision = 0): string | null {
  const row = records[id];
  if (!row) return null;
  if (!cleared.has(row.status)) {
    if (row.status === 'withdrawn') return 'Withdrawn in the official answer key. Excluded from score.';
    if (row.status === 'duplicate') return 'Duplicate source question. Excluded from score.';
    if (row.status === 'quarantined') return 'Unresolved wording or evidence conflict. Excluded from score.';
    return 'Verification pending. Excluded from score.';
  }
  if (snapshotRevision !== row.contentRevision) return 'The saved question predates a material correction. Excluded from score.';
  return null;
}
