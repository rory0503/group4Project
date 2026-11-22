import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Avatar from "./Avatar";
import { METRICS } from "../lib/helpers";

import {
  DEFAULT_TOKEN_SCALE_ID,
  formatScaledMetric,
  getTokenScale,
  scaleMetricValue,
} from "../lib/tokenScale";

const COLS = [
  { key: "name", label: "Model", right: false },
  { key: "water", label: "Water", metric: "water", right: true },
  { key: "co2", label: "CO₂", metric: "co2", right: true },
  { key: "energy", label: "Energy", metric: "energy", right: true },
  { key: "score", label: "Score", unit: "out of 12", right: true },
];

function Th({ col, sort, onSort, activeScale }) {
  const active = sort.key === col.key;
  const Icon = active
    ? sort.dir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  const ariaSort = active
    ? sort.dir === "asc"
      ? "ascending"
      : "descending"
    : undefined;

  return (
    <th
      className={col.right ? "r" : ""}
      scope="col"
      aria-sort={ariaSort}
    >
      <button
        className="sort-btn"
        type="button"
        onClick={() => onSort(col.key)}
      >
        {col.right && <Icon className="icon icon-sm" />}

        <span>
          {col.label}

          {col.metric && (
            <span className="unit">
              {METRICS[col.metric].unit} {activeScale.unitSuffix}
            </span>
          )}

          {col.unit && (
            <span className="unit">{col.unit}</span>
          )}
        </span>

        {!col.right && <Icon className="icon icon-sm" />}
      </button>
    </th>
  );
}

export default function ModelTable({
  models,
  selectedId,
  sort,
  onSort,
  showRank = false,
  tokenScaleId = DEFAULT_TOKEN_SCALE_ID,
}) {
  const activeScale = getTokenScale(tokenScaleId);

  const orderedModels = [...models].sort(
    (a, b) => (b.id === selectedId) - (a.id === selectedId)
  );

  return (
    <div className="table-wrap">
      <table className="data-table">
        <caption className="sr-only">
          Models by sustainability score. Environmental measurements are
          shown per {activeScale.shortLabel}.
        </caption>

        <thead>
          <tr>
            {showRank && (
              <Th
                col={{ key: "rank", label: "Rank", right: false }}
                sort={sort}
                onSort={onSort}
                activeScale={activeScale}
              />
            )}

            {COLS.map((col) => (
              <Th
                key={col.key}
                col={col}
                sort={sort}
                onSort={onSort}
                activeScale={activeScale}
              />
            ))}
          </tr>
        </thead>

        <tbody>
          {orderedModels.length === 0 && (
            <tr>
              <td colSpan={COLS.length + (showRank ? 1 : 0)}>
                No models to show.
              </td>
            </tr>
          )}

          {orderedModels.map((m) => {
            const selected = m.id === selectedId;

            const water = scaleMetricValue(
              m.water,
              activeScale.multiplier
            );

            const co2 = scaleMetricValue(
              m.co2,
              activeScale.multiplier
            );

            const energy = scaleMetricValue(
              m.energy,
              activeScale.multiplier
            );

            return (
              <tr
                key={m.id}
                className={`row${selected ? " is-selected" : ""}`}
              >
                {showRank && (
                  <td className="rank">{m.rank}</td>
                )}

                <td>
                  <div className="model-cell">
                    <Avatar company={m.company} />

                    <div>
                      <div className="name">
                        {m.name}{" "}
                        {selected && (
                          <span className="selected-tag">
                            Selected
                          </span>
                        )}
                      </div>

                      <div className="company">{m.company}</div>
                    </div>
                  </div>
                </td>

                <td className="r">
                  {formatScaledMetric(water)}
                </td>

                <td className="r">
                  {formatScaledMetric(co2)}
                </td>

                <td className="r">
                  {formatScaledMetric(energy)}
                </td>

                <td className="r">
                  <span className="score">
                    {m.score}<small>/12</small>
                  </span>

                  <span className="score-bar" aria-hidden="true">
                    <i style={{ width: `${(m.score / 12) * 100}%` }} />
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