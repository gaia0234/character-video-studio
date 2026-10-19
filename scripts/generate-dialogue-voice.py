"""Generate the approved local VOICEVOX audition; Python standard library only."""
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
DEST = ROOT / 'public/audio/character-dialogue-v1'
REPORT = ROOT / 'output/character-dialogue-voice'
VOICES = {
    'ルーノ': {'name': '雨晴はう', 'style': 10, 'model': '0', 'speed': 1.04},
    'ミーノ': {'name': '櫻歌ミコ', 'style': 43, 'model': '11', 'speed': 1.06},
    'カーノ': {'name': '冥鳴ひまり', 'style': 14, 'model': '1', 'speed': 0.90},
    'ナレーター': {'name': '男声1', 'style': 10001, 'model': 'n0', 'speed': 0.99,
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

class LoadRuntime(C.Structure):
    _fields_ = [('filename', C.c_char_p)]

class Initialize(C.Structure):
    _fields_ = [('acceleration_mode', C.c_int32), ('cpu_num_threads', C.c_uint16)]

class LoadModel(C.Structure):
    _fields_ = [('on_existing', C.c_int32)]

class Synthesis(C.Structure):
    _fields_ = [('enable_interrogative_upspeak', C.c_bool)]

def main():
    global DEST, REPORT
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--speaker', choices=VOICES, help='Regenerate only this speaker; reuse the other WAVs')
    parser.add_argument('--project', type=Path, help='Saved editor project (no hardcoded dialogue overrides)')
    parser.add_argument('--result', type=Path, help='Updated editor project snapshot')
    parser.add_argument('--output-dir', type=Path, help='Unique public/audio directory for this editor job')
    args = parser.parse_args()
    if args.project:
        if not args.result or not args.output_dir or args.speaker:
            parser.error('--project requires --result and --output-dir; do not combine with --speaker')
        DEST = args.output_dir.resolve()
        DEST.relative_to(ROOT / 'public/audio')
        REPORT = args.result.resolve().parent
        REPORT.relative_to(ROOT / 'output')
    dialogue = json.loads((args.project or ROOT / 'src/data/tests/character-dialogue.json').read_text())
    model_checksums = required_models(dialogue)
    DEST.mkdir(parents=True, exist_ok=True)
    REPORT.mkdir(parents=True, exist_ok=True)
    lib = C.CDLL(str(RUNTIME / 'c_api/lib/libvoicevox_core.so'))
    def bind(name, args, result=C.c_int32):
        fn = getattr(lib, 'voicevox_' + name)
        fn.argtypes, fn.restype = args, result
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
            if args.project:
                voice['speed'] = beat['voiceSpeed']
            spoken = beat['spokenText'] if args.project else beat['text'].replace('\n', '').replace('１：１', 'いち対いち')
            if not args.project and beat['speaker'] == 'カーノ':
                spoken = '画面は縦長。画像は、いち対いち。縦と横が同じ長さだね。'
                beat['text'] = '画面は縦長。\n画像は１：１。\n縦と横が同じ長さだね。'
            name = f'{beat["id"]}.wav' if args.project else f'beat-{index + 1:02}.wav'
            wav_path = DEST / name
            reuse = args.speaker is not None and args.speaker != beat['speaker']
            generated_for = json.dumps([beat['speaker'], spoken, voice['speed']], ensure_ascii=False, separators=(',', ':'))
            if args.project:
                previous = beat.get('audio', {})
                previous_path = ROOT / 'public' / previous.get('src', 'missing.wav')
                reuse = previous.get('generatedFor') == generated_for and previous_path.is_file()
                if reuse:
                    wav_path = previous_path
            if reuse:
                wav_bytes = wav_path.read_bytes()
            else:
                query_ptr = pointer()
                check(query_fn(synth, spoken.encode(), voice['style'], C.byref(query_ptr)))
                try:
                    query = json.loads(C.string_at(query_ptr))
                finally:
                    json_free(query_ptr)
                query.update(speedScale=voice['speed'], volumeScale=1.0, prePhonemeLength=0.02,
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
            # Consistent RMS level, with a conservative peak ceiling; no time stretching.
            rms = math.sqrt(sum(x*x for x in pcm) / len(pcm)) / 32768
            peak = max(abs(x) for x in pcm) / 32768
            gain = 1 if reuse else min(0.12 / rms, 0.85 / peak)
            pcm = array.array('h', (round(x * gain) for x in pcm))
            if not reuse:
                with wave.open(str(wav_path), 'wb') as wav:
                    wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                    wav.writeframes(pcm.tobytes())
            seconds = len(pcm) / 24000
            # 0.3s entrance + speech + 0.3s reaction pause, rounded up to video frames.
            frames = math.ceil((0.3 + seconds + (beat['pauseSeconds'] + beat['holdSeconds'] if args.project else 0.3)) * 30 - 1e-6)
            beat.update(seconds=frames / 30, audio={'src': str(wav_path.relative_to(ROOT / 'public')),
                        'seconds': seconds, 'startSeconds': 0.3}, spokenText=spoken)
            if args.project:
                beat['audio']['generatedFor'] = generated_for
                del beat['audio']['startSeconds']
            result = {'speaker': beat['speaker'], 'spokenText': spoken, 'voice': voice,
                      'seconds': seconds, 'frames': frames, 'peak': max(abs(x) for x in pcm)/32768,
                      'rms': math.sqrt(sum(x*x for x in pcm) / len(pcm)) / 32768,
                      'file': str(wav_path.relative_to(ROOT / 'public')),
                      'sha256': hashlib.sha256(wav_path.read_bytes()).hexdigest()}
            results.append(result)
            pcm_clips.append(pcm)
            print(f'{index + 1}: {beat["speaker"]} {seconds:.3f}s', flush=True)
        # Give information reveals one extra second; do not pad short speech to 30s.
        if not args.project:
            for index in [1, 3]:
                dialogue['beats'][index]['seconds'] += 1
        dialogue['voiceCredits'] = project_voice_credits(dialogue)
        (args.result or ROOT / 'src/data/tests/character-dialogue-voice.json').write_text(json.dumps(dialogue, ensure_ascii=False, indent=2) + '\n')
        if not args.project:
            with wave.open(str(REPORT / 'voice-audition.wav'), 'wb') as wav:
                wav.setparams((1, 2, 24000, 0, 'NONE', 'not compressed'))
                for index in [0, 2, 4]:
                    wav.writeframes(pcm_clips[index].tobytes())
                    wav.writeframes(bytes(24000 * 2 * 1))
        (REPORT / 'voice-info.json').write_text(json.dumps({'coreVersion': version, 'modelRelease': '0.16.4',
            'modelSha256': model_checksums, 'provisional': True, 'clips': results,
            'timelineFrames': sum(round(b['seconds'] * 30) for b in dialogue['beats'])}, ensure_ascii=False, indent=2) + '\n')
        manifest_path = ROOT / 'public/assets/manifest.json'
        manifest = json.loads(manifest_path.read_text())
        files = {result['file'] for result in results}
        if args.project:
            existing = {asset['file']: asset for asset in manifest['assets']}
            files = {result['file'] for result in results if
                     existing.get(result['file'], {}).get('sha256') != result['sha256']}
        manifest['assets'] = [a for a in manifest['assets'] if a['file'] not in files]
        for index, result in enumerate(results):
            if result['file'] not in files:
                continue
            manifest['assets'].append({'file': result['file'],
                'type': 'voice-test', 'source': 'https://github.com/VOICEVOX/voicevox_vvm/releases/tag/0.16.4',
                'coreVersion': version, 'voice': result['voice'], 'speaker': result['speaker'],
                'credit': voice_credit(result['voice']), 'sha256': result['sha256'],
                'seconds': result['seconds'], 'approvalStatus': 'test-only',
                'licenseReference': result['voice'].get('licenseReference', 'sources/character-dialogue-voice.md')})
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    finally:
        if synth.value:
            synth_free(synth)
        if jtalk.value:
            jtalk_free(jtalk)

if __name__ == '__main__':
    main()
