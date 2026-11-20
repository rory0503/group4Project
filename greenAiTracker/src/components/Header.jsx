import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Leaf,
  Menu,
  X,
  Moon,
  Sun,
  Globe,
  User,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  useTranslation,
  LANGUAGES,
  T,
  useTranslatedText,
} from "../context/TranslationContext";

// Main navigation links (the Profile link is added separately, only when logged in)
const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/compare", label: "Compare" },
  { to: "/rankings", label: "Rankings" },
  { to: "/information", label: "Information" },
];

const LANGS = LANGUAGES;

export default function Header() {
  // Login state comes from AuthContext
  const { isLoggedIn, user, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  // Theme and language settings
  const { settings, setSettings, setLanguage } = useTranslation();

  const theme = settings.theme === "dark" ? "dark" : "light";

  // Mobile menu open/closed
  const [menuOpen, setMenuOpen] = useState(false);

  // Translated accessibility labels
  const mobileMenuLabel = useTranslatedText(
    menuOpen ? "Close menu" : "Open menu"
  );

  const mainNavigationLabel = useTranslatedText("Main");

  const themeLabel = useTranslatedText(
    theme === "dark"
      ? "Switch to light theme"
      : "Switch to dark theme"
  );

  const languageLabel = useTranslatedText("Language");

  const logoutLabel = useTranslatedText("Log out");

  const profileLabel = useTranslatedText("Profile");

  // Apply the theme to the whole page
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function toggleTheme() {
    setSettings({
      ...settings,
      theme: theme === "dark" ? "light" : "dark",
    });
  }

  function changeLang(e) {
    setLanguage(e.target.value);
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <div className="container nav">
        {/* Logo */}
        <Link className="brand" to="/">
          <span className="brand-mark">
            <Leaf className="icon icon-sm" />
          </span>
          <span>Green AI Tracker</span>
        </Link>

        {/* Menu button (mobile only) */}
        <button
          className="icon-btn nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          aria-label={mobileMenuLabel}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="icon" />
          ) : (
            <Menu className="icon" />
          )}
        </button>

        <nav
          id="nav-menu"
          className={`nav-menu${menuOpen ? " open" : ""}`}
          aria-label={mainNavigationLabel}
        >
          {/* Page links */}
          <ul className="nav-links">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"}>
                  <T>{item.label}</T>
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            {/* Light / dark theme */}
            <button
              className="icon-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={themeLabel}
            >
              {theme === "dark" ? (
                <Sun className="icon" />
              ) : (
                <Moon className="icon" />
              )}
            </button>

            {/* Language */}
            <label className="lang">
              <Globe className="icon icon-sm" />

              <span className="sr-only">
                {languageLabel}
              </span>

              <select
                value={settings.lang}
                onChange={changeLang}
                aria-label={languageLabel}
              >
                {LANGS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {/* Logged in: Profile + Log out. Logged out: Log in. */}
            {isLoggedIn ? (
              <>
                <NavLink
                  className="nav-cta"
                  to="/profile"
                  title={user?.name}
                >
                  <User className="icon icon-sm" />
                  <span>{profileLabel}</span>
                </NavLink>

                <button
                  className="icon-btn"
                  type="button"
                  onClick={handleLogout}
                  aria-label={logoutLabel}
                  title={logoutLabel}
                >
                  <LogOut className="icon" />
                </button>
              </>
            ) : (
              <NavLink className="nav-cta" to="/login">
                <User className="icon icon-sm" />
                <span>
                  <T>Log in</T>
                </span>
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
