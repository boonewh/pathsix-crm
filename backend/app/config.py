import os
raw_db_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
if raw_db_url.startswith("postgres://"):
    raw_db_url = raw_db_url.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URI = raw_db_url
SECRET_KEY = "jfurhf638547546wehfue7"

MAIL_SERVER = "mail.gandi.net"
MAIL_PORT = 587
MAIL_USERNAME = "support@pathsixdesigns.com"
MAIL_PASSWORD = "@Dr@g0ns2024"
MAIL_USE_TLS = True
MAIL_FROM_NAME = "PathSix CRM"
MAIL_FROM_EMAIL = "support@pathsixdesigns.com"
