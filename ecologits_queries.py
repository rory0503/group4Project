"""
ecologits_queries.py
====================
Ready-made queries for the AI Environmental Impact Dashboard, written against
the team's `ecologits` MySQL database (tables + the qry... / web - ... views).

Every function returns plain Python data (a dict, or a list of dicts), so the
results can go straight into a Flask/FastAPI JSON response, a pandas DataFrame
or a chart.

All figures are for ONE request that generates 1,000 output tokens on the
world-average electricity grid (the "Standard comparison" estimates), unless a
function says otherwise. They come from the `qrystandardcomparison` view, which
already averages repeat estimates and removes duplicate dated model names
(e.g. "claude-haiku-4-5-20251001" is the same model as "claude-haiku-4-5").

Setup
-----
    pip install mysql-connector-python

Database credentials are read from environment variables so they are never
hard-coded or sent to the browser (requirement NFR6):

    DB_HOST      (default "localhost")
    DB_PORT      (default 3306)
    DB_USER      (default "root")
    DB_PASSWORD  (default "")
    DB_NAME      (default "ecologits")

Quick start
-----------
    import ecologits_queries as q

    q.get_headline_stats()
    q.get_top_models("water", n=5)
    q.search_models("claude")
    q.compare_models("gpt-4o", "claude-sonnet-4-5")
    q.save_csv(q.get_model_rankings("carbon"), "carbon_rankings.csv")

Run this file directly (python ecologits_queries.py) to see an example of
every query.
"""

import csv
import io
import os
from contextlib import closing

import mysql.connector

# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
# Each metric the site can filter or rank by. Column names are taken ONLY from
# this whitelist (never from user input), which keeps the dynamic ORDER BY
# queries safe from SQL injection.
#
#   key: (column in qrystandardcomparison, multiplier to display unit,
#         display unit, label, low-column, high-column)
METRICS = {
    "electricity":    ("EnergyKwh", 1_000,         "Wh",       "Electricity",          "EnergyKwhMin", "EnergyKwhMax"),
    "carbon":         ("GwpKg",     1_000,         "g CO2e",   "Carbon emissions",     "GwpKgMin",     "GwpKgMax"),
    "water":          ("WaterL",    1_000,         "ml",       "Water consumption",    "WaterLMin",    "WaterLMax"),
    "primary_energy": ("PeMj",      1_000,         "kJ",       "Primary energy",       None,           None),
    "metals":         ("AdpeKg",    1_000_000_000, "µg Sb eq", "Metals and minerals",  None,           None),
}

# The same five figures, as SQL, for any query that selects from
# qrystandardcomparison aliased as `c`.
_METRIC_COLUMNS = """
    ROUND(c.EnergyKwh * 1000, 5)       AS electricity_wh,
    ROUND(c.GwpKg     * 1000, 5)       AS carbon_g,
    ROUND(c.WaterL    * 1000, 4)       AS water_ml,
    ROUND(c.PeMj      * 1000, 4)       AS primary_energy_kj,
    ROUND(c.AdpeKg    * 1000000000, 5) AS metals_ug_sb
"""

# Filters that pick out the standard estimates (1,000 tokens, world grid) when
# a query has to read the raw estimation tables instead of the views.
_STANDARD_ESTIMATE = (
    "e.OutputTokenCount = 1000 AND e.ZoneCode = 'WOR' AND e.RequestLatencySec IS NULL"
)


def _metric(metric):
    """Look up a metric key, raising a clear error for anything not whitelisted."""
    try:
        return METRICS[metric]
    except KeyError:
        raise ValueError(f"Unknown metric {metric!r}. Choose from: {', '.join(METRICS)}") from None


# ---------------------------------------------------------------------------
# Connection helpers
# ---------------------------------------------------------------------------
def get_connection():
    """Open a connection to the ecologits database using the DB_* environment variables."""
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "ecologits"),
    )


