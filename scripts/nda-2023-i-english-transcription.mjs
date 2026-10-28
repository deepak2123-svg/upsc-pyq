// First visual transcription only; distinct reproduction/classification passes required.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});
const segments=[
 ['Over long periods of time,','layers of sediments builds up','to a height of a few kilometers.'],
 ['When a gas is','cooled down it turns into a liquid','from a process called condensation.'],
 ['If you want','to know the news','you can read a newspaper.'],
 ['Columbus made his','first voyage from Europe to America','on 1492.'],
 ['Whenever the sky is','clear, you can see','the stars in the night.'],
 ['I’m not working tomorrow,','so I don’t had to','get up early.'],
 ['She didn’t','tell anybody','about her plans.'],
 ['She wouldn’t have','has an accident,','if she had driven carefully.'],
 ['I will watch film','if I finish the work','in time.'],
 ['In 1989, the government','did an about-face and Iran restored','it’s family planning program.']
];
segments.forEach((ss,i)=>q(i+1,i<4?2:3,ss.map((s,j)=>`${'ABC'[j]}. ${s}`),[...ss,'No Error'],ss));
q(11,4,'During the pandemic the indigent people had to suffer a lot.',['very poor','opulent','solvent','prosperous'],['indigent']);
q(12,4,'She had no idea what made him angry in one minute and jovial the next.',['aggrieved','melancholic','doleful','mirthful'],['jovial']);
q(13,4,'It is sheer lunacy to drive a car in this frosty weather.',['prudence','normalcy','insanity','sanity'],['lunacy']);
q(14,4,'Operating on a child with cancer needs meticulous planning and teamwork.',['strong','long','playful','scrupulous'],['meticulous']);
q(15,4,'The thrill of over-speeding the vehicle can be exhilarating, but it is important not to take the consequences lightly.',['humdrum','dreary','exciting','agitating'],['exhilarating']);
q(16,4,'The redemption will now depend on his new strategy of inclusiveness.',['retrieval','forfeiture','corporation','desecration'],['redemption']);
q(17,4,'Only three candidates are now in contention for the title.',['involved in dispute','in agreement with each other','chance of winning','amiable to each other'],['contention']);
q(18,4,'All my fishing paraphernalia is in the car.',['boxes','accessories','fuel','food'],['paraphernalia']);
q(19,4,'The public watched in astonishment as he took a sudden jump from the bridge.',['anticipation','hurriedly','wonderment','calmness'],['astonishment']);
q(20,4,'Drinking inordinate amount of liquor is not good for health.',['temperate','exorbitant','moderate','regular'],['inordinate']);
const order=(n,page,parts,options)=>q(n,page,[...parts.map((p,i)=>`${'PQRS'[i]} : ${p}`),'The correct sequence should be :'],options,parts);
order(21,5,['because I feel','you remember it better','when you write something,','I make at least three drafts of a song'],['SPRQ','RQPS','QRSP','PRSQ']);
order(22,5,['for hours in the shop','a gunman who held','a hostage','demanded ransom of ₹ 10 lakh'],['SPRQ','RQPS','QRPS','PRSQ']);
order(23,5,['living in Russia','country immediately','Ukraine has urged its citizens','to leave the'],['SPRQ','RPSQ','RSQP','PRSQ']);
order(24,6,['ripping roofs off houses and raising fears of','coast of Madagascar in the early hours,','cyclone Emnati crashed into the southeastern','flooding and food shortages in the region'],['SPRQ','RPSQ','RQPS','PRSQ']);
order(25,6,['ecology is protected and aquatic life thrives','we need to utilize the resources of water','for different purposes while','ensuring that its natural'],['SPRQ','RQPS','QRSP','PRSQ']);
order(26,6,['very difficult','the poor visibility','made the movement of traffic','due to fog'],['SPRQ','RQPS','QRPS','QSRP']);
order(27,7,['avenues for the patients to indict','but rarely is it the other way round','there are multiple legal','the doctors'],['SPRQ','RPSQ','QRPS','QSRP']);
order(28,7,['flight, and each person','her own journey','life is a solo','makes his or'],['SPRQ','RPQS','RPSQ','PQRS']);
order(29,7,['made it evolve','technologies and equipment has','into a rare centre of excellence','adoption of the latest'],['PQRS','RPQS','SQPR','QSRP']);
order(30,7,['please mark the same','be made in response to this notice','if you have any complaint to','to the concerned authority'],['PQRS','RPQS','SQPR','RQPS']);
q(31,8,'The parental support can fortify a child’s learning.',['weaken','encourage','brace','strengthen'],['fortify']);
q(32,8,'Now we can have another dazzling thought, as an outcome of my brilliant research!',['splendid','murky','dazing','fulgent'],['dazzling']);
q(33,8,'The group held some clandestine meetings to resolve the matter.',['secret','covert','sneaky','public'],['clandestine']);
q(34,8,'In the winters, the countryside view is bleak and the house is drafty.',['cheerless','verdant','desolate','bare'],['bleak']);
q(35,8,'Amid commotion the leader and his supporters remained passive.',['quietude','uproar','tempest','stir'],['commotion']);
q(36,8,'He had the audacity to blame him.',['boldness','vigour','temerity','politeness'],['audacity']);
q(37,8,'They are making plans for the abatement of the nuisance within a specified time.',['subsidence','ebbing','accumulation','mitigation'],['abatement']);
q(38,8,'There is exponential growth in the development of the scientific researches in the recent few decades.',['aggressive','rampant','meager','augmented'],['exponential']);
q(39,8,'He was known for his sagacity.',['prudence','wisdom','ignorance','sapience'],['sagacity']);
q(40,8,'The river Ganges culminates in the Bay of Bengal.',['concludes','flows','originates','merges'],['culminates']);
q(41,9,'The lion’s share',['A portion of something','The largest and the best part of something','An important decision','An aggressive statement']);
q(42,9,'Spill the beans',['Reveal a secret','Forced to leave belongings','Share the news','Take offence at someone’s rude behaviour']);
q(43,9,'Cook someone’s goose',['To assist others','Hypnotize other’s mind','To spoil other’s plans','Inviting misfortune']);
q(44,9,'Disappear into thin air',['Lost forever','Become forgetful','Become uncaring','Disappear suddenly']);
q(45,9,'Put the screws on',['Forcing someone to do what you want','Never letting go of things','Keep the past alive','Using someone’s trick for own benefit']);
q(46,9,'Sit on the fence',['Avoid meeting someone','Waiting patiently','Avoid taking sides','Hiding from someone']);
q(47,9,'Be as sharp as a tack',['A talkative person','A shrewd person','A clumsy person','A clever person']);
q(48,9,'From pillar to post',['Upside down','Keep moving from one place to another','Constructing a huge building','Jumping from the top of the mountain']);
q(49,9,'Heath Robinson',['Very complicated system or machine for doing a simple task','Treating everyone as enemy, when they are not','Sleeping all day, doing nothing','Very lazy person, slow in action']);
q(50,9,'As thick as thieves',['Dumb person','Good for nothing','Someone who uses everyone for personal gain','Very close friends who are looked upon with suspicion']);
export const english=rows;
export const directions=[
 {from:1,to:10,text:'Directions : Each item in this section has a sentence with three underlined parts labelled (a), (b) and (c). Read each sentence to find out whether there is any error in any underlined part. Indicate your response in the Answer Sheet against the corresponding letter i.e., (a) or (b) or (c). If you find no error, your response should be indicated as (d).'},
 {from:11,to:20,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four options, (a), (b), (c) and (d). Select the option that is nearest in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
 {from:21,to:30,text:'Directions : Each of the following items in this section consists of a sentence, the parts of which have been jumbled. These parts have been labelled P, Q, R and S. Given below each sentence are four sequences namely (a), (b), (c) and (d). You are required to re-arrange the jumbled parts of the sentence correctly and mark your response accordingly.'},
 {from:31,to:40,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four options, (a), (b), (c) and (d). Select the option that is opposite in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
 {from:41,to:50,text:'Directions : Given below are some idioms/phrases followed by four alternative meanings for each. Choose the most appropriate answer from among the options (a), (b), (c) or (d).'}
];
