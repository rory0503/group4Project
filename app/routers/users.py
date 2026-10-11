from fastapi import APIRouter

router = APIRouter()


@router.get("/", tags=["Users"])
async def read_users():
    return [{"username": "Rick"}, {"username": "Morty"}]


@router.get("/me", tags=["Users"])
async def read_user_me():
    return {"username": "fakecurrentuser"}


@router.get("/{username}", tags=["Users"])
async def read_user(username: str):
    return {"username": username}