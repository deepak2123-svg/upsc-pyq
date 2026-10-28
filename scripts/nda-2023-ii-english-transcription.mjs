// First visual transcription; source and classification second passes remain required.
const rows=[];
const q=(number,page,prompt,options,underlined=[])=>rows.push({number,page,promptLines:Array.isArray(prompt)?prompt:[prompt],options:Object.fromEntries(options.map((v,i)=>['ABCD'[i],v])),underlined});
q(1,2,'As the Southwest monsoon _____ through most of July, flash floods caused by the waters of the Narmada hit Jabalpur town.',['lashed','flourished','occupied','dried']);
q(2,2,'Given the scale of the challenges that _____ us today, our company proposes more viable plans for sustainability.',['supports','conflict','confronts','convince']);
q(3,2,'It is a really tough course, I am just worried that I won’t be able to go the _____.',['way','distance','far','route']);
q(4,2,'The _____ of the advancement made in agricultural productivity in India has been remarkable.',['extent','context','distance','syntax']);
q(5,2,'This essay _____ and examines various systems for water appropriation and agricultural practices adapted by society in the arid conditions of Rajasthan.',['confuses','enhances','controls','explores']);
q(6,2,'India has been able to successfully _____ its population through family planning programmes.',['sterilise','stabilise','stratify','establish']);
q(7,2,'Adolescence is the _____ wherein a child enters adulthood.',['threshold','position','condition','period']);
q(8,2,'The British who ruled India for 200 years were here to _____ India’s natural resources.',['spoil','implore','exploit','drill']);
q(9,3,'Endangered species have a fifty per cent or greater probability of _____ within five years or two generations whichever is longer.',['distinction','extinction','complication','completion']);
q(10,3,'The first law of thermodynamics states that whereas energy can be _____ from one form into another, it cannot be created or destroyed.',['reduced','induced','performed','transformed']);
// Printed underlined segments and labels retain their source relationships.
const errorSegments=[
 ['Bread, butter and','jam common breakfast items','that are consumed by many households.'],
 ['Ten thousand dollars is','the prize money being offered','by the game show hosts.'],
 ['Three hundred and sixty five','create up the number of days','in a calendar year.'],
 ['The process of removing','wool from the body of','an animal is called sharing.'],
 ['Many people came','from faraway places to prayed','at the temple on the auspicious day.'],
 ['After reading foreword of','the book on environmental issues in India,','I decided to meet its author.'],
 ['The guidance from the mentors','and teachers facilitated the','smooth conduct of elections to the Students’ council.'],
 ['The Principal of our school','felicitated the students in','the prize distribution ceremony.'],
 ['If you were to','come to Chennai to settle down','it will be the best possible decision.'],
 ['They had promised to delivered','the bags before mid-March','to enable us to inaugurate the shop.']
];
errorSegments.forEach((segments,i)=>q(i+11,i<5?3:4,segments.map((s,j)=>`${'ABC'[j]}. ${s}`),[...segments,'No error'],segments));
q(21,4,'He is always captious.',['worried','passionate','faultfinding','jovial'],['captious']);
q(22,4,'Geomorphologists ascertain several wonderful facts about our earth.',['verify','invert','increase','omit'],['ascertain']);
q(23,5,'The Colonel ordered the Soldiers to meet him in the commissary.',['office','field','playground','canteen'],['commissary']);
q(24,5,'The doctor dismembered the patient’s finger first and then cured the ailment.',['stitched','dissected','plastered','splintered'],['dismembered']);
q(25,5,'Mr. Kumar works as a bursar in the sports academy.',['secretary','accountant','coach','trainer'],['bursar']);
q(26,5,'His intentions are insidious.',['pious','inadvertent','deceitful','naive'],['insidious']);
q(27,5,'Respect for other human beings is intrinsic to the teachings of all religions.',['inconsistent','peripheral','inherent','existential'],['intrinsic']);
q(28,5,'He completed the onerous task with relative ease.',['smooth','complex','risky','wearying'],['onerous']);
q(29,5,'Alfred was a potentate during the Middle Ages.',['Monarch','lenient','liberal','democrat'],['potentate']);
q(30,5,'I abandoned the task due to indolence.',['difficulty','laziness','ugliness','helplessness'],['indolence']);
q(31,5,'‘Principal’ and ‘Principle’',[
 '‘Principal’ means belief system, and ‘principle’ means head of an educational institution',
 '‘Principal’ means head of an educational institution, and ‘principle’ means original sum on which interest is charged',
 '‘Principle’ means moral rule, and ‘principal’ means head of an educational institution.',
 '‘Principal’ means original sum on which interest is charged, and ‘principle’ means head of an educational institution.'
]);
q(32,6,'‘Plane’ and ‘Plain’',[
 '‘Plane’ means a flat surface, and ‘plain’ means something that flies.',
 '‘Plane’ means the flat surface, and ‘plain’ means not elaborate.',
 '‘Plane’ means something that flies, and ‘plain’ means flat surface.',
 '‘Plane’ means not elaborate, and ‘plain’ means flat surface.'
]);
q(33,6,'‘Pail’ and ‘Pale’',[
 '‘Pale’ means inferior or unimpressive, and ‘pail’ means faded.',
 '‘Pale’ means faded or light in shade, and ‘pail’ means inferior or unimpressive.',
 '‘Pale’ means faded or light in shade, and ‘pail’ means a bucket.',
 '‘Pale’ means a bucket, and ‘pail’ means inferior or unimpressive.'
]);
q(34,6,'‘Metal’ and ‘Mettle’',[
 '‘Metal’ is a hard shiny material that is a good conductor, and ‘mettle’ means malleable metal.',
 '‘Metal’ is a hard shiny material that is a good conductor, and ‘mettle’ means metallic substance.',
 '‘Metal’ means mental resilience, and ‘mettle’ is a hard shiny material that is a good conductor.',
 '‘Metal’ is a hard shiny material that is a good conductor, and ‘mettle’ means mental resilience.'
]);
q(35,6,'‘Hail’ and ‘Hale’',[
 '‘Hail’ means pellets of frozen rain, and ‘hale’ means wind storm',
 '‘Hail’ means pellets of frozen rain, and ‘hale’ means strong and healthy',
 '‘Hail’ means pellets of frozen rain, and ‘hale’ means to greet with enthusiastic approval',
 '‘Hail’ means strong and healthy, and ‘hale’ means pellets of frozen rain'
]);
q(36,6,'‘Conscious’ and ‘Conscience’',[
 '‘Conscious’ means sense of right and wrong, and ‘conscience’ means awareness about something',
 '‘Conscious’ means alert, and ‘conscience’ means presence of mind',
 '‘Conscious’ means intent, and ‘conscience’ means unprincipled action',
 '‘Conscious’ means aware, and ‘conscience’ means sense of right and wrong'
]);
q(37,7,'‘Dissent’ and ‘Descent’',[
 '‘Dissent’ means having ideas different from general beliefs or official position, and ‘descent’ means movement towards a lower place',
 '‘Dissent’ means having ideas different from general beliefs or official position, and ‘descent’ means being of acceptable standard',
 '‘Dissent’ means being of acceptable standard, and ‘descent’ means movement towards a lower place',
 '‘Dissent’ means being of acceptable standard, and ‘descent’ means ideas different from general beliefs or official position'
]);
q(38,7,'‘Devise’ and ‘Device’',[
 '‘Device’ means to determine, and ‘devise’ means a piece of equipment meant for accomplishing a specific task.',
 '‘Device’ means finding a new way to do something, and ‘devise’ means to determine',
 '‘Device’ means a piece of equipment meant for accomplishing a specific task, and ‘devise’ means finding a new way to do something',
 '‘Device’ means finding a new way to do something, and ‘devise’ means a piece of equipment meant for accomplishing a specific task.'
]);
q(39,7,'‘Discrete’ and ‘Discreet’',[
 '‘Discrete’ means separate and distinct categories of objects, and ‘discreet’ means misuse of authority',
 '‘Discrete’ means separate and distinct categories of objects, and ‘discreet’ means maintaining confidentiality',
 '‘Discrete’ means being careful in what one says or does, and ‘discreet’ means separate and distinct categories of objects',
 '‘Discrete’ means misuse of authority, and ‘discreet’ means being careful in what one says or does'
]);
q(40,7,'‘Eminent’ and ‘Imminent’',[
 '‘Eminent’ means important and famous, and ‘imminent’ means something about to happen',
 '‘Eminent’ means something unpleasant about to happen, and ‘imminent’ means important and famous person',
 '‘Eminent’ means important and famous person, and ‘imminent’ means inherent or existing within',
 '‘Eminent’ means inherent or existing within, and ‘imminent’ means something about to happen'
]);
q(41,8,'Many metals are malleable in nature and property.',['hard','strong','tender','weak'],['malleable']);
q(42,8,'To neglect a warning is to invite danger.',['disregard','ignore','regard','overlook'],['neglect']);
q(43,8,'His ostentatious behaviour surprised everyone.',['tawdry','modest','gaudy','apparent'],['ostentatious']);
q(44,8,'The experience of Covid Pandemic was excruciating for much of the population.',['gnawing','gruelling','harrowing','mild'],['excruciating']);
q(45,8,'A trip to the hills was refreshing.',['conniving','wearying','revivifying','rejuvenating'],['refreshing']);
q(46,9,['Why, according to the writer can’t people be motivated to use a resource prudently ?','1. They feel that others may overuse the resource','2. It is possible to substitute the resource','3. Abundance of the resource availability','Select the correct answer using the code given below:'],['1 only','2 only','2 and 3 only','1, 2 and 3']);
q(47,9,'When do people use resources exhaustively ?',['When the substitution of resource is felicitated by NGOs','When the resource is about to expand','When the resources use has little impact','When they desire desperately for sustainable development']);
q(48,9,'The self-interest of people affects the use of renewable resources',['positively','erratically','affirmatively','indifferently']);
q(49,9,'People rooted in a locality',['cause harm to available resources','generate resources','believe in conservation and reproduction of resources','consume resources freely']);
q(50,9,'Which among the following is closest in meaning with the word ‘deplete’ ?',['exhaust','complete','replete','desperate']);
export const english=rows;
export const directions=[
 {from:1,to:10,text:'Directions : In this section, each of the following sentences has a blank space and is followed by four words. Select the word you consider most appropriate to fill in the blank space and indicate your response on the Answer Sheet accordingly.'},
 {from:11,to:20,text:'Directions : Each item in this section has a sentence with three underlined parts labelled (a), (b) and (c). Read each sentence to find out whether there is any error in any underlined part and indicate your response in the Answer Sheet against the corresponding letter, i.e., (a) or (b) or (c). If you find no error, your response should be indicated as (d).'},
 {from:21,to:30,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four words. Select the option that is nearest in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
 {from:31,to:40,text:'Directions : In the following questions a pair of similar sounding words is provided. You are required to select the options that most appropriately describes the meaning of both the words and mark your response in the Answer Sheet accordingly.'},
 {from:41,to:45,text:'Directions : Each item in this section consists of a sentence with an underlined word followed by four words. Select the option that is opposite in meaning to the underlined word and mark your response in your Answer Sheet accordingly.'},
 {from:46,to:50,text:'Directions : Carefully read the given passage and answer the questions that follow. You are required to select your answers solely based on the contents of the passage and the opinion of the author only.'}
];
export const readingPassage='People by and large are concerned with and pursue self-interest. They are unlikely to be motivated to use renewable resources in a prudent and sustainable fashion. They are unlikely to be motivated under the following conditions : if their resource catchments are vast, so that degradation of any particular portion affects them very little; or if they have open before them possibilities of any substitution as any one resource element is depleted; or if their control over the resource base is tenuous, so that others may, at any time, deplete a resource they value, even if they use it in a restrained fashion. Indeed, exhaustive use is highly likely when any one of these three conditions obtains. It is only when people perceive their resource catchments as limited, possibilities of substitution of exhausted resource elements as not readily feasible, and their own control over the resource base as secure, will they be motivated to use the resources in a prudent fashion. People, rooted in a locality, and retaining control over their resource base are most likely to fulfil all three prerequisites for sustainable resource use; and therefore to behave in ways conducive to the conservation of biodiversity within their localities.';
