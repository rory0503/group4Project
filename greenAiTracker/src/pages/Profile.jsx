import ProfileSideBar from "../components/ProfileComponents/profileSideBar";
import FavouriteModel from "../components/ProfileComponents/favouriteModels";
import Settings from "../components/ProfileComponents/profileSettings";
import "../styles/profile.css";
import { currentUser } from "../data/userInformation";

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