import fs from 'node:fs';

const source=JSON.parse(fs.readFileSync('C:/Users/iamdj/Documents/Book PYP/output/nda_gat_high_fidelity_phase1/NDA_GAT_Phase1_Source_Question_Taxonomy.json','utf8'));
const records=source.records.filter(row=>row.paper_id==='2018-2');
const english={
  'Spotting Errors':'English/Usage and Sentence Skills/Error correction/Spotting errors',
  Synonyms:'English/Vocabulary/Word meanings/Synonyms',
  Antonyms:'English/Vocabulary/Word meanings/Antonyms',
  'Reading Comprehension':'English/Comprehension/Reading passages/Inference and tone',
  'Fill in the Blanks':'English/Usage and Sentence Skills/Error correction/Fill in the blanks',
  'Idioms and Phrases':'English/Vocabulary/Expressions/Idioms and phrases',
  'Ordering of Words':'English/Usage and Sentence Skills/Sentence organisation/Ordering words',
  'Cloze / Selecting Words':'English/Usage and Sentence Skills/Error correction/Fill in the blanks',
};
const paths={
  Physics:'Science & Technology/Physics/Mechanics/Motion',
  Chemistry:'Science & Technology/Chemistry/Matter and Reactions/Reaction types',
  'General Science':'Science & Technology/Biology/Cell and Genetics/Cell structure',
  'Geography & Environment':'Geography/Physical Geography/Geomorphic Processes and Landforms/Major Landform Types',
  'History, Freedom Movement & Culture':'History/Modern India & National Movement/Early Nationalism/Congress foundation',
  'Polity & Governance':'Polity & Governance/Constitutional Foundations/Constitutional Structure/Salient features',
  'Current Events':'Current Affairs/National Affairs/National and State Developments/National milestones',
};
const refinements={
  'Electricity and magnetism':'Science & Technology/Physics/Light and Electricity/Current electricity',
  'Heat and thermodynamics':'Science & Technology/Physics/Heat and Waves/Thermodynamics',
  Optics:'Science & Technology/Physics/Light and Electricity/Optics',
  'Waves and sound':'Science & Technology/Physics/Heat and Waves/Sound',
  'Mechanics and properties of matter':'Science & Technology/Physics/Mechanics/Force and momentum',
  'Acids, bases and salts':'Science & Technology/Chemistry/Matter and Reactions/Acids bases and salts',
  'Chemical reactions and electrochemistry':'Science & Technology/Chemistry/Matter and Reactions/Electrochemistry',
  'Human physiology':'Science & Technology/Biology/Human Physiology/Nutrition and digestion',
  'Disease and immunity':'Science & Technology/Health & Biotechnology/Disease and Immunity/Pathogens',
  'Cell biology and genetics':'Science & Technology/Biology/Cell and Genetics/Cell structure',
  'Agriculture, Crops & Land Use':'Geography/Indian Geography/Agriculture and Irrigation/Crop seasons',
  'Atmosphere, Insolation & Temperature':'Geography/Physical Geography/The Atmosphere, Insolation, Heat Budget and Temperature/Temperature Distribution',
  'Humidity, Precipitation & Climate Types':'Geography/Physical Geography/Condensation, Clouds, Precipitation, Air Masses, Fronts and Cyclones/Precipitation',
  'Latitude, Longitude, Maps & Geospatial Tools':'Geography/Physical Geography/Latitudes, Longitudes, Time and Motions of the Earth/The Grid: Latitudes and Longitudes',
  'Ocean Relief, Properties & Marine Resources':'Geography/Physical Geography/Oceanography/Ocean Currents',
  'Pollution, Climate Change & Sustainability':'Environment & Ecology/Pollution/Pollutants and Impacts/Air pollution',
  'River Systems, Lakes, Dams & River-Valley Projects':'Geography/Indian Geography/Drainage/Peninsular rivers',
  'Weathering, Erosion & Landforms':'Geography/Physical Geography/Geomorphic Processes and Landforms/Weathering',
  'World Climates & Local Winds':"Geography/Physical Geography/World Climate Regions and the Köppen Classification/Köppen's Scheme: Letters and Codes",
  'European Trading Companies':'History/Modern India & National Movement/European Companies/English and French',
  'Gandhi’s Early Movements':'History/Modern India & National Movement/Gandhian Movements/Early satyagrahas',
  'Bhakti Traditions':'History/Medieval India/Bhakti and Sufi Traditions/Saints and compositions',
  'Reform Movements and Organisations':'History/Modern India & National Movement/Social and Religious Reform/Theosophical movement',
  'Directive Principles of State Policy':'Polity & Governance/Rights & Principles/Directive Principles and Duties/Nature and enforceability',
  'Equality, Freedom, Life, Religion & Cultural Rights':'Polity & Governance/Rights & Principles/Fundamental Rights/Equality',
  'Preamble, Union and its Territory & Citizenship':'Polity & Governance/Constitutional Foundations/Constitutional Structure/Preamble',
  'Supreme Court, Jurisdiction & Judicial Review':'Polity & Governance/Institutions/Judiciary/Supreme Court',
  'Special Provisions for States and Constitutional Regions':'Polity & Governance/Federalism & Local Government/Union-State Relations/Special state provisions',
  'Commissions, Authorities & Regulatory Institutions':'Polity & Governance/Institutions/Constitutional and Statutory Bodies/Regulators',
  'Appointments and government initiatives':'Current Affairs/National Affairs/Public Institutions and Appointments/Administrative appointments',
  'Awards and sports':'Current Affairs/Sports, Culture & Recognition/Awards and Honours/Recipients and institutions',
  'Major national and international developments':'Current Affairs/International Affairs/Events and Diplomacy/Political developments',
};

export const classifications=Object.fromEntries(records.map(row=>{
  const path=english[row.subtopic]??refinements[row.subtopic]??paths[row.subject];
  if(!path)throw new Error(`No classification for ${row.source_identity}: ${row.subject}/${row.subtopic}`);
  const scope=row.subject==='English'?'english':['Physics','Chemistry','General Science'].includes(row.subject)?'science':'gs';
  return [row.question_number,{path,scope,additional:[],rationale:`Source-taxonomy second pass: ${row.subject} — ${row.subtopic}.`}];
}));
