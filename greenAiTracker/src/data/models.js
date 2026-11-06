/* Sample data for the prototype.
   All figures are illustrative placeholders, not measurements — replace them with
   sourced values before publishing. Annual figures are for the current year. */
const data = (() => {
  // [id, company, release year, energy GWh/yr, water L per GWh, CO2 t per GWh, score /30, past growth, projected growth]
  const rows = [
    ["gpt-5.4-pro", "OpenAI", 2025, 22, 1.9e6, 330, 29, 1.28, 1.10],
    ["gemini-pro-latest", "Google", 2025, 27, 1.6e6, 260, 28, 1.25, 1.12],
    ["claude-fable-5", "Anthropic", 2026, 30, 1.7e6, 300, 28, 1.30, 1.11],
    ["gpt-6-astra", "OpenAI", 2026, 38, 2.0e6, 340, 27, 1.32, 1.14],
    ["claude-sonnet-5-5", "Anthropic", 2026, 41, 1.8e6, 310, 26, 1.27, 1.12],
    ["gemini-flash-latest", "Google", 2025, 45, 1.6e6, 270, 25, 1.22, 1.09],
    ["mistral-large-3", "Mistral AI", 2025, 52, 1.5e6, 120, 24, 1.24, 1.10],
    ["qwen-4-max", "Alibaba", 2025, 58, 2.1e6, 520, 23, 1.35, 1.16],
    ["deepseek-v4", "DeepSeek", 2025, 63, 2.2e6, 560, 22, 1.38, 1.17],
    ["command-r-plus-2", "Cohere", 2024, 71, 1.9e6, 380, 21, 1.20, 1.08],
    ["llama-5-405b", "Meta", 2025, 84, 2.0e6, 390, 19, 1.26, 1.13],
    ["grok-5", "xAI", 2026, 97, 2.4e6, 450, 17, 1.40, 1.18],
  ];

  const companyColors = {
    OpenAI: "#1f2937",
    Google: "#2f6fdb",
    Anthropic: "#c46a4a",
    "Mistral AI": "#d9682b",
    Alibaba: "#d4492c",
    DeepSeek: "#4d6bfe",
    Cohere: "#39594d",
    Meta: "#1866e0",
    xAI: "#3b3b3b",
  };

  const models = rows
    .map(([id, company, release, energy, waterPerGWh, co2PerGWh, score, growth, proj]) => ({
      id,
      name: id,
      company,
      release,
      energy,
      water: Math.round(energy * waterPerGWh),
      co2: Math.round(energy * co2PerGWh),
      score,
      growth,
      proj,
    }))
    .sort((a, b) => b.score - a.score || a.energy - b.energy)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  const tips = [
    {
      title: "Reduce prompt overhead",
      body: "Every token takes compute to process. Keep prompts short and to the point — skip filler, pleasantries and repeated context you've already given.",
    },
    {
      title: "Choose the smallest model that works",
      body: "Lighter models use a fraction of the energy of flagship ones. Save the largest models for tasks that genuinely need them.",
    },
    {
      title: "Batch your questions",
      body: "Ask related questions in one message instead of many. Fewer round trips means less repeated processing of the same context.",
    },
    {
      title: "Avoid unnecessary regenerations",
      body: "Refine your prompt rather than regenerating the same answer again and again — each new response costs the same energy as the first.",
    },
    {
      title: "Switch off features you don't need",
      body: "Extended reasoning, image generation and web browsing all add work. Turn them on only when the task calls for them.",
    },
  ];

  return { models, companyColors, tips, years: [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030], currentYear: 2026 };
})();

export const { models, companyColors, tips, years, currentYear } = data;