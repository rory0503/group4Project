import LoginSignup from "../components/LoginComponents/LoginSignUpField";
import LoginSummaryCard from "../components/LoginComponents/WebsiteSummary";

export default function Login() {
  return (
    <main id="main" className="page">
      <div className="container">
        <div className="auth-head">
          <h1>Welcome back</h1>
          <p>Track the environmental impact of AI</p>
        </div>

        <LoginSummaryCard />


        <LoginSignup
          onLogin={(user) => { setCurrentUserId(user.id); navigate("/profile"); }}
          onGoogleSignIn={() => { }}      // optional
          onForgotPassword={() => { }}    // optional
        />
      </div>
    </main>
  );
}