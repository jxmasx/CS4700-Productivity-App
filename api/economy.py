from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from db import get_db
from auth import UserItem, UserFullOut

router = APIRouter(prefix="/api", tags=["economy"])

class EconomyUpdate(BaseModel):
    xp_delta: int = 0
    gold_delta: int = 0
    strength_delta: int = 0
    dexterity_delta: int = 0
    intelligence_delta: int = 0
    wisdom_delta: int = 0
    charisma_delta: int = 0

@router.patch("/users/{user_id}/economy", response_model=UserFullOut)
async def update_economy(user_id: int, economy: EconomyUpdate, db: Session = Depends(get_db)):
    user = db.query(UserItem).filter(UserItem.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.xp += economy.xp_delta
    user.gold += economy.gold_delta
    user.strength += economy.strength_delta
    user.dexterity += economy.dexterity_delta
    user.intelligence += economy.intelligence_delta
    user.wisdom += economy.wisdom_delta
    user.charisma += economy.charisma_delta
    
    while user.xp >= user.xp_max:
        user.xp -= user.xp_max
        user.level += 1
        user.xp_max = int(user.xp_max * 1.15 + 25)
    
    # if user.xp < 0:
    #     user.xp = 0
    # if user.gold < 0:
    #     user.gold = 0
    # if user.strength < 0:
    #     user.strength = 0
    # if user.dexterity < 0:
    #     user.dexterity = 0
    # if user.intelligence < 0:
    #     user.intelligence = 0
    # if user.wisdom < 0:
    #     user.wisdom = 0
    # if user.charisma < 0:
    #     user.charisma = 0
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update economy: {str(e)}")
    
    return user

@router.patch("/users/{user_id}/rollover")
async def update_rollover(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserItem).filter(UserItem.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    from datetime import datetime
    user.last_rollover = datetime.now().date().isoformat()
    
    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update rollover: {str(e)}")
    
    return {"success": True, "last_rollover": user.last_rollover}
