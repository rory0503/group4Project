from fastapi import APIRouter
from time import time 

lastUpdate = int(time())
refreshDelay = 86400 #24 hours in seconds

router = APIRouter()

#added classes to format the output json to be nested. will be moved.
from .. import database
from .. import services
from fastapi import Depends
from sqlalchemy.orm import Session
from app.utils import compareProvidersAndModels

def updateModelsAndProviders(db: Session):
    newProviders = services.collect_data()
    savedProviders = database.readProviderList(db)

    if compareProvidersAndModels(newProviders, savedProviders) == False:
        print("deleting")
        database.deleteAllProvidersAndModels(db)
        print("writing")
        database.saveAllProvidersAndModels(db, newProviders)

@router.get("/", tags=["Views"])
async def view(db: Session = Depends(database.getDatabase)):
    
    currentTime = time()

    if (currentTime - lastUpdate) > refreshDelay:

        updateModelsAndProviders(db)