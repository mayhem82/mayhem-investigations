"""Check the published analysis against its own evidence checkpoint."""
import hashlib
import json
import pathlib
import subprocess
import sys
import unittest

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[2]
stage = json.loads((HERE / 'analysis.json').read_text(encoding='utf-8'))
checkpoint = stage['basis']['repository_revision']
evidence_bytes = subprocess.check_output([
    'git', 'show', f'{checkpoint}:cases/INV-TECH-CYBER-001/data/evidence_register.json'
], cwd=ROOT)
evidence = json.loads(evidence_bytes)


class AnalysisIntegrity(unittest.TestCase):
    def test_checkpoint_digest(self):
        self.assertEqual(hashlib.sha256(evidence_bytes).hexdigest(), stage['basis']['evidence_register_sha256'])

    def test_coverage_is_exact_inverse_of_path_references(self):
        actual = {item['evidence_id']: [] for item in evidence}
        for path in stage['paths']:
            for anchor in path['anchors']:
                self.assertIn(anchor, actual)
                actual[anchor].append(path['id'])
        self.assertEqual(actual, stage['coverage'])

    def test_paths_and_cross_references(self):
        ids = [item['id'] for item in stage['paths']]
        self.assertEqual(len(ids), len(set(ids)))
        for path in stage['paths']:
            self.assertTrue(path['source_record'] and path['boundary'] and path['anchors'])
            self.assertTrue(all(len(row) == 2 and all(row) for row in path['determinations']))
            self.assertTrue(all(len(row) == 3 and all(row) for row in path['mechanisms']))
        for observation in stage['cross_path_observations']:
            self.assertTrue(observation['analysis'] and observation['boundary'])
            self.assertTrue(set(observation['paths']).issubset(ids))

    def test_live_and_append_only(self):
        self.assertIn('live', stage['status'].lower())
        self.assertIn('without overwriting earlier paths', stage['evidence_basis_note'])
        self.assertIn('not establish comprehensive', stage['coverage_note'])
        original = (HERE / 'analysis.json').read_bytes()
        result = subprocess.run([sys.executable, str(HERE / 'build_analysis.py')], cwd=ROOT, capture_output=True, text=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('refusing to overwrite', result.stderr)
        self.assertEqual((HERE / 'analysis.json').read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
