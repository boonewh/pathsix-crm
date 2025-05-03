from app.database import Base, engine
from app import models  # Make sure this imports the file with your Client model

Base.metadata.create_all(bind=engine)
