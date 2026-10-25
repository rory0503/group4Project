from fastapi import APIRouter
from time import time 

lastUpdate = int(time())

router = APIRouter()

@router.get("/", tags=["Views"])
async def view():
    return  int(time()) - lastUpdate
    #TODO: if it has been a full 24 hours, run the function in services to get new data, or perhaps a function in utils that handles it all. 