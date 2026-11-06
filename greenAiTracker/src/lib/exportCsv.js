// Downloads the given models as a CSV file the user can open in Excel.
export default function exportCsv(list, filename = "green-ai-tracker-models.csv") {
  const head = ["Rank", "Model", "Company", "Release year", "Water (L)", "CO2 (t)", "Energy (GWh)", "Score (/30)"];
  const rows = list.map((m) => [m.rank, m.name, m.company, m.release, m.water, m.co2, m.energy, m.score]);
  const csv = [head, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}