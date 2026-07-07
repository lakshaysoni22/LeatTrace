"""
LEATrace STIX 2.1 Engine — Production.

STIX 2.1 object factory, bundle parser, validator, and wallet address extractor.

PRODUCTION INVARIANTS:
- Only creates/parses structurally valid STIX 2.1 objects.
- Never fabricates threat intelligence content.
- `parse_bundle()` only accepts real STIX 2.1 JSON bundles.
- Wallet pattern extraction uses a strict regex — no invented addresses.
"""

from __future__ import annotations

import datetime
import logging
import re
import uuid
from typing import Any, Dict, Generator, List, Optional

logger = logging.getLogger("leatrace.stix_engine")

# STIX 2.1 required fields per object type
REQUIRED_FIELDS: Dict[str, List[str]] = {
    "indicator":     ["type", "spec_version", "id", "created", "modified", "name",
                      "pattern", "pattern_type", "valid_from"],
    "malware":       ["type", "spec_version", "id", "created", "modified", "name", "is_family"],
    "threat-actor":  ["type", "spec_version", "id", "created", "modified", "name"],
    "relationship":  ["type", "spec_version", "id", "created", "modified",
                      "relationship_type", "source_ref", "target_ref"],
    "attack-pattern": ["type", "spec_version", "id", "created", "modified", "name"],
    "campaign":      ["type", "spec_version", "id", "created", "modified", "name"],
    "identity":      ["type", "spec_version", "id", "created", "modified", "name", "identity_class"],
    "observed-data": ["type", "spec_version", "id", "created", "modified",
                      "first_observed", "last_observed", "number_observed", "object_refs"],
    "bundle":        ["type", "id"],
}

# Patterns for extracting wallet addresses from STIX patterns
# e.g. [cryptocurrency-address:value = '0xABCD...'] or [bitcoin-addr:value = '1BTC...']
_CRYPTO_PATTERN_RE = re.compile(
    r"\[(?:cryptocurrency-address|bitcoin-addr|ethereum-addr|crypto-wallet):value\s*=\s*['\"]([^'\"]+)['\"]\]",
    re.IGNORECASE,
)
# Simpler: any quoted hex/base58 address-like string in pattern field
_ADDRESS_GENERAL_RE = re.compile(
    r"['\"]"
    r"("
    r"0x[0-9a-fA-F]{40}"               # EVM address
    r"|[13][a-km-zA-HJ-NP-Z1-9]{25,34}" # Bitcoin P2PKH/P2SH
    r"|bc1[a-z0-9]{39,59}"              # Bitcoin bech32
    r"|[A-HJ-NP-Za-km-z1-9]{32,44}"    # Solana / generic base58
    r"|T[A-Za-z1-9]{33}"               # TRON
    r")"
    r"['\"]",
)


class STIXValidationError(Exception):
    """Raised when a STIX object fails schema validation."""


