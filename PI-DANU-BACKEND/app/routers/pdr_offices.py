from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.pdr_office import PDROffice
from app.schemas.pdr_office import (
    NearestPDROfficeRequest,
    NearestPDROfficeResponse,
    PDROfficeResponse,
)
from app.services.routing_service import routing_service

router = APIRouter(prefix="/api/pdr-offices", tags=["pdr-offices"])


@router.post("/nearest", response_model=NearestPDROfficeResponse)
async def find_nearest_office(
    req: NearestPDROfficeRequest, db: AsyncSession = Depends(get_db)
):
    results = await routing_service.find_nearest_office(
        db=db, latitude=req.latitude, longitude=req.longitude, limit=1
    )
    if not results:
        raise HTTPException(
            status_code=404, detail="No PDR offices found in the database"
        )

    nearest = results[0]
    office = nearest["office"]
    distance = nearest["distance_km"]

    if distance < 5:
        hint = f"The nearest PDR office is {office.name}, only {distance}km away. You can walk or take a boda-boda."
    elif distance < 20:
        hint = f"The nearest PDR office is {office.name}, about {distance}km away. You can take a taxi or boda-boda."
    else:
        hint = f"The nearest PDR office is {office.name}, about {distance}km away. We recommend taking a taxi from the main stage."

    return NearestPDROfficeResponse(
        office=PDROfficeResponse.model_validate(office),
        distance_km=distance,
        directions_hint=hint,
    )


@router.get("/", response_model=list[PDROfficeResponse])
async def list_offices(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PDROffice))
    return result.scalars().all()


@router.get("/{office_id}", response_model=PDROfficeResponse)
async def get_office(office_id: str, db: AsyncSession = Depends(get_db)):
    from uuid import UUID

    result = await db.execute(
        select(PDROffice).where(PDROffice.id == UUID(office_id))
    )
    office = result.scalars().first()
    if not office:
        raise HTTPException(status_code=404, detail="PDR office not found")
    return office
