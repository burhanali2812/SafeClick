import logo from './logo.svg';
import React from 'react';
import './App.css';
import {Routes, Route} from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import UsersManage from './pages/UsersManage';
import OtpVerification from './components/OtpVerification';
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/users" element={<UsersManage />} />
      <Route path="/otp-verification" element={<OtpVerification />} />
    </Routes>
  );
}

export default App;
