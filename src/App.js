import logo from './logo.svg';
import React from 'react';
import './App.css';
import {Routes, Route} from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './pages/AdminDashboard';
import UsersManage from './pages/UsersManage';
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/users" element={<UsersManage />} />
    </Routes>
  );
}

export default App;
