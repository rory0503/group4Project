import { currentUser } from "./userInformation.js";

<ProfileSideBar user={currentUser} />

function ProfileSideBar({ user }) {
  return (
    <div className="sidebar">
      <div className="sidebar-profile">
        <img
          className="sidebar-profile__pic"
          src={user.profilePic}
          alt={`${user.name}'s profile picture`}
        />
        <div className="sidebar-profile__text">
          <span className="sidebar-profile__name">{user.name}</span>
          <span className="sidebar-profile__email">{user.email}</span>
        </div>
      </div>
    </div>
  );
}

export default ProfileSideBar