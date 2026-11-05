from fastapi import APIRouter
from .. import database
from .. import services
from pydantic import BaseModel
from fastapi import Depends
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


#list a single model, e.g. /api/v1/models/5
@router.get("/{modelID}", tags=["Models"], response_model=ModelSchema)
def getModel(modelID: int, db: Session = Depends(database.getDatabase)):
    model = database.readModel(db, modelID)
    return model