import { useEffect, useState } from "react"; //useEffect is a hook that allows you to perform side effects in your components, and useState is a hook that allows you to add state to your components
import { Link, NavLink } from "react-router-dom"; //allows you to navigate between different pages in your application without reloading the page
import { Leaf, Sun, Moon, Menu, X, Globe, User } from "lucide-react"; //this is the icons that appear in header
import useLocalStorage from "../hooks/useLocalStorage"; //saves values to local storage so that they persist across page reloads

const NAV = [
  ["/", "Dashboard"],
  ["/rankings", "Rankings"],
  ["/compare", "Compare"],
  ["/information", "Information"],
];
const LANGS = [["en", "EN"], ["fr", "FR"], ["es", "ES"], ["de", "DE"]];
const DEFAULTS = { metric: "water", range: "all", lang: "en", theme: "light", remember: true };

const isDark = (theme) =>
  theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stored, setStored] = useLocalStorage("settings", {});
  const [user] = useLocalStorage("user", null);
  const settings = { ...DEFAULTS, ...stored };
  const dark = isDark(settings.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <header className="site-header">
      <div className="container nav">
        <Link className="brand" to="/">
          <span className="brand-mark"><Leaf className="icon icon-sm" /></span>
          <span>Green AI Tracker</span>
        </Link>

        <button
          className="icon-btn nav-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="nav-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="icon" /> : <Menu className="icon" />}
        </button>

        <nav id="nav-menu" className={`nav-menu${menuOpen ? " open" : ""}`} aria-label="Main">
          <ul className="nav-links">
            {NAV.map(([to, label]) => (
              <li key={to}>
                <NavLink to={to} end onClick={() => setMenuOpen(false)}>{label}</NavLink>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <button
              className="icon-btn"
              type="button"
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setStored({ ...stored, theme: dark ? "light" : "dark" })}
            >
              {dark ? <Sun className="icon" /> : <Moon className="icon" />}
            </button>

            <label className="lang">
              <Globe className="icon icon-sm" />
              <span className="sr-only">Language</span>
              <select value={settings.lang} onChange={(e) => setStored({ ...stored, lang: e.target.value })}>
                {LANGS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>

            <NavLink className="nav-cta" to={user ? "/profile" : "/login"} onClick={() => setMenuOpen(false)}>
              <User className="icon icon-sm" />
              <span>{user ? "Profile" : "Log in"}</span>
            </NavLink>
          </div>
        </nav>
      </div>
    </header>
  );
}