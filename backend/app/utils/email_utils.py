# app/utils/email_utils.py
import aiosmtplib
from email.message import EmailMessage
from app.config import (
    MAIL_SERVER,
    MAIL_PORT,
    MAIL_USERNAME,
    MAIL_PASSWORD,
    MAIL_USE_TLS,
    MAIL_FROM_NAME,
    MAIL_FROM_EMAIL,
)

async def send_email(subject: str, recipient: str, body: str):
    message = EmailMessage()
    message["From"] = f"{MAIL_FROM_NAME} <{MAIL_FROM_EMAIL}>"
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=MAIL_SERVER,
        port=MAIL_PORT,
        username=MAIL_USERNAME,
        password=MAIL_PASSWORD,
        start_tls=MAIL_USE_TLS,
    )

