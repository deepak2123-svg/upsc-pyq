export type PracticePromptBlock =
  | { kind: "text"; text: string }
  | { kind: "statement"; number: number; text: string };

const numberedMarker = /(?:^|\s)(\d{1,2})[.)]\s+/g;
const romanMarker = /(?:^|\s)(I|II|III|IV|V|VI|VII|VIII|IX|X)[.)]\s+/gi;
const instructionMarker = /\s+(?=(?:Select|Choose) the (?:correct )?answer\b|Which of the (?:following|statements|above)\b|How many of the (?:above|following)\b)/i;
const leadingArabicMarker = /^\s*(\d{1,2})[.)]\s+(.+)$/;
const leadingRomanMarker = /^\s*(I|II|III|IV|V|VI|VII|VIII|IX|X)[.)]\s+(.+)$/i;

function romanValue(value: string) {
  const numerals: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10 };
  return numerals[value.toUpperCase()];
}

function splitSequence(line: string, marker: RegExp, valueOf: (value: string) => number) {
  const matches = [...line.matchAll(marker)];
  if (matches.length < 2 || !matches.every((match, index) => valueOf(match[1]) === index + 1)) return null;
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
        blocks.push({ kind: "statement", number: index + 1, text: statement });
        blocks.push({ kind: "text", text: instruction });
        return;
      }
    }
    blocks.push({ kind: "statement", number: index + 1, text: statement });
  });
  return blocks;
}

/**
 * Restores paper-style statement lines when an imported source was flattened.
 * It only restructures a sequential list beginning at 1, so years, quantities,
 * and other isolated numbers remain untouched.
 */
export function formatPracticePrompt(lines: string[]): PracticePromptBlock[] {
  const cleanLines = lines.map((line) => line.trim()).filter(Boolean);
  const leading = cleanLines.map((line) => {
    const arabic = line.match(leadingArabicMarker);
    if (arabic) return { number: Number(arabic[1]), text: arabic[2] };
    const roman = line.match(leadingRomanMarker);
    return roman ? { number: romanValue(roman[1]), text: roman[2] } : null;
  });
  const sequenceIndexes = new Set<number>();
  for (let start = 0; start < leading.length; start += 1) {
    if (leading[start]?.number !== 1) continue;
    let end = start;
    while (leading[end + 1]?.number === leading[end]!.number + 1) end += 1;
    if (end > start) for (let index = start; index <= end; index += 1) sequenceIndexes.add(index);
  }

  return cleanLines.flatMap((line, lineIndex) => {
    if (sequenceIndexes.has(lineIndex)) return [{ kind: "statement" as const, ...leading[lineIndex]! }];
    return splitSequence(line, numberedMarker, Number)
      || splitSequence(line, romanMarker, romanValue)
      || [{ kind: "text" as const, text: line }];
  });
}
