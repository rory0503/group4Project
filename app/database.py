from app.databaseConfig import SessionLocal
from sqlalchemy.orm import Session
from app.models.model import Model
from app.models.provider import Provider
from sqlalchemy import text

#create a database session that closes after use
def getDatabase():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

#this function lets us create and store a model in the database, all in one go
def saveAllProvidersAndModels(db: Session, providers: list[Provider]):
    try:
        db.add_all(providers)

        db.commit()

        for provider in providers:
            db.refresh(provider)

        return providers

    except Exception as error:
        db.rollback()
        print(type(error))
        print(str(error))
        raise

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

def deleteAllProvidersAndModels(db: Session):
    try:
        db.query(Model).delete(synchronize_session=False)
        db.query(Provider).delete(synchronize_session=False)

        # Reset auto-increment counters
        db.execute(text("ALTER TABLE model AUTO_INCREMENT = 1"))
        db.execute(text("ALTER TABLE providers AUTO_INCREMENT = 1"))

        db.commit()

        print("All providers and models have been deleted and ID counters reset.")

    except Exception as error:
        db.rollback()
        print("Error deleting providers and models:")
        print(str(error))
        raise