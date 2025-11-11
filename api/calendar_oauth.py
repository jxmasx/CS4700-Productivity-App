import os, base64, hashlib, secrets, time, json
from datetime import datetime, timedelta
import httpx
from fastapi import APIRouter, Request, Response, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session
from .db import get_db
from .calendar_oauth_store import CalendarAccount
from .ics_calendar import db_conn

router = APIRouter(prefix="/oauth", tags=["calendar-oauth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT = os.getenv("GOOGLE_REDIRECT", "http://localhost:8001/oauth/google/callback")
MS_CLIENT_ID = os.getenv("MS_CLIENT_ID")
MS_CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET")
MS_REDIRECT = os.getenv("MS_REDIRECT", "http://localhost:8001/oauth/ms/callback")

_TMP = {}

def _pkce():
    ver = base64.urlsafe_b64encode(secrets.token_bytes(32)).rstrip(b"=").decode()
    dig = hashlib.sha256(ver.encode()).digest()
    chal = base64.urlsafe_b64encode(dig).rstrip(b"=").decode()
    return ver, chal

def _state():
    return secrets.token_urlsafe(24)

@router.get("/status")
def oauth_status(user_id: int, db: Session = Depends(get_db)):
    acct = db.query(CalendarAccount).filter_by(user_id=user_id).first()
    return {"connected": bool(acct), "provider": acct.provider if acct else None}

@router.get("/google/start")
def google_start():
    state = _state()
    ver, chal = _pkce()
    _TMP[state] = {"verifier": ver, "t": time.time()}
    url = (
      "https://accounts.google.com/o/oauth2/v2/auth?"
      "response_type=code"
      f"&client_id={GOOGLE_CLIENT_ID}"
      f"&redirect_uri={GOOGLE_REDIRECT}"
      "&scope=" + " ".join([
        "openid","email","profile",
        "https://www.googleapis.com/auth/calendar.readonly"
      ])
      + "&access_type=offline"
      + "&prompt=consent"
      + f"&state={state}"
      + "&code_challenge_method=S256"
      + f"&code_challenge={chal}"
    )
    return {"auth_url": url, "state": state}

@router.get("/google/callback", response_class=HTMLResponse)
async def google_cb(code: str, state: str, db: Session = Depends(get_db)):
    if state not in _TMP:  # invalid/expired state
        return HTMLResponse("<script>window.opener.postMessage({type:'oauth-error'},'*');window.close();</script>")
    ver = _TMP.pop(state)["verifier"]
    async with httpx.AsyncClient(timeout=20) as x:
        token = await x.post("https://oauth2.googleapis.com/token", data={
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT,
            "grant_type": "authorization_code",
            "code_verifier": ver,
        })
    if token.status_code != 200:
        return HTMLResponse("<script>window.opener.postMessage({type:'oauth-error'},'*');window.close();</script>")
    tok = token.json()
    access = tok["access_token"]
    refresh = tok.get("refresh_token")
    expires = datetime.utcnow() + timedelta(seconds=tok.get("expires_in", 3600))

    # TODO: Replace user_id=1 with your authenticated user ID
    acct = db.query(CalendarAccount).filter_by(user_id=1).first()
    if not acct:
        acct = CalendarAccount(user_id=1, provider="google")
    acct.access_token = access
    acct.refresh_token = refresh
    acct.expires_at = expires
    db.add(acct)
    db.commit()

    return HTMLResponse("<script>window.opener.postMessage({type:'oauth-success',provider:'google'},'*');window.close();</script>")

@router.get("/ms/start")
def ms_start():
    state = _state()
    ver, chal = _pkce()
    _TMP[state] = {"verifier": ver, "t": time.time()}
    auth = (
      "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"
      "response_type=code"
      f"&client_id={MS_CLIENT_ID}"
      f"&redirect_uri={MS_REDIRECT}"
      "&scope=" + " ".join([
        "offline_access","openid","profile","email",
        "Calendars.Read"
      ])
      + f"&state={state}"
      + "&code_challenge_method=S256"
      + f"&code_challenge={chal}"
    )
    return {"auth_url": auth, "state": state}

@router.get("/ms/callback", response_class=HTMLResponse)
async def ms_cb(code: str, state: str, db: Session = Depends(get_db)):
    if state not in _TMP:
        return HTMLResponse("<script>window.opener.postMessage({type:'oauth-error'},'*');window.close();</script>")
    ver = _TMP.pop(state)["verifier"]
    async with httpx.AsyncClient(timeout=20) as x:
        token = await x.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data={
            "client_id": MS_CLIENT_ID,
            "client_secret": MS_CLIENT_SECRET,
            "redirect_uri": MS_REDIRECT,
            "grant_type": "authorization_code",
            "code": code,
            "code_verifier": ver,
        })
    if token.status_code != 200:
        return HTMLResponse("<script>window.opener.postMessage({type:'oauth-error'},'*');window.close();</script>")
    tok = token.json()
    access = tok["access_token"]
    refresh = tok.get("refresh_token")
    expires = datetime.utcnow() + timedelta(seconds=tok.get("expires_in", 3600))

    acct = db.query(CalendarAccount).filter_by(user_id=1).first()
    if not acct:
        acct = CalendarAccount(user_id=1, provider="microsoft")
    acct.access_token = access
    acct.refresh_token = refresh
    acct.expires_at = expires
    db.add(acct)
    db.commit()

    return HTMLResponse("<script>window.opener.postMessage({type:'oauth-success',provider:'microsoft'},'*');window.close();</script>")
