import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./PhishingTrapWarning.css";
import { useEffect } from "react";
import axios from "axios";

const awarenessTips = [
  {
    title: "Do not click suspicious links",
    description:
      "If an email, SMS, or message looks strange, avoid clicking links immediately.",
    icon: "fa-link-slash",
  },
  {
    title: "Check the sender's email address carefully",
    description:
      "Attackers often use fake addresses similar to real companies.",
    icon: "fa-at",
  },
  {
    title: "Never share passwords or OTPs",
    description:
      "Banks and real companies never ask for passwords through email or messages.",
    icon: "fa-shield-halved",
  },
  {
    title: "Verify before downloading attachments",
    description: "Unknown files may contain malware or viruses.",
    icon: "fa-file-circle-exclamation",
  },
  {
    title: "Look for spelling and grammar mistakes",
    description:
      "Many phishing messages contain poor English or unusual wording.",
    icon: "fa-pen-fancy",
  },
  {
    title: "Enable Two-Factor Authentication (2FA)",
    description:
      "Extra verification helps protect accounts even if passwords are stolen.",
    icon: "fa-lock",
  },
  {
    title: "Use strong and unique passwords",
    description: "Avoid using the same password on multiple websites.",
    icon: "fa-key",
  },
  {
    title: "Check website URLs before logging in",
    description:
      "Fake websites may look real but have slightly different URLs.",
    icon: "fa-globe",
  },
  {
    title: "Avoid urgent or threatening messages",
    description:
      "Phishing attackers create panic like 'Your account will be blocked!'.",
    icon: "fa-triangle-exclamation",
  },
  {
    title: "Keep software and antivirus updated",
    description: "Updates fix security weaknesses attackers may exploit.",
    icon: "fa-rotate",
  },
  {
    title: "Do not use public Wi-Fi for sensitive accounts",
    description:
      "Public networks can be unsafe for banking or important logins.",
    icon: "fa-wifi",
  },
  {
    title: "Report suspicious emails or messages",
    description:
      "Inform your IT department, bank, or service provider immediately.",
    icon: "fa-bell",
  },
];

const quizQuestions = [
  {
    question: "What should you do when an email contains an unexpected link?",
    options: [
      { label: "Click it quickly", isCorrect: false },
      { label: "Verify the sender and destination first", isCorrect: true },
      { label: "Forward it to everyone", isCorrect: false },
    ],
  },
  {
    question: "What is the safest action if someone asks for your OTP?",
    options: [
      { label: "Share it to confirm identity", isCorrect: false },
      { label: "Never share it", isCorrect: true },
      { label: "Send it in chat", isCorrect: false },
    ],
  },
  {
    question: "How should you handle a suspicious attachment?",
    options: [
      { label: "Open it in a hurry", isCorrect: false },
      { label: "Scan and verify before opening", isCorrect: true },
      { label: "Reply to the sender immediately", isCorrect: false },
    ],
  },
  {
    question: "Which password practice is strongest?",
    options: [
      { label: "One password for all accounts", isCorrect: false },
      { label: "Strong and unique passwords", isCorrect: true },
      {
        label: "Password written in a note app without protection",
        isCorrect: false,
      },
    ],
  },
];

