import test from 'node:test';
import assert from 'node:assert/strict';
import {printPromptLines} from '../lib/print-shared-context.ts';
test('print shares explicitly linked identical material without changing standalone content',()=>{
 const sharedContext={id:'passage-1',label:'Passage',promptLines:['Directions','A long passage.']};
 const questions=[{id:'one',sharedContext,promptLines:[...sharedContext.promptLines,'First task']},{id:'two',sharedContext,promptLines:[...sharedContext.promptLines,'Second task']}];
 const before=JSON.stringify(questions),result=printPromptLines(questions);
 assert.deepEqual(result.get('one'),questions[0].promptLines);
 assert.deepEqual(result.get('two'),['Passage: see Question 1.','Second task']);
 assert.equal(JSON.stringify(questions),before);
 questions[1].promptLines[1]='Different source material';
 assert.deepEqual(printPromptLines(questions).get('two'),questions[1].promptLines);
});
