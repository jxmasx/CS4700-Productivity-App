import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [strength, setStrength] = useState(0);
  const navigate = useNavigate();
  const { fetchUserById } = useUser();

  async function readUsers() {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/users');
      const data = await response.json();
      return data

    } catch (error) {
      alert('Error: ' + error);
    }
  }

  async function writeUser(email, username, password) {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          display_name: username,
          password: password
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create account');
      }

      return await response.json();
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !user || pass.length < 8) {
      alert("Please fill all fields. Password must be at least 8 characters.");
      return;
    }

    try {
      const users = await readUsers();
      if (users.some((u) => u.display_name.toLowerCase() === user.toLowerCase())) {
        alert("Username already taken.");
        return;
      }

      const result = await writeUser(email, user, pass);
      if (result.id) {
        await fetchUserById(result.id);
        alert("Account created. Welcome to Questify!");
        setTimeout(() => navigate("/build-adventurer"), 1500);
      }
    } catch (error) {
      alert(error.message || "Error creating account. Please try again.");
    }
  };

  return (
    <main
      className="auth"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "rgba(122, 203, 255, 1)",
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
