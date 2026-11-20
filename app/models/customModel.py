from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.databaseConfig import Base

class CustomModel(Base):
    __tablename__ = "customModel"

    id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False)
    Power_Consumption = Column(Float, nullable=False)
    Co2 = Column(Float, nullable=False)
    Water_Usage = Column(Float, nullable=False)

    User_ID = Column(Integer, ForeignKey("users.id"), nullable=False)
    User = relationship("User", back_populates="customModels")