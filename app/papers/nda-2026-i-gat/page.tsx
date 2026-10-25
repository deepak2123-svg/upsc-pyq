import Link from 'next/link';
import {SiteHeader} from '../../components/site-header';
import {OriginalPaperPractice} from '../../components/original-paper-practice';
import original from '../../../content/nda-2026-i-source-pages.json';
import review from '../../../content/audits/nda-2026-i-review.json';

export const metadata={title:'NDA I 2026 GAT — complete original paper',description:'All 150 original questions, including English, with unscored answer recording. Verification is separate from paper availability.'};

export default function OriginalNdaPaper(){
 const decisions=review.records.map(record=>({number:record.questionNumber,
  status:record.disposition==='reasoned-verified'?'reasoned-verified':record.disposition==='quarantined'?'held':'pending',
  reason:record.disposition==='quarantined'&&'firstPass' in record?record.firstPass?.caveat??'Answer evidence is unresolved.':record.questionNumber<=50?'English transcription and answer verification are pending.':'Current-source answer verification is pending.'}));
 return <><SiteHeader/><main className="original-paper-page">
  <Link href="/prepare/NDA">← NDA library</Link>
  <header><div className="eyebrow">Original paper · Series A</div><h1>NDA I 2026 · GAT</h1>
   <p>All 150 questions · English Q1–50 · Part B Q51–150</p></header>
  <p className="original-paper-notice"><strong>Unscored practice.</strong> Record your answers against the original scanned pages. No score or answer key is supplied here. {review.counts.reasonedVerified} questions have completed this review pass; {review.counts.quarantined} are held. The remaining {150-review.counts.reasonedVerified-review.counts.quarantined} await current-source verification. This view does not add pending questions to scored tests.</p>
  <OriginalPaperPractice paperId={original.id} sourceHash={original.sourcePdfSha256} pages={original.pages} decisions={decisions}/>
  <details className="original-paper-provenance"><summary>Source and verification</summary>
   <p><a href={original.sourceUrl} target="_blank" rel="noreferrer">Original UPSC question paper (PDF)</a>. The displayed images are unmodified page renders, preserving directions, underlining, tables, diagrams and original option order.</p>
   <p>No matching official answer key was recovered in this review. Reasoned answers are not official answers. Existing library availability is not proof of a fresh full-paper review.</p>
   <p>Source PDF SHA-256: <code>{original.sourcePdfSha256}</code></p>
  </details>
 </main></>;
}
