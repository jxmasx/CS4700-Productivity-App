from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session
from db import get_db, Base
from typing import Optional

router = APIRouter(prefix="/api", tags=["calendar"])

class CalendarItem(Base):
    __tablename__ = "calendar"
    user_id = Column(Integer, primary_key=True, index=True)
    store_local_events = Column(String)
    store_tasks = Column(String)
    
class CalendarInfo(BaseModel):
    store_local_events: Optional[str] = None
    store_tasks: Optional[str] = None
    
    class Config:
        from_attributes = True

# Get a user's calendar info
@router.get("/users/{user_id}/calendar", response_model=CalendarInfo)
async def get_calendar(user_id: int, db: Session = Depends(get_db)):
    db_items = db.query(CalendarItem).filter(CalendarItem.user_id == user_id).first()
    
    if not db_items:
        # Auto-create calendar entry for existing users
        db_items = CalendarItem(
            user_id=user_id,
            store_local_events="[]",
            store_tasks="[]"
        )
        db.add(db_items)
        try:
            db.commit()
            db.refresh(db_items)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to create calendar: {str(e)}")

    return db_items

# Update a user's calendar info
@router.patch("/users/{user_id}/calendar")
async def update_calendar(user_id: int, info: CalendarInfo, db: Session = Depends(get_db)):
    item = db.query(CalendarItem).filter(CalendarItem.user_id == user_id).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Calendar not found")
    
    # Only update fields that are provided
    if info.store_local_events is not None:
        item.store_local_events = info.store_local_events
    if info.store_tasks is not None:
        item.store_tasks = info.store_tasks
    
    try:
        db.commit()
        db.refresh(item)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update calendar: {str(e)}")
    
    return {"success": True, "store_local_events": item.store_local_events, "store_tasks": item.store_tasks}
