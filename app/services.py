import requests
from models.model import Model
from models.provider import Provider

BASE_URL = "https://api.ecologits.ai/v1beta"

#all provider names
def get_providers():
    response = requests.get(f"{BASE_URL}/providers", timeout=10)
    response.raise_for_status()

    return response.json()["providers"]


#all model names for a provider
def get_models(provider):
    response = requests.get(f"{BASE_URL}/models/{provider}", timeout=10)
    response.raise_for_status()

    return [model["name"] for model in response.json()["models"]]


#returns (min, max). some models give one exact value, so min = max
def _min_max(impacts, key):
    value = impacts[key]["value"]

    if isinstance(value, dict):
        return value["min"], value["max"]

    return value, value


#impact estimate for one model
def get_model_data(provider, model, output_token_count=300, electricity_mix_zone="WOR"):
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }

    payload = {
        "provider": provider,
        "model_name": model,
        "output_token_count": output_token_count,
        "electricity_mix_zone": electricity_mix_zone
    }

    response = requests.post(f"{BASE_URL}/estimations", json=payload, headers=headers, timeout=10)
    response.raise_for_status()

    impacts = response.json()["impacts"]

    power_min, power_max = _min_max(impacts, "energy")
    co2_min, co2_max = _min_max(impacts, "gwp")
    water_min, water_max = _min_max(impacts, "wcf")

    return Model(
        name=model,
        power_consumption_min=power_min,
        power_consumption_max=power_max,
        co2_min=co2_min,
        co2_max=co2_max,
        water_usage_min=water_min,
        water_usage_max=water_max,
    )


#every model of every provider, as a list of Provider objects
def collect_data(**estimation_options):
    providers = []

    for provider_name in get_providers():
        models = []

        for model_name in get_models(provider_name):
            #skip models the api can't estimate, or that time out / lose connection
            try:
                models.append(get_model_data(provider_name, model_name, **estimation_options))
            except requests.RequestException as error:
                print(f"Skipping {provider_name}/{model_name}: {error}")

        providers.append(Provider(provider_name, models))

    return providers