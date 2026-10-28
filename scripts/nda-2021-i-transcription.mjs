// Visual transcription from the original NDA I 2021 GAT Series A scan.
// Editorial approval and the distinct second pass are recorded separately.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});

q(1,2,'Her smile was contagious.',['arrogant','disrespectful','sarcastic','catching'],['contagious']);
q(2,2,'Her dynamic nature impressed everyone.',['enduring','attentive','evolutionary','jealous'],['dynamic']);
q(3,2,'She was lamenting her destiny.',['celebrating','bemoaning','blaming','making'],['lamenting']);
q(4,2,'Under his leadership the company grew in an organic manner.',['natural','speedy','unusual','disciplined'],['organic']);
q(5,2,'His charm lies in his oratory.',['deceit','eloquence','looks','nobility'],['oratory']);
q(6,2,'She is a patron of art and culture.',['entrepreneur','admirer','critique','backer'],['patron']);
q(7,2,'Arrogance is a hallmark of his nature.',['concern','unpretentiousness','conceit','simplicity'],['Arrogance']);
q(8,2,'She undertook a reconnaissance of the entire issue.',['revaluation','ratification','investigation','regularisation'],['reconnaissance']);
q(9,2,'My daughter is my replica.',['pride','clone','love','original'],['replica']);
q(10,2,'The sardonic nature of her stories made her stand out among the contemporary writers.',['compassionate','insightful','mocking','comic'],['sardonic']);
q(11,3,'He found her extremely attractive and charming.',['unnatural','modern','repulsive','disapproving'],['attractive']);
q(12,3,'The sky is boundless.',['high','vast','expansive','finite'],['boundless']);
q(13,3,'The sky is clear today.',['bright','opaque','cloudless','blue'],['clear']);
q(14,3,'I have a fascination for deep waters.',['dark','light','dangerous','shallow'],['deep']);
q(15,3,'My boss has been too generous.',['stingy','rough','evil','hostile'],['generous']);
q(16,3,'Spring is a time of plenty.',['ugliness','scarcity','roughness','dryness'],['plenty']);
q(17,3,'He is an industrious workman.',['active','productive','lazy','disloyal'],['industrious']);
q(18,3,'Plants grow in abundance here.',['shrivel','stretch','spread','enlarge'],['grow']);
q(19,3,'She rarely comes here.',['seldom','never','always','frequently'],['rarely']);
q(20,3,'She is a rather crooked woman.',['polite','generous','straightforward','happy'],['crooked']);
q(21,4,'Overstep the mark',['To tell people how successful you are','To step into someone else’s areas of expertise','To upset someone by doing/saying more than you should','To do something in an excited way']);
q(22,4,'Palsy-walsy friends',['Good friends','Friends who help each other in difficult situations','Friends by choice, and not by chance','Unfriendly']);
q(23,4,'Open a Pandora’s box',['To do something that causes a lot of new problems that you did not expect','To do something out of compulsion','To do something beyond expectation','To do something out of the box, that causes awards and ceremonies for you']);
q(24,4,'Pull your socks up',['To get well-dressed for the occasion','Improve your work or behaviour','To speak in an honest way without hesitation','To be in control of an organization, often secretly']);
q(25,4,'To get under somebody’s skin',['To deceive someone','To admire someone','To annoy someone','To support someone']);
q(26,4,'Turn topsy-turvy',['To completely change something','To completely evaluate something','To enjoy yourself greatly','To exhaust yourself completely']);
q(27,4,'A clarion call',['A trumpet call','An intimidating voice','A strong request','An urgent order']);
q(28,4,'Fire in the belly',['Fear and hatred','Powerful ambition','Love and dedication','Lethargy and indifference']);
q(29,4,'A hunky-dory situation',['There are serious issues among people','There are no problems and people are happy','There is war and bloodshed all over','There is no work, only enjoyment']);
q(30,4,'Give somebody a leg up',['To pull someone down','To deceive and betray someone','To help someone for their livelihood','To help someone to be successful']);

