import LoginSignup from "../components/LoginComponents/LoginSignUpField";
import LoginSummaryCard from "../components/LoginComponents/WebsiteSummary";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { T } from "../context/TranslationContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="auth-head">
          <h1><T>Welcome back</T></h1>
          <p><T>Track the environmental impact of AI</T></p>
        </div>

        <div className="auth">
          <LoginSummaryCard />

          <LoginSignup
            onLogin={(user, remember) => {
              login(user, remember);
              navigate("/profile");
            }}
            onGoogleSignIn={() => {}}
            onForgotPassword={() => {}}
          />
        </div>
      </div>
    </main>
  );
}
