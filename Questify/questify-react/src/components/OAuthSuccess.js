import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Send message to parent window if this is in a popup
    if (window.opener) {
      window.opener.postMessage({ type: "oauth-success", provider: "google" }, "*");
      window.close(); // Close the popup
    } else {
      // If not in popup, redirect to dashboard
      navigate("/dashboard");
    }
  }, [navigate]);

  return <div>OAuth successful, redirecting...</div>;
}