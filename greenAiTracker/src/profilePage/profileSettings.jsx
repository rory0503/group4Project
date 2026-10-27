import { useState } from "react";

const METRICS = ["Water (Litres)", "Energy (kWh)", "CO2 (kg)"];
const TIME_RANGES = ["Last 30 Days", "Last Year", "Last 5 Years", "All Time"];
const LANGUAGES = ["English (EN)", "Cymraeg (CY)", "Français (FR)", "Deutsch (DE)"];
const THEMES = ["Light", "Dark"];



function SettingRow({ icon, title, description, children }) {
    return (
        <div className="settings-row">
            <div className="settings-row__icon">{icon}</div>
            <div className="settings-row__text">
                <p className="settings-row__title">{title}</p>
                <p className="settings-row__description">{description}</p>
            </div>
            <div className="settings-row__control">{children}</div>
        </div>
    );
}

function SettingSelect({ label, value, options, onChange }) {
    return (
        <select
            className="settings-select"
            aria-label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}

function GearIcon({ size = 22 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20.017 14.669L23 13.564l-.012-3.208-2.996-1.085a8.455 8.455 0 0 0-.437-1.05l1.329-2.893-2.277-2.26-2.886 1.351a8.396 8.396 0 0 0-1.052-.436L13.564 1l-3.208.012-1.085 2.996a8.485 8.485 0 0 0-1.05.437L5.328 3.116l-2.26 2.276L4.419 8.28a8.378 8.378 0 0 0-.436 1.052L1 10.436l.012 3.208 2.996 1.085a8.46 8.46 0 0 0 .437 1.05l-1.329 2.893 2.276 2.26 2.887-1.351a8.383 8.383 0 0 0 1.052.436L10.436 23l3.208-.012 1.085-2.996a8.478 8.478 0 0 0 1.05-.437l2.893 1.329 2.26-2.276-1.351-2.887a8.382 8.382 0 0 0 .436-1.052zm-.287 3.73l-1.275 1.285-2.694-1.238-.429.215a7.612 7.612 0 0 1-.928.385l-.452.156-1.01 2.789-1.81.007-1.03-2.779-.456-.151a7.394 7.394 0 0 1-.926-.385l-.43-.21-2.688 1.257-1.286-1.275 1.239-2.695-.216-.43a7.551 7.551 0 0 1-.386-.926l-.155-.452-2.79-1.01-.005-1.81 2.777-1.03.152-.456a7.46 7.46 0 0 1 .384-.927l.212-.43L4.27 5.601l1.275-1.285 2.694 1.238.429-.215a7.612 7.612 0 0 1 .928-.385l.452-.156 1.01-2.789 1.81-.007 1.03 2.779.456.151a7.35 7.35 0 0 1 .925.385l.43.211L18.4 4.27l1.285 1.275-1.239 2.695.216.43a7.551 7.551 0 0 1 .386.926l.155.452 2.79 1.01.005 1.81-2.777 1.03-.152.456a7.46 7.46 0 0 1-.384.927l-.212.43zM12 7.2a4.8 4.8 0 1 0 4.8 4.8A4.8 4.8 0 0 0 12 7.2zm0 8.6a3.8 3.8 0 1 1 3.8-3.8 3.804 3.804 0 0 1-3.8 3.8z" /><path fill="none" d="M0 0h24v24H0z" /></svg>
    )
}

function TimeIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 7V12L10.5 14.5M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#000000" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" />
        </svg>)
}

function LanguageIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:sketch="http://www.bohemiancoding.com/sketch/ns">

            <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
                <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-204.000000, -671.000000)" fill="#000000">
                    <path d="M231.596,694.829 C229.681,694.192 227.622,693.716 225.455,693.408 C225.75,691.675 225.907,689.859 225.957,688 L233.962,688 C233.783,690.521 232.936,692.854 231.596,694.829 L231.596,694.829 Z M223.434,700.559 C224.1,698.95 224.645,697.211 225.064,695.379 C226.862,695.645 228.586,696.038 230.219,696.554 C228.415,698.477 226.073,699.892 223.434,700.559 L223.434,700.559 Z M220.971,700.951 C220.649,700.974 220.328,701 220,701 C219.672,701 219.352,700.974 219.029,700.951 C218.178,699.179 217.489,697.207 216.979,695.114 C217.973,695.027 218.98,694.976 220,694.976 C221.02,694.976 222.027,695.027 223.022,695.114 C222.511,697.207 221.822,699.179 220.971,700.951 L220.971,700.951 Z M209.781,696.554 C211.414,696.038 213.138,695.645 214.936,695.379 C215.355,697.211 215.9,698.95 216.566,700.559 C213.927,699.892 211.586,698.477 209.781,696.554 L209.781,696.554 Z M208.404,694.829 C207.064,692.854 206.217,690.521 206.038,688 L214.043,688 C214.093,689.859 214.25,691.675 214.545,693.408 C212.378,693.716 210.319,694.192 208.404,694.829 L208.404,694.829 Z M208.404,679.171 C210.319,679.808 212.378,680.285 214.545,680.592 C214.25,682.325 214.093,684.141 214.043,686 L206.038,686 C206.217,683.479 207.064,681.146 208.404,679.171 L208.404,679.171 Z M216.566,673.441 C215.9,675.05 215.355,676.789 214.936,678.621 C213.138,678.356 211.414,677.962 209.781,677.446 C211.586,675.523 213.927,674.108 216.566,673.441 L216.566,673.441 Z M219.029,673.049 C219.352,673.027 219.672,673 220,673 C220.328,673 220.649,673.027 220.971,673.049 C221.822,674.821 222.511,676.794 223.022,678.886 C222.027,678.973 221.02,679.024 220,679.024 C218.98,679.024 217.973,678.973 216.979,678.886 C217.489,676.794 218.178,674.821 219.029,673.049 L219.029,673.049 Z M223.954,688 C223.9,689.761 223.74,691.493 223.439,693.156 C222.313,693.058 221.168,693 220,693 C218.832,693 217.687,693.058 216.562,693.156 C216.26,691.493 216.1,689.761 216.047,688 L223.954,688 L223.954,688 Z M216.047,686 C216.1,684.239 216.26,682.507 216.562,680.844 C217.687,680.942 218.832,681 220,681 C221.168,681 222.313,680.942 223.438,680.844 C223.74,682.507 223.9,684.239 223.954,686 L216.047,686 L216.047,686 Z M230.219,677.446 C228.586,677.962 226.862,678.356 225.064,678.621 C224.645,676.789 224.1,675.05 223.434,673.441 C226.073,674.108 228.415,675.523 230.219,677.446 L230.219,677.446 Z M231.596,679.171 C232.936,681.146 233.783,683.479 233.962,686 L225.957,686 C225.907,684.141 225.75,682.325 225.455,680.592 C227.622,680.285 229.681,679.808 231.596,679.171 L231.596,679.171 Z M220,671 C211.164,671 204,678.163 204,687 C204,695.837 211.164,703 220,703 C228.836,703 236,695.837 236,687 C236,678.163 228.836,671 220,671 L220,671 Z" id="globe" sketch:type="MSShapeGroup">

                    </path>
                </g>
            </g>
        </svg>)
}

function ThemeIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 8.00002C0 4.75562 1.93132 1.9623 4.70701 0.707031L5.65436 1.65438C5.2352 2.51383 5 3.47946 5 4.50002C5 8.08987 7.91015 11 11.5 11C12.5206 11 13.4862 10.7648 14.3456 10.3457L15.293 11.293C14.0377 14.0687 11.2444 16 8 16C3.58172 16 0 12.4183 0 8.00002Z" fill="#000000" />
            <path d="M11.5 7.00003L9 4.50003L11.5 2.00003L14 4.50003L11.5 7.00003Z" fill="#000000" />
        </svg>
    )
}

function ProfileIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 12C22 6.49 17.51 2 12 2C6.49 2 2 6.49 2 12C2 14.9 3.25 17.51 5.23 19.34C5.23 19.35 5.23 19.35 5.22 19.36C5.32 19.46 5.44 19.54 5.54 19.63C5.6 19.68 5.65 19.73 5.71 19.77C5.89 19.92 6.09 20.06 6.28 20.2C6.35 20.25 6.41 20.29 6.48 20.34C6.67 20.47 6.87 20.59 7.08 20.7C7.15 20.74 7.23 20.79 7.3 20.83C7.5 20.94 7.71 21.04 7.93 21.13C8.01 21.17 8.09 21.21 8.17 21.24C8.39 21.33 8.61 21.41 8.83 21.48C8.91 21.51 8.99 21.54 9.07 21.56C9.31 21.63 9.55 21.69 9.79 21.75C9.86 21.77 9.93 21.79 10.01 21.8C10.29 21.86 10.57 21.9 10.86 21.93C10.9 21.93 10.94 21.94 10.98 21.95C11.32 21.98 11.66 22 12 22C12.34 22 12.68 21.98 13.01 21.95C13.05 21.95 13.09 21.94 13.13 21.93C13.42 21.9 13.7 21.86 13.98 21.8C14.05 21.79 14.12 21.76 14.2 21.75C14.44 21.69 14.69 21.64 14.92 21.56C15 21.53 15.08 21.5 15.16 21.48C15.38 21.4 15.61 21.33 15.82 21.24C15.9 21.21 15.98 21.17 16.06 21.13C16.27 21.04 16.48 20.94 16.69 20.83C16.77 20.79 16.84 20.74 16.91 20.7C17.11 20.58 17.31 20.47 17.51 20.34C17.58 20.3 17.64 20.25 17.71 20.2C17.91 20.06 18.1 19.92 18.28 19.77C18.34 19.72 18.39 19.67 18.45 19.63C18.56 19.54 18.67 19.45 18.77 19.36C18.77 19.35 18.77 19.35 18.76 19.34C20.75 17.51 22 14.9 22 12ZM16.94 16.97C14.23 15.15 9.79 15.15 7.06 16.97C6.62 17.26 6.26 17.6 5.96 17.97C4.44 16.43 3.5 14.32 3.5 12C3.5 7.31 7.31 3.5 12 3.5C16.69 3.5 20.5 7.31 20.5 12C20.5 14.32 19.56 16.43 18.04 17.97C17.75 17.6 17.38 17.26 16.94 16.97Z" fill="#292D32" />
            <path d="M12 6.92969C9.93 6.92969 8.25 8.60969 8.25 10.6797C8.25 12.7097 9.84 14.3597 11.95 14.4197C11.98 14.4197 12.02 14.4197 12.04 14.4197C12.06 14.4197 12.09 14.4197 12.11 14.4197C12.12 14.4197 12.13 14.4197 12.13 14.4197C14.15 14.3497 15.74 12.7097 15.75 10.6797C15.75 8.60969 14.07 6.92969 12 6.92969Z" fill="#000000" />
        </svg>
    )
}

function Settings({ user }) {
    const saved = user?.settings ?? {};

    const [metric, setMetric] = useState(saved.metric ?? "Water (Litres)");
    const [timeRange, setTimeRange] = useState(saved.timeRange ?? "Last 5 Years");
    const [language, setLanguage] = useState(saved.language ?? "English (EN)");
    const [theme, setTheme] = useState(saved.theme ?? "Light");
    const [rememberMe, setRememberMe] = useState(saved.rememberMe ?? true);

    return (
        <section className="settings">
            <header className="settings-header">
                <GearIcon size={32} />
                <h3 className="settings-header__title">Settings</h3>
            </header>

            <SettingRow
                icon={
                    <span className="metric-icon" aria-hidden="true">
                        <span className="metric-icon__bar metric-icon__bar--tall" />
                        <span className="metric-icon__bar metric-icon__bar--mid" />
                        <span className="metric-icon__bar metric-icon__bar--short" />
                    </span>
                }
                title="Default Metric"
                description="Choose your preferred metric for graphs"
            >
                <SettingSelect label="Default metric" value={metric} options={METRICS} onChange={setMetric} />
            </SettingRow>

            <SettingRow
                icon={<TimeIcon size={32} />}
                title="Default Time Range"
                description="Set the default time range for data views"
            >
                <SettingSelect label="Default time range" value={timeRange} options={TIME_RANGES} onChange={setTimeRange} />
            </SettingRow>

            <SettingRow
                icon={<LanguageIcon size={32} />}
                title="Language"
                description="Choose your preferred language"
            >
                <SettingSelect label="Language" value={language} options={LANGUAGES} onChange={setLanguage} />
            </SettingRow>

            <SettingRow
                icon={<ThemeIcon size={32} />}
                title="Theme"
                description="Choose your preferred colour scheme"
            >
                <SettingSelect label="Theme" value={theme} options={THEMES} onChange={setTheme} />
            </SettingRow>

            <SettingRow
                icon={<ProfileIcon size={32} />}
                title="Remember Me"
                description="Account remains logged in on this device"
            >
                <button
                    type="button"
                    role="switch"
                    aria-checked={rememberMe}
                    aria-label="Remember me"
                    className={`settings-toggle ${rememberMe ? "settings-toggle--on" : ""}`}
                    onClick={() => setRememberMe((on) => !on)}
                >
                    <span className="settings-toggle__knob" />
                </button>
            </SettingRow>
        </section>
    );
}

export default Settings;