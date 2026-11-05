export type PracticePromptBlock =
  | { kind: "text"; text: string }
  | { kind: "statement"; marker: string; text: string }
  | { kind: "error-line"; segments: { marker: string; text: string }[] }
  | { kind: "word-order"; segments: { marker: string; text: string }[] }
  | { kind: "pair-table"; leftTitle: string; rightTitle: string; rows: { marker: string; left: string; right: string }[] }
  | {
    kind: "match-table";
    left: { title: string; items: { label: string; text: string }[] };
    right: { title: string; items: { label: string; text: string }[] };
  };

const numberedMarker = /(?<!\S)(\d{1,2})([.)])\s+/g;
const romanMarker = /(?<!\S)(I|II|III|IV|V|VI|VII|VIII|IX|X)([.)])\s+/gi;
const instructionMarker = /\s+(?=(?:Select|Choose) the (?:correct )?answer\b|Which of the (?:following|statements|above)\b|How many of the (?:above|following)\b)/i;
const leadingArabicMarker = /^\s*(\d{1,2})([.)])\s+(.+)$/;
const leadingRomanMarker = /^\s*(I|II|III|IV|V|VI|VII|VIII|IX|X)([.)])\s+(.+)$/i;
const listOneMarker = /\bList\s*[-–—]?\s*(?:I|1)\s*\(([^)]*)\)/i;
const listTwoMarker = /\bList\s*[-–—]?\s*(?:II|2)\s*\(([^)]*)\)/i;
const letteredItemMarker = /(?<!\S)([A-Z])[.)]\s+/g;
const errorMarker = /^\(([a-z])\)$/i;
const inlineErrorMarker = /\(([a-d])\)/gi;
const inlineWordOrderMarker = /\(([PQRS])\)/g;
const leadingWordOrderMarker = /^([PQRS])\s*:\s*(.+)$/;

function romanValue(value: string) {
  const numerals: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  return numerals[value.toUpperCase()];
}

/**
 * Spot-the-error papers print one continuous sentence with (a), (b), (c)
 * directly below the corresponding underlined fragments. Some transcripts
 * preserve that geometry as alternating text and marker lines. Restore only
 * that explicit sequence; the locked source wording remains untouched.
 */
function errorLineBlock(lines: string[]): PracticePromptBlock | null {
  if (lines.length < 4 || lines.length % 2 !== 0) return null;
  const segments: { marker: string; text: string }[] = [];
  for (let index = 0; index < lines.length; index += 2) {
    const match = lines[index + 1]?.match(errorMarker);
    const expected = String.fromCharCode(97 + index / 2);
    if (!lines[index] || !match || match[1].toLowerCase() !== expected) return null;
    segments.push({ marker: `(${match[1].toLowerCase()})`, text: lines[index] });
  }
  return segments.length >= 2 ? { kind: "error-line", segments } : null;
}

/**
 * Older source transcripts place each spot-the-error marker after the printed
 * fragment on one flattened line: "first fragment (a) second fragment (b)…".
 * Reconstruct the paper geometry for every such record at display time.  The
 * source text remains locked and unchanged, and a terminal "No error (d)" is
 * left to the answer options just as it is in the printed paper.
 */
function inlineErrorLineBlock(lines: string[]): PracticePromptBlock | null {
  if (lines.length !== 1) return null;
  const line = lines[0];
  const matches = [...line.matchAll(inlineErrorMarker)];
  if (matches.length < 3 || matches.length > 4) return null;
  if (!matches.every((match, index) => match[1].toLowerCase() === String.fromCharCode(97 + index))) return null;
  // A marker at the beginning describes a following option; these paper
  // markers instead sit below (and therefore after) their sentence fragment.
  if (!line.slice(0, matches[0].index).trim()) return null;

  let start = 0;
  const segments = matches.map(match => {
    const text = line.slice(start, match.index).trim();
    start = match.index! + match[0].length;
    return { marker: `(${match[1].toLowerCase()})`, text };
  });
  if (line.slice(start).trim() || segments.some(segment => !segment.text)) return null;
  if (segments.at(-1)?.marker === "(d)" && /^no\s+error\.?$/i.test(segments.at(-1)!.text)) segments.pop();
  return segments.length >= 3 ? { kind: "error-line", segments } : null;
}

