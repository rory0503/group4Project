from app.models.model import Model
from app.models.provider import Provider
from math import isclose
from collections import Counter


def compareProvidersAndModels(providersA: list[Provider], providersB: list[Provider]) -> bool:

    if Counter(p.Name for p in providersA) != Counter(p.Name for p in providersB):
        print("Providers mismatched")
        return False

    for providerA in providersA:

        providerB = next(p for p in providersB if p.Name == providerA.Name)

        if Counter(m.Name for m in providerA.Models) != Counter(m.Name for m in providerB.Models):
            print("Models mismatch in " + providersA.Name)
            return False

        for modelA in providerA.Models:

            modelB = next(m for m in providerB.Models if m.Name == modelA.Name)

            if not isclose(modelA.Power_Consumption, modelB.Power_Consumption, rel_tol=1e-9, abs_tol=1e-12):
                print("Power mismatch in " + str(modelA.Name) + str(modelA.Power_Consumption) + " " + str(modelB.Name) + str(modelB.Power_Consumption))
                return False

            if not isclose(modelA.Co2, modelB.Co2, rel_tol=1e-9, abs_tol=1e-12):
                print("Co2 mismatch in " + str(modelA.Name) + str(modelA.Co2) + " " + str(modelB.Name) + str(modelB.Co2))
                return False

            if not isclose(modelA.Water_Usage, modelB.Water_Usage, rel_tol=1e-9, abs_tol=1e-12):
                print("Water_Usage mismatch in " + str(modelA.Name) + str(modelA.Water_Usage) + " " + str(modelB.Name) + str(modelB.Water_Usage))
                return False

    return True