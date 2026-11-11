"""Start the local game, then open its ready server in the default browser."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


def main():
    folder = Path(__file__).resolve().parent
    handler = partial(SimpleHTTPRequestHandler, directory=str(folder))
    try:
        server = ThreadingHTTPServer(('127.0.0.1', 8831), handler)
    except OSError:
        server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    url = f'http://127.0.0.1:{server.server_port}/maker/engine.html?game=sundown_trail'
    print('The Last Outlaw - Enhanced Fixed Edition')
    print(f'Open this address if your browser does not open: {url}')
    print('Keep this window open while playing. Press Ctrl+C here to stop.')
    timer = threading.Timer(0.3, webbrowser.open, args=(url,))
    timer.daemon = True
    timer.start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nGame server stopped.')
    finally:
        timer.cancel()
        server.server_close()


if __name__ == '__main__':
    main()
