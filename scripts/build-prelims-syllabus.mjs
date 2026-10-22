import fs from 'node:fs';
import assert from 'node:assert/strict';
import { outline } from './prelims-syllabus-outline.mjs';
import {sourceTopicSpecs} from './prelims-reviewed-source-topic-specs.mjs';

const slug = value => value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const legacy = JSON.parse(fs.readFileSync('content/taxonomy/upsc-geography-v1.2.json', 'utf8'));
const physical = legacy.meta_heads.find(head => head.name === 'Physical Geography');
const nodes = [];
const add = (id, parentId, kind, label, order, extra = {}) => {
  assert.ok(!nodes.some(node => node.id === id), `Duplicate ID: ${id}`);
  if (parentId) assert.ok(nodes.some(node => node.id === parentId), `Missing parent: ${parentId}`);
  nodes.push({ id, parentId, kind, label, order, ...extra });
};
for (const [subjectIndex, [subject, sections]] of Object.entries(outline).entries()) {
  const subjectId = `syllabus:${slug(subject)}`;
  add(subjectId, null, 'subject', subject, subjectIndex + 1);
  const entries = Object.entries(sections);
  if (subject === 'Geography') entries.unshift(['Physical Geography', physical.chapters]);
  for (const [sectionIndex, [section, source]] of entries.entries()) {
    const sectionId = `${subjectId}/${slug(section)}`;
    add(sectionId, subjectId, 'section', section, sectionIndex + 1);
    const chapters = typeof source === 'string' ? source.trim().split('\n').map(line => {
      const [name, leaves] = line.split('|');
      assert.ok(name && leaves, `Invalid chapter: ${line}`);
      return { name, subtopics: leaves.split(';').map(name => ({ name })) };
    }) : source;
    for (const [chapterIndex, chapter] of chapters.entries()) {
      const chapterId = `${sectionId}/${slug(chapter.name)}`;
      const subparts = chapter.subtopics.map(part => typeof part === 'string' ? { name: part } : part);
      add(chapterId, sectionId, 'chapter', chapter.name, chapter.order ?? chapterIndex + 1, {
        includes: subparts.map(part => part.name),
        boundary: `Questions testing ${chapter.name} in ${section}; incidental mentions do not justify placement. Review neighbouring chapters before approving overlaps.`,
        reviewStatus: section === 'Physical Geography' ? 'existing-registry-preserved' : 'editorial-draft',
      });
      for (const [partIndex, part] of subparts.entries()) {
        const legacyId = section === 'Physical Geography' ? `${slug(section)}/${slug(chapter.name)}/${slug(part.name)}` : undefined;
        add(`${chapterId}/${slug(part.name)}`, chapterId, 'subpart', part.name, part.order ?? partIndex + 1, {
          includes: [part.name],
          excludes: ['Incidental references without testing this concept', 'Unrelated neighbouring concepts'],
          placementRule: 'Require complete-stem and option review plus a written concept-specific rationale; additional placements require independent material relevance.',
          editorialExampleStatus: 'pending-real-question-pilot',
          ...(sourceTopicSpecs[`${subject}/${section}/${chapter.name}/${part.name}`] ? {
            ...sourceTopicSpecs[`${subject}/${section}/${chapter.name}/${part.name}`],editorialExampleStatus:'source-question-reviewed',
          } : {}),
          ...(subject === 'Polity & Governance' && chapter.name === 'Judiciary' && part.name === 'Legal aid' ? {
            includes: ['Free and competent legal services', 'NALSA and State Legal Services Authorities', 'Legal-services programmes and implementation responsibilities'],
            excludes: ['Composition and jurisdiction of ordinary courts unless independently tested', 'General welfare schemes without a legal-services task', 'Constitutional directives tested only as abstract principles'],
            placementRule: 'Use for legal-aid eligibility, institutions, objectives and delivery. Add a rights/directives placement only when a constitutional provision is independently tested; a reference to weaker sections alone does not justify a second welfare placement.',
            representativeQuestions: ['CSE 2013 GS-I Series A Q71: NALSA objectives and guidelines for State Legal Services Authorities'],
            editorialExampleStatus: 'source-question-reviewed',
          } : {}),
          ...(legacyId ? { legacyTaxonomyId: legacyId } : {}),
        });
      }
    }
  }
}
const currentAffairs = nodes.filter(node => node.kind === 'section' && node.parentId === 'syllabus:current-affairs');
assert.equal(currentAffairs.length, 7);
assert.ok(!currentAffairs.some(node => /miscellaneous|general awareness|^other$/i.test(node.label)));
assert.equal(nodes.filter(node => node.legacyTaxonomyId).length, 92);
const registry = {
  version: 'upsc-prelims-v2-draft', status: 'active-working-syllabus-editorial-review-in-progress',
  officialAnchor: 'https://www.upsc.gov.in/examinations/Civil%20Services%20%28Preliminary%29%20Examination%2C%202026',
  note: 'Editorial expansion, not verbatim official syllabus. The working structure is active locally, including empty topics. Reviewed placements cover all nine subjects; full corpus classification and chapter-specific editorial review are not complete.',
  classificationPolicy: { primaryPlacements: 1, additionalPlacements: 'reviewed material relevance only', eventYearFromExamYear: false, tags: ['Static', 'Event-based'], answerEligibilityIndependent: true },
  nodes,
};
const json = `${JSON.stringify(registry, null, 2)}\n`;
const lines = ['# UPSC Prelims detailed syllabus - working edition', '', registry.note, '', 'Empty concepts remain visible with disabled test actions. Existing unreviewed legacy placements remain distinct from reviewed V2 decisions during migration.', ''];
for (const node of nodes) {
  if (node.kind === 'subject') lines.push(`## ${node.label}`, '');
  else if (node.kind === 'section') lines.push(`### ${node.label}`, '');
  else if (node.kind === 'chapter') lines.push(`- **${node.order}. ${node.label}:** ${node.includes.join('; ')}.`);
}
lines.push('', '## Remaining editorial work', '', 'Review chapter-specific exclusions, adjacent-topic cross-links and real-question examples; complete a pilot for every subject before freezing the registry. Draft metadata is not a claim of completed classification.', '');
const outputs = [['content/taxonomy/upsc-prelims-v2-draft.json', json], ['docs/upsc-prelims-syllabus-v2.md', lines.join('\n')]];
if (process.argv.includes('--check')) {
  for (const [file, expected] of outputs) assert.equal(fs.readFileSync(file, 'utf8'), expected, `Stale artifact: ${file}`);
} else {
  for (const [file, value] of outputs) if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== value) fs.writeFileSync(file, value);
}
console.log(JSON.stringify({ status: registry.status, counts: Object.fromEntries(['subject', 'section', 'chapter', 'subpart'].map(kind => [kind, nodes.filter(node => node.kind === kind).length])) }));
