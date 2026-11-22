from fastapi import APIRouter
from .. import database
from .. import services
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session

router = APIRouter()

#formats the output json. id is included so you can ask for a provider's models
class ProviderSchema(BaseModel):
    id: int
    Name: str

    class Config:
        from_attributes = True


class ProviderModelSchema(BaseModel):
    id: int
    Name: str
    Power_Consumption: float
    Co2: float
    Water_Usage: float
    Provider_ID: int

    class Config:
        from_attributes = True


#list all providers
@router.get("/", tags=["Providers"], response_model=list[ProviderSchema])
def listProviders(db: Session = Depends(database.getDatabase)):
    return database.readProviderList(db)


#list all models for one provider, e.g. /api/v1/providers/openai/models
@router.get("/{providerName}/models", tags=["Providers"], response_model=list[ProviderModelSchema])
def listProviderModels(providerName: str, db: Session = Depends(database.getDatabase)):
    provider = database.readProviderByName(db, providerName)
    return database.readModelsByProvider(db, provider.id)