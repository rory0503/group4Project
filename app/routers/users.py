from pwdlib import PasswordHash
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from .. import database
from app.models.user import User

router = APIRouter()
password_hash = PasswordHash.recommended()

class RegisterRequest(BaseModel):
    email: str
    password: str

@router.post("/register", tags=["Users"])
async def register(
    payload: RegisterRequest,
    db: Session = Depends(database.getDatabase)
):
    normalisedEmail = payload.email.lower()

    if database.readUser(db, normalisedEmail):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )

    hashedPassword = password_hash.hash(payload.password)

    newUser = User(
        email = normalisedEmail,
        password = hashedPassword
    )

    database.writeUser(db, newUser)

    created_user = database.readUser(db, normalisedEmail)
    return {"id": created_user.id, "email": created_user.email}

@router.post("/login", tags=["Users"])
async def login(
    request: Request,
    response: Response,
    payload: RegisterRequest,
    db: Session = Depends(database.getDatabase),
):
    normaliseEmail = payload.email.lower()

    user = database.readUser(db, normaliseEmail)

    if user is None or not password_hash.verify(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    else:
        sessionManager = request.app.state.sessionManager
        sessionID = sessionManager.createSession(user.id)

        response.set_cookie(
            key = "sessionID",
            value = sessionID,
            httponly = True,
            secure = True,
            samesite = "lax",
            max_age = 86400
        )
        
        response.status_code = status.HTTP_200_OK
        return response