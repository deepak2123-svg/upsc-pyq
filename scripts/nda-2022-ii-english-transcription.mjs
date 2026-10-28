// Original scan visual transcription; not approved until a separate comparison.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});
q(1,2,'Human craving for comfort leads to anxiety.',['like','dislike','discomfort','complacency'],['craving']);
q(2,2,'His writings on the subject are obscure.',['murky','vague','obvious','uncertain'],['obscure']);
q(3,2,'The achievements of the team have been monumental in the last ten years.',['enormous','memorable','striking','unimpressive'],['monumental']);
q(4,2,'His frail appearance was considered a merit.',['weak','delicate','sturdy','big'],['frail']);
q(5,2,'The novel depicts the hapless status of certain sections of society.',['wretched','miserable','rural','fortunate'],['hapless']);
q(6,2,'Her ideas have always been eccentric.',['special','strange','normal','local'],['eccentric']);
q(7,2,'The land appears to be parched.',['dry','desiccated','wet','scorched'],['parched']);
q(8,2,'The newly made road was smooth.',['rutted','dangerous','winding','silken'],['smooth']);
q(9,2,'Plenitude is one major cause for environmental degradation.',['abundance','insufficiency','ample','plethora'],['Plenitude']);
q(10,2,'The scholar quoted irrefutable evidence for her thesis.',['overwhelming','undeniable','certain','questionable'],['irrefutable']);
q(11,3,'Ravi told his friend that he had no intention to malign him.',['benign','slander','praise','greet'],['malign']);
q(12,3,'Sheela appeared to be vexed.',['clear','calm','displeased','uncomplicated'],['vexed']);
q(13,3,'Do not hold any preconception about people.',['notion','experiment','great idea','conceit'],['preconception']);
q(14,3,'All mortal elements are impermanent.',['temporal','immortal','never-ending','divinely'],['mortal']);
q(15,3,'The itinerary of the group’s visit to the hills was given to everyone.',['invitation','information','schedule','names'],['itinerary']);
q(16,3,'The effort was to harness the power of nature.',['abuse','benefit','apply','control'],['harness']);
q(17,3,'The fickle nature of humans is at times the cause of great innovations.',['vacillating','consistent','strong','wily'],['fickle']);
q(18,3,'The flood situation during the monsoon this year was calamitous.',['abundance','catastrophic','encouraging','welcome'],['calamitous']);
q(19,3,'He was appointed as the honorary member of the team.',['paid','invited','accepted','unpaid'],['honorary']);
q(20,3,'The church decided to excommunicate him for his actions.',['admit','reward','expel','promote'],['excommunicate']);
const ordering=(n,page,parts,opts)=>q(n,page,parts.map((s,i)=>`${'PQRS'[i]}. ${s}`),opts,parts);
ordering(21,4,['to be successful','what it is','as a human being','have you ever considered'],['SQPR','RQPS','QRSP','PRSQ']);
ordering(22,4,['there is in all instance a single,','surrender to the idea that','authoritative truth to be discovered and defended','many people today are willing to'],['RPSQ','SPRQ','RPQS','SQPR']);
ordering(23,4,['for yourself the implications of death,','if you do not reflect and understand','from one preacher to another','you will go endlessly'],['SRPQ','QPSR','RSPQ','QRSP']);
ordering(24,5,['a way of understanding the world,','a language represents','and relating them to one another','differentiating between things'],['PSRQ','SRPQ','RSPQ','QPSR']);
ordering(25,5,['for India’s future','mathematics and mathematical thinking','will be very important','it is recognized that'],['QRPS','RPSQ','QRSP','SQRP']);
ordering(26,5,['in agriculture and veterinary sciences through','will be enhanced sharply','programmes integrated with general education','the preparation of professionals'],['SRPQ','RQPS','SPRQ','PQRS']);
ordering(27,5,['and should shift the way','are certainly very important,','we think about politics','the issues raised by feminists and multiculturalists'],['RPQS','RSPQ','SPQR','SQPR']);
ordering(28,6,['by which the genetic material of a plant is altered,','pests and enhance its nutritional value','perhaps to make it more resistant to','genetic modification (GM) is the science'],['QRPS','SPRQ','RSPQ','RPQS']);
ordering(29,6,['a much wider array of perspectives','the editors of the present work','the history of social reforms from','argue the need to understand'],['QSRP','QPRS','RSQP','SQRP']);
ordering(30,6,['for which she fought till the end','as a champion of women’s rights,','Pandita Ramabai was truly remarkable','as a pioneer in women’s education and'],['SRQP','QPRS','RSQP','PQRS']);
const segments=[
['Our greatest glory is','not in never falling but in','raising every time we fall.'],
['Rahim was one of that','selected for','the award.'],
['Sujini has met her old friend','Guru before she shifted','to Hyderabad two years ago.'],
['This monument happens','to be one of the old monument','in the city.'],
['Amit told to Divya','that he would come','with a reward for her.'],
['If you have asked me','for the truth I would have told','you at that time.'],
['If I will be the millionaire','I would eradicate','poverty from the country.'],
['A bird in hand','is better than','two in the bush.'],
['The opportunity to attain foundational literacy','and pursue a honest livelihood','must be viewed as basic right of every citizen.'],
['Though there is progress','for different directions,','why is there no brotherhood?']
];
segments.forEach((s,i)=>q(31+i,i<5?7:8,s.map((v,j)=>`${'ABC'[j]}. ${v}`),[...s,'No error'],s));
q(41,9,'A queer fish',['A strange person','A good person','An unlucky person','A lucky person']);
q(42,9,'Eat like a bird',['Eat very quickly','Eat a lot','Eat continuously','Eat very little']);
q(43,9,'Lock horns',['Be like a bull','Argue about something','Agree with someone','Think about the horns']);
q(44,9,'Early bird',['Low flying','Latest','Ancient avian','First arrival']);
q(45,9,'Be in the pink',['To be very healthy','To be very colourful','To be very sad','To be very rich']);
q(46,9,'Be in the running',['In a very bad state to speak','In a powerful position','In a good position to win','In a losing position']);
q(47,9,'A sea change',['Change in the sea tides','A complete change','Change like sea','Changed sea with pollution']);
q(48,9,'A pearl of wisdom',['An important event in one’s life','An important person of wisdom','An important piece of advice','An important thing in one’s life']);
q(49,9,'Be in seventh heaven',['To be extremely sorry','To be extremely wise','To be extremely sad','To be extremely happy']);
q(50,9,'Be in the red',['To owe money to a bank','To get money from one’s family','To be in danger of being caught','To be in the favour of needy people']);
export const english=rows;
export const directions=[
{from:1,to:10,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words (a), (b), (c) and (d). Select the option that is opposite in meaning to the underlined word and mark your response in the Answer Sheet accordingly.'},
{from:11,to:20,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words/group of words (a), (b), (c) and (d). Select the option that is nearest in meaning to the underlined word and mark your response in the Answer Sheet accordingly.'},
{from:21,to:30,text:'Directions: Each of the following items in this section consists of a sentence the parts of which have been jumbled. These parts have been labelled P, Q, R and S. Given below each sentence are four sequences namely (a), (b), (c) and (d). You are required to rearrange the jumbled parts of the sentence and mark your response accordingly.'},
{from:31,to:40,text:'Directions: Each item in this section has a sentence with three underlined parts labelled (a), (b) and (c). Read each sentence to find out whether there is any error in any underlined part. Indicate your response in the Answer Sheet against the corresponding letter, i.e., (a) or (b) or (c). If you find no error, your response should be indicated as (d).'},
{from:41,to:50,text:'Directions: Given below are some idioms/phrases followed by four alternative meanings for each. Choose the most appropriate answer from among the options (a), (b), (c) and (d).'}
];