def _query(sql, params=None, one=False):
    """Run a SELECT with parameters and return a list of dicts (or one dict / None if one=True)."""
    with closing(get_connection()) as conn, closing(conn.cursor(dictionary=True)) as cur:
        cur.execute(sql, params or ())
        rows = cur.fetchall()
    rows = [{k: _clean(v) for k, v in row.items()} for row in rows]
    if one:
        return rows[0] if rows else None
    return rows


def _clean(value):
    """Turn MySQL Decimal values into int/float so results serialise cleanly to JSON."""
    if value.__class__.__name__ == "Decimal":
        return int(value) if value.as_tuple().exponent >= 0 else float(value)
    return value


def _like(term):
    """Escape a search term for use inside LIKE '%...%'."""
    term = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{term}%"


def resolve_model_name(model):
    """
    Return the name the comparison data uses for `model`.

    Dated names such as "gpt-4o-2024-08-06" or "mistral-medium-latest" are the
    same model as their base name and are left out of the comparison view, so
    they are mapped to the base name ("gpt-4o", "mistral-medium"). Unknown
    names are returned unchanged.
    """
    row = _query(
        """
        SELECT SameAs FROM qrymodelaliases
        WHERE Model = %s
        ORDER BY CHAR_LENGTH(SameAs) LIMIT 1
        """,
        (model,),
        one=True,
    )
    return row["SameAs"] if row else model


# ===========================================================================
# 1. DASHBOARD  (use case: View Global Statistics Dashboard)
# ===========================================================================
def get_headline_stats():
    """Headline numbers for the top of the dashboard (from the `web - headline stats` view)."""
    return _query(
        """
        SELECT
            `Models compared`                        AS models_compared,
            `Most electricity`                       AS most_electricity_model,
            `Most electricity (Wh per 1000 tokens)`  AS most_electricity_wh,
            `Least electricity`                      AS least_electricity_model,
            `Least electricity (Wh per 1000 tokens)` AS least_electricity_wh,
            `Most vs least (times)`                  AS most_vs_least_times,
            `Average model (Wh per 1000 tokens)`     AS average_electricity_wh,
            `Most carbon`                            AS most_carbon_model,
            `Most carbon (g CO2e per 1000 tokens)`   AS most_carbon_g,
            `Most water`                             AS most_water_model,
            `Most water (ml per 1000 tokens)`        AS most_water_ml,
            `Figures from (UTC)`                     AS figures_from_utc
        FROM `web - headline stats`
        """,
        one=True,
    )


def get_metric_averages():
    """Average, lowest and highest value of every metric across all compared models."""
    return _query(
        f"""
        SELECT
            COUNT(*) AS models_compared,
            ROUND(AVG(c.EnergyKwh) * 1000, 5) AS avg_electricity_wh,
            ROUND(MIN(c.EnergyKwh) * 1000, 5) AS min_electricity_wh,
            ROUND(MAX(c.EnergyKwh) * 1000, 5) AS max_electricity_wh,
            ROUND(AVG(c.GwpKg) * 1000, 5)     AS avg_carbon_g,
            ROUND(MIN(c.GwpKg) * 1000, 5)     AS min_carbon_g,
            ROUND(MAX(c.GwpKg) * 1000, 5)     AS max_carbon_g,
            ROUND(AVG(c.WaterL) * 1000, 4)    AS avg_water_ml,
            ROUND(MIN(c.WaterL) * 1000, 4)    AS min_water_ml,
            ROUND(MAX(c.WaterL) * 1000, 4)    AS max_water_ml
        FROM qrystandardcomparison c
        """,
        one=True,
    )


def get_data_freshness():
    """
    When each part of the data was last updated (requirements FR8 / NFR11),
    so the site can show "Data last updated: ..." on every page.
    """
    return _query(
        """
        SELECT
            (SELECT MAX(LastSyncedUtc) FROM provider)           AS providers_synced_utc,
            (SELECT MAX(LastSyncedUtc) FROM model)              AS models_synced_utc,
            (SELECT MAX(RequestedUtc)  FROM estimation)         AS estimates_updated_utc,
            (SELECT MAX(LastSyncedUtc) FROM electricitymixzone) AS grid_data_synced_utc
        """,
        one=True,
    )


