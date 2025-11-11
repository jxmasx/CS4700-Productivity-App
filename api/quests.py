from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import text
from .db import get_db

router = APIRouter(prefix="/api", tags=["quests"])


class QuestIn(BaseModel):
    title: str
    type: str = "todo"          # 'habit' | 'daily' | 'todo'
    rank: str = "E"             # 'E','D','C','B','A','S'
    notes: Optional[str] = None
    tags: str = "[]"
    due_at: Optional[str] = None
    repeats_rule: Optional[str] = None
    difficulty: int = 2
    is_negative: int = 0


@router.get("/users/{user_id}/quests")
def list_quests(user_id: int, db: Session = Depends(get_db)):
    rows = db.execute(
        text("SELECT * FROM quests WHERE user_id = :user_id ORDER BY created_at DESC"),
        {"user_id": user_id},
    ).mappings().all()
    return [dict(r) for r in rows]


@router.post("/users/{user_id}/quests", status_code=201)
def create_quest(user_id: int, payload: QuestIn, db: Session = Depends(get_db)):
    exists = db.execute(
        text("SELECT 1 FROM users WHERE id = :id"),
        {"id": user_id},
    ).first()
    if not exists:
        raise HTTPException(status_code=404, detail="User not found")

    result = db.execute(
        text("""
            INSERT INTO quests (
                user_id, title, type, rank, notes, tags, due_at, repeats_rule, difficulty, is_negative
            ) VALUES (
                :user_id, :title, :type, :rank, :notes, :tags, :due_at, :repeats_rule, :difficulty, :is_negative
            )
        """),
        {
            "user_id": user_id,
            "title": payload.title,
            "type": payload.type,
            "rank": payload.rank,
            "notes": payload.notes,
            "tags": payload.tags,
            "due_at": payload.due_at,
            "repeats_rule": payload.repeats_rule,
            "difficulty": payload.difficulty,
            "is_negative": payload.is_negative,
        }
    )
    quest_id = result.lastrowid
    db.commit()

    row = db.execute(
        text("SELECT * FROM quests WHERE id = :id"),
        {"id": quest_id},
    ).mappings().one()
    return dict(row)
