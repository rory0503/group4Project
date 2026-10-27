import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Avatar from "./Avatar";
import { fmtInt } from "../lib/helpers";

const COLS = [
  { key: "name", label: "Model", right: false },
  { key: "water", label: "Water", unit: "Litres", right: true },
  { key: "co2", label: "CO₂", unit: "Metric tons", right: true },
  { key: "energy", label: "Energy", unit: "GWh", right: true },
  { key: "score", label: "Score", unit: "out of 30", right: true },
];

function Th({ col, sort, onSort }) {
  const active = sort.key === col.key;
  const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : undefined;

  return (
    <th className={col.right ? "r" : ""} scope="col" aria-sort={ariaSort}>
      <button className="sort-btn" type="button" onClick={() => onSort(col.key)}>
        {col.right && <Icon className="icon icon-sm" />}
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
  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">Models by sustainability score</caption>
        <thead>
          <tr>
            {showRank && <Th col={{ key: "rank", label: "Rank", right: false }} sort={sort} onSort={onSort} />}
            {COLS.map((col) => (
              <Th key={col.key} col={col} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody>
          {models.length === 0 && (
            <tr>
              <td colSpan={COLS.length + (showRank ? 1 : 0)}>No models to show.</td>
            </tr>
          )}

          {models.map((m) => {
            const selected = m.id === selectedId;
            return (
              <tr key={m.id} className={`row${selected ? " is-selected" : ""}`}>
                {showRank && <td className="rank">{m.rank}</td>}
                <td>
                  <div className="model-cell">
                    <Avatar company={m.company} />
                    <div>
                      <div className="name">
                        {m.name} {selected && <span className="selected-tag">Selected</span>}
                      </div>
                      <div className="company">{m.company}</div>
                    </div>
                  </div>
                </td>
                <td className="r">{fmtInt(m.water)}</td>
                <td className="r">{fmtInt(m.co2)}</td>
                <td className="r">{fmtInt(m.energy)}</td>
                <td className="r">
                  <span className="score">{m.score}<small>/30</small></span>
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