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
import Signup from "./pages/Signup";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/users" element={<UsersManage />} />
      <Route path="/email-templates" element={<EmailTemplate />} />
      <Route path="/campaigns" element={<CampaignTemplate />} />
      <Route path="/awareness-simulations" element={<ShowAwareness />} />
      <Route path="/otp-verification" element={<OtpVerification />} />
    </Routes>
  );
}

export default App;
