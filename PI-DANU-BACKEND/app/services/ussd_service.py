import logging
from typing import Optional

logger = logging.getLogger(__name__)

SCAM_WARNING = (
    "WARNING: PDM registration is COMPLETELY FREE. "
    "Do NOT pay anyone for forms or registration. "
    "If anyone asks for money, they are a scammer. "
    "Report them to your Local Council."
)

HELP_TEXT = (
    "PI-DANU Services:\n"
    "1. Check PDM Status\n"
    "2. Apply for Service\n"
    "3. Report Community Issue\n"
    "4. Verify Identity\n"
    "5. Voice Assistance\n"
    "0. Back to Main Menu"
)


class USSDService:
    def __init__(self):
        self.sessions: dict = {}

    def handle(self, session_id: str, phone_number: str, text: str) -> str:
        if session_id not in self.sessions:
            self.sessions[session_id] = {"level": 0, "data": {}}

        session = self.sessions[session_id]
        level = session["level"]

        if text == "" or text is None:
            return self._main_menu()

        parts = text.split("*")
        choice = parts[-1]

        if level == 0:
            return self._handle_main_menu(session, choice)
        elif level == 1:
            return self._handle_pdm_status(session, choice, phone_number)
        elif level == 2:
            return self._handle_apply_service(session, choice)
        elif level == 3:
            return self._handle_service_details(session, choice)
        elif level == 10:
            return self._handle_report_issue(session, choice)
        elif level == 11:
            return self._handle_report_details(session, choice)
        elif level == 20:
            return self._handle_verify_identity(session, choice, phone_number)

        session.clear()
        session["level"] = 0
        return "END Session expired. Please dial again."

    def _main_menu(self) -> str:
        return (
            "CON Welcome to PI-DANU\n"
            "1. Check PDM Status\n"
            "2. Apply for Service\n"
            "3. Report Community Issue\n"
            "4. Verify Identity\n"
            "5. Help"
        )

    def _handle_main_menu(self, session: dict, choice: str) -> str:
        if choice == "1":
            session["level"] = 1
            return "CON Enter your NIN (13 digits):"
        elif choice == "2":
            session["level"] = 2
            return (
                "CON Select Service Type:\n"
                "1. Birth Certificate\n"
                "2. Land Permit\n"
                "3. Agricultural Inputs\n"
                "4. Infrastructure Report"
            )
        elif choice == "3":
            session["level"] = 10
            return (
                "CON Report Type:\n"
                "1. Road Damage\n"
                "2. Water Point Failure\n"
                "3. School/Health Issue\n"
                "4. Other"
            )
        elif choice == "4":
            session["level"] = 20
            return "CON Enter your NIN to verify:"
        elif choice == "5":
            return f"END {HELP_TEXT}"
        else:
            return "END Invalid option. Please dial again."

    def _handle_pdm_status(self, session: dict, choice: str, phone: str) -> str:
        nin = choice.strip()
        if len(nin) < 10:
            return "CON Invalid NIN. Enter 13-digit NIN:"
        session["data"]["nin"] = nin
        session["level"] = 0
        return (
            f"END PDM Status for NIN {nin}:\n"
            "Status: Active Citizen\n"
            "Parish: Owino\n"
            "Last Distribution: 15 Jun 2026\n"
            "Next Distribution: 15 Jul 2026\n"
            "Thank you."
        )

    def _handle_apply_service(self, session: dict, choice: str) -> str:
        service_map = {
            "1": "birth_cert",
            "2": "land_permit",
            "3": "agri_inputs",
            "4": "infra_report",
        }
        if choice not in service_map:
            return "CON Invalid option. Select 1-4:"
        session["data"]["service_type"] = service_map[choice]
        session["level"] = 3
        return "CON Enter a brief description (max 160 chars):"

    def _handle_service_details(self, session: dict, choice: str) -> str:
        session["data"]["description"] = choice
        session["level"] = 0
        code = f"PI-2026-{str(hash(choice) % 10000).zfill(4)}"
        return (
            f"END Request {code} submitted.\n"
            "Track via SMS: STATUS {code}\n"
            "You will receive an SMS confirmation."
        )

    def _handle_report_issue(self, session: dict, choice: str) -> str:
        report_map = {
            "1": "road_damage",
            "2": "water_point",
            "3": "school_health",
            "4": "other",
        }
        if choice not in report_map:
            return "CON Invalid option. Select 1-4:"
        session["data"]["report_type"] = report_map[choice]
        session["level"] = 11
        return "CON Describe the issue (max 160 chars):"

    def _handle_report_details(self, session: dict, choice: str) -> str:
        session["data"]["description"] = choice
        session["level"] = 0
        code = f"RPT-{str(hash(choice) % 1000).zfill(4)}"
        return (
            f"END Report {code} logged.\n"
            "Parish Chief notified.\n"
            f"Track via SMS: TRACK {code}"
        )

    def _handle_verify_identity(self, session: dict, choice: str, phone: str) -> str:
        nin = choice.strip()
        if len(nin) < 10:
            return "CON Invalid NIN. Enter 13-digit NIN:"
        session["level"] = 0
        return (
            f"END Verification for NIN {nin}:\n"
            "Status: CONFIRMED\n"
            "Name: [Citizen Name]\n"
            "Parish: Owino\n"
            "Thank you."
        )


ussd_service = USSDService()
