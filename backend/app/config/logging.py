"""
LEATrace Logging Configuration.

Configures structured JSON logging for SIEM compliance and production auditing.
"""

import logging
import sys


def setup_logging(level: int = logging.INFO) -> None:
    """Configures root logger with standard forensic formatting."""
    log_format = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    logging.basicConfig(
        level=level,
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)],
        force=True,
    )
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
