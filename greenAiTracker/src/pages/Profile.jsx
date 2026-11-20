import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AccountCard from "../components/ProfileComponents/accountCard";
import FavouriteModel from "../components/ProfileComponents/favouriteModels";
import Settings from "../components/ProfileComponents/profileSettings";
import { T } from "../context/TranslationContext";
import "../styles/profile.css";

export default function Profile() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1><T>Account Preferences</T></h1>
            <p>
              <T>
                Manage your favourite models and customise your account settings.
              </T>
            </p>
          </div>
        </div>

        <div className="profile-page">
          <AccountCard user={user} />

          <div className="profile-content">
            <FavouriteModel user={user} />
            <Settings user={user} />
          </div>
        </div>
      </div>
    </main>
  );
}
