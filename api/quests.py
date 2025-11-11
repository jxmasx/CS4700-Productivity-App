from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from .db import get_conn

router = APIRouter(prefix="/api", tags=["quests"])

class QuestIn(BaseModel):
    title: str
    type: str = "todo"         # 'habit' | 'daily' | 'todo'
    rank: str = "E"            # 'E','D','C','B','A','S'
    notes: Optional[str] = None
    tags: str = "[]"
    due_at: Optional[str] = None
    repeats_rule: Optional[str] = None
    difficulty: int = 2
    is_negative: int = 0

@router.get("/users/{user_id}/quests")
def list_quests(user_id: int):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM quests WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]

@router.post("/users/{user_id}/quests", status_code=201)
def create_quest(user_id: int, payload: QuestIn):
    with get_conn() as conn:
        # ensure user exists
        exists = conn.execute("SELECT 1 FROM users WHERE id = ?", (user_id,)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="User not found")

        cur = conn.execute(
            """
            INSERT INTO quests (user_id, title, type, rank, notes, tags, due_at, repeats_rule,
                                difficulty, is_negative)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (user_id, payload.title, payload.type, payload.rank, payload.notes, payload.tags,
             payload.due_at, payload.repeats_rule, payload.difficulty, payload.is_negative)
        )
        quest_id = cur.lastrowid
        row = conn.execute("SELECT * FROM quests WHERE id = ?", (quest_id,)).fetchone()
        conn.commit()
        return dict(row)