const segments=[
['You don’t have','a monopoly on suffering;','other people don’t have problems too.'],
['If you say that someone','you admire has feet of clay,','you mean that they have hidden faults.'],
['He refused to change','his decision;','he refused it point out.'],
['The importance of trade in Mughal times reinforced','the cultural definition of wealth as something','comprising of movable property.'],
['In the nineteenth century,','most traditional scholars','tried to stay clear from the imperial Government.'],
['He began his discussion by pointing over','that men and women','had different biological functions.'],
['Though he is poor,','but he is','honest.'],
['My mother','has been doing','everything for the family.'],
['When learning to dive','it is important','to relax in between and take breaks.'],
['I have the opportunity','to study','in America next year.']
];
segments.forEach((s,i)=>q(i+31,i<4?5:6,s.map((v,j)=>`${'ABC'[j]}. ${v}`),[...s,'No error'],s));
q(41,7,'There was a time when West Germany was a distinct ____.',['policy','polity','abstract','hierarchy']);
q(42,7,'I was ____ with the film; I had expected it to be better.',['disappointed','disappointing','annoying','prejudiced']);
q(43,7,'It was a ____ experience. Everybody was shocked.',['terrified','horrified','terrifying','denouncing']);
q(44,7,'Elephants ____ when they perceive danger.',['trumpet','frolic','whine','sing']);
q(45,7,'The first film on Tagore was such a success that now they are going to make a ____.',['serial','sequence','sequel','sequential']);
q(46,7,'The United Nations had ____ 2020 as the International Year of Plant Health.',['ruled','ordered','foretold','declared']);
q(47,7,'My brother is ____ punctual, but he is late today.',['normatively','primarily','normally','basically']);
q(48,7,'My son is very ____; he trusts everyone.',['fallible','gullible','sensible','credible']);
q(49,7,'Mahatma Gandhi was a ____ lover of humanity and a believer in the goodness of human nature.',['staunch','powerful','cheerful','hopeful']);
q(50,7,'I wish I ____ her before we met.',['know','have known','knew','known']);

