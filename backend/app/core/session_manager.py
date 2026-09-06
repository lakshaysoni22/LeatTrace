"""
LEATrace Session Manager — with Redis Fallback.

Manages user sessions with concurrent session limits, device tracking,
and optional Redis persistence. Falls back to in-memory storage when
Redis is unavailable.
"""
import json
import os
import time
import uuid
from typing import Dict, List, Any, Optional


class SessionManager:
    def __init__(self, use_redis: bool = True, redis_url: Optional[str] = None):
        self._sessions: Dict[str, Dict] = {}
        self._redis_client = None
        self._use_redis = use_redis

        if use_redis:
            self._connect_redis(redis_url or os.getenv("REDIS_URL", "redis://localhost:6379/0"))

    def _connect_redis(self, redis_url: str) -> None:
        """Attempt Redis connection; fall back to in-memory on failure."""
        try:
            import redis
            self._redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
            self._redis_client.ping()
        except Exception:
            self._redis_client = None
            self._use_redis = False

    # ── Storage helpers ──────────────────────────────────────────────────────

    def _store(self, session_id: str, data: Dict[str, Any]) -> None:
        if self._redis_client is not None:
            self._redis_client.set(f"session:{session_id}", json.dumps(data))
        else:
            self._sessions[session_id] = data

    def _load(self, session_id: str) -> Optional[Dict[str, Any]]:
        if self._redis_client is not None:
            raw = self._redis_client.get(f"session:{session_id}")
            return json.loads(raw) if raw else None
        return self._sessions.get(session_id)

    def _delete(self, session_id: str) -> None:
        if self._redis_client is not None:
            self._redis_client.delete(f"session:{session_id}")
        else:
            self._sessions.pop(session_id, None)

    def _all_sessions(self) -> Dict[str, Dict]:
        """Returns all sessions (in-memory only; Redis uses key scanning)."""
        if self._redis_client is not None:
            result = {}
            for key in self._redis_client.scan_iter("session:*"):
                sid = key.replace("session:", "")
                raw = self._redis_client.get(key)
                if raw:
                    result[sid] = json.loads(raw)
            return result
        return dict(self._sessions)

    # ── Public API ───────────────────────────────────────────────────────────

    def create_session(self, session_id: str, user_id: str, device_name: str, ip_address: str) -> Dict[str, Any]:
        """Creates a session registration and enforces max concurrent session limits."""
        all_sessions = self._all_sessions()
        user_sessions = [sid for sid, sess in all_sessions.items() if sess.get("user_id") == user_id]

        # Enforce maximum of 3 concurrent sessions per user
        if len(user_sessions) >= 3:
            oldest_sid = sorted(user_sessions, key=lambda sid: all_sessions[sid].get("last_active", 0))[0]
            self._delete(oldest_sid)

        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "device_name": device_name,
            "ip_address": ip_address,
            "last_active": int(time.time()),
            "active": True,
        }
        self._store(session_id, session_data)
        return session_data

    def terminate_session(self, session_id: str) -> bool:
        """Terminates an active session."""
        session = self._load(session_id)
        if session:
            session["active"] = False
            self._store(session_id, session)
            return True
        return False

    def list_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Lists active sessions for a user."""
        all_sessions = self._all_sessions()
        return [sess for sess in all_sessions.values() if sess.get("user_id") == user_id]

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a session by ID."""
        return self._load(session_id)

    def rotate_refresh_token(self, session_id: str, new_refresh_token: str) -> Optional[str]:
        """Rotates the refresh token for a session."""
        session = self._load(session_id)
        if not session:
            return None
        session["refresh_token"] = new_refresh_token
        self._store(session_id, session)
        return new_refresh_token

    def revoke_session(self, session_id: str) -> bool:
        """Revokes a session (alias for terminate)."""
        return self.terminate_session(session_id)


session_manager = SessionManager()
