import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

// Mechanical original-PDF rendering only. Never supplies an answer or clears a hold.
const original='C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf';
const sha256=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const sourceHash='1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930';
const ranges=[[2,1,10],[3,11,20],[4,21,30],[5,31,40],[6,41,45],[7,46,50],
 [9,51,54],[11,55,60],[13,61,66],[15,67,72],[17,73,75],[19,76,81],
 [21,82,86],[23,87,90],[25,91,97],[27,98,103],[29,104,110],[31,111,117],
 [33,118,123],[35,124,128],[37,129,132],[39,133,137],[41,138,143],[43,144,150]];
const destination='public/papers/nda-2026-i-gat';
const manifestFile='content/nda-2026-i-source-pages.json';
const check=process.argv.includes('--check');
if(!check){
 assert.equal(sha256(fs.readFileSync(original)),sourceHash,'Original paper changed; stop publication');
 fs.mkdirSync(destination,{recursive:true});
 for(const [page] of ranges){
  const output=path.join(destination,`page-${page}`);
  const result=spawnSync('pdftoppm',['-f',String(page),'-l',String(page),'-singlefile','-r','120','-jpeg','-jpegopt','quality=88',original,output],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
 }
}
const pages=ranges.map(([page,first,last])=>{
 const file=`${destination}/page-${page}.jpg`;
 assert.ok(fs.existsSync(file),`Missing original page ${page}`);
 return {page,first,last,src:`/papers/nda-2026-i-gat/page-${page}.jpg`,sha256:sha256(fs.readFileSync(file))};
});
assert.deepEqual(pages.flatMap(p=>Array.from({length:p.last-p.first+1},(_,i)=>p.first+i)),Array.from({length:150},(_,i)=>i+1));
const manifest={version:1,id:'nda-2026-i-gat',exam:'NDA',year:2026,session:'I',paper:'GAT',series:'A',questionCount:150,
 sourceUrl:'https://www.upsc.gov.in/sites/default/files/QP-NDA-NA-I-26-GENERAL-ABILITY-TEST-130426.pdf',sourcePdfSha256:sourceHash,
 mode:'original-source-reference',answerVerification:'official-provisional',
 reproduction:'Unmodified full-page raster renders from the hash-checked original PDF; includes English directions, underlining, all options, tables and diagrams. Page ranges visually checked against the printed numbering. Image access does not establish answer verification.',pages};
const bytes=JSON.stringify(manifest,null,2)+'\n';
if(check)assert.equal(fs.readFileSync(manifestFile,'utf8'),bytes,'Stale published original-page manifest');
else fs.writeFileSync(manifestFile,bytes);
console.log(`Original source: ${pages.length} pages, 150 questions; official-key grading is checked in the separate paper register.`);
