import logo from "./logo.svg";
import React from "react";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import AdminDashboard from "./pages/AdminDashboard";
import UsersManage from "./pages/UsersManage";
import OtpVerification from "./components/OtpVerification";
import EmailTemplate from "./pages/EmailTemplate";
import CampaignTemplate from "./pages/CampaignTemplate";
import ShowAwareness from "./pages/ShowAwareness";
import PhishingTrapWarning from "./pages/PhishingTrapWarning";
import Signup from "./pages/Signup";
import SimulationDashboard from "./pages/SimulationDashboard";
import QuizManage from "./pages/QuizManage";
import SolveQuiz from "./pages/SolveQuiz";
import UserDashboard from "./pages/UserDashboard";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/users" element={<UsersManage />} />
      <Route path="/email-templates" element={<EmailTemplate />} />
      <Route path="/campaigns" element={<CampaignTemplate />} />
      <Route path="/quizzes" element={<QuizManage />} />
      <Route path="/solve-quiz" element={<SolveQuiz />} />
      <Route path="/awareness-simulations" element={<ShowAwareness />} />
      <Route path="/simulation-results" element={<SimulationDashboard />} />
      <Route
        path="/simulation-results/:campaignId"
        element={<SimulationDashboard />}
      />
      <Route path="/phishing-trap" element={<PhishingTrapWarning />} />
      <Route path="/otp-verification" element={<OtpVerification />} />
    </Routes>
  );
}

export default App;
