import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import axios from "axios";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email");
      return false;
    }
    if (!password) {
      toast.error("Password is required");
      return false;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        "https://safe-click-backend.vercel.app/api/admins/login",
        {
          email: email.toLowerCase(),
          password,
        },
      );

      if (response.data.success) {
        localStorage.clear(); // Clear any existing data in localStorage
        // Store token in localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Redirect to dashboard
        navigate("/otp-verification");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Toaster position="top-right" reverseOrder={false} />
      <div className="login-wrapper">
        <div className="login-box">
          {/* Header */}
          <div className="login-header">
            <div className="logo-section">
              <i className="fas fa-shield-alt logo-icon"></i>
            </div>
            <h1 className="login-title">SafeClick</h1>
            <p className="login-subtitle">Secure Your Digital Journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="login-form">
            {/* Email Field */}
            <div className="form-group mb-3">
              <label htmlFor="email" className="form-label">
                <i className="fas fa-envelope me-2 text-primary"></i>
                Email Address
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                id="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="form-group mb-3">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock me-2 text-primary"></i>
                Password
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control form-control-lg"
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  <i
                    className={`fas ${
                      showPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  Remember me
                </label>
              </div>
              Forgot Password?
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="btn btn-primary btn-lg w-100 mb-3 login-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="divider mb-3">
              <span>Or continue with</span>
            </div>

            {/* Social Login Buttons */}
            <div className="social-login mb-4">
              <button
                type="button"
                className="btn btn-outline-secondary btn-social"
                disabled={loading}
              >
                <i className="fab fa-google"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-social"
                disabled={loading}
              >
                <i className="fab fa-microsoft"></i>
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-social"
                disabled={loading}
              >
                <i className="fab fa-apple"></i>
              </button>
            </div>
          </form>

          {/* Signup Redirect */}
          <div className="signup-redirect mb-3">
            <span>Don't have an account?</span>
            <button
              type="button"
              className="btn btn-link ms-2 p-0 signup-btn"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <i className="fas fa-question-circle me-1"></i>
            Help
            <span className="separator">•</span>
            Privacy Policy
            <span className="separator">•</span>
            Terms of Service
          </div>
        </div>

        {/* Side Illustration */}
        <div className="login-illustration">
          <div className="illustration-content">
            <img
              src="/images/login.png"
              alt="Login"
              className="illustration-icon"
            />
            <h3>Welcome Back</h3>
            <p>
              Protect yourself from cyber threats with SafeClick's intelligent
              security features
            </p>
            <div className="feature-list">
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Real-time threat detection</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>Advanced encryption</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-check-circle"></i>
                <span>24/7 security monitoring</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
