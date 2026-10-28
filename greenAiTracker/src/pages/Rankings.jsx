import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, Download, ArrowRight, X } from "lucide-react";
import useLocalStorage from "../hooks/useLocalStorage";
import useModels from "../hooks/useModels";
import { byId, sortModels } from "../lib/helpers";
import exportCsv from "../lib/exportCsv";
import ModelPicker from "../components/ModelPicker";
import ModelTable from "../components/ModelTable";
import CycleModelTable from "../components/RankingsComponents/cycleRankings.jsx"


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

  // Shows top 20 for cateogory
  // as there is only 12 in the mock data that is all that shows
  const ids = new Set(sortModels(models, "score", "desc").slice(0, 20).map((m) => m.id));
  if (model) ids.add(model.id);
  if (secondId) ids.add(secondId);
  const tableModels = sortModels(models.filter((m) => ids.has(m.id)), sort.key, sort.dir);

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
                {/* Search Bar for Model*/}
                <ModelPicker
                  models={models}
                  value={model.id}
                  onChange={setPrimaryId}
                  label="Model"
                  exclude={secondId ? [secondId] : []}
                />
                {/* Extort Button */}
                <button className="btn btn-outline" type="button" onClick={() => exportCsv(models)}>
                  <Download className="icon icon-sm" />Export data
                </button>
                {/* cycle Button */}
              </div>

              <ModelTable
                models={tableModels}
                selectedId={model.id}
                sort={sort}
                onSort={handleSort}
                showRank
              />
            </section>
          </>
        )}
      </div>
    </main>
  );
}