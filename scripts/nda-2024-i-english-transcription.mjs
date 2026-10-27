// First visual source pass. Not publication or second-pass approval.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(['A','B','C','D'].map((l,i)=>[l,options[i]])),underlined});
q(1,2,'Mohan was living in a deplorable condition.',['reprehensible','opprobrious','despicable','commendable'],['deplorable']);
q(2,2,'These exercises will counteract the effects of stress and tension.',['exacerbate','foil','thwart','contravene'],['counteract']);
q(3,2,'You have to persevere with difficult students.',['give up','persist','carry on','stand firm'],['persevere']);
q(4,2,'Their new colour scheme is hideous.',['appalling','beautiful','grotesque','macabre'],['hideous']);
q(5,2,'Everywhere they go, they squander their earnings.',['fritter away','splurge','squabble','manage'],['squander']);
const clozeOptions=[['passionately','continually','deadly','thoughtfully'],['these','those','this','that'],['practical','geological','human','animal'],['assimilation','absolution','collection','accumulation'],['an','a','the','no article'],['raise','hike','rise','balance'],['crust.','core','mantle','planet'],['for','of','in','to'],['are developed.','are initiated','have developed','have initiated'],['with','at','in','on']];
for(let n=6;n<=15;n++)q(n,3,`(${n})`,clozeOptions[n-6]);
q(16,4,'He paused',['with a few moments.','for a few moments.','by a few moments.','into a few moments.']);
q(17,4,'Late at night, our car',['broke down on the highway.','broke up on the highway.','broke into the highway.','broke out on the highway.']);
q(18,4,'All the countries signed the treaty',['beneath Germany and France.','except Germany and France.','among Germany and France.','during Germany and France.']);
q(19,4,'I reminded her',['to turn off the lights at night.','to call off the lights at night.','to drop off the lights at night.','to break off the lights at night.']);
q(20,4,'They told us about the woman',['whom lived next door.','which lived next door.','who lived next door.','whose lived next door.']);
q(21,4,'I’ll see you',['at the end of February.','on the end of February.','along the end of February.','for the end of February.']);
q(22,4,'I dislike films',['who have sad endings.','that have sad endings.','whose have sad endings.','whom have sad endings.']);
q(23,4,'The thieves denied',['having stealing the money.','stealing the money.','had stolen the money.','having to steal the money.']);
q(24,4,'Did you',['drop out to see Sunita on your way home ?','drop in to see Sunita on your way home ?','drop behind to see Sunita on your way home ?','drop away to see Sunita on your way home ?']);
q(25,4,'Would you like to',['meeting her ?','meet her ?','met her ?','meet with her ?']);
q(26,5,'Be bad news',['feelings of hate','someone who behaves in a dishonest way','someone who is considered undesirable','to be ill']);
q(27,5,'Back to the drawing board',['to draw comparisons','to be a member of planning group','to start planning again because the previous plan has failed','to be fast at understanding a situation']);
q(28,5,'Be in the eye of the storm',['to look at something quickly','to fail miserably at a sport','to see something that you do not want to see','to be in the midst of a controversy']);
q(29,5,'Life in the fast lane',['to lead a selfless life','to have a happy life without complaints','life without money or comforts','an exciting and eventful lifestyle']);
q(30,5,'To pass the buck',['to collect money from a group of people','to shift the responsibility of something to someone','to have a short conversation with someone','to have the credentials for a particular job']);
q(31,6,['P : include basic freedoms','Q : the fundamental rights are','R : guaranteed to the individual','S : basic rights and'],['QSPR','QRSP','SQRP','RQSP']);
q(32,6,['P : for many millennia','Q : been in the making','R : of a historical process that has','S : the Indian nation is the product'],['SRQP','SQPR','PRSQ','RSQP']);
q(33,6,['P : an epoch that was imbued','Q : for its people the start of','R : with a new vision','S : India’s Independence represented'],['SQPR','QRPS','SPQR','RQSP']);
q(34,6,['P : science and mathematics exhibition','Q : for a discussion on the forthcoming','R : to be present before the Principal','S : all students have been instructed'],['SQPR','RPQS','SRQP','QPRS']);
q(35,6,['P : two bowlers and two batsmen respectively','Q : to the new team','R : with the selection of another player','S : the team now has'],['QPRS','SQRP','RQSP','RPSQ']);
q(36,7,'You are most welcome to visit my humble abode.',['Noun','Adjective','Adverb','Participle'],['abode']);
q(37,7,'The situation is beyond our control.',['Adjective','Adverb','Conjunction','Preposition'],['beyond']);
q(38,7,'I didn’t tell him anything except that I needed the money.',['Adjective','Adverb','Preposition','Conjunction'],['except']);
q(39,7,'He dry-cleaned my coat nicely.',['Adjective','Adverb','Relative pronoun','Conjunction'],['nicely']);
q(40,7,'Would you like to buy this new item ?',['Determiner','Conjunction','Interjection','Adjective'],['this']);
q(41,8,'Which one of the following does not belong to the biotic community ?',['Water','Human','Protozoa','Bush']);
q(42,8,['The nature of the biotic community largely depends on :','1. Biotic components','2. Abiotic components','Select the correct answer using the code given below :'],['1 only','2 only','Both 1 and 2','Neither 1 nor 2']);
q(43,8,'Which of the following is not an abiotic factor ?',['Temperature','Humidity','Algae','Moisture']);
q(44,8,'In the passage, the word ‘aquatic community’ refers to :',['Biotic community inhabiting the land','Biotic community found in water','Biotic community found in the air','Assemblage of rain and moisture']);
q(45,8,'Species are defined on the basis of :',['Similarities only','Differences only','Both similarities and differences','None of the above']);
q(46,9,'The king’s son was banished due to the political rivalry.',['deported','called back','accepted','notified'],['banished']);
q(47,9,'He gave a dazzling performance at the opera.',['brilliant','dismal','pathetic','puerile'],['dazzling']);
q(48,9,'She rebuffed all suggestions from her friends.',['took','rejected','criticized','granted'],['rebuffed']);
q(49,9,'He disowned his royal legacy and became a commoner.',['accepted','abandoned','allowed','questioned'],['disowned']);
q(50,9,'The public was sceptical about the new government policy.',['hopeful','anxious','doubtful','expectant'],['sceptical']);
export const english=rows;
export const directions=[
 {from:1,to:5,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four words or groups of words. Select the option that is opposite in meaning to the underlined word and mark your response on the Answer Sheet accordingly.'},
 {from:6,to:15,text:'Directions : In this section, there is a passage having some blank spaces, each blank space is followed by four individual words or group of words. Select a word or group of words you consider the most appropriate for filling the blank space, and indicate your response on the Answer Sheet accordingly.'},
 {from:16,to:25,text:'Directions : Each of the following items features one part of a sentence, followed by four alternatives. Complete the sentence by choosing the correct alternative and mark your response on the Answer Sheet accordingly.'},
 {from:26,to:30,text:'Directions : Given below are some idioms/phrases followed by four alternative meanings to each. Select the most appropriate response from the options (a), (b), (c) or (d), and mark your response on the Answer Sheet accordingly.'},
 {from:31,to:35,text:'Directions : Each of the following items in this section consists of a sentence, the parts of which have been jumbled as P, Q, R and S. Rearrange the jumbled parts of the sentences into sequence and select the correct sequence as (a), (b), (c), and (d) given below and mark your response on the Answer Sheet accordingly.'},
 {from:36,to:40,text:'Directions : Each of the following sentences has an underlined word. Read the sentence carefully and find which word class the underlined word belongs to. Indicate your response on the Answer Sheet accordingly.'},
 {from:41,to:45,text:'Directions Read the following passage carefully and answer the items based on it. You are required to select your answers based solely on the contents of the passage and the opinion of the author.'},
 {from:46,to:50,text:'Directions : Each of the following items consists of a sentence with an underlined word followed by four words/group of words. Select the option that is nearest in meaning to the underlined word and mark your response on the Answer Sheet accordingly.'}
];
export const clozePassage='The Earth’s climate is _____ (6) changing and evolving. Some of _____ (7) changes have been due to natural causes but others can be attributed to _____ (8) activities such as deforestation, emissions from industry and transport, etc., which have led to the _____ (9) of gases and aerosols in _____ (10) atmosphere. These gases are known as greenhouse gases because they trap heat and _____ (11) air temperatures near the ground, acting like a greenhouse on the surface of the _____ (12). In order to create and strengthen the scientific and analytical capacity _____ (13) assessment of climate change in the country, different studies under Climate Change Action Programme _____ (14). Many important bilateral and multilateral meetings and negotiations are held _____ (15) regular intervals';
export const readingPassage=[
 'The grouping or assemblage of plants, animals and microbes we observe when we study a natural forest, a grassland, a pond, a coral reef or some other undisturbed area, is referred to as the area’s biota or biotic community. The plant portion of the biotic community includes all vegetation, from large trees down through to microscopic algae. Likewise, the animal portion includes everything from large mammals, birds, reptiles and amphibians through to earthworms, tiny insects and mites. Microbes encompass a large array of microscopic bacteria, fungi and protozoans. Thus, the biotic community comprises a plant community, an animal community and a microbial community.',
 'The particular kind of biotic community found in a given area is, in large part, determined by abiotic factors such as the amount of water or moisture present, the temperature, the salinity, or the type of soil in the area. These abiotic factors both support and limit the particular community. For example, a relative lack of available moisture prevents the growth of most species of plants, but supports certain species, such as cacti; these kinds of areas are deserts. Land with plenty of available moisture and a suitable temperature supports forests. The presence of water is the major factor that sustains aquatic communities.',
 'The first step in investigating a biotic community may be simply to catalogue all the species present. Species are the different kinds of plants, animals and microbes in the community. A given species includes all those individuals which have a strong similarity in appearance to one another and which are distinct in appearance from other such groups. Each species in a biotic community is represented by a certain population — that is, by a certain number of individuals that make up the interbreeding, reproducing group.'
];
