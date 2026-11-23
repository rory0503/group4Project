from fastapi import APIRouter, Request, HTTPException
from .. import database
from .. import services
from app.models.savedModel import SavedModel
from pydantic import BaseModel
from fastapi import Depends, Query
from sqlalchemy.orm import Session



router = APIRouter()

#formats the output json. the provider's name is included so a second request isn't needed
class ModelProviderSchema(BaseModel):
    id: int
    Name: str

    class Config:
        from_attributes = True


class ModelSchema(BaseModel):
    id: int
    Name: str
    Power_Consumption: float | None
    Co2: float
    Water_Usage: float
    Provider: ModelProviderSchema

    class Config:
        from_attributes = True

class saveModelRequest(BaseModel):
    modelProvider: str
    modelName: str

#list a single model, e.g. /api/v1/models/5
@router.get("/search", tags=["Models"], response_model=list[ModelSchema])
def searchModel(Name: str = Query(min_length=2),  db: Session = Depends(database.getDatabase)):
    models = database.searchModel(db, Name)
    return models

#models are being saved by name, not ID as models change as it gets updated
#if the model ends up being not found because it was removed from ecologits, then it'll delete the saved model
@router.post("/saveModel", tags=["Models"])
def saveModel(
    request: Request,
    payload: saveModelRequest,
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

    savedModel = SavedModel(
        ModelName = payload.modelName,
        ModelProvider = payload.modelProvider,
        User_ID = cookieUserID
    )

    database.writeSavedModel(db, savedModel)

@router.get("/viewSavedModels", tags=["Models"])
def viewSavedModels(
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

    savedModels = database.readSavedModelsByUser(db, cookieUserID)

    return savedModels
    
@router.get("/{modelID : int}", tags=["Models"], response_model=ModelSchema)
def getModel(modelID: int, db: Session = Depends(database.getDatabase)):
    model = database.readModel(db, modelID)
    return model