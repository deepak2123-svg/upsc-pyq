import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {nda2026IIScience} from './prelims-reviewed-nda-2026-ii-science.mjs';
import {nda2026IIGs} from './prelims-reviewed-nda-2026-ii-gs.mjs';

const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
export const nda2026IIEvidence={
 exam:'NDA',year:2026,paper:'II',series:'A',questionCount:150,
 originalPdf:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-2.pdf',
 originalPdfSha256:'cc524b288fb4136f50ae648face0bd648a8a0c1f0753e9e8c5130f723cc9a987',
 keyPdf:'../.tmp/full_reaudit_answer_keys/NDA/2026_II_GAT_provisional.pdf',
 keySha256:'1d86b52baed1a38607c7203bbccfb3625c78168cf351484bc5b6a45c101d01f3',
 keyUrl:'https://www.upsc.gov.in/sites/default/files/ProvAnsKey-GAT-NDANA-II-26-160926.pdf',
 keyPage:1,keyStatus:'official-provisional',
};
// Separate manual read of the Series A grid, in original question-number order.
export const nda2026IIKey={
 51:'C',52:'C',53:'D',54:'B',55:'B',56:'C',57:'A',58:'C',59:'B',60:'A',
 61:'D',62:'A',63:'C',64:'D',65:'B',66:'A',67:'B',68:'D',69:'B',70:'C',
 71:'C',72:'B',73:'A',74:'B',75:'A',76:'A',77:'A',78:'C',79:'C',80:'A',
 81:'B',82:'D',83:'A',84:'D',85:'D',86:'D',87:'B',88:'A',89:'D',90:'C',
 91:'A',92:'C',93:'A',94:'C',95:'B',96:'D',97:'C',98:'C',99:'A',100:'B',
 101:'D',102:'A',103:'A',104:'D',105:'A',106:'C',107:'D',108:'D',109:'D',110:'B',
 111:'C',112:'B',113:'B',114:'C',115:'D',116:'D',117:'D',118:'D',119:'C',120:'D',
 121:'B',122:'D',123:'A',124:'C',125:'B',126:'A',127:'A',128:'D',129:'D',130:'B',
 131:'B',132:'D',133:'A',134:'D',135:'D',136:'C',137:'B',138:'C',139:'B',140:'B',
 141:'C',142:'B',143:'A',144:'D',145:'B',146:'B',147:'A',148:'B',149:'C',150:'C',
};
const rows=[...nda2026IIScience,...nda2026IIGs];
assert.deepEqual(rows.map(r=>r[0]),Array.from({length:100},(_,i)=>i+51));
const caveats={
 56:'Official provisional key: C (Three). Editorial caveat: the usual far-field magnetic dipole of a bar magnet follows an inverse-cube dependence, whereas a single-pole approximation follows an inverse-square dependence. The printed item does not specify the approximation. The provisional examination answer is retained, not presented as unqualified scientific consensus.',
 107:'Official provisional key: D (I and II only). Editorial caveat: the Coriolis parameter depends on sin(latitude), not directly on the angle itself. The printed statement II and official provisional answer are preserved without silently repairing the question.',
};
export const nda2026IIQuestions=rows.map(([number,page,path,stem,options,answer,rationale,additional=[]])=>{
 const [subject,head,chapter,leaf]=path.split('/');assert.ok(leaf&&options.length===4&&stem.length);
 assert.equal(answer,nda2026IIKey[number],`Key transcription conflict Q${number}`);
 const sourceText=stem.join(' ');
 return {id:`nda-2026-ii-${number}`,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),
  exam:'NDA',year:2026,paper:'II',questionNumber:number,subject,topic:chapter,subtopic:leaf,taxonomyHead:head,difficulty:'Moderate',promptLines:stem,
  options:Object.fromEntries(options.map((text,i)=>['ABCD'[i],text])),answer,
  explanation:caveats[number]||`The official provisional Series A key accepts ${answer}: ${options['ABCD'.indexOf(answer)]}. This is the provisional examination answer, not a final key.`,
  requiresFigure:false,additionalPaths:additional.map(value=>{const [subject,head,chapter,subtopic]=value.split('/');return {subject,head,chapter,subtopic};}),
  classificationTags:number>=140&&number!==142?['Event-based']:['Static'],
  source:{dataset:'Reviewed NDA II 2026 GAT imports',exam:'NDA',year:2026,paper:'II',questionNumber:number,
   originalPdf:nda2026IIEvidence.originalPdf,originalPdfSha256:nda2026IIEvidence.originalPdfSha256,originalPage:page,bookletSeries:'A',
   answerStatus:'official-provisional-key-and-reproduction-reviewed',answerSource:nda2026IIEvidence.keyUrl,
   keyPdf:nda2026IIEvidence.keyPdf,keySha256:nda2026IIEvidence.keySha256,keyPage:1,officialAnswer:answer,displayedAnswer:answer,optionsReordered:false,
   reproductionReview:`Rendered English original page ${page}: full stem, statements and all four options compared; mathematical expressions retained as Unicode text; no diagram is required for this item.`,
   classificationRationale:rationale,
   secondPass:`Separate second-pass check against complete English page ${page} and independently transcribed Series A Q${number} cell on key page 1. Negative qualifiers, false assertions, units and option order retained.`,
   ...(caveats[number]?{editorialCaveat:caveats[number]}:{}),
  },
 };
});

export function validateNda2026IIEvidence(){
 assert.equal(hash(fs.readFileSync(nda2026IIEvidence.originalPdf)),nda2026IIEvidence.originalPdfSha256);
 assert.equal(hash(fs.readFileSync(nda2026IIEvidence.keyPdf)),nda2026IIEvidence.keySha256);
}
