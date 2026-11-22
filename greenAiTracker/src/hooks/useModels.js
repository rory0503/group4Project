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
    energy: m.Power_Consumption*1000, // convert kWh to Wh
    water: m.Water_Usage*1000, // convert m3 to L
    co2: m.Co2*1000, // convert kg to g
    growth: 1,
    proj: 1,
  };
}

// PLACEHOLDER scoring until the team agrees how to score models.
// Each of water, energy and CO2 is scored by which quartile bin it falls in,
// then the three scores are added together. Rank 1 is the best score.

// Gets the value at a given point (0 to 1) of a sorted list, e.g. 0.25 for Q1
function quantile(sorted, q) {
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}

// Works out the three thresholds (Q1, median, Q3) for one measure
function getThresholds(models, key) {
  const sorted = models.map((m) => m[key]).sort((a, b) => a - b);
  return [quantile(sorted, 0.25), quantile(sorted, 0.5), quantile(sorted, 0.75)];
}

// Lower values are better, so the lowest quartile scores highest
function binScore(value, [q1, median, q3]) {
  // Less than q1: exceptional
  if (value <= q1) return 4;
  // Between q1 and median: average
  if (value <= median) return 3;
  // Between median and q3: below average
  if (value <= q3) return 2;
  // More than q3: Very Poor
  return 1;
}

function addScoreAndRank(models) {
  // Gets threshold value for each expenditure
  const waterThresholds = getThresholds(models, "water");
  const energyThresholds = getThresholds(models, "energy");
  const co2Thresholds = getThresholds(models, "co2");

  return models
    .map((m) => {
      // Gets bin scores for each expindture using threshold
      const waterScore = binScore(m.water, waterThresholds);
      const energyScore = binScore(m.energy, energyThresholds);
      const co2Score = binScore(m.co2, co2Thresholds);
      return {
        ...m,
        waterScore,
        energyScore,
        co2Score,
        // Adds expindture values togther, creating total score
        score: waterScore + energyScore + co2Score,
      };
    })
    // Highest score first, with lower energy breaking ties
    .sort((a, b) => b.score - a.score || a.energy - b.energy)
    .map((m, i) => ({ ...m, rank: i + 1 }));
}