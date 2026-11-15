import { useState } from "react";
import emailjs from "@emailjs/browser";
import { Eye, EyeOff } from "lucide-react";
import { getUserByEmail, updatePassword } from "../../data/userInformation.js";

const EMAILJS_SERVICE_ID = "service_v2dhn36";
const EMAILJS_TEMPLATE_ID = "template_9hxce1y";
const EMAILJS_PUBLIC_KEY = "GdXDgK0R_jV1hxlMH";

const CODE_LIFETIME_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 8;

function makeCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
  return String(n).padStart(6, "0");
}

export default function ForgotPassword({ onBack }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [reset, setReset] = useState(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode() {
    setError("");
    setNotice("");
    if (EMAILJS_PUBLIC_KEY.startsWith("PASTE")) {
      setError("Password reset emails aren't set up yet. Add the EmailJS IDs to ForgotPassword.jsx.");
      return;
    }
    setBusy(true);
    try {
      const user = getUserByEmail(email.trim());
      if (user) {
        const newCode = makeCode();
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          { to_email: user.email, to_name: user.name, passcode: newCode },
          { publicKey: EMAILJS_PUBLIC_KEY }
        );
        setReset({ email: user.email, code: newCode, expires: Date.now() + CODE_LIFETIME_MS, attempts: 0 });
      } else {
        setReset(null);
      }
      setCode("");
      setStep("code");
      setNotice("If an account exists for that email, we've sent it a 6-digit code.");
    } catch (err) {
      console.error("EmailJS error:", err);
      setError("We couldn't send the email. Please try again in a moment.");
    } finally {
      setBusy(false);
    }
  }

  function handleEmail(e) {
    e.preventDefault();
    sendCode();
  }

  function handleCode(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!reset) {
      setError("That code isn't right.");
      return;
    }
    if (Date.now() > reset.expires) {
      setError("That code has expired. Send a new one.");
      return;
    }
    if (reset.attempts >= MAX_ATTEMPTS) {
      setError("Too many wrong attempts. Send a new code.");
      return;
    }
    if (code.trim() !== reset.code) {
      setReset({ ...reset, attempts: reset.attempts + 1 });
      setError("That code isn't right.");
      return;
    }
    setStep("password");
  }

  function handlePassword(e) {
    e.preventDefault();
    setError("");
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password needs to be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The passwords don't match.");
      return;
    }
    try {
      updatePassword(reset.email, password);
      setReset(null);
      setStep("done");
    } catch (err) {
      setError(err.message);
    }
  }

  const titles = {
    email: "Reset your password",
    code: "Check your email",
    password: "Choose a new password",
    done: "Password updated",
  };

  return (
    <section className="card auth-card" aria-label="Reset your password">
      <h2 style={{ fontSize: 26, marginBottom: 8 }}>{titles[step]}</h2>

      {step === "email" && (
        <form className="auth-form" onSubmit={handleEmail}>
          <p className="form-note" style={{ textAlign: "left", fontSize: 15 }}>
            Enter the email you signed up with and we'll send you a code to reset your password.
          </p>
          <div className="field">
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              className="input"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy} style={{ minHeight: 50, fontSize: 16 }}>
            {busy ? "Sending..." : "Send code"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form className="auth-form" onSubmit={handleCode}>
          {notice && <p className="form-note" style={{ textAlign: "left", fontSize: 15 }}>{notice}</p>}
          <div className="field">
            <label htmlFor="reset-code">6-digit code</label>
            <input
              id="reset-code"
              className="input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" style={{ minHeight: 50, fontSize: 16 }}>
            Continue
          </button>
          <p className="auth-switch">
            Didn't get it?{" "}
            <button type="button" className="link-btn" onClick={sendCode} disabled={busy}>
              {busy ? "Sending..." : "Send a new code"}
            </button>
          </p>
        </form>
      )}

      {step === "password" && (
        <form className="auth-form" onSubmit={handlePassword}>
          <div className="field">
            <label htmlFor="reset-password">New password</label>
            <div className="input-wrap">
              <input
                id="reset-password"
                className="input"
                type={showPassword ? "text" : "password"}
                placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-icon"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
              </button>
            </div>
          </div>
          <div className="field">
            <label htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              className="input"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button className="btn btn-primary btn-block" type="submit" style={{ minHeight: 50, fontSize: 16 }}>
            Update password
          </button>
        </form>
      )}

      {step === "done" && (
        <div className="auth-form">
          <p className="form-note" style={{ textAlign: "left", fontSize: 15 }}>
            Your password has been changed. You can now log in with your new password.
          </p>
          <button className="btn btn-primary btn-block" type="button" onClick={onBack} style={{ minHeight: 50, fontSize: 16 }}>
            Back to log in
          </button>
        </div>
      )}

      {step !== "done" && (
        <p className="auth-switch" style={{ marginTop: 18 }}>
          Remembered it?{" "}
          <button type="button" className="link-btn" onClick={onBack}>
            Back to log in
          </button>
        </p>
      )}
    </section>
  );
}
