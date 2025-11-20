import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import BuildAdventurer from "./components/BuildAdventurer";
import IntroScene from "./components/IntroScene";
import QuestCard from "./components/QuestCard";
import GuildHall from "./components/GuildHall";
import AdventurerNamePlate from "./components/AdventurerNamePlate";
import IntegrationsPopup from "./components/IntegrationsPopup";
import OAuthSuccess from "./components/OAuthSuccess";

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          {/* Open Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/oauth/success" element={<OAuthSuccess />} />
          
          {/* Login Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/build-adventurer" element={<BuildAdventurer />} />
            <Route path="/intro-scene" element={<IntroScene />} />
            <Route path="/quest-card" element={<QuestCard />} />
            <Route path="/guild-hall" element={<GuildHall />} />
            <Route path="/adventure-nameplate" element={<AdventurerNamePlate/>}/> 
            <Route path="/integration-popup" element={<IntegrationsPopup/>}/> 
          </Route>

        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
