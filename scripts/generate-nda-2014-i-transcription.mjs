import fs from 'node:fs';

const input='tmp/pdfs/nda-2014-i/source-mapping.json';
const output='scripts/nda-2014-i-transcription.mjs';
const rows=JSON.parse(fs.readFileSync(input,'utf8')).sort((a,b)=>a.sourceNumber-b.sourceNumber);
if(rows.length!==150||rows.some((row,index)=>row.sourceNumber!==index+1))throw Error('Incomplete source mapping');

const errorFragments={
  1:['The pile of books','are','missing.'],2:['Either he','or I','are wrong.'],3:['Please','tell to him','to do his work.'],
  4:['Though he is good','he is','mischievous.'],5:['The thief','hit me','suddenly and hardly.'],6:['The number of books','in our library','is less.'],
  7:['The general said,','“Soldiers, do not fire','till I will give the order.”'],8:['Neither of the candidates','are','good.'],
  9:['This machine','is more efficient','than any other equipments in the workshop.'],10:['The tin deposits in that area','would probably be exhausted','in to near future.'],
  11:['The operation of this machine','is different','to that of the other.']
};
const underlined={
  12:['when did I go'],13:['Even'],14:['to arbitrate with'],15:['among'],16:['is resembling'],17:['closing'],18:['can be'],
  19:['could have been saved'],20:['is living'],21:['is knowing'],22:['put off'],23:['will come with me']
};
const repairs={
  82:{promptLines:['The number of valence electrons in the O²⁻ ion is']},
  84:{promptLines:['Two conducting wires A and B are made of the same material. If the length of A is twice that of B and the radius of the circular cross-section of A is twice that of B, then their resistances Rₐ and Rᵦ are in the ratio']},
  89:{promptLines:['The number of aluminium ions present in 54 g of aluminium (atomic weight 27) is'],options:{A:'2',B:'18',C:'1.1 × 10²⁴',D:'1.2 × 10²⁴'}},
  100:{figure:true},104:{figure:true},
  113:{promptLines:['If the speed of light in air is 3 × 10⁸ m/s, the speed of light in glass (with refractive index 1.5) would be']},
  123:{promptLines:['A sound wave has a frequency of 2 kHz and a wavelength of 35 cm. If an observer is 1.4 km away from the source, after what time interval could the observer hear the sound?']},
  140:{options:{A:'10³',B:'10⁶',C:'10⁹',D:'10¹²'}}
};
const pageFor=number=>number<=50?Math.max(2,Math.ceil(number/5)+1):12+2*Math.floor((number-51)/6);
const questions=rows.map(row=>{
  const fragments=errorFragments[row.sourceNumber];
  return {
    number:row.sourceNumber,
    promptLines:repairs[row.sourceNumber]?.promptLines??row.promptLines,
    options:fragments?{A:fragments[0],B:fragments[1],C:fragments[2],D:'No error'}:(repairs[row.sourceNumber]?.options??row.options),
    page:row.mappingPage??pageFor(row.sourceNumber),
    secondaryUrl:row.href,
    hasImage:Boolean(repairs[row.sourceNumber]?.figure),
    figure:Boolean(repairs[row.sourceNumber]?.figure),
    underlined:fragments?fragments:(underlined[row.sourceNumber]??[]),
    secondaryAnswer:row.answer,
    secondaryExplanation:row.explanation
  };
});
const directions=[
  {from:32,to:34,text:'Passage I\nIn a free country, the man who reaches the position of leader is usually one of outstanding character and ability. Moreover, it is usually possible to foresee that he will reach such a position, since early in life one can see his qualities of character. But this is not always true in the case of a dictator; often he reaches his position of power through chance, very often through the unhappy state of his country. It is possible that Hitler would never have become the leader of Germany if that country had not been driven to despair.'},
  {from:35,to:38,text:'Passage II\nThe dog is a very intelligent animal and it can be trained for many duties. Some dogs work with the police and the army as sentries and trackers, and there are medals that are awarded to dogs for bravery in action. Other dogs act as seeing-eyes for the blind, and some breeds are specially trained for rescue work among mountains and snow. Jobs like herding sheep and cattle and guarding homes are also done by them. Whenever man lives and works in the Arctic Circle, in the desert, in the jungle, in the moors or mountains, the dog is his faithful companion and help. A common mongrel may possess these qualities just as much as the aristocratic bloodhound.'},
  {from:39,to:50,text:'Selecting Words\nDrobny defied the critics. He had played through the Wimbledon fortnight and reached the final. Could he win just one more match and take the crown, or would he fail again at the last test and justify those who said that he lacked that little extra something that makes the champion? His opponent was the Australian Ken Rosewall, [39] brilliant youngster and already a master [40] worldwide experience behind him. Jaroslav Drobny, [41] son of a Czech carpenter who [42] started the boy off at the [43] age of five with a wooden “bat” in lieu [44] a racquet, went on [45] the famous Centre Court at Wimbledon [46] day with the full knowledge that this [47] be the game of his [48]. He had kept on trying, and [49] could keep on trying, but [50] would become fewer and fewer. He knew that he had to gain an advantage from the start, and he had this young rival set off against him.'}
];
fs.writeFileSync(output,`export const directions = ${JSON.stringify(directions,null,2)};\n\nexport const reviewedUnderlined = ${JSON.stringify(underlined,null,2)};\n\nexport const questions = ${JSON.stringify(questions,null,2)};\n`);
console.log(`Wrote ${questions.length} reviewed source rows to ${output}.`);
