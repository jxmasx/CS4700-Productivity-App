from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from db import get_db, Base
import bcrypt
from datetime import datetime
from sqlalchemy import Column, Integer, String, BLOB
from sqlalchemy.orm import Session
import logging

from tasks import TaskItem

router = APIRouter(prefix="/api", tags=["auth"])

logger = logging.getLogger(__name__)

class UserItem(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    display_name = Column(String, nullable=False)
    created_at = Column(String, nullable=False, default=lambda: datetime.now().isoformat())
    level = Column(Integer, nullable=False, default=1)
    xp = Column(Integer, nullable=False, default=0)
    xp_max = Column(Integer, nullable=False, default=100)
    hp = Column(Integer, nullable=False, default=100)
    mana = Column(Integer, nullable=False, default=50)
    gold = Column(Integer, nullable=False, default=0)
    diamonds = Column(Integer, nullable=False, default=0)
    guild_rank = Column(String, nullable=False, default='Bronze')
    guild_streak = Column(Integer, nullable=False, default=0)
    strength = Column(Integer, nullable=False, default=0)
    dexterity = Column(Integer, nullable=False, default=0)
    intelligence = Column(Integer, nullable=False, default=0)
    wisdom = Column(Integer, nullable=False, default=0)
    charisma = Column(Integer, nullable=False, default=0)
    user_class = Column(String, nullable=False, default='Bronze')
    last_rollover = Column(String, nullable=True)

class PassItem(Base):
    __tablename__ = "user_passwords"
    user_id = Column(Integer, primary_key=True, index=True)
    pass_hash = Column(BLOB)

class ReadUsers(BaseModel):
    display_name: str
    
    class Config:
        from_attributes = True

class SignupIn(BaseModel):
    email: EmailStr
    display_name: str
    password: str

class UserOut(BaseModel):
    id: int

class UserFullOut(BaseModel):
    id: int
    email: str
    display_name: str
    created_at: str
    level: int
    xp: int
    xp_max: int
    hp: int
    mana: int
    gold: int
    diamonds: int
    guild_rank: str
    guild_streak: int
    strength: int
    dexterity: int
    intelligence: int
    wisdom: int
    charisma: int
    user_class: str
    last_rollover: str = None
    
    class Config:
        from_attributes = True

class LoginIn(BaseModel):
    display_name: str
    password: str

# This gets all the account names when signing up to compare
@router.get("/users", response_model=list[ReadUsers])
async def read_items(db: Session = Depends(get_db)):
    db_items = db.query(UserItem.display_name).all()
    
    if not db_items:
        raise HTTPException(status_code=404, detail="No users found")

    return db_items

# Signup with email, display_name, and password
@router.post("/signup", response_model=UserOut)
async def create_item(item: SignupIn, db: Session = Depends(get_db)):
    pass_hash = bcrypt.hashpw(item.password.encode(), bcrypt.gensalt())

    try:
        db_item = UserItem(
            email=item.email,
            display_name=item.display_name
        )
        db.add(db_item)
        db.flush()

        pass_item = PassItem(user_id=db_item.id, pass_hash=pass_hash)
        db.add(pass_item)
        
        # default_tasks = [
        #     TaskItem(user_id=db_item.id, title="Read 10 pages", type="Habit", due_at=None, done=0),
        #     TaskItem(user_id=db_item.id, title="AM workout", type="Daily", due_at=None, done=0),
        #     TaskItem(user_id=db_item.id, title="Finish dashboard layout", type="To-Do", due_at=None, done=0),
        # ]
        # for task in default_tasks:
        #     db.add(task)
        
        db.commit()
        db.refresh(db_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

    return UserOut(id=db_item.id)

# Login with display_name and password
@router.post("/login", response_model=UserOut)
async def login(item: LoginIn, db: Session = Depends(get_db)):
    user = db.query(UserItem).filter(UserItem.display_name == item.display_name).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    db_item = db.query(PassItem).filter(PassItem.user_id == user.id).first()
    if not db_item or not bcrypt.checkpw(item.password.encode(), db_item.pass_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return UserOut(id=user.id)

# Get user info using the user ID
@router.get("/users/{user_id}", response_model=UserFullOut)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserItem).filter(UserItem.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

