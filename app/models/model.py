from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.databaseConfig import Base

class Model(Base):
    __tablename__ = "model"

    id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False)
    Power_Consumption = Column(Float, nullable=False)
    Co2 = Column(Float, nullable=False)
    Water_Usage = Column(Float, nullable=False)


    Provider_ID = Column(Integer, ForeignKey("providers.id"))
    Provider = relationship("Provider", back_populates="Models")