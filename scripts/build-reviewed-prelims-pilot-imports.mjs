import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {cse2013FinalImports} from './prelims-reviewed-cse-2013-final-imports.mjs';
import {cse2014Evidence,cse2014Imports} from './prelims-reviewed-cse-2014-imports.mjs';
import {cse2015Evidence,cse2015Imports} from './prelims-reviewed-cse-2015-imports.mjs';
import {cse2016Evidence,cse2016Imports} from './prelims-reviewed-cse-2016-imports.mjs';

const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const pdf = 'C:/Users/iamdj/Desktop/KIS NDA/PYP/CSE PYP/2013.pdf';
const keyPdf = '../.tmp/full_reaudit_answer_keys/CSE/2013_GS1_answer_key.pdf';
assert.equal(hash(fs.readFileSync(pdf)), 'cd9f0fcc9d911af504953efa996cdbd75264579e66f9dbf7da87e6cbb6997330');
assert.equal(hash(fs.readFileSync(keyPdf)), '8cb17c812afb63e5a1c7445cb45f45353ea1f3a817e7e9dbd65e459315298054');
assert.equal(hash(fs.readFileSync(cse2014Evidence.originalPdf)),cse2014Evidence.originalPdfSha256);
assert.equal(hash(fs.readFileSync(cse2014Evidence.keyPdf)),cse2014Evidence.keySha256);
assert.equal(hash(fs.readFileSync(cse2015Evidence.originalPdf)),cse2015Evidence.originalPdfSha256);
assert.equal(hash(fs.readFileSync(cse2015Evidence.keyPdf)),cse2015Evidence.keySha256);
assert.equal(hash(fs.readFileSync(cse2016Evidence.originalPdf)),cse2016Evidence.originalPdfSha256);
assert.equal(hash(fs.readFileSync(cse2016Evidence.keyPdf)),cse2016Evidence.keySha256);
const reviewedPaperContexts=new Map([
  [2013,{originalPdf:pdf,keyPdf,keyUrl:'https://drive.usercontent.google.com/download?id=1GEzVf-hpZP0iidf1A28TPF6p8agnfJ3l&export=download&confirm=t'}],
  [2014,cse2014Evidence],[2015,cse2015Evidence],[2016,cse2016Evidence],
]);
const originals = JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const placements = [];
// Complete recorded original pages and Series A key page 1 visually reviewed.
// A second pass compares the verbatim options and key cells, not secondary labels.
const raw = [
  { number: 1, subject: 'Polity', head: 'Institutions', chapter: 'Parliament', leaf: 'Financial control',
    stem: ['What will follow if a Money Bill is substantially amended by the Rajya Sabha?'],
    options: { A: 'The Lok Sabha may still proceed with the Bill, accepting or not accepting the recommendations of the Rajya Sabha', B: 'The Lok Sabha cannot consider the Bill further', C: 'The Lok Sabha may send the Bill to the Rajya Sabha for reconsideration', D: 'The President may call a joint sitting for passing the Bill' },
    answer: 'A', explanation: 'The official Series A key accepts A. The Rajya Sabha makes recommendations on a Money Bill; the Lok Sabha may accept or reject them.',
    rationale: 'The stem and every alternative concern parliamentary handling of a Money Bill. The primary concept is financial legislative control, not a current event.',
    additionalPaths: [],
  },
  { number: 2, subject: 'Polity', head: 'Federalism & Local Government', chapter: 'State Government', leaf: 'Governor',
    stem: ['Which one of the following statements is correct?'],
    options: { A: 'In India, the same person cannot be appointed as Governor for two or more States at the same time', B: 'The Judges of the High Court of the States in India are appointed by the Governor of the State just as the Judges of the Supreme Court are appointed by the President', C: 'No procedure has been laid down in the Constitution of India for the removal of a Governor from his/her post', D: 'In the case of a Union Territory having a legislative setup, the Chief Minister is appointed by the Lt. Governor on the basis of majority support' },
    answer: 'C', explanation: 'The official Series A key accepts C. This is the examination answer to the printed constitutional-governance question, not a question about a named governor or a recent appointment.',
    rationale: 'All options must be read: the generic stem conceals a static constitutional question. Governor removal is the accepted proposition; incidental mentions do not justify duplicating it across every institution.',
    additionalPaths: [],
  },
  { number: 4, subject: 'History', head: 'Art & Culture', chapter: 'Architecture', leaf: 'Rock-cut architecture',
    stem: ['With reference to the history of Indian rock-cut architecture, consider the following statements:', '1. The caves at Badami are the oldest surviving rock-cut caves in India.', '2. The Barabar rock-cut caves were originally made for Ajivikas by Emperor Chandragupta Maurya.', '3. At Ellora, caves were made for different faiths.', 'Which of the statements given above is/are correct?'],
    options: { A: '1 only', B: '2 and 3 only', C: '3 only', D: '1, 2 and 3' },
    answer: 'C', explanation: 'The official Series A key accepts C: only statement 3. Keep Chandragupta Maurya in the printed statement; silently replacing it with Ashoka would change what the student is being asked.',
    rationale: 'The question tests cave architecture and chronology, and explicitly tests Mauryan patronage of the Barabar caves. Both Art & Culture and Ancient India are material homes, not a duplicated question.',
    additionalPaths: [{ subject: 'History', head: 'Ancient India', chapter: 'Mauryan Empire', subtopic: 'Art and patronage' }],
  },
  { number:5, page:4, subject:'Science & Technology',head:'Health & Biotechnology',chapter:'Biotechnology',leaf:'Genetic engineering',
    stem:['Recombinant DNA technology (Genetic Engineering) allows genes to be transferred','1. across different species of plants','2. from animals to plants','3. from microorganisms to higher organisms','Select the correct answer using the codes given below.'],
    options:{A:'1 only',B:'2 and 3 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'D',
    explanation:'The matching official Series A key accepts D: all three transfer categories in the printed recombinant-DNA question.',
    rationale:'The complete stem tests cross-organism transfer using recombinant DNA. Genetic engineering is the precise home; the organism examples do not independently test agriculture or species conservation.',additionalPaths:[]},
  { number:6,page:4,subject:'History',head:'Ancient India',chapter:'Sources and Chronology',leaf:'Foreign accounts',
    stem:['The Chinese traveller Yuan Chwang (Hiuen Tsang) who visited India recorded the general conditions and culture of India at that time. In this context, which of the following statements is/are correct?',
      '1. The roads and river-routes were completely immune from robbery.',
      '2. As regards punishment for offences, ordeals by fire, water and poison were the instruments for determining the innocence or guilt of a person.',
      '3. The tradesmen had to pay duties at ferries and barrier stations.',
      'Select the correct answer using the codes given below.'],
    options:{A:'1 only',B:'2 and 3 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'B',
    explanation:'The matching official Series A key accepts B: statements 2 and 3. Preserve the printed claim of complete immunity from robbery as a statement to assess.',
    rationale:'The question evaluates a named foreign travel account and its evidence on society, legal practice and trade. The account is primary; its Harsha-period context supports an additional period home.',
    additionalPaths:[{subject:'History',head:'Ancient India',chapter:'Gupta and Post-Gupta India',subtopic:'Harsha'}]},
  { number:9,page:4,subject:'Polity',head:'Constitutional Foundations',chapter:'Making of the Constitution',leaf:'Constituent Assembly',
    stem:['With reference to Indian History, the Members of the Constituent Assembly from the Provinces were'],
    options:{A:'directly elected by the people of those Provinces',B:'nominated by the Indian National Congress and the Muslim League',C:'elected by the Provincial Legislative Assemblies',D:'selected by the Government for their expertise in constitutional matters'},answer:'C',
    explanation:'The matching official Series A key accepts C: elected by the Provincial Legislative Assemblies.',
    rationale:'The precise task is the provincial membership-selection method of the Constituent Assembly. This also directly tests the independence-era constitutional transition.',
    additionalPaths:[{subject:'History',head:'Modern India & National Movement',chapter:'Independence and Integration',subtopic:'Constituent Assembly context'}]},
  {number:10,page:6,subject:'Science & Technology',head:'Biology',chapter:'Animal Biology',leaf:'Animal diversity',
    stem:['Consider the following animals:','1. Sea cow','2. Sea horse','3. Sea lion','Which of the above is/are mammal/mammals?'],
    options:{A:'1 only',B:'1 and 3 only',C:'2 and 3 only',D:'1, 2 and 3'},answer:'B',
    explanation:'The official Series A Q10 cell accepts B: 1 and 3 only.',
    rationale:'The complete question tests mammalian classification, not habitat distribution or conservation status. Animal diversity is the precise primary home.',additionalPaths:[]},
  {number:11,page:6,subject:'Polity',head:'Constitutional Foundations',chapter:'Constitutional Structure',leaf:'Amendment and basic structure',
    stem:['Consider the following statements:',
      '1. An amendment to the Constitution of India can be initiated by an introduction of a bill in the Lok Sabha only.',
      '2. If such an amendment seeks to make changes in the federal character of the Constitution, the amendment also requires to be ratified by the legislature of all the States of India.',
      'Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 only',C:'Both 1 and 2',D:'Neither 1 nor 2'},answer:'D',
    explanation:'The official Series A Q11 cell accepts D: neither printed statement. Preserve Lok Sabha only and all the States as propositions to assess.',
    rationale:'Both statements test constitutional amendment procedure, including federal ratification. Do not silently correct either proposed requirement.',additionalPaths:[]},
  {number:12,page:6,subject:'Polity',head:'Institutions',chapter:'Union Executive',leaf:'Attorney General',
    stem:['Consider the following statements:','Attorney General of India can',
      '1. take part in the proceedings of the Lok Sabha','2. be a member of a committee of the Lok Sabha','3. speak in the Lok Sabha','4. vote in the Lok Sabha',
      'Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 and 4',C:'1, 2 and 3',D:'1 and 3 only'},answer:'C',
    explanation:'The official Series A Q12 cell accepts C: 1, 2 and 3. The question continues at the top of the right-hand column; all four alternatives are retained.',
    rationale:'The Attorney General office and parliamentary participation rights are directly tested; retain the complete four-item list and continuation across columns.',
    additionalPaths:[{subject:'Polity & Governance',head:'Institutions',chapter:'Parliament',subtopic:'Sessions and procedures'}]},
  {number:19,page:8,subject:'Economy',head:'Development',chapter:'Development Policy',leaf:'Planning institutions',
    stem:['Which of the following bodies does not/do not find mention in the Constitution?',
      '1. National Development Council','2. Planning Commission','3. Zonal Councils',
      'Select the correct answer using the codes given below.'],
    options:{A:'1 and 2 only',B:'2 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'D',
    explanation:'The official Series A Q19 cell accepts D: all three named bodies. Preserve the historical Planning Commission reference.',
    rationale:'The constitutional status of planning bodies and Zonal Councils requires both planning-institution and interstate-coordination knowledge. No current institution is substituted.',
    additionalPaths:[{subject:'Polity & Governance',head:'Federalism & Local Government',chapter:'Union-State Relations',subtopic:'Interstate coordination'}]},
  {number:20,page:8,subject:'History',head:'Modern India & National Movement',chapter:'Popular Resistance',leaf:'Peasant movements',
    stem:['The demand for the Tebhaga Peasant Movement in Bengal was for'],
    options:{A:'the reduction of the share of the landlords from one-half of the crop to one-third',B:'the grant of ownership of land to peasants as they were the actual cultivators of the land',C:'the uprooting of Zamindari system and the end of serfdom',D:'writing off all peasant debts'},answer:'A',
    explanation:'The official Series A Q20 cell accepts A: the stated reduction in the landlord share.',
    rationale:'The exact demand of a named historical peasant movement belongs to Popular Resistance, not present-day land reform or agricultural subsidy policy.',additionalPaths:[]},
  {number:25,page:10,subject:'Polity',head:'Federalism & Local Government',chapter:'Local Government',leaf:'Scheduled areas',
    stem:['The Government enacted the Panchayat Extension to Scheduled Areas (PESA) Act in 1996. Which one of the following is not identified as its objective?'],
    options:{A:'To provide self-governance',B:'To recognize traditional rights',C:'To create autonomous regions in tribal areas',D:'To free tribal people from exploitation'},answer:'C',
    explanation:'The official Series A Q25 cell accepts C. Preserve the negative instruction and the four printed objectives.',
    rationale:'The question tests scheduled-area self-government and the scope of PESA. Panchayat governance is a material additional home; it is not a generic tribal-personality question.',
    additionalPaths:[{subject:'Polity & Governance',head:'Federalism & Local Government',chapter:'Local Government',subtopic:'Panchayats'}]},
  {number:27,page:12,subject:'Science & Technology',head:'Biology',chapter:'Plants and Microorganisms',leaf:'Microorganisms',
    stem:['Improper handling and storage of cereal grains and oilseeds result in the production of toxins known as aflatoxins which are not generally destroyed by normal cooking process. Aflatoxins are produced by'],
    options:{A:'bacteria',B:'protozoa',C:'moulds',D:'viruses'},answer:'C',
    explanation:'The official Series A Q27 cell accepts C: moulds.',
    rationale:'The task identifies the organism group producing aflatoxins. Food storage is context; no separate food-safety regulation, welfare scheme or crop-production region is tested.',additionalPaths:[]},
  {number:36,page:16,subject:'History',head:'Art & Culture',chapter:'Architecture',leaf:'Rock-cut architecture',
    stem:['Some Buddhist rock-cut caves are called Chaityas, while the others are called Viharas. What is the difference between the two?'],
    options:{A:'Vihara is a place of worship, while Chaitya is the dwelling place of the monks',B:'Chaitya is a place of worship, while Vihara is the dwelling place of the monks',C:'Chaitya is the stupa at the far end of the cave, while Vihara is the hall axial to it',D:'There is no material difference between the two'},answer:'B',
    explanation:'The official Series A Q36 cell accepts B, retaining the printed functional distinction.',
    rationale:'The question explicitly tests Buddhist rock-cut architectural function and monastic institutions. Both Art & Culture and Ancient India are material homes, not duplicate records.',
    additionalPaths:[{subject:'History',head:'Ancient India',chapter:'Buddhism',subtopic:'Monastic institutions'}]},
  {number:37,page:16,subject:'History',head:'Ancient India',chapter:'Buddhism',leaf:'Life and teachings',
    stem:['Which one of the following describes best the concept of Nirvana in Buddhism?'],
    options:{A:'The extinction of the flame of desire',B:'The complete annihilation of self',C:'A state of bliss and rest',D:'A mental stage beyond all comprehension'},answer:'A',
    explanation:'The official Series A Q37 cell accepts A: the extinction of the flame of desire.',
    rationale:'The exact task is a Buddhist doctrinal concept, not a contemporary religious event or architectural question.',additionalPaths:[]},
  {number:39,page:16,subject:'History',head:'Modern India & National Movement',chapter:'Constitutional Developments',leaf:'Simon Commission and Nehru Report',
    stem:['The people of India agitated against the arrival of Simon Commission because'],
    options:{A:'Indians never wanted the review of the working of the Act of 1919',B:'Simon Commission recommended the abolition of Dyarchy (Diarchy) in the Provinces',C:'there was no Indian member in the Simon Commission',D:'the Simon Commission suggested the partition of the country'},answer:'C',
    explanation:'The official Series A Q39 cell accepts C: there was no Indian member in the Simon Commission.',
    rationale:'The question tests the cause of opposition to a specific constitutional-review commission. It should not be forced into a generic Act of 1919 or later Civil Disobedience chapter.',additionalPaths:[]},
  {number:40,page:16,subject:'History',head:'Modern India & National Movement',chapter:'Gandhian Movements',leaf:'Quit India',
    stem:['Quit India Movement was launched in response to'],
    options:{A:'Cabinet Mission Plan',B:'Cripps Proposals',C:'Simon Commission Report',D:'Wavell Plan'},answer:'B',
    explanation:'The official Series A Q40 cell accepts B: Cripps Proposals.',
    rationale:'The movement trigger and constitutional negotiation context are materially linked; preserve all original mission and plan alternatives.',
    additionalPaths:[{subject:'History',head:'Modern India & National Movement',chapter:'Constitutional Developments',subtopic:'Cripps and Cabinet Mission'}]},
  {number:41,page:16,subject:'Economy',head:'External Sector',chapter:'Balance of Payments',leaf:'Accounting framework',
    stem:['The balance of payments of a country is a systematic record of'],
    options:{A:'all import and export transactions of a country during a given period of time, normally a year',B:'goods exported from a country during a year',C:'economic transaction between the government of one country to another',D:'capital movements from one country to another'},answer:'A',
    explanation:'The official Series A Q41 cell accepts A. Preserve the printed definition and its alternatives; this records the examination answer rather than rewriting the source into a textbook definition.',
    rationale:'The whole task asks the scope of a balance-of-payments record. Accounting framework is the precise primary home; selecting a single component leaf would misrepresent the question.',additionalPaths:[]},
  {number:42,page:18,subject:'Economy',head:'Money & Banking',chapter:'Money and Central Banking',leaf:'RBI functions',
    stem:['The Reserve Bank of India regulates the commercial banks in matters of','1. liquidity of assets','2. branch expansion','3. merger of banks','4. winding-up of banks','Select the correct answer using the codes given below.'],
    options:{A:'1 and 4 only',B:'2, 3 and 4 only',C:'1, 2 and 3 only',D:'1, 2, 3 and 4'},answer:'D',
    explanation:'The official Series A Q42 cell accepts D: all four printed matters. Retain the examination-period wording.',
    rationale:'The task identifies the scope of central-bank regulation of commercial banks. RBI functions is primary; no present regulatory update is substituted.',additionalPaths:[]},
  {number:43,page:18,subject:'Economy',head:'Money & Banking',chapter:'Money and Central Banking',leaf:'Monetary policy',
    stem:['An increase in the Bank Rate generally indicates that the'],
    options:{A:'market rate of interest is likely to fall',B:'Central Bank is no longer making loans to commercial banks',C:'Central Bank is following an easy money policy',D:'Central Bank is following a tight money policy'},answer:'D',
    explanation:'The official Series A Q43 cell accepts D: the printed tight-money-policy alternative.',
    rationale:'The question tests a monetary-policy signal, not a dated rate decision or financial investment recommendation.',additionalPaths:[]},
  {number:44,page:18,subject:'Economy',head:'Public Finance',chapter:'Budget and Fiscal Policy',leaf:'Deficits',
    stem:['In India, deficit financing is used for raising resources for'],
    options:{A:'economic development',B:'redemption of public debt',C:'adjusting the balance of payments',D:'reducing the foreign debt'},answer:'A',
    explanation:'The official Series A Q44 cell accepts A: economic development.',
    rationale:'The purpose of deficit financing is the direct task. Alternative debt and external-sector uses do not independently justify additional placements.',additionalPaths:[]},
  {number:45,page:18,subject:'History',head:'Ancient India',chapter:'Indus Valley Civilisation',leaf:'Religion and society',
    stem:['Which of the following characterizes/characterize the people of Indus Civilization?',
      '1. They possessed great palaces and temples.','2. They worshipped both male and female deities.','3. They employed horse-drawn chariots in warfare.',
      'Select the correct statement/statements using the codes given below.'],
    options:{A:'1 and 2 only',B:'2 only',C:'1, 2 and 3',D:'None of the statements given above is correct'},answer:'B',
    explanation:'The official Series A Q45 cell accepts B: statement 2 only. Preserve the other historical assertions as propositions to assess.',
    rationale:'The full question tests Harappan religious/social characteristics and public architecture. Both society/religion and town planning are material; no Vedic-era substitution is made.',
    additionalPaths:[{subject:'History',head:'Ancient India',chapter:'Indus Valley Civilisation',subtopic:'Town planning'}]},
  {number:46,page:18,subject:'Science & Technology',head:'Health & Biotechnology',chapter:'Disease and Immunity',leaf:'Transmission',
    stem:['Which of the following diseases can be transmitted from one person to another through tattooing?','1. Chikungunya','2. Hepatitis B','3. HIV-AIDS','Select the correct answer using the codes given below.'],
    options:{A:'1 only',B:'2 and 3 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'B',
    explanation:'The official Series A Q46 cell accepts B: 2 and 3 only. This is the accepted examination option, not personal medical advice.',
    rationale:'The exact task is disease transmission route. No specific outbreak, treatment, vaccine or healthcare programme is tested.',additionalPaths:[]},
  {number:47,page:20,subject:'History',head:'Ancient India',chapter:'Jainism and Philosophical Traditions',leaf:'Tirthankaras and teachings',
    stem:['Which of the following statements is/are applicable to Jain doctrine?',
      '1. The surest way of annihilating Karma is to practice penance.',
      '2. Every object, even the smallest particle has a soul.',
      '3. Karma is the bane of the soul and must be ended.',
      'Select the correct answer using the codes given below.'],
    options:{A:'1 only',B:'2 and 3 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'D',
    explanation:'The official Series A Q47 cell accepts D: all three printed statements.',
    rationale:'The question explicitly tests Jain teachings concerning karma, penance and soul, not a current religious event or sect chronology.',additionalPaths:[]},
  {number:50,page:20,subject:'Science & Technology',head:'Biology',chapter:'Human Physiology',leaf:'Muscles and movement',
    stem:['Consider the following minerals:','1. Calcium','2. Iron','3. Sodium','Which of the minerals given above is/are required by human body for the contraction of muscles?'],
    options:{A:'1 only',B:'2 and 3 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'D',
    explanation:'The official Series A Q50 cell accepts D: 1, 2 and 3. Preserve the original physiological wording and examination answer; do not silently narrow the question to a different mechanism.',
    rationale:'The stated function is muscle contraction. A dedicated muscles-and-movement leaf is more precise than nutrition, mineral deposits or circulation.',additionalPaths:[]},
  {number:52,page:22,subject:'History',head:'Medieval India',chapter:'Bhakti and Sufi Traditions',leaf:'Saints and compositions',
    stem:['Consider the following Bhakti Saints:','1. Dadu Dayal','2. Guru Nanak','3. Tyagaraja','Who among the above was/were preaching when the Lodi dynasty fell and Babur took over?'],
    options:{A:'1 and 3',B:'2 only',C:'2 and 3',D:'1 and 2'},answer:'B',
    explanation:'The official Series A Q52 cell accepts B: Guru Nanak only.',
    rationale:'The task compares the chronology of named Bhakti saints. The Lodi/Babur transition supplies the time anchor rather than independently testing Mughal administration.',additionalPaths:[]},
  {number:56,page:24,subject:'Economy',head:'External Sector',chapter:'Balance of Payments',leaf:'Capital and financial flows',
    stem:['Which of the following constitute Capital Account?','1. Foreign Loans','2. Foreign Direct Investment','3. Private Remittances','4. Portfolio Investment','Select the correct answer using the codes given below.'],
    options:{A:'1, 2 and 3',B:'1, 2 and 4',C:'2, 3 and 4',D:'1, 3 and 4'},answer:'B',
    explanation:'The official Series A Q56 cell accepts B: 1, 2 and 4. Preserve the printed account terminology.',
    rationale:'The question distinguishes capital/financial flows from remittances. It does not ask a present exchange-rate or investment recommendation.',additionalPaths:[]},
  {number:57,page:24,subject:'History',head:'Art & Culture',chapter:'Painting',leaf:'Murals',
    stem:['Consider the following historical places:','1. Ajanta Caves','2. Lepakshi Temple','3. Sanchi Stupa','Which of the above places is/are also known for mural paintings?'],
    options:{A:'1 only',B:'1 and 2 only',C:'1, 2 and 3',D:'None'},answer:'B',
    explanation:'The official Series A Q57 cell accepts B: Ajanta Caves and Lepakshi Temple.',
    rationale:'The tested association is mural painting. Named caves, temple and stupa are site alternatives, not separate architectural-design or dynasty questions.',additionalPaths:[]},
  {number:58,page:24,subject:'History',head:'Ancient India',chapter:'Jainism and Philosophical Traditions',leaf:'Schools of Indian philosophy',
    stem:['With reference to the history of philosophical thought in India, consider the following statements regarding Sankhya school:',
      '1. Sankhya does not accept the theory of rebirth or transmigration of soul.',
      '2. Sankhya holds that it is the self-knowledge that leads to liberation and not any exterior influence or agent.',
      'Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 only',C:'Both 1 and 2',D:'Neither 1 nor 2'},answer:'B',
    explanation:'The official Series A Q58 cell accepts B: statement 2 only. Preserve both printed philosophical propositions.',
    rationale:'The whole question tests Sankhya doctrine. The shared chapter contains Indian philosophical schools; this placement does not identify Sankhya as Jain doctrine.',additionalPaths:[]},
  {number:59,page:24,subject:'Polity',head:'Institutions',chapter:'Union Executive',leaf:'Council of Ministers',
    stem:['In the context of India, which of the following principles is/are implied institutionally in the parliamentary government?',
      '1. Members of the Cabinet are Members of the Parliament.',
      '2. Ministers hold the office till they enjoy confidence in the Parliament.',
      '3. Cabinet is headed by the Head of the State.',
      'Select the correct answer using the codes given below.'],
    options:{A:'1 and 2 only',B:'3 only',C:'2 and 3 only',D:'1, 2 and 3'},answer:'A',
    explanation:'The official Series A Q59 cell accepts A: 1 and 2 only. Retain the original institutional statements rather than rewrite their qualifications.',
    rationale:'Cabinet membership, parliamentary confidence and executive leadership test both the Council of Ministers and the parliamentary form of government.',
    additionalPaths:[{subject:'Polity & Governance',head:'Constitutional Foundations',chapter:'Political Concepts',subtopic:'Forms of government'}]},
  {number:66,page:28,subject:'Economy',head:'Economic Foundations',chapter:'Inflation',leaf:'Distributional effects',
    stem:['Consider the following statements:','1. Inflation benefits the debtors.','2. Inflation benefits the bond-holders.','Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 only',C:'Both 1 and 2',D:'Neither 1 nor 2'},answer:'A',
    explanation:'The official Series A Q66 cell accepts A: statement 1 only. Retain the printed general propositions rather than adding qualifications to the examination stem.',
    rationale:'The statements distinguish the distributional effects of inflation on debtors and bond-holders. This is a static economic-concept question, not an investment recommendation or a dated inflation release.',additionalPaths:[]},
  {number:67,page:28,subject:'Social Development',head:'Employment & Skills',chapter:'Work and Skills',leaf:'Unemployment',
    stem:['Disguised unemployment generally means'],
    options:{A:'large number of people remain unemployed',B:'alternative employment is not available',C:'marginal productivity of labour is zero',D:'productivity of workers is low'},answer:'C',
    explanation:'The official Series A Q67 cell accepts C: marginal productivity of labour is zero.',
    rationale:'The exact task is the definition of disguised unemployment. Preserve the distinction between zero marginal productivity and low productivity; the generic definition does not require an agriculture placement.',additionalPaths:[]},
  {number:68,page:28,subject:'Polity',head:'Institutions',chapter:'Union Executive',leaf:'Council of Ministers',
    stem:['Consider the following statements:',
      '1. The Council of Ministers in the Centre shall be collectively responsible to the Parliament.',
      '2. The Union Ministers shall hold the office during the pleasure of the President of India.',
      '3. The Prime Minister shall communicate to the President about the proposals for legislation.',
      'Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 and 3 only',C:'1 and 3 only',D:'1, 2 and 3'},answer:'B',
    explanation:'The official Series A Q68 cell accepts B: 2 and 3 only. Keep Parliament in the first printed statement; do not silently replace it with Lok Sabha.',
    rationale:'The statements test ministerial collective responsibility and tenure, and a separately assessed Prime Minister-to-President duty. The Prime Minister home is materially justified by statement 3.',
    additionalPaths:[{subject:'Polity & Governance',head:'Institutions',chapter:'Union Executive',subtopic:'Prime Minister'}]},
  {number:70,page:30,subject:'Polity',head:'Institutions',chapter:'Parliament',leaf:'Presiding officers',
    stem:['Consider the following statements:',
      '1. The Chairman and the Deputy Chairman of the Rajya Sabha are not the members of that House.',
      '2. While the nominated members of the two Houses of the Parliament have no voting right in the presidential election, they have the right to vote in the election of the Vice President.',
      'Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 only',C:'Both 1 and 2',D:'Neither 1 nor 2'},answer:'B',
    explanation:'The official Series A Q70 cell accepts B: statement 2 only. Preserve the joint Chairman/Deputy Chairman assertion and the two electoral-college propositions.',
    rationale:'The first statement tests Rajya Sabha presiding-officer membership. The second independently compares nominated-member participation in presidential and vice-presidential elections, warranting both executive homes.',
    additionalPaths:[{subject:'Polity & Governance',head:'Institutions',chapter:'Union Executive',subtopic:'President'},{subject:'Polity & Governance',head:'Institutions',chapter:'Union Executive',subtopic:'Vice-President'}]},
  {number:71,page:30,subject:'Polity',head:'Institutions',chapter:'Judiciary',leaf:'Legal aid',
    stem:['With reference to National Legal Services Authority, consider the following statements:',
      '1. Its objective is to provide free and competent legal services to the weaker sections of the society on the basis of equal opportunity.',
      '2. It issues guidelines for the State Legal Services Authorities to implement the legal programmes and schemes throughout the country.',
      'Which of the statements given above is/are correct?'],
    options:{A:'1 only',B:'2 only',C:'Both 1 and 2',D:'Neither 1 nor 2'},answer:'C',
    explanation:'The official Series A Q71 cell accepts C: both printed statements.',
    rationale:'The named institution, free legal-service objective and State Authority implementation role make legal aid the specific home. No constitutional article or separate social-welfare programme is tested.',additionalPaths:[]},
  ...cse2013FinalImports,
  ...cse2014Imports,
  ...cse2015Imports,
  ...cse2016Imports,
];
const questions = raw.flatMap(row => {
  const year=row.year??2013;
  const context=reviewedPaperContexts.get(year);
  assert.ok(context,'Unreviewed paper context');
  const {originalPdf,keyPdf:answerPdf,keyUrl:answerUrl}=context;
  const id = `cse-${year}-gs-i-${row.number}`;
  const sourceText = row.stem.join(' ');
  const existing = originals.filter(q => q.exam === 'CSE' && q.year === year && q.paper === 'GS-I' && q.questionNumber === row.number);
  if (existing.length) {
    assert.equal(existing.length, 1, `Resolve repeated source identity before import: Q${row.number}`);
    const previous = existing[0];
    assert.equal(normalize(previous.sourceText), normalize(sourceText));
    assert.ok(['A','B','C','D'].every(letter => normalize(previous.options[letter]) === normalize(row.options[letter])), `Options differ: Q${row.number}`);
    assert.equal(previous.answer, row.answer);
    placements.push({ questionId: previous.id, expectedRecordHash: hash(JSON.stringify(previous)), subject: row.subject, topic: row.chapter, subtopic: row.leaf, taxonomyHead: row.head, status: 'approved', rationale: row.rationale,
      secondPass: 'Complete original page and every option rechecked; confirmed an existing source occurrence despite its legacy CDS-prefixed ID. Reuse the ID and do not rewrite wording, answer or source identity.' });
    return [];
  }
  assert.ok(!originals.some(q => q.id === id), `ID collision: ${id}`);
  return [{ id, origin: 'pyq', sourceTextLocked: true, sourceText, sourceTextHash: hash(sourceText),
    exam: 'CSE', year, paper: 'GS-I', questionNumber: row.number,
    subject: row.subject, topic: row.chapter, subtopic: row.leaf, taxonomyHead: row.head,
    difficulty: 'Moderate', promptLines: row.stem, options: row.options, answer: row.answer, explanation: row.explanation,
    requiresFigure: false, additionalPaths: row.additionalPaths,...(row.tags?{classificationTags:row.tags}:{}),
    source: { dataset: 'Reviewed Prelims pilot imports', exam: 'CSE', year, paper: 'GS-I', questionNumber: row.number,
      originalPdf, originalPdfSha256: hash(fs.readFileSync(originalPdf)), originalPage: row.page??2, bookletSeries: 'A',
      answerStatus: 'official-final-key-mirror-visually-reviewed',
      answerSource: answerUrl,
      keyPdf:answerPdf, keySha256: hash(fs.readFileSync(answerPdf)), keyPage: 1, officialAnswer: row.answer, displayedAnswer: row.answer, optionsReordered: false,
      reproductionReview: `Complete printed stem and four options visually compared on page ${row.page??2}; no neighbouring-question text included.`,
      classificationRationale: row.rationale,
      secondPass: 'Complete page rechecked, all four options compared independently of the first-pass transcription; Series A question and key cell confirmed.',
    },
  }];
});
const policy = Object.fromEntries(questions.map(q => [q.id, { status: 'official-final', revision: 1, contentRevision: 0 }]));
for (const [file, value] of [['content/reviewed-prelims-imports.json', { version: 1, batch: 'CSE-2013-page-2-pilot', questions, placements }], ['content/prelims-import-review-policy.json', policy]]) {
  const expected = `${JSON.stringify(value, null, 2)}\n`;
  if (process.argv.includes('--check')) assert.equal(fs.readFileSync(file,'utf8'),expected,`Stale approved imports: ${file}`);
  else if (fs.existsSync(file)&&process.argv.includes('--apply-reviewed-additions')) {
    const previous=JSON.parse(fs.readFileSync(file,'utf8'));
    if(value.questions) {
      assert.equal(previous.version,value.version);
      assert.equal(previous.batch,value.batch);
      for(const old of previous.questions)assert.deepEqual(value.questions.find(q=>q.id===old.id),old,`Existing approved import changed: ${old.id}`);
      assert.deepEqual(value.placements,previous.placements,'Existing reuse placements changed');
    } else for(const [id,old]of Object.entries(previous))assert.deepEqual(value[id],old,`Existing policy changed: ${id}`);
    fs.writeFileSync(file,expected);
  }
  else if (fs.existsSync(file)) assert.equal(fs.readFileSync(file,'utf8'),expected,`Refusing unexpected import replacement: ${file}`);
  else fs.writeFileSync(file, expected);
}
console.log(JSON.stringify({ approvedNewImports: questions.length, approvedExistingPlacements: placements.length, historicalBankChanged: false }));
