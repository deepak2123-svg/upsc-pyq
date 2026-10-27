// Source transcription checkpoint. This file alone approves no answer/publication.
export const directions=[
 {from:1,to:5,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four words or group of words. Select the option that is opposite in meaning to the underlined word and mark your response on the answer sheet accordingly.'},
 {from:6,to:15,text:'Directions : In this section, there is a passage that has some blank spaces, each with four words or group of words. Select whichever word or group of words you consider the most appropriate for the blank space and indicate your response on the Answer Sheet accordingly.'},
 {from:16,to:25,text:'Directions : Each of the following items features one part of a sentence followed by four alternatives. Complete the sentence by choosing the correct alternative.'},
 {from:26,to:30,text:'Directions : Given below are some idioms/phrases followed by four alternative meanings to each. Select the response (a), (b), (c) or (d), which is the most appropriate meaning and mark your response on the Answer Sheet accordingly.'},
 {from:31,to:35,text:'Directions : Each of the following items in this section consists of a sentence, the parts of which have been jumbled. These parts have been labelled P, Q, R and S. Given below each sentence have four sequences, namely (a), (b), (c) and (d). You are required to rearrange the jumbled parts of the sentences and mark your response accordingly.'},
 {from:36,to:40,text:'Directions : Each of the following sentences has word(s) underlined. Read the sentence carefully and find which word class the underlined word(s) belong(s) to. Indicate your response on the Answer Sheet accordingly.'},
 {from:41,to:45,text:'Directions : In this section, you have a short passage. After the passage, you will find some items based on the passage. Read the passage carefully and answer the items based on it. You are required to select your answers based on the contents of the passage and the opinion of author only.'},
 {from:46,to:50,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four words. Select the option that is nearest in meaning to the underlined word and mark your response on the Answer Sheet accordingly.'}
];
export const readingPassage='We live in a time when globalisation is rapidly encompassing travel, information, trade and investment. The internet ties people together in ways unimagined a few years ago. The globalisation of health, however, remains an elusive goal, similar to the globalisation of economic well-being. Laurie Garrett, in The Coming Plague, describes an unwelcome form of globalisation: the globalisation of disease. Garrett examines the recent history of emerging diseases such as AIDS, Ebola, Hantavirus, Rift Valley Fever, Legionnaires’ disease, and others. She also explains the resurgence of familiar diseases like tuberculosis, cholera, and pneumonia as a consequence of the widespread and unwise use of antibiotics. Many of the new diseases are clearly linked to changes in land use, which brings humans into close contacts with rodents or other animals that harbour viruses previously unknown to medicine and often deadly to humans. Resurgent diseases, by contrast, are a creation of our medical practice. By treating people with antibiotics without restraint, we unknowingly select strains that are immune to the antibiotics and that pass on their resistant genes to unrelated bacteria by way of plasmid transfer. The heroes of her book are the women and men on the frontlines of epidemiology. Garrett makes a plea for a greater commitment from our universities, medical schools, and government agencies to train workers who will be capable of recognizing new diseases and who will be able to move about equally well in the laboratory, the hospital and the field in pursuit of knowledge and public-health intervention around the world.';
export const clozePassage='Most of our food comes from agriculture, so we tend to believe that it is _____ (6) of natural biota. This is not true. In nature, _____ (7) plants and animals _____ (8) to the rigours of natural selection. Only the fittest survive. _____ (9) wild populations have numerous traits for competitiveness, resistance to parasites, _____ (10) to adverse conditions, _____ (11) other aspects of vigour. In contrast, populations grown for many _____ (12) under the pampered conditions of agriculture tend to lose these traits, because they _____ (13) for production, not resilience. For example, a high-producing plant _____ (14) lacks resistance to drought is _____ (15) and the resistance to drought is ignored. Also, in the process of breeding plants for maximum production, all genetic variation is eliminated.';
const row=(number,page,text,options,underlined=[])=>({number,page,promptLines:[text],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});
export const english=[
 row(1,2,'All human beings are fallible',['frail','erring','mortal','perfect'],['fallible']),
 row(2,2,'His words were vague',['identical','obscure','precise','imperceptible'],['vague']),
 row(3,2,'She performed all her duties conscientiously',['assiduously','carelessly','painstakingly','scrupulously'],['conscientiously']),
 row(4,2,'These risks are incidental to the work of a firefighter',['essential','adventitious','serendipitous','subsidiary'],['incidental']),
 row(5,2,'She has always been disdainful of poor people',['reverential','derisive','supercilious','insolent'],['disdainful']),
 row(6,2,'Select the most appropriate expression for blank (6).',['independent','dependent','relevant','consequent']),
 row(7,3,'Select the most appropriate expression for blank (7).',['the','both','some','among']),
 row(8,3,'Select the most appropriate expression for blank (8).',['had been continuously subjected','will be continuously subject','continuously subjected','are continuously subjected']),
 row(9,3,'Select the most appropriate expression for blank (9).',['Consequently','Inadvertently','Although','Since']),
 row(10,3,'Select the most appropriate expression for blank (10).',['withdrawal','tolerance','adaptable','compliance']),
 row(11,3,'Select the most appropriate expression for blank (11).',['and','with','by','upon']),
 row(12,3,'Select the most appropriate expression for blank (12).',['eras','epochs','periods','generations']),
 row(13,3,'Select the most appropriate expression for blank (13).',['had selected','have selected','are selected','might select']),
 row(14,3,'Select the most appropriate expression for blank (14).',['whichever','whom','that','whenever']),
 row(15,3,'Select the most appropriate expression for blank (15).',['heated','irrigated','showered','deserted']),
 row(16,4,'Preeti suggests',['that I ask to your advice','that I had asked your advice','that I can have asked your advice','that I ask your advice']),
 row(17,4,'We saw',['the older of all monuments in the city','the old of all monuments in the city','the oldest monument in the city','an oldest of all monuments in the city']),
 row(18,4,'Since you have been touring all day',['you must be tired','you ought to have been tired','you could had been tired','you might not be tired']),
 row(19,4,'His condition is serious, but',['it should be worse','it ought to be worse','it could be worse','it had been going to be worse']),
 row(20,4,'I hope the bus comes soon because',['we waited for half an hour','we have been waiting for half an hour','we waiting for half an hour','we could have been waiting for half an hour']),
 row(21,4,'Someone',['has spilt juice on the sofa','should have spilt juice on the sofa','have spilt juice on the sofa','would spilt juice on the sofa']),
 row(22,4,'What would you do',['if you found your lost toy ?','if you will have found your lost toy ?','if you would found your lost toy ?','if you have find your lost toy ?']),
 row(23,4,'If I were you',['I shouldn’t buy that dress','I wouldn’t buy that dress','I weren’t buying that dress','I mustn’t buying that dress']),
 row(24,4,'I wish',['I could help you','I ought to help you','I did help you','I must help you']),
 row(25,4,'The efforts of the security services have not been quite',['upto the incredibility','up-take','up-tight','upto the mark']),
 row(26,5,'A white lie',['An offensive way of describing something','To do something completely impossible','A lie that is absolutely and universally true','A lie that you tell to avoid hurting someone']),
 row(27,5,'Bad blood',['Feelings of hatred between people','A situation which goes from bad to worse','A fatal accident','To accept the unpleasant situation']),
 row(28,5,'Count your blessings',['to start to understand how badly something has affected you','an event which gradually becomes worse','to be grateful for good things in your life','something that you say in order to warn someone']),
 row(29,5,'Have the last laugh',['to be the worst example of something','to succeed when others thought that you would not','to solve all the problems of life','to laugh at someone secretly']),
 row(30,5,'Sit on the fence',['to make someone suddenly notice you','to fail completely','to delay making a decision','to behave very badly']),
 row(31,5,'P : good quality elementary education conforming\nQ : as a fundamental right of all children\nR : the Right to Education Act (RTE) mandates\nS : to the standards and norms specified in the Act',['Q S P R','R P S Q','R Q S P','S Q P R']),
 row(32,6,'P : the conflicts and disputes in their mind\nQ : music not only relieves the burden\nR : on children and the young\nS : but also alleviates',['Q R S P','P S R Q','Q P R S','P Q R S']),
 row(33,6,'P : but it is virtually covered by a dome-shaped\nQ : Antarctica is a continent\nR : nearly twice as large as Australia\nS : ice sheet nearly 2 miles thick',['Q R P S','S P R Q','Q S P R','S Q R P']),
 row(34,6,'P : the global economic weight from the advanced economies\nQ : that there was a major shift in\nR : and Central Bank Governors, in recognition of the fact\nS : the G20 was formed in 1999, as a forum of Finance Ministers',['S P Q R','P Q R S','Q R S P','S R Q P']),
 row(35,6,'P : aquaculture nation in the world and\nQ : India’s products are exported to many nations\nR : fish producing and the second largest\nS : India is the third largest',['S R P Q','Q P R S','R P Q S','P Q R S']),
 row(36,7,'Adders are the only poisonous snakes found across Britain',['Noun','Adjective','Adverb','Determiner'],['Adders']),
 row(37,7,'She spoke to him once since he has been in town',['Adjective','Adverb','Conjunction','Preposition'],['since']),
 row(38,7,'I don’t really want to go. Besides, it’s too late now',['Adjective','Adverb','Preposition','Conjunction'],['now']),
 row(39,7,'Look at that man over there',['Adverb','Conjunction','Determiner','Article'],['that']),
 row(40,7,'The plane is ready for take-off',['Noun','Conjunction','Verb','Gerund'],['take-off']),
 row(41,8,'What according to the passage is the ‘unwelcome form of the globalization’ ?\n1. Globalization of the diseases\n2. Elusive goal of globalization\n3. History of fatal diseases\n4. Selective use of antibiotics\nSelect the correct answer using the code given below :',['1 only','2, 3 and 4','3 only','1 and 4']),
 row(42,8,'According to the passage, globalisation of health has become imperative due to',['the globalisation of diseases','public health intervention','the creation of new medical systems','the indiscriminate use of antibiotics']),
 row(43,8,'According to the passage, resurgent diseases are affected by :\n1. Medical practices\n2. Overuse of antibiotics\n3. Emergence of new strains\nSelect the correct answer using the code given below :',['1 only','2 only','1 and 3 only','1, 2 and 3']),
 row(44,8,'According to the passage, many new diseases are emerging due to change in land use because',['humans are coming in contact with unfamiliar viruses','urbanisation makes pathogens proliferate','humans become adaptive and pass on their genes to related bacteria by way of plasmid transfer','humans are inadvertently releasing new viruses']),
 row(45,8,'What is the meaning of the word “epidemiology” in the passage ?',['The historical study of the spread of diseases','The scientific study of the spread and control of diseases','The scientific study of the invention and uses of drugs','The scientific study of the uses of drugs']),
 row(46,9,'Sages and seers have cautioned that the path towards enlightenment is full of illusory traps',['reasoned','admitted','warned','refused'],['cautioned']),
 row(47,9,'The officer reported the details of the mission in a monotonous manner',['dull','happy','disturbed','enthusiastic'],['monotonous']),
 row(48,9,'There are many elusive questions in philosophy',['clear','baffling','paramount','truthful'],['elusive']),
 row(49,9,'Cleaning this mess is a mammoth task',['huge','quick','easy','intelligent'],['mammoth']),
 row(50,9,'The police department’s image was tarnished after the high-profile murder case',['enhanced','tainted','restored','assigned'],['tarnished'])
];
// Source underlines on labelled fragments are data, not inferred answers.
for(const question of english){
 if(question.number>=31&&question.number<=35)question.underlined=question.promptLines[0].split('\n').map(line=>line.replace(/^[PQRS] : /,''));
 if(question.number>=6&&question.number<=15){
  question.standaloneCue=question.promptLines[0];
  question.promptLines=[`_____ (${question.number})`];
 }
}
