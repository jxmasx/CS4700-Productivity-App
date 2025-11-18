/*server.js - Questify Google Calendar backend*/

import express from "express";
import cors from "cors";
import session from "express-session";
import { google } from "googleapis";
import "dotenv/config";

const app = express();

/*Allows React dev server (localhost:3000) to talk to this backend*/
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.set("trust proxy", 1);

/*Session middleware to store Google tokens per browser session*/
app.use(
  session({
    secret: "change-this-secret", 
    resave: false,
    saveUninitialized: false,
    cookie: {
      sameSite: "lax",
      secure: false, /*set true only if HTTPS*/
    },
  })
);

app.get("/", (req, res) => {
  res.send("Calendar backend running");
});

/*OAuth2 client setup using env vars*/
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/*1) Starts Google OAuth flow*/
app.get("/auth/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.readonly"],
    prompt: "consent",
  });

  res.redirect(url);
});

/*2) Google redirects back here after user consents*/
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    const { tokens } = await oauth2Client.getToken(code);
    /*Stores tokens in session for this browser*/
    req.session.googleTokens = tokens;

    console.log("✅ Google tokens saved to session");

    /*Redirects back to React app*/
    res.redirect("http://localhost:3000");
  } catch (err) {
    console.error("❌ Error in Google callback:", err);
    res.status(500).send("Google authentication failed");
  }
});

/*3) Returns events from the user's primary Google Calendar*/
app.get("/api/google/events", async (req, res) => {
  try {
    const tokens = req.session.googleTokens;

    if (!tokens) {
      return res.status(401).json({ error: "Google Calendar not connected" });
    }

    oauth2Client.setCredentials(tokens);

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date().toISOString();
    const later = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000 
    ).toISOString();

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now,
      timeMax: later,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || "(No title)",
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      allDay: !e.start?.dateTime, /*If given only date, treats event as an all-day event*/
    }));

    res.json(events);
  } catch (err) {
    console.error("❌ Error fetching Google events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

/*Starts server*/
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Calendar backend listening on http://localhost:${PORT}`);
});
