import { models as sampleModels } from "../data/models";

// For now this returns the sample data.
// When the backend is ready, replace the body with a fetch and keep
// returning { models, loading, error } so nothing else has to change.
export default function useModels() {
  return { models: sampleModels, loading: false, error: null };
}