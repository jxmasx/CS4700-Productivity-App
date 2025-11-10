from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import get_db, Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api", tags=["quests"])

class QuestItem(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    title = Column(String)
    type = Column(String)
    due_at = Column(String)
    is_active = Column(Integer)

class QuestIn(BaseModel):
    title: str
    type: str = "todo"         # 'habit' | 'daily' | 'todo'
    due_at: Optional[str] = None
    is_active: int = 1

@router.get("/users/{user_id}/quests")
def list_quests(user_id: int, db: Session = Depends(get_db)):
    db_items = db.query(QuestItem).filter(QuestItem.user_id == user_id).all()
    
    return db_items

@router.post("/users/{user_id}/quests", status_code=201)
def create_quest(item: QuestIn, user_id: int, db: Session = Depends(get_db)):
    try:
        db_item = QuestItem(
            user_id=user_id,
            title=item.title,
            type=item.type,
            due_at=item.due_at,
            is_active=item.is_active
        )
        db.add(db_item)
        db.flush()
        
        db.commit()
        db.refresh(db_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

    return db_item

@router.put("/users/{user_id}/quests/{quest_id}")
def update_quest(user_id: int, quest_id: int, item: QuestIn, db: Session = Depends(get_db)):
    db_item = db.query(QuestItem).filter(
        QuestItem.id == quest_id,
        QuestItem.user_id == user_id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    try:
        db_item.title = item.title
        db_item.type = item.type
        db_item.due_at = item.due_at
        db_item.is_active = item.is_active
        
        db.commit()
        db.refresh(db_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return db_item

@router.delete("/users/{user_id}/quests/{quest_id}", status_code=204)
def delete_quest(user_id: int, quest_id: int, db: Session = Depends(get_db)):
    db_item = db.query(QuestItem).filter(
        QuestItem.id == quest_id,
        QuestItem.user_id == user_id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Quest not found")
    
    try:
        db.delete(db_item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return None
