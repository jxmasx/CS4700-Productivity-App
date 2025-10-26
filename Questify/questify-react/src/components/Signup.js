import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const navigate = useNavigate();

  const readUsers = () => JSON.parse(localStorage.getItem("qf_users") || "[]");
  const writeUsers = (arr) => localStorage.setItem("qf_users", JSON.stringify(arr));

  const scorePassword = (p) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^\w]/.test(p)) s++;
    return (s / 5) * 100;
  };

  const handlePasswordChange = (value) => {
    setPass(value);
    setStrength(scorePassword(value));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !user || pass.length < 8) {
      alert("Please fill all fields. Password must be at least 8 characters.");
      return;
    }
    const users = readUsers();
    if (users.some((u) => u.user.toLowerCase() === user.toLowerCase())) {
      alert("Username already taken.");
      return;
    }
    users.push({ email, user, pass });
    writeUsers(users);
    alert("Account created. Welcome to Questify!");
    setTimeout(() => navigate("/build-adventurer"), 1500);
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
          <div className="title">Sign Up</div>
          <div className="leaf" style={{ transform: "rotate(18deg) scaleX(-1)" }}></div>
        </div>
        <div className="panel">
          <form id="signupForm" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="suEmail">Email</label>
              <div className="input">
                <input
                  id="suEmail"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="suUser">Create Username</label>
              <div className="input">
                <input
                  id="suUser"
                  required
                  autoComplete="username"
                  placeholder="your name"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="suPass">Create Password</label>
              <div className="input">
                <input
                  id="suPass"
                  type={showPass ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={pass}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                />
                <button
                  type="button"
                  className="suffix-btn"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              <div className="meter" aria-hidden="true">
                <span
                  style={{
                    width: `${strength}%`,
                    background: `linear-gradient(90deg,#ef4444,#f59e0b,#10b981)`,
                    display: "block",
                    height: "8px",
                    borderRadius: "999px",
                    transition: "width 0.25s ease",
                  }}
                ></span>
              </div>
            </div>
            <div className="submit">
              <button className="go" aria-label="Create account" type="submit">
                ➜
              </button>
            </div>
          </form>
          <div className="toggle" style={{ marginTop: "10px" }}>
            <button className="chip" onClick={() => navigate("/login")}>
              Already have an account?
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
