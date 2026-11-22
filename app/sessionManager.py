
import secrets
import time
import threading


class SessionManager:

    def __init__(self, expiryHours=24):
        self.sessions = {}
        self.expirySeconds = expiryHours * 60 * 60
        self.lock = threading.Lock()

    def createSession(self, userID):
        sessionID = secrets.token_urlsafe(32)

        with self.lock:
            self.sessions[sessionID] = {
                "userID": userID,
                "created": time.time(),
                "expires": time.time() + self.expirySeconds
            }

        return sessionID

    def validateSession(self, sessionID):
        with self.lock:
            session = self.sessions.get(sessionID)

            if session is None:
                return False

            if time.time() >= session["expires"]:
                del self.sessions[sessionID]
                return False

            return True

    def deleteSession(self, sessionID):
        with self.lock:
            self.sessions.pop(sessionID, None)

    def cleanup(self):
        now = time.time()

        with self.lock:
            expired = [
                sid for sid, session in self.sessions.items()
                if now >= session["expires"]
            ]

            for sid in expired:
                del self.sessions[sid]

    def getUserID(self, sessionID):
        with self.lock:
            session = self.sessions.get(sessionID)

            if session is None:
                return None

            if time.time() >= session["expires"]:
                del self.sessions[sessionID]
                return None

            return session["userID"]
