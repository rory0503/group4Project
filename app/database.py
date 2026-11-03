from app.databaseConfig import SessionLocal
from sqlalchemy.orm import Session
from app.models.model import Model
from app.models.provider import Provider

#create a database session that closes after use
def getDatabase():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#this function lets us create and store a model in the database, all in one go
def saveProvider(db: Session, provider: Provider):
    db = SessionLocal()

    try:
        db.add(provider)

        print("Before commit:")
        print("Provider:", provider.Name)
        print("Provider ID:", provider.id)
        print("Amount of models:", len(provider.Models))

        for model in provider.Models:
            print("Model:", model.Name)
            print("Model Provider ID:", model.Provider_ID)

        db.commit()
        db.refresh(provider)

        return provider

    except Exception as error:
        db.rollback()
        print(type(error))
        print(str(error))

def readProviderList(db: Session):
    providers = db.query(Provider).all()
    return providers

#TODO: more functions to automate creating, storing and reading models