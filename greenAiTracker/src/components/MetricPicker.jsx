import { useId } from "react";
import { Droplet, Zap, Cloud, Info } from "lucide-react";
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
              <strong>
                {m.label}
                <span
                  className="metric-info"
                  title={
                    m.key === "water"
                      ? "Estimated water consumption associated with processing a single AI request. Values are estimates and can vary depending on infrastructure and cooling systems."
                      : m.key === "energy"
                      ? "Estimated electricity consumed when processing a single AI request. Lower values indicate less estimated energy consumption."
                      : "Estimated carbon dioxide equivalent emissions associated with processing a single AI request. This estimate can vary depending on electricity sources and infrastructure."
                  }
                  aria-label={`Information about ${m.label}`}
                  role="img"
                >
                  <Info size={14} />
                </span>
              </strong>
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