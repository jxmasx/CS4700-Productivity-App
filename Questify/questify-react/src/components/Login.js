import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();

  const readUsers = () => JSON.parse(localStorage.getItem("qf_users") || "[]");

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = readUsers().find(
      (u) => u.user.toLowerCase() === user.toLowerCase() && u.pass === pass
    );
    if (!found) {
      alert("Invalid credentials");
      return;
    }
    localStorage.setItem("activeUser", JSON.stringify(found));
    navigate("/dashboard");
  };

  return (
    <main
      className="auth"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(180deg, #74b9ff 0%, #1e6dd8 100%)",
      }}
    >
      <div className="wood">
        <div className="title-band" aria-hidden="true">
          <div className="leaf" style={{ transform: "rotate(-18deg)" }}></div>
          <div className="title">Log In</div>
          <div className="leaf" style={{ transform: "rotate(18deg) scaleX(-1)" }}></div>
        </div>
        <div className="panel">
          <form id="loginForm" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="loginUser">Username</label>
              <div className="input">
                <input
                  id="loginUser"
                  required
                  autoComplete="username"
                  placeholder="your name"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="loginPass">Password</label>
              <div className="input">
                <input
                  id="loginPass"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
                <button
                  type="button"
                  className="suffix-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="row">
              <label>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />{" "}
                Remember me
              </label>
              <button
                className="link"
                type="button"
                onClick={() => alert("Password reset feature coming soon.")}
              >
                Forgot?
              </button>
            </div>
            <div className="submit">
              <button className="go" aria-label="Proceed" type="submit">
                ➜
              </button>
            </div>
          </form>
          <div className="toggle" style={{ marginTop: "10px" }}>
            <button className="chip" onClick={() => navigate("/signup")}>
              Sign Up Instead
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
