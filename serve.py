#!/usr/bin/env python3
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8123
APP_DIR = Path(__file__).resolve().parent


def main() -> None:
    handler = partial(SimpleHTTPRequestHandler, directory=str(APP_DIR))
    server = ThreadingHTTPServer((HOST, PORT), handler)
    print(f"MindGarden available at http://{HOST}:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
