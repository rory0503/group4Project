import { useEffect, useState } from "react";

// Gets every model from the backend and turns it into the shape the pages use.
// Still returns { models, loading, error } so nothing else has to change.
const API = "/api/v1";

export default function useModels() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false; // stops updates if the page is closed before the data arrives

    loadModels()
      .then((list) => { if (!cancelled) setModels(list); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  return { models, loading, error };
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} returned ${res.status}`);
  return res.json();
}

// One request for the providers, then one per provider for its models (all at the same time)
async function loadModels() {
  const providers = await getJson(`${API}/providers/`);

  const perProvider = await Promise.all(
    providers.map(async (p) => {
      const models = await getJson(`${API}/providers/${encodeURIComponent(p.Name)}/models`);
      return models.map((m) => toFrontEndModel(m, p.Name));
    })
  );

  return addScoreAndRank(perProvider.flat());
}

// Backend names (Name, Co2...) -> the names the pages use (name, co2...).
// release, growth and proj aren't in the database yet, so they get placeholders.
function toFrontEndModel(m, company) {
  return {
    id: String(m.id),
    name: m.Name,
    company,
    release: null,
    energy: m.Power_Consumption,
    water: m.Water_Usage,
    co2: m.Co2,
    growth: 1,
    proj: 1,
  };
}

// PLACEHOLDER score out of 30 until the team agrees how to score models:
// the lowest CO2 gets 30 and the highest gets 0. Rank 1 is the best score.
function addScoreAndRank(models) {
  const co2s = models.map((m) => m.co2);
  const min = Math.min(...co2s);
  const max = Math.max(...co2s);
  const spread = max - min || 1;

  return models
    .map((m) => ({ ...m, score: Math.round(30 * (1 - (m.co2 - min) / spread)) }))
    .sort((a, b) => b.score - a.score || a.energy - b.energy)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}