import assert from 'node:assert/strict';

// Fresh visual readings of UPSC's Series A page: columns first, then rows.
const columns = [
 'CADCBABCDCBACAB', 'CDCBBBCDBDDADBA', 'ACBBDBCDCDADCAA',
 'BDCBCCCDBBCACBA', 'DACDBABDBCCBABA', 'AACCABDADDDBADC',
 'ACACBDCCABDAADA', 'CDDDBCBBCDDDDCD', 'BDACBAADDBBDADD',
 'CBCBBCBADBBABCC',
];
const rows = [
 'CCABDAACBC', 'ADCDAACDDB', 'DCBCCCADAC', 'CBBBDCCDCB', 'BBDCBABBBB',
 'ABBCABDCAC', 'BCCCBDCBAB', 'CDDDDACBDA', 'DBCBBDACDD', 'CDDBCDBDBB',
 'BDACCDDDBB', 'AADABBADDA', 'CDCCAAADAB', 'ABABBDDCDC', 'BAAAACADDC',
];
assert.equal(columns.length, 10); assert.equal(rows.length, 15);
assert.ok(columns.every(value => /^[ABCD]{15}$/.test(value)));
assert.ok(rows.every(value => /^[ABCD]{10}$/.test(value)));
for (let r = 0; r < 15; r++) for (let c = 0; c < 10; c++) {
 assert.equal(columns[c][r], rows[r][c], `Official key reread disagreement Q${15*c+r+1}`);
}
export const officialNda2026IIKey = Object.fromEntries(columns.flatMap((column,c) => [...column].map((answer,r) => [15*c+r+1,answer])));
export const officialNda2026IIEvidence = {
 status:'official-provisional', issuer:'Union Public Service Commission',
 releasedAt:'2026-09-16', retrievedAt:'2026-10-25',
 url:'https://www.upsc.gov.in/sites/default/files/ProvAnsKey-GAT-NDANA-II-26-160926.pdf',
 asset:'/papers/nda-2026-ii-gat/official-provisional-key.pdf',
 sha256:'1d86b52baed1a38607c7203bbccfb3625c78168cf351484bc5b6a45c101d01f3',
 page:1,series:'A',session:'II',paper:'II',subject:'GAT',totalQuestions:150,dropped:0,scored:150,
 visualReview:'Official PDF downloaded afresh from UPSC; its hash matches the prior preserved copy. Page 1 explicitly identifies NDA & NA-II-Exam-2026 (PROVISIONAL KEY), Series A, GAT, 150 questions and zero dropped. All 150 cells reread column-first and row-first; both transcriptions agree. Question-paper cover independently identifies examination II, 2026 and Series A.',
 searchLog:[
  {date:'2026-10-25',url:'https://www.upsc.gov.in/examinations/answer-keys',result:'Plural route redirected to the homepage; not evidence that no key exists.'},
  {date:'2026-10-25',url:'https://www.upsc.gov.in/examinations/answer-key',result:'Current official key listing inspected; targeted official-domain searches for a later final/revised NDA II 2026 GAT key did not recover one. No claim of nonpublication.'},
  {date:'2026-10-25',url:'https://www.upsc.gov.in/sites/default/files/ProvAnsKey-GAT-NDANA-II-26-160926.pdf',result:'Direct download succeeded; original bytes hashed and Series A grid visually reviewed. Use provisional status, not official-final.'},
 ],
};
