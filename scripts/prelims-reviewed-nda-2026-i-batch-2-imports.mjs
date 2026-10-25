import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import notes from '../content/audits/nda-2026-i-batch-2-evidence.json' with {type:'json'};
import {nda2026IBatch2} from './prelims-nda-2026-i-review-batch-2.mjs';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const notesFile='content/audits/nda-2026-i-batch-2-evidence.json';
export const nda2026IBatch2NotesHash='4f7b05bf1ab0269b3f30e0d4aa626109dbce8adbc7e3953f0a729dbaad40c312';
export const nda2026IBatch2SecondPass={
 72:'Reread p15 circuit: two separate equal X-Y branches, then one Y-Z wire. Independently computed 1/(1/R+1/R)+R=1.5R. Checked all length/area ratios; A alone. The original X/Y/Z labels and all three L,A labels are present in the crop.',
 73:'Reread p17 original reference and all four option diagrams. Reflected direction from the 60-degree incidence is normal to the horizontal base. Original diagram (c), not (d), includes the required sloping-face reflection. Checked crop letters a,b,c,d and preserved option order in a compact contact sheet.',
 74:'Reread p17: the angle is incidence from INSIDE AB and n=1.5. Critical angle arcsin(2/3)≈41.81°, less than 60°. Independent normal-reflection construction at BC makes ABC=60°, displayed B. The figure includes all A/B/C/D and theta labels.',
 76:'Reread p19 superscript 32, subscript 16, charge 2 minus. Recounted electrons 16+2=18 and nucleons 32. This is chemistry atomic symbolism, not radioactive decay. C retained.',
 77:'Reread p19: thermodynamically most stable, not hardest. Ordinary-condition graphite is the NCERT reference allotrope; diamond hardness is irrelevant. B; no assertion of stability at all pressures.',
 78:'Reread four p19 statements and four codes separately. The naked-eye claim in III applies to BOTH colloids and suspensions and is false for colloids. I,II,IV are true; the exact displayed code is D.',
 79:'Reread p19 non-volatile and MAY. Both evaporating solvent and growing crystals can recover solid. Rejected the overly strong interpretation that every nonvolatile solute must tolerate heating. C.',
 80:'Reread p19 all four examples; ordinary enzyme-mediated fruit browning is oxidation, unlike nonenzymatic browning mechanisms not named here. Rust/fuel/fat oxidation are also true. Only code D includes all four.',
 81:'Reread quoted p19 definition, including in water and OH minus. Compared the three acid-base definitions independently. Water-specific ion production is Arrhenius C, not the broader proton-donor or electron-pair model.',
 82:'Reread p21 lime/phosphate fertilizer wording. The agricultural primary bulletin equation Ca3(PO4)2+2H2SO4 yields monocalcium phosphate and gypsum. Among the four reagents only sulphuric acid B is that process.',
 83:'Reread all four p21 decimal masses and both 100-g solvent amounts. Sum before 1.700+.585=2.285; after 1.435+.850=2.285. Same 200 g water both sides. B is conservation of total mass, no elemental-ratio inference.',
 84:'Reread all four p21 Nitrolim statements. CaC2+N2→CaCN2+C verifies I; CaCN2+3H2O→CaCO3+2NH3 independently balances hydrolysis for II. ISO explicitly classifies calcium cyanamide inorganic; there is no P or K nutrient formulation. A, I and II only.',
 87:'Reread p23 formula list: AlCl3/NH3/BF3/FeCl3. Count acceptors 3, exclude ammonia lone-pair donor. Checked that C labels Three, not All four. FeCl3 metal-ion acceptor is included.',
 89:'Reread p23 physical tests, not chemical composition tests. TAPPI has actual methods for surface roughness, internal bond/bending, air resistance/permeance plus optical-test training. Permeability IV is demonstrably a physical test, so only D remains.',
 90:'Reread original p23 two-column reaction/property table. Recomputed oxidation states separately: Fe0→+2, Cu+2→0, Br0→−1, C−4→+4. III wrongly calls the oxidant reductant. Code I,II,IV is C; displayed Cu shorthand retained, not rewritten.',
 91:'Reread p25 helpful in gaseous exchange rather than only diffusion-barrier thickness. Elastic alveolar walls support inflation/recoil; thin epithelium and capillary supply support diffusion and gradients. All three D, not B which incorrectly discards ventilation support.',
 92:'Reread p25 NOT observed and the four animal groups. The textbook group comparison is non-primate oestrus versus monkeys menstrual cycles. B. Did not convert it into the false universal that all primate species menstruate.',
 93:'Reread p25 usually without protoplast. Sclerenchyma is characteristically dead at maturity; xylem PARENCHYMA is living despite other xylem elements being dead. C, not D.',
 94:'Reread p25 FIRST meiotic division. Primary spermatocyte enters meiosis I; secondary spermatocyte is the meiosis-II precursor. Distinguish spermatogonium mitosis and Sertoli support. B.',
 96:'Reread p25 false fruit LIKE APPLE, not all false fruits. Thalamus/receptacle contributes fleshy apple tissue; among petal/sepal/stamen/thalamus only D. No change of botanical term.',
 97:'Reread p25 DOES NOT and Gills of Pila. Bronchi conduct air while alveoli exchange it; moist earthworm skin and the molluscan gill are respiratory surfaces. B. Preserved Pila rather than substituting a different organism.',
 98:'Reread p27 reserve food in an OVULE. Nucellus is nutritive tissue, contrasted against integument protection, funicle attachment and chalazal position. D, no confusion with postfertilization endosperm absent from options.',
 99:'Reread p27 VOLUMES, not capacities. Compared ordinary adult representative magnitudes: tidal≈500, ERV≈1000, RV≈1100, IRV≈2500 mL. Tidal B is lowest; no subtraction of volume categories.',
 100:'Reread p27 RIGHT ventricle to PULMONARY artery. It is the pulmonary semilunar outlet valve, B. Tricuspid would be right atrium→ventricle; bicuspid and mitral are the same left AV valve.',
};
assert.equal(Object.keys(nda2026IBatch2SecondPass).length,24);
export const nda2026IBatch2Figures={
 72:{sha256:'289b45003d1684448d3d4d5e336bf5580c6061f24f1f9a76165c16c4adddfef1',alt:'Original circuit: two X–Y wires and one Y–Z wire with their printed length and area labels.'},
 73:{sha256:'156664088253a403159d20ec53517e01c0667fa080e74e245201785df5db31e2',alt:'Original prism reference diagram above the four labelled answer diagrams (a), (b), (c), (d), in reading order.'},
 74:{sha256:'163a952d27364dbd4662ef9e1b6751684a1ee4d95b25a18dea973c652984a241',alt:'Original parallelepiped ABCD with the marked angle theta and polished BC surface.'},
};
export const nda2026IBatch2Questions=nda2026IBatch2.filter(row=>Object.hasOwn(nda2026IBatch2SecondPass,row.number)).map(row=>{
 assert.equal(row.caveat,null);assert.match(row.proposedAnswer,/^[ABCD]$/);
 const [subject,head,topic,subtopic]=row.placement.split('/');
 const references=row.evidenceIds.map(id=>{
  if(id==='optics')return {title:'NCERT Ray Optics and Optical Instruments',url:'https://ncert.nic.in/textbook/pdf/leph201.pdf',localFile:'../.tmp/nda-2026-i-primary-evidence/optics.pdf',sha256:'5c9570cc9f45cbe8f8d62100ccecd3370f8d8085f57041764bd1940bf467d235',section:'Reflection, critical angle and prism rays'};
  const resource=notes.resources[id];assert.ok(resource,`Missing reference ${id}`);
  return {...resource,evidenceNotesFile:notesFile,evidenceNotesSha256:nda2026IBatch2NotesHash};
 });
 const sourceText=row.promptLines.join(' '),figure=nda2026IBatch2Figures[row.number];
 return {id:`nda-2026-i-${row.number}`,origin:'pyq',sourceTextLocked:true,sourceText,sourceTextHash:hash(sourceText),exam:'NDA',year:2026,paper:'I',questionNumber:row.number,
  subject,taxonomyHead:head,topic,subtopic,difficulty:'Moderate',promptLines:row.promptLines,options:row.options,answer:row.proposedAnswer,
  explanation:`Reasoned verification (no matching official key recovered): ${row.reasoning}`,requiresFigure:Boolean(figure),...(figure?{figureKey:`/figures/nda-2026-i/q${row.number}.png`,figureAlt:figure.alt}:{}),additionalPaths:[],classificationTags:['Static'],
  source:{dataset:'Reviewed NDA I 2026 GAT imports',exam:'NDA',year:2026,paper:'I',questionNumber:row.number,
   originalPdf:'C:/Users/iamdj/Desktop/KIS NDA/PYP/NDA PYP/GAT/2026-1.pdf',originalPdfSha256:'1cbcd118d94cf5068d8e060a49b9e17609b4c2e533eaeaa245da69b6883bc930',originalPage:row.page,bookletSeries:'A',
   answerStatus:'reasoned-verified',answerSource:references[0].url,officialAnswer:null,displayedAnswer:row.proposedAnswer,optionsReordered:false,primaryEvidence:references,
   reproductionReview:`Complete original English page ${row.page}, full stem, statements and all options visually reread in a separate pass. ${figure?'Original scan diagram crops preserved; no synthetic redraw.':'No required figure.'}`,
   ...(figure?{figureSha256:figure.sha256,figureExtractionScript:'scripts/extract-nda-2026-i-figures.py',...(row.number===73?{optionRepresentation:'Four original labelled diagram choices preserved in the source contact sheet; text buttons identify their original letters.'}:{})}:{}),
   classificationRationale:`Tests ${subtopic.toLowerCase()} within ${head} / ${topic}. Primary placement follows the complete stem and all choices; no incidental cross-subject placement. Science imports are not automatically applicable to CSE.`,
   secondPass:nda2026IBatch2SecondPass[row.number],reviewedAt:'2026-10-25'},
 };
});
export function validateNda2026IBatch2Evidence(){
 assert.equal(hash(fs.readFileSync(notesFile)),nda2026IBatch2NotesHash,'Changed recorded primary-source reading notes');
 for(const [number,figure]of Object.entries(nda2026IBatch2Figures))assert.equal(hash(fs.readFileSync(`public/figures/nda-2026-i/q${number}.png`)),figure.sha256,'Changed original figure crop');
}
