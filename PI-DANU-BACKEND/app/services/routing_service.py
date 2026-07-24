import logging
import math
from typing import Optional, List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pdr_office import PDROffice

logger = logging.getLogger(__name__)

EARTH_RADIUS_KM = 6371


def haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return EARTH_RADIUS_KM * c


class RoutingService:
    async def find_nearest_office(
        self,
        db: AsyncSession,
        latitude: float,
        longitude: float,
        limit: int = 1,
    ) -> List[dict]:
        result = await db.execute(select(PDROffice))
        offices = result.scalars().all()

        office_distances = []
        for office in offices:
            distance = haversine_distance(
                latitude, longitude, office.latitude, office.longitude
            )
            office_distances.append(
                {
                    "office": office,
                    "distance_km": round(distance, 2),
                }
            )

        office_distances.sort(key=lambda x: x["distance_km"])
        return office_distances[:limit]

    async def find_office_by_parish(
        self, db: AsyncSession, parish: str, district: Optional[str] = None
    ) -> Optional[PDROffice]:
        query = select(PDROffice).where(
            PDROffice.parish.ilike(f"%{parish}%")
        )
        if district:
            query = query.where(PDROffice.district.ilike(f"%{district}%"))

        result = await db.execute(query)
        return result.scalars().first()


routing_service = RoutingService()
