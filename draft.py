#this is to plan because most logic will be done with functions, not classes
#classes are exclusively for representing data and will have no useful methods
from fastapi import FastAPI
from pydantic import BaseModel
import asyncio
import requests
import time

app = FastAPI()

modelsList = []

lastDatabaseUpdate = time.time()
refreshTime = 86400

class Model(BaseModel):
    name: str
    provider: str
    waterConsumption: float
    powerConsumption: float
    co2Generation: float
    def __str__(self):
        return(f"Model(name={self.name}, provider={self.provider}, water={self.waterConsumption}, power={self.powerConsumption}, co2={self.co2Generation})")

def getProviders():
    url = "https://api.ecologits.ai/v1beta/providers"
    response = requests.get(url)

    data = response.json()
    providers = data["providers"]
    return providers

def getProviderModels(provider):
    url = f"https://api.ecologits.ai/v1beta/models/{provider}"
    response = requests.get(url)

    data = response.json()
    models = data.get("models", [])
    return [model["name"] for model in models]

async def fetchAllEstimations():
    url = "https://api.ecologits.ai/v1beta/estimations"
    headers = {
        "accept": "application/json",
        "Content-Type": "application/json"
    }
    
    modelsList = []
    providers = getProviders()

    #purely for tracking progress of fetching estimations
    #it takes about a minute (for me) to complete, so without this it seems like the program froze
    i = 1
    length = 0
    for provider in providers:
        models = getProviderModels(provider)
        length += len(models)

    for provider in providers:

        models = getProviderModels(provider)
        
        for model in models:
            print(f"called {i} of {length}")
            i+= 1

            payload = {
                "provider": provider,
                "model_name": model,
                "output_token_count": 300,
                "request_latency": 1.5,
                "electricity_mix_zone": "WOR"
            }
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                impacts = data.get("impacts", {})

                def parseMetric(metricKey):
                    metric_data = impacts.get(metricKey, {})
                    value = metric_data.get("value", 0.0)
                    if isinstance(value, dict):
                        return (value.get("min", 0.0) + value.get("max", 0.0)) / 2
                    return float(value)

                water_value = parseMetric("wcf")
                power_value = parseMetric("energy")
                co2_value = parseMetric("gwp")

                model_obj = Model(
                    name=model,
                    provider=provider,
                    waterConsumption=water_value,
                    powerConsumption=power_value,
                    co2Generation=co2_value
                )
                modelsList.append(model_obj)
                
    return modelsList

def databaseUpdate():
    return fetchAllEstimations()

@app.get("/refresh")
async def refresh():
    currentTime = time.time()
    if lastDatabaseUpdate + refreshTime > currentTime:
        databaseUpdate()

@app.get("/models", response_model=list[Model])
def sendAllModels():
    return modelsList

if __name__ == "__main__":
    objects = asyncio.run(fetchAllEstimations())
    print(objects)