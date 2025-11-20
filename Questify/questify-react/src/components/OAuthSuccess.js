import React, { useEffect } from "react";

export default function OAuthSuccess() {
  useEffect(() => {
    // Send message to parent window if this is in a popup
    if (window.opener) {
      window.opener.postMessage({ type: "oauth-success", provider: "google" }, "*");
      window.close(); // Close the popup
    } else {
      // If not in popup, redirect to dashboard or something
      window.location.href = "/dashboard";
    }
  }, []);

  return <div>OAuth successful, closing...</div>;
}