q(51,8,['Consider the following statements about Light year:','1. Light year is a unit for measurement of very large distances.','2. Light year is a unit for measurement of very large time intervals.','3. Light year is a unit for measurement of intensity of light.','Which of the statements given above is/are correct ?'],['1, 2 and 3','2 and 3 only','1 and 2 only','1 only']);
q(52,8,'Which one of the following regarding density of water at atmospheric pressure is correct ?',['Density of water at 4°C is 1000 kg/m³.','Density of water at 0°C is 1000 kg/m³.','Density of water at 0°C is 100 kg/m³.','Density of water at 4°C is 10 kg/m³.']);
q(53,8,['Which of the following pairs of physical phenomenon and the discoverer is/are correctly matched ?','1. James Chadwick — Photoelectric effect','2. Albert Einstein — Neutron','3. Marie Curie — Radium','Select the correct answer using the code given below :'],['1, 2 and 3','1 and 2 only','2 and 3 only','3 only']);
q(54,8,'LED (a semi-conductor device) is an abbreviation that stands for',['Licence for Energy Detector.','Light Energy Device.','Light Emitting Diode.','Lost Energy Detector.']);
q(55,8,'The statement “friction force is a contact force while magnetic force is a non-contact force” is',['always true.','true only at 0°C.','a false statement.','either true or false depending upon the temperature of the surroundings.']);
q(56,8,'Which one of the following is the chemical formula of Hypobromous acid ?',['HBrO₄','HOBr','HBr','HBrO₃']);
q(57,8,'The composition of gases in exosphere is',['Helium and Hydrogen.','Neon and Oxygen.','Neon and Hydrogen.','Helium and Neon.']);
q(58,9,'Which one of the following is not used as a raw material in the manufacture of glass ?',['Soda','Alumina','Borax','Gypsum']);
q(59,9,'In electrolytic refining of copper, the electrolyte is a solution of',['acidified copper chloride.','acidified copper sulphate.','potassium chloride.','sodium sulphate.']);
q(60,9,'Solder is an alloy of',['Cu and Sn.','Fe and Zn.','Pb and Sn.','Ag and Zn.']);
q(61,9,'Which one of the following statements about dihydrogen (H₂) is not correct ?',['H₂ is lighter than air and insoluble in water.','H₂ is inert at room temperature due to high H — H bond dissociation enthalpy.','H₂ reacts with alkali metals at high temperature to yield metal hydrides.','A mixture of NO₂ and H₂ is known as Syngas.']);
q(62,9,'Which of the following sets of elements has the same valency ?',['Na, Mg, Ca','Na, Mg, Al','Mg, Ca, K','Mg, Ca, Ba']);
q(63,9,'Which one of the following is the lowest possible temperature ?',['0° Celsius','−073° Celsius','−173° Celsius','−273° Celsius']);
q(64,9,'Numerically two thermometers, one in Fahrenheit scale and another in Celsius scale shall read same at',['−40°','0°','−273°','100°']);
q(65,9,'The image we see in plane mirror is',['real and thus can be photographed.','virtual and nearer than the object.','virtual and is laterally inverted.','real but cannot be photographed.']);
q(66,10,'Which one of the following colours may be obtained by combining green and red colours ?',['Blue','Magenta','Pink','Yellow']);
q(67,10,'Which of the following are the primary colours of light ?',['Yellow, Red and Green','Blue, Red and Green','Violet, Red and Yellow','Indigo, Violet and Green']);
q(68,10,'According to the New Cartesian Sign Convention, which one of the following is correct in respect of the formula 1/f = 1/v + 1/u, where symbols have their usual meanings ?',['It applies only to spherical mirrors.','It applies only to spherical lenses.','It applies to spherical mirrors as well as spherical lenses.','It is an invalid formula.']);
q(69,10,'Movement of materials to different parts of cytoplasm and nucleus is generally carried out by',['Ribosomes.','Mitochondria.','Lysosomes.','Endoplasmic reticulum.']);
q(70,10,'In mitochondria, ATP synthesizing chemical reactions take place in the',['Outer membrane.','Matrix.','Inner membrane.','DNA of mitochondria.']);
q(71,10,'Squamous epithelial cells are found in the inner lining of',['Oesophagus.','Small intestine.','Ducts of salivary gland.','Kidney.']);
q(72,10,'Transformation of meristematic cells into specific permanent tissues occurs by the process of',['Cell differentiation.','Cell division.','Cell multiplication.','Cell regeneration.']);
q(73,10,'The gaseous product of a process in plants is a requirement for another vital process that releases energy. Given below are four combinations of the process and product. Identify the correct answer.',['Respiration and Nitric oxide','Transpiration and Water vapour','Photosynthesis and Oxygen','Germination and Carbon dioxide']);
q(74,11,'In a dicot pot herb, vaseline/vegetable oil was applied on the upper surface of one leaf (Experimental leaf 1) and on the lower surface of another leaf (Experimental leaf 2). Vaseline/Vegetable oil was not applied on the control leaf. The plant was deliberately not watered for several days. Which leaf will dry up last ?',['Experimental leaf 1','Experimental leaf 2','Control leaf','All the leaves will dry up simultaneously']);
q(75,11,'Which one of the following statements is not correct for light rays ?',['Light travels at different speeds in different media.','Light travels at almost 300 million metres per second in air.','Light speeds down as it leaves a water surface and enters the air.','Light speeds up as it leaves a glass surface and enters the air.']);
q(76,11,'A glass prism splits white light into different colours. This phenomenon is called dispersion of light by prism. Which one of the following statements is correct ?',['Red light will deviate the most and it is because of the reflection of light.','Violet light will deviate the most and it is because of the refraction of light.','Red light will deviate the most and it is because of the refraction of light.','Violet light will deviate the most and it is because of the reflection of light.']);
q(77,11,'A current of 1·0 A is drawn by a filament of an electric bulb for 10 minutes. The amount of electric charge that flows through the circuit is',['0·1 C','10 C','600 C','800 C']);
q(78,11,'Which one of the following formulas does not represent electrical power ?',['I²R','IR²','VI','V²/R']);
q(79,11,'The sound created in a big hall persists because of the repeated reflections. The phenomenon is called',['Reverberation.','Dispersion.','Refraction.','Diffraction.']);
q(80,11,'When light is scattered by a molecule and the frequency of the scattered light is changed, this phenomenon is called',['Rayleigh scattering.','Raman effect.','Photoelectric effect.','Rutherford scattering.']);
q(81,12,'Which one of the following statements about the cleansing action of soap is not true ?',['The oil and dirt gets collected in the centre of the micelle.','Soap micelles scatter light.','Soaps are ammonium salts of long chain carboxylic acids.','Soap forms insoluble precipitates with the calcium and magnesium ions in hard water.']);
q(82,12,'Hydrogenation of vegetable oils using nickel catalyst is an example of',['Substitution reaction.','Elimination reaction.','Addition reaction.','Free-radical polymerization.']);
q(83,12,'Which one of the following materials is not an allotrope of carbon ?',['Diamond','Graphene','Fly ash','Fullerene']);
q(84,12,'Which one of the following reactions does not result in the evolution of hydrogen gas ?',['Reaction of zinc metal with dilute sulphuric acid solution','Mixing water to Plaster of Paris','Heating zinc metal with sodium hydroxide solution','Reaction of potassium metal with water']);
q(85,12,'Which one of the following acids is predominantly found in tomatoes ?',['Acetic acid','Tartaric acid','Oxalic acid','Lactic acid']);
q(86,12,'Which one of the following conclusions could not be derived from Rutherford’s α-particle scattering experiment ?',['Most of the space in the atom is empty.','The radius of the atom is about 10⁵ times the radius of the nucleus.','Electrons move in a circular path of fixed energy called orbits.','Nearly all the mass of the atom resides in the nucleus.']);
q(87,12,'Reaction of quick lime (CaO) with water to produce slaked lime (Ca(OH)₂) is an example of',['Displacement reaction.','Endothermic reaction.','Decomposition reaction.','Exothermic reaction.']);
q(88,12,'Which one of the following is not a bio-mass energy source ?',['Wood','Nuclear reactor','Gobar gas','Coal']);
q(89,13,'Twinkling of stars is due to',['particular frequencies of the starlight.','reflection of starlight from the oceanic surface.','atmospheric refraction of starlight.','magnetic field of Earth.']);
q(90,13,'Which one of the following cannot be the unit of frequency of a sound wave ?',['dB','s⁻¹','Hz','min⁻¹']);
q(91,13,'“Beats” is a phenomenon that occurs when frequencies of two harmonic waves are',['equal.','far apart.','multiples of each other.','nearly same.']);
q(92,13,'Light waves are incident on an air-glass boundary. Some of the light waves are reflected and some are refracted in the glass. Which one of the following properties is the same for the incident wave and the refracted wave ?',['Speed','Direction','Brightness','Frequency']);
q(93,13,'Which one of the following statements is true for a simple harmonic oscillator ?',['Force acting is directly proportional to the displacement from the mean position and is in same direction.','Force acting is directly proportional to the displacement from the mean position and is in opposite direction.','Acceleration of the oscillator is constant.','The velocity of the oscillator is not periodic.']);
q(94,13,'During seed germination, the part of the embryo which grows into root is',['Radicle.','Plumule.','Cotyledon.','Epicotyl.']);
q(95,13,'In a typical flower, germinating pollen grains pass through several parts of the gynoecium before they reach the ovule. A list of the parts of gynoecium is given below in different combinations. Choose the combination that represents the correct sequence of pollen tube pathway/journey :',['Style, Stigma, Ovary','Stigma, Style, Ovary','Pistil, Stigma, Ovary','Ovary, Pistil, Style']);
q(96,14,'If human blood is placed in a 2% detergent solution, what will happen to the RBC ?',['The RBC will shrink.','The RBC will swell and become turgid.','The RBC will swell and burst.','The RBC will lyse.']);
q(97,14,'The major source of vitamins and minerals for vegetarians is',['black gram and wheat.','rice and mustard.','vegetables and fruits.','soya bean and milk.']);
q(98,14,'If a ray of light enters from a rarer medium to a denser medium at zero angle of incidence, it would',['reflect back.','go straight.','turn towards right.','bend at 45°.']);
q(99,14,'Mirage is an illustration of',['only dispersion of light.','only reflection of light.','only total internal reflection of light.','both refraction and total internal reflection of light.']);
q(100,14,'Common salt (NaCl) is not used as a raw material for preparation of which one of the following compounds ?',['Bleaching powder','Baking soda','Plaster of Paris','Washing soda']);
q(101,14,'Which one of the following Harappan sites was a specialised centre for making shell objects ?',['Lothal','Balakot','Amri','Kot Diji']);
q(102,14,'Which one of the following was not a part of the dhamma of King Ashoka ?',['Honouring the king','Tolerance of religions other than one’s own','Respecting Brahmanas','Promoting the welfare of his subjects']);
q(103,14,['Which of the following statements about Saguna bhakti traditions is/are correct ?','1. Saguna bhakti traditions focus on the worship of specific deities such as Vishnu or his avatars.','2. In Saguna bhakti traditions, Gods and Goddesses are conceptualised in anthropomorphic forms.','Select the correct answer using the code given below :'],['1 only','2 only','Both 1 and 2','Neither 1 nor 2']);
q(104,15,'At which one of the following places was a Shiva temple not constructed under the patronage of the Chola rulers ?',['Chidambaram','Thanjavur','Gangaikonda Cholapuram','Naneghat']);
q(105,15,['Which of the following statements about the Deccan Riots Commission is/are correct ?','1. The Commission did not hold enquiries in the districts which were not affected.','2. The Commission did record the statements of ryots, sahukars and eye-witnesses.','Select the correct answer using the code given below :'],['1 only','2 only','Both 1 and 2','Neither 1 nor 2']);
q(106,15,'Which one of the following is the correct meaning of ziyarat ?',['Pilgrimage to the tombs of sufi saints','The practice of revenue farming','The death anniversary of a sufi shaikh','A form of Islamic divorce']);
q(107,15,'Keppel Island is completely bleached mainly due to the expansion of',['Starfish.','Blue whale.','Octopus.','Sea horse.']);
q(108,15,'Which one of the following rivers is not a tributary of river Brahmaputra ?',['River Manas','River Kameng','River Mahananda','River Subansiri']);
q(109,15,'Which one of the following is not a minor plate ?',['Cocos Plate','Nazca Plate','Caroline Plate','Antarctic Plate']);
q(110,15,['Advantage(s) of tectonic activity in Iceland include(s) :','1. Source of natural geothermal energy','2. Creation of new land','3. Attraction of tourists','Select the correct answer using the code given below :'],['1 only','2 and 3 only','1 and 3 only','1, 2 and 3']);
q(111,16,'The process whereby certain minerals absorb water, expand and change is called as',['Hydration.','Oxidation.','Hydrolysis.','Carbonation.']);
q(112,16,'Which one of the following is the longest Latitude ?',['90 degree Latitude','23·5 degree Latitude','0·0 degree Latitude','66·5 degree Latitude']);
q(113,16,'If it is 12·00 Noon in India, on which meridian will it be 7·00 am of the same day ?',['7·5 degree E. Longitude','7·5 degree W. Longitude','75 degree E. Longitude','75 degree W. Longitude']);
q(114,16,'Who among the following was considered to be the preceptor of Mirabai ?',['Dadu','Raidas','Ramanand','Surdas']);
q(115,16,['Consider the following statements about the Mahanavami Dibba :','1. It was the name of a giant box of sweets distributed at the Mahanavami festival.','2. It was the name of a massive platform with a base covered with relief carvings.','Which of the statements given above is/are correct ?'],['1 only','2 only','Both 1 and 2','Neither 1 nor 2']);
q(116,16,'Which one of the following statements about the Ain-i-Akbari is not correct ?',['It was written by Abu’l Fazl.','It is a part of a larger work called Akbar Nama.','It describes the Mughal Empire as having a diverse population and a composite culture.','It was later revised by Sadullah Khan on the orders of Shah Jahan.']);
q(117,17,['Swami Dayanand Saraswati','1. was opposed to the worship of idols of Gods and Goddesses.','2. regarded the Vedas as infallible.','3. had met and had discussions with Ishwar Chandra Vidyasagar.','Which of the statements given above are correct ?'],['1, 2 and 3','2 and 3 only','1 and 3 only','1 and 2 only']);
q(118,17,['Consider the following statements :','1. Muhammadan Anglo-Oriental College was founded at Aligarh by Sayyid Ahmad Khan.','2. Sayyid Ahmad Khan was a great believer in religious toleration, and Hindus, Parsis and Christians had contributed to the funds of his college.','Which of the statements given above is/are correct ?'],['1 only','2 only','Both 1 and 2','Neither 1 nor 2']);
q(119,17,'Basket-of-eggs topography is related to',['Drumlins.','Eskers.','Cirques.','Moraines.']);
q(120,17,'Which one of the following planets has the highest density ?',['Mercury','Venus','Jupiter','Earth']);
q(121,17,'Point of Origin of Earthquake Wave is known as',['Epicentre.','Focus.','Photosphere.','Seismic Zone.']);
q(122,18,'The maximum depth of Lithosphere is found in the',['Pacific Ocean.','Siberian Plain.','Patagonian Desert.','Himalayan Mountains.']);
q(123,18,'A large body of magmatic material that cools in the deeper depth of the Earth’s crust and develops in the form of large domes is known as',['Batholiths.','Lacoliths.','Lopoliths.','Phacoliths.']);
q(124,18,'Which one of the following Oil Refineries is not located in Assam ?',['Tatipaka','Numaligarh','Bongaigaon','Digboi']);
q(125,18,'Where and when did Mahatma Gandhi make his first public appearance in India on coming back from South Africa after two decades ?',['Champaran in 1917','Lucknow in 1916','Banaras Hindu University in 1916','Ahmedabad in 1918']);
q(126,18,'When and where was the demand for “Purna Swaraj” or complete independence made by the Indian National Congress ?',['Bombay, 1885','Lahore, 1929','Kheda, 1917','Bombay, 1942']);
q(127,18,'Which one of the following provides for the complete equality of men and women in India ?',['Articles 14 and 15 of the Constitution of India','Fifth Schedule of the Constitution of India','The Indian Independence Act','Article 20 of the Constitution of India']);
q(128,19,['Which of the following statements about the non-permanent members of the Security Council of the United Nations is/are correct ?','1. Their total number is now 10, but was originally only 6.','2. They are elected for a term of two years only.','Select the correct answer using the code given below :'],['1 only','2 only','Both 1 and 2','Neither 1 nor 2']);
q(129,19,'At which of the following was the American Declaration of Independence adopted on 4 July, 1776 ?',['Washington Conference','San Francisco Conference','Second Continental Congress','First Continental Congress']);
q(130,19,'Who among the following was the head of the Government that was overthrown by the Bolsheviks in the 1917 Revolution ?',['Alexander Kerensky','Prince Lvov','Grand Duke Sergei','Tsar Nicholas II']);
q(131,19,'Which one of the following is not a form of condensation ?',['Dew','Fog','Frost','Sleet']);
q(132,19,'Which one of the following clouds is a rain-bearing cloud ?',['Cumulus cloud','Stratus cloud','Nimbus cloud','Cirrus cloud']);
q(133,19,'In which one of the following countries is intensive subsistence agriculture not predominantly practised ?',['India','Japan','Canada','Indonesia']);
q(134,19,'The Headquarters of South-Eastern Railway is located at',['Bilaspur.','Secunderabad.','Kolkata.','Bhubaneswar.']);
q(135,19,'Bharatmala Pariyojana is related to',['interlinking of Northern and Southern Indian rivers in a garland shape.','networks of National Highways in India.','interlinking of all cities of India through Railways.','interlinking of all industrial regions of India through pipelines.']);
q(136,20,'The natural vegetation which covers the maximum geographical areas of India is',['Tropical deciduous forests.','Tropical thorn forests.','Montane forests.','Tropical evergreen forests.']);
q(137,20,'River Beas, flowing from Himachal and Punjab, joins the river',['Indus.','Satluj.','Chenab.','Ravi.']);
q(138,20,'With regard to the Constitution of India, which one of the following statements is not correct ?',['The words — Socialist and Secular — were not originally part of the Constitution.','The Preamble states the objects of the Constitution of India.','The Preamble is enforceable in a Court of Law.','A Republic refers to the people as the source of all authority under the Constitution.']);
q(139,20,'Which one of the following is not a power of the Speaker of the Lok Sabha ?',['Speaker shall preside over the House of the People.','Speaker will cast vote in the first instance in the House.','Speaker will have power to maintain order within the House of the People.','Speaker can adjourn the House or suspend the meeting till there is a quorum.']);
q(140,20,'Which one of the following is included in Article 51A (Part IV A) of the Constitution of India ?',['Fundamental Duties','Suspension of Fundamental Rights','Special Powers of Governors','Writs']);
q(141,20,'As per the data up to November, 2020, released by the Union Finance Ministry, which one of the following countries ranks 1 in terms of ODI (Outward Direct Investment) for the year 2020 — 21 ?',['USA','Singapore','Mauritius','United Kingdom']);
q(142,20,'“Exercise Desert Knight — 21” is a bilateral air exercise between the Indian Air Force and the Air Force of which one of the following countries ?',['USA','France','Britain','Israel']);
q(143,20,'Tableau of which one of the following States/Union Territory was adjudged best in the Republic Day Parade, 2021 ?',['Ladakh','Uttar Pradesh','Tripura','Uttarakhand']);
q(144,21,'In the recently concluded elections in December 2020, Faustin-Archange Touadéra has won a second term in office as President of one of the following countries. Identify the country.',['Central African Republic','Republic of South Africa','Republic of Ghana','Republic of Mozambique']);
q(145,21,'Which one of the following statements is not correct in respect of the “Legion of Merit” award ?',['This award is conferred by the President of the United States of America.','This award was conferred to the Prime Minister of India in December, 2020.','This was also awarded to the Prime Minister of Australia, Scott Morrison.','It is the highest civilian award of the United States of America.']);
q(146,21,'Which one of the following statements is most appropriate about “Exercise Kavach” ?',['It is a military exercise of the Indian Army only.','It is a joint military exercise involving the Indian Army and the Indian Navy only.','It is a joint military exercise involving the Indian Army, the Indian Navy and the Indian Air Force only.','It is a joint military exercise involving the Indian Army, the Indian Navy, the Indian Air Force and also the Indian Coast Guard.']);
q(147,21,'Recently a state of emergency has been declared in which one of the following countries ?',['Maldives','Bhutan','Nepal','Myanmar']);
q(148,21,'Which one of the following teams is the winner of the Syed Mushtaq Ali Trophy, 2021 ?',['Uttar Pradesh','Punjab','Tamil Nadu','Baroda']);
q(149,21,'Which country has replaced Maldives to host the 2023 Indian Ocean Island Games ?',['Madagascar','Sri Lanka','India','Mauritius']);
q(150,21,'Identify the correct reason, out of the following, about Claire Polosak for being in the news :',['She has been honoured with the Pulitzer Prize.','She recently won a Grand Slam championship.','She became the first female match official to conduct a men’s cricket test match.','She has been conferred with the Gandhi Peace Prize.']);

export const questions=rows;
export const directions=[
{from:1,to:10,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words. Select the option that is nearest in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
{from:11,to:20,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words. Select the option that is opposite in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
{from:21,to:30,text:'Directions: Given below are some idioms/phrases followed by four alternative meanings to each. Choose the response (a), (b), (c) or (d), whichever is the most appropriate expression and mark your response in your Answer Sheet accordingly.'},
{from:31,to:40,text:'Directions: Each item in this section has a sentence with three underlined parts labelled (a), (b) and (c). Read each sentence to find out whether there is any error in any underlined part and indicate your response in the Answer Sheet against the corresponding letter i.e., (a) or (b) or (c). If you find no error, your response should be indicated as (d).'},
{from:41,to:50,text:'Directions: Each of the following sentences in this section has a blank space and four words or group of words given after the sentence. Select the word or group of words you consider most appropriate for the blank space and indicate your response on the Answer Sheet accordingly.'}
];
