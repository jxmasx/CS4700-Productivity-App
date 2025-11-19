/*Calendar-backend/index.js*/
import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const app = express();

/*Port for the calendar backend*/
const PORT = process.env.PORT || 4000;

/*Where the React app runs during dev*/
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";

/*Where you want to send the user after Google OAuth finishes
  (this is the Questify landing/dashboard in dev)*/
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:3000/CS4700-Productivity-App/";

/*CORS so the React app can send cookies to this backend*/
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

/*Sessions: This is where we keep Google tokens per browser*/
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "lax",
      secure: false, /*This is true only in HTTPS production*/
    },
  })
);

app.use(express.json());

/* ---- Google OAuth client ----*/
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `http://localhost:${PORT}/auth/google/callback`
);

const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// ---- Routes ----

/*1) Start OAuth flow*/
app.get("/auth/google", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });

  res.redirect(url);
});

/* 2) OAuth callback from Google*/
app.get("/auth/google/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect(FRONTEND_URL + "?calendar_error=missing_code");
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    /*Stores the tokens in the session for this browser*/
    req.session.tokens = tokens;

    /*Returns back to Questify*/
    return res.redirect(FRONTEND_URL + "?calendar=connected");
  } catch (err) {
    console.error("Error exchanging code for tokens", err);
    return res.redirect(FRONTEND_URL + "?calendar_error=token");
  }
});

/*3)Quick status endpoint*/
app.get("/api/google/status", (req, res) => {
  const connected = !!req.session.tokens;
  res.json({ connected });
});

/*4)Main events endpoint used by CalendarView*/
app.get("/api/google/events", async (req, res) => {
  if (!req.session.tokens) {
    return res.status(401).json({ error: "Not connected to Google Calendar" });
  }

  try {
    oauth2Client.setCredentials(req.session.tokens);

    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const result = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: weekAhead.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (result.data.items || []).map((ev) => ({
      id: ev.id,
      title: ev.summary || "(no title)",
      start: ev.start.dateTime || ev.start.date,
      end:
        ev.end?.dateTime ||
        ev.end?.date ||
        ev.start.dateTime ||
        ev.start.date,
      allDay: !!ev.start.date,
    }));

    res.json(events);
  } catch (err) {
    console.error("Error fetching calendar events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

app.listen(PORT, () => {
  console.log(`Calendar backend listening on http://localhost:${PORT}`);
});
