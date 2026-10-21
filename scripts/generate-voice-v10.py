"""Generate V10 beat/scene VOICEVOX audio from the approved local runtime.

V10専用コピー（元: scripts/generate-voice-v8.py）。--project/--result/--output-dirのみ。
 共通public/assets/manifest.jsonには触れず、output-dir直下のmanifest.jsonへ書く。
 scene内のbeat WAVを順に、beat毎のpauseSeconds（0.3s）を間に挟んでscene WAVに合成する。
"""
import array
import argparse
import ctypes as C
import hashlib
import io
import json
import math
from pathlib import Path
import wave

ROOT = Path(__file__).resolve().parents[1]
RUNTIME = ROOT / '.voicevox/runtime'
DEST = ROOT / 'public/audio/longform-toyota01-v10'
REPORT = ROOT / 'output/longform-v10-review'
VOICES = {
    'ルーノ': {'name': '雨晴はう', 'style': 10, 'model': '0', 'speed': 1.04},
    'ミーノ': {'name': '櫻歌ミコ', 'style': 43, 'model': '11', 'speed': 1.06},
    'カーノ': {'name': '冥鳴ひまり', 'style': 14, 'model': '1', 'speed': 0.90},
    'ナレ2': {'name': '男声2', 'style': 10000, 'model': 'n0', 'speed': 1.04,
                'credit': 'VOICEVOX Nemo', 'licenseReference': 'https://voicevox.hiroshiba.jp/nemo/term/'},
}
EXPECTED = {'0': '917e592cae92a02fb7668bd9e168df4e39c8ab2f5302c2be71906c70ec4e2df2',
            '1': '8df20815be9a84a4b4723b9e778d2ef6a4df277e4872fe9efe29676a60e02774',
            '11': '46c209914812c13b1717331701d76491708448f90c7f8e87b5b286e5ca91341e',
            'n0': 'e91e2e6ed5cfa6940ff55b61234ba89c631fce3d0146c23685552e7f5d2fe437'}


def required_models(dialogue):
    models = {}
    for beat in dialogue['beats']:
        speaker = beat['speaker']
        if speaker not in VOICES:
            raise ValueError(f'Unknown speaker: {speaker}')
        number = VOICES[speaker]['model']
        models[number] = EXPECTED[number]
    return models


def voice_credit(voice):
    return voice.get('credit', f'VOICEVOX:{voice["name"]}')


def project_voice_credits(dialogue):
    return list(dict.fromkeys(voice_credit(VOICES[beat['speaker']]) for beat in dialogue['beats']))


def query_settings(beat, speed):
    settings = {'speedScale': speed}
    settings.update((key, beat[key]) for key in ('pitchScale', 'intonationScale') if key in beat)
    for key, value in settings.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError(f'{key} must be a finite number')
    if speed <= 0:
        raise ValueError('speedScale must be greater than zero')
    return settings


def generation_key(speaker, spoken, settings):
    # 任意のquery制御はキャッシュを無効化する（v8と同じ方法）
    values = [speaker, spoken, settings['speedScale']]
    overrides = {key: settings[key] for key in ('pitchScale', 'intonationScale') if key in settings}
    if overrides:
        values.append(overrides)
    return json.dumps(values, ensure_ascii=False, separators=(',', ':'))


class LoadRuntime(C.Structure):
    _fields_ = [('filename', C.c_char_p)]


class Initialize(C.Structure):
    _fields_ = [('acceleration_mode', C.c_int32), ('cpu_num_threads', C.c_uint16)]


class LoadModel(C.Structure):
    _fields_ = [('on_existing', C.c_int32)]


class Synthesis(C.Structure):
    _fields_ = [('enable_interrogative_upspeak', C.c_bool)]


def compose_scenes(dialogue, dest, pcm_clips):
    """beat PCMを順に、beatのpauseSecondsの間を挟んでscene WAVへ合成する。"""
    groups: dict[str, list[int]] = {}
    for index, beat in enumerate(dialogue['beats']):
        groups.setdefault(beat['sceneId'], []).append(index)
    audio_rel = str(dest.relative_to(ROOT / 'public'))
    comp = {}
    composed = []
    for sid, indexes in sorted(groups.items()):
        pcm = array.array('h')
        offsets = []
        for j, index in enumerate(indexes):
            offsets.append(len(pcm) / 24000)
            pcm.extend(pcm_clips[index])
            if j < len(indexes) - 1:
                pause = dialogue['beats'][index]['pauseSeconds']
                pcm.extend(array.array('h', bytes(round(24000 * pause) * 2)))
        name = f'scene-{sid}.wav'
        wav_path = dest / name
        with wave.open(str(wav_path), 'wb') as wav:
            wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
            wav.writeframes(pcm.tobytes())
        seconds = len(pcm) / 24000
        comp[sid] = {'file': f'{audio_rel}/{name}', 'seconds': seconds,
                     'beats': [{'id': dialogue['beats'][index]['id'], 'startSeconds': round(offset, 3)}
                               for index, offset in zip(indexes, offsets)]}
        composed.append({'file': comp[sid]['file'], 'speaker': 'composed',
                         'seconds': seconds, 'sha256': hashlib.sha256(wav_path.read_bytes()).hexdigest()})
        print(f'{name}: {seconds:.3f}s', flush=True)
    dialogue['sceneComposition'] = comp
    return composed


