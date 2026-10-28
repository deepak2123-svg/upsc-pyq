import type {PracticeInventoryNode} from './pyq-catalog';

/** NDA-only chapter projection. Existing concept IDs/memberships stay intact.
 * Each chapter lists its established concepts, followed by bounded empty topics.
 * No keyword classifier or answer/content change is performed here.
 */
type Chapter=readonly [string,readonly string[],readonly string[]];
export const ndaScienceChapters:Record<string,readonly Chapter[]>={
 Physics:[
  ['Units and Measurement',['Measurement and units'],['Dimensions and errors','Measuring instruments']],
  ['Kinematics',['Motion'],['Vectors','Relative and projectile motion','Graphs of motion']],
  ['Laws of Motion',['Force and momentum'],['Newton’s laws','Friction','Impulse and collisions']],
  ['Work, Energy and Power',['Work energy and power'],['Conservation of energy','Variable forces and power']],
  ['Circular and Rotational Motion',[],['Centripetal force','Vertical circular motion','Torque and angular momentum']],
  ['Gravitation',['Gravitation'],['Gravitational field and potential','Mass and weight','Orbits and escape speed']],
  ['Solids and Fluids',['Fluids'],['Elasticity','Pressure and buoyancy','Surface tension and viscosity']],
  ['Heat and Temperature',['Temperature and heat'],['Thermal expansion','Calorimetry and latent heat','Heat transfer']],
  ['Thermodynamics',['Thermodynamics'],['Gas laws','Thermodynamic processes','Heat engines']],
  ['Oscillations and Waves',['Wave properties'],['Simple harmonic motion','Pendulums','Superposition and resonance']],
  ['Sound',['Sound'],['Speed and propagation','Doppler effect','Musical instruments']],
  ['Light and Optics',['Optics'],['Reflection and mirrors','Refraction and lenses','Prisms and dispersion','Total internal reflection','Optical instruments']],
  ['Electrostatics',['Electrostatics'],['Charge and electric field','Potential and capacitance']],
  ['Current Electricity',['Current electricity'],['Ohm’s law and resistivity','Circuits','Electrical power']],
  ['Magnetism and Induction',['Magnetism'],['Magnetic forces','Electromagnetic induction','Motors and transformers']],
  ['Electromagnetic Waves',['Electromagnetic spectrum'],['Spectrum and applications']],
  ['Atomic and Nuclear Physics',['Atomic structure','Nuclear physics','Radiation','Fundamental interactions','Particle physics','Relativity and gravitational waves'],['Radioactivity','Fission and fusion']],
  ['Electronics',['Semiconductors'],['Diodes and transistors','Logic gates']],
 ],
 Chemistry:[
  ['Matter, Atoms and Molecules',['Atomic and molecular structure'],['States of matter','Chemical combination and mole concept','Isotopes']],
  ['Periodic Classification',['Periodic properties'],['Periodic table and trends']],
  ['Chemical Bonding',['Chemical bonding'],['Ionic and covalent bonds','Molecular structure','Hydrogen bonds']],
  ['Mixtures, Solutions and Colloids',['Surface chemistry and adsorption','Mixtures and separation'],['Solutions and suspensions','Separation methods','Types of colloids']],
  ['Chemical Reactions',['Reaction types'],['Balancing equations','Oxidation and reduction','Rates and equilibrium']],
  ['Acids, Bases and Salts',['Acids bases and salts'],['Indicators and pH','Neutralisation','Common salts and hydrates']],
  ['Electrochemistry',['Electrochemistry'],['Electrolysis','Cells and corrosion']],
  ['Metals and Metallurgy',['Metals and alloys','Metallurgy and ores'],['Reactivity series','Extraction and refining']],
  ['Carbon and Organic Compounds',['Carbon compounds'],['Allotropes','Hydrocarbons and functional groups','Soaps and detergents']],
  ['Fuels and Energy',['Fuels'],['Coal and petroleum','Combustion','Hydrogen fuels']],
  ['Polymers and Materials',['Polymers','Construction materials'],['Plastics and fibres','Rubber','Cement and glass']],
  ['Everyday and Industrial Chemistry',['Everyday chemicals','Industrial chemistry'],['Fertilisers','Paints and pigments','Household chemicals']],
 ],
 Biology:[
  ['Cell Biology',['Cell structure','Cell division'],['Cell organelles','Mitosis and meiosis']],
  ['Biomolecules',['Biomolecules'],['Nutrients and enzymes','Nucleic acids']],
  ['Genetics',['Heredity'],['Mendelian inheritance','Genes and chromosomes']],
  ['Evolution',['Evolution'],['Natural selection','Evidence and speciation']],
  ['Biological Classification',['Biological classification','Animal diversity'],['Plant groups','Animal groups']],
  ['Plant Structure and Tissues',['Plant tissues','Plant morphology'],['Roots, stems and leaves','Flower, fruit and seed structure']],
  ['Plant Nutrition and Photosynthesis',['Photosynthesis','Plant nutrition'],['Mineral nutrition','Photosynthetic processes']],
  ['Transport and Respiration in Plants',['Transport in plants','Plant respiration'],['Xylem and phloem','Transpiration']],
  ['Plant Reproduction',['Plant propagation'],['Pollination and fertilisation','Vegetative propagation']],
  ['Microorganisms and Plant Health',['Microorganisms','Plant diseases','Economic uses of plants'],['Useful microorganisms','Crop protection']],
  ['Animal Nutrition and Adaptations',['Feeding and digestion','Adaptations and behaviour'],['Feeding mechanisms','Animal adaptations']],
  ['Human Nutrition and Digestion',['Nutrition and digestion'],['Deficiency diseases','Digestive organs and enzymes']],
  ['Respiration',['Respiration'],['Respiratory organs','Gas exchange and lung volumes','Aerobic and anaerobic respiration']],
  ['Circulation and Excretion',['Circulation','Excretion'],['Blood, heart and vessels','Kidney and urine formation']],
  ['Tissues, Support and Movement',['Muscles and movement'],['Animal tissues','Skeleton and joints']],
  ['Nervous and Endocrine Systems',['Nervous and endocrine systems'],['Brain and sense organs','Hormones and glands']],
  ['Reproduction',['Reproduction','Reproductive strategies'],['Human reproductive systems','Gametogenesis','Animal reproductive strategies']],
  ['Plant Growth and Responses',['Plant responses and tropisms'],['Growth regulators','Nastic movements']],
 ],
};
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export function organiseNdaScience(nodes:PracticeInventoryNode[]):PracticeInventoryNode[]{
 const heads=nodes.filter(n=>n.kind==='head'&&n.subjectId==='subject:science'&&ndaScienceChapters[n.label]);
 const headIds=new Set(heads.map(n=>n.id));
 const topics=new Set(nodes.filter(n=>n.kind==='topic'&&headIds.has(n.parentId)).map(n=>n.id));
 const leaves=nodes.filter(n=>n.kind==='subtopic'&&topics.has(n.parentId));
 const leafIds=new Set(leaves.map(n=>n.id));
 const result=nodes.filter(n=>!topics.has(n.id)&&!leafIds.has(n.id));
 for(const head of heads){
  const old=leaves.filter(n=>nodes.find(p=>p.id===n.parentId)?.parentId===head.id),used=new Set<string>();
  ndaScienceChapters[head.label].forEach(([label,existing,empty],i)=>{
   const id=`topic:science:${slug(head.label)}:${slug(label)}`;
   const base={subjectId:head.subjectId,examCounts:{CSE:0,CAPF:0,CDS:0,NDA:0},questionCount:0};
   result.push({...base,id,parentId:head.id,label,kind:'topic',order:i+1});
   existing.forEach((name,j)=>{
    const leaf=old.find(n=>n.label===name);
    if(!leaf||used.has(leaf.id))throw new Error(`Unresolved NDA Science concept: ${head.label}/${name}`);
    used.add(leaf.id);result.push({...leaf,parentId:id,order:j+1});
   });
   empty.forEach((name,j)=>result.push({...base,id:`${id.replace(/^topic:/,'subtopic:')}:${slug(name)}`,parentId:id,label:name,kind:'subtopic',order:existing.length+j+1,questionIdsByExam:{CSE:[],CAPF:[],CDS:[],NDA:[]}}));
  });
  if(used.size!==old.length)throw new Error(`Unplaced NDA Science concept under ${head.label}`);
 }
 if(new Set(result.map(n=>n.id)).size!==result.length)throw new Error('Duplicate NDA science node');
 return result;
}
