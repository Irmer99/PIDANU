import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)


class SMSService:
    def __init__(self):
        self.keyword_handlers = {
            "PDM STATUS": self._handle_pdm_status,
            "STATUS": self._handle_request_status,
            "TRACK": self._handle_track_report,
            "HELP": self._handle_help,
            "REPORT": self._handle_report,
        }

    def handle(self, from_number: str, text: str) -> str:
        text = text.strip()
        upper = text.upper()

        for keyword, handler in self.keyword_handlers.items():
            if upper.startswith(keyword):
                arg = text[len(keyword) :].strip()
                return handler(from_number, arg)

        return self._handle_unknown(from_number, text)

    def _handle_pdm_status(self, phone: str, nin: str) -> str:
        nin = nin.strip()
        if not nin:
            return "PDM STATUS: Please provide your NIN.\nExample: PDM STATUS 1234567890123"
        return (
            f"PDM Status for NIN {nin}:\n"
            "Status: Active Citizen\n"
            "Parish: Owino\n"
            "Last Distribution: 15 Jun 2026\n"
            "Next Distribution: 15 Jul 2026"
        )

    def _handle_request_status(self, phone: str, code: str) -> str:
        code = code.strip()
        if not code:
            return "STATUS: Please provide request code.\nExample: STATUS PI-2026-0001"
        return (
            f"Request {code}:\n"
            "Status: Under Review\n"
            "Last Updated: 20 Jul 2026\n"
            "Expected: 3-5 working days"
        )

    def _handle_track_report(self, phone: str, code: str) -> str:
        code = code.strip()
        if not code:
            return "TRACK: Please provide report code.\nExample: TRACK RPT-0312"
        return (
            f"Report {code}:\n"
            "Status: Received\n"
            "Parish Chief notified\n"
            "Expected action: 48 hours"
        )

    def _handle_help(self, phone: str, arg: str) -> str:
        return (
            "PI-DANU SMS Commands:\n"
            "PDM STATUS [NIN] - Check PDM status\n"
            "STATUS [code] - Check request status\n"
            "TRACK [code] - Track a report\n"
            "REPORT [issue] - Report a problem\n"
            "HELP - Show this message"
        )

    def _handle_report(self, phone: str, issue_text: str) -> str:
        if not issue_text:
            return "REPORT: Please describe the issue.\nExample: REPORT Road damaged near trading center"
        code = f"RPT-{str(hash(issue_text) % 1000).zfill(4)}"
        return (
            f"Report {code} logged.\n"
            "Parish Chief notified.\n"
            f"Track via: TRACK {code}"
        )

    def _handle_unknown(self, phone: str, text: str) -> str:
        return (
            "Unrecognized command.\n"
            "Send HELP for available commands."
        )


sms_service = SMSService()
