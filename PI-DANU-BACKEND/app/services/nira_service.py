import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)

MOCK_NIRA_DB = {
    "CM850123456ABCD": {
        "full_name": "NAMUKASA SARAH",
        "nin": "CM850123456ABCD",
        "sex": "F",
        "date_of_birth": "1985-03-15",
        "parish": "KISOWERA",
        "village": "KIBIRI",
        "district": "MUKONO",
        "phone": "+256781234567",
    },
    "CM900234567EFGH": {
        "full_name": "OKELLO JAMES",
        "nin": "CM900234567EFGH",
        "sex": "M",
        "date_of_birth": "1990-07-22",
        "parish": "KAWEMPE",
        "village": "KASUUBO",
        "district": "KAMPALA",
        "phone": "+256702345678",
    },
    "CF880345678IJKL": {
        "full_name": "AUMA GRACE",
        "nin": "CF880345678IJKL",
        "sex": "F",
        "date_of_birth": "1988-11-10",
        "parish": "LIRA",
        "village": "ADEK",
        "district": "LIRA",
        "phone": "+256773456789",
    },
    "CM950456789MNOP": {
        "full_name": "TUMUSIIME DAVID",
        "nin": "CM950456789MNOP",
        "sex": "M",
        "date_of_birth": "1995-01-30",
        "parish": "MBARARA",
        "village": "NYAKYERA",
        "district": "MBARARA",
        "phone": "+256784567890",
    },
}


class NIRAService:
    def __init__(self):
        self.api_url = settings.NIRA_API_URL
        self.api_key = settings.NIRA_API_KEY

    async def verify_nin(self, nin: str) -> Optional[dict]:
        record = MOCK_NIRA_DB.get(nin.upper())
        if record:
            return {
                "found": True,
                "nin": record["nin"],
                "full_name": record["full_name"],
                "parish": record["parish"],
                "village": record["village"],
                "district": record["district"],
                "phone": record.get("phone"),
            }
        return {
            "found": False,
            "nin": nin,
            "full_name": None,
            "parish": None,
            "village": None,
            "district": None,
            "phone": None,
        }


nira_service = NIRAService()
