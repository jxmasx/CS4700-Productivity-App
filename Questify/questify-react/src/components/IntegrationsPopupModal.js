/* -----------------------------------------------------------------------------
 IntegrationsPopupModal.js
 - Clean, self-contained modal for Canvas / Google Calendar integration.

  PROPS:
    - isOpen: boolean → controls visibility
    - onClose: () => void → called when popup closes
    - onConnected: (info) => void → called when user clicks Connect successfully

  NOTE:
    - Calendar: redirects to http://localhost:4000/auth/google (Google OAuth).
    - Canvas: still mocked for now.
 -----------------------------------------------------------------------------*/

import React, { useState } from "react";

/*Backend base URL for the calendar OAuth server*/
const BACKEND_BASE_URL = "http://localhost:4000";

const IntegrationsPopupModal = ({ isOpen, onClose, onConnected }) => {
  const [connectCanvas, setConnectCanvas] = useState(false);
  const [connectCalendar, setConnectCalendar] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  /*If the popup isn't supposed to be open, renders nothing*/
  if (!isOpen) return null;


  function handleConnectCalendar() {
  /*Opens Google OAuth in the same tab or a popup*/
    window.location.href = `${BACKEND_BASE_URL}/auth/google`;
}

  const handleConnect = () => {
    if (!connectCanvas && !connectCalendar) {
      setStatusMessage(
        "Choose at least one integration, or tap Skip to continue without connecting."
      );
      return;
    }

    setIsConnecting(true);
    setStatusMessage("");

    /*If Calendar is selected, starts Google OAuth via backend*/
    if (connectCalendar) {
           if (typeof onConnected === "function") {
        const mockedCanvasAssignments = connectCanvas ? 7 : 0;
        onConnected({
          canvas: connectCanvas,
          calendar: true,
          canvasAssignments: mockedCanvasAssignments,
          calendarEvents: 0,
        });
      }

      setStatusMessage("Redirecting to Google to connect your calendar...");
      window.location.href = `${BACKEND_BASE_URL}/auth/google`;
      return;
    }

    /*Only Canvas selected*/
    if (connectCanvas && !connectCalendar) {
      const mockedCanvasAssignments = 7; /*placeholder*/
      const message = `Canvas connected. ${mockedCanvasAssignments} assignments turned into quests.`;

      setStatusMessage(message);
      setIsConnecting(false);

      if (typeof onConnected === "function") {
        onConnected({
          canvas: true,
          calendar: false,
          canvasAssignments: mockedCanvasAssignments,
          calendarEvents: 0,
        });
      }

      window.setTimeout(() => {
        if (typeof onClose === "function") onClose();
      }, 1800);
    }
  };

  const handleSkip = () => {
    setStatusMessage("You can connect later in Settings.");
    window.setTimeout(() => {
      if (typeof onClose === "function") onClose();
    }, 1200);
  };

  return (
    <div
      className="integrations-overlay"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
      }}
    >
      <div
        className="integrations-modal wood"
        style={{
          width: "min(480px, 95vw)",
          padding: "1.5rem",
          borderRadius: 18,
          background: "#f7e8cf",
          boxShadow: "0 18px 40px rgba(0,0,0,0.35)",
          color: "#3f220e",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>
          Let’s turn your assignments and events into quests.
        </h2>
        <p style={{ marginTop: 0, fontSize: "0.9rem" }}>
          You can disconnect anytime.
        </p>
        <p
          style={{
            marginTop: 0,
            marginBottom: "0.75rem",
            fontSize: "0.8rem",
            color: "#5a3417",
          }}
        >
          We import titles, due dates, and completion status. No private files
          or grades. You stay in control of what’s connected.
        </p>

        {/*Toggles*/}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={connectCanvas}
              onChange={(e) => setConnectCanvas(e.target.checked)}
            />
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Connect Canvas
            </span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={connectCalendar}
              onChange={(e) => setConnectCalendar(e.target.checked)}
            />
            <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Connect Calendar (Google)
            </span>
          </label>
        </div>

        {/*Buttons*/}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.5rem",
            marginTop: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={handleSkip}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: "1px solid #8b5e34",
              background: "#fff7e8",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            style={{
              padding: "8px 18px",
              borderRadius: 999,
              border: "none",
              background: "#3b2a18",
              color: "#fff7e8",
              cursor: isConnecting ? "wait" : "pointer",
              fontSize: "0.85rem",
              fontWeight: 700,
              boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
            }}
          >
            {isConnecting ? "Connecting..." : "Connect"}
          </button>
        </div>

        {statusMessage && (
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.8rem",
              color: "#5a3417",
            }}
          >
            {statusMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default IntegrationsPopupModal;
