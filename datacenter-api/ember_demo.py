import csv
import requests

#asks the user which country they want to see the electricity CO2 for
def choose_country():
    print("Type the name of the country you'd like to check (e.g. United Kingdom, France, Ireland):")
    country = input("Input:").strip().lower()
    return country

#downloads ember's free electricity data and finds the co2 intensity for that country
def fetch_co2(country):
    #ember's public csv file, it doesn't need an api key
    url = "https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv"

    print("Downloading Ember data (it's a big file so it takes a minute)...")

    #stream=True means we read the file bit by bit instead of all at once
    response = requests.get(url, stream=True)

    #raise an exception if the api call was unsuccessful, essentially crash the program if something goes wrong instead of letting it go on
    response.raise_for_status()

    #utf-8-sig removes a hidden character at the start of the file
    response.encoding = "utf-8-sig"
    rows = csv.DictReader(response.iter_lines(decode_unicode=True))

    #the file has lots of different data, we only want "CO2 intensity" for our country
    results = {}
    for row in rows:
        if row["Area"].lower() == country and row["Variable"] == "CO2 intensity" and row["Value"] != "":
            results[int(row["Year"])] = float(row["Value"])

    if not results:
        print("Couldn't find that country, check the spelling.")
        return

    #show the last 5 years so you can see if it's getting cleaner
    print(f"CO2 intensity of electricity in {country.title()} (grams of CO2 per kWh):")
    for year in sorted(results)[-5:]:
        print(f"{year}: {results[year]} gCO2/kWh")

def main():
    country = choose_country()
    fetch_co2(country)

if __name__ == "__main__":
    main()
