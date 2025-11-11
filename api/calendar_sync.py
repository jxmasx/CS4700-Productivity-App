import os, secrets
from datetime import datetime, timedelta
import httpx

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from .db import get_db
from .calendar_oauth_store import CalendarAccount
from .ics_calendar import db_conn

router = APIRouter(tags=["calendar-sync"])

@router.get("/calendar/events")
def get_events():
    with db_conn() as c:
        rows = c.execute(
            "SELECT id, title, start, end, description FROM local_calendar_events ORDER BY start ASC"
        ).fetchall()
        events = [dict(r) for r in rows]
    return {"imported": events, "local": []}

@router.post("/calendar/sync")
async def sync_calendar(user_id: int = 1, db: Session = Depends(get_db)):
    acct = db.query(CalendarAccount).filter_by(user_id=user_id).first()
    if not acct:
        raise HTTPException(status_code=400, detail="No connected calendar")

    now = datetime.utcnow()

    # refresh token 
    if acct.expires_at and acct.expires_at <= now and acct.refresh_token and acct.provider == "google":
        async with httpx.AsyncClient(timeout=20) as x:
            r = await x.post("https://oauth2.googleapis.com/token", data={
                "client_id": os.getenv("GOOGLE_CLIENT_ID"),
                "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
                "grant_type": "refresh_token",
                "refresh_token": acct.refresh_token
            })
        if r.status_code == 200:
            tok = r.json()
            acct.access_token = tok["access_token"]
            acct.expires_at = now + timedelta(seconds=tok.get("expires_in", 3600))
            db.add(acct)
            db.commit()

    events = []
    async with httpx.AsyncClient(timeout=20) as x:
        if acct.provider == "google":
            time_min = (now - timedelta(days=30)).isoformat("T") + "Z"
            time_max = (now + timedelta(days=90)).isoformat("T") + "Z"
            r = await x.get(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                params={"timeMin": time_min, "timeMax": time_max, "singleEvents": "true", "orderBy": "startTime"},
                headers={"Authorization": f"Bearer {acct.access_token}"},
            )
            data = r.json()
            for it in data.get("items", []):
                start = it.get("start", {}).get("dateTime") or (it.get("start", {}).get("date") + "T00:00:00Z")
                end = it.get("end", {}).get("dateTime") or (it.get("end", {}).get("date") + "T23:59:59Z")
                events.append({"title": it.get("summary", "(no title)"), "start": start, "end": end})
        else:
            # Microsoft Graph
            r = await x.get(
                "https://graph.microsoft.com/v1.0/me/events?$orderby=start/dateTime&$top=100",
                headers={"Authorization": f"Bearer {acct.access_token}"},
            )
            data = r.json()
            for it in data.get("value", []):
                events.append({
                    "title": it.get("subject", "(no title)"),
                    "start": it["start"]["dateTime"] + "Z",
                    "end": it["end"]["dateTime"] + "Z",
                })

    with db_conn() as c:
        for e in events:
            c.execute(
                "INSERT INTO local_calendar_events (id,title,start,end,description,created_at) VALUES (?,?,?,?,?,?)",
                (secrets.token_urlsafe(12), e["title"], e["start"], e["end"], None, datetime.utcnow().isoformat())
            )
        c.commit()

    return JSONResponse({"imported": len(events)})