class STIXEngine:
    """
    STIX 2.1 factory, parser, validator.

    Methods:
      create_indicator()    — Builds a STIX 2.1 Indicator object
      create_malware()      — Builds a STIX 2.1 Malware object
      create_relationship() — Builds a STIX 2.1 Relationship object
      parse_bundle()        — Parses a STIX 2.1 Bundle, yields objects
      validate_object()     — Validates required fields for a STIX object
      extract_indicators()  — Extracts Indicator objects from a bundle
      extract_wallet_addresses() — Extracts crypto addresses from indicator patterns
    """

    # ── Object Factory ─────────────────────────────────────────────────────────

    def create_indicator(
        self,
        name: str,
        pattern: str,
        pattern_type: str = "stix",
        indicator_types: Optional[List[str]] = None,
        description: Optional[str] = None,
        valid_until: Optional[str] = None,
        confidence: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Creates a STIX 2.1 Indicator object.

        Args:
            name: Human-readable indicator name
            pattern: STIX pattern (e.g. "[ipv4-addr:value = '1.2.3.4']")
            pattern_type: "stix" (default), "snort", "yara"
            indicator_types: list of types (malicious-activity, anomalous-activity, etc.)
            description: optional narrative
            valid_until: optional ISO 8601 expiry
            confidence: 0-100 confidence score

        Returns:
            Valid STIX 2.1 Indicator dict
        """
        now = self._utc_now()
        obj: Dict[str, Any] = {
            "type": "indicator",
            "spec_version": "2.1",
            "id": f"indicator--{uuid.uuid4()}",
            "created": now,
            "modified": now,
            "name": name,
            "pattern": pattern,
            "pattern_type": pattern_type,
            "pattern_version": "2.1",
            "valid_from": now,
            "indicator_types": indicator_types or ["malicious-activity"],
        }
        if description:
            obj["description"] = description
        if valid_until:
            obj["valid_until"] = valid_until
        if confidence is not None:
            obj["confidence"] = max(0, min(100, confidence))
        return obj

    def create_malware(
        self,
        name: str,
        description: str,
        malware_types: Optional[List[str]] = None,
        is_family: bool = False,
    ) -> Dict[str, Any]:
        """Creates a STIX 2.1 Malware object."""
        now = self._utc_now()
        return {
            "type": "malware",
            "spec_version": "2.1",
            "id": f"malware--{uuid.uuid4()}",
            "created": now,
            "modified": now,
            "name": name,
            "description": description,
            "is_family": is_family,
            "malware_types": malware_types or ["ransomware"],
        }

    def create_relationship(
        self,
        source_ref: str,
        target_ref: str,
        relationship_type: str,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Creates a STIX 2.1 Relationship object."""
        now = self._utc_now()
        obj: Dict[str, Any] = {
            "type": "relationship",
            "spec_version": "2.1",
            "id": f"relationship--{uuid.uuid4()}",
            "created": now,
            "modified": now,
            "relationship_type": relationship_type,
            "source_ref": source_ref,
            "target_ref": target_ref,
        }
        if description:
            obj["description"] = description
        return obj

    def create_bundle(self, objects: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Wraps STIX objects in a STIX 2.1 Bundle."""
        return {
            "type": "bundle",
            "id": f"bundle--{uuid.uuid4()}",
            "objects": objects,
        }

    # ── Parsing & Validation ───────────────────────────────────────────────────

    def parse_bundle(self, bundle: Dict[str, Any]) -> Generator[Dict[str, Any], None, None]:
        """
        Parses a STIX 2.1 Bundle dict and yields valid STIX objects.

        Skips objects that fail validation and logs warnings.
        Never fabricates objects — only yields what is in the bundle.

        Args:
            bundle: Parsed JSON dict of a STIX bundle

        Yields:
            Individual validated STIX objects
        """
        if not isinstance(bundle, dict):
            raise STIXValidationError("Bundle must be a JSON object (dict)")

        if bundle.get("type") != "bundle":
            raise STIXValidationError(f"Expected type 'bundle', got '{bundle.get('type')}'")

        objects = bundle.get("objects", [])
        if not isinstance(objects, list):
            raise STIXValidationError("Bundle 'objects' must be a list")

        logger.info("Parsing STIX bundle %s with %d objects", bundle.get("id"), len(objects))

        for obj in objects:
            try:
                self.validate_object(obj)
                yield obj
            except STIXValidationError as e:
                logger.warning("Skipping invalid STIX object %s: %s", obj.get("id"), e)

    def validate_object(self, obj: Dict[str, Any]) -> None:
        """
        Validates required fields for a STIX 2.1 object.

        Raises:
            STIXValidationError: if required fields are missing or invalid
        """
        if not isinstance(obj, dict):
            raise STIXValidationError("STIX object must be a dict")

        obj_type = obj.get("type")
        if not obj_type:
            raise STIXValidationError("STIX object missing 'type' field")

        # Validate STIX ID format FIRST: type--UUID (before required fields check)
        stix_id = obj.get("id", "")
        if stix_id and "--" not in stix_id:
            raise STIXValidationError(
                f"Invalid STIX ID format: '{stix_id}' (expected type--uuid4)"
            )

        required = REQUIRED_FIELDS.get(obj_type, ["type", "spec_version", "id"])
        missing = [f for f in required if f not in obj or obj[f] is None]
        if missing:
            raise STIXValidationError(
                f"STIX {obj_type} object {obj.get('id', 'UNKNOWN')} missing required fields: {missing}"
            )

    # ── Extraction Helpers ─────────────────────────────────────────────────────

    def extract_indicators(self, bundle: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extracts all Indicator objects from a STIX bundle.
        Returns empty list if none found — never fabricates.
        """
        return [
            obj for obj in self.parse_bundle(bundle)
            if obj.get("type") == "indicator"
        ]

    def extract_wallet_addresses(self, indicator: Dict[str, Any]) -> List[str]:
        """
        Extracts cryptocurrency wallet addresses from a STIX Indicator pattern.

        Supports EVM (0x...), Bitcoin (1/3/bc1...), TRON (T...), Solana addresses.
        Returns empty list if no addresses found.
        """
        pattern = indicator.get("pattern", "")
        if not pattern:
            return []

        # Try STIX-specific crypto pattern first
        matches = _CRYPTO_PATTERN_RE.findall(pattern)
        if matches:
            return list(dict.fromkeys(matches))  # dedupe, preserve order

        # Fall back to general address regex on the whole pattern string
        matches = _ADDRESS_GENERAL_RE.findall(pattern)
        return list(dict.fromkeys(matches))

    def extract_all_wallet_addresses(self, bundle: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Walks all indicators in a bundle and extracts wallet addresses with context.

        Returns:
            List of {"address": ..., "indicator_id": ..., "indicator_name": ..., "pattern": ...}
        """
        results = []
        for indicator in self.extract_indicators(bundle):
            addrs = self.extract_wallet_addresses(indicator)
            for addr in addrs:
                results.append({
                    "address":        addr,
                    "indicator_id":   indicator.get("id"),
                    "indicator_name": indicator.get("name"),
                    "pattern":        indicator.get("pattern"),
                    "valid_from":     indicator.get("valid_from"),
                })
        return results

    # ── Internal ───────────────────────────────────────────────────────────────

    def _utc_now(self) -> str:
        """Returns ISO 8601 UTC timestamp with millisecond precision."""
        return datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


# ─── Singleton ────────────────────────────────────────────────────────────────

stix_engine = STIXEngine()
