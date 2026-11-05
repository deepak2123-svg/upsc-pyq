import fs from 'node:fs';

const input='tmp/pdfs/nda-2014-ii/source-mapping.json';
const output='scripts/nda-2014-ii-transcription.mjs';
const rows=JSON.parse(fs.readFileSync(input,'utf8')).sort((a,b)=>a.sourceNumber-b.sourceNumber);
if(rows.length!==150||rows.some((row,index)=>row.sourceNumber!==index+1))throw Error('Incomplete source mapping');

const sourceRepairs={
  61:{promptLines:['Consider the following reaction:','xAs₂S₃ + yO₂ → zAs₂O₃ + wSO₂','What is y (the coefficient for O₂) when this equation is balanced using whole-number coefficients?']},
  65:{promptLines:['How many grams of MgCO₃ contain 24.00 g of oxygen? (The molar mass of MgCO₃ is 84.30 g mol⁻¹)']},
  68:{promptLines:['A force F, acting on an electric charge q in the presence of an electromagnetic field, moves the charge parallel to the magnetic field with velocity v. Then F is equal to (where E and B are the electric and magnetic fields respectively)'],options:{A:'qE',B:'q(v × B)',C:'q(v × E)',D:'qB'}},
  76:{promptLines:['A ray of light travels from a medium of refractive index n₁ to a medium of refractive index n₂. If the angle of incidence is i and the angle of refraction is r, then sin i / sin r is equal to'],options:{A:'n₁',B:'n₂',C:'n₂ / n₁',D:'n₁ / n₂'}},
  92:{promptLines:['A force applied on a body is represented as F = 6î − 8ĵ + 10k̂ and accelerates it at 1 m/s². The mass of the body is'],options:{A:'10 kg',B:'10√2 kg',C:'2√10 kg',D:'8 kg'}},
  99:{promptLines:['A particle is moving in a circular path of radius r at a constant speed v. Which one of the following graphs correctly represents its acceleration a?'],options:{A:'Graph A',B:'Graph B',C:'Graph C',D:'Graph D'},figure:true},
  116:{promptLines:['Two cars A and B have masses mₐ and mᵦ respectively, with mₐ > mᵦ. Both cars move in the same direction with equal kinetic energy. If equal braking force is applied on both, then before coming to rest']},
  118:{promptLines:['A bullet is fired vertically up from a 400 m tall tower with a speed of 80 m/s. If g is taken as 10 m/s², the time taken by the bullet to reach the ground will be']},
  119:{promptLines:['A cyclotron accelerates particles of mass m and charge q. The energy of particles emerging is proportional to'],options:{A:'q² / m',B:'q / m²',C:'q² / m²',D:'q'}},
  120:{options:{A:'4π',B:'infinite',C:'zero',D:'dependent upon the shape of the object'}},
  121:{promptLines:['The densities of three liquids are D, 2D and 3D. What will be the density of the resulting mixture if equal volumes of the three liquids are mixed?'],options:{A:'6D',B:'1.4D',C:'2D',D:'3D'}}
};

const pageFor=number=>number<=50?Math.max(2,Math.ceil(number/7)+1):12+2*Math.floor((number-51)/6);
const questions=rows.map(row=>({
  number:row.sourceNumber,
  promptLines:sourceRepairs[row.sourceNumber]?.promptLines??row.promptLines,
  options:sourceRepairs[row.sourceNumber]?.options??row.options,
  page:pageFor(row.sourceNumber),
  secondaryUrl:row.href,
  hasImage:Boolean(sourceRepairs[row.sourceNumber]?.figure),
  figure:Boolean(sourceRepairs[row.sourceNumber]?.figure),
  secondaryAnswer:row.answer,
  secondaryExplanation:row.explanation
}));
const text=`export const directions = [];\n\nexport const questions = ${JSON.stringify(questions,null,2)};\n`;
fs.writeFileSync(output,text);
console.log(`Wrote ${questions.length} reviewed source rows to ${output}.`);
