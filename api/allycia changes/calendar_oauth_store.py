from sqlalchemy import Column, String, Integer, DateTime, Text
from .db import Base

class CalendarAccount(Base):
    __tablename__ = "calendar_accounts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, index=True)
    provider = Column(String(16))       
    access_token = Column(Text)
    refresh_token = Column(Text)
    expires_at = Column(DateTime)  
