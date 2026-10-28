import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Avatar from "./Avatar";
import { fmtInt } from "../lib/helpers";

// Column definitions: key = field to sort by, label = heading, unit = small text under heading, right = right-align
const COLS = [
  { key: "name", label: "Model", right: false },
  { key: "water", label: "Water", unit: "Litres", right: true },
  { key: "co2", label: "CO₂", unit: "Metric tons", right: true },
  { key: "energy", label: "Energy", unit: "GWh", right: true },
  { key: "score", label: "Score", unit: "out of 30", right: true },
];

// One clickable column heading
function Th({ col, sort, onSort }) {
  const active = sort.key === col.key;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined;

  return (
    <th className={col.right ? "r" : ""} scope="col" aria-sort={ariaSort}>
      {/* Button that triggers sorting by this column */}
      <button className="sort-btn" type="button" onClick={() => onSort(col.key)}>
        {col.right && <Icon className="icon icon-sm" />}
        {/* Heading text and optional unit */}
        <span>
          {col.label}
          {col.unit && <span className="unit">{col.unit}</span>}
        </span>
        {!col.right && <Icon className="icon icon-sm" />}
      </button>
    </th>
  );
}

export default function ModelTable({ models, selectedId, sort, onSort, showRank = false }) {
  // Copy of the list with the selected model moved to the top (ranks are not changed)
  const orderedModels = [...models].sort(
    (a, b) => (b.id === selectedId) - (a.id === selectedId)
  );

  return (
    // Wrapper around the table (handles scrolling/styling)
    <div className="table-wrap">
      <table className="data-table">
        {/* Hidden label for screen readers */}
        <caption className="sr-only">Models by sustainability score</caption>
        <thead>
          <tr>
            {/* Optional Rank heading */}
            {showRank && <Th col={{ key: "rank", label: "Rank", right: false }} sort={sort} onSort={onSort} />}
            {/* One heading per column */}
            {COLS.map((col) => (
              <Th key={col.key} col={col} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Shown when there are no models */}
          {orderedModels.length === 0 && (
            <tr>
              <td colSpan={COLS.length + (showRank ? 1 : 0)}>No models to show.</td>
            </tr>
          )}

          {orderedModels.map((m) => {
            const selected = m.id === selectedId;
            return (
              // One row per model, highlighted if selected
              <tr key={m.id} className={`row${selected ? " is-selected" : ""}`}>
                {/* Model's real rank */}
                {showRank && <td className="rank">{m.rank}</td>}
                <td>
                  {/* Logo + name/company layout */}
                  <div className="model-cell">
                    <Avatar company={m.company} />
                    <div>
                      {/* Model name with "Selected" tag if chosen */}
                      <div className="name">
                        {m.name} {selected && <span className="selected-tag">Selected</span>}
                      </div>
                      {/* Company name */}
                      <div className="company">{m.company}</div>
                    </div>
                  </div>
                </td>
                {/* Number columns */}
                <td className="r">{fmtInt(m.water)}</td>
                <td className="r">{fmtInt(m.co2)}</td>
                <td className="r">{fmtInt(m.energy)}</td>
                <td className="r">
                  {/* Score text, e.g. 24/30 */}
                  <span className="score">{m.score}<small>/30</small></span>
                  {/* Score bar, width = score out of 30 */}
                  <span className="score-bar" aria-hidden="true">
                    <i style={{ width: `${(m.score / 30) * 100}%` }} />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}