/** Restore the underlined P/Q/R/S strips used by ordering-of-words items. */
function wordOrderBlocks(lines: string[]): PracticePromptBlock[] | null {
  const labelled=lines.map(line=>line.match(leadingWordOrderMarker));
  const first=labelled.findIndex(match=>match?.[1]==='P');
  if(first>=0&&['P','Q','R','S'].every((label,index)=>labelled[first+index]?.[1]===label)) {
    const segments=labelled.slice(first,first+4).map(match=>({marker:match![1],text:match![2].trim()}));
    return [...lines.slice(0,first).map(text=>({kind:'text' as const,text})),{kind:'word-order' as const,segments},...lines.slice(first+4).map(text=>({kind:'text' as const,text}))];
  }
  if(lines.length!==1)return null;
  const line=lines[0],matches=[...line.matchAll(inlineWordOrderMarker)];
  if(matches.length!==4||!matches.every((match,index)=>match[1]==='PQRS'[index]))return null;
  let start=0;
  const segments=matches.map(match=>{const text=line.slice(start,match.index).trim();start=match.index!+match[0].length;return{marker:match[1],text};});
  if(segments.some(segment=>!segment.text))return null;
  const trailing=line.slice(start).trim();
  return [{kind:'word-order',segments},...(trailing?[{kind:'text' as const,text:trailing.replace(/^[.:;\s]+/,'')}]:[])];
}

