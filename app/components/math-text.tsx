import katex from "katex";
import {normalizeMathDelimiters} from '../../lib/math-text-normalizer';

const accentToken = /([A-Za-z](?:\u20d7|\u0302)|[îĵ])/gu;
const latexToken = /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
const latexHtml = new Map<string,string>();

function parts(token:string) {
  if(token==='î')return {base:'i',accent:'^',label:'i hat'};
  if(token==='ĵ')return {base:'j',accent:'^',label:'j hat'};
  const base=token[0],vector=token.endsWith('\u20d7');
  return {base,accent:vector?'→':'^',label:vector?`vector ${base}`:`${base} hat`};
}

function UnicodeMathText({value}:{value:string}) {
  return <>{value.split(accentToken).map((token,index)=>{
    if(!/^(?:[A-Za-z](?:\u20d7|\u0302)|[îĵ])$/u.test(token))return token;
    const accent=parts(token);
    return <span className="math-accent" aria-label={accent.label} key={index}><math aria-hidden="true"><mover accent="true"><mi>{accent.base}</mi><mo>{accent.accent}</mo></mover></math><span className="visually-hidden" aria-hidden="true">{token}</span></span>;
  })}</>;
}

function LatexMath({value}:{value:string}) {
  const displayMode=value.startsWith('\\[');
  const expression=value.slice(2,-2);
  const cacheKey=`${displayMode?'display':'inline'}:${expression}`;
  let html=latexHtml.get(cacheKey);
  if(!html){
    html=katex.renderToString(expression,{displayMode,throwOnError:false,strict:false,output:'htmlAndMathml'});
    latexHtml.set(cacheKey,html);
  }
  return <span className={displayMode?'math-latex math-latex-display':'math-latex'} dangerouslySetInnerHTML={{__html:html}}/>;
}

/** Render delimited LaTeX plus imported Unicode accents without changing source text. */
export function MathText({value}:{value:string}) {
  return <>{normalizeMathDelimiters(value).split(latexToken).map((token,index)=>
    /^(?:\\\([\s\S]*\\\)|\\\[[\s\S]*\\\])$/.test(token)
      ? <LatexMath value={token} key={index}/>
      : <UnicodeMathText value={token} key={index}/>
  )}</>;
}