def get_electricity_bands():
    """How many models fall into each electricity band (good for a bar chart)."""
    return _query(
        """
        SELECT `Band order` AS band_order,
               `Electricity per 1000 tokens` AS band,
               `Models` AS models
        FROM `web - electricity bands`
        ORDER BY band_order
        """
    )


# ===========================================================================
# 2. RANKINGS & FILTERING  (use cases: View Sustainability Rankings,
#                           Filter by Environmental Metric)
# ===========================================================================
def get_model_rankings(metric="electricity", most_first=False, provider=None, limit=None):
    """
    Rank every model by one metric.

    metric      "electricity", "carbon", "water", "primary_energy" or "metals"
    most_first  False = most sustainable first (leaderboard), True = worst first
    provider    optional company filter, e.g. "openai"
    limit       optional number of rows

    Each row includes all five metrics, the model's rank for the chosen metric
    (1 = most sustainable) and how many times the best model's figure it is.
    """
    col = _metric(metric)[0]
    direction = "DESC" if most_first else "ASC"
    sql = f"""
        SELECT * FROM (
            SELECT
                RANK() OVER (ORDER BY c.{col} ASC) AS sustainability_rank,
                c.Model    AS model,
                c.Provider AS company,
                {_METRIC_COLUMNS},
                ROUND(c.{col} / MIN(c.{col}) OVER (), 1) AS times_best_model
            FROM qrystandardcomparison c
        ) ranked
        WHERE (%s IS NULL OR company = %s)
        ORDER BY sustainability_rank {direction}, model
    """
    params = [provider, provider]
    if limit:
        sql += " LIMIT %s"
        params.append(int(limit))
    return _query(sql, params)


def get_top_models(metric="electricity", n=10, most=True):
    """Top n models that use the MOST (most=True) or LEAST (most=False) of a metric."""
    return get_model_rankings(metric, most_first=most, limit=n)


def get_model_rank(model, metric="electricity"):
    """
    Where one model sits in the leaderboard for a metric, e.g.
    {"model": "gpt-4o", "rank": 212, "out_of": 314, "percentile_better_than": 32.5}.
    Used to highlight a model's position in the rankings.
    """
    col = _metric(metric)[0]
    model = resolve_model_name(model)
    return _query(
        f"""
        SELECT model, company, rank_position AS `rank`, out_of,
               ROUND(100 * (out_of - rank_position) / out_of, 1) AS percentile_better_than
        FROM (
            SELECT c.Model AS model, c.Provider AS company,
                   RANK() OVER (ORDER BY c.{col} ASC) AS rank_position,
                   COUNT(*) OVER () AS out_of
            FROM qrystandardcomparison c
        ) r
        WHERE model = %s
        """,
        (model,),
        one=True,
    )


def get_company_rankings(metric="electricity", most_first=True):
    """
    Compare AI companies on one metric: average per model, plus each company's
    hungriest and most efficient model for that metric.
    """
    col, mult, unit, *_ = _metric(metric)
    direction = "DESC" if most_first else "ASC"
    return _query(
        f"""
        WITH ranked AS (
            SELECT c.Provider, c.Model, c.{col} AS v,
                   ROW_NUMBER() OVER (PARTITION BY c.Provider ORDER BY c.{col} DESC, c.Model) AS worst,
                   ROW_NUMBER() OVER (PARTITION BY c.Provider ORDER BY c.{col} ASC,  c.Model) AS best
            FROM qrystandardcomparison c
        )
        SELECT
            Provider AS company,
            COUNT(*) AS models_compared,
            ROUND(AVG(v) * {mult}, 5) AS average_value,
            MAX(CASE WHEN worst = 1 THEN Model END) AS hungriest_model,
            ROUND(MAX(v) * {mult}, 5) AS hungriest_value,
            MAX(CASE WHEN best = 1 THEN Model END) AS most_efficient_model,
            ROUND(MIN(v) * {mult}, 5) AS most_efficient_value,
            %s AS unit
        FROM ranked
        GROUP BY Provider
        ORDER BY average_value {direction}
        """,
        (unit,),
    )


