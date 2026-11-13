import csv
import json
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import urlopen
import webbrowser


ROOT = Path(__file__).resolve().parent
SCORES_FILE = ROOT / "puntajes.txt"
SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8000
SCORES_LOCK = threading.Lock()
MAX_NAME_LENGTH = 49
MAX_SCORE = 900


class GameRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if urlsplit(self.path).path == "/api/scores":
            self.send_scores()
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/scores":
            self.send_error(404, "Ruta no encontrada")
            return

        try:
            content_length = int(self.headers.get("Content-Length", "0"))
            if content_length <= 0 or content_length > 4096:
                raise ValueError("El contenido de la solicitud no es valido.")
            payload = json.loads(self.rfile.read(content_length).decode("utf-8"))
            score = self.validate_score(payload)
            self.append_score(score)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            self.send_json({"error": str(error)}, status=400)
            return
        except OSError as error:
            self.log_error("No se pudo guardar el puntaje: %s", error)
            self.send_json({"error": "No se pudo escribir en puntajes.txt."}, status=500)
            return

        self.send_json({"saved": True})

    @staticmethod
    def validate_score(payload):
        if not isinstance(payload, dict):
            raise ValueError("El formato del puntaje no es valido.")

        name = payload.get("name")
        points = payload.get("points")
        level = payload.get("level")
        result = payload.get("result")

        if not isinstance(name, str):
            raise ValueError("El nombre del jugador no es valido.")
        name = name.strip()
        if not name or len(name) > MAX_NAME_LENGTH or any(ord(char) < 32 for char in name):
            raise ValueError("El nombre debe tener entre 1 y 49 caracteres imprimibles.")
        if "," in name:
            raise ValueError("El nombre no puede contener comas.")
        if isinstance(points, bool) or not isinstance(points, int) or not 0 <= points <= MAX_SCORE:
            raise ValueError("El puntaje debe ser un numero entero entre 0 y 900.")
        if isinstance(level, bool) or not isinstance(level, int) or not 1 <= level <= 3:
            raise ValueError("El nivel debe ser un numero entero entre 1 y 3.")
        if result not in ("Victoria", "Derrota"):
            raise ValueError("El resultado debe ser Victoria o Derrota.")

        return name, points, level, result.upper()

    @staticmethod
    def append_score(score):
        with SCORES_LOCK:
            with SCORES_FILE.open("a", encoding="utf-8", newline="") as score_file:
                csv.writer(score_file, lineterminator="\n").writerow(score)

    def send_scores(self):
        try:
            scores = []
            with SCORES_LOCK:
                if SCORES_FILE.exists():
                    with SCORES_FILE.open("r", encoding="utf-8-sig", newline="") as score_file:
                        for row in csv.reader(score_file):
                            if len(row) != 4:
                                continue
                            name, points_text, level_text, result = row
                            try:
                                points = int(points_text)
                                level = int(level_text)
                            except ValueError:
                                continue
                            normalized_result = result.strip().casefold()
                            if normalized_result in ("victoria", "victory"):
                                display_result = "Victoria"
                            elif normalized_result in ("derrota", "defeat"):
                                display_result = "Derrota"
                            else:
                                continue
                            scores.append({
                                "name": name,
                                "points": points,
                                "level": level,
                                "result": display_result,
                            })
            scores.sort(key=lambda score: score["points"], reverse=True)
        except (OSError, csv.Error) as error:
            self.log_error("No se pudo leer el ranking: %s", error)
            self.send_json({"error": "No se pudo leer puntajes.txt."}, status=500)
            return

        self.send_json({"scores": scores[:100]})

    def send_json(self, payload, status=200):
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.end_headers()
        self.wfile.write(encoded)


def game_server_is_ready(port, request_timeout=1):
    url = f"http://{SERVER_HOST}:{port}/api/scores"
    try:
        with urlopen(url, timeout=request_timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return (
            response.status == 200
            and isinstance(payload, dict)
            and isinstance(payload.get("scores"), list)
        )
    except (OSError, UnicodeDecodeError, json.JSONDecodeError, URLError):
        return False


def wait_for_server(timeout_seconds=15, port=SERVER_PORT):
    deadline = time.monotonic() + timeout_seconds
    last_error = "respuesta inesperada del servidor."

    while time.monotonic() < deadline:
        try:
            if game_server_is_ready(port):
                print("El servidor del juego esta listo.", flush=True)
                return True
        except OSError as error:
            last_error = str(error)
        time.sleep(0.25)

    print(
        f"ERROR: El servidor del juego no respondio en {timeout_seconds} segundos. {last_error}",
        file=sys.stderr,
        flush=True,
    )
    return False


def launch_game():
    server = ThreadingHTTPServer((SERVER_HOST, 0), GameRequestHandler)
    port = server.server_address[1]
    url = f"http://{SERVER_HOST}:{port}/index.html?v={int(time.time())}"
    print(f"Servidor del juego disponible en {url}", flush=True)
    open_game_page(port)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando servidor del juego.", flush=True)
    finally:
        server.server_close()
    return 0


def open_game_page(port):
    url = f"http://{SERVER_HOST}:{port}/index.html?v={int(time.time())}"
    if not webbrowser.open(url):
        print(f"No se pudo abrir el navegador automaticamente. Abre: {url}", flush=True)
    return 0


if __name__ == "__main__":
    if sys.argv[1:] == ["--wait"]:
        sys.exit(0 if wait_for_server() else 1)
    if sys.argv[1:] == ["--launch"]:
        sys.exit(launch_game())
    if sys.argv[1:]:
        print("Uso: server.py [--wait | --launch]", file=sys.stderr)
        sys.exit(2)

    server = ThreadingHTTPServer((SERVER_HOST, SERVER_PORT), GameRequestHandler)
    print(f"Servidor del juego disponible en http://{SERVER_HOST}:{SERVER_PORT}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nCerrando servidor del juego.", flush=True)
    finally:
        server.server_close()
