const browserExecutable = require('./browser-executable.cjs');
const {createRequire}=require('node:module');
const {writeFileSync,readFileSync}=require('node:fs');
const {createHash}=require('node:crypto');
const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const r=createRequire(root+'/package.json');
const base='http://localhost:3211';
const dir=root+'/output/editor/verification';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(route,method='GET',body,headers={}) {
 const response=await fetch(base+route,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
 return {status:response.status,data:await response.json()};
}
(async()=>{
 const initial=(await request('/api/project')).data;
 writeFileSync(dir+'/test-original.json',JSON.stringify(initial,null,2));
 for(const [name,change] of [
  ['invalid speed',p=>p.beats[0].voiceSpeed=9],
  ['asset traversal',p=>p.characters['ルーノ'].src='assets/../../etc/passwd'],
  ['forged audio',p=>p.beats[0].audio.generatedFor='forged'],
 ]) {
  const project=structuredClone(initial.project);change(project);
  const result=await request('/api/project','PUT',{project,revision:initial.revision});
  assert.equal(result.status,400,name);console.log('PASS rejected: '+name);
 }
 assert.equal((await request('/api/project','PUT',{project:initial.project,revision:initial.revision},{Origin:'http://foreign.example'})).status,403);
 assert.equal((await request('/api/project','PUT',{project:initial.project,revision:'stale'})).status,409);
 assert.equal((await request('/api/project')).data.revision,initial.revision);
 const range=await fetch(base+'/'+initial.project.beats[0].audio.src,{headers:{Range:'bytes=0-31'}});
 assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,32);
 console.log('PASS origin, revision and audio range guards');
 const browser=await r('@remotion/renderer').openBrowser('chrome',{browserExecutable:browserExecutable(process.env.KNOWLEDGE_EDITOR_BROWSER)});
 try {
  const page=await browser.newPage({context:()=>null,logLevel:'error',indent:false,pageIndex:0,onBrowserLog:null,onLog:()=>{}});
  await page.setViewport({width:1440,height:1100,deviceScaleFactor:1});
  await page.goto({url:base,timeout:30000});await sleep(1500);
  const before=await page.evaluate(()=>document.querySelector('[data-character]').getBoundingClientRect().height);
  const set=async(label,value)=>{
   await page.evaluate(({label,value})=>{
    const el=document.querySelector(`[aria-label="${label}"]`);
    const proto=el instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
   },{label,value});await sleep(150);
  };
  const click=async(text)=>{
   await page.evaluate(text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);if(!b||b.disabled)throw new Error('Button unavailable: '+text);b.click();},text);
   await sleep(200);
  };
  const waitText=async(text,timeout=30000)=>{
   const deadline=Date.now()+timeout;
   while(Date.now()<deadline){if(await page.evaluate(text=>document.body.innerText.includes(text),text))return;await sleep(300);}
   throw new Error('Timed out: '+text+'\n'+await page.evaluate(()=>document.body.innerText));
  };
  await set('字幕','これ、実は\n正方形なんだよ。');
  await set('読み上げ文','これ、実は正方形なんだよ。');
  await set('声の速さ','1');await set('大きさ','.9');await set('左右の位置','20');await set('上下の位置','10');await set('セリフ後の間','.5');
  const after=await page.evaluate(()=>document.querySelector('[data-character]').getBoundingClientRect().height);
  assert(Math.abs(after/before-.9)<.02,'live character size');
  assert(await page.evaluate(()=>document.querySelector('.primary').disabled),'stale audio disables export');
  await click('保存');await waitText('台本を保存しました');
  await page.goto({url:base,timeout:30000});await sleep(1000);
  const fields=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('[aria-label]')].filter(e=>e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement).map(e=>[e.getAttribute('aria-label'),e.value])));
  assert.equal(fields['字幕'],'これ、実は\n正方形なんだよ。');assert.equal(fields['声の速さ'],'1');assert.equal(fields['大きさ'],'0.9');
  let saved=(await request('/api/project')).data;
  assert.equal(saved.project.beats[0].pauseSeconds,.5);
  assert.equal((await request('/api/jobs','POST',{type:'render',revision:saved.revision})).status,409);
  await click('↓ 後ろへ');await click('保存');await waitText('台本を保存しました');
  saved=(await request('/api/project')).data;assert.equal(saved.project.beats[1].id,'beat-01');
  await click('↑ 前へ');await click('保存');await waitText('台本を保存しました');
  console.log('PASS live edits, save/reload, scene order and stale audio gate');
  await click('音声を更新');await waitText('音声を更新しました',120000);
  saved=(await request('/api/project')).data;
  assert.equal(saved.project.beats[0].spokenText,'これ、実は正方形なんだよ。');
  assert.equal(saved.project.beats[0].voiceSpeed,1);
  assert(saved.project.beats[0].audio.src.startsWith('audio/editor/'));
  for(let i=1;i<6;i++)assert.equal(saved.project.beats[i].audio.src,initial.project.beats[i].audio.src);
  assert.equal(saved.project.beats[0].characterScale,.9);
  assert.equal(await page.evaluate(()=>document.querySelector('.primary').disabled),false);
  writeFileSync(dir+'/edited-project.json',JSON.stringify(saved.project,null,2));
  console.log('PASS voice regeneration preserves all edits and reuses unchanged audio');
  await click('動画を書き出す');
  await page.goto({url:base,timeout:30000});await sleep(1000);
  const active=(await request('/api/project')).data.activeJob;assert(active&&active.type==='render');
  assert.equal((await request('/api/project','PUT',{project:saved.project,revision:saved.revision})).status,409);
  assert.equal((await request('/api/jobs','POST',{type:'voice',revision:saved.revision})).status,409);
  assert(await page.evaluate(()=>document.querySelector('.primary').disabled));
  let last=-1,complete;
  for(let i=0;i<600;i++) {
   const job=(await request('/api/jobs/'+active.id)).data;
   if(Math.floor(job.progress/10)>last){last=Math.floor(job.progress/10);console.log('Render '+job.progress+'%');}
   if(job.status==='error')throw new Error(job.error);
   if(job.status==='done'){complete=job;break;}await sleep(1000);
  }
  assert(complete,'render completed');await waitText('MP4をダウンロード');
  const link=await page.evaluate(()=>document.querySelector('.download a').getAttribute('href'));
  assert.equal(link,complete.downloadUrl);
  const file=await fetch(base+link);assert.equal(file.status,200);
  assert(file.headers.get('content-disposition').includes('.mp4'));
  const bytes=Buffer.from(await file.arrayBuffer());assert(bytes.length>100000);
  writeFileSync(dir+'/edited.mp4',bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),createHash('sha256').update(readFileSync(root+'/output/editor/jobs/'+active.id+'/knowledge-anime.mp4')).digest('hex'));
  const shot=await page._client().send('Page.captureScreenshot',{format:'png'});
  writeFileSync(dir+'/edited-ui.png',Buffer.from(shot.value.data,'base64'));
  const current=(await request('/api/project')).data;
  assert.equal(current.revision,saved.revision);
  writeFileSync(dir+'/e2e.json',JSON.stringify({job:complete,downloadBytes:bytes.length,fields,guards:true,voiceGenerated:true,projectPreserved:true},null,2));
  console.log('PASS resumed progress, single-job guard, export and byte-identical browser download');
 } finally {await browser.close({silent:true});}
})().catch(error=>{console.error(error);process.exitCode=1;});
