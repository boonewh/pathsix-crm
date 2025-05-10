from sqlalchemy.orm import relationship
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from datetime import datetime
from app.database import Base

class Lead(Base):
    __tablename__ = 'leads'

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100))  
    email = Column(String(120), unique=True, index=True)
    phone = Column(String(20))
    address = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    zip = Column(String(20))
    status = Column(String(50), default='new')
    notes = Column(Text) 
    created_at = Column(DateTime, default=datetime.utcnow)

class Client(Base):
    __tablename__ = 'clients'

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100))  
    email = Column(String(120), index=True)
    phone = Column(String(20))
    address = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    zip = Column(String(20))
    notes = Column(Text)  
    created_at = Column(DateTime, default=datetime.utcnow)

class Interaction(Base):
    __tablename__ = 'interactions'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=True)
    contact_date = Column(DateTime, default=datetime.utcnow)
    outcome = Column(String(255))
    notes = Column(Text)
    follow_up = Column(DateTime, nullable=True)

    # Relationships (lazy='joined' optional for performance)
    lead = relationship("Lead", backref="interactions")
    client = relationship("Client", backref="interactions")

