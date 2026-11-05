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
def saveAllProvidersAndModels(db: Session, provider: Provider):
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

#returns one provider, or None if the id doesn't exist
def readProvider(db: Session, providerID: int):
    return db.get(Provider, providerID)

#returns one provider by its name (e.g. "openai"), or None if there isn't one
def readProviderByName(db: Session, name: str):
    return db.query(Provider).filter(Provider.Name == name).first()

#returns every model that belongs to one provider
def readModelsByProvider(db: Session, providerID: int):
    return db.query(Model).filter(Model.Provider_ID == providerID).all()

#returns one model, or None if the id doesn't exist
def readModel(db: Session, modelID: int):
    return db.get(Model, modelID)

def searchModel(db: Session, name: str):
    return db.query(Model).filter(Model.Name.contains(name, autoescape=True)).order_by(Model.Name).all()