from sqlalchemy.orm import scoped_session, sessionmaker, declarative_base
from sqlalchemy import create_engine
from app.config import SQLALCHEMY_DATABASE_URI

# SQLAlchemy Engine and Session setup
engine = create_engine(SQLALCHEMY_DATABASE_URI, echo=False, future=True)
SessionLocal = scoped_session(sessionmaker(bind=engine, autoflush=False, autocommit=False))

# Base class for declarative models
Base = declarative_base()
