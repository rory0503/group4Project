import { useState } from "react";
import { Eye, EyeOff, Droplet, Zap, Cloud, Globe, Leaf } from "lucide-react";
import { getUserByEmail, addUser } from "../../data/userInformation.js";// change this path to match your project

// Styles for the whole element (matches the Figma "Log in/ Sign up" frame)
const css = `
.auth {
  font-family: "Inter", sans-serif;
  color: #0f3d2e;
  padding: 0 24px 64px;
}

/* Heading above the two cards */
.auth-welcome { text-align: center; margin-bottom: 56px; }
.auth-welcome h1 { margin: 0; font-size: 40px; font-weight: 700; }
.auth-welcome p { margin: 12px 0 0; font-size: 24px; font-weight: 500; }

/* Two cards side by side */
.auth-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 525px));
  justify-content: center;
  gap: 44px;
}
.auth-card {
  box-sizing: border-box;
  min-height: 600px;
  border: 2px solid #7ca982;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}

/* Left card: information */
.auth-info { background: #f0f6ee; padding: 45px 33px 33px; }
.auth-art { position: relative; width: 135px; height: 100px; }
.auth-art-globe {
  width: 92px; height: 92px; border-radius: 50%;
  background: #0f4c5c; color: #a8d5b5;
  display: flex; align-items: center; justify-content: center;
}
.auth-art-leaf { position: absolute; top: -6px; left: 62px; color: #0f3d2e; fill: #4ea75a; }
.auth-info h2 { margin: 56px 0 0; max-width: 299px; font-size: 26px; font-weight: 600; line-height: 1.2; }
.auth-info p { margin: 16px 0 0; max-width: 299px; font-size: 15px; line-height: 1.4; }
.auth-tiles { margin-top: auto; padding-top: 36px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 17px; }
.auth-tile { min-height: 150px; padding: 14px 10px; border: 1px solid #7ca982; border-radius: 10px; background: #f0f6ee; }
.auth-tile-icon { position: relative; height: 44px; display: flex; align-items: center; }
.auth-tile-icon small { position: absolute; left: 17px; top: 14px; font-size: 9px; font-weight: 700; }
.auth-tile h3 { margin: 8px 0 0; font-size: 14px; font-weight: 600; }
.auth-tile span { display: block; margin-top: 6px; font-size: 11px; line-height: 1.35; }

/* Right card: form */
.auth-form-card { background: #ffffff; padding: 32px 24px 24px; }
.auth-tabs { display: grid; grid-template-columns: 1fr 1fr; }
.auth-tab {
  height: 50px; border: 1px solid #7ca982; background: #ffffff; color: #0f3d2e;
  font: 600 20px "Inter", sans-serif; cursor: pointer;
}
.auth-tab:first-child { border-radius: 10px 0 0 10px; }
.auth-tab:last-child { border-radius: 0 10px 10px 0; }
.auth-tab[aria-selected="true"] { background: #0f3d2e; border-color: #0f3d2e; color: #ffffff; }

.auth-field { margin-top: 16px; }
.auth-field:first-of-type { margin-top: 27px; }
.auth-field label { display: block; margin-bottom: 6px; font-size: 16px; font-weight: 600; }
.auth-input {
  box-sizing: border-box; width: 100%; height: 52px; padding: 0 16px;
  border: 1px solid #7ca982; border-radius: 10px; background: #ffffff;
  font: 500 16px "Inter", sans-serif; color: #0f3d2e;
}
.auth-input::placeholder { color: rgba(0, 0, 0, 0.5); }
.auth-input:focus { outline: none; border-color: #0f3d2e; box-shadow: 0 0 0 1px #0f3d2e; }

.auth-password { position: relative; }
.auth-password .auth-input { padding-right: 48px; }
.auth-eye {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  display: flex; padding: 4px; border: 0; background: none; color: #0f3d2e; cursor: pointer;
}

.auth-link {
  padding: 0; border: 0; background: none; color: #0f3d2e;
  font: inherit; text-decoration: underline; cursor: pointer;
}
.auth-forgot { align-self: flex-end; margin-top: 10px; font-size: 14px; font-weight: 500; }
.auth-error { margin: 12px 0 0; font-size: 14px; color: #b3261e; }

.auth-submit {
  margin-top: 32px; width: 100%; height: 52px; border: 0; border-radius: 10px;
  background: #0f3d2e; color: #ffffff; font: 500 20px "Inter", sans-serif; cursor: pointer;
}
.auth-submit:hover { background: #164a38; }

.auth-divider { display: flex; align-items: center; gap: 16px; margin: 29px 0 20px; font-size: 14px; }
.auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: #7ca982; }

.auth-google {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  width: 100%; height: 52px; border: 1px solid #7ca982; border-radius: 10px;
  background: #ffffff; color: #000000; font: 500 14px "Inter", sans-serif; cursor: pointer;
}
.auth-google:hover { background: #f0f6ee; }
.auth-google b { font-size: 24px; font-weight: 800; }

.auth-switch { margin: auto 0 0; padding-top: 20px; text-align: center; font-size: 14px; }

.auth button:focus-visible { outline: 2px solid #0f3d2e; outline-offset: 2px; }

/* On narrow screens the cards stack, form first */
@media (max-width: 960px) {
  .auth-grid { grid-template-columns: minmax(0, 525px); }
  .auth-info { order: 2; }
  .auth-welcome h1 { font-size: 32px; }
  .auth-welcome p { font-size: 18px; }
}
`;

export default function LoginSignup({ onLogin, onGoogleSignIn, onForgotPassword }) {
  const [mode, setMode] = useState("login"); // "login" or "signup"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  // Switch between the Log in and Sign Up tabs
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
      if (onLogin) onLogin(user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="auth" aria-labelledby="auth-title">
      <style>{css}</style>

      <div className="auth-grid">
        <div className="auth-card auth-form-card">
          {/* Tabs */}
          <div className="auth-tabs" role="tablist" aria-label="Log in or sign up">
            <button type="button" role="tab" className="auth-tab" aria-selected={isLogin} onClick={() => switchMode("login")}>
              Log in
            </button>
            <button type="button" role="tab" className="auth-tab" aria-selected={!isLogin} onClick={() => switchMode("signup")}>
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            {/* Name only shows when signing up */}
            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="auth-name">Name</label>
                <input
                  id="auth-name"
                  className="auth-input"
                  type="text"
                  placeholder="Your name"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <div className="auth-password">
                <input
                  id="auth-password"
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {/* Eye button shows or hides the password */}
                <button
                  type="button"
                  className="auth-eye"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Forgot password only makes sense when logging in */}
            {isLogin && (
              <button type="button" className="auth-link auth-forgot" onClick={onForgotPassword}>
                Forgot Password?
              </button>
            )}

            {/* Error message (wrong password, email already used, etc.) */}
            {error && <p className="auth-error" role="alert">{error}</p>}

            <button type="submit" className="auth-submit">
              {isLogin ? "Log in" : "Create account"}
            </button>
          </form>

          <div className="auth-divider">or continue with</div>

          <button type="button" className="auth-google" onClick={onGoogleSignIn}>
            <b aria-hidden="true">G</b>
            Continue with Google
          </button>

          {/* Link to switch tabs */}
          <p className="auth-switch">
            {isLogin ? "New here? " : "Already have an account? "}
            <button type="button" className="auth-link" onClick={() => switchMode(isLogin ? "signup" : "login")}>
              {isLogin ? "Create an account" : "Log in"}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}