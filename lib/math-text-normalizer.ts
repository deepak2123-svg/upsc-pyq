const delimitedLatex = /(\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/g;
const rawScript = /(?:\([^()\n]+\)|\{[^{}\n]+\}|\|[^|\n]+\||[A-Za-z0-9πθαβγΔωΣ∫∞√]+)(?:\^\{[^{}\n]+\}|_\{[^{}\n]+\})+/gu;

/** Add inline-math delimiters around imported TeX scripts without altering existing math spans. */
export function normalizeMathDelimiters(value:string) {
  return value.split(delimitedLatex).map(token=>
    /^(?:\\\([\s\S]*\\\)|\\\[[\s\S]*\\\])$/.test(token)
      ? token
      : token.replace(rawScript,expression=>`\\(${expression}\\)`)
  ).join('');
}
