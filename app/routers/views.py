from fastapi import APIRouter
from time import time 

lastUpdate = int(time())

router = APIRouter()

#added classes to format the output json to be nested. will be moved.
from .. import database
from .. import services
from pydantic import BaseModel
from fastapi import Depends
from sqlalchemy.orm import Session

class ModelSchema(BaseModel):
    Name: str
    Power_Consumption: float
    Co2: float
    Water_Usage: float

    class Config:
        from_attributes = True


class ProviderSchema(BaseModel):
    Name: str
    Models: list[ModelSchema]

    class Config:
        from_attributes = True

class ProviderListSchema(BaseModel):
    providers: list[ProviderSchema]

@router.get("/", tags=["Views"])
async def view(db: Session = Depends(database.getDatabase)):
    providers = services.collect_data()

    for provider in providers:
        database.saveAllProvidersAndModels(db, provider)
    
    providers = database.readProviderList(db)

    output = ProviderListSchema(
    providers=[
        ProviderSchema.model_validate(provider)
        for provider in providers
    ]
    )

    return output

    #return  int(time()) - lastUpdate
    #TODO: if it has been a full 24 hours, run the function in services to get new data, or perhaps a function in utils that handles it all. 