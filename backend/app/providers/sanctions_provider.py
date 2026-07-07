"""
LEATrace Sanctions Provider — Abstract Interface & OFAC SDN Implementation.

Abstract interface for sanctions data providers, plus a production
implementation that parses the publicly available OFAC SDN list
from the U.S. Treasury (treasury.gov).

PRODUCTION INVARIANTS:
- Uses real OFAC SDN data (publicly available, no API key required).
- No fabricated sanctions entries.
- Exact-match lookups only.
"""

import os
import logging
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

from ..connection_pool import connection_pool

logger = logging.getLogger("leatrace.providers.sanctions")


class SanctionsProvider(ABC):
    """Abstract interface for sanctions data providers."""

    @abstractmethod
    def is_sanctioned(self, address: str) -> bool:
        """Checks if an address is on a sanctions list."""
        ...

    @abstractmethod
    def get_sanction_details(self, address: str) -> Optional[Dict[str, Any]]:
        """Returns sanction details for an address, or None."""
        ...

    @abstractmethod
    def search(self, query: str) -> List[Dict[str, Any]]:
        """Searches sanctions data by name, alias, or address."""
        ...

    @abstractmethod
    def get_all_addresses(self) -> List[str]:
        """Returns all sanctioned cryptocurrency addresses."""
        ...


class OFACSanctionsProvider(SanctionsProvider):
    """
    OFAC SDN (Specially Designated Nationals) provider.

    Downloads and parses the OFAC SDN list from the U.S. Treasury.
    The SDN XML list is publicly available at no cost.
    Cryptocurrency addresses are extracted from the 'Digital Currency Address' features.
    """

    # OFAC SDN XML download URL (public, no auth required)
    SDN_XML_URL = "https://www.treasury.gov/ofac/downloads/sdn.xml"
    SDN_ADVANCED_URL = "https://www.treasury.gov/ofac/downloads/sanctions/1.0/sdn_advanced.xml"

    def __init__(self, cache_dir: Optional[str] = None):
        self._addresses: Dict[str, Dict[str, Any]] = {}
        self._entities: Dict[str, Dict[str, Any]] = {}
        self._loaded = False
        self._cache_dir = cache_dir or os.getenv("OFAC_CACHE_DIR", "")

    def load(self) -> bool:
        """
        Downloads and parses the OFAC SDN list.
        Extracts all cryptocurrency addresses from the 'Digital Currency Address' features.
        Returns True if successful.
        """
        try:
            logger.info("Downloading OFAC SDN list from treasury.gov...")
            response = connection_pool.get_json(self.SDN_XML_URL, timeout=30)
            if response and "text" in response:
                xml_content = response["text"]
                return self._parse_sdn_xml(xml_content)
            else:
                logger.warning("Failed to download OFAC SDN list. Sanctions checks unavailable.")
                return False
        except Exception as e:
            logger.error(f"OFAC SDN download failed: {e}")
            return False

    def _parse_sdn_xml(self, xml_content: str) -> bool:
        """Parses the SDN XML and extracts cryptocurrency addresses."""
        try:
            root = ET.fromstring(xml_content)
            ns = {"sdn": "http://www.treasury.gov/ofac/downloads/sdn"}

            count = 0
            for entry in root.findall(".//sdn:sdnEntry", ns):
                uid = entry.findtext("sdn:uid", "", ns)
                first_name = entry.findtext("sdn:firstName", "", ns)
                last_name = entry.findtext("sdn:lastName", "", ns)
                entity_name = f"{first_name} {last_name}".strip() or uid
                sdn_type = entry.findtext("sdn:sdnType", "", ns)

                # Extract programs (sanctions lists)
                programs = []
                for prog in entry.findall(".//sdn:program", ns):
                    if prog.text:
                        programs.append(prog.text)

                # Look for digital currency addresses in ID list
                for id_elem in entry.findall(".//sdn:id", ns):
                    id_type = id_elem.findtext("sdn:idType", "", ns)
                    if "Digital Currency Address" in id_type:
                        address = id_elem.findtext("sdn:idNumber", "", ns)
                        if address:
                            addr_lower = address.lower().strip()
                            self._addresses[addr_lower] = {
                                "entity": entity_name,
                                "uid": uid,
                                "list": "OFAC SDN",
                                "programs": programs,
                                "type": sdn_type,
                                "risk": "Critical",
                                "currency": id_type.replace("Digital Currency Address - ", ""),
                            }
                            count += 1

                # Store entity info
                self._entities[uid] = {
                    "name": entity_name,
                    "type": sdn_type,
                    "programs": programs,
                }

            self._loaded = True
            logger.info(f"OFAC SDN loaded: {count} cryptocurrency addresses from {len(self._entities)} entities")
            return True
        except ET.ParseError as e:
            logger.error(f"Failed to parse OFAC SDN XML: {e}")
            return False

    def is_sanctioned(self, address: str) -> bool:
        """Exact-match check against OFAC SDN cryptocurrency addresses."""
        if not self._loaded:
            return False
        return address.lower().strip() in self._addresses

    def get_sanction_details(self, address: str) -> Optional[Dict[str, Any]]:
        """Returns OFAC sanction details for an address."""
        if not self._loaded:
            return None
        return self._addresses.get(address.lower().strip())

    def search(self, query: str) -> List[Dict[str, Any]]:
        """Searches OFAC SDN by entity name or address."""
        if not self._loaded:
            return []
        query_lower = query.lower()
        results = []

        # Search addresses
        for addr, details in self._addresses.items():
            if query_lower in addr or query_lower in details.get("entity", "").lower():
                results.append({"address": addr, **details})

        return results[:50]  # Limit results

    def get_all_addresses(self) -> List[str]:
        """Returns all OFAC-sanctioned cryptocurrency addresses."""
        return list(self._addresses.keys())

    def get_stats(self) -> Dict[str, Any]:
        """Returns OFAC SDN loading statistics."""
        return {
            "loaded": self._loaded,
            "total_addresses": len(self._addresses),
            "total_entities": len(self._entities),
            "source": "OFAC SDN (treasury.gov)",
        }


# Singleton
ofac_provider = OFACSanctionsProvider()
