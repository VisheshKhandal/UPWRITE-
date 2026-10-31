import test from 'node:test';
import assert from 'node:assert/strict';
import { getHeadings, resolvePassage, togglePanel, restorationMode, bodyProgress } from '../src/components/article/readerModel.ts';
test('Markdown headings share unique Unicode-aware anchors, exclude fences and include all depths', () => {
  const source = '# **Hello** [world](https://example.com)\n## हिंदी में पढ़ें\n## Repeat\n## Repeat\n```md\n# Not a heading\n```\nSetext title\n---\n###### Deep\n' + Array.from({length: 20}, (_, i) => `## Section ${i}`).join('\n');
  const headings = getHeadings(source);
  assert.deepEqual(headings.slice(0, 6), [{id:'hello-world',title:'Hello world',depth:1},{id:'हिंदी-में-पढ़ें',title:'हिंदी में पढ़ें',depth:2},{id:'repeat',title:'Repeat',depth:2},{id:'repeat-1',title:'Repeat',depth:2},{id:'setext-title',title:'Setext title',depth:2},{id:'deep',title:'Deep',depth:6}]);
  assert.equal(headings.length, 26);
});
test('passages resolve the selected repeated occurrence and refuse ambiguous legacy quotes', () => {
  const body = 'first नमस्ते then second नमस्ते end';
  const startOffset = body.lastIndexOf('नमस्ते');
  assert.deepEqual(resolvePassage(body, {text:'नमस्ते',startOffset,endOffset:startOffset+6,prefix:'second ',suffix:' end'}), {start:startOffset,end:startOffset+6});
  assert.equal(resolvePassage(body, {text:'नमस्ते'}), null);
  assert.deepEqual(resolvePassage('new '+body, {text:'नमस्ते',prefix:'second ',suffix:' end'}), {start:startOffset+4,end:startOffset+10});
  assert.equal(resolvePassage(body, {text:'missing'}), null);
});
test('panel transitions permit one panel and toggle to closed', () => {
  assert.equal(togglePanel('closed','contents'),'contents');
  assert.equal(togglePanel('contents','notebook'),'notebook');
  assert.equal(togglePanel('notebook','notebook'),'closed');
});
test('hash and history take precedence over continue, ordinary visits offer resume', () => {
  assert.equal(restorationMode('#section',true,true,true),'hash');
  assert.equal(restorationMode('',true,true,true),'history');
  assert.equal(restorationMode('',false,false,true),'resume');
  assert.equal(restorationMode('',true,false,false),'offer');
});
test('body progress handles short articles and clamps before and after content', () => {
  assert.equal(bodyProgress(1000,2000,844),0);
  assert.equal(bodyProgress(100,200,844),100);
  assert.equal(bodyProgress(-2500,2000,844),100);
});
import { draftStorageKey, readNoteDraft, writeNoteDraft } from '../src/components/article/readerDraft.ts';
test('drafts survive panel/tab changes, remain scoped and recover safely', () => {
  const values = new Map();
  const storage = { getItem:k=>values.get(k)??null, setItem:(k,v)=>values.set(k,v), removeItem:k=>values.delete(k) };
  const key = draftStorageKey('article-a','user-a');
  const draft = {body:'Unsaved Hindi note: विचार',passage:{text:'selected passage'}};
  assert.equal(writeNoteDraft(storage,key,draft),true);
  let panel = togglePanel('closed','notebook'); panel = togglePanel(panel,'contents'); panel = togglePanel(panel,'notebook');
  assert.equal(panel,'notebook');
  assert.deepEqual(readNoteDraft(storage,key).body,draft.body);
  assert.equal(readNoteDraft(storage,draftStorageKey('article-a','user-b')).body,'');
  assert.equal(readNoteDraft(storage,draftStorageKey('article-b','user-a')).body,'');
  storage.setItem(key,'{broken'); assert.equal(readNoteDraft(storage,key).body,'');
  assert.equal(writeNoteDraft({setItem(){throw Error('blocked');},removeItem(){}},key,draft),false);
});
test('changed revisions refuse ambiguous offsets', () => {
  assert.equal(resolvePassage('same same', {text:'same',startOffset:0,endOffset:4,revision:'old'},'new'),null);
});
import { parseFlashcards } from '../src/components/article/readerCards.ts';
test('flashcards validate malformed payloads and keep supported legacy responses', () => {
  assert.deepEqual(parseFlashcards('{"flashcards":[null,{"question":12,"answer":"bad"},{"question":"What?","answer":"This."}]}'),[{question:'What?',answer:'This.'}]);
  assert.deepEqual(parseFlashcards('```json\n[{"question":"Q","answer":"A"}]\n```'),[{question:'Q',answer:'A'}]);
  assert.deepEqual(parseFlashcards('{"flashcards":[]}'),[]);
  assert.deepEqual(parseFlashcards('not valid cards'),[]);
  assert.deepEqual(parseFlashcards('Q1: What is this?\nA: A legacy answer.'),[{question:'What is this?',answer:'A legacy answer.'}]);
});
