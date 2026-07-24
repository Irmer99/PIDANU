import logging
import time
from collections import defaultdict
from typing import Dict, Tuple

logger = logging.getLogger(__name__)


class RateLimiter:
    def __init__(self):
        self._store: Dict[str, list] = defaultdict(list)

    def is_rate_limited(self, key: str, max_requests: int, window_seconds: int) -> bool:
        now = time.time()
        cutoff = now - window_seconds

        self._store[key] = [t for t in self._store[key] if t > cutoff]

        if len(self._store[key]) >= max_requests:
            return True

        self._store[key].append(now)
        return False

    def check_ussd(self, phone: str) -> bool:
        return self.is_rate_limited(f"ussd:{phone}", max_requests=10, window_seconds=3600)

    def check_sms(self, phone: str) -> bool:
        return self.is_rate_limited(f"sms:{phone}", max_requests=5, window_seconds=3600)

    def check_service_apply(self, nin: str) -> bool:
        return self.is_rate_limited(f"apply:{nin}", max_requests=3, window_seconds=86400)

    def check_voice(self, phone: str) -> bool:
        return self.is_rate_limited(f"voice:{phone}", max_requests=10, window_seconds=3600)

    def check_admin(self, identifier: str) -> bool:
        return self.is_rate_limited(f"admin:{identifier}", max_requests=100, window_seconds=3600)


rate_limiter = RateLimiter()
