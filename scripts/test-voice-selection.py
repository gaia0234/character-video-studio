import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('dialogue_voice', ROOT / 'scripts/generate-dialogue-voice.py')
voice = importlib.util.module_from_spec(spec)
spec.loader.exec_module(voice)


class VoiceSelectionTest(unittest.TestCase):
    def test_legacy_voice_settings_are_preserved(self):
        self.assertEqual({name: voice.VOICES[name] for name in ['ルーノ', 'ミーノ', 'カーノ']}, {
            'ルーノ': {'name': '雨晴はう', 'style': 10, 'model': '0', 'speed': 1.04},
            'ミーノ': {'name': '櫻歌ミコ', 'style': 43, 'model': '11', 'speed': 1.06},
            'カーノ': {'name': '冥鳴ひまり', 'style': 14, 'model': '1', 'speed': 0.90},
        })

    def test_narration_loads_only_nemo_and_credits_nemo(self):
        dialogue = {'beats': [{'speaker': 'ナレーター'}, {'speaker': 'ナレーター'}]}
        self.assertEqual(set(voice.required_models(dialogue)), {'n0'})
        self.assertEqual(voice.project_voice_credits(dialogue), ['VOICEVOX Nemo'])
        self.assertEqual(voice.VOICES['ナレーター']['style'], 10001)

    def test_character_job_does_not_require_new_nemo_model(self):
        dialogue = {'beats': [{'speaker': name} for name in ['ルーノ', 'ミーノ', 'カーノ', 'ルーノ']]}
        self.assertEqual(set(voice.required_models(dialogue)), {'0', '1', '11'})
        self.assertEqual(voice.project_voice_credits(dialogue), [
            'VOICEVOX:雨晴はう', 'VOICEVOX:櫻歌ミコ', 'VOICEVOX:冥鳴ひまり'])

    def test_unknown_speaker_is_rejected_before_loading_runtime(self):
        with self.assertRaisesRegex(ValueError, 'Unknown speaker'):
            voice.required_models({'beats': [{'speaker': 'unknown'}]})


if __name__ == '__main__':
    unittest.main()
