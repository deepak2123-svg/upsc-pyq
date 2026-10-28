// Source-page visual transcription; separate second comparison required.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});
const segments=[
['A company of five thousand soldiers,','having marched tirelessly for over five days,','have just moved into their cantonment.'],
['Every person who believes in principles','must stand up to fight','for their convictions.'],
['The Olympic Games reflects','the highest spirit of','human endeavour and achievement.'],
['The principal of the school','stressed the need for discipline','amongst the students.'],
['Failure is the stepping stone to success;','however, successive failures are not','successive stepping stones to success.'],
['India’s strengths are','its diversity of culture and','the spirit of tolerance in it’s people.'],
['Once considered ninth planet of the solar system,','Pluto is today listed as the','largest dwarf planet of the solar system.'],
['The greatest glory in life','is to be able to realize ones dreams and ambitions','without trampling on those of others.'],
['To be able to manage one’s','anger is a reflection of an individual’s','psychological maturity.'],
['A honest mistake','is no more than that;','just an honest mistake.']
];
segments.forEach((s,i)=>q(i+1,i<4?2:3,s.map((v,j)=>`${'ABC'[j]}. ${v}`),[...s,'No error'],s));
q(11,4,'Counting your chickens',['confident of success','greedily accumulating wealth','being careful about spending money','getting scared because of danger']);
q(12,4,'The icing on the cake',['baked food that is delicate and delicious with a topping','extra benefit over and above an already good deal','getting what you asked for','more than what is needed']);
q(13,4,'A stitch in time',['tailoring one’s efforts efficiently','making an effort to succeed','inability to take timely decision','timely action that prevents a negative outcome']);
q(14,4,'At sixes and sevens',['on top of the situation','state of denial','state of total confusion','well-planned and prepared']);
q(15,4,'Talking twenty to the dozen',['talking hurriedly and rapidly','talking too much','talking without making sense','talking out of turn']);
q(16,4,'Under the weather',['walking in the rain','controlled by the elements','browbeaten by the heat','unwell']);
q(17,4,'To sit on the fence',['to act promptly','to be lazy','to be undecided','to sit without doing anything']);
q(18,4,'Once in a blue moon',['romantic moment','occasionally','rarely','often']);
q(19,4,'Through thick and thin',['in genuine friendship','through the best of everything','among people both fat and slim','through difficult times']);
q(20,4,'Like chalk and cheese',['very different from each other','without any blemish','pure white in colour','very like each other']);
const ordering=(n,page,parts,opts)=>q(n,page,[...parts.map((s,i)=>`${'PQRS'[i]}. ${s}`),'The correct sequence should be'],opts,parts);
ordering(21,5,['but perhaps the best way is to agree','there are many ways of dealing','with them without excessive argumentation','with intransigent customers'],['QPRS','QSPR','PSQR','RSQP']);
ordering(22,5,['in the years following','India achieved remarkable economic development','liberalization in the year 1991','the landmark reforms inaugurated via'],['PQRS','PRSQ','SPRQ','QPSR']);
ordering(23,5,['was the victory secured by the women’s hockey team','in the arena of sport, perhaps','against Australia in the Tokyo Olympics','the greatest moment in Indian Olympic history'],['SPQR','RPQS','QSPR','QRPS']);
ordering(24,6,['in terms of GDP and GNP,','for gauging the success of a nation','which are the two major determinants','economic progress is determined'],['SQRP','RPQS','SPRQ','QRPS']);
ordering(25,6,['with the aplomb of a stage artist,','that they are not men of straw','they can twist and shake their wobbly heads','mesmerizing the gullible into believing'],['PRQS','RPSQ','SPQR','QRPS']);
ordering(26,6,['of its rain-soaked verdure','and on the other there are','on the one hand there is the immense beauty','the artifacts of its visible modernity'],['PRQS','QRSP','SPQR','RPQS']);
ordering(27,6,['are often rooted','the causes','of extreme poverty','in the inequalities of social systems'],['QRPS','QRSP','SRQP','SRPQ']);
ordering(28,7,['a person by the way','he behaves and','you must judge','not by the way he looks'],['RPQS','QRSP','RSQP','QPSR']);
ordering(29,7,['to the greatest number of people','that causes the least discomfort','whenever in doubt','always opt for the option'],['RQPS','QRSP','RSQP','QPSR']);
ordering(30,7,['brought by bad times','against the despondency','our greatest defence','faith and belief are'],['RQPS','SRQP','RSQP','QPRS']);
q(31,8,'He is essentially a crude person.',['coarse','refined','eager','balanced'],['crude']);
q(32,8,'His confidence is high.',['diffidence','eagerness','steadfastness','endurance'],['confidence']);
q(33,8,'His integrity is noticed.',['skilfulness','ability','dependability','dishonesty'],['integrity']);
q(34,8,'She is a benevolent individual.',['clever','muddled','malevolent','ambivalent'],['benevolent']);
q(35,8,'His sartorial manner is judged.',['unstylish','uncompromising','common','crude'],['sartorial']);
q(36,8,'This piece of art is authentic.',['genuine','expensive','rare','fake'],['authentic']);
q(37,8,'The deluge affected the population.',['cloudburst','drought','deforestation','drizzle'],['deluge']);
q(38,8,'His dedication is known to all.',['clarity','hostility','apathy','anger'],['dedication']);
q(39,8,'His perspicacity was remarkable.',['smartness','dullness','dedication','deviousness'],['perspicacity']);
q(40,8,'He has a penchant for spicy food.',['tendency','affinity','fear','dislike'],['penchant']);
q(41,9,'After a good meal, it is important to pay a compliment to the chef.',['tip','praise','admonish','revile'],['compliment']);
q(42,9,'His work is laudable.',['praiseworthy','laughable','bold','loud'],['laudable']);
q(43,9,'Raj is a competent carpenter.',['capable','exceptional','inadept','clumsy'],['competent']);
q(44,9,'He is diligent in submitting assignments.',['dilly-dallying','procrastinating','intelligent','conscientious'],['diligent']);
q(45,9,'He appears to be reticent.',['expansive','jolly','silent','withdrawn'],['reticent']);
q(46,9,'He is always jovial.',['cheerful','callous','garrulous','credulous'],['jovial']);
q(47,9,'Mohan remains morose these days.',['introspective','generous','chirpy','sullen'],['morose']);
q(48,9,'He was a reluctant learner.',['enthusiastic','eager','unwilling','fearful'],['reluctant']);
q(49,9,'Amit is optimistic about the prospects of his investments.',['pessimistic','uncaring','carefree','sanguine'],['optimistic']);
q(50,9,'Sachin is very cooperative by nature.',['complaisant','covert','complacent','conniving'],['cooperative']);
export const english=rows;
export const directions=[
{from:1,to:10,text:'Directions: Each item in this section has a sentence with three underlined parts labelled (a), (b) and (c). Read each sentence to determine whether there is any error in any underlined part and indicate your response in the Answer Sheet against the corresponding letter, i.e., (a) or (b) or (c). If you find no error, your response should be indicated as (d).'},
{from:11,to:20,text:'Directions: Given below are some idioms/phrases followed by four alternative meanings to each. Choose the most appropriate answer from among the options (a), (b), (c) and (d).'},
{from:21,to:30,text:'Directions: Each of the following items in this section consists of a sentence the parts of which have been jumbled. These parts have been labelled P, Q, R and S. Given below each sentence are four sequences namely (a), (b), (c) and (d). You are required to rearrange the jumbled parts of the sentence and mark your response accordingly.'},
{from:31,to:40,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words (a), (b), (c) and (d). Select the option that is opposite in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
{from:41,to:50,text:'Directions: Each item in this section consists of a sentence with an underlined word followed by four words (a), (b), (c) and (d). Select the option that is nearest in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'}
];
