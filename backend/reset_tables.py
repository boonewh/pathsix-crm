from app.database import Base, engine
from app import models

# Drop all tables
Base.metadata.drop_all(bind=engine)

# Recreate all tables
Base.metadata.create_all(bind=engine)

print("✅ All tables dropped and recreated.")