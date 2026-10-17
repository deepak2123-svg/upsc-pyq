import type { PracticePromptBlock } from "../../lib/practice-prompt";

export function PracticePromptView({ blocks, className, figure }: { blocks: PracticePromptBlock[]; className: string; figure?: { src: string; alt: string } }) {
  return <div className={className} tabIndex={-1}>
    {blocks.map((block, index) => {
      if (block.kind === "statement") return <p className="paper-statement" key={index}><b>{block.marker}</b><span>{block.text}</span></p>;
      if (block.kind === "text") return <p key={index}>{block.text}</p>;
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
