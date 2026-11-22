from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.databaseConfig import Base

class Provider(Base):
    __tablename__ = "providers"

    id = Column(Integer, primary_key=True, index=True)
    Name = Column(String(100), nullable=False)

    Models = relationship("Model", back_populates="Provider")