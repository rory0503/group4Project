import { useState } from "react";
import { Info, Download, ArrowRight, X } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import useModels from "../hooks/useModels";
import { byId, sortModels } from "../lib/helpers";
import exportCsv from "../lib/exportCsv";
import ModelPicker from "../components/ModelPicker";
// ModelTable import removed: the paginated file imports it itself
import CycleModelTable from "../components/RankingsComponents/cycleRankings.jsx";

export default function Rankings() {
  const { models, loading, error } = useModels();
  const [primaryId, setPrimaryId] = useLocalStorage("selected", "");
  const [secondId, setSecondId] = useState(null);
  const [metric, setMetric] = useState("water");
  const [sort, setSort] = useState({ key: "score", dir: "desc" });

  const model = byId(models, primaryId) ?? models[0];

  // Clicking the same heading flips the direction; a new heading starts ascending
  // (the score starts highest first).
  function handleSort(key) {
    setSort((s) => ({
      key,
      dir: s.key === key ? (s.dir === "asc" ? "desc" : "asc") : key === "score" ? "desc" : "asc",
    }));
  }

  // Full list of models in the current sort order.
  // The pagination component splits this into pages of 20.
  const tableModels = sortModels(models, sort.key, sort.dir);

  return (
    <main id="main" className="page">
      <div className="container">
        <div className="page-head">
          <div>
            <h1>AI Model Expenditure Ranking</h1>
            <p>Every tracked model ranked by sustainability score.</p>
          </div>
        </div>
        {model && (
          <>
            <section className="section" aria-labelledby="table-title">
              <div className="section-head">
                {/* Search bar for model */}
                <ModelPicker
                  models={models}
                  value={model.id}
                  onChange={setPrimaryId}
                  label="Model"
                  exclude={secondId ? [secondId] : []}
                />
                {/* Export button */}
                <button className="btn btn-outline" type="button" onClick={() => exportCsv(models)}>
                  <Download className="icon icon-sm" />Export data
                </button>
              </div>

              {/* Table with page controls underneath. The key sends it back to page 1 when the sort changes */}
              <CycleModelTable
                key={`${sort.key}-${sort.dir}`}
                models={tableModels}
                selectedId={model.id}
                sort={sort}
                onSort={handleSort}
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}