import { useState } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";


const GOOGLE_CLIENT_ID = "497652057104-ht7b4ghkvp83j9okqjl2d5j9u6b4ve6b.apps.googleusercontent.com";

function Button({ onSignIn }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = useGoogleLogin({
    onSuccess: async ({ access_token }) => {
      try {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const p = await res.json();
        onSignIn?.({ id: p.sub, name: p.name, email: p.email, avatar: p.picture });
      } catch {
        setError("Google sign-in failed. Please try again.");
      }
      setLoading(false);
    },
    onError: () => {
      setError("Google sign-in failed. Please try again.");
      setLoading(false);
    },
    onNonOAuthError: () => setLoading(false),
  });

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setError("");
          setLoading(true);
          login();
        }}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          padding: "12px 16px",
          border: "1px solid #d0d7d3",
          borderRadius: 8,
          background: "#fff",
          color: "#14382c",
          fontSize: 16,
          fontWeight: 600,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 2.9-2.2 5.4-4.7 7.1l7.6 5.9c4.4-4.1 6.9-10.1 6.9-17.5z" />
          <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.8l7.9-6.2z" />
          <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
        </svg>
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
      {error && <p style={{ color: "#b42318", fontSize: 14, marginTop: 8 }}>{error}</p>}
    </>
  );
}

export default function GoogleSignInButton({ onSignIn }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Button onSignIn={onSignIn} />
    </GoogleOAuthProvider>
  );
}
