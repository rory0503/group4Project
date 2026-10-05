import csv
import requests
from fastapi import FastAPI

#this creates the fastapi app, uvicorn runs it
app = FastAPI()

# ECOLOGITS API

#gets all supported providers
@app.get("/ecologits/providers")
def get_providers():
    response = requests.get("https://api.ecologits.ai/v1beta/providers")
    response.raise_for_status()
    return response.json()["providers"]

#gets all models for a provider
@app.get("/ecologits/models/{provider}")
def get_models(provider: str):
    response = requests.get(f"https://api.ecologits.ai/v1beta/models/{provider}")
    response.raise_for_status()
    models = response.json()["models"]
    return [model["name"] for model in models]

#gets the environmental impact of a model
@app.get("/ecologits/impact/{provider}/{model}")
def get_impact(provider: str, model: str):
    payload = {
        "provider": provider,
        "model_name": model,
        "output_token_count": 300,
        "request_latency": 1.5,
        "electricity_mix_zone": "WOR"
    }
    response = requests.post("https://api.ecologits.ai/v1beta/estimations", json=payload)
    response.raise_for_status()
    impacts = response.json()["impacts"]

    #midpoint between min and max, same as before
    water = (impacts["wcf"]["value"]["min"] + impacts["wcf"]["value"]["max"]) / 2
    power = (impacts["energy"]["value"]["min"] + impacts["energy"]["value"]["max"]) / 2
    warming = (impacts["gwp"]["value"]["min"] + impacts["gwp"]["value"]["max"]) / 2

    #instead of printing, we return it, fastapi turns it into json for the website
    return {
        "model": model,
        "tokens": 300,
        "water_litres": water,
        "power_kwh": power,
        "co2_kg": warming
    }


# PEERINGDB API

#gets data centres in a country, e.g. /peeringdb/GB
@app.get("/peeringdb/{country}")
def get_data_centres(country: str):
    params = {"country": country.upper(), "status": "ok"}
    response = requests.get("https://www.peeringdb.com/api/fac", params=params)
    response.raise_for_status()
    data_centres = response.json()["data"]

    #only send back the bits we need
    results = []
    for dc in data_centres:
        results.append({
            "name": dc["name"],
            "city": dc["city"],
            "latitude": dc["latitude"],
            "longitude": dc["longitude"]
        })
    return {"country": country.upper(), "count": len(results), "data_centres": results}


# EMBER API

#gets co2 per kWh of a country's electricity, e.g. /ember/United Kingdom
@app.get("/ember/{country}")
def get_co2(country: str):
    url = "https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv"
    response = requests.get(url, stream=True)
    response.raise_for_status()
    response.encoding = "utf-8-sig"
    rows = csv.DictReader(response.iter_lines(decode_unicode=True))

    results = {}
    for row in rows:
        if row["Area"].lower() == country.lower() and row["Variable"] == "CO2 intensity" and row["Value"] != "":
            results[int(row["Year"])] = float(row["Value"])

    return {"country": country, "gco2_per_kwh_by_year": results}
