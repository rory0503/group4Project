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

  const averages = {
  water:
    models.length > 0
      ? models.reduce((sum, m) => sum + m.water, 0) / models.length
      : 0,

  co2:
    models.length > 0
      ? models.reduce((sum, m) => sum + m.co2, 0) / models.length
      : 0,

  energy:
    models.length > 0
      ? models.reduce((sum, m) => sum + m.energy, 0) / models.length
      : 0,
  };
  const orderedModels = [...models].sort(
    (a, b) => (b.id === selectedId) - (a.id === selectedId)
  );
  const lowestValues = {
    water: Math.min(...models.map((m) => m.water)),
    co2: Math.min(...models.map((m) => m.co2)),
    energy: Math.min(...models.map((m) => m.energy)),
  };
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
                {m.water === lowestValues.water && (
                  <span className="lowest-impact-badge">
                    Lowest
                  </span>
                )}
                <span
    className={`average-indicator ${
      m.water < averages.water
        ? "below-average"
        : m.water > averages.water
        ? "above-average"
        : "average-value"
    }`}
  >
    {m.water < averages.water
      ? "↓ Below average"
      : m.water > averages.water
      ? "↑ Above average"
      : "Average"}
  </span>
              </td>

                <td className="r">
                {formatScaledMetric(co2)}
                {m.co2 === lowestValues.co2 && (
                  <span className="lowest-impact-badge">
                    Lowest
                  </span>
                )}
              </td>

                <td className="r">
              {formatScaledMetric(energy)}
              {m.energy === lowestValues.energy && (
                <span className="lowest-impact-badge">
                  Lowest
                </span>
              )}
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