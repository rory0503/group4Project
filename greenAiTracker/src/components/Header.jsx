import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Leaf, Menu, X, Moon, Sun, Globe, User, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import useLocalStorage from "../hooks/useLocalStorage";

// Main navigation links (the Profile link is added separately, only when logged in)
const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/compare", label: "Compare" },
  { to: "/rankings", label: "Rankings" },
  { to: "/information", label: "Information" },
];

const LANGS = [
  ["en", "EN"],
  ["fr", "FR"],
  ["es", "ES"],
  ["de", "DE"],
];

export default function Header() {
  // Login state comes from AuthContext, so the header updates as soon as someone logs in or out
  const { isLoggedIn, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Theme and language are saved in the browser (stored as "gat-settings")
  const [settings, setSettings] = useLocalStorage("settings", { theme: "light", lang: "en" });
  const theme = settings.theme === "dark" ? "dark" : "light";

  // Mobile menu open/closed
  const [menuOpen, setMenuOpen] = useState(false);

  // Apply the theme to the whole page (styles.css reads :root[data-theme="dark"])
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Close the mobile menu whenever the page changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  function toggleTheme() {
    setSettings({ ...settings, theme: theme === "dark" ? "light" : "dark" });
  }

  function changeLang(e) {
    setSettings({ ...settings, lang: e.target.value });
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
          <span className="brand-mark"><Leaf className="icon icon-sm" /></span>
          <span>Green AI Tracker</span>
        </Link>

        {/* Menu button (mobile only) */}
        <button
          className="icon-btn nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="icon" /> : <Menu className="icon" />}
        </button>

        <nav id="nav-menu" className={`nav-menu${menuOpen ? " open" : ""}`} aria-label="Main">
          {/* Page links: NavLink adds the "active" class to the current page */}
          <ul className="nav-links">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === "/"}>
                  {item.label}
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
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun className="icon" /> : <Moon className="icon" />}
            </button>

            {/* Language (translations aren't built yet) */}
            <label className="lang">
              <Globe className="icon icon-sm" />
              <span className="sr-only">Language</span>
              <select value={settings.lang} onChange={changeLang}>
                {LANGS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            {/* Logged in: Profile + Log out. Logged out: Log in. */}
            {isLoggedIn ? (
              <>
                <NavLink className="nav-cta" to="/profile" title={user?.name}>
                  <User className="icon icon-sm" />
                  <span>Profile</span>
                </NavLink>
                <button className="icon-btn" type="button" onClick={handleLogout} aria-label="Log out">
                  <LogOut className="icon" />
                </button>
              </>
            ) : (
              <NavLink className="nav-cta" to="/login">
                <User className="icon icon-sm" />
                <span>Log in</span>
              </NavLink>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}