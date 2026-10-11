export type PracticePromptBlock =
  | { kind: "text"; text: string }
  | { kind: "statement"; number: number; text: string };

const numberedMarker = /(?:^|\s)(\d{1,2})[.)]\s+/g;
const instructionMarker = /\s+(?=(?:Select|Choose) the (?:correct )?answer\b|Which of the (?:following|statements)\b)/i;

/**
 * Restores paper-style statement lines when an imported source was flattened.
 * It only restructures a sequential list beginning at 1, so years, quantities,
 * and other isolated numbers remain untouched.
 */
export function formatPracticePrompt(lines: string[]): PracticePromptBlock[] {
  return lines.flatMap((rawLine) => {
    const line = rawLine.trim();
    if (!line) return [];
    const matches = [...line.matchAll(numberedMarker)];
    if (matches.length < 2 || matches[0][1] !== "1" || !matches.every((match, index) => Number(match[1]) === index + 1)) {
      return [{ kind: "text" as const, text: line }];
    }

    const blocks: PracticePromptBlock[] = [];
    const firstIndex = matches[0].index! + (matches[0][0].startsWith(" ") ? 1 : 0);
    const introduction = line.slice(0, firstIndex).trim();
    if (introduction) blocks.push({ kind: "text", text: introduction });

    matches.forEach((match, index) => {
      const markerStart = match.index! + (match[0].startsWith(" ") ? 1 : 0);
      const contentStart = markerStart + match[0].trimStart().length;
      const next = matches[index + 1];
      const contentEnd = next ? next.index! : line.length;
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
  });
}