# ===========================================================================
# 3. MODELS  (use cases: View All Models Data, View Specific Model Data,
#             Search for Model)
# ===========================================================================
def list_providers():
    """Every AI company in the database with how many models it has in the comparison."""
    return _query(
        """
        SELECT p.Name AS company,
               COUNT(c.Model) AS models_compared,
               p.LastSyncedUtc AS last_synced_utc
        FROM provider p
        LEFT JOIN qrystandardcomparison c ON c.Provider = p.Name
        WHERE p.IsActive = 1
        GROUP BY p.Name, p.LastSyncedUtc
        ORDER BY p.Name
        """
    )


def list_models(provider=None):
    """All compared models (optionally for one company) with their five metrics, A-Z."""
    return _query(
        f"""
        SELECT c.Model AS model, c.Provider AS company, {_METRIC_COLUMNS}
        FROM qrystandardcomparison c
        WHERE (%s IS NULL OR c.Provider = %s)
        ORDER BY c.Provider, c.Model
        """,
        (provider, provider),
    )


def search_models(term, limit=20):
    """
    Search models by (part of) their name. Also matches dated names, so
    searching "gpt-4o-2024" finds "gpt-4o". An empty list means no match, so the
    site can show its "Model not found" message.
    """
    term = (term or "").strip()
    if not term:
        return []
    pattern = _like(term)
    starts_with = pattern[1:]  # same escaped term, "starts with" instead of "contains"
    rows = _query(
        f"""
        SELECT c.Model AS model, c.Provider AS company, {_METRIC_COLUMNS},
               CASE WHEN c.Model = %s THEN 0
                    WHEN c.Model LIKE %s THEN 1
                    ELSE 2 END AS match_quality
        FROM qrystandardcomparison c
        WHERE c.Model LIKE %s
           OR EXISTS (SELECT 1 FROM qrymodelaliases a
                      WHERE a.SameAs = c.Model AND a.Provider = c.Provider AND a.Model LIKE %s)
        ORDER BY match_quality, CHAR_LENGTH(c.Model), c.Model
        LIMIT %s
        """,
        (term, starts_with, pattern, pattern, int(limit)),
    )
    for r in rows:
        del r["match_quality"]
    return rows


def get_model_details(model):
    """
    Everything about one model for its detail page: the five metrics (with
    low-high ranges where EcoLogits gives them), its electricity rank, design,
    size, speed, precision warnings and other names it is known by.
    Returns None if the model is not found.
    """
    model = resolve_model_name(model)
    details = _query(
        """
        SELECT
            `Model`                                  AS model,
            `Company`                                AS company,
            `Electricity rank (1 = most)`            AS electricity_rank_most_first,
            `Electricity (Wh)`                       AS electricity_wh,
            `Electricity low (Wh)`                   AS electricity_low_wh,
            `Electricity high (Wh)`                  AS electricity_high_wh,
            `Carbon (g CO2e)`                        AS carbon_g,
            `Carbon low (g CO2e)`                    AS carbon_low_g,
            `Carbon high (g CO2e)`                   AS carbon_high_g,
            `Water (ml)`                             AS water_ml,
            `Water low (ml)`                         AS water_low_ml,
            `Water high (ml)`                        AS water_high_ml,
            `Primary energy (kJ)`                    AS primary_energy_kj,
            `Metals and minerals (micrograms Sb eq)` AS metals_ug_sb,
            `Design`                                 AS design,
            `Used per token (billion parameters)`    AS active_params_billion,
            `Total size (billion parameters)`        AS total_params_billion,
            `Speed (tokens per second)`              AS speed_tokens_per_sec,
            `Size figures are`                       AS size_figures_are
        FROM `web - model details`
        WHERE `Model` = %s
        """,
        (model,),
        one=True,
    )
    if details is None:
        return None
    details["warnings"] = get_model_warnings(model)
    details["also_known_as"] = get_model_aliases(model)
    return details


