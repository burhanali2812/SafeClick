import React, { useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "./ShowAwareness.css";

const awarenessTips = [
  {
    title: "Do not click suspicious links",
    description:
      "If an email, SMS, or message looks strange, avoid clicking links immediately.",
    icon: "fa-link-slash",
  },
  {
    title: "Check the sender’s email address carefully",
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
      "Phishing attackers create panic like “Your account will be blocked!”.",
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

function ShowAwareness() {
  const [answers, setAnswers] = useState(
    Array(quizQuestions.length).fill(null),
  );
  const [warningMessage, setWarningMessage] = useState("");
  const [quizSummary, setQuizSummary] = useState({
    score: 0,
    riskLabel: "High",
    riskTone: "danger",
    answeredCount: 0,
    correctCount: 0,
  });

  const handleAnswer = (questionIndex, value) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = value;

      const isCorrect = quizQuestions[questionIndex].options[value]?.isCorrect;
      setWarningMessage(
        isCorrect
          ? ""
          : "Warning: You clicked on a suspicious link or unsafe answer. Please review the security guidance below.",
      );

      const answeredCount = next.filter((answer) => answer !== null).length;
      const correctCount = next.reduce((sum, answer, index) => {
        if (answer === null) return sum;
        return sum + (quizQuestions[index].options[answer]?.isCorrect ? 1 : 0);
      }, 0);
      const score = Math.round((correctCount / quizQuestions.length) * 100);
      let riskLabel = "High";
      let riskTone = "danger";

      if (score >= 75) {
        riskLabel = "Low";
        riskTone = "good";
      } else if (score >= 50) {
        riskLabel = "Medium";
        riskTone = "warn";
      }

      setQuizSummary({
        score,
        riskLabel,
        riskTone,
        answeredCount,
        correctCount,
      });

      return next;
    });
  };

  return (
    <div className="awareness-page">
      {warningMessage ? (
        <div className="awareness-warning-banner" role="alert">
          <i className="fas fa-triangle-exclamation"></i>
          <span>{warningMessage}</span>
        </div>
      ) : null}

      <section className="awareness-hero">
        <div className="awareness-hero-copy">
          <span className="awareness-pill">Awareness Services</span>
          <h1>Learn phishing awareness and keep your security score strong.</h1>
          <p>
            Safe Click helps you build safer habits, test your knowledge with a
            live quiz, and understand your current risk level before you join
            the platform.
          </p>

          <div className="awareness-cta-group">
            <Link to="/signup" className="btn btn-primary awareness-cta-btn">
              Join Safe Click
            </Link>
            <a href="#quiz" className="btn btn-outline-dark awareness-cta-btn">
              Solve Quiz
            </a>
          </div>
        </div>

        <div className="awareness-hero-panel">
          <div className="awareness-stat-card">
            <span>Live Security Score</span>
            <strong>{quizSummary.score}%</strong>
            <div className="awareness-progress-track">
              <div
                className="awareness-progress-fill"
                style={{ width: `${quizSummary.score}%` }}
              />
            </div>
            <small>
              {quizSummary.correctCount} of {quizQuestions.length} correct
              answers
            </small>
          </div>
          <div className={`awareness-risk-card ${quizSummary.riskTone}`}>
            <span>Risk Level</span>
            <strong>{quizSummary.riskLabel}</strong>
            <small>{quizSummary.answeredCount} question(s) answered</small>
          </div>
          <div className="awareness-join-card">
            <i className="fas fa-user-shield"></i>
            <div>
              <h3>Join Safe Click</h3>
              <p>Protect your team with phishing training and secure habits.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="awareness-section">
        <div className="section-header">
          <h2>Security Awareness Services</h2>
          <p>
            These practical tips help you avoid phishing, malware, and unsafe
            account access.
          </p>
        </div>

        <div className="tips-grid">
          {awarenessTips.map((tip) => (
            <article key={tip.title} className="tip-card">
              <div className="tip-icon">
                <i className={`fas ${tip.icon}`}></i>
              </div>
              <h3>{tip.title}</h3>
              <p>{tip.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="quiz" className="awareness-section quiz-section">
        <div className="section-header">
          <h2>Live Security Quiz</h2>
          <p>
            Answer a few questions and watch your security score and risk level
            update instantly.
          </p>
        </div>

        <div className="quiz-card">
          {quizQuestions.map((item, questionIndex) => (
            <div key={item.question} className="quiz-question">
              <h3>
                {questionIndex + 1}. {item.question}
              </h3>
              <div className="quiz-options">
                {item.options.map((option, optionIndex) => {
                  const active = answers[questionIndex] === optionIndex;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      className={`btn quiz-option ${active ? "btn-primary" : "btn-outline-dark"}`}
                      onClick={() => handleAnswer(questionIndex, optionIndex)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="quiz-footer-note">
            Your live security score and risk level update as you answer each
            question.
          </div>

          <div className="quiz-cta-wrap">
            <Link to="/signup" className="btn btn-primary quiz-cta-btn">
              Take More Quiz
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ShowAwareness;
