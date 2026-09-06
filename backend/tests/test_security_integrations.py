import os
import tempfile
from pathlib import Path

from app.core.encryption_engine import EncryptionManager, EncryptionKey
from app.core.sso_federation import SSOProviderRegistry, LocalSSOProvider
from app.cloud.secret_adapter import CloudSecretAdapter
from app.core.session_manager import SessionManager
from app.intel.siem_exporter import SIEMIntegrationService
from app.risk.compliance_engine import ComplianceAutomation


def test_encryption_stack_round_trip():
    manager = EncryptionManager()
    key = EncryptionKey(key_id="test-key", key_material=b"A" * 32, is_primary=True)
    assert manager.add_key(key) is True

    encrypted = manager.encrypt_sensitive_data("secret-value", context="user:1")
    assert encrypted is not None
    assert manager.decrypt_sensitive_data(encrypted, context="user:1") == "secret-value"


def test_sso_provider_authentication_and_registry():
    registry = SSOProviderRegistry()
    provider = LocalSSOProvider(name="local", users={"admin": "P@ssw0rd!"})
    registry.register(provider)

    auth = registry.authenticate("local", "admin", "P@ssw0rd!")
    assert auth is True
    assert registry.get_provider("local") is provider


def test_cloud_secret_adapter_env_fallback():
    adapter = CloudSecretAdapter()
    # Should fall back to env vars when no cloud provider configured
    os.environ["TEST_SECRET_KEY"] = "test_secret_value"
    result = adapter.get_secret("TEST_SECRET_KEY")
    assert result == "test_secret_value"
    del os.environ["TEST_SECRET_KEY"]


def test_session_manager_create_and_revoke():
    mgr = SessionManager(use_redis=False)
    session = mgr.create_session("sess-test-1", "user-1", "Test Device", "127.0.0.1")
    assert session is not None
    assert session["user_id"] == "user-1"

    retrieved = mgr.get_session("sess-test-1")
    assert retrieved is not None
    assert mgr.terminate_session("sess-test-1") is True


def test_siem_integration_service_accepts_events():
    service = SIEMIntegrationService()
    event = service.send_event({"source": "auth", "message": "login"})
    assert event["status"] == "queued"
    assert event["event"]["source"] == "auth"


def test_compliance_scan_reports_findings(tmp_path: Path):
    target = tmp_path / "demo"
    target.mkdir()
    (target / "requirements.txt").write_text("requests==2.0.0\n", encoding="utf-8")
    (target / "secrets.txt").write_text("AKIA1234567890EXAMPLE\n", encoding="utf-8")

    automation = ComplianceAutomation()
    report = automation.scan_path(target)
    assert report["status"] == "completed"
    assert report["findings"]
