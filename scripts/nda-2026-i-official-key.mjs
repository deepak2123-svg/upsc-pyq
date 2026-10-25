import assert from 'node:assert/strict';
// Two independent visual readings of official PDF page 1: by column, then row.
// Page heading: NDA & NA (I), 2026, GAT Paper II, Series A, 150, zero dropped.
const columns=['DBDABBDAACBADAA','BDCADBACBDBBDCB','DABBAADABBBDCDB','ADCDAACDCBDDADB','CACABDCABCBADBD','CBDCDCBBABDCDDC','DBCBBDBDBBDACCD','ACACBDCCCCCCBDA','DBADCCACBDAABCA','CDCAAADBBCAABDC'];
const rows=['DBDACCDADC','BDADABBCBD','DCBCCDCAAC','AABDACBCDA','BDAABDBBCA','BBAADCDDCA','DADCCBBCAD','ACADABDCCB','ABBCBABCBB','CDBBCBBCDC','BBBDBDDCAA','ABDDACACAA','DDCADDCBBB','ACDDBDCDCD','ABBBDCDAAC'];
assert.ok(columns.every(column=>/^[ABCD]{15}$/.test(column)));
assert.ok(rows.every(row=>/^[ABCD]{10}$/.test(row)));
for(let r=0;r<15;r++)for(let c=0;c<10;c++)assert.equal(columns[c][r],rows[r][c],`Key transcription disagreement at Q${15*c+r+1}`);
export const officialNda2026IKey=Object.fromEntries(columns.flatMap((column,c)=>[...column].map((answer,r)=>[15*c+r+1,answer])));
export const officialNda2026IKeyEvidence={
 status:'official-provisional',releasedAt:'2026-04-16',retrievedAt:'2026-10-25',
 url:'https://www.upsc.gov.in/sites/default/files/ProvAnsKey%E2%80%93GAT-NDA-I-2026-160426.pdf',
 sha256:'643f6f4a48a6ce137c681ed39bdcfde86aa91f79e222011291cd7a3419c1e806',
 asset:'/papers/nda-2026-i-gat/official-provisional-key.pdf',page:1,series:'A',session:'I',paper:'II',subject:'GAT',totalQuestions:150,dropped:0,scored:150,
 visualReview:'The original UPSC-hosted four-page PDF was downloaded, hashed and page 1 rendered. All 150 Series A cells were independently read by columns and then by rows; both transcriptions agree. The handwritten (I) above the heading identifies the examination session; printed Paper II means GAT, not NDA session II. Original question-paper cover identifies Series A. No option reordering.',
 priorSearchCorrection:'The key was not in the current Answer Keys or archive listings. A historical release reference identified the unusual en dash in the official filename. Prior statements that no matching official key could be recovered were incomplete, not evidence that UPSC had not released one.',
};
