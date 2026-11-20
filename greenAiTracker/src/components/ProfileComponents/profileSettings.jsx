
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChartNoAxesColumn,
  CircleUserRound,
  Clock,
  Languages,
  Settings as SettingsIcon,
  SunMoon,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import useLocalStorage from "../../hooks/useLocalStorage";
import {
  useTranslation,
  LANGUAGES,
  T,
  useTranslatedText,
} from "../../context/TranslationContext";

const METRICS = [
  { value: "water", label: "Water (Litres)" },
  { value: "energy", label: "Energy (kWh)" },
  { value: "co2", label: "CO₂ (kg)" },
];

const TIME_RANGES = [
  { value: "all", label: "2020 – 2030" },
  { value: "last5", label: "Last 5 years" },
  { value: "proj", label: "Projection only" },
];

const LANGUAGE_OPTIONS = LANGUAGES.map(([value, label]) => ({
  value,
  label,
}));

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function SettingRow({ icon, title, description, children }) {
  return (
    <div className="settings-row">
      <span
        className="stat-icon settings-row__icon"
        aria-hidden="true"
      >
        {icon}
      </span>

      <div className="settings-row__text">
        <p className="settings-row__title">
          <T>{title}</T>
        </p>

        <p className="settings-row__description">
          <T>{description}</T>
        </p>
      </div>

      <div className="settings-row__control">
        {children}
      </div>
    </div>
  );
}

function SettingSelect({ label, value, options, onChange }) {
  const translatedLabel = useTranslatedText(label);

  return (
    <select
      className="select"
      aria-label={translatedLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          <T>{option.label}</T>
        </option>
      ))}
    </select>
  );
}

function Settings() {
  const [prefs, setPrefs] = useLocalStorage(
    "profile-settings",
    {
      metric: "water",
      range: "all",
      lang: "en",
    }
  );

  const { remember: rememberMe, setRemember } = useAuth();

  // Use the same language state as the Header selector.
  const { lang, setLanguage } = useTranslation();

  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === "dark"
      ? "dark"
      : "light"
  );

  const [saved, setSaved] = useState(false);
  const timer = useRef(null);

  const rememberMeLabel = useTranslatedText("Remember me");

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  function flashSaved() {
    setSaved(true);
    clearTimeout(timer.current);

    timer.current = setTimeout(
      () => setSaved(false),
      2000
    );
  }

  function update(key, value) {
    setPrefs({
      ...prefs,
      [key]: value,
    });

    flashSaved();
  }

  function changeLanguage(value) {
    setLanguage(value);
    flashSaved();
  }

  function changeTheme(value) {
    setTheme(value);
    document.documentElement.dataset.theme = value;

    try {
      const all = JSON.parse(
        localStorage.getItem("gat-settings") || "{}"
      );

      localStorage.setItem(
        "gat-settings",
        JSON.stringify({
          ...all,
          theme: value,
        })
      );
    } catch {
      // The theme still changes for this visit.
    }

    flashSaved();
  }

  return (
    <section
      className="card settings"
      aria-labelledby="settings-title"
    >
      <div className="card-head">
        <div>
          <h2 className="card-title" id="settings-title">
            <SettingsIcon className="icon" />
            <T>Settings</T>
          </h2>

          <p className="card-sub">
            <T>Choose how the site looks and what you see first.</T>
          </p>
        </div>

        <span
          className={`saved-note${saved ? " saved-note--show" : ""}`}
          role="status"
        >
          {saved && (
            <>
              <Check className="icon icon-sm" />
              <T>Saved</T>
            </>
          )}
        </span>
      </div>

      <SettingRow
        icon={<ChartNoAxesColumn className="icon icon-sm" />}
        title="Default Metric"
        description="Choose your preferred metric for graphs"
      >
        <SettingSelect
          label="Default metric"
          value={prefs.metric}
          options={METRICS}
          onChange={(value) => update("metric", value)}
        />
      </SettingRow>

      <SettingRow
        icon={<Clock className="icon icon-sm" />}
        title="Default Time Range"
        description="Set the default time range for data views"
      >
        <SettingSelect
          label="Default time range"
          value={prefs.range}
          options={TIME_RANGES}
          onChange={(value) => update("range", value)}
        />
      </SettingRow>

      <SettingRow
        icon={<Languages className="icon icon-sm" />}
        title="Language"
        description="Choose your preferred language"
      >
        <SettingSelect
          label="Language"
          value={lang}
          options={LANGUAGE_OPTIONS}
          onChange={changeLanguage}
        />
      </SettingRow>

      <SettingRow
        icon={<SunMoon className="icon icon-sm" />}
        title="Theme"
        description="Choose your preferred colour scheme"
      >
        <SettingSelect
          label="Theme"
          value={theme}
          options={THEMES}
          onChange={changeTheme}
        />
      </SettingRow>

      <SettingRow
        icon={<CircleUserRound className="icon icon-sm" />}
        title="Remember Me"
        description="Account remains logged in on this device"
      >
        <button
          type="button"
          role="switch"
          className="switch"
          aria-checked={Boolean(rememberMe)}
          aria-label={rememberMeLabel}
          onClick={() => setRemember(!rememberMe)}
        />
      </SettingRow>
    </section>
  );
}

export default Settings;

