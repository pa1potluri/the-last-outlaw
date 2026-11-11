"""Check launcher startup/fallback without opening a browser or leaving a server."""
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import MagicMock, patch

spec = importlib.util.spec_from_file_location('outlaw_launcher', Path(__file__).resolve().parents[1] / 'launch_game.py')
launcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(launcher)


class LauncherTests(unittest.TestCase):
    def test_batch_uses_windows_line_endings(self):
        data = (Path(__file__).resolve().parents[1] / 'Play The Last Outlaw.bat').read_bytes()
        self.assertGreater(data.count(b'\r\n'), 10)
        self.assertNotIn(b'\r', data.replace(b'\r\n', b''))
        self.assertNotIn(b'\n', data.replace(b'\r\n', b''))
        data.decode('ascii')

    def check_launch(self, occupied):
        server = MagicMock(server_port=51234 if occupied else 8831)
        server.serve_forever.side_effect = KeyboardInterrupt
        constructors = [OSError('Address in use'), server] if occupied else [server]
        with patch.object(launcher, 'ThreadingHTTPServer', side_effect=constructors) as factory, patch.object(launcher.threading, 'Timer') as timer, patch.object(launcher.webbrowser, 'open') as browser:
            launcher.main()
            self.assertEqual(factory.call_args_list[-1].args[0], ('127.0.0.1', 0 if occupied else 8831))
            self.assertIn(f':{server.server_port}/', timer.call_args.kwargs['args'][0])
            timer.return_value.start.assert_called_once()
            timer.return_value.cancel.assert_called_once()
            server.server_close.assert_called_once()
            browser.assert_not_called()

    def test_preferred_port(self):
        self.check_launch(False)

    def test_busy_port_fallback(self):
        self.check_launch(True)


if __name__ == '__main__':
    unittest.main()
