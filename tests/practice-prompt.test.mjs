import assert from "node:assert/strict";
import test from "node:test";
import { formatPracticePrompt, formatPracticeText } from "../lib/practice-prompt.ts";

test("prints legacy coordinate notation as conventional paper symbols", () => {
  assert.equal(
    formatPracticeText(String.raw`\\(15^{\circ}48^{\prime}00^{\prime\prime}\\) N`),
    "15°48′00″ N",
  );
  assert.equal(formatPracticeText(String.raw`\\(180^{\circ}\\) angle`), "180° angle");
});

test("separates statements even when dates contain numbered punctuation", () => {
  const blocks = formatPracticePrompt([
    "Which statements are correct? 1. Vernal equinox occurs on March 21. 2. Summer solstice occurs on December 22. 3. Autumnal equinox occurs on September 23. 4. Winter solstice occurs on June 21. Select the correct answer using the code given below:",
  ]);
  assert.deepEqual(blocks.map((block) => block.kind), ["text", "statement", "statement", "statement", "statement", "text"]);
  assert.deepEqual(blocks.filter((block) => block.kind === "statement").map((block) => block.marker), ["1.", "2.", "3.", "4."]);
  assert.equal(blocks[1].text, "Vernal equinox occurs on March 21.");
});