def get_model_warnings(model):
    """Precision warnings EcoLogits gives for a model (e.g. architecture not released)."""
    return _query(
        """
        SELECT ic.Code AS code, ic.Severity AS severity, ic.Message AS message
        FROM model m
        JOIN modelissue mi ON mi.ModelId = m.ModelId
        JOIN issuecode ic  ON ic.Code = mi.Code
        WHERE m.Name = %s
        ORDER BY ic.Code
        """,
        (resolve_model_name(model),),
    )


def get_model_aliases(model):
    """Other (dated) names that refer to the same model, e.g. gpt-4o -> ["gpt-4o-2024-08-06", ...]."""
    rows = _query(
        "SELECT DISTINCT Model FROM qrymodelaliases WHERE SameAs = %s ORDER BY Model",
        (model,),
    )
    return [r["Model"] for r in rows]


# ===========================================================================
# 4. COMPARISON  (use cases: Compare Two Models, Compare Models)
# ===========================================================================
def compare_models(model_a, model_b):
    """
    Side-by-side comparison of two models on every metric. For each metric it
    says which model uses less and by how many times. Returns None if either
    model is not found.
    """
    a, b = resolve_model_name(model_a), resolve_model_name(model_b)
    rows = {r["model"].lower(): r for r in compare_many([a, b])}
    if a.lower() not in rows or b.lower() not in rows:
        return None
    ra, rb = rows[a.lower()], rows[b.lower()]
    result = {"model_a": ra, "model_b": rb, "metrics": []}
    for key, (_, _, unit, label, *_rest) in METRICS.items():
        field = _metric_field(key)
        va, vb = ra[field], rb[field]
        if va == vb:
            lower, times = "same", 1.0
        else:
            lower = ra["model"] if va < vb else rb["model"]
            times = round(max(va, vb) / min(va, vb), 2) if min(va, vb) else None
        result["metrics"].append({
            "metric": key, "label": label, "unit": unit,
            "model_a_value": va, "model_b_value": vb,
            "uses_less": lower, "times_difference": times,
        })
    return result


def compare_many(models):
    """The five metrics for a list of models (any number), e.g. for a grouped bar chart."""
    names = [resolve_model_name(m) for m in models]
    if not names:
        return []
    placeholders = ", ".join(["%s"] * len(names))
    return _query(
        f"""
        SELECT c.Model AS model, c.Provider AS company, {_METRIC_COLUMNS}
        FROM qrystandardcomparison c
        WHERE c.Model IN ({placeholders})
        ORDER BY c.EnergyKwh
        """,
        names,
    )


def _metric_field(metric):
    """Name of the result column that holds a metric in the _METRIC_COLUMNS output."""
    return {"electricity": "electricity_wh", "carbon": "carbon_g", "water": "water_ml",
            "primary_energy": "primary_energy_kj", "metals": "metals_ug_sb"}[metric]


# ===========================================================================
# 5. MAKING NUMBERS MEANINGFUL  (dashboard facts, information pages)
# ===========================================================================
def get_everyday_equivalents(model=None):
    """
    Turns each model's per-request figures into everyday terms: LED bulb
    minutes, phone charges, metres driven in a petrol car, drops / glasses of
    water. Give a model name for one row, or nothing for every model.
    """
    sql = """
        SELECT `Model` AS model, `Company` AS company,
               `10 W LED bulb on for (minutes)` AS led_bulb_minutes,
               `Full phone charges`             AS phone_charges,
               `Petrol car driven (metres)`     AS petrol_car_metres,
               `Drops of water`                 AS drops_of_water,
               `Glasses of water`               AS glasses_of_water
        FROM `web - everyday equivalents`
    """
    if model:
        return _query(sql + " WHERE `Model` = %s", (resolve_model_name(model),), one=True)
    return _query(sql)


