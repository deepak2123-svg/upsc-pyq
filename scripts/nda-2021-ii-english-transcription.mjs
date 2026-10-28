// Visual source transcription; editorial approval is recorded separately.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});
const segments=[
['Nursery classes','for the children','starts on April every year.'],
['The pollution level is very','high in our city, and','becomes a health hazard.'],
['India is a country of linguistic','and cultural diversity with','multiple ethnic and social groups.'],
['Why does the lapse rate','effect the tendency','of air to rise ?'],
['The thorax is the upper part','of your body from the neck down','to the bottom of the ribs and diaphragm.'],
['The practical uses of astrology','have seldom been seriously','studied outside India.'],
['She collected','some armful of medicines and','poured them down a drain.'],
['In many countries, the United Nations','or other internationally organised','peacekeeping forces are trying to keep the peace.'],
['Early cities rely on food and water','from the surrounding countryside,','but today cities often depend on distant sources.'],
['Climate change, whether it is','natural or human-induced,','is stressful for the people.']
];
segments.forEach((s,i)=>q(i+1,i<4?2:3,s.map((v,j)=>`${'ABC'[j]}. ${v}`),[...s,'No error'],s));
q(11,4,'Once-over',['To do something quickly','To do something elaborately','To do something perforce','To do something for others']);
q(12,4,'A bag of bones',['An extremely fat person','An extremely thin person','A wealthy person','A healthy person']);
q(13,4,'Muddy the waters',['To spread dirt around','To make a situation easy','To make one’s life happy','To make the situation complicated']);
q(14,4,'To level with',['To be honest','To be on a plain','To cheat someone','To take revenge']);
q(15,4,'Show your hand',['To tell people about the past','To tell people about the future','To tell people about them','To tell people about your plans']);
q(16,4,'To pull up',['To lift heavy weights','To check oneself','To shorten the distance','Too short of destination']);
q(17,4,'Be out of action',['To get punishment','To get reward','To become dysfunctional','To become superactive']);
q(18,4,'Learning from the school of hard knocks',['Learning things from experience','Learning things from others','Learning things from environment','Learning things through difficult experiences']);
q(19,4,'Raise some hackles',['To annoy','To make someone happy','To do a great task','To sit idle']);
q(20,4,'A man of letters',['An excellent artist','A scholar in literature','An outstanding sportsman','A known novelist']);
const ordering=(n,page,parts,opts)=>q(n,page,[...parts.map((s,i)=>`${'PQRS'[i]}. ${s}`),'The correct sequence should be :'],opts,parts);
ordering(21,5,['symbolic of peace, and prosperity','the Gupta Empire in India is','represented through numismatic archaeological','and literary evidences of multiple kinds'],['QPRS','QSRP','PSQR','RSQP']);
ordering(22,5,['the transportation system so that it','and not just the affluent section of society','provides mobility to everyone','there are many ways to restructure'],['PQRS','RQPS','SPRQ','QRPS']);
ordering(23,5,['and accurately displays spatial','relationships between landforms and water bodies','the globe shows Earth’s spherical shape','and comparative distance between locations'],['PQRS','RPQS','SPQR','QRPS']);
ordering(24,6,['the function of the capillaries','and other material to all the cells in','is to take nutrients, oxygen','the body and to take away their waste material'],['PRQS','RPQS','SPQR','QRPS']);
ordering(25,6,['like mine','even to someone with','a tin ear','her singing sounded pretty melodious'],['PRQS','RPQS','SPQR','QRPS']);
ordering(26,6,['the sorry state of affairs in the modern factories','the Government of India','under the British was pro-capitalist','though it took some half-hearted steps to mitigate'],['PRQS','QRSP','SPQR','QPSR']);
ordering(27,7,['of extreme poverty among its people','economic policies was the prevalence','a major characteristic of British rule in India','and the net result of British'],['PRQS','QRSP','RSQP','QPSR']);
ordering(28,7,['you can’t judge','very intelligent, but','a book by its cover','he doesn’t look'],['SQPR','QRSP','RSQP','QPSR']);
ordering(29,7,['membership and partisanship as well as','can be found in the decline in party','evidence of a crisis in party politics','in the rise of antiparty groups and movements'],['RQPS','QRSP','RSQP','QPSR']);
ordering(30,7,['government, market and voluntary organisations','mixture of contributions from','the provision of public goods','and services can be regarded as a complex'],['RQPS','QRSP','RSQP','QPSR']);
q(31,8,'He is essentially a lowbrow person.',['coarse','proud','passionate','pathetic'],['lowbrow']);
q(32,8,'His nostalgia is deep.',['excitement','longing','happiness','ability'],['nostalgia']);
q(33,8,'His truancy is detrimental.',['loyalty','integrity','honesty','absenteeism'],['truancy']);
q(34,8,'He is a maleficent person.',['generous','cunning','criminal','friendly'],['maleficent']);
q(35,8,'His solemnity is celebrated.',['greed','desire','trust','dignity'],['solemnity']);
q(36,8,'His bounty is limitless.',['benevolence','gallantry','nepotism','chivalry'],['bounty']);
q(37,8,'The Holocaust was experienced by millions.',['celebration','destruction','construction','beautiful'],['Holocaust']);
q(38,8,'His aversion is known to all.',['hospitality','hostility','humility','humbleness'],['aversion']);
q(39,8,'To be able to decipher something is wonderful.',['decode','encode','simulate','animate'],['decipher']);
q(40,8,'It is the opportune time to think about investment in the real estate sector.',['honorary','appropriate','difficult','unsuitable'],['opportune']);
q(41,9,'His opinion is lopsided.',['partial','crooked','unequal','balanced'],['lopsided']);
q(42,9,'His work is praiseworthy.',['admirable','condemnable','commendable','creditable'],['praiseworthy']);
q(43,9,'His deeds had retrograde results.',['progressive','negative','retreating','reverse'],['retrograde']);
q(44,9,'He always offers palatable solutions.',['acceptable','agreeable','unacceptable','pleasant'],['palatable']);
q(45,9,'His views on the subject are microscopic.',['broad-based','minute','precise','fine'],['microscopic']);
q(46,9,'He is always obdurate in his behaviour towards other people.',['flexible','callous','insensible','obnoxious'],['obdurate']);
q(47,9,'Mohan always had profound respect for Sohan.',['deep','extreme','sincere','superficial'],['profound']);
q(48,9,'We were living in turbulent times.',['destructive','unstable','calm','stormy'],['turbulent']);
q(49,9,'Amit is a dogmatic person.',['assertive','amenable','bold','rigid'],['dogmatic']);
q(50,9,'Sachin is very fickle in his behaviour.',['stable','capricious','mercurial','vacillating'],['fickle']);
export const english=rows;
export const directions=[
{from:1,to:10,text:'Directions: Each item in this section has a sentence with three underlined parts labelled (a), (b), and (c). Read each sentence to find out whether there is any error in any underlined part. Indicate your response in the Answer Sheet against the corresponding letter i.e., (a) or (b) or (c). If you find no error, your response should be indicated as (d).'},
{from:11,to:20,text:'Directions: Given below are some idioms/phrases followed by four alternative meanings for each. Choose the most appropriate answer from among the options (a), (b), (c) or (d).'},
{from:21,to:30,text:'Directions: Each of the following items in this section consists of a sentence, the parts of which have been jumbled. These parts have been labelled P, Q, R and S. Given below each sentence are four sequences namely (a), (b), (c) and (d). You are required to re-arrange the jumbled parts of the sentence and mark your response accordingly.'},
{from:31,to:40,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words, (a), (b), (c) and (d). Select the option that is nearest in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
{from:41,to:50,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words, (a), (b), (c) and (d). Select the option that is opposite in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'}
];
