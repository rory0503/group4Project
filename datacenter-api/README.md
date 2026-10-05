Setup

run in terminal 
pip install -r requirements.txt

Run the FastAPI server

In VS Code: Run and Debug → Run FastAPI (main.py) → F5. Or in the terminal:

uvicorn main:app --reload
Open http://127.0.0.1:8000/docs → click an endpoint → Try it out → Execute.

Run the terminal scripts

python peeringdb_demo.py
python ember_demo.py

Data sources

EcoLogits – https://ecologits.ai
PeeringDB – https://www.peeringdb.com/apidocs/
Ember (CC-BY-4.0) – https://ember-energy.org/data/yearly-electricity-data/