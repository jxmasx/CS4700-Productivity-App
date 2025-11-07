import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const navigate = useNavigate();
  const { fetchUserById } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || !pass) {
      alert("Please enter both username and password");
      return;
    }

    try {
      const response = await fetch('http://3.134.83.135:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: user,
          password: pass
        })
      });

      if (!response.ok) {
        alert('Failed to log in');
        return;
      }

      const result = await response.json();
      
      if (result.id) {
        await fetchUserById(result.id);
        navigate("/dashboard");
      }
    } catch (error) {
      alert('Failed to log in');
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
