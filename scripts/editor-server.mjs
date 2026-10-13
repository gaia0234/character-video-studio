import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {readFile, writeFile, rename, copyFile, mkdir, stat, realpath} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {editorProjectSchema, hasFreshAudio} from '../.editor/shared.mjs';

const root = process.cwd();
const projectPath = path.resolve(root, process.env.KNOWLEDGE_EDITOR_PROJECT ?? 'src/data/editor-project.json');
if (!projectPath.startsWith(root + path.sep)) throw new Error('Project must be inside this workspace');
const initial = editorProjectSchema.parse(JSON.parse(await readFile(projectPath, 'utf8')));
const port = Number(process.env.KNOWLEDGE_EDITOR_PORT ?? 3210);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Invalid editor port');
const jobs = new Map();
let activeJob;
let mutationInFlight = false;
let latestRender;
const fail = (status, message) => {throw Object.assign(new Error(message), {status});};
const revisionOf = value => createHash('sha256').update(value).digest('hex');
const load = async () => {
  const bytes = await readFile(projectPath);
  return {project: editorProjectSchema.parse(JSON.parse(bytes)), revision: revisionOf(bytes)};
};
const persist = async project => {
  const temporary = `${projectPath}.${randomUUID()}.tmp`;
  await mkdir(path.join(root, '.editor/backups'), {recursive: true});
  const previous = await readFile(projectPath);
  await copyFile(projectPath, path.join(root, '.editor/backups', `${revisionOf(previous)}.json`));
  await writeFile(temporary, JSON.stringify(project, null, 2) + '\n');
  await rename(temporary, projectPath);
  return load();
};
const json = (res, code, data) => {
  res.writeHead(code, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
  res.end(JSON.stringify(data));
};
const body = async req => {
  if (!req.headers['content-type']?.startsWith('application/json')) fail(415, 'JSON形式で送信してください');
  let bytes = 0, chunks = [];
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 1_000_000) fail(413, '台本が大きすぎます');
    chunks.push(chunk);
  }
  try {return JSON.parse(Buffer.concat(chunks));} catch {fail(400, '入力内容を読み取れません');}
};
const checkRevision = (expected, current) => {
  if (expected !== current) fail(409, '別の画面で更新されています。再読み込みしてから編集してください');
};
const checkProject = (input, current) => {
  const parsed = editorProjectSchema.safeParse(input);
  if (!parsed.success) fail(400, '入力値を確認してください。文字数・数値の範囲・場面IDが不正です');
  const project = parsed.data;
  for (const key of ['image', 'characters', 'voiceCredits']) {
    if (JSON.stringify(project[key]) !== JSON.stringify(initial[key])) fail(400, '採用済みの素材とクレジットは変更できません');
  }
  if (project.beats.length !== current.beats.length || project.beats.some(b => !current.beats.some(c => c.id === b.id)))
    fail(400, '場面IDが一致しません');
  for (const beat of project.beats) {
    const previous = current.beats.find(b => b.id === beat.id);
    if (JSON.stringify(beat.audio) !== JSON.stringify(previous.audio)) fail(400, '音声情報は音声生成ボタンで更新してください');
  }
  return project;
};
const run = (command, args, job) => new Promise((resolve, reject) => {
  const child = spawn(command, args, {cwd: root, stdio: ['ignore', 'pipe', 'pipe']});
  let log = '';
  const timer = setTimeout(() => {child.kill('SIGTERM');}, 15 * 60 * 1000);
  const collect = data => {
    const text = data.toString(); log = (log + text).slice(-4000);
    const matches = [...text.matchAll(/PROGRESS:([0-9.]+)/g)];
    if (matches.length) job.progress = Math.round(Number(matches.at(-1)[1]) * 100);
  };
  child.stdout.on('data', collect); child.stderr.on('data', collect);
  child.on('error', error => {clearTimeout(timer); reject(error);});
  child.on('close', code => {clearTimeout(timer); code === 0 ? resolve() : reject(new Error(log || `処理が終了しました (${code})`));});
});
const execute = async (job, saved) => {
  try {
    const directory = path.join(root, 'output/editor/jobs', job.id);
    await mkdir(directory, {recursive: true});
    const snapshot = path.join(directory, 'project.json');
    await writeFile(snapshot, JSON.stringify(saved.project, null, 2));
    job.status = 'running';
    if (job.type === 'voice') {
      const resultPath = path.join(directory, 'result.json');
      await run('python3', ['scripts/generate-dialogue-voice.py', '--project', snapshot, '--result', resultPath,
        '--output-dir', path.join(root, 'public/audio/editor', job.id)], job);
      const updated = editorProjectSchema.parse(JSON.parse(await readFile(resultPath, 'utf8')));
      checkRevision(saved.revision, (await load()).revision);
      await persist(updated);
      job.message = '音声を更新しました。プレビューで試聴できます';
    } else {
      await run(process.execPath, ['scripts/render-editor-video.mjs', snapshot, path.join(directory, 'knowledge-anime.mp4')], job);
      job.downloadUrl = `/api/download/${job.id}`;
      job.message = '動画を書き出しました';
    }
    job.status = 'done'; job.progress = 100;
    if (job.type === 'render') latestRender = {...job, revision: saved.revision};
  } catch (error) {
    job.status = 'error'; job.message = '処理に失敗しました'; job.error = error.message.slice(-2500);
    console.error(job.type, error.message);
  } finally {activeJob = undefined;}
};
const serveFile = async (req, res, filename, base, downloadName) => {
  const resolved = await realpath(filename).catch(() => fail(404, 'ファイルが見つかりません'));
  if (!resolved.startsWith((await realpath(base)) + path.sep)) fail(403, 'アクセスできません');
  const meta = await stat(resolved);
  if (!meta.isFile()) fail(404, 'ファイルが見つかりません');
  const types = {'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png',
    '.ttf':'font/ttf','.wav':'audio/wav','.mp4':'video/mp4'};
  const headers = {'Content-Type': types[path.extname(resolved)] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'};
  if (downloadName) headers['Content-Disposition'] = `attachment; filename="${downloadName}"`;
  let start = 0, end = meta.size - 1, status = 200;
  if (req.headers.range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range);
    if (!match) fail(416, '読み込み範囲が不正です');
    start = Number(match[1]); end = match[2] ? Math.min(Number(match[2]), end) : end;
    if (start > end || start >= meta.size) fail(416, '読み込み範囲が不正です');
    status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${meta.size}`;
  }
  headers['Content-Length'] = end - start + 1;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') res.end(); else createReadStream(resolved, {start, end}).pipe(res);
};
const server = createServer(async (req, res) => {
  let ownsMutation = false;
  try {
    const host = req.headers.host;
    if (![ `localhost:${port}`, `127.0.0.1:${port}` ].includes(host)) fail(403, 'ローカルの編集画面から接続してください');
    const url = new URL(req.url, `http://${host}`);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      if (req.headers.origin && req.headers.origin !== `http://${host}`) fail(403, '編集画面から操作してください');
      if (activeJob || mutationInFlight) fail(409, '現在の処理が終わるまでお待ちください');
      mutationInFlight = true; ownsMutation = true;
    }
    if (req.method === 'GET' && url.pathname === '/api/project') return json(res, 200, {...await load(), activeJob, latestRender});
    if (req.method === 'PUT' && url.pathname === '/api/project') {
      const input = await body(req), current = await load();
      checkRevision(input.revision, current.revision);
      const project = checkProject(input.project, current.project);
      return json(res, 200, await persist(project));
    }
    if (req.method === 'POST' && url.pathname === '/api/jobs') {
      const input = await body(req), saved = await load();
      checkRevision(input.revision, saved.revision);
      if (!['voice', 'render'].includes(input.type)) fail(400, '処理の種類が不正です');
      if (input.type === 'render' && saved.project.beats.some(beat => !hasFreshAudio(beat)))
        fail(409, '先に音声を更新してください');
      const job = {id: randomUUID(), type: input.type, status: 'queued', progress: 0, message: input.type === 'voice' ? '音声を生成しています' : '動画を書き出しています'};
      activeJob = job; jobs.set(job.id, job);
      json(res, 202, job); void execute(job, saved); return;
    }
    if (req.method === 'GET' && url.pathname.startsWith('/api/jobs/')) {
      const job = jobs.get(url.pathname.slice('/api/jobs/'.length));
      if (!job) fail(404, '処理が見つかりません');
      return json(res, 200, job);
    }
    if (req.method === 'GET' && /^\/api\/download\/[a-f0-9-]{36}$/.test(url.pathname)) {
      const id = url.pathname.split('/').at(-1);
      const filename = path.join(root, 'output/editor/jobs', id, 'knowledge-anime.mp4');
      return await serveFile(req, res, filename, path.join(root,'output/editor/jobs'), `knowledge-anime-${id.slice(0,8)}.mp4`);
    }
    if (!['GET', 'HEAD'].includes(req.method)) fail(404, '操作が見つかりません');
    if (url.pathname === '/') {
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control':'no-store'});
      res.end(await readFile(path.join(root, 'src/editor/index.html'))); return;
    }
    if (url.pathname === '/favicon.ico') {res.writeHead(204); res.end(); return;}
    if (['/app.js', '/app.css'].includes(url.pathname))
      return await serveFile(req, res, path.join(root, '.editor', url.pathname.slice(1)), path.join(root, '.editor'));
    if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/audio/'))
      return await serveFile(req, res, path.resolve(root, 'public', '.' + decodeURIComponent(url.pathname)), path.join(root,'public'));
    fail(404, 'ページが見つかりません');
  } catch (error) {if (!res.headersSent) json(res, error.status ?? 500, {error: error.status ? error.message : '処理に失敗しました。サーバーの表示を確認してください'}); else res.destroy();}
  finally {if (ownsMutation) mutationInFlight = false;}
});
server.listen(port, '127.0.0.1', () => console.log(`Knowledge Anime Editor: http://127.0.0.1:${port}`));
server.on('error', error => {console.error(error.message); process.exitCode = 1;});
