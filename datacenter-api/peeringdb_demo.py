import requests

#asks the user which country they want to see data centres for
def choose_country():
    print("Type the 2 letter code of the country you'd like to see data centres for (e.g. GB, US, DE, IE):")
    country = input("Input:").strip().upper()
    return country

#uses the peeringdb api to get every data centre in that country
def fetch_data_centres(country):
    #url of the peeringdb api, "fac" means facilities (data centres)
    url = "https://www.peeringdb.com/api/fac"

    #only get data centres in the chosen country that are still active ("ok")
    params = {
        "country": country,
        "status": "ok"
    }

    #the api call
    response = requests.get(url, params=params)

    #raise an exception if the api call was unsuccessful, essentially crash the program if something goes wrong instead of letting it go on
    response.raise_for_status()

    data = response.json()

    #the data centres are in a list called "data"
    data_centres = data["data"]

    print(f"Found {len(data_centres)} data centres in {country}. Showing the first 10:")

    #print the name, city and map location of the first 10
    for dc in data_centres[:10]:
        print(f"{dc['name']} - {dc['city']} (latitude: {dc['latitude']}, longitude: {dc['longitude']})")

def main():
    country = choose_country()
    fetch_data_centres(country)

if __name__ == "__main__":
    main()
