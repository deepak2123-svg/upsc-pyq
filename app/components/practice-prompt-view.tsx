import type { PracticePromptBlock } from "../../lib/practice-prompt";
import {MathText} from './math-text';

function PromptText({value,underlined=[]}:{value:string;underlined?:string[]}){
  const words=underlined.filter(Boolean).toSorted((a,b)=>b.length-a.length);
  if(!words.length)return <MathText value={value}/>;
  const expression=new RegExp(`(${words.map(word=>word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')})`,'g');
  return <>{value.split(expression).map((part,index)=>words.includes(part)?<u key={index}><MathText value={part}/></u>:<MathText key={index} value={part}/>)}</>;
}

export function PracticePromptView({ blocks, className, figure,underlined }: { blocks: PracticePromptBlock[]; className: string; figure?: { src: string; alt: string };underlined?:string[] }) {
  return <div className={className} tabIndex={-1}>
    {blocks.map((block, index) => {
      if (block.kind === "statement") return <p className="paper-statement" key={index}><b>{block.marker}</b><span><PromptText value={block.text} underlined={underlined}/></span></p>;
      if (block.kind === "text") return <p key={index}><PromptText value={block.text} underlined={underlined}/></p>;
      if (block.kind === "pair-table") return <div className="matching-list-scroll" key={index}>
        <table className="matching-list-table paired-row-table">
          <caption>Pairs to assess</caption>
          <thead><tr><th scope="col">{block.leftTitle}</th><th scope="col">{block.rightTitle}</th></tr></thead>
          <tbody>{block.rows.map(row => <tr key={row.marker}>
            <td><b>{row.marker}</b><span>{row.left}</span></td><td>{row.right}</td>
          </tr>)}</tbody>
        </table>
      </div>;
      const rowCount = Math.max(block.left.items.length, block.right.items.length);
      return <div className="matching-list-scroll" key={index}>
        <table className="matching-list-table">
          <caption>Items to match between List I and List II</caption>
          <thead><tr>
            <th scope="col"><small>List I</small><strong>{block.left.title}</strong></th>
            <th scope="col"><small>List II</small><strong>{block.right.title}</strong></th>
          </tr></thead>
          <tbody>{Array.from({ length: rowCount }, (_, rowIndex) => {
            const left = block.left.items[rowIndex];
            const right = block.right.items[rowIndex];
            return <tr key={rowIndex}>
              <td>{left ? <><b>{left.label}.</b><span>{left.text}</span></> : null}</td>
              <td>{right ? <><b>{right.label}.</b><span>{right.text}</span></> : null}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>;
    })}
    {figure ? <figure className="question-figure"><img src={figure.src} alt={figure.alt} /><figcaption>Figure supplied with the original question</figcaption></figure> : null}
  </div>;
}
