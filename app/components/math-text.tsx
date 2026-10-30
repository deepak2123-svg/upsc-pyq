const accentToken = /([A-Za-z](?:\u20d7|\u0302)|[îĵ])/gu;

function parts(token:string) {
  if(token==='î')return {base:'i',accent:'^',label:'i hat'};
  if(token==='ĵ')return {base:'j',accent:'^',label:'j hat'};
  const base=token[0],vector=token.endsWith('\u20d7');
  return {base,accent:vector?'→':'^',label:vector?`vector ${base}`:`${base} hat`};
}

/** Render imported Unicode vector and unit-vector accents without changing source text. */
export function MathText({value}:{value:string}) {
  return <>{value.split(accentToken).map((token,index)=>{
    if(!/^(?:[A-Za-z](?:\u20d7|\u0302)|[îĵ])$/u.test(token))return token;
    const accent=parts(token);
    return <span className="math-accent" aria-label={accent.label} key={index}><math aria-hidden="true"><mover accent="true"><mi>{accent.base}</mi><mo>{accent.accent}</mo></mover></math><span className="visually-hidden" aria-hidden="true">{token}</span></span>;
  })}</>;
}
