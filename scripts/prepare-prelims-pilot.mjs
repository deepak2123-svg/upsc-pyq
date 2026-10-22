import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// These are individually read first-pass decisions, not keyword classifications
// and not approved mappings. Second-pass review and syllabus freeze remain required.
const decisions = [
  ['cse-2022-gs-i-41', 'Environment & Ecology/Environmental Governance/International Framework/Assessment institutions', [], 'Static', 'The stem asks the institutional identity of an emissions-pledge assessment tracker; the options contrast research organisations with intergovernmental agencies.'],
  ['cse-2022-gs-i-42', 'Environment & Ecology/Environmental Governance/International Framework/Assessment institutions', ['Environment & Ecology/Climate Change/Climate Responses/Mitigation'], 'Static', 'Statements test Climate Group, EP100 and Under2 institutional relationships and energy-efficiency mitigation; no Indian constitutional institution is tested.'],
  ['cse-2022-gs-i-75', 'Environment & Ecology/Environmental Governance/Indian Framework/Institutions', ['Environment & Ecology/Environmental Governance/Indian Framework/Environmental laws'], 'Static', 'The discriminating concept is which environmental authority is constituted under the Environment Protection Act; generic public-institution ownership would obscure the subject.'],
  ['cse-2022-gs-i-77', 'International Relations & Organisations/Agreements & Global Governance/International Cooperation/Maritime governance', [], 'Static', 'All alternatives define the Polar Code; maritime safety governance is materially tested, whereas polar location is contextual.'],
  ['cse-2022-gs-i-89', 'Environment & Ecology/Environmental Governance/Indian Framework/Environmental laws', ['Environment & Ecology/Conservation/Conservation Methods/Human-wildlife conflict'], 'Static', 'Statements explicitly test wildlife ownership, protection outside reserves and grounds for capture or killing in human-wildlife conflict.'],
  ['cse-2023-gs-i-23', 'Environment & Ecology/Biodiversity/Species and Relationships/Invasive species', ['Environment & Ecology/Environmental Governance/International Framework/Assessment institutions'], 'Static', 'The question identifies the organisational home of the Invasive Species Specialist Group and its database; both invasive-species knowledge infrastructure and institution identity are tested.'],
  ['cse-2023-gs-i-99', 'Environment & Ecology/Environmental Governance/Indian Framework/Biodiversity governance', ['Environment & Ecology/Environmental Governance/International Framework/Biodiversity conventions'], 'Static', 'Both statements concern biodiversity committees and access-benefit sharing, explicitly connecting domestic mechanisms with Nagoya Protocol objectives.'],
  ['cse-2024-gs-i-95', 'Current Affairs/Environment & Geography/Climate and Conservation Developments/Environmental policy', ['Environment & Ecology/Climate Change/Climate Responses/Mitigation'], 'Event-based', 'The recent EU Net-Zero Industry Act is the subject; the second statement separately tests the carbon-neutrality and clean-technology policy rationale.'],
  ['cse-2025-gs-i-32', 'Current Affairs/Environment & Geography/Climate and Conservation Developments/Climate negotiations', ['Environment & Ecology/Climate Change/Climate Responses/Adaptation'], 'Event-based', 'The named COP28 declaration and India\'s response are event-based; the statements also explicitly test health-system resilience under climate policy.'],
  ['cse-2025-gs-i-34', 'Environment & Ecology/Climate Change/Climate Responses/Carbon markets', ['Environment & Ecology/Environmental Governance/International Framework/Climate conventions'], 'Static', 'The tested propositions concern Article 6 market and non-market mechanisms rather than a dated announcement. Frequent discussion alone does not establish an event date.'],
  ['cse-2025-gs-i-35', 'Current Affairs/Economy & Development/Finance and Economic Policy/Financial regulation', ['Environment & Ecology/Climate Change/Climate Responses/Climate finance'], 'Event-based', 'The launch and institutional sponsor of a nature-finance hub are tested. The current draft lacks a precise nature-finance initiative leaf; this candidate requires a syllabus amendment before approval.', 'needs-syllabus-amendment'],
  ['cse-2025-gs-i-90', 'Current Affairs/Environment & Geography/Climate and Conservation Developments/Environmental policy', ['Environment & Ecology/Conservation/Conservation Programmes/Forest restoration'], 'Event-based', 'The stem asks which organisation enacted a named restoration law. The proposed forest-restoration secondary leaf is too narrow for all ecosystems and must be reconsidered.', 'needs-syllabus-amendment'],
  ['cse-2026-gs-i-38', 'Current Affairs/International Affairs/Summits and Organisations/Summit outcomes', ['Economy/Agriculture/Allied Activities/Fisheries'], 'Event-based', 'The stem dates UNOC to June 2025 and asks FAO\'s Blue Transformation formulation; examination year is not the event year. Fisheries and aquaculture are explicit.', 'first-pass-complete', '2025-06'],
  ['cse-2026-gs-i-40', 'Current Affairs/Environment & Geography/Climate and Conservation Developments/Conservation initiatives', ['Environment & Ecology/Climate Change/Climate Responses/Carbon markets'], 'Event-based', 'A named first certified REDD+ project is tested, including its emissions-reduction certification context; no unsupported event date is assigned.'],
  ['cse-2026-gs-i-77', 'Environment & Ecology/Environmental Governance/Indian Framework/Institutions', [], 'Static', 'All three propositions test vertical-to-lead-institute mappings within NIRANTAR; the stem does not establish a dated event.'],
  ['cse-2026-gs-i-92', 'Economy/Money & Banking/Financial Markets/Bonds and yields', ['Economy/Development/Development Policy/Sustainable development'], 'Static', 'The definition distinguishes green, social, sustainability and sovereign bonds. Both financial instrument classification and combined environmental/social use of proceeds are tested.'],
  ['nda-2020-i-ii-77', 'Environment & Ecology/Environmental Governance/International Framework/Biodiversity conventions', ['Science & Technology/Health & Biotechnology/Biotechnology/Biosafety'], 'Static', 'The Biosafety Protocol to the CBD is identified through its associated city; treaty identity and biosafety are material, not general Indian polity.'],
];
const registry = JSON.parse(fs.readFileSync('content/taxonomy/upsc-prelims-v2-draft.json'));
const bank = JSON.parse(fs.readFileSync('content/question-bank.json')).questions;
const byId = new Map(registry.nodes.map(node => [node.id, node]));
const leafByPath = new Map(registry.nodes.filter(node => node.kind === 'subpart').map(node => {
  const labels = [];
  let current = node;
  while (current) { labels.unshift(current.label); current = byId.get(current.parentId); }
  return [labels.join('/'), node.id];
}));
const resolve = candidate => { assert.ok(leafByPath.has(candidate), `Unknown pilot path: ${candidate}`); return leafByPath.get(candidate); };
const records = decisions.map(([id, primary, additional, tag, rationale, firstPassStatus = 'first-pass-complete', eventDate]) => {
  const question = bank.find(q => q.id === id);
  assert.ok(question, `Missing pilot question: ${id}`);
  return {
    questionId: id, expectedRecordHash: crypto.createHash('sha256').update(JSON.stringify(question)).digest('hex'),
    originalSubject: question.subject,
    primaryCandidate: firstPassStatus === 'needs-syllabus-amendment' ? null : resolve(primary),
    additionalCandidates: firstPassStatus === 'needs-syllabus-amendment' ? [] : additional.map(resolve),
    tags: [tag], ...(eventDate ? { eventDate, eventDateEvidence: 'Explicit month and year in the original stem' } : {}),
    firstPassStatus, rationale, secondPass: 'pending', status: 'candidate-not-approved',
  };
});
const output = { version: 1, taxonomyVersion: registry.version, scope: 'Initial diagnostic pilot: all 17 existing Polity-labelled records, not a pilot across all nine subjects', activated: false, records };
const file = 'content/taxonomy/prelims-classification-pilot.json';
const value = `${JSON.stringify(output, null, 2)}\n`;
if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') !== value) throw new Error('Existing pilot differs: review changes explicitly before replacing it.');
if (!fs.existsSync(file)) fs.writeFileSync(file, value);
console.log(JSON.stringify({ pilotCandidates: records.length, approved: 0, needsSyllabusAmendment: records.filter(row => row.firstPassStatus === 'needs-syllabus-amendment').length }));
