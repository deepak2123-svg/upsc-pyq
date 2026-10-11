import assert from "node:assert/strict";
import test from "node:test";
import {
  addScope, addedQuestionCount, ancestors, buildSelectionIndex, defaultSources,
  removeScope, replaceScope, sanitizePaths, scopeMetrics, selectedScopeIds,
  selectionCounts, setScopeExam,
} from "../lib/practice-selection.ts";

const counts = (CSE = 0, CAPF = 0, CDS = 0, NDA = 0) => ({ CSE, CAPF, CDS, NDA });
const leaf = (id, parentId, examCounts, label = id, subjectId = "geo") => ({
  id, label, parentId, subjectId, kind: "subtopic", examCounts,
  questionCount: Object.values(examCounts).reduce((a, b) => a + b, 0),
});
const leaves = [
  leaf("earth", "geomorphology", counts(2, 1, 3, 4)),
  leaf("weathering", "geomorphology", counts(0, 2, 1, 3)),
  leaf("rain", "climate", counts(1, 0, 0, 3)),
  leaf("other-earth", "other-geomorphology", counts(1)),
  leaf("rights", "constitution", counts(3), "Rights", "polity"),
];
const branch = (id, parentId, kind, descendants, subjectId = "geo", label = id) => {
  const examCounts = counts();
  for (const child of descendants) for (const exam of Object.keys(examCounts)) examCounts[exam] += child.examCounts[exam];
  return { id, parentId, kind, subjectId, label, examCounts, questionCount: Object.values(examCounts).reduce((a, b) => a + b, 0) };
};
const geomorphology = branch("geomorphology", "physical", "topic", leaves.slice(0, 2));
const climate = branch("climate", "physical", "topic", leaves.slice(2, 3));
const otherGeomorphology = branch("other-geomorphology", "other", "topic", leaves.slice(3, 4));
const physical = branch("physical", "geo", "head", [geomorphology, climate]);
const other = branch("other", "geo", "head", [otherGeomorphology]);
const constitution = branch("constitution", "political", "topic", leaves.slice(4), "polity");
const political = branch("political", "polity", "head", [constitution], "polity");
const subject = (id, label, heads) => {
  const { questionCount, examCounts } = branch(id, undefined, "head", heads, id);
  return { id, label, questionCount, examCounts };
};
const inventory = {
  version: 3, legacyAliases: {}, totalCount: 24, mappedCount: 24, unmappedCount: 0,
  subjects: [subject("geo", "Geography", [physical, other]), subject("polity", "Polity", [political])],
  nodes: [physical, other, political, geomorphology, climate, otherGeomorphology, constitution, ...leaves],
  links: [],
};
const index = buildSelectionIndex(inventory);

test("ordered ancestry keeps identical topic labels under separate sections and conserves counts", () => {
  assert.deepEqual(ancestors("earth", index).map((node) => node.id), ["geo", "physical", "geomorphology", "earth"]);
  assert.deepEqual(ancestors("other-earth", index).map((node) => node.id), ["geo", "other", "other-geomorphology", "other-earth"]);
  for (const [id, children] of index.childrenById) {
    const parent = index.nodesById.get(id);
    assert.equal(parent.questionCount, children.reduce((sum, child) => sum + child.questionCount, 0));
    for (const exam of Object.keys(parent.examCounts)) assert.equal(parent.examCounts[exam], children.reduce((sum, child) => sum + child.examCounts[exam], 0));
  }
});

test("scope replacement narrows the entire subject and preserves another subject and source overrides", () => {
  let paths = addScope({}, "geo", index);
  paths = addScope(paths, "polity", index);
  paths = setScopeExam(paths, "earth", "NDA", false, index);
  const before = structuredClone(paths);
  const replaced = replaceScope(paths, "geomorphology", index);
  assert.deepEqual(Object.keys(replaced).sort(), ["earth", "rights", "weathering"]);
  assert.deepEqual(replaced.earth, ["CSE", "CAPF", "CDS"]);
  assert.deepEqual(replaced.rights, ["CSE"]);
  assert.equal(selectionCounts(replaced, index).matchingCount, 15);
  assert.deepEqual(paths, before, "selection operations must be immutable");
  assert.deepEqual(Object.keys(replaceScope(replaced, "earth", index)).sort(), ["earth", "rights"]);
});

test("adding overlapping scopes is an idempotent union, and removing a scope affects only descendants", () => {
  const paths = replaceScope({}, "earth", index);
  assert.equal(addedQuestionCount(paths, "geomorphology", index), 6);
  const expanded = addScope(paths, "geomorphology", index);
  assert.equal(selectionCounts(expanded, index).matchingCount, 16);
  assert.deepEqual(addScope(expanded, "geomorphology", index), expanded);
  assert.equal(addedQuestionCount(expanded, "earth", index), 0);
  const removed = removeScope(expanded, "earth", index);
  assert.deepEqual(Object.keys(removed), ["weathering"]);
  assert.deepEqual(addScope(removed, "earth", index), expanded);
});

