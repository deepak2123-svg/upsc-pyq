import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {nda2026IBatch1} from './prelims-nda-2026-i-review-batch-1.mjs';
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
export const nda2026IEvidence={
 exam:'NDA',year:2026,paper:'I',series:'A',questionCount:150,
 originalPdf:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf',
 originalPdfSha256:'1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930',
 officialPaperUrl:'https://www.upsc.gov.in/sites/default/files/QP-NDA-NA-I-26-GENERAL-ABILITY-TEST-130426.pdf',
 answerVerificationMethod:'primary-source-reasoning',keyStatus:'not-recovered',reviewedAt:'2026-10-24',
};
const resource=(name,title,url,sha256,section)=>({title,url,localFile:`../.tmp/nda-2026-i-primary-evidence/${name}`,sha256,section});
export const nda2026IPrimaryEvidence={
 pendulum:resource('pendulum.html','Penn State: nonlinear simple pendulum','https://www.acs.psu.edu/drussell/Demos/Pendulum/Pendulum.html','f9a7d9b5faa133956630b5ef74813c1bf72b22bba79b5ec660a4bce693a16099','The equation of motion and the real nonlinear simple pendulum; exact finite-amplitude integral derived separately.'),
 motion:resource('motion.pdf','NCERT Physics: Laws of Motion','https://ncert.nic.in/textbook/pdf/keph104.pdf','8a5df412b53d86040d73ec589ddc98ae23201c420973c7b910e1acca85d234ef','Newton’s second law, impulse and equilibrium.'),
 energy:resource('energy.pdf','NCERT Physics: Work, Energy and Power','https://ncert.nic.in/textbook/pdf/keph105.pdf','a6d4b72b0fc10230bd54393f86e58630ccd258d54269b60de226c68d0eaa937e','Sections 5.4–5.8 and 5.10: kinetic energy, net work, conservative potential and power.'),
 thermodynamics:resource('thermodynamics.pdf','NCERT Physics: Thermodynamics','https://ncert.nic.in/textbook/pdf/keph204.pdf','00462650d55bda8843f5fbf4eba1a7996faf13d04a8858fa04061b1309e090ba','Specific heat, ideal-gas equation of state and isochoric processes.'),
 'thermal-properties':resource('thermal-properties.pdf','NCERT Physics: Thermal Properties of Matter','https://ncert.nic.in/textbook/pdf/keph203.pdf','b062894aea80298f8df2f83e34dc11f5f96577bfe08d0ad35e2e647a8446854e','Calorimetry, specific heats and latent heat of fusion.'),
 waves:resource('waves.pdf','NCERT Physics: Waves','https://ncert.nic.in/textbook/pdf/keph207.pdf','9f39d09b0556c3a59b89d6b979189f960e5c663af11cdd52d6c7af0cd2e7d1c9','Speed of a travelling wave: ideal-gas sound speed and temperature dependence.'),
 optics:resource('optics.pdf','NCERT Physics: Ray Optics and Optical Instruments','https://ncert.nic.in/textbook/pdf/leph201.pdf','5c9570cc9f45cbe8f8d62100ccecd3370f8d8085f57041764bd1940bf467d235','Section 9.2: spherical mirrors, image location and mirror equation.'),
 gravitation:resource('gravitation.html','NASA: Orbits and Kepler’s Laws','https://science.nasa.gov/solar-system/orbits-and-keplers-laws/','6285cc8f7bdb0f0bdbde89fa1de53a51142f04c569100082660c06e78438471d','Kepler’s third law: period squared and semimajor axis cubed.'),
};
// Explicit second pass: not inferred from first-pass acceptance or a secondary key.
export const nda2026ISecondPass={
 51:'Reread original p9 including 60°, all four comparisons and the small-angle definition. Independent quadrature of the nonlinear equation gives T/T₀≈1.073182; mass cancels. Retain A, not the cached secondary C.',
 52:'Reread p9: the resultant is equal to each force, not their sum. Constructing the force triangle makes it equilateral; the tail-to-tail angle is 120° and the force-to-resultant angle is 60°. Both I and II, displayed C.',
 53:'Reread p9; options B and D differ by the factor 1/2 on α. Reintegrated the temperature-dependent heat capacity and differentiated D to recover m(C₀+αT). Retain D; no option reorder.',
 54:'Reread p9: PV², not P²V. From PV=nRT and PV²=k obtain T∝1/V, hence T₁/T₂=V₂/V₁, C. Checked a doubled-volume counterexample against all four ratios.',
 55:'Reread p11: P=kT with molar heat capacity, not constant P. Fixed gas amount implies V is fixed; boundary work vanishes. Heat capacity is Cᵥ, B.',
 56:'Reread p11: potentials equal but field values unequal. Work is minus potential-energy change and is zero. A radial equal-radius pair supplies a conservative-field counterexample to C. D alone remains valid.',
 57:'Magnified p11 expression: square roots cover coefficients 3, 2 and 5; t² and t are outside the radicals. Differentiated twice independently. Force has only x component, velocity has nonzero y component. Nonparallel D; perpendicular B fails except at one instant.',
 58:'Reread p11 and retained printed initial-speed symbol v. The moving frame travels upward; final downward speed is w+u and initial downward speed u. Subtracting squared speeds gives extra positive muw, so C. Reversing frame direction would be a different question.',
 61:'Reread p13: 5 g, −20 °C, 30 °C and final all-liquid 0 °C. Converted ice to 0.005 kg; heat balance with NCERT constants gives approximately 0.01501 kg. Of the four printed masses only C rounds correctly.',
 62:'Reread p13: both measurements are in the same ideal gas at constant temperature. Sound formula gives no pressure change when density changes consistently. Ratio 1, A; did not hold density fixed.',
 63:'Reread p13: soft sand and less likely injury, not a different impact momentum. Impulse magnitude is approximately fixed while stopping time grows; mean force decreases. C alone supplies the mechanism.',
 65:'Reread p13: endpoints specify speeds, not a position-only potential. Work–energy theorem guarantees B, whereas variable/nonconservative forces can also satisfy the theorem. No claim of conservative or constant force follows.',
 66:'Reread p13: orbital period is eight Earth years; semimajor-axis comparison is asked. Cubing 4 and squaring 8 both give 64, independently confirming D for a planet of the Solar System.',
 69:'Reread p15: any real-object position and an image between pole and focus. The convex-mirror construction has that property. Concave-mirror counterexamples disqualify both focal-length alternatives; B retained.',
 70:'Reread p15: uniform speed, mass 60 kg, upward force not net force. a=0 and upward drag equals weight. 60×9.8=588 N, C; the stated 2 m/s is not an acceleration.',
};
assert.equal(Object.keys(nda2026ISecondPass).length,15);
export const nda2026IQuestions=nda2026IBatch1.filter(row=>Object.hasOwn(nda2026ISecondPass,row.number)).map(row=>{
 assert.equal(row.caveat,null);assert.ok(row.evidenceIds.length);
 const [subject,head,chapter,subtopic]=row.placement.split('/');
 const references=row.evidenceIds.map(id=>{assert.ok(nda2026IPrimaryEvidence[id]);return nda2026IPrimaryEvidence[id];});
 const sourceText=row.promptLines.join(' '),answer=row.proposedAnswer;
 return {id:`nda-2026-i-${row.number}`,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2026,paper:'I',questionNumber:row.number,
  subject,taxonomyHead:head,topic:chapter,subtopic,difficulty:'Moderate',promptLines:row.promptLines,options:row.options,answer,
  explanation:`Reasoned verification (no matching official key recovered): ${row.reasoning}`,requiresFigure:false,additionalPaths:[],classificationTags:['Static'],
  source:{dataset:'Reviewed NDA I 2026 GAT imports',exam:'NDA',year:2026,paper:'I',questionNumber:row.number,
   originalPdf:nda2026IEvidence.originalPdf,originalPdfSha256:nda2026IEvidence.originalPdfSha256,originalPage:row.page,bookletSeries:'A',
   answerStatus:'reasoned-verified',answerSource:references[0].url,officialAnswer:null,displayedAnswer:answer,optionsReordered:false,primaryEvidence:references,
   reproductionReview:`Complete original English page ${row.page}, stem, notation and all four options visually reread in a separate pass. No diagram required for this item.`,
   classificationRationale:`The complete question tests ${subtopic.toLowerCase()} within ${chapter}; it is GS physics, not standalone mathematics. No incidental geography/personality placement is added.`,
   secondPass:nda2026ISecondPass[row.number],reviewedAt:'2026-10-24'},
 };
});
export function validateNda2026IEvidence(){
 assert.equal(hash(fs.readFileSync(nda2026IEvidence.originalPdf)),nda2026IEvidence.originalPdfSha256);
 for(const resource of Object.values(nda2026IPrimaryEvidence))assert.equal(hash(fs.readFileSync(resource.localFile)),resource.sha256,`Changed primary evidence: ${resource.localFile}`);
}
