from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from .db import get_conn
import bcrypt

router = APIRouter(prefix="/api", tags=["auth"])

class SignupIn(BaseModel):
    email: EmailStr
    display_name: str
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    display_name: str

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@router.post("/signup", response_model=UserOut, status_code=201)
def signup(payload: SignupIn):
    with get_conn() as conn:
        conn.execute("""
          CREATE TABLE IF NOT EXISTS user_passwords (
            user_id INTEGER UNIQUE,
            pass_hash BLOB NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        """)
        try:
            cur = conn.execute(
                "INSERT INTO users (email, display_name) VALUES (?, ?)",
                (payload.email, payload.display_name)
            )
        except Exception as e:
            if "UNIQUE" in str(e):
                raise HTTPException(status_code=409, detail="Email already exists")
            raise

        user_id = cur.lastrowid
        pass_hash = bcrypt.hashpw(payload.password.encode(), bcrypt.gensalt())
        conn.execute(
            "INSERT INTO user_passwords (user_id, pass_hash) VALUES (?, ?)",
            (user_id, pass_hash)
        )
        conn.commit()

        return UserOut(id=user_id, email=payload.email, display_name=payload.display_name)

@router.post("/login", response_model=UserOut)
def login(payload: LoginIn):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, email, display_name FROM users WHERE email = ?",
            (payload.email,)
        ).fetchone()
        if not row:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        pw = conn.execute(
            "SELECT pass_hash FROM user_passwords WHERE user_id = ?",
            (row["id"],)
        ).fetchone()
        if not pw or not bcrypt.checkpw(payload.password.encode(), pw["pass_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return UserOut(id=row["id"], email=row["email"], display_name=row["display_name"])
