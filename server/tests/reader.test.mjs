import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
import test from 'node:test';
import assert from 'node:assert/strict';
import { highlightInput, noteInput, noteUpdate, progressInput } from '../src/validations/reader.validation.ts';
const article = '0123456789abcdef01234567';
test('notes accept only private visibility and update cannot change ownership or article', () => {
  assert.equal(noteInput.safeParse({article,body:'note',visibility:'public'}).success,false);
  assert.equal(noteInput.safeParse({article,body:'   '}).success,false);
  assert.deepEqual(noteUpdate.parse({body:' Updated ',user:article,article}),{body:'Updated'});
});
test('highlight and progress reject malformed data and preserve backward compatibility', () => {
  assert.equal(highlightInput.safeParse({article,text:'legacy quote'}).success,true);
  assert.equal(highlightInput.safeParse({article,text:'quote',startOffset:10,endOffset:2}).success,false);
  assert.equal(progressInput.safeParse({article,progressPercent:101}).success,false);
  assert.equal(progressInput.safeParse({article,progressPercent:40,lastScrollPosition:400}).success,true);
});
const { highlightsController, notesController, readingProgressController } = require('../src/controllers/learning.controller.ts');
const { ArticleModel } = require('../src/models/Article.ts');
const { HighlightModel } = require('../src/models/Highlight.ts');
const { ReaderNoteModel } = require('../src/models/ReaderNote.ts');
const { ReadingProgressModel } = require('../src/models/ReadingProgress.ts');
const user = '1123456789abcdef01234567';
const otherUser = '2123456789abcdef01234567';
const mockReadable = (document) => ({select:()=>({lean:async()=>document})});
const invoke = async (handler, body) => {
  let payload; let failure;
  const res={status(){return this;},json(value){payload=value;return this;}};
  await handler({body,user:{id:user},query:{},params:{}},res,error=>{failure=error;});
  return {payload,failure};
};
test('authenticated private note creation strips forged ownership and rejects another user highlight', async () => {
  const originalArticle=ArticleModel.findOne, originalExists=HighlightModel.exists, originalCreate=ReaderNoteModel.create;
  let created;
  try {
    ArticleModel.findOne=()=>mockReadable({status:'published',author:otherUser});
    HighlightModel.exists=async(filter)=>{assert.equal(filter.user,user);assert.equal(filter.article,article);return null;};
    ReaderNoteModel.create=async(input)=>{created=input;return input;};
    const denied=await invoke(notesController.create,{article,body:'Private',highlight:otherUser,user:otherUser});
    assert.equal(denied.failure.statusCode,404);assert.equal(created,undefined);
    const allowed=await invoke(notesController.create,{article,body:'Private',user:otherUser});
    assert.equal(allowed.failure,undefined);assert.equal(created.user,user);assert.equal(created.visibility,'private');
  } finally {ArticleModel.findOne=originalArticle;HighlightModel.exists=originalExists;ReaderNoteModel.create=originalCreate;}
});
test('unpublished articles reject another reader before writing highlights', async () => {
  const original=ArticleModel.findOne;
  try {ArticleModel.findOne=()=>mockReadable({status:'draft',author:otherUser});const result=await invoke(highlightsController.create,{article,text:'quote'});assert.equal(result.failure.statusCode,404);}
  finally {ArticleModel.findOne=original;}
});
test('stale progress races return the newer record without replacing it', async () => {
  const originalArticle=ArticleModel.findOne, originalUpdate=ReadingProgressModel.findOneAndUpdate, originalFind=ReadingProgressModel.findOne;
  try {
    ArticleModel.findOne=()=>mockReadable({status:'published',author:otherUser});
    ReadingProgressModel.findOneAndUpdate=async(filter)=>{assert.equal(filter.user,user);assert.equal(filter.$or[0].clientUpdatedAt.$lte,1000);throw Object.assign(Error('race'),{code:11000});};
    ReadingProgressModel.findOne=async()=>({progressPercent:80,clientUpdatedAt:2000});
    const result=await invoke(readingProgressController.upsert,{article,progressPercent:20,clientUpdatedAt:1000});
    assert.equal(result.failure,undefined);assert.equal(result.payload.data.progressPercent,80);
  } finally {ArticleModel.findOne=originalArticle;ReadingProgressModel.findOneAndUpdate=originalUpdate;ReadingProgressModel.findOne=originalFind;}
});
