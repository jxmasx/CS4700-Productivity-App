import React from "react";

export default function TopNav({
  gold = 0,
  diamonds = 0,
  onAvatar,
  onGuild,
  onConnect,
  onSettings,
  onShop,
  brandContent = null,
}) {
  return (
    <header className="qn-nav">
      <div className="qn-nav__inner">
        <div className="qn-brand">{brandContent}</div>

        <nav className="qn-links" aria-label="Primary">
          <button type="button" className="qn-link" onClick={onAvatar}>Change Avatar</button>
          <button type="button" className="qn-link" onClick={onGuild}>Go to Guild Hall</button>
          <button type="button" className="qn-link" onClick={onConnect}>Connect with Friends</button>
          <button type="button" className="qn-link" onClick={onSettings}>Settings</button>
        </nav>

        <div className="qn-econ" aria-label="Economy">
          <div className="qn-econ-item">
            <img
              src={`${process.env.PUBLIC_URL}public/sprites/gold1.png`} 
              alt="Gold"
              className="qn-econ-icon"
            />
            <span className="qn-econ-val">{gold}</span>
          </div>
          <div className="qn-econ-item qn-econ-item--diamond">
            <img
              src={`${process.env.PUBLIC_URL}public/sprites/diamond.png`} 
              alt="Diamond"
              className="qn-econ-icon"
            />
            <span className="qn-econ-val">{diamonds}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
