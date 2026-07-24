from datetime import datetime


def format_datetime(dt: datetime) -> str:
    if dt is None:
        return "N/A"
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def generate_application_reference(application_id: str) -> str:
    short_id = application_id[:8].upper()
    date_str = datetime.utcnow().strftime("%Y%m")
    return f"PDM-{date_str}-{short_id}"
