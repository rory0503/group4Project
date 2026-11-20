import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  getUserByEmail,
  addUser,
} from "../../data/userInformation.js";
import GoogleSignInButton from "./GoogleSignInButton";
import {
  T,
  useTranslatedText,
} from "../../context/TranslationContext";

export default function LoginSignup({
  onLogin,
  onGoogleSignIn,
  onForgotPassword,
}) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const isLogin = mode === "login";

  // Translated input placeholders
  const namePlaceholder = useTranslatedText("Your name");

  const passwordLoginPlaceholder = useTranslatedText(
    "Enter your password"
  );

  const passwordSignupPlaceholder = useTranslatedText(
    "Choose a password"
  );

  // Translated accessibility labels
  const showPasswordLabel = useTranslatedText("Show password");

  const hidePasswordLabel = useTranslatedText("Hide password");

  const formLabel = useTranslatedText("Log in or sign up");

  const accountLabel = useTranslatedText("Account");

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      let user;

      if (isLogin) {
        user = getUserByEmail(email.trim());

        if (!user || user.password !== password) {
          throw new Error("Incorrect email or password.");
        }
      } else {
        user = addUser({
          name: name.trim(),
          email: email.trim(),
          password,
        });
      }

      if (onLogin) onLogin(user, remember);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleGoogleSignIn(googleUser) {
    setError("");

    try {
      const user =
        getUserByEmail(googleUser.email) ??
        addUser({
          name: googleUser.name || googleUser.email,
          email: googleUser.email,
          password: crypto.randomUUID(),
        });

      if (onLogin) onLogin(user, remember);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section
      className="card auth-card"
      aria-label={formLabel}
    >
      <div
        className="tabs"
        role="tablist"
        aria-label={accountLabel}
      >
        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={isLogin}
          onClick={() => switchMode("login")}
        >
          <T>Log in</T>
        </button>

        <button
          type="button"
          role="tab"
          className="tab"
          aria-selected={!isLogin}
          onClick={() => switchMode("signup")}
        >
          <T>Sign up</T>
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="field">
            <label htmlFor="auth-name">
              <T>Full name</T>
            </label>

            <input
              id="auth-name"
              className="input"
              type="text"
              placeholder={namePlaceholder}
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="field">
          <label htmlFor="auth-email">
            <T>Email address</T>
          </label>

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
          <label htmlFor="auth-password">
            <T>Password</T>
          </label>

          <div className="input-wrap">
            <input
              id="auth-password"
              className="input"
              type={showPassword ? "text" : "password"}
              placeholder={
                isLogin
                  ? passwordLoginPlaceholder
                  : passwordSignupPlaceholder
              }
              autoComplete={
                isLogin ? "current-password" : "new-password"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="input-icon"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={
                showPassword
                  ? hidePasswordLabel
                  : showPasswordLabel
              }
              title={
                showPassword
                  ? hidePasswordLabel
                  : showPasswordLabel
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="icon-sm" />
              ) : (
                <Eye className="icon-sm" />
              )}
            </button>
          </div>
        </div>

        {isLogin && (
          <div className="row-between">
            <label className="checkbox">
              <input
                className="check"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />

              <T>Remember me</T>
            </label>

            <button
              type="button"
              className="link-btn"
              onClick={onForgotPassword}
            >
              <T>Forgot password?</T>
            </button>
          </div>
        )}

        {error && (
          <p className="field-error" role="alert">
            <T>{error}</T>
          </p>
        )}

        <button
          className="btn btn-primary btn-block"
          type="submit"
          style={{ minHeight: 50, fontSize: 16 }}
        >
          {isLogin ? (
            <T>Log in</T>
          ) : (
            <T>Create account</T>
          )}
        </button>

        <div className="divider">
          <T>or continue with</T>
        </div>

        <GoogleSignInButton
          onSignIn={handleGoogleSignIn}
        />

        <p className="auth-switch">
          {isLogin ? (
            <T>New here?</T>
          ) : (
            <T>Already have an account?</T>
          )}

          {" "}

          <button
            type="button"
            className="link-btn"
            onClick={() =>
              switchMode(isLogin ? "signup" : "login")
            }
          >
            {isLogin ? (
              <T>Create an account</T>
            ) : (
              <T>Log in</T>
            )}
          </button>
        </p>
      </form>
    </section>
  );
}
