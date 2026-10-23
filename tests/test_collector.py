import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('collector', Path(__file__).resolve().parents[1] / 'agent/government_record_agent.py')
agent = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(agent)


class Response(io.BytesIO):
    def __init__(self, url, body, headers=None):
        super().__init__(body)
        self.url = url
        self.headers = headers or {'Content-Type': 'text/html', 'Content-Length': str(len(body))}

    def geturl(self):
        return self.url


class CollectorTests(unittest.TestCase):
    def test_oversize(self):
        with self.assertRaisesRegex(ValueError, 'Oversize'):
            agent.read_complete(Response('https://gov.example/', b'12345'), 4)

    def test_truncated(self):
        with self.assertRaisesRegex(ValueError, 'Incomplete'):
            agent.read_complete(Response('https://gov.example/', b'123', {'Content-Length': '10'}))

    def test_complete_at_limit(self):
        self.assertEqual(agent.read_complete(Response('https://gov.example/', b'1234'), 4), b'1234')

    def test_scope(self):
        for url in ['file:///etc/passwd', 'https://other.example/', 'https://gov.example:8443/', 'https://user@gov.example/']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                agent.require_allowed(url, {'gov.example'})

    def test_redirect_is_checked_before_following(self):
        handler = agent.ScopedRedirect({'gov.example'})
        request = agent.Request('https://gov.example/')
        for url in ['https://other.example/', 'http://gov.example/']:
            with self.subTest(url=url), self.assertRaises(ValueError):
                handler.redirect_request(request, None, 302, 'Found', {}, url)

    def run_collector(self, out, resume=None, case='CASE-A', hosts='gov.example'):
        args=['collector', '--case', case, '--seed', 'https://gov.example/', '--hosts', hosts, '--max-docs', '1', '--out', str(out)]
        if resume:
            args += ['--resume', str(resume)]
        requested=[]

        class Opener:
            def open(self, request, timeout):
                requested.append(request.full_url)
                body = b'<a href="/next">Next</a>' if request.full_url.endswith('/') else b'<p>Next record</p>'
                return Response(request.full_url, body)

        with patch('sys.argv', args), patch.object(agent, 'build_opener', return_value=Opener()), patch.object(agent, 'load_glossary', return_value=({'term': {}}, None, b'{}', 'hash')), patch.object(agent.time, 'sleep'), patch('builtins.print'):
            agent.main()
        return requested

    def test_resume_advances_and_keeps_hash_history(self):
        with tempfile.TemporaryDirectory() as temp:
            first,second,third=[Path(temp)/name for name in ('first','second','third')]
            self.assertEqual(self.run_collector(first), ['https://gov.example/'])
            self.assertEqual(self.run_collector(second,first), ['https://gov.example/next'])
            state=json.loads((second/'frontier.json').read_text())
            self.assertEqual(len(state['known_hashes']),2)
            self.assertEqual(state['pending_urls'],[])
            self.assertEqual(self.run_collector(third,second), [])
            self.assertEqual(len(json.loads((third/'frontier.json').read_text())['known_hashes']),2)

    def test_reject_other_case(self):
        with tempfile.TemporaryDirectory() as temp:
            first=Path(temp)/'first'
            self.run_collector(first)
            with self.assertRaisesRegex(SystemExit,'case_id mismatch'):
                self.run_collector(Path(temp)/'second',first,case='CASE-B')

    def test_reject_scope_change(self):
        with tempfile.TemporaryDirectory() as temp:
            first=Path(temp)/'first'
            self.run_collector(first)
            with self.assertRaisesRegex(SystemExit,'scope mismatch'):
                self.run_collector(Path(temp)/'second',first,hosts='gov.example,other.example')


if __name__ == '__main__':
    unittest.main()