def get_running_vs_hardware(model=None, limit=None):
    """
    How much of each model's carbon comes from running it versus from making
    the hardware it runs on. Sorted by hardware share, highest first.
    """
    sql = """
        SELECT `Model` AS model, `Company` AS company,
               `Total carbon (g CO2e)`             AS total_carbon_g,
               `From running it (g CO2e)`          AS running_carbon_g,
               `From making the hardware (g CO2e)` AS hardware_carbon_g,
               `Share from hardware (%)`           AS hardware_share_percent
        FROM `web - running vs hardware`
    """
    if model:
        return _query(sql + " WHERE `Model` = %s", (resolve_model_name(model),), one=True)
    params = []
    if limit:
        sql += " LIMIT %s"
        params.append(int(limit))
    return _query(sql, params)


def get_size_vs_electricity():
    """
    Each model's size (billions of parameters used per token) next to its
    electricity use, for a scatter chart showing that bigger models use more.
    Models whose size EcoLogits had to estimate are flagged.
    """
    return _query(
        """
        SELECT `Model` AS model, `Company` AS company, `Design` AS design,
               `Used per token (billion parameters)` AS active_params_billion,
               `Electricity (Wh)` AS electricity_wh,
               `Size figures are` AS size_figures_are
        FROM `web - model details`
        WHERE `Used per token (billion parameters)` IS NOT NULL
        ORDER BY active_params_billion
        """
    )


def get_architecture_summary():
    """Average electricity, carbon and water for mixture-of-experts vs dense models."""
    return _query(
        """
        SELECT `Design` AS design,
               COUNT(*) AS models,
               ROUND(AVG(`Electricity (Wh)`), 4) AS avg_electricity_wh,
               ROUND(AVG(`Carbon (g CO2e)`), 4)  AS avg_carbon_g,
               ROUND(AVG(`Water (ml)`), 3)       AS avg_water_ml
        FROM `web - model details`
        GROUP BY `Design`
        ORDER BY avg_electricity_wh DESC
        """
    )


# ===========================================================================
# 6. WHAT-IF CALCULATORS  (for developers choosing a model)
# ===========================================================================
def estimate_usage(model, tokens_per_request=1000, requests_per_day=100, days=30):
    """
    Rough total footprint of using a model for a project, scaled from its
    per-1,000-token figures. EcoLogits' estimates grow in proportion to the
    number of output tokens, so this scaling holds when requests are of
    similar size.

    Returns totals in kWh, kg CO2e and litres plus everyday equivalents, or
    None if the model is not found.
    """
    row = compare_many([model])
    if not row:
        return None
    r = row[0]
    thousands_of_tokens = tokens_per_request * requests_per_day * days / 1000
    kwh = r["electricity_wh"] * thousands_of_tokens / 1000
    kg = r["carbon_g"] * thousands_of_tokens / 1000
    litres = r["water_ml"] * thousands_of_tokens / 1000
    return {
        "model": r["model"],
        "company": r["company"],
        "total_output_tokens": int(thousands_of_tokens * 1000),
        "electricity_kwh": round(kwh, 4),
        "carbon_kg": round(kg, 4),
        "water_litres": round(litres, 3),
        "equivalents": {
            "phone_charges": round(kwh * 1000 / 15, 1),        # ~15 Wh per full charge
            "petrol_car_km": round(kg / 0.170, 2),             # ~170 g CO2e per km
            "glasses_of_water": round(litres / 0.25, 1),       # 250 ml glass
        },
    }


