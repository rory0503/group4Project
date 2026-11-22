from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.databaseConfig import Base

class SavedModel(Base):
    __tablename__ = "savedModels"

    id = Column(Integer, primary_key=True, index=True)
    ModelName = Column(String(100), nullable=False)
    ModelProvider = Column(String(100), nullable=False)

    User_ID = Column(Integer, ForeignKey("users.id"), nullable=False)
    User = relationship("User", back_populates="savedModels")