from fastapi import APIRouter
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Request
from .. import database
from sqlalchemy.orm import Session
from app.models.customModel import CustomModel

router = APIRouter()

class CustomModelRequest(BaseModel):
    name: str
    powerConsumption: float
    waterUsage: float
    Co2: float

@router.post("/save", tags=["Custom Models"])
async def saveCustomModel(
    request: Request,
    payload: CustomModelRequest,
    db: Session = Depends(database.getDatabase)
):
    sessionID = request.cookies.get("sessionID")

    if not sessionID:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    sessionManager = request.app.state.sessionManager
    cookieUserID = sessionManager.getUserID(sessionID)

    if cookieUserID is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    customModel = CustomModel(
        Name=payload.name,
        Power_Consumption=payload.powerConsumption,
        Water_Usage=payload.waterUsage,
        Co2=payload.Co2,
        User_ID=cookieUserID
    )

    database.writeCustomModel(db, customModel)

    return {"custom": True}

@router.get("/getAll", tags=["Custom Models"])
async def getAllUserCustomModels(
    request: Request,
    db: Session = Depends(database.getDatabase)
):
    sessionID = request.cookies.get("sessionID")

    if not sessionID:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )
    
    sessionManager = request.app.state.sessionManager
    cookieUserID = sessionManager.getUserID(sessionID)
    
    if cookieUserID is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    return database.readCustomModelsByUser(db, cookieUserID)