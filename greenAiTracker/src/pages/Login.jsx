import LoginSignup from "../components/LoginComponents/LoginSignUpField";
import LoginSummaryCard from "../components/LoginComponents/WebsiteSummary";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="auth-head">
          <h1>Welcome back</h1>
          <p>Track the environmental impact of AI</p>
        </div>

        {/*cards side by side*/}
        <div className="auth">
          <LoginSummaryCard />
          <LoginSignup
            onLogin={(user, remember) => {
              login(user, remember);
              navigate("/profile");
            }}

          onGoogleSignIn={() => { }}      // optional
          onForgotPassword={() => { }}  
          
          />
        </div>
      </div>
    </main>
  );
}