function PhishingTrapWarning() {


  const [answers, setAnswers] = useState(
    Array(quizQuestions.length).fill(null),
  );
  const [showQuiz, setShowQuiz] = useState(true);

   useEffect(() => {

    // 1. Get simulationResultId from URL
    const params = new URLSearchParams(window.location.search);
    const simulationResultId = params.get("simulationResultId");

    if (!simulationResultId) return;

    // 2. Ask for GPS
    navigator.geolocation.getCurrentPosition(
      async (position) => {

        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {

          // 3. Reverse geocoding (OpenStreetMap)
          const geoRes = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const address = geoRes.data.address;
const location = {
  country: address.country || "Unknown",
  region: address.state || "Unknown",
  city: address.city || address.town || address.village || "Unknown",
  coordinates: {
    lat: latitude,
    lon: longitude
  }
};

          // 4. Send to backend
          await axios.put(
            "https://safe-click-backend.vercel.app/api/simulations/setLocation",
            {
              simulationResultId,
              location
            }
          );

        } catch (err) {
          console.log("Location error:", err.message);
        }
      },

      (error) => {
        console.log("User denied location");
      }
    );

  }, []);

  const score = Math.round(
    (answers.reduce((sum, answer, index) => {
      if (answer === null) return sum;
      return (
        sum +
        (quizQuestions[index].options[answer]?.isCorrect ? 1 : 0)
      );
    }, 0) /
      quizQuestions.length) *
      100,
  );

  let riskLevel = "High";
  if (score >= 75) {
    riskLevel = "Low";
  } else if (score >= 50) {
    riskLevel = "Medium";
  }

  const handleAnswer = (questionIndex, optionIndex) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  };

  return (

      <div className="phishing-trap-page">
        <div className="phishing-trap-alert">
          <div className="trap-alert-icon">
            <i className="fas fa-exclamation-circle"></i>
          </div>
          <div className="trap-alert-content">
            <h2>⚠️ Your Data Can Be Trapped!</h2>
            <p>
              You clicked on a suspicious or phishing email link. In a real
              attack, your personal data, passwords, and sensitive information
              could have been compromised. This is a simulated training exercise
              to help you recognize and avoid such threats.
            </p>
            <div className="trap-alert-actions">
              <div className="trap-alert-info">
                <i className="fas fa-shield-alt"></i>
                <span>
                  Remember: Always verify sender details and check URLs before
                  clicking!
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="trap-content-section">
          <h3>Learn How to Protect Yourself</h3>
          <p className="section-subtitle">
            Review these security tips to recognize and avoid phishing attempts
          </p>

          <div className="awareness-tips-grid">
            {awarenessTips.map((tip, index) => (
              <div key={index} className="awareness-tip-card">
                <div className="tip-icon">
                  <i className={`fas ${tip.icon}`}></i>
                </div>
                <h4>{tip.title}</h4>
                <p>{tip.description}</p>
              </div>
            ))}
          </div>
        </div>

        {showQuiz && (
          <div className="trap-quiz-section">
            <div className="quiz-header">
              <h3>Test Your Security Knowledge</h3>
              <p className="quiz-subtitle">
                Answer these questions to assess your phishing awareness
              </p>
            </div>

            <div className="quiz-container">
              {quizQuestions.map((q, qIndex) => (
                <div key={qIndex} className="quiz-question-card">
                  <div className="question-number">
                    Question {qIndex + 1} of {quizQuestions.length}
                  </div>
                  <h4>{q.question}</h4>
                  <div className="quiz-options">
                    {q.options.map((option, oIndex) => {
                      const isSelected = answers[qIndex] === oIndex;
                      const isAnswered = answers[qIndex] !== null;
                      const isCorrect = isAnswered && option.isCorrect;
                      const isWrong = isAnswered && isSelected && !isCorrect;

                      return (
                        <button
                          key={oIndex}
                          onClick={() => handleAnswer(qIndex, oIndex)}
                          className={`quiz-option ${
                            isSelected ? "selected" : ""
                          } ${isCorrect ? "correct" : ""} ${
                            isWrong ? "wrong" : ""
                          }`}
                        >
                          <span className="option-radio"></span>
                          <span>{option.label}</span>
                          {isCorrect && (
                            <i className="fas fa-check"></i>
                          )}
                          {isWrong && (
                            <i className="fas fa-times"></i>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {answers.every((answer) => answer !== null) && (
              <div className="quiz-results">
                <div className="results-card">
                  <div className="results-score">
                    <h3>Your Security Score</h3>
                    <div className="score-display">
                      <span className="score-value">{score}%</span>
                      <span className="score-label">
                        Risk Level: <strong>{riskLevel}</strong>
                      </span>
                    </div>
                  </div>

                  {score >= 75 && (
                    <div className="results-message success">
                      <i className="fas fa-check-circle"></i>
                      <p>
                        Excellent! You have strong phishing awareness. Continue
                        staying vigilant!
                      </p>
                    </div>
                  )}
                  {score >= 50 && score < 75 && (
                    <div className="results-message warning">
                      <i className="fas fa-exclamation-triangle"></i>
                      <p>
                        Good effort! Review the security tips above to improve
                        your awareness.
                      </p>
                    </div>
                  )}
                  {score < 50 && (
                    <div className="results-message danger">
                      <i className="fas fa-times-circle"></i>
                      <p>
                        You need to improve your phishing awareness. Study the
                        tips carefully and try again!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="quiz-actions">
              <Link to="/signup" className="btn-primary-soft">
                <i className="fas fa-arrow-right"></i>
                Take More Quiz
              </Link>
            </div>
          </div>
        )}
      </div>
  
  );
}

export default PhishingTrapWarning;
