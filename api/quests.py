from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Boolean
from typing import Optional
from db import get_db, Base

router = APIRouter(prefix="/api", tags=["quests"])

class QuestItem(Base):
    __tablename__ = "quests"
    id = Column(String, primary_key=True, index=True)
    label = Column(String)
    reward_xp = Column(Integer, name="rewardXp")
    reward_gold = Column(Integer, name="rewardGold")
    status_message = Column(String, name="statusMessage")

class QuestIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    id: str = ""
    label: str = ""
    reward_xp: int = Field(0, alias="rewardXp")
    reward_gold: int = Field(0, alias="rewardGold")
    status_message: str = Field("", alias="statusMessage")

class QuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str
    label: str
    reward_xp: int = Field(alias="rewardXp")
    reward_gold: int = Field(alias="rewardGold")
    status_message: str = Field("", alias="statusMessage")

class UserQuestItem(Base):
    __tablename__ = "user_quests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    quest_id = Column(String)
    is_done = Column(Integer, default=0)

class UserQuestIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    
    user_id: int
    quest_id: str
    is_done: bool = False

class UserQuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: int
    user_id: int
    quest_id: str
    is_done: bool 

class PendingRewardItem(Base):
    __tablename__ = "pending_rewards"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer)
    label = Column(String)
    gold = Column(Integer)
    xp = Column(Integer)

class PendingRewardIn(BaseModel):
    id: str
    user_id: int
    label: Optional[str] = ""
    gold: int = 0
    xp: int = 0

class PendingRewardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    user_id: int
    label: str
    gold: int
    xp: int

# Get all quests
@router.get("/quests", response_model=list[QuestOut])
def list_all_quests(db: Session = Depends(get_db)):
    db_items = db.query(QuestItem).all()
    return db_items

# Get quest by id
@router.get("/quests/{quest_id}", response_model=QuestOut)
def get_quest(quest_id: str, db: Session = Depends(get_db)):
    db_item = db.query(QuestItem).filter(QuestItem.id == quest_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Quest not found")
    return db_item

# Create a new quest
@router.post("/quests", response_model=QuestOut)
def create_quest(item: QuestIn, db: Session = Depends(get_db)):
    try:
        db_item = QuestItem(
            id=item.id,
            label=item.label,
            reward_xp=item.reward_xp,
            reward_gold=item.reward_gold,
            status_message=item.status_message
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

# Get all quests for user by id
@router.get("/users/{user_id}/quests", response_model=list[UserQuestOut])
def list_user_quests(user_id: int, db: Session = Depends(get_db)):
    db_items = db.query(UserQuestItem).filter(UserQuestItem.user_id == user_id).all()
    return db_items

# Assign quest to a user
@router.post("/users/{user_id}/quests", response_model=UserQuestOut)
def assign_quest_to_user(user_id: int, item: UserQuestIn, db: Session = Depends(get_db)):
    try:
        quest = db.query(QuestItem).filter(QuestItem.id == item.quest_id).first()
        if not quest:
            raise HTTPException(status_code=404, detail="Quest not found")
        
        existing = db.query(UserQuestItem).filter(
            UserQuestItem.user_id == user_id,
            UserQuestItem.quest_id == item.quest_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="User already has this quest")
        
        db_item = UserQuestItem(
            user_id=user_id,
            quest_id=item.quest_id,
            is_done=1 if item.is_done else 0
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

# Set user quest completed/incomplete
@router.patch("/users/{user_id}/quests/{user_quest_id}", response_model=UserQuestOut)
def update_user_quest(user_id: int, user_quest_id: int, is_done: bool, db: Session = Depends(get_db)):
    try:
        db_item = db.query(UserQuestItem).filter(
            UserQuestItem.id == user_quest_id,
            UserQuestItem.user_id == user_id
        ).first()
        
        if not db_item:
            raise HTTPException(status_code=404, detail="User quest not found")
        
        db_item.is_done = 1 if is_done else 0
        db.commit()
        db.refresh(db_item)
        return db_item
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

# Remove quest from a user
@router.delete("/users/{user_id}/quests/{user_quest_id}", status_code=204)
def delete_user_quest(user_id: int, user_quest_id: int, db: Session = Depends(get_db)):
    try:
        result = db.query(UserQuestItem).filter(
            UserQuestItem.id == user_quest_id,
            UserQuestItem.user_id == user_id
        ).delete()
        
        if result == 0:
            raise HTTPException(status_code=404, detail="User quest not found")
        
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return None

# Get list of all of a user's pending rewards
@router.get("/users/{user_id}/pr", response_model=list[PendingRewardOut])
def list_pending_rewards(user_id: int, db: Session = Depends(get_db)):
    db_items = db.query(PendingRewardItem).filter(PendingRewardItem.user_id == user_id).all()
    return db_items

# Send a pending reward to db
@router.post("/quests/{user_id}/pr") # , response_model=UserOut
async def submit_pending_reward(item: PendingRewardIn, user_id: int, db: Session = Depends(get_db)):
    try:
        db_item = PendingRewardItem(
            id=item.id,
            user_id=user_id,
            label=item.label,
            gold=item.gold,
            xp=item.xp
        )
        db.add(db_item)
        # db.flush()
        
        db.commit()
        db.refresh(db_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))

    return None#UserOut(id=db_item.id)

# Delete all pending rewards of specified user
@router.delete("/quests/{user_id}/pr", status_code=204)
def delete_all_pending_rewards(user_id: int, db: Session = Depends(get_db)):
    try:
        db.query(PendingRewardItem).filter(PendingRewardItem.user_id == user_id).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return None

# Delete a single pending reward by id
@router.delete("/quests/{user_id}/pr/{pr_id}", status_code=204)
def delete_single_pending_reward(user_id: int, pr_id: str, db: Session = Depends(get_db)):
    try:
        db.query(PendingRewardItem).filter(PendingRewardItem.user_id == user_id, PendingRewardItem.id == pr_id).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Internal server error: "+str(e))
    
    return None