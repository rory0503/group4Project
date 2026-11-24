import { METRICS } from "./helpers";

import {
  DEFAULT_TOKEN_SCALE_ID,
  getTokenScale,
  scaleMetricValue,
} from "./tokenScale";

export default function exportCsv(
  list,
  filename = "green-ai-tracker-models.csv",
  tokenScaleId = DEFAULT_TOKEN_SCALE_ID
) {
  const activeScale = getTokenScale(tokenScaleId);

  const head = [
    "Rank",
    "Model",
    "Company",
    "Release year",
    `Water (${METRICS.water.unit} ${activeScale.unitSuffix})`,
    `CO2 (${METRICS.co2.unit} ${activeScale.unitSuffix})`,
    `Energy (${METRICS.energy.unit} ${activeScale.unitSuffix})`,
    "Score (/12)",
  ];

  const rows = list.map((m) => [
    m.rank ?? "",
    m.name,
    m.company,
    m.release ?? "",

    scaleMetricValue(m.water, activeScale.multiplier) ?? "",
    scaleMetricValue(m.co2, activeScale.multiplier) ?? "",
    scaleMetricValue(m.energy, activeScale.multiplier) ?? "",

    m.score,
  ]);

  const csv = [head, ...rows]
    .map((row) =>
      row
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );

  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: filename,
  });

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}