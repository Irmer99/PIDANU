import logging
from typing import Optional

logger = logging.getLogger(__name__)


class NotificationService:
    async def send_sms(self, phone_number: str, message: str) -> bool:
        logger.info(f"SMS to {phone_number}: {message[:50]}...")
        return True

    async def notify_request_status(self, phone: str, request_code: str, status: str) -> bool:
        msg = f"Your request {request_code} has been {status}. Check PI-DANU for details."
        return await self.send_sms(phone, msg)

    async def notify_resource_distribution(self, phone: str, resource_type: str, quantity: int) -> bool:
        msg = f"You have received {quantity} {resource_type} from PDM. Visit your Parish Chief for collection."
        return await self.send_sms(phone, msg)

    async def notify_monthly_report(self, phone: str, parish: str, month: str) -> bool:
        msg = f"Monthly report for {parish} is ready for {month}. Dial *384*PI*01# for details."
        return await self.send_sms(phone, msg)


notification_service = NotificationService()