test("strict preferred sources retain a zero-source branch without silently adding other exams", () => {
  assert.deepEqual(defaultSources(leaves[1], "CSE"), []);
  const paths = replaceScope({}, "weathering", index, "CSE");
  assert.deepEqual(paths, { weathering: [] });
  assert.deepEqual(selectionCounts(paths, index), { matchingCount: 0, examTotals: counts(), subjectIds: ["geo"], leafCount: 1 });
  assert.equal(scopeMetrics("weathering", paths, index).state, "all");
  assert.deepEqual(addScope(paths, "geomorphology", index).weathering, []);
  assert.equal(selectionCounts(setScopeExam(paths, "weathering", "CAPF", true, index), index).matchingCount, 2);
});

test("source toggles do not select hidden leaves and parent controls show mixed eligible sources", () => {
  const paths = replaceScope({}, "geomorphology", index);
  const changed = setScopeExam(paths, "earth", "CAPF", false, index);
  assert.equal(scopeMetrics("geomorphology", changed, index).examStates.CAPF, "partial");
  assert.equal(scopeMetrics("geomorphology", changed, index).examStates.CSE, "all");
  const allOff = setScopeExam(changed, "geomorphology", "CAPF", false, index);
  assert.equal(scopeMetrics("geomorphology", allOff, index).examStates.CAPF, "none");
  const onlyEarth = replaceScope({}, "earth", index);
  assert.deepEqual(Object.keys(setScopeExam(onlyEarth, "physical", "NDA", false, index)), ["earth"]);
  assert.equal(scopeMetrics("physical", onlyEarth, index).state, "partial");
  assert.deepEqual(setScopeExam({ weathering: [] }, "weathering", "CSE", true, index), { weathering: [] });
});

test("summary uses the highest fully covered partition with no repeated leaves", () => {
  assert.deepEqual(selectedScopeIds(replaceScope({}, "geomorphology", index), index), ["geomorphology"]);
  let paths = addScope({}, "physical", index);
  assert.deepEqual(selectedScopeIds(paths, index), ["physical"]);
  paths = addScope(paths, "other", index);
  assert.deepEqual(selectedScopeIds(paths, index), ["geo"]);
  paths = addScope(paths, "polity", index);
  assert.deepEqual(selectedScopeIds(paths, index), ["geo", "polity"]);
  paths = removeScope(paths, "weathering", index);
  const partition = selectedScopeIds(paths, index);
  assert.deepEqual(partition, ["other", "climate", "earth", "polity"]);
  const covered = partition.flatMap((id) => index.leavesById.get(id).map((node) => node.id));
  assert.equal(new Set(covered).size, covered.length);
  assert.deepEqual(covered.sort(), Object.keys(paths).sort());
});

test("draft restoration drops unknown leaves and unavailable exams, deduplicates and keeps empty arrays", () => {
  assert.deepEqual(sanitizePaths({ earth: ["CDS", "NDA", "NDA", "invalid"], weathering: [], rain: ["CAPF"], unknown: ["CSE"], physical: ["CSE"], rights: "CSE" }, index), {
    earth: ["CDS", "NDA"], weathering: [], rain: [],
  });
  assert.deepEqual(sanitizePaths(null, index), {});
  assert.deepEqual(sanitizePaths([], index), {});
});

test("invalid ancestry cannot enter the selection index", () => {
  assert.throws(() => buildSelectionIndex({ ...inventory, nodes: [...inventory.nodes, leaves[0]] }), /Duplicate practice scope/);
  assert.throws(() => buildSelectionIndex({ ...inventory, nodes: [{ ...leaves[0], parentId: "missing" }] }), /Missing parent/);
  assert.throws(() => buildSelectionIndex({ ...inventory, nodes: [{ ...leaves[0], parentId: "polity" }] }), /crosses subjects/);
});

test("new branches inherit subject sources and keep existing per-leaf overrides", () => {
  let paths = replaceScope({}, "geomorphology", index);
  for (const exam of ["CAPF", "CDS", "NDA"]) paths = setScopeExam(paths, "geomorphology", exam, false, index);
  const expanded = addScope(paths, "rain", index);
  assert.deepEqual(expanded.rain, ["CSE"]);
  assert.deepEqual(expanded.weathering, []);
  assert.deepEqual(replaceScope(paths, "climate", index).rain, ["CSE"]);
  const mixed = { earth: ["CSE", "CAPF"], weathering: ["CAPF", "NDA"] };
  assert.deepEqual(addScope(mixed, "rain", index).rain, ["CSE", "NDA"]);
  const zeroCseBranch = replaceScope({}, "weathering", index, "CSE");
  assert.deepEqual(addScope(zeroCseBranch, "earth", index, "CSE").earth, ["CSE"]);
});
