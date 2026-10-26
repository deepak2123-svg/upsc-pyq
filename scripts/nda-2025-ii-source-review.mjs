// Explicit readings of the supplied Series A source, not a secondary answer table.
// Workflow evidence only: no runtime eligibility is changed by this module.
export const passage = "Can agricultural productivity meet human needs in the long run ? Since twentieth century advances, given increasing costs, do not seem sustainable, further increases in output will not be achieved easily. Global population growth, while showing signs of slowing down, has pushed farmers and herders into areas unsuited to intensive agriculture, accelerating worldwide ecological disruptions. Reserves of arable land and fresh water have diminished alarmingly. Chemical runoffs have compounded pollution problems. Invasion of natural habitats have hastened species extinction. Desertification has been severe in the last hundred years, especially in North Africa, southern portions of Africa, Australia, northern Mexico, and the American Southwest. Tropical forests have shrunk by one-half since World War II, with agricultural pressures causing three-quarters of that loss. Government intervention has produced its share of catastrophes, ranging from a terrible famine in China between 1958-1961 that may have killed 30 million people and destroyed the Aral Sea. Taking everything into consideration, we may remain hopeful about humankind’s agricultural prospects, but we can scarcely look forward optimistically at the end of the first quarter of the twenty-first century.";
export const directions = [
 {from:1,to:5,text:'Directions: Read the following passage carefully and answer the items that follow the passage. Your answers to these items should be based solely on the passage.'},
 {from:9,to:10,text:'Directions: Following items have sentences in active voice with four options. One of the options converts the active voice into passive voice correctly. Select the most appropriate option and mark your answer on the Answer Sheet.'},
 {from:11,to:15,text:'Directions: In the following items, a pair of words is provided. You are required to select the option that most appropriately describes the meaning of both the words and mark your response on the Answer Sheet accordingly.'},
 {from:16,to:20,text:'Directions: In the following items a sentence or a phrase is given with a word that is underlined, followed by four words or group of words. Select the option that is nearest in meaning to the underlined word and mark your response on the Answer Sheet accordingly.'},
 {from:21,to:25,text:'Directions: In this section each item consists of six sentences of a passage. The first and sixth sentences are given in the beginning as S1 and S6. The middle four sentences in each have been jumbled up and labelled as P, Q, R and S. You are required to find the proper sequence of the four sentences and mark your response accordingly on the Answer Sheet.'},
 {from:26,to:35,text:'Directions: Given below are sentences that use discourse markers/expressions to make them complete. Identify the most appropriate discourse marker and mark your answer accordingly on the Answer Sheet.'},
 {from:36,to:40,text:'Directions: Given below are words/expressions/jargons followed by four options. Identify the most appropriate option that defines the word/expression/jargon in each instance, and mark your response accordingly on the Answer Sheet.'},
 {from:41,to:45,text:'Directions: Each of the following items in this section consists of a sentence, the parts of which have been jumbled. These parts have been labelled as P, Q, R and S. Each sentence is followed by four sequences, namely (a), (b), (c) and (d), indicating the rearrangement of the parts. You are required to select the most appropriate option and mark your response on the Answer Sheet accordingly.'},
 {from:46,to:50,text:'Directions: Each of the following sentences in this section has a blank space, followed by four options. Select the most appropriate option to fill in the blank and mark your response on the Answer Sheet accordingly.'}
];
export const sourcePatches = {
 10:{options:{D:'Four hundred engineers have been recruited by the company. Internship of three weeks will have had to be completed by them'}},
 13:{options:{A:'Overcome means triumph over and succeed means to achieve something',B:'Overcome means achieve something and succeed means to triumph over'}},
 15:{options:{A:'Emancipate means authorize and empower means liberate'}},
 19:{options:{B:'dubious',C:'dishonest'}},
 27:{options:{A:'On the contrary',C:'Briefly'}},
 30:{promptLines:['The difference is that I have been fortunate to find a career that I love and, __________, I am getting paid reasonably for it.']},
 34:{promptLines:['__________, in the year-ago period the current account deficit stood at $1·3 billion or 0·2% of the GDP.']},
 39:{options:{A:'Prediction based on past experiences'}},
 40:{options:{B:'Too eager to help or obey someone important'}},
 41:{promptLines:['P. of children they also contain deeply embedded','Q. whereas traditional fairy tales','R. moral lessons that are relevant even for adults','S. were designed for the entertainment'],options:{B:'QSRP',D:'QSPR'}},
 42:{promptLines:['P. of school education is an ineluctable truth','Q. that sporting activities are an integral part','R. meaningfully towards the overall growth of a student','S. that underscores the learning process and contributes']},
 43:{promptLines:['P. and contentment on account of a life lived','Q. the beneficial outcome of','R. well without retribution or rebuke','S. a virtuous life is peace of mind'],options:{C:'QSPR',D:'QSRP'}},
 44:{promptLines:['P. more representative than the latter','Q. from a non-parliamentary system','R. in as much as the former is','S. it is widely believed that the parliamentary system differs']},
 45:{promptLines:['P. crushes the spirit behind the service','Q. it stunts the person offering the same and','R. exhibition or for fear of public opinion','S. when service is done for'],options:{C:'RSPQ',D:'SRQP'}},
 46:{options:{A:'any further',B:'further'}},
 48:{options:{A:'special',C:'specialist'}},
 54:{options:{A:'The net force on a body is proportional to that body’s acceleration',D:'The net force on a body is proportional to that body’s momentum'}},
 58:{promptLines:['Which one of the following wavelength radiations may correspond to an X-ray ?']},
 63:{promptLines:['Which one of the following instruments can be used to measure −250°C temperature ?'],options:{A:'By using a mercury based thermometer',B:'By using an alcohol based thermometer'}},
 64:{promptLines:['The quantity of heat needed to change unit mass of a substance from liquid to vapour without changing the temperature, is called']},
 66:{options:{A:'It increases when temperature increases',B:'It decreases when temperature increases',D:'It will always decrease with increase or decrease of temperature'}},
 72:{promptLines:['For a material under static conditions, which one among the following statements is correct ?'],options:{C:'Both perfect conductor and insulator can be charged',D:'Both perfect conductor and insulator cannot be charged'}},
 78:{promptLines:['Chola inscriptions mention several categories of lands. Which one of the following was meant for the maintenance of school ?']},
 81:{promptLines:['Match List I with List II and select the answer using the code given below the Lists :','List-I (Reformer)','A. Vishnu Shastri Pundit','B. Karsondas Mulji','C. Debendranath Tagore','D. Raja Ram Mohan Roy','List-II (Social Work/Text)','1. Vedic Physics : Scientific Origin of Hinduism','2. Widow Remarriage Association','3. Satya Prakash','4. Tattvabodhini Sabha','Code: A B C D'],options:{A:'1 3 4 2',B:'1 4 3 2',C:'2 3 4 1',D:'2 4 3 1'}},
 83:{promptLines:['Arrange the following foreign travellers to India in chronological order, beginning with the earliest :','1. Peter Mundy','2. Antonio Monserrate','3. Afanasii Nikitich Nikitin','4. Ibn Battuta','Select the answer using the code given below :']},
 84:{options:{C:'International Bank for Reconstruction and Development'}},
 87:{promptLines:['Which of the following Acts established the Board of Control to guide and control the work of the Court of Directors and the Government of India ?']},
 93:{options:{B:'2 and 3',C:'2 only'}},
 94:{options:{A:'Nil',B:'1'}},
 95:{promptLines:['Which one of the following committees is NOT associated with decentralization of Panchayati Raj institutions in India ?']},
 98:{promptLines:['Which one of the following type of medicines is used for treating indigestion ?']},
 101:{options:{C:'During a physical change, the chemical composition of molecules changes'}},
 103:{promptLines:['Match List I with List II and select the answer using the code given below the Lists :','List-I (Element)','A. Phosphorus','B. Nitrogen','C. Neon','D. Sulphur','List-II (Atomicity)','1. 2','2. 1','3. 8','4. 4','Code: A B C D'],options:{A:'4 1 2 3',B:'4 2 1 3',C:'3 2 1 4',D:'3 1 2 4'}},
 105:{promptLines:['Which one of the following is considered to be the purest source of water ?']},
 107:{promptLines:['Match List I with List II and select the answer using the code given below the Lists :','List-I (Reaction)','A. CaO (s) + H₂O (l) → Ca(OH)₂ (aq)','B. CaCO₃ (s) → CaO (s) + CO₂ (g)','C. Pb (s) + CuCl₂ (aq) → PbCl₂ (aq) + Cu (s)','D. Na₂SO₄ (aq) + BaCl₂ (aq) → BaSO₄ (s) + 2NaCl (aq)','List-II (Type)','1. Single displacement','2. Double displacement','3. Combination','4. Decomposition','Code: A B C D'],options:{A:'2 1 4 3',B:'2 4 1 3',C:'3 4 1 2',D:'3 1 4 2'}},
 113:{promptLines:['Consider the following pairs with reference to sedimentary rocks and the process of their formation :','Sedimentary Rock — Process of Formation','1. Chert — Chemically formed','2. Geyserite — Organically formed','3. Shale — Mechanically formed','Which of the pairs given above is/are correctly matched ?'],options:{A:'1 only',B:'1 and 2 only',D:'1, 2 and 3'}},
 115:{options:{A:'1 only',B:'2 only'}},
 119:{options:{A:'1 only',B:'1 and 2 only'}},
 125:{options:{C:'Narmada',D:'Tapti'}},
 128:{promptLines:['Match List I with List II and select the answer using the code given below the Lists :','List-I (City)','A. Bewar','B. Balaghat','C. Bilaspur','D. Ballary','List-II (Mineral)','1. Manganese','2. Mica','3. Iron-ore','4. Bauxite','Code: A B C D'],options:{A:'3 1 4 2',B:'3 4 1 2',C:'2 1 4 3',D:'2 4 1 3'}},
 129:{options:{B:'Goa',D:'Uttar Pradesh'}},
 130:{promptLines:['Consider the following pairs with reference to Thermal Power Plants and their location in respective states in India :','Thermal Power Plant — Located in State','I. Panki — Uttar Pradesh','II. Parli — Karnataka','III. Vijayawada — Telangana','IV. Vanakbari — Gujarat','How many of the pairs given above is/are correctly matched ?'],options:{A:'1',B:'2'}},
 132:{promptLines:['The headquarters of World Meteorological Organization (WMO) is located at'],options:{A:'Switzerland',B:'Scotland'}},
 135:{options:{B:'Pulmonary arteries always carry oxygenated blood while Pulmonary veins always carry deoxygenated blood',C:'Arteries have thicker and more elastic walls compared to veins in general'}},
 136:{promptLines:['Identify the functions that are controlled by the hind brain of human being']},
 137:{options:{B:'Thyroxin',D:'Adrenalin'}},
 138:{options:{B:'Ovary and sebaceous gland',C:'Ovary and pituitary gland'}},
 140:{options:{A:'Endoplasmic reticulum and Golgi bodies',B:'Mitochondria and Chloroplast',C:'Endoplasmic reticulum and cytoskeleton'}},
 142:{promptLines:['Which one of the following organisations has completed 150 years of service to the nation in the year 2025 ?'],options:{B:'Survey of India',C:'India Meteorological Department'}},
 143:{options:{B:'2 only',C:'Both 1 and 2'}},
 144:{options:{A:'600',B:'740'}},
 145:{options:{B:'Bharat Ke Badhte Kadam',C:'State Support Mission'}},
 147:{options:{A:'1 only',B:'2 only'}},
 148:{options:{A:'1 and 4',C:'1 and 2 only'}},
 149:{promptLines:['Consider the following statements about Cricket player Virat Kohli :','1. He is the only captain to have scored seven double centuries in Test Cricket','2. He is the only Indian cricketer with most centuries as a captain','3. He is the first Indian captain to achieve twin centuries on captaincy debut','4. He holds the record for the most double centuries by an Indian in Test Cricket','Which of the statements given above are correct ?'],options:{A:'1 and 2 only',D:'1, 2, 3 and 4'}}
};
export const englishPages = [[1,3,2],[4,8,3],[9,13,4],[14,20,5],[21,23,6],[24,27,7],[28,35,8],[36,41,9],[42,44,10],[45,50,11]];
export const partBPages=[[51,56,13],[57,62,15],[63,68,17],[69,75,19],[76,80,21],[81,85,23],[86,91,25],[92,95,27],[96,101,29],[102,106,31],[107,111,33],[112,115,35],[116,119,37],[120,123,39],[124,128,41],[129,134,43],[135,140,45],[141,146,47],[147,150,49]];
export const sourceLineBreaks={'Intern-ship':'Internship','some-thing':'something','experi-ences':'experiences','some-one':'someone','propor-tional':'proportional','instru-ments':'instruments','thermo-meter':'thermometer','tempera-ture':'temperature','state-ments':'statements','insu-lator':'insulator','mainte-nance':'maintenance','ex-cluding':'excluding','travel-lers':'travellers','Reconstruc-tion':'Reconstruction','estab-lished':'established','Funda-mental':'Fundamental','com-mittees':'committees','indiges-tion':'indigestion','mole-cules':'molecules','con-sidered':'considered','signi-ficant':'significant','move-ments':'movements','asso-ciated':'associated','pro-cesses':'processes','re-moval':'removal','eluvia-tion':'eluviation','tropo-pause':'tropopause','influ-ence':'influence','Meteoro-logical':'Meteorological','Pulmo-nary':'Pulmonary','deoxy-genated':'deoxygenated','con-trolled':'controlled','cyto-skeleton':'cytoskeleton','organisa-tions':'organisations','pro-motion':'promotion','Govern-ment':'Government'};
export const underlined = {16:['instil'],17:['allegiance'],18:['inscrutability'],19:['dodgy'],20:['inclement']};
export const reviewState = {
 reviewer:'codex-main (AI)', date:'2026-10-26',
 reproductionFirstPass:{questionNumbers:[1,150],decision:'complete; corrections explicit above'},
 secondPass:'complete; fresh reverse-order AI comparison, not independent human review',
 classification:'approved; see content/audits/nda-2025-ii-source-signoff.json',
 keyAuthentication:'official final; direct UPSC PDF and hash recorded in the signoff and key transcriptions'
};
