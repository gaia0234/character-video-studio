import {useEffect, useMemo, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {CharacterDialogue} from '../CharacterDialogue';
import {dialogueDuration} from '../data/characterDialogue';
import {hasFreshAudio, projectToDialogue, type EditorBeat, type EditorProject} from '../data/editorProject';
import './style.css';

type Job = {id: string; type: 'voice' | 'render'; status: 'queued' | 'running' | 'done' | 'error';
  progress: number; message: string; error?: string; downloadUrl?: string; revision?: string};
type Saved = {project: EditorProject; revision: string; activeJob?: Job; latestRender?: Job};
const api = async <T,>(url: string, method = 'GET', body?: unknown): Promise<T> => {
  const response = await fetch(url, {method, headers: body ? {'Content-Type': 'application/json'} : undefined,
    body: body ? JSON.stringify(body) : undefined});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? '処理に失敗しました');
  return data as T;
};
const Range = ({label, value, min, max, step, unit = '', onChange}: {
  label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (value: number) => void;
}) => <label className="range-field"><span>{label}<output>{step < 1 ? value.toFixed(step === .01 ? 2 : 1) : Math.round(value)}{unit}</output></span>
  <input type="range" aria-label={label} min={min} max={max} step={step} value={value}
    onChange={event => onChange(Number(event.target.value))} /></label>;

