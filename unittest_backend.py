import os
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import requests


BACKEND = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(BACKEND / "app"))

from fastapi.testclient import TestClient

import app.routers.views as views
import ecologits_queries as q
import services
from app.main import app
from models.model import Model
from models.provider import Provider


def fake_response(data=None, status=200):
    response = Mock()
    response.json.return_value = data
    if status >= 400:
        response.raise_for_status.side_effect = requests.HTTPError(f"{status} Error")
    return response


class TestModels(unittest.TestCase):

    def test_model_stores_its_values(self):
        m = Model("gpt-4o", 0.001, 0.002, 0.0005, 0.0007, 0.004, 0.006)
        self.assertEqual(m.name, "gpt-4o")
        self.assertEqual((m.power_consumption_min, m.power_consumption_max), (0.001, 0.002))
        self.assertEqual((m.co2_min, m.co2_max), (0.0005, 0.0007))
        self.assertEqual((m.water_usage_min, m.water_usage_max), (0.004, 0.006))

    @unittest.expectedFailure
    def test_provider_file_imports_model(self):
        self.assertIn("Model", vars(sys.modules[Provider.__module__]))


class TestServices(unittest.TestCase):

    @patch("services.requests.get")
    def test_get_providers_returns_provider_names(self, mock_get):
        mock_get.return_value = fake_response({"providers": ["anthropic", "openai"]})
        self.assertEqual(services.get_providers(), ["anthropic", "openai"])

    @patch("services.requests.get")
    def test_get_providers_raises_an_error_if_the_api_fails(self, mock_get):
        mock_get.return_value = fake_response(status=503)
        with self.assertRaises(requests.HTTPError):
            services.get_providers()

    def test_exact_value_is_used_for_min_and_max(self):
        data = {"energy": {"value": 3.0}}
        self.assertEqual(services._min_max(data, "energy"), (3.0, 3.0))

    @patch("services.requests.post")
    def test_get_model_data_turns_the_api_response_into_a_model(self, mock_post):
        mock_post.return_value = fake_response({"impacts": {
            "energy": {"value": {"min": 0.001, "max": 0.002}},
            "gwp": {"value": {"min": 0.0005, "max": 0.0007}},
            "wcf": {"value": {"min": 0.004, "max": 0.006}},
        }})
        result = services.get_model_data("openai", "gpt-4o")
        self.assertEqual(result, services.Model("gpt-4o", 0.001, 0.002, 0.0005, 0.0007, 0.004, 0.006))

    def test_collect_data_skips_models_that_fail_and_keeps_the_rest(self):
        def fake_model_data(provider, model, **options):
            if model == "broken":
                raise requests.ConnectionError("connection lost")
            return services.Model(model, 1, 2, 3, 4, 5, 6)

        with patch("services.get_providers", return_value=["openai"]), \
             patch("services.get_models", return_value=["gpt-4o", "broken", "gpt-4o-mini"]), \
             patch("services.get_model_data", side_effect=fake_model_data), \
             patch("builtins.print"):
            result = services.collect_data()
        self.assertEqual([m.name for m in result[0].models], ["gpt-4o", "gpt-4o-mini"])

    @unittest.expectedFailure
    def test_app_can_import_services(self):
        result = subprocess.run([sys.executable, "-c", "import app.services"],
                                cwd=BACKEND, capture_output=True)
        self.assertEqual(result.returncode, 0)


class TestApi(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def allowed_origin(self, origin):
        response = self.client.options("/api/v1/users/", headers={
            "Origin": origin, "Access-Control-Request-Method": "GET"})
        return response.headers.get("access-control-allow-origin")

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_views_counts_seconds_since_last_update(self):
        with patch.object(views, "time", return_value=views.lastUpdate + 3600):
            self.assertEqual(self.client.get("/api/v1/views/").json(), 3600)

    def test_cors_blocks_other_websites(self):
        self.assertIsNone(self.allowed_origin("https://evil.example.com"))

    @unittest.expectedFailure
    def test_cors_allows_the_react_app(self):
        self.assertEqual(self.allowed_origin("http://localhost:5173"), "http://localhost:5173")


class TestQueries(unittest.TestCase):

    def test_sql_injection_in_metric_is_rejected(self):
        with self.assertRaises(ValueError):
            q.get_model_rankings("electricity; DROP TABLE model")

    @patch.dict(os.environ, {"DB_HOST": "db", "DB_PORT": "3307", "DB_USER": "app",
                             "DB_PASSWORD": "secret", "DB_NAME": "green_ai"})
    def test_database_login_comes_from_environment_variables(self):
        with patch.object(q.mysql.connector, "connect") as connect:
            q.get_connection()
        connect.assert_called_once_with(host="db", port=3307, user="app",
                                        password="secret", database="green_ai")

    def test_compare_says_which_model_uses_less_and_how_many_times(self):
        def row(model, electricity):
            return {"model": model, "company": "x", "electricity_wh": electricity, "carbon_g": 1.0,
                    "water_ml": 1.0, "primary_energy_kj": 1.0, "metals_ug_sb": 1.0}

        with patch.object(q, "resolve_model_name", side_effect=lambda m: m), \
             patch.object(q, "compare_many", return_value=[row("small", 1.0), row("big", 3.0)]):
            result = q.compare_models("big", "small")
        electricity = result["metrics"][0]
        self.assertEqual(electricity["uses_less"], "small")
        self.assertEqual(electricity["times_difference"], 3.0)

    def test_estimate_usage_scales_up_from_1000_tokens(self):
        row = {"model": "gpt-4o", "company": "openai", "electricity_wh": 2.0, "carbon_g": 1.0, "water_ml": 10.0}
        with patch.object(q, "compare_many", return_value=[row]):
            result = q.estimate_usage("gpt-4o", tokens_per_request=500, requests_per_day=1000, days=30)
        self.assertEqual(result["electricity_kwh"], 30.0)
        self.assertEqual(result["carbon_kg"], 15.0)
        self.assertEqual(result["water_litres"], 150.0)

    def test_csv_export_handles_commas_and_quotes(self):
        text = q.to_csv([{"model": 'Llama, "big"', "wh": 1.5}])
        self.assertEqual(text.splitlines(), ["model,wh", '"Llama, ""big""",1.5'])


if __name__ == "__main__":
    unittest.main()
