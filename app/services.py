import requests
from app.models.model import Model
from app.models.provider import Provider

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

#the erd has one column per impact, so a model stores the midpoint of min and max
def _midpoint(impacts, key):
    value_min, value_max = _min_max(impacts, key)

    return (value_min + value_max) / 2


#impact estimate for one model, as a Model object the values are power kWh, co2 kgCO2eq, water in litres
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

    return Model(
        Name=model,
        Power_Consumption=_midpoint(impacts, "energy"),
        Co2=_midpoint(impacts, "gwp"),
        Water_Usage=_midpoint(impacts, "wcf"),
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

                providers.append(Provider(name=provider_name, models=models))

    return providers