const App = () => {
  const [project, setProject] = useState<EditorProject>();
  const [revision, setRevision] = useState('');
  const [savedText, setSavedText] = useState('');
  const [selected, setSelected] = useState('beat-01');
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<Job>();
  const [download, setDownload] = useState<Job>();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const player = useRef<PlayerRef>(null);
  const signature = project ? JSON.stringify(project) : '';
  const dirty = Boolean(project && signature !== savedText);
  const processing = busy || job?.status === 'queued' || job?.status === 'running';
  const applySaved = (data: Saved) => {
    setProject(data.project); setRevision(data.revision); setSavedText(JSON.stringify(data.project));
  };
  useEffect(() => {
    api<Saved>('/api/project').then(data => {
      applySaved(data); setJob(data.activeJob); setDownload(data.latestRender);
    }).catch(error => setError(error.message));
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {event.preventDefault();};
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!job || !['queued', 'running'].includes(job.status)) return;
    let stopped = false, timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const next = await api<Job>(`/api/jobs/${job.id}`);
        if (stopped) return;
        if (next.status === 'done') {
          const data = await api<Saved>('/api/project');
          if (stopped) return;
          applySaved(data); setJob(next); setMessage(next.message);
          if (next.type === 'render') setDownload({...next, revision: data.revision});
        } else if (next.status === 'error') {setJob(next); setError(next.error ?? next.message);}
        else {setJob(next); timer = setTimeout(poll, 1000);}
      } catch (error) {if (!stopped) {setError((error as Error).message); timer = setTimeout(poll, 3000);}}
    };
    timer = setTimeout(poll, 500);
    return () => {stopped = true; clearTimeout(timer);};
  }, [job?.id, job?.status]);
  const dialogue = useMemo(() => project ? projectToDialogue(project) : undefined, [project]);
  const duration = dialogue ? dialogueDuration(dialogue) : 1;
  const selectedIndex = project?.beats.findIndex(beat => beat.id === selected) ?? 0;
  const beat = project?.beats[Math.max(0, selectedIndex)];
  const offsets = dialogue?.beats.map((_, index) => dialogue.beats.slice(0, index).reduce((sum,b) => sum + Math.round(b.seconds * 30), 0)) ?? [];
  useEffect(() => {
    if (!dialogue) return;
    player.current?.pause();
    player.current?.seekTo(Math.min(duration - 1, offsets[Math.max(0, selectedIndex)] + 45));
  }, [selected, selectedIndex, duration]);
  const updateBeat = (change: Partial<EditorBeat>) => {
    if (!project || !beat) return;
    setProject({...project, beats: project.beats.map(b => b.id === beat.id ? {...b, ...change} : b)});
    setMessage(''); setError('');
  };
  const save = async () => {
    if (!project) throw new Error('台本が読み込まれていません');
    if (!dirty) return {project, revision};
    const saved = await api<Saved>('/api/project', 'PUT', {project, revision});
    applySaved(saved); return saved;
  };
  const saveClick = async () => {
    setBusy(true); setError('');
    try {await save(); setMessage('台本を保存しました');}
    catch (error) {setError((error as Error).message);}
    finally {setBusy(false);}
  };
  const startJob = async (type: Job['type']) => {
    setBusy(true); setError(''); setMessage(''); player.current?.pause();
    try {
      const saved = await save();
      const created = await api<Job>('/api/jobs', 'POST', {type, revision: saved.revision});
      setJob(created);
    } catch (error) {setError((error as Error).message);}
    finally {setBusy(false);}
  };
  const move = (direction: number) => {
    if (!project) return;
    const index = Math.max(0, selectedIndex), target = index + direction;
    if (target < 0 || target >= project.beats.length) return;
    const beats = [...project.beats]; [beats[index], beats[target]] = [beats[target], beats[index]];
    setProject({...project, beats});
  };
  const staleCount = project?.beats.filter(b => !hasFreshAudio(b)).length ?? 0;
  if (!project || !dialogue || !beat) return <main className="loading">{error || '編集室を開いています…'}</main>;
  return <>
    <header className="app-header"><div className="brand"><span className="brand-mark">✧</span><div>KNOWLEDGE ANIME<small>編集室</small></div></div>
      <div className="header-actions"><span className={dirty ? 'save-state unsaved' : 'save-state'}>{dirty ? '未保存の変更' : '保存済み'}</span>
        <button onClick={saveClick} disabled={!dirty || processing}>保存</button>
        <button onClick={() => startJob('voice')} disabled={processing}>音声を更新</button>
        <button className="primary" onClick={() => startJob('render')} disabled={processing || staleCount > 0}>動画を書き出す</button></div>
    </header>
    <div className="project-bar"><label>プロジェクト名<input aria-label="プロジェクト名" value={project.title} maxLength={60} disabled={processing}
      onChange={event => setProject({...project, title: event.target.value})} /></label>
      <div className="project-meta"><span>1080 × 1920</span><span>30 fps</span><strong>{(duration / 30).toFixed(1)} 秒</strong></div></div>
    <div className="notices" aria-live="polite">
      {error ? <div className="notice error" role="alert">{error}</div> : null}
      {processing ? <div className="notice progress"><span>{busy ? '保存しています…' : job?.message}</span>
        {!busy && job?.type === 'render' ? <><progress max={100} value={job.progress} /><b>{job.progress}%</b></> : null}</div> : null}
      {!processing && message ? <div className="notice success">{message}</div> : null}
      {!processing && staleCount > 0 ? <div className="notice attention">{staleCount}場面の読み上げが変更されています。「音声を更新」で反映してください。</div> : null}
      {download?.downloadUrl && !processing ? <div className="notice download"><span>{dirty || download.revision !== revision ? '前回書き出した動画' : '書き出した動画'}</span>
        <a href={download.downloadUrl} download>MP4をダウンロード ↓</a></div> : null}
    </div>
    <main className="workspace">
      <aside className="scene-panel panel"><div className="panel-heading"><h2>場面</h2><span>{project.beats.length} シーン</span></div>
        <div className="scene-list">{project.beats.map((b,index) => <button className={`scene-card ${selected === b.id ? 'selected' : ''}`} key={b.id}
          disabled={processing} onClick={() => setSelected(b.id)} aria-pressed={selected === b.id}>
          <span className={`speaker-dot speaker-${b.speaker}`} /><div><div className="scene-meta"><strong>{String(index+1).padStart(2,'0')} · {b.speaker}</strong>
          <small>{(offsets[index] / 30).toFixed(1)}s</small></div><p>{b.text.replace(/\n/g,' ')}</p>
          {!hasFreshAudio(b) ? <small className="needs-audio">音声の更新が必要</small> : null}</div></button>)}</div>
        <div className="reorder"><button disabled={processing || selectedIndex <= 0} onClick={() => move(-1)}>↑ 前へ</button>
          <button disabled={processing || selectedIndex >= project.beats.length - 1} onClick={() => move(1)}>↓ 後ろへ</button></div>
      </aside>
      <section className="preview-panel"><div className="preview-heading"><h2>プレビュー</h2><span>場面 {selectedIndex + 1}</span></div>
        <div className="player-wrap"><Player ref={player} component={CharacterDialogue} inputProps={{dialogue}}
          durationInFrames={duration} fps={30} compositionWidth={1080} compositionHeight={1920} controls
          style={{width: '100%', aspectRatio: '9 / 16'}} /></div>
        <button className="scene-preview" disabled={processing} onClick={() => {player.current?.seekTo(offsets[selectedIndex]); player.current?.play();}}>この場面から再生 ▶</button>
        <p className="preview-help">変更はすぐに表示されます。音声の変更は「音声を更新」で反映します。</p>
      </section>
      <section className="edit-panel panel"><div className="panel-heading"><h2>場面 {selectedIndex + 1} を編集</h2><span>{beat.speaker}</span></div>
        <fieldset disabled={processing}><label className="field">話すキャラクター<select aria-label="話すキャラクター" value={beat.speaker}
          onChange={event => updateBeat({speaker: event.target.value as EditorBeat['speaker']})}>
          {Object.keys(project.characters).map(speaker => <option key={speaker}>{speaker}</option>)}</select></label>
        <label className="field">字幕<textarea aria-label="字幕" rows={3} maxLength={150} value={beat.text}
          onChange={event => updateBeat({text: event.target.value})} /><small>改行した位置で、字幕も改行します。</small></label>
        <label className="field">読み上げ文<textarea aria-label="読み上げ文" rows={3} maxLength={300} value={beat.spokenText}
          onChange={event => updateBeat({spokenText: event.target.value})} /><small>「１：１」などの表記は「いち対いち」と入力できます。</small></label>
        <div className="control-section"><h3>声と間</h3>
          <Range label="声の速さ" value={beat.voiceSpeed} min={.7} max={1.4} step={.01} unit=" 倍" onChange={voiceSpeed => updateBeat({voiceSpeed})} />
          <Range label="セリフ後の間" value={beat.pauseSeconds} min={.3} max={3} step={.1} unit=" 秒" onChange={pauseSeconds => updateBeat({pauseSeconds})} />
          {beat.stage !== 'character' ? <Range label="情報を見る時間" value={beat.holdSeconds} min={0} max={5} step={.1} unit=" 秒" onChange={holdSeconds => updateBeat({holdSeconds})} /> : null}
        </div>
        <div className="control-section"><h3>キャラクター</h3>
          <Range label="大きさ" value={beat.characterScale} min={.6} max={1.15} step={.01} unit=" 倍" onChange={characterScale => updateBeat({characterScale})} />
          <Range label="左右の位置" value={beat.characterX} min={-100} max={100} step={1} onChange={characterX => updateBeat({characterX})} />
          <Range label="上下の位置" value={beat.characterY} min={-100} max={100} step={1} onChange={characterY => updateBeat({characterY})} />
        </div></fieldset>
      </section>
    </main>
    <footer>台本を保存 → 音声を更新 → 動画を書き出す</footer>
  </>;
};
createRoot(document.getElementById('root')!).render(<App />);
