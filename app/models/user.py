from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.databaseConfig import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    customModels = relationship("CustomModel", back_populates="User")
    savedModels = relationship("SavedModel", back_populates="User")