from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

# Association table for many-to-many User ↔ Role
user_roles = Table(
    'user_roles',
    Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id')),
    Column('role_id', Integer, ForeignKey('roles.id')),
)

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    roles = relationship("Role", secondary=user_roles, back_populates="users")

    def __repr__(self):
        return f"<User {self.email}>"

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True)
    name = Column(String(50), unique=True, nullable=False)

    users = relationship("User", secondary=user_roles, back_populates="roles")

    def __repr__(self):
        return f"<Role {self.name}>"

class Client(Base):
    __tablename__ = 'clients'
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    contact_person = Column(String(100))
    email = Column(String(120), index=True)
    phone = Column(String(20))
    address = Column(String(255))
    city = Column(String(100))
    state = Column(String(100))
    zip = Column(String(20))
    status = Column(String(50), default='new')
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Client {self.name}>"

class Lead(Base):
    __tablename__ = 'leads'
    id = Column(Integer, primary_key=True)
    tenant_id = Column(Integer, nullable=False)
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

    def __repr__(self):
        return f"<Lead {self.name}>"

class Project(Base):
    __tablename__ = 'projects'
    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=True)
    tenant_id = Column(Integer, nullable=False)
    project_name = Column(String(255), nullable=False)
    project_description = Column(Text, nullable=True)
    project_status = Column(String(20), nullable=False)
    project_start = Column(DateTime, nullable=True)
    project_end = Column(DateTime, nullable=True)
    project_worth = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    last_updated_by = Column(Integer, ForeignKey('users.id'), nullable=True)

    def __repr__(self):
        return f"<Project {self.project_name}>"

class Interaction(Base):
    __tablename__ = 'interactions'

    id = Column(Integer, primary_key=True)
    lead_id = Column(Integer, ForeignKey('leads.id'), nullable=True)
    client_id = Column(Integer, ForeignKey('clients.id'), nullable=True)
    tenant_id = Column(Integer, nullable=False)
    contact_person = Column(String)
    email = Column(String)
    phone = Column(String)
    contact_date = Column(DateTime, default=datetime.utcnow)
    outcome = Column(String(255))
    notes = Column(Text)
    follow_up = Column(DateTime, nullable=True)
    summary = Column(String(255))

    lead = relationship("Lead", backref="interactions")
    client = relationship("Client", backref="interactions")

    def __repr__(self):
        return f"<Interaction {self.id} on {self.contact_date}>"
