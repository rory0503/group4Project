import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { getUserByEmail, addUser } from "../../data/userInformation.js";

// The right-hand card on the Login page: Log in / Sign up tabs and the form.
export default function LoginSignup({ onLogin, onGoogleSignIn, onForgotPassword }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  // Switch between the Log in and Sign up tabs
  function switchMode(next) {
    setMode(next);
    setError("");
  }

  // Runs when the form is submitted
  function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      let user;
      if (isLogin) {
        // Look the user up and check the password (mock data only)
        user = getUserByEmail(email.trim());
        if (!user || user.password !== password) {
          throw new Error("Incorrect email or password.");
        }
      } else {
        // addUser throws an error if the email is already taken
        user = addUser({ name: name.trim(), email: email.trim(), password });
      }
      // Hand the user to the parent page
      if (onLogin) onLogin(user, remember);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="card auth-card" aria-label="Log in or sign up">
      {/* Tabs */}
      <div className="tabs" role="tablist" aria-label="Account">
        <button type="button" role="tab" className="tab" aria-selected={isLogin} onClick={() => switchMode("login")}>
          Log in
        </button>
        <button type="button" role="tab" className="tab" aria-selected={!isLogin} onClick={() => switchMode("signup")}>
          Sign up
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Name only shows when signing up */}
        {!isLogin && (
          <div className="field">
            <label htmlFor="auth-name">Full name</label>
            <input
              id="auth-name"
              className="input"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="auth-email">Email address</label>
          <input
            id="auth-email"
            className="input"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <div className="input-wrap">
            <input
              id="auth-password"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder={isLogin ? "Enter your password" : "Choose a password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {/* Eye button shows or hides the password */}
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

        {/* Remember me / forgot password only make sense when logging in */}
        {isLogin && (
          <div className="row-between">
            <label className="checkbox">
              <input
                className="check"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <button type="button" className="link-btn" onClick={onForgotPassword}>
              Forgot password?
            </button>
          </div>
        )}

        {/* Error message (wrong password, email already used, etc.) */}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn-primary btn-block" type="submit" style={{ minHeight: 50, fontSize: 16 }}>
          {isLogin ? "Log in" : "Create account"}
        </button>

        <div className="divider">or continue with</div>

        <button className="btn btn-outline btn-block" type="button" onClick={onGoogleSignIn}>
          <span className="g-mark" aria-hidden="true">G</span>
          {isLogin ? "Continue with Google" : "Sign up with Google"}
        </button>

        {/* Link to switch tabs */}
        <p className="auth-switch">
          {isLogin ? "New here? " : "Already have an account? "}
          <button type="button" className="link-btn" onClick={() => switchMode(isLogin ? "signup" : "login")}>
            {isLogin ? "Create an account" : "Log in"}
          </button>
        </p>
      </form>
    </section>
  );
}