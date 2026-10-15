@echo off

echo installing python...
winget install Python.Python.3

echo installing fastapi...
python -m pip install fastapi[standard]

echo starting server...

fastapi dev app/main.py

pause