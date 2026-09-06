import os
import json
import time
import uuid
import datetime
from typing import Any, Dict, List, Optional
from urllib import request, error

# Directory for secure SIEM audit files
LOG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
SIEM_LOG_PATH = os.path.join(LOG_DIR, "LEAtTrace_siem.log")

# Ensure secure directory exists
os.makedirs(LOG_DIR, exist_ok=True)

def log_security_event(
    action: str,
    status: str,
    username: str = "SYSTEM",
    user_id: str = "sys-001",
    ip_address: str = "127.0.0.1",
    severity: str = "MEDIUM",
    details: dict = None
):
    """
    Exports a compliance-grade security audit log event to the centralized SIEM log repository.
    Formats logs as JSON-Lines for easy ingestion by Splunk, Logstash, or Wazuh, and
    emits standard CEF syslog signals to stdout.
    """
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    timestamp = datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None).isoformat() + "Z"
    
    # 1. Construct JSON log record
    log_record = {
        "event_id": event_id,
        "timestamp": timestamp,
        "severity": severity.upper(),
        "action": action,
        "status": status.lower(),
        "operator": {
            "user_id": user_id,
            "username": username,
            "ip_address": ip_address
        },
        "details": details or {}
    }
    
    # Write to local SIEM file
    try:
        with open(SIEM_LOG_PATH, "a") as f:
            f.write(json.dumps(log_record) + "\n")
    except Exception as e:
        print(f"[SIEM EXPORTER ERROR] Failed to write security event: {e}")

    # 2. Format as Common Event Format (CEF) for Syslog collector pipelines
    cef_severity_mapping = {"LOW": 3, "MEDIUM": 5, "HIGH": 8, "CRITICAL": 10}
    cef_sev = cef_severity_mapping.get(severity.upper(), 5)
    
    cef_string = (
        f"CEF:0|LEAtTrace|LEAtTrace-X|1.0.0|{status.upper()}|{action}|{cef_sev}|"
        f"suser={username} src={ip_address} msg={action} outcome={status}"
    )
    
    # Print to syslog stdout channel (Logstash/Fluentd listener ingress)
    print(f"[SIEM CEF SYS] {cef_string}")

    return log_record


# ═══════════════════════════════════════════════════════════════════════════════
# SIEM HTTP Integration Service — forwards events to external SIEM endpoints
# ═══════════════════════════════════════════════════════════════════════════════

class SIEMIntegrationService:
    """Forwards security events to an external SIEM endpoint via HTTP."""

    def __init__(self, endpoint: Optional[str] = None, auth_token: Optional[str] = None, timeout: int = 3) -> None:
        self.endpoint = endpoint or os.getenv("SIEM_ENDPOINT")
        self.auth_token = auth_token or os.getenv("SIEM_AUTH_TOKEN")
        self.timeout = timeout
        self.events: List[Dict[str, Any]] = []

    def send_event(self, event: Dict[str, Any]) -> Dict[str, Any]:
        record = {
            "status": "queued",
            "event": event,
            "timestamp": int(time.time()),
        }
        self.events.append(record)

        if self.endpoint:
            payload = json.dumps(record).encode("utf-8")
            headers = {"Content-Type": "application/json"}
            if self.auth_token:
                headers["Authorization"] = f"Bearer {self.auth_token}"
            try:
                req = request.Request(self.endpoint, data=payload, headers=headers, method="POST")
                with request.urlopen(req, timeout=self.timeout) as response:
                    response_body = response.read().decode("utf-8")
                return {"status": "sent", "event": event, "response": response_body}
            except (error.URLError, error.HTTPError, TimeoutError):
                return {"status": "queued", "event": event, "reason": "delivery_failed"}

        return record

