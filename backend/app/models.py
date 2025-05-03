from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base

class Client(Base):
    __tablename__ = 'clients'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True)
    phone = Column(String(20))
    address = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
