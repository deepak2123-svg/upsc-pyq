export type PracticePromptBlock =
  | { kind: "text"; text: string }
  | { kind: "statement"; marker: string; text: string }
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

function romanValue(value: string) {
  const numerals: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  return numerals[value.toUpperCase()];
}

/** Convert the limited TeX notation found in legacy imports for display. */
export function formatPracticeText(value: string) {
  return value
    .replace(/\\{1,2}\(/g, "")
    .replace(/\\{1,2}\)/g, "")
    .replace(/\^\{\\prime\\prime\}/g, "″")
    .replace(/\^\{\\prime\}/g, "′")
    .replace(/\^\{\\circ\}/g, "°")
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
  const codeStart = value.slice(afterSecond).search(/\s+Code\s*:/i);
  const leftItems = listItems(value.slice(afterFirst, secondStart), letteredItemMarker, ["A", "B", "C", "D", "E"]);
  const rightItems = listItems(value.slice(afterSecond, codeStart >= 0 ? afterSecond + codeStart : value.length), numberedMarker, ["1", "2", "3", "4", "5"]);
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
  for (let header = 0; header < lines.length - 2; header += 1) {
    // This legacy heading lost its column gap, not its words. The column split
    // was visually confirmed on CSE 2015 Series A page 6; do not guess others.
    const reviewedTitles = lines[header] === 'Place of Pilgrimage Location'
      ? ['Place of Pilgrimage', 'Location'] : null;
    const titles = lines[header].match(/^([^:]+):\s*([^:]+)$/)
      ?? (reviewedTitles ? [lines[header], ...reviewedTitles] : null);
    if (!titles || leadingArabicMarker.test(lines[header])) continue;
    const rows: { marker: string; left: string; right: string }[] = [];
    let end = header + 1;
    for (; end < lines.length; end += 1) {
      const numbered = lines[end].match(leadingArabicMarker);
      if (!numbered) break;
      const pair = numbered[3].match(/^(.+?):\s*(.+)$/);
      // Never turn just the well-formed prefix of a damaged table into a table.
      if (Number(numbered[1]) !== rows.length + 1 || !pair) return null;
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
