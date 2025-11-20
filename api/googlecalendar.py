from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api", tags=["googlecalendar"])

# OAuth2 flow setup
flow = Flow.from_client_config(
    {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "redirect_uris": [os.getenv("GOOGLE_REDIRECT_URI")],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=["https://www.googleapis.com/auth/calendar.readonly"],
)
flow.redirect_uri = os.getenv("GOOGLE_REDIRECT_URI")

@router.get("/oauth/google/start")
async def start_google_oauth(request: Request):
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent'
    )
    request.session['state'] = state
    return {"auth_url": authorization_url}

@router.get("/auth/google")
async def auth_google(request: Request):
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent'
    )
    request.session['state'] = state
    return RedirectResponse(authorization_url)

@router.get("/auth/google/callback")
async def auth_google_callback(request: Request, code: str, state: str):
    if state != request.session.get('state'):
        raise HTTPException(status_code=400, detail="Invalid state parameter")
    
    flow.fetch_token(code=code)
    creds = flow.credentials
    
    request.session['google_tokens'] = {
        'token': creds.token,
        'refresh_token': creds.refresh_token,
        'token_uri': creds.token_uri,
        'client_id': creds.client_id,
        'client_secret': creds.client_secret,
        'scopes': creds.scopes
    }
    
    # Redirect back to React app
    frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    return RedirectResponse(f"{frontend_origin}/#/oauth/success")

@router.get("/google/events")
async def get_google_events(request: Request):
    tokens = request.session.get('google_tokens')
    if not tokens:
        raise HTTPException(status_code=401, detail="Google Calendar not connected")
    
    creds = Credentials(**tokens)
    
    if creds.expired and creds.refresh_token:
        creds.refresh(GoogleRequest())
        # Update session with refreshed tokens
        request.session['google_tokens'] = {
            'token': creds.token,
            'refresh_token': creds.refresh_token,
            'token_uri': creds.token_uri,
            'client_id': creds.client_id,
            'client_secret': creds.client_secret,
            'scopes': creds.scopes
        }
    
    service = build('calendar', 'v3', credentials=creds)
    
    now = datetime.utcnow().isoformat() + 'Z'
    later = (datetime.utcnow() + timedelta(days=30)).isoformat() + 'Z'
    
    events_result = service.events().list(
        calendarId='primary',
        timeMin=now,
        timeMax=later,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    formatted_events = []
    for event in events:
        formatted_events.append({
            'id': event['id'],
            'title': event.get('summary', '(No title)'),
            'start': event['start'].get('dateTime', event['start'].get('date')),
            'end': event['end'].get('dateTime', event['end'].get('date')),
            'allDay': 'dateTime' not in event['start']
        })
    
    return formatted_events