def get_carbon_by_country(model, zone_code):
    """
    The model's carbon per 1,000 tokens if it ran on a specific country's
    electricity grid instead of the world average (zone_code is the 3-letter
    code, e.g. "GBR", "FRA", "USA").

    Exact for carbon: EcoLogits calculates carbon from running a model as
    energy x the grid's carbon factor, and adds the carbon from making the
    hardware, which doesn't depend on the country. Water is not included
    because it also depends on each provider's datacentres.
    """
    return _query(
        f"""
        SELECT
            s.Model AS model, s.Provider AS company,
            z.ZoneCode AS zone_code, z.CountryName AS country,
            ROUND(z.Gwp * 1000, 1) AS grid_g_co2e_per_kwh,
            ROUND((s.energy_kwh * z.Gwp + s.embodied_gwp) * 1000, 5) AS carbon_g,
            ROUND((s.energy_kwh * w.Gwp + s.embodied_gwp) * 1000, 5) AS world_average_carbon_g,
            ROUND(100 * ((s.energy_kwh * z.Gwp + s.embodied_gwp)
                       / (s.energy_kwh * w.Gwp + s.embodied_gwp) - 1), 1) AS percent_vs_world_average
        FROM (
            SELECT m.Name AS Model, p.Name AS Provider,
                   AVG(CASE WHEN i.Phase = 'total'    AND i.MetricCode = 'energy'
                            THEN (i.MinValue + i.MaxValue) / 2 END) AS energy_kwh,
                   AVG(CASE WHEN i.Phase = 'embodied' AND i.MetricCode = 'gwp'
                            THEN (i.MinValue + i.MaxValue) / 2 END) AS embodied_gwp
            FROM estimation e
            JOIN model m ON m.ModelId = e.ModelId
            JOIN provider p ON p.ProviderId = m.ProviderId
            JOIN estimationimpact i ON i.EstimationId = e.EstimationId
            WHERE {_STANDARD_ESTIMATE} AND m.Name = %s
            GROUP BY m.Name, p.Name
        ) s
        JOIN electricitymixzone z ON z.ZoneCode = %s
        JOIN electricitymixzone w ON w.ZoneCode = 'WOR'
        """,
        (resolve_model_name(model), zone_code.upper()),
        one=True,
    )


def compare_countries(model, zone_codes):
    """get_carbon_by_country for several countries at once, lowest carbon first."""
    rows = [get_carbon_by_country(model, z) for z in zone_codes]
    return sorted((r for r in rows if r), key=lambda r: r["carbon_g"])


def get_grid_carbon_intensity(cleanest_first=True, limit=10):
    """
    Countries ranked by how much carbon their electricity grid produces per
    kWh. The same model creates less carbon on a cleaner grid.
    """
    direction = "ASC" if cleanest_first else "DESC"
    return _query(
        f"""
        SELECT ZoneCode AS zone_code, CountryName AS country,
               ROUND(Gwp * 1000, 1) AS g_co2e_per_kwh,
               Wue AS water_litres_per_kwh
        FROM electricitymixzone
        WHERE ZoneCode <> 'WOR'
        ORDER BY Gwp {direction}, CountryName
        LIMIT %s
        """,
        (int(limit),),
    )


def list_countries():
    """All countries / zones (code + name), A-Z, for a country picker drop-down."""
    return _query(
        "SELECT ZoneCode AS zone_code, CountryName AS country FROM electricitymixzone ORDER BY CountryName"
    )


# ===========================================================================
# 7. INFORMATION, DATA QUALITY & ADMIN
#    (use cases: View Information & Metric Definitions, Manage Providers &
#     Models, Update Environmental Data)
# ===========================================================================
def get_metric_definitions():
    """What each environmental metric means and its unit, for the information page (FR15)."""
    return _query(
        "SELECT Code AS code, Name AS name, Unit AS unit, Description AS description "
        "FROM impactmetric ORDER BY FIELD(Code, 'energy', 'gwp', 'wcf', 'pe', 'adpe')"
    )


def get_warning_summary():
    """How many models carry each precision warning (shown as a data-quality note)."""
    return _query(
        """
        SELECT ic.Code AS code, ic.Severity AS severity, ic.Message AS message,
               COUNT(mi.ModelId) AS models_affected
        FROM issuecode ic
        LEFT JOIN modelissue mi ON mi.Code = ic.Code
        GROUP BY ic.Code, ic.Severity, ic.Message
        ORDER BY models_affected DESC
        """
    )


def find_models_missing_data():
    """
    Active models with no standard estimate that aren't just a dated duplicate
    name, i.e. models the site has no figures for (FR11). An empty list means
    every model is covered.
    """
    return _query(
        f"""
        SELECT p.Name AS company, m.Name AS model, m.LastSyncedUtc AS last_synced_utc
        FROM model m
        JOIN provider p ON p.ProviderId = m.ProviderId
        LEFT JOIN qrystandardcomparison c ON c.Provider = p.Name AND c.Model = m.Name
        LEFT JOIN qrymodelaliases a ON a.ModelId = m.ModelId
        WHERE m.IsActive = 1 AND c.Model IS NULL AND a.ModelId IS NULL
        ORDER BY p.Name, m.Name
        """
    )


def get_database_summary():
    """Row counts and last-sync times, for an admin status page or a check after each daily update."""
    return _query(
        """
        SELECT
            (SELECT COUNT(*) FROM provider WHERE IsActive = 1) AS active_providers,
            (SELECT COUNT(*) FROM model WHERE IsActive = 1)    AS active_models,
            (SELECT COUNT(*) FROM qrystandardcomparison)       AS models_compared,
            (SELECT COUNT(*) FROM qrymodelaliases)             AS duplicate_dated_names,
            (SELECT COUNT(*) FROM estimation)                  AS estimates_stored,
            (SELECT COUNT(*) FROM electricitymixzone)          AS grid_zones,
            (SELECT MAX(LastSyncedUtc) FROM model)             AS models_synced_utc,
            (SELECT MAX(RequestedUtc) FROM estimation)         AS estimates_updated_utc
        """,
        one=True,
    )


def get_stale_models(days=2):
    """
    Models not refreshed in the last `days` days. With a 24-hour update,
    anything here means the scheduled refresh failed for those models.
    """
    return _query(
        """
        SELECT p.Name AS company, m.Name AS model, m.LastSyncedUtc AS last_synced_utc
        FROM model m JOIN provider p ON p.ProviderId = m.ProviderId
        WHERE m.IsActive = 1 AND m.LastSyncedUtc < UTC_TIMESTAMP() - INTERVAL %s DAY
        ORDER BY m.LastSyncedUtc, p.Name, m.Name
        """,
        (int(days),),
    )


# ===========================================================================
# 8. EXPORT  (use case: Export Data as CSV)
# ===========================================================================
def to_csv(rows):
    """
    Turn query results (a list of dicts, or one dict) into CSV text, e.g. to
    return from a Flask route as a download.
    """
    if isinstance(rows, dict):
        rows = [rows]
    if not rows:
        return ""
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0].keys()), extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()


def save_csv(rows, path):
    """Write query results to a CSV file and return the path."""
    with open(path, "w", newline="", encoding="utf-8") as f:
        f.write(to_csv(rows))
    return path


# ===========================================================================
# Demo: python ecologits_queries.py
# ===========================================================================
if __name__ == "__main__":
    from pprint import pprint

    def show(title, value):
        print(f"\n=== {title} ===")
        pprint(value, sort_dicts=False, width=110)

    show("Headline stats", get_headline_stats())
    show("Data freshness", get_data_freshness())
    show("Top 5 most water-efficient models", get_top_models("water", n=5, most=False))
    show("Top 5 highest-carbon models", get_top_models("carbon", n=5, most=True))
    show("Companies by average electricity", get_company_rankings("electricity"))
    show("Search 'claude-haiku'", search_models("claude-haiku"))
    show("Search for a model that doesn't exist", search_models("not-a-real-model"))
    show("Model details: gpt-4o", get_model_details("gpt-4o"))
    show("Rank of gpt-4o-mini for carbon", get_model_rank("gpt-4o-mini", "carbon"))
    show("Compare gpt-4o vs claude-sonnet-4-5", compare_models("gpt-4o", "claude-sonnet-4-5"))
    show("Everyday equivalents: gpt-4o", get_everyday_equivalents("gpt-4o"))
    show("1 month of a chatbot on gpt-4o-mini", estimate_usage("gpt-4o-mini", 500, 1000, 30))
    show("gpt-4o carbon: France vs UK vs Poland", compare_countries("gpt-4o", ["FRA", "GBR", "POL"]))
    show("Cleanest 5 grids", get_grid_carbon_intensity(limit=5))
    show("Mixture of experts vs dense", get_architecture_summary())
    show("Metric definitions", get_metric_definitions())
    show("Models missing data", find_models_missing_data())
    show("Database summary", get_database_summary())