def main():
    global DEST, REPORT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, help='V10 voice project JSON')
    parser.add_argument('--result', type=Path, help='Updated voice project snapshot')
    parser.add_argument('--output-dir', type=Path, help='V10専用 public/audio directory')
    args = parser.parse_args()
    if not args.project or not args.result or not args.output_dir:
        parser.error('--project, --result, --output-dir が必須です（v10専用経路）')
    DEST = args.output_dir.resolve()
    DEST.relative_to(ROOT / 'public/audio')
    REPORT = args.result.resolve().parent
    REPORT.relative_to(ROOT / 'output')
    dialogue = json.loads(args.project.read_text(encoding='utf-8'))
    model_checksums = required_models(dialogue)
    DEST.mkdir(parents=True, exist_ok=True)
    REPORT.mkdir(parents=True, exist_ok=True)
    lib = C.CDLL(str(RUNTIME / 'c_api/lib/libvoicevox_core.so'))

    def bind(name, args_, result=C.c_int32):
        fn = getattr(lib, 'voicevox_' + name)
        fn.argtypes, fn.restype = args_, result
        return fn
    pointer = C.c_void_p
    out = C.POINTER(pointer)
    message = bind('error_result_to_message', [C.c_int32], C.c_char_p)

    def check(code):
        if code:
            raise RuntimeError(message(code).decode())
    load_runtime = bind('onnxruntime_load_once', [LoadRuntime, out])
    new_jtalk = bind('open_jtalk_rc_new', [C.c_char_p, out])
    new_synth = bind('synthesizer_new', [pointer, pointer, Initialize, out])
    open_model = bind('voice_model_file_open', [C.c_char_p, out])
    load_model = bind('synthesizer_load_voice_model', [pointer, pointer, LoadModel])
    default_model = bind('make_default_load_voice_model_options', [], LoadModel)
    query_fn = bind('synthesizer_create_audio_query', [pointer, C.c_char_p, C.c_uint32, out])
    synthesis = bind('synthesizer_synthesis', [pointer, C.c_char_p, C.c_uint32, Synthesis,
                                               C.POINTER(C.c_size_t), out])
    json_free = bind('json_free', [pointer], None)
    wav_free = bind('wav_free', [pointer], None)
    model_free = bind('voice_model_file_delete', [pointer], None)
    synth_free = bind('synthesizer_delete', [pointer], None)
    jtalk_free = bind('open_jtalk_rc_delete', [pointer], None)
    version = bind('get_version', [], C.c_char_p)().decode()
    runtime, jtalk, synth = pointer(), pointer(), pointer()
    check(load_runtime(LoadRuntime(str(RUNTIME / 'onnxruntime/lib/libvoicevox_onnxruntime.so.1.17.3').encode()), C.byref(runtime)))
    check(new_jtalk(str(RUNTIME / 'dict/open_jtalk_dic_utf_8-1.11').encode(), C.byref(jtalk)))
    try:
        check(new_synth(runtime, jtalk, Initialize(1, 2), C.byref(synth)))
        for number, expected in model_checksums.items():
            model_path = RUNTIME / f'models/vvms/{number}.vvm'
            assert hashlib.sha256(model_path.read_bytes()).hexdigest() == expected, model_path
            model = pointer()
            check(open_model(str(model_path).encode(), C.byref(model)))
            try:
                check(load_model(synth, model, default_model()))
            finally:
                model_free(model)
        results, pcm_clips = [], []
        for index, beat in enumerate(dialogue['beats']):
            voice = dict(VOICES[beat['speaker']])
            settings = query_settings(beat, beat['voiceSpeed'])
            spoken = beat['spokenText']
            name = f'{beat["id"]}.wav'
            wav_path = DEST / name
            generated_for = generation_key(beat['speaker'], spoken, settings)
            previous = beat.get('audio', {})
            previous_path = ROOT / 'public' / previous.get('src', 'missing.wav')
            reuse = previous.get('generatedFor') == generated_for and previous_path.is_file()
            if reuse:
                wav_path = previous_path
                wav_bytes = wav_path.read_bytes()
            else:
                query_ptr = pointer()
                check(query_fn(synth, spoken.encode(), voice['style'], C.byref(query_ptr)))
                try:
                    query = json.loads(C.string_at(query_ptr))
                finally:
                    json_free(query_ptr)
                query.update(settings)
                query.update(volumeScale=1.0, prePhonemeLength=0.02,
                             postPhonemeLength=0.04, outputSamplingRate=24000, outputStereo=False)
                (REPORT / name.replace('.wav', '-query.json')).write_text(json.dumps(query, ensure_ascii=False, indent=2) + '\n')
                size, wav_ptr = C.c_size_t(), pointer()
                check(synthesis(synth, json.dumps(query).encode(), voice['style'], Synthesis(True), C.byref(size), C.byref(wav_ptr)))
                try:
                    wav_bytes = C.string_at(wav_ptr, size.value)
                finally:
                    wav_free(wav_ptr)
            with wave.open(io.BytesIO(wav_bytes), 'rb') as wav:
                assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 24000)
                pcm = array.array('h', wav.readframes(wav.getnframes()))
            # 一貫したRMSレベルに正規化し、保守的なピーク上限を守る（時間伸縮なし）
            rms = math.sqrt(sum(x * x for x in pcm) / len(pcm)) / 32768
            peak = max(abs(x) for x in pcm) / 32768
            gain = 1 if reuse else min(0.12 / rms, 0.85 / peak)
            pcm = array.array('h', (round(x * gain) for x in pcm))
            if not reuse:
                with wave.open(str(wav_path), 'wb') as wav:
                    wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                    wav.writeframes(pcm.tobytes())
            seconds = len(pcm) / 24000
            beat.update(seconds=seconds, audio={'src': str(wav_path.relative_to(ROOT / 'public')),
                                                'seconds': seconds, 'generatedFor': generated_for})
            result = {'speaker': beat['speaker'], 'spokenText': spoken, 'voice': voice, 'querySettings': settings,
                      'seconds': seconds, 'frames': round(seconds * 30),
                      'peak': max(abs(x) for x in pcm) / 32768,
                      'rms': math.sqrt(sum(x * x for x in pcm) / len(pcm)) / 32768,
                      'file': str(wav_path.relative_to(ROOT / 'public')),
                      'sha256': hashlib.sha256(wav_path.read_bytes()).hexdigest()}
            results.append(result)
            pcm_clips.append(pcm)
            print(f'{index + 1}: {beat["speaker"]} {seconds:.3f}s', flush=True)
        scene_clips = compose_scenes(dialogue, DEST, pcm_clips)
        dialogue['voiceCredits'] = project_voice_credits(dialogue)
        args.result.write_text(json.dumps(dialogue, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (REPORT / 'voice-info.json').write_text(json.dumps({'coreVersion': version, 'modelRelease': '0.16.4',
            'modelSha256': model_checksums, 'provisional': True, 'clips': results,
            'sceneClips': [{'file': c['file'], 'seconds': c['seconds']} for c in scene_clips]},
            ensure_ascii=False, indent=2) + '\n')
        # V10専用manifest（共通public/assets/manifest.jsonには触れない）
        manifest_path = DEST / 'manifest.json'
        if manifest_path.is_file():
            manifest = json.loads(manifest_path.read_text())
        else:
            manifest = {'assets': []}
        existing = {asset['file']: asset for asset in manifest['assets']}
        for clip in results + scene_clips:
            if clip['file'] not in existing or existing[clip['file']].get('sha256') != clip['sha256']:
                existing.pop(clip['file'], None)
                manifest['assets'] = [a for a in manifest['assets'] if a['file'] != clip['file']]
                voice = clip.get('voice', {'name': '実尺合成（beat WAVの連結）', 'style': None, 'model': 'composed'})
                entry = {'file': clip['file'],
                         'type': 'voice-v10-scene' if clip['speaker'] == 'composed' else 'voice-v10',
                         'source': 'https://github.com/VOICEVOX/voicevox_vvm/releases/tag/0.16.4',
                         'coreVersion': version, 'voice': voice, 'speaker': clip['speaker'],
                         'credit': voice_credit(voice) if clip.get('voice') else 'beatWAV合成',
                         'sha256': clip['sha256'], 'seconds': clip['seconds'],
                         'approvalStatus': 'draft-v10',
                         'licenseReference': voice.get('licenseReference', 'sources/character-dialogue-voice.md')}
                manifest['assets'].append(entry)
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'manifest: {manifest_path.relative_to(ROOT)} assets={len(manifest["assets"])}')
    finally:
        if synth.value:
            synth_free(synth)
        if jtalk.value:
            jtalk_free(jtalk)


if __name__ == '__main__':
    main()
