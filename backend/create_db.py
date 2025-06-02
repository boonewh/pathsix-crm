from app.database import Base, engine
from app import models  # Make sure this import triggers model definitions

Base.metadata.create_all(engine)
print("Local SQLite DB created.")
