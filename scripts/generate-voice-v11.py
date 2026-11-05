"""V11固定台本の発話音声を既存ローカルVOICEVOX runtimeで生成する。V10専用コピー（v10のctypes経路）。

  python3 scripts/generate-voice-v11.py --project src/data/longform/toyota01-v11.json \
      --result src/data/longform/toyota01-v11-voice.json \
      --output-dir public/audio/longform-toyota01-v11 --report output/longform-v11-review

共通public/assets/manifest.jsonには触れず、output-dir直下のmanifest.jsonへ書く。
キャッシュキーは話者だけでなくmodel/style/query設定も含む（同一話者で声設定が変われば再生成）。
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
VOICES = {
    'ホーマー': {'name': '玄野武宏', 'style': 39, 'model': '10', 'speed': 1.0},
    'ジャッド': {'name': '青山龍星', 'style': 82, 'model': '15', 'speed': 1.0},
    'ケント': {'name': '雀松朱司', 'style': 52, 'model': '12', 'speed': 1.0},
    'ナレ2': {'name': '男声2', 'style': 10000, 'model': 'n0', 'speed': 1.04,
              'credit': 'VOICEVOX Nemo', 'licenseReference': 'https://voicevox.hiroshiba.jp/nemo/term/'},
}
# 兄弟記録 ../knowledge-anime-character-system/materials/男声試聴-2026-10-20/voice-info.json と一致
EXPECTED = {'10': 'b5f8a97c0b6be2b8eaa6f2c1af88b2e06f9072bb82dddd4e1b3a05e9de0c04d4',
            '12': '5961b7f7eecec1be9eb38c0868898483d9582e490e9d9631dca9ea5018bd0e70',
            '15': '1caa2a42417f6b9bbb1a3c8ec1370724d7e153862b4d12f8c317c4e37cea786f',
            'n0': 'e91e2e6ed5cfa6940ff55b61234ba89c631fce3d0146c23685552e7f5d2fe437'}


def required_models(project):
    models = {}
    for scene in project['scenes']:
        for line in scene['lines']:
            speaker = line['speaker']
            if speaker not in VOICES:
                raise ValueError(f'Unknown speaker: {speaker}')
            number = VOICES[speaker]['model']
            models[number] = EXPECTED[number]
    return models


def voice_credit(voice):
    return voice.get('credit', f'VOICEVOX:{voice["name"]}')


def query_settings(line, speed):
    settings = {'speedScale': speed}
    settings.update((key, line[key]) for key in ('pitchScale', 'intonationScale') if key in line)
    for key, value in settings.items():
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            raise ValueError(f'{key} must be a finite number')
    if speed <= 0:
        raise ValueError('speedScale must be greater than zero')
    return settings


def generation_key(speaker, voice, spoken, settings):
    """話者だけでなくmodel/style/query設定もキャッシュキーに含める。"""
    values = [speaker, voice['model'], voice['style'], spoken, settings['speedScale']]
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--project', type=Path, required=True)
    parser.add_argument('--result', type=Path, required=True)
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--report', type=Path, default=ROOT / 'output/longform-v11-review')
    args = parser.parse_args()
    dest = args.output_dir.resolve()
    dest.relative_to(ROOT / 'public/audio')
    report = args.report.resolve()
    report.relative_to(ROOT / 'output')
    project = json.loads(args.project.read_text(encoding='utf-8'))
    model_checksums = required_models(project)
    dest.mkdir(parents=True, exist_ok=True)
    report.mkdir(parents=True, exist_ok=True)
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
    results = []
    try:
        check(new_synth(runtime, jtalk, Initialize(1, 2), C.byref(synth)))
        for number, expected in model_checksums.items():
            model_path = RUNTIME / f'models/vvms/{number}.vvm'
            actual = hashlib.sha256(model_path.read_bytes()).hexdigest()
            if actual != expected:
                raise RuntimeError(f'model SHA不一致: {model_path} {actual} != {expected}')
            model = pointer()
            check(open_model(str(model_path).encode(), C.byref(model)))
            try:
                check(load_model(synth, model, default_model()))
            finally:
                model_free(model)
        for scene in project['scenes']:
            pcm_clips = []
            for line in scene['lines']:
                voice = dict(VOICES[line['speaker']])
                settings = query_settings(line, line['voiceSpeed'])
                spoken = line['spokenText']
                name = f'{line["id"]}.wav'
                wav_path = dest / name
                generated_for = generation_key(line['speaker'], voice, spoken, settings)
                previous = line.get('audio', {})
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
                    (report / name.replace('.wav', '-query.json')).write_text(
                        json.dumps(query, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
                    size, wav_ptr = C.c_size_t(), pointer()
                    check(synthesis(synth, json.dumps(query).encode(), voice['style'], Synthesis(True),
                                    C.byref(size), C.byref(wav_ptr)))
                    try:
                        wav_bytes = C.string_at(wav_ptr, size.value)
                    finally:
                        wav_free(wav_ptr)
                with wave.open(io.BytesIO(wav_bytes), 'rb') as wav:
                    assert (wav.getnchannels(), wav.getsampwidth(), wav.getframerate()) == (1, 2, 24000)
                    pcm = array.array('h', wav.readframes(wav.getnframes()))
                rms = math.sqrt(sum(x * x for x in pcm) / len(pcm)) / 32768
                peak = max(abs(x) for x in pcm) / 32768
                gain = 1 if reuse else min(0.12 / rms, 0.85 / peak)
                pcm = array.array('h', (round(x * gain) for x in pcm))
                if not reuse:
                    with wave.open(str(wav_path), 'wb') as wav:
                        wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                        wav.writeframes(pcm.tobytes())
                seconds = len(pcm) / 24000
                line.update(seconds=seconds,
                            audio={'src': str(wav_path.relative_to(ROOT / 'public')),
                                   'seconds': seconds, 'generatedFor': generated_for})
                results.append({'lineId': line['id'], 'sceneId': scene['id'], 'part': scene['part'],
                                'speaker': line['speaker'], 'spokenText': spoken, 'voice': voice,
                                'querySettings': settings, 'seconds': seconds,
                                'peak': max(abs(x) for x in pcm) / 32768,
                                'rms': math.sqrt(sum(x * x for x in pcm) / len(pcm)) / 32768,
                                'file': str(wav_path.relative_to(ROOT / 'public')),
                                'sha256': hashlib.sha256(wav_path.read_bytes()).hexdigest()})
                pcm_clips.append(pcm)
                print(f'{line["id"]}: {line["speaker"]} {seconds:.3f}s', flush=True)
            # scene WAV（発話＋pauseAfterの合成）
            pcm = array.array('h')
            offsets = []
            for index, (line, clip) in enumerate(zip(scene['lines'], pcm_clips)):
                offsets.append(len(pcm) / 24000)
                pcm.extend(clip)
                if index < len(scene['lines']) - 1:
                    pcm.extend(array.array('h', bytes(round(24000 * line['pauseAfter']) * 2)))
            name = f'scene-{scene["id"]}.wav'
            wav_path = dest / name
            with wave.open(str(wav_path), 'wb') as wav:
                wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                wav.writeframes(pcm.tobytes())
            seconds = len(pcm) / 24000
            scene['audio'] = {'src': str(wav_path.relative_to(ROOT / 'public')), 'seconds': seconds,
                              'sha256': hashlib.sha256(wav_path.read_bytes()).hexdigest(),
                              'lineOffsets': [{'lineId': scene['lines'][i]['id'],
                                               'startSecond': round(off, 3)}
                                              for i, off in enumerate(offsets)]}
            print(f'{name}: {seconds:.3f}s', flush=True)
        project['voiceCredits'] = list(dict.fromkeys(voice_credit(VOICES[line['speaker']]) for scene in project['scenes'] for line in scene['lines']))
        args.result.write_text(json.dumps(project, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (report / 'voice-info.json').write_text(json.dumps(
            {'coreVersion': version, 'modelRelease': '0.16.4', 'modelSha256': model_checksums,
             'clips': results,
             'scenes': [{'id': s['id'], 'part': s['part'], 'audio': s['audio']} for s in project['scenes']]},
            ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        manifest_path = dest / 'manifest.json'
        if manifest_path.is_file():
            manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
        else:
            manifest = {'assets': []}
        existing = {asset['file']: asset for asset in manifest['assets']}
        entries = []
        for clip in results:
            entries.append({'file': clip['file'], 'type': 'voice-v11', 'source':
                            'https://github.com/VOICEVOX/voicevox_vvm/releases/tag/0.16.4',
                            'coreVersion': version, 'voice': clip['voice'], 'speaker': clip['speaker'],
                            'credit': voice_credit(clip['voice']), 'sha256': clip['sha256'],
                            'seconds': clip['seconds'], 'approvalStatus': 'draft-v11',
                            'licenseReference': clip['voice'].get('licenseReference',
                                                                 'sources/elder-channel-characters.md')})
        for scene in project['scenes']:
            entries.append({'file': scene['audio']['src'], 'type': 'voice-v11-scene',
                            'source': 'https://github.com/VOICEVOX/voicevox_vvm/releases/tag/0.16.4',
                            'coreVersion': version, 'voice': {'name': '実尺合成（発話WAVの連結）',
                                                               'style': None, 'model': 'composed'},
                            'speaker': 'composed', 'credit': '発話WAV合成', 'sha256': scene['audio']['sha256'],
                            'seconds': scene['audio']['seconds'], 'approvalStatus': 'draft-v11',
                            'licenseReference': 'sources/elder-channel-characters.md'})
        for entry in entries:
            if entry['file'] not in existing or existing[entry['file']].get('sha256') != entry['sha256']:
                manifest['assets'] = [a for a in manifest['assets'] if a['file'] != entry['file']]
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
