import React, { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function OtpVerification() {
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = React.useRef([]);
  const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const sendOTP = async () => {
    console.log("Sending OTP...", token);
    try {
      const response = await axios.post(
        "https://safe-click-backend.vercel.app/api/email-templates/send-otp",
   {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data?.success) {
        setTimer(60);
        setCanResend(false);
        toast.success("OTP sent to your email");
        return true;
      } else {
        toast.error(response.data?.message || "Failed to send OTP");
        return false;
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to send OTP. Please try again.");
      return false;
    }
  };

  const handleResend = () => {
    (async () => {
      setLoading(true);
      const ok = await sendOTP();
      setLoading(false);
      if (ok) {
        setOtp(new Array(6).fill(""));
        inputRefs.current[0]?.focus();
        setCanResend(false);
      }
    })();
  };
   const handleChange = (element, index) => {
    if (!/^[a-zA-Z0-9]?$/.test(element.value)) return;

    const newOtp = [...otp];
    newOtp[index] = element.value.toUpperCase();
    setOtp(newOtp);

    if (element.value !== "" && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };
 const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (otp[index] === "" && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      }
    }
  };
   const getOtpValue = () => otp.join("");

  const verifyOTP = async () => {
    setLoading(true);
    const enteredOtp = getOtpValue();
    try {
      const response = await axios.post(
        "https://safe-click-backend.vercel.app/api/email-templates/verify-otp",
        { otp: enteredOtp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        toast.success("OTP Verified! Redirecting...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      } else {
        toast.error(response.data.message || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      console.error("Error:", error);
        toast.error(error.response?.data?.message || "OTP verification failed. Please try again.");
    }
    setLoading(false);
  };

  // Countdown timer effect
  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const id = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Send OTP on mount if token exists; otherwise redirect to login
  useEffect(() => {
    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    // send OTP once on mount
    sendOTP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData("text").trim();
    if (!paste) return;
    const chars = paste.split("").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < chars.length; i++) {
      if (/^[a-zA-Z0-9]$/.test(chars[i])) newOtp[i] = chars[i].toUpperCase();
    }
    setOtp(newOtp);
    const nextIndex = Math.min(chars.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };
return (
  <div>
    <Toaster position="top-right" />

    <div className="container-fluid vh-100 d-flex justify-content-center align-items-center px-2 px-sm-3">

      <div
        className="card shadow text-white p-2 p-sm-3"
        style={{
          maxWidth: "450px",
          width: "100%",
          borderRadius: "10px",
          background: "linear-gradient(45deg, #0f2027, #203a43, #2c5364)",
          maxHeight: "95vh",
          overflowY: "auto",
        }}
      >

        <div
          className="card-body px-2 px-sm-3"
          style={{
            overflowY: "auto",
            maxHeight: "100%",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >

          {/* HEADER */}
          <div className="text-center text-white mb-3 pt-3 pt-sm-4 px-2">

            <h1
              style={{
                fontSize: "clamp(1.3rem, 5vw, 2rem)",
                fontWeight: "bold",
                letterSpacing: "2px",
              }}
            >
              <i className="fas fa-lock-open me-2"></i>
              VERIFY OTP
            </h1>

            <p
              style={{
                opacity: 0.85,
                fontSize: "clamp(0.85rem, 3vw, 1.1rem)",
                marginBottom: "0.5rem",
              }}
            >
              We've sent a One-Time Password (OTP) to your registered email.
              Enter it below to verify your identity.
            </p>

            <p
              style={{
                opacity: 0.7,
                fontSize: "clamp(0.75rem, 2.5vw, 0.95rem)",
                marginTop: "10px",
              }}
            >
              <i className="fas fa-clock me-2"></i>
              OTP will expire in
            </p>

            {/* TIMER */}
            <div className="mt-3">

              {!canResend ? (
                <div className="d-flex justify-content-center">

                  <div
                    style={{
                      width: "clamp(65px, 18vw, 100px)",
                      height: "clamp(65px, 18vw, 100px)",
                      borderRadius: "50%",
                      border: "6px solid white",
                      color: "#ffc107",
                      fontSize: "clamp(18px, 6vw, 38px)",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {formatTime(timer)}
                  </div>

                </div>
              ) : (
                <>
                  <button
                    className="btn btn-link text-warning p-0"
                    style={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                    }}
                    onClick={handleResend}
                    disabled={loading}
                  >
                    <i className="fas fa-paper-plane me-2"></i>
                    Resend OTP
                  </button>

                  <p className="text-light mt-2" style={{ fontSize: "0.85rem" }}>
                    <i className="fas fa-info-circle me-2"></i>
                    Didn't receive the OTP? Check spam or resend.
                  </p>
                </>
              )}

            </div>
          </div>

          {/* OTP INPUTS */}
         <div
  className="d-flex justify-content-center align-items-center gap-1 mt-4 px-2 flex-nowrap otp-row"
>

         <div className="otp-container mt-4">
  {otp.map((val, index) => (
    <input
      key={index}
      type="text"
      inputMode="numeric"
      maxLength="1"
      className="otp-box text-center"
      value={otp[index]}
      ref={(el) => (inputRefs.current[index] = el)}
      onChange={(e) => handleChange(e.target, index)}
      onKeyDown={(e) => handleKeyDown(e, index)}
      onPaste={handlePaste}
    />
  ))}
</div>

          </div>

          {/* BUTTON */}
          <div className="text-center mt-4 px-2">

            <button
              className="btn btn-outline-warning fw-bold w-100 w-sm-auto px-4 py-2"
              onClick={verifyOTP}
              disabled={loading || getOtpValue().length < 6}
              style={{
                maxWidth: "250px",
              }}
            >
              <i className="fas fa-key me-2"></i>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

          </div>

        </div>
      </div>
    </div>
  </div>
);
}

export default OtpVerification;
