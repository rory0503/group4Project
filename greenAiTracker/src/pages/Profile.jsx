import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FavouriteModel from "../components/ProfileComponents/favouriteModels";
import Settings from "../components/ProfileComponents/profileSettings";
import "../styles/profile.css";

export default function Profile() {
  // The logged-in user comes from AuthContext (set when they log in on the Login page)
  const { user } = useAuth();

  // Not logged in (or the saved login is out of date): send them to the login page
  if (!user) return <Navigate to="/login" replace />;

  return (
    <main id="main" className="page">
      <div className="container">
        {/* Page title */}
        <div className="page-head">
          <div>
            <h1>Account Preferences</h1>
            <p>Manage your favourite models and customise your account settings.</p>
          </div>
        </div>

        {/* The two cards, side by side */}
        <div className="profile-page">
          <div className="profile-content">
            <FavouriteModel user={user} />
            <Settings user={user} />
          </div>
        </div>
      </div>
    </main>
  );
}