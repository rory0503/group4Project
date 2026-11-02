@echo off

echo installing python...
winget install Python.Python.3

echo installing fastapi...
python -m pip install fastapi[standard] --only-binary=:all:

echo installing requests...
python -m pip install requests

echo installing sqlalchemy...
python -m pip install sqlalchemy

echo starting server...

python -m fastapi dev app/main.py

pause

