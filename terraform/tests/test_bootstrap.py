"""Render real Terraform templates and exercise their failure paths without AWS."""
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


def render(source, workdir):
    names = set(re.findall(r'(?<!\$)\$\{([a-zA-Z_][a-zA-Z0-9_]*)\}', source.read_text()))
    values = {name: 'test-value' for name in names}
    if 'var.' in source.read_text():
        values['var'] = {name: 'test-value' for name in re.findall(r'var\.([a-z0-9_]+)', source.read_text())}
    expression = f'jsonencode(templatefile({json.dumps(str(source))}, jsondecode({json.dumps(json.dumps(values))})))\n'
    result = subprocess.run(['terraform', 'console', '-no-color'], input=expression,
                            cwd=workdir, text=True, capture_output=True)
    if result.returncode:
        raise AssertionError(result.stderr)
    return json.loads(json.loads(result.stdout))


class BootstrapTests(unittest.TestCase):
    def setUp(self):
        self.workspace = tempfile.TemporaryDirectory(prefix='codeskill-bootstrap-test-')
        self.addCleanup(self.workspace.cleanup)
        self.tmp = Path(self.workspace.name)

    def test_every_template_renders_and_has_valid_shell_syntax(self):
        for source in sorted((ROOT / 'terraform').rglob('*.tftpl')):
            if '.terraform' in source.parts:
                continue
            with self.subTest(template=str(source.relative_to(ROOT))):
                subprocess.run(['bash', '-n'], input=render(source, self.tmp),
                               text=True, capture_output=True, check=True)

    def test_legacy_inline_user_data_renders_and_has_valid_shell_syntax(self):
        module = (ROOT / 'terraform/modules/asg/main.tf').read_text()
        inline = module.split('base64encode(<<EOF\n', 1)[1].split('\nEOF\n', 1)[0]
        source = self.tmp / 'legacy.sh.tftpl'
        source.write_text(inline)
        subprocess.run(['bash', '-n'], input=render(source, self.tmp),
                       text=True, capture_output=True, check=True)

    def test_backend_rejects_missing_jwt_and_preserves_secure_database_configuration(self):
        source = ROOT / 'terraform/environments/production/userdata/backend.sh.tftpl'
        rendered = render(source, self.tmp)
        block = rendered[rendered.index('# 4. Create Environment'):rendered.index('# 5. Create Systemd')]
        block = block.replace('/opt/codeskill', str(self.tmp / 'app'))
        aws = self.tmp / 'aws'
        aws.write_text('#!/bin/sh\nprintf "%s\\n" "$MOCK_SECRET"\n')
        aws.chmod(0o700)
        curl = self.tmp / 'curl'
        curl.write_text('#!/bin/sh\nwhile [ "$#" -gt 0 ]; do\n if [ "$1" = "-o" ]; then shift; printf "test certificate" > "$1"; exit 0; fi\n shift\ndone\nexit 1\n')
        curl.chmod(0o700)
        env = {**os.environ, 'PATH': str(self.tmp) + os.pathsep + os.environ['PATH'],
               'REGION': 'test', 'DB_HOST': 'db.example', 'DB_PORT': '5432',
               'DB_USER': 'user', 'DB_PASS': 'password-with-#-and-$', 'DB_NAME': 'codeskill'}
        result = subprocess.run(['bash', '-euo', 'pipefail', '-c', block],
                                env={**env, 'MOCK_SECRET': 'OTHER_SETTING=value'}, capture_output=True)
        self.assertNotEqual(result.returncode, 0)
        result = subprocess.run(['bash', '-euo', 'pipefail', '-c', block], env={**env,
                                'MOCK_SECRET': 'JWT_SECRET=test-only-secret\nDATABASE_URL=postgres://old-host/db?sslmode=disable'},
                                capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr.decode())
        config = self.tmp / 'app/backend.env'
        self.assertNotIn('DATABASE_URL=', config.read_text())
        self.assertIn('DATABASE_SSL=true', config.read_text())
        self.assertIn('DATABASE_PASSWORD=password-with-#-and-$', config.read_text())
        self.assertIn('NODE_EXTRA_CA_CERTS=', config.read_text())
        self.assertEqual(config.stat().st_mode & 0o777, 0o600)

    def test_readiness_timeout_cannot_report_bootstrap_success(self):
        for role in ['backend', 'frontend']:
            source = ROOT / f'terraform/environments/production/userdata/{role}.sh.tftpl'
            rendered = render(source, self.tmp)
            block = rendered[rendered.index('READY=false'):]
            result = subprocess.run(['bash', '-euo', 'pipefail', '-c',
                                     'curl() { return 1; }; sleep() { :; };\n' + block],
                                    text=True, capture_output=True)
            self.assertNotEqual(result.returncode, 0, role)
            self.assertIn('readiness probe failed', result.stderr)
            self.assertNotIn('instance ready', result.stdout)


if __name__ == '__main__':
    unittest.main()