/** Convert the limited TeX notation found in legacy imports for display. */
export function formatPracticeText(value: string) {
  // Older imports escaped TeX delimiters twice and were intentionally stored
  // as display-ready Unicode. Preserve that established conversion while
  // leaving correctly delimited TeX intact for the shared KaTeX renderer.
  if (/\\\\(?:\(|\[)/.test(value)) return value
    .replace(/\\{1,2}\(/g, "")
    .replace(/\\{1,2}\)/g, "")
    .replace(/\^\{\\prime\\prime\}/g, "″")
    .replace(/\^\{\\prime\}/g, "′")
    .replace(/\^\{\\circ\}/g, "°")
    .replace(/\\{1,2}vec\s*\{?([A-Za-z])\}?/g, "$1⃗")
    .replace(/\\{1,2}hat\s*\{?([A-Za-z])\}?/g, "$1̂")
    .replace(/\s+([,.;:?!])/g, "$1");
  return value
    .replace(/\s+([,.;:?!])/g, "$1");
}

function orderedMatches(line: string, marker: RegExp, valueOf: (value: string) => number) {
  const candidates = [...line.matchAll(marker)];
  const first = candidates.findIndex((match) => valueOf(match[1]) === 1);
  if (first < 0) return [];
  const matches = [candidates[first]];
  let expected = 2;
  for (let index = first + 1; index < candidates.length; index += 1) {
    if (valueOf(candidates[index][1]) === expected) {
      matches.push(candidates[index]);
      expected += 1;
    }
  }
  return matches.length >= 2 ? matches : [];
}

function splitSequence(line: string, marker: RegExp, valueOf: (value: string) => number) {
  const matches = orderedMatches(line, marker, valueOf);
  if (matches.length < 2) return null;
  const blocks: PracticePromptBlock[] = [];
  const firstIndex = matches[0].index! + (matches[0][0].startsWith(" ") ? 1 : 0);
  const introduction = line.slice(0, firstIndex).trim();
  if (introduction) blocks.push({ kind: "text", text: introduction });

  matches.forEach((match, index) => {
    const markerStart = match.index! + (match[0].startsWith(" ") ? 1 : 0);
    const contentStart = markerStart + match[0].trimStart().length;
    const contentEnd = matches[index + 1]?.index ?? line.length;
    let statement = line.slice(contentStart, contentEnd).trim();
    if (index === matches.length - 1) {
      const instructionAt = statement.search(instructionMarker);
      if (instructionAt >= 0) {
        const instruction = statement.slice(instructionAt).trim();
        statement = statement.slice(0, instructionAt).trim();
        blocks.push({ kind: "statement", marker: `${match[1]}${match[2]}`, text: statement });
        blocks.push({ kind: "text", text: instruction });
        return;
      }
    }
    blocks.push({ kind: "statement", marker: `${match[1]}${match[2]}`, text: statement });
  });
  return blocks;
}

function listItems(value: string, marker: RegExp, expectedLabels: string[]) {
  const matches = [...value.matchAll(marker)];
  if (matches.length < 2 || !matches.every((match, index) => match[1].toUpperCase() === expectedLabels[index])) return null;
  return matches.map((match, index) => {
    const markerStart = match.index! + (match[0].startsWith(" ") ? 1 : 0);
    const contentStart = markerStart + match[0].trimStart().length;
    const contentEnd = matches[index + 1]?.index ?? value.length;
    return { label: match[1].toUpperCase(), text: value.slice(contentStart, contentEnd).trim() };
  });
}

/** Recognise imported match-the-list stems without changing their stored wording. */
function matchingListBlocks(lines: string[]): PracticePromptBlock[] | null {
  const value = lines.join(" ").replace(/\s+/g, " ").trim();
  const first = listOneMarker.exec(value);
  if (!first) return null;
  const afterFirst = first.index + first[0].length;
  const second = listTwoMarker.exec(value.slice(afterFirst));
  if (!second) return null;
  const secondStart = afterFirst + second.index;
  const afterSecond = secondStart + second[0].length;
  const codeStart = value.slice(afterSecond).search(/\s+(?:Code\s*:|Select the (?:correct )?answer\b)/i);
  const leftText = value.slice(afterFirst, secondStart);
  const rightText = value.slice(afterSecond, codeStart >= 0 ? afterSecond + codeStart : value.length);
  const romanLeft = /^\s*I[.)]\s/.test(leftText);
  const leftItems = romanLeft ? listItems(leftText, romanMarker, ["I","II","III","IV","V"]) : listItems(leftText, letteredItemMarker, ["A", "B", "C", "D", "E"]);
  const rightItems = romanLeft ? listItems(rightText, letteredItemMarker, ["A","B","C","D","E"]) : listItems(rightText, numberedMarker, ["1", "2", "3", "4", "5"]) ?? listItems(rightText,romanMarker,["I","II","III","IV","V"]);
  if (!leftItems || !rightItems) return null;
  const introduction = value.slice(0, first.index).trim();
  const trailing = codeStart >= 0 ? value.slice(afterSecond + codeStart).trim() : "";
  return [
    ...(introduction ? [{ kind: "text" as const, text: introduction }] : []),
    {
      kind: "match-table" as const,
      left: { title: first[1]?.trim() || "List I", items: leftItems },
      right: { title: second[1]?.trim() || "List II", items: rightItems },
    },
    ...(trailing ? [{ kind: "text" as const, text: trailing }] : []),
  ];
}

/** Only explicit two-column headings and complete sequential paired rows qualify. */
function pairedRowBlocks(lines: string[]): PracticePromptBlock[] | null {
  if (!lines.some(line => /\bpairs\b|\bcorrectly matched\b/i.test(line))) return null;
  // NDA I 2026 Series A Q90: the original two-column headings were visually
  // checked on page 23. Restore layout only; keep stored source text unchanged.
  if (lines[0] === 'Consider the following pairs of reactions and properties:' && lines.length === 6) {
    const rows = lines.slice(1, 5).map((line, index) => {
      const marker = line.match(leadingRomanMarker);
      const cells = marker?.[3].match(/^(.+?):\s+(.+)$/);
      return marker && romanValue(marker[1]) === index + 1 && cells
        ? { marker: `${marker[1]}${marker[2]}`, left: cells[1], right: cells[2] } : null;
    });
    if (rows.every(row => row !== null)) return [
      { kind: 'text', text: lines[0] },
      { kind: 'pair-table', leftTitle: 'Reactions', rightTitle: 'Properties', rows: rows as {marker:string;left:string;right:string}[] },
      { kind: 'text', text: lines[5] },
    ];
  }
  for (let header = 0; header < lines.length - 2; header += 1) {
    // This legacy heading lost its column gap, not its words. The column split
    // was visually confirmed on CSE 2015 Series A page 6; do not guess others.
    const reviewedTitles = lines[header] === 'Place of Pilgrimage Location'
      ? ['Place of Pilgrimage', 'Location'] : null;
    const pipeTitles = lines[header].match(/^([^|]+)\|\s*([^|]+)$/);
    const titles = pipeTitles ?? lines[header].match(/^([^:]+):\s*([^:]+)$/)
      ?? (reviewedTitles ? [lines[header], ...reviewedTitles] : null);
    if (!titles || leadingArabicMarker.test(lines[header])) continue;
    const rows: { marker: string; left: string; right: string }[] = [];
    let end = header + 1;
    for (; end < lines.length; end += 1) {
      const numbered = lines[end].match(pipeTitles ? leadingRomanMarker : leadingArabicMarker);
      if (!numbered) break;
      const pair = numbered[3].match(pipeTitles ? /^(.+?)\|\s*(.+)$/ : /^(.+?):\s*(.+)$/);
      // Never turn just the well-formed prefix of a damaged table into a table.
      if ((pipeTitles ? romanValue(numbered[1]) : Number(numbered[1])) !== rows.length + 1 || !pair) return null;
      rows.push({ marker: `${numbered[1]}${numbered[2]}`, left: pair[1].trim(), right: pair[2].trim() });
    }
    if (rows.length < 2) continue;
    return [
      ...lines.slice(0, header).map(text => ({ kind: "text" as const, text })),
      { kind: "pair-table", leftTitle: titles[1].trim(), rightTitle: titles[2].trim(), rows },
      ...lines.slice(end).map(text => ({ kind: "text" as const, text })),
    ];
  }
  return null;
}

/**
 * Restores paper-style statement lines when an imported source was flattened.
 * It only restructures a sequential list beginning at 1, so years, quantities,
 * and other isolated numbers remain untouched.
 */
export function formatPracticePrompt(lines: string[]): PracticePromptBlock[] {
  const cleanLines = lines.map((line) => formatPracticeText(line).trim()).filter(Boolean);
  const errorLine = errorLineBlock(cleanLines);
  if (errorLine) return [errorLine];
  const inlineErrorLine = inlineErrorLineBlock(cleanLines);
  if (inlineErrorLine) return [inlineErrorLine];
  const wordOrder = wordOrderBlocks(cleanLines);
  if (wordOrder) return wordOrder;
  const matchingLists = matchingListBlocks(cleanLines);
  if (matchingLists) return matchingLists;
  const pairedRows = pairedRowBlocks(cleanLines);
  if (pairedRows) return pairedRows;
  const leading = cleanLines.map((line) => {
    const arabic = line.match(leadingArabicMarker);
    if (arabic) return { order: Number(arabic[1]), marker: `${arabic[1]}${arabic[2]}`, text: arabic[3] };
    const roman = line.match(leadingRomanMarker);
    return roman ? { order: romanValue(roman[1]), marker: `${roman[1]}${roman[2]}`, text: roman[3] } : null;
  });
  const sequenceIndexes = new Set<number>();
  for (let start = 0; start < leading.length; start += 1) {
    if (leading[start]?.order !== 1) continue;
    let end = start;
    while (leading[end + 1]?.order === leading[end]!.order + 1) end += 1;
    if (end > start) for (let index = start; index <= end; index += 1) sequenceIndexes.add(index);
  }

  return cleanLines.flatMap((line, lineIndex) => {
    if (sequenceIndexes.has(lineIndex)) {
      const { marker, text } = leading[lineIndex]!;
      return [{ kind: "statement" as const, marker, text }];
    }
    return splitSequence(line, numberedMarker, Number)
      || splitSequence(line, romanMarker, romanValue)
      || [{ kind: "text" as const, text: line }];
  });
}
