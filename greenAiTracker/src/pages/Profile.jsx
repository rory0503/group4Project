import ProfileSideBar from "../components/ProfileComponents/profileSideBar.jsx";
import FavouriteModel from "../components/ProfileComponents/favouriteModels.jsx";
import Settings from "../components/ProfileComponents/profileSettings.jsx";

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

          <div className="profile-content">
          </div>
        </div>
      </div>
    </main>
  );
}

export default Profile;