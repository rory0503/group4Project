import { useId } from "react";
import { Droplet, Zap, Cloud } from "lucide-react";
import { METRICS } from "../lib/helpers";

const ICONS = { droplet: Droplet, zap: Zap, cloud: Cloud };

export default function MetricPicker({ value, onChange }) {
  const name = useId();

  return (
    <fieldset className="metric-picker" style={{ border: 0, margin: 0, padding: 0 }}>
      <legend>Metric</legend>
      <p className="card-sub">Choose one metric to plot</p>

      {Object.values(METRICS).map((m) => {
        const Icon = ICONS[m.icon];
        return (
          <label key={m.key} className="metric-option" style={{ "--c": `var(${m.color})` }}>
            <input
              type="radio"
              name={name}
              value={m.key}
              checked={value === m.key}
              onChange={() => onChange(m.key)}
            />
            <span className="opt">
              <span className="radio"></span>
              <span className="opt-text">
                <strong>{m.label}</strong>
                <span>{m.long}</span>
              </span>
              <span className="opt-icon"><Icon className="icon" /></span>
            </span>
          </label>
        );
      })}

      <p className="metric-note">The chart shows the selected metric only.</p>
    </fieldset>
  );
}