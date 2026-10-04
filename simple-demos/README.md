# API demos

Simple scripts showing that the free APIs for the project work.

| File | API | What it does |
|---|---|---|
| `main.py` | All 3 | FastAPI server with an endpoint for each API |
| `peeringdb_demo.py` | PeeringDB | Lists data centres in a country (terminal) |
| `ember_demo.py` | Ember | CO2 per kWh of a country's electricity (terminal) |

The EcoLogits API is used in `main.py` (`/ecologits/...` endpoints).

## Setup

```powershell
pip install -r requirements.txt
```

## Run the FastAPI server

In VS Code: Run and Debug → **Run FastAPI (main.py)** → F5. Or in the terminal:

```powershell
uvicorn main:app --reload
```

Open http://127.0.0.1:8000/docs → click an endpoint → **Try it out** → **Execute**.

| Endpoint | Returns |
|---|---|
| `/ecologits/providers` | EcoLogits providers |
| `/ecologits/models/{provider}` | Models for a provider |
| `/ecologits/impact/{provider}/{model}` | Water, power, CO2 for 300 tokens |
| `/peeringdb/{country}` | Data centres in a country, e.g. `GB` |
| `/ember/{country}` | CO2 per kWh by year, e.g. `United Kingdom` (slow, big file) |

## Run the terminal scripts

```powershell
python peeringdb_demo.py
python ember_demo.py
```

## Data sources

- EcoLogits – https://ecologits.ai
- PeeringDB – https://www.peeringdb.com/apidocs/
- Ember (CC-BY-4.0) – https://ember-energy.org/data/yearly-electricity-data/
