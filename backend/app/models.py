from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
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
    client_id = Column(Integer, nullable=False, index=True)  # Multi-tenant
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
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, nullable=False)  # Multi-tenant
    name = Column(String(100), nullable=False)
    email = Column(String(120))
    phone = Column(String(20))
    address = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Client {self.name}>"

class Lead(Base):
    __tablename__ = 'leads'
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(120), index=True)
    phone = Column(String(20))
    address = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Lead {self.name}>"

class Project(Base):
    __tablename__ = 'projects'
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, nullable=False)
    title = Column(String(100), nullable=False)
    status = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Project {self.title}>"

class Interaction(Base):
    __tablename__ = 'interactions'
    id = Column(Integer, primary_key=True)
    client_id = Column(Integer, nullable=False)
    contact_date = Column(DateTime, default=datetime.utcnow)
    summary = Column(String(255))

    def __repr__(self):
        return f"<Interaction {self.id} on {self.contact_date}>"
