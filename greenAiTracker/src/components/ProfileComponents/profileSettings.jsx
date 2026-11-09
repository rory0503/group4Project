import { useEffect, useRef, useState } from "react";
import { Check, ChartNoAxesColumn, CircleUserRound, Clock, Languages, Settings as SettingsIcon, SunMoon } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import useLocalStorage from "../../hooks/useLocalStorage";

// Dropdown choices. "value" is what gets saved; "label" is what the user sees.
// The metric and time range values match the ones the Dashboard and Compare pages use.
const METRICS = [
  { value: "water", label: "Water (Litres)" },
  { value: "energy", label: "Energy (kWh)" },
  { value: "co2", label: "CO2 (kg)" },
];
const TIME_RANGES = [
  { value: "all", label: "2020 – 2030" },
  { value: "last5", label: "Last 5 years" },
  { value: "proj", label: "Projection only" },
];
// Only English exists so far; the others are shown but can't be picked yet
const LANGUAGES = [
  { value: "en", label: "English (EN)" },
  { value: "cy", label: "Cymraeg (CY) – coming soon", disabled: true },
  { value: "fr", label: "Français (FR) – coming soon", disabled: true },
  { value: "de", label: "Deutsch (DE) – coming soon", disabled: true },
];
const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

// One row: icon, title + description on the left, the control (dropdown or switch) on the right
function SettingRow({ icon, title, description, children }) {
  return (
    <div className="settings-row">
      <span className="stat-icon settings-row__icon" aria-hidden="true">{icon}</span>
      <div className="settings-row__text">
        <p className="settings-row__title">{title}</p>
        <p className="settings-row__description">{description}</p>
      </div>
      <div className="settings-row__control">{children}</div>
    </div>
  );
}

// A dropdown that uses the site's shared .select style
function SettingSelect({ label, value, options, onChange }) {
  return (
    <select className="select" aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function Settings() {
  // Saved in this browser (key "gat-profile-settings"). The Dashboard and Compare pages can read the same key.
  const [prefs, setPrefs] = useLocalStorage("profile-settings", { metric: "water", range: "all", lang: "en" });
  const { remember: rememberMe, setRemember } = useAuth();

  // The theme is whatever the site is showing right now
  const [theme, setTheme] = useState(() => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"));

  // Shows "Saved" for 2 seconds after any change
  const [saved, setSaved] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  function flashSaved() {
    setSaved(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2000);
  }

  function update(key, value) {
    setPrefs({ ...prefs, [key]: value });
    flashSaved();
  }

  // Changes the whole site's theme straight away and remembers it
  function changeTheme(value) {
    setTheme(value);
    document.documentElement.dataset.theme = value;
    try {
      const all = JSON.parse(localStorage.getItem("gat-settings") || "{}");
      localStorage.setItem("gat-settings", JSON.stringify({ ...all, theme: value }));
    } catch {
      /* storage unavailable: the theme still changes for this visit */
    }
    flashSaved();
  }

  return (
    <section className="card settings" aria-labelledby="settings-title">
      <div className="card-head">
        <div>
          <h2 className="card-title" id="settings-title">
            <SettingsIcon className="icon" />
            Settings
          </h2>
          <p className="card-sub">Choose how the site looks and what you see first.</p>
        </div>
        {/* Confirms a change was saved */}
        <span className={`saved-note${saved ? " saved-note--show" : ""}`} role="status">
          {saved && (
            <>
              <Check className="icon icon-sm" />
              Saved
            </>
          )}
        </span>
      </div>

      <SettingRow
        icon={<ChartNoAxesColumn className="icon icon-sm" />}
        title="Default Metric"
        description="Choose your preferred metric for graphs"
      >
        <SettingSelect label="Default metric" value={prefs.metric} options={METRICS} onChange={(v) => update("metric", v)} />
      </SettingRow>

      <SettingRow
        icon={<Clock className="icon icon-sm" />}
        title="Default Time Range"
        description="Set the default time range for data views"
      >
        <SettingSelect label="Default time range" value={prefs.range} options={TIME_RANGES} onChange={(v) => update("range", v)} />
      </SettingRow>

      <SettingRow
        icon={<Languages className="icon icon-sm" />}
        title="Language"
        description="Choose your preferred language"
      >
        <SettingSelect label="Language" value={prefs.lang} options={LANGUAGES} onChange={(v) => update("lang", v)} />
      </SettingRow>

      <SettingRow
        icon={<SunMoon className="icon icon-sm" />}
        title="Theme"
        description="Choose your preferred colour scheme"
      >
        <SettingSelect label="Theme" value={theme} options={THEMES} onChange={changeTheme} />
      </SettingRow>

      <SettingRow
        icon={<CircleUserRound className="icon icon-sm" />}
        title="Remember Me"
        description="Account remains logged in on this device"
      >
        {/* Uses the site's shared .switch style */}
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={Boolean(rememberMe)}
          aria-label="Remember me"
          onClick={() => setRemember(!rememberMe)}
        />
      </SettingRow>
    </section>
  );
}

export default Settings;