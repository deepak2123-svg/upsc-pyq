import test from 'node:test';
import assert from 'node:assert/strict';
import {combinedQuestions} from '../lib/combined-question-bank.ts';
import {ndaMathematicsChapters,NDA_MATHEMATICS_HEAD,NDA_MATHEMATICS_TAXONOMY_VERSION} from '../lib/nda-mathematics-taxonomy.ts';

const expectedChapters=[
 'Set, Relation, Function and Number System','Polynomials, Quadratic Equations and Inequalities','Sequence and Series','Complex Numbers',
 'Binomial Theorem and Mathematical Induction','Permutation and Combination','Cartesian Coordinates and Straight Lines','Pair of Straight Lines',
 'Circles','Conics — Parabola, Ellipse and Hyperbola','Trigonometry — Ratios, Identities and Equations',
 'Properties of Triangles and Inverse Trigonometric Functions','Height and Distance','Functions, Limits, Continuity and Differentiability',
 'Derivatives','Applications of Derivatives','Indefinite Integration','Definite Integration and Its Applications','Differential Equation',
 'Matrices and Determinants','Probability and Probability Distribution','Vectors','3D Geometry','Statistics',
];

test('NDA Mathematics exposes the requested 24 chapter taxonomy',()=>{
 assert.deepEqual(ndaMathematicsChapters.map(([chapter])=>chapter),expectedChapters);
 assert.ok(ndaMathematicsChapters.every(([,subtopics])=>subtopics.length>=2));
});

test('all 600 existing NDA Mathematics MCQs have exactly one migrated primary chapter and subchapter',()=>{
 const questions=combinedQuestions.filter(q=>q.subject==='Mathematics'&&q.preparationScope==='maths');
 assert.equal(questions.length,600);
 const valid=new Map(ndaMathematicsChapters.flatMap(([chapter,subtopics])=>subtopics.map(subtopic=>[`${chapter}\0${subtopic}`,true])));
 for(const q of questions){
  assert.equal(q.taxonomyHead,NDA_MATHEMATICS_HEAD,q.id);
  assert.equal(q.taxonomyVersion,NDA_MATHEMATICS_TAXONOMY_VERSION,q.id);
  assert.equal(valid.has(`${q.taxonomyChapter}\0${q.taxonomySubtopic}`),true,q.id);
  assert.match(q.taxonomyId,/^subtopic:nda-mathematics:nda-mathematics:/,q.id);
 }
 assert.equal(new Set(questions.map(q=>q.id)).size,600);
});
