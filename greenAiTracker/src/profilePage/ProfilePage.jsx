import Header from "../Header.jsx"
import Footer from "../Footer.jsx"
import { currentUser } from "./userInformation.js";
import ProfileSideBar from "./profileSideBar.jsx";
import FavouriteModel from "./favouriteModels.jsx";
import Settings from "./profileSettings.jsx";
import './profile.css'
import '../index.css'

function ProfilePage() {
  return (
    <>
      <Header />

      <div className="profile-page">
        <ProfileSideBar user={currentUser} />

        <div className="profile-content">
          <FavouriteModel user={currentUser} />
          <Settings user={currentUser} />
        </div>
      </div>

      <Footer />
    </>
  );
}

export default ProfilePage