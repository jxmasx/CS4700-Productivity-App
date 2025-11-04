import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import Shop from "./components/Shop";
import LevelUp from "./components/LevelUp";
import QuestComplete from "./components/QuestComplete";
import BuildAdventurer from "./components/BuildAdventurer";
import IntroScene from "./components/IntroScene";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/levelup" element={<LevelUp />} />
        <Route path="/quest-complete" element={<QuestComplete />} />
        <Route path="/build-adventurer" element={<BuildAdventurer />} />
        <Route path="/intro-scene" element={<IntroScene />} />

      </Routes>
    </Router>
  );
}

export default App;
