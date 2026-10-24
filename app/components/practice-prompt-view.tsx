import type { PracticePromptBlock } from "../../lib/practice-prompt";

function PromptText({ value }: { value: string }) {
  // Preserve source text while drawing combining-vector marks independently of
  // the reading font, which may not contain U+20D7 (notably in print output).
  return <>{value.split(/([A-Za-z]\u20d7)/u).map((part,index) => /^[A-Za-z]\u20d7$/u.test(part)
    ? <span className="math-vector" aria-label={`vector ${part[0]}`} key={index}><span aria-hidden="true">{part[0]}</span><span className="visually-hidden" aria-hidden="true">⃗</span></span>
    : part)}</>;
}

export function PracticePromptView({ blocks, className, figure }: { blocks: PracticePromptBlock[]; className: string; figure?: { src: string; alt: string } }) {
  return <div className={className} tabIndex={-1}>
    {blocks.map((block, index) => {
      if (block.kind === "statement") return <p className="paper-statement" key={index}><b>{block.marker}</b><span><PromptText value={block.text} /></span></p>;
      if (block.kind === "text") return <p key={index}><PromptText value={block.text} /></p>;
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
