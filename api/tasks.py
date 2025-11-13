from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from db import get_db, Base
from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import Session

router = APIRouter(prefix="/api", tags=["tasks"])

class TaskItem(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer)
    title = Column(String)
    type = Column(String)
    category = Column(String)
    difficulty = Column(String)
    due_at = Column(String)
    done = Column(Integer)
    poms_done = Column(Integer)
    poms_estimate = Column(Integer)

class TaskIn(BaseModel):
    id: str
    title: str
    type: str = "todo"         # 'habit' | 'daily' | 'todo'
    category: str
    difficulty: str
    due_at: Optional[str] = None
    done: int = 0
    poms_done: Optional[int] = None
    poms_estimate: Optional[int] = None

@router.get("/users/{user_id}/tasks")
def list_tasks(user_id: int, db: Session = Depends(get_db)):
    db_items = db.query(TaskItem).filter(TaskItem.user_id == user_id).all()
    
    return db_items

@router.post("/users/{user_id}/tasks", status_code=201)
def create_task(item: TaskIn, user_id: int, db: Session = Depends(get_db)):
    try:
        db_item = TaskItem(
            id=item.id,
            user_id=user_id,
            title=item.title,
            type=item.type,
            category=item.category,
            difficulty=item.difficulty,
            due_at=item.due_at,
            done=item.done,
            poms_done=item.poms_done,
            poms_estimate=item.poms_estimate
        )
        db.add(db_item)
        db.flush()
        
        db.commit()
        db.refresh(db_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

    return db_item

@router.put("/users/{user_id}/tasks/{task_id}")
def update_task(user_id: int, task_id: int, item: TaskIn, db: Session = Depends(get_db)):
    db_item = db.query(TaskItem).filter(
        TaskItem.id == task_id,
        TaskItem.user_id == user_id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Task not found")
    
    try:
        db_item.title = item.title
        db_item.type = item.type
        db_item.category = item.category
        db_item.difficulty = item.difficulty
        db_item.due_at = item.due_at
        db_item.done = item.done
        db_item.poms_done = item.poms_done
        db_item.poms_estimate = item.poms_estimate
        
        db.commit()
        db.refresh(db_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return db_item

@router.delete("/users/{user_id}/tasks/{task_id}", status_code=204)
def delete_task(user_id: int, task_id: int, db: Session = Depends(get_db)):
    db_item = db.query(TaskItem).filter(
        TaskItem.id == task_id,
        TaskItem.user_id == user_id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Task not found")
    
    try:
        db.delete(db_item)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return None
