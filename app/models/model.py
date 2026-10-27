from dataclasses import dataclass, field
#raw api values. units: power kWh, co2 kgCO2eq, water litres
@dataclass
class Model:
    name: str
    power_consumption_min: float
    power_consumption_max: float
    co2_min: float
    co2_max: float
    water_usage_min: float
    water_usage_max: float
