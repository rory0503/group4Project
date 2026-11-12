import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function AccountCard({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Show the name if the user has one, otherwise the part of the email before the @
  const displayName = user.name || user.email.split("@")[0];

  function handleLogout() {
    logout();
    navigate("/");
  }

  // Only fields that exist are shown. The password is never displayed.
  const details = [
    { label: "Email", value: user.email },
    { label: "Password", value: "••••••••" },
  ].filter(Boolean);

  return (
    <section className="card account-card" aria-labelledby="account-title">
      <div className="account-card__who">
        {/* Initial in a green circle */}
        <span className="account-card__avatar" aria-hidden="true">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <div className="account-card__identity">
          <h2 className="account-card__name" id="account-title">{displayName}</h2>
          <span className="badge badge-good">Signed in</span>
        </div>
      </div>

      {/* Account details */}
      <dl className="account-card__details">
        {details.map((item) => (
          <div className="account-card__detail" key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <button className="btn btn-outline account-card__logout" type="button" onClick={handleLogout}>
        <LogOut className="icon icon-sm" />
        Log out
      </button>
    </section>
  );
}

export default AccountCard;