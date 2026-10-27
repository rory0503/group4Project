import { currentUser } from "../profilePage/userInformation.js";
import ProfileSideBar from "../profilePage/profileSideBar.jsx";
import FavouriteModel from "../profilePage/favouriteModels.jsx";
import Settings from "../profilePage/profileSettings.jsx";
import "../profilePage/profile.css";

function Profile() {
  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>Account Preferences</h1>
            <p>Manage your favourite models and customise your account settings.</p>
          </div>
        </div>

        <div className="profile-page">
          <ProfileSideBar user={currentUser} />

          <div className="profile-content">
            <FavouriteModel user={currentUser} />
            <Settings user={currentUser} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;