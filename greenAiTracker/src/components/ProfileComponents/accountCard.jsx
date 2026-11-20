import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { T } from "../../context/TranslationContext";

function AccountCard({ user }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user.name || user.email.split("@")[0];

  function handleLogout() {
    logout();
    navigate("/");
  }

  const details = [
    { label: "Email", value: user.email },
    { label: "Password", value: "••••••••" },
  ];

  return (
    <section
      className="card account-card"
      aria-labelledby="account-title"
    >
      <div className="account-card__who">
        <span
          className="account-card__avatar"
          aria-hidden="true"
        >
          {displayName.charAt(0).toUpperCase()}
        </span>

        <div className="account-card__identity">
          <h2 className="account-card__name" id="account-title">
            {displayName}
          </h2>

          <span className="badge badge-good">
            <T>Signed in</T>
          </span>
        </div>
      </div>

      <dl className="account-card__details">
        {details.map((item) => (
          <div
            className="account-card__detail"
            key={item.label}
          >
            <dt><T>{item.label}</T></dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      <button
        className="btn btn-outline account-card__logout"
        type="button"
        onClick={handleLogout}
      >
        <LogOut className="icon icon-sm" />
        <T>Log out</T>
      </button>
    </section>
  );
}

export default AccountCard;
