import { useId } from "react";
import { Droplet, Zap, Cloud } from "lucide-react";
import { METRICS } from "../lib/helpers";
import { T } from "../context/TranslationContext";

const ICONS = {
  droplet: Droplet,
  zap: Zap,
  cloud: Cloud,
};

export default function MetricPicker({ value, onChange }) {
  const name = useId();

  return (
    <fieldset
      className="metric-picker"
      style={{ border: 0, margin: 0, padding: 0 }}
    >
      <legend>
        <T>Metric</T>
      </legend>

      <p className="card-sub">
        <T>Choose one metric to plot</T>
      </p>

      {Object.values(METRICS).map((m) => {
        const Icon = ICONS[m.icon];

        return (
          <label
            key={m.key}
            className="metric-option"
            style={{ "--c": `var(${m.color})` }}
          >
            <input
              type="radio"
              name={name}
              value={m.key}
              checked={value === m.key}
              onChange={() => onChange(m.key)}
            />

            <span className="opt">
              <span className="radio" />

              <span className="opt-text">
                <strong>
                  <T>{m.label}</T>
                </strong>

                <span>
                  <T>{m.long}</T>
                </span>
              </span>

              <span className="opt-icon">
                <Icon className="icon" />
              </span>
            </span>
          </label>
        );
      })}

      <p className="metric-note">
        <T>The chart shows the selected metric only.</T>
      </p>
    </fieldset>
  );
}
