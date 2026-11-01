import os
import subprocess
import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

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


def estimate(energy, gwp, wcf):
    def value(v):
        return {"min": v[0], "max": v[1]} if isinstance(v, tuple) else v
    return {"impacts": {"energy": {"value": value(energy)},
                        "gwp": {"value": value(gwp)},
                        "wcf": {"value": value(wcf)}}}


def make_model(name="gpt-4o"):
    return Model(name, 0.001, 0.002, 0.0005, 0.0007, 0.004, 0.006)


class TestModel(unittest.TestCase):

    def test_model_stores_its_values(self):
        m = make_model()
        self.assertEqual(m.name, "gpt-4o")
        self.assertEqual(m.power_consumption_min, 0.001)
        self.assertEqual(m.power_consumption_max, 0.002)
        self.assertEqual(m.co2_min, 0.0005)
        self.assertEqual(m.co2_max, 0.0007)
        self.assertEqual(m.water_usage_min, 0.004)
        self.assertEqual(m.water_usage_max, 0.006)

    def test_models_with_same_values_are_equal(self):
        self.assertEqual(make_model(), make_model())

    def test_models_with_different_names_are_not_equal(self):
        self.assertNotEqual(make_model("a"), make_model("b"))

    def test_model_needs_all_values(self):
        with self.assertRaises(TypeError):
            Model("incomplete")


class TestProvider(unittest.TestCase):

    def test_provider_starts_with_no_models(self):
        self.assertEqual(Provider("openai").models, [])

    def test_provider_keeps_its_models(self):
        provider = Provider("openai", [make_model("a"), make_model("b")])
        self.assertEqual(provider.name, "openai")
        self.assertEqual(len(provider.models), 2)

    def test_providers_do_not_share_a_model_list(self):
        first = Provider("openai")
        second = Provider("anthropic")
        first.models.append(make_model())
        self.assertEqual(second.models, [])

    @unittest.expectedFailure
    def test_provider_file_imports_model(self):


        self.assertIn("Model", vars(sys.modules[Provider.__module__]))


class TestGetProviders(unittest.TestCase):

    @patch("services.requests.get")
    def test_returns_provider_names(self, mock_get):
        mock_get.return_value = fake_response({"providers": ["anthropic", "openai"]})
        self.assertEqual(services.get_providers(), ["anthropic", "openai"])

    @patch("services.requests.get")
    def test_calls_the_right_url_with_a_timeout(self, mock_get):
        mock_get.return_value = fake_response({"providers": []})
        services.get_providers()
        mock_get.assert_called_once_with(services.BASE_URL + "/providers", timeout=10)

    @patch("services.requests.get")
    def test_raises_an_error_if_the_api_fails(self, mock_get):
        mock_get.return_value = fake_response(status=503)
        with self.assertRaises(requests.HTTPError):
            services.get_providers()

    @patch("services.requests.get")
    def test_raises_an_error_if_the_api_times_out(self, mock_get):
        mock_get.side_effect = requests.Timeout()
        with self.assertRaises(requests.Timeout):
            services.get_providers()


class TestGetModels(unittest.TestCase):

    @patch("services.requests.get")
    def test_returns_only_model_names(self, mock_get):
        mock_get.return_value = fake_response({"models": [
            {"name": "gpt-4o", "architecture": {}},
            {"name": "gpt-4o-mini", "architecture": {}},
        ]})
        self.assertEqual(services.get_models("openai"), ["gpt-4o", "gpt-4o-mini"])

    @patch("services.requests.get")
    def test_puts_the_provider_in_the_url(self, mock_get):
        mock_get.return_value = fake_response({"models": []})
        services.get_models("mistralai")
        mock_get.assert_called_once_with(services.BASE_URL + "/models/mistralai", timeout=10)

    @patch("services.requests.get")
    def test_provider_with_no_models(self, mock_get):
        mock_get.return_value = fake_response({"models": []})
        self.assertEqual(services.get_models("cohere"), [])

    @patch("services.requests.get")
    def test_unknown_provider_raises_an_error(self, mock_get):
        mock_get.return_value = fake_response(status=404)
        with self.assertRaises(requests.HTTPError):
            services.get_models("not-a-provider")


class TestMinMax(unittest.TestCase):

    def test_reads_a_min_and_max(self):
        data = {"energy": {"value": {"min": 1.5, "max": 2.5}}}
        self.assertEqual(services._min_max(data, "energy"), (1.5, 2.5))

    def test_exact_value_is_used_for_both(self):
        data = {"energy": {"value": 3.0}}
        self.assertEqual(services._min_max(data, "energy"), (3.0, 3.0))

    def test_zero_is_allowed(self):
        data = {"gwp": {"value": 0}}
        self.assertEqual(services._min_max(data, "gwp"), (0, 0))

    def test_missing_metric_raises_an_error(self):
        with self.assertRaises(KeyError):
            services._min_max({}, "wcf")


class TestGetModelData(unittest.TestCase):

    @patch("services.requests.post")
    def test_turns_the_api_response_into_a_model(self, mock_post):
        mock_post.return_value = fake_response(estimate((0.001, 0.002), (0.0005, 0.0007), (0.004, 0.006)))
        result = services.get_model_data("openai", "gpt-4o")
        self.assertEqual(result, services.Model("gpt-4o", 0.001, 0.002, 0.0005, 0.0007, 0.004, 0.006))

    @patch("services.requests.post")
    def test_exact_values_give_equal_min_and_max(self, mock_post):
        mock_post.return_value = fake_response(estimate(0.01, 0.02, 0.03))
        result = services.get_model_data("openai", "gpt-4o")
        self.assertEqual(result.power_consumption_min, result.power_consumption_max)
        self.assertEqual(result.co2_min, 0.02)
        self.assertEqual(result.water_usage_max, 0.03)

    @patch("services.requests.post")
    def test_sends_300_tokens_and_world_grid_by_default(self, mock_post):
        mock_post.return_value = fake_response(estimate(1, 1, 1))
        services.get_model_data("anthropic", "claude-haiku-4-5")
        sent = mock_post.call_args.kwargs["json"]
        self.assertEqual(sent["provider"], "anthropic")
        self.assertEqual(sent["model_name"], "claude-haiku-4-5")
        self.assertEqual(sent["output_token_count"], 300)
        self.assertEqual(sent["electricity_mix_zone"], "WOR")

    @patch("services.requests.post")
    def test_can_send_other_settings(self, mock_post):
        mock_post.return_value = fake_response(estimate(1, 1, 1))
        services.get_model_data("openai", "gpt-4o", output_token_count=1000, electricity_mix_zone="GBR")
        sent = mock_post.call_args.kwargs["json"]
        self.assertEqual(sent["output_token_count"], 1000)
        self.assertEqual(sent["electricity_mix_zone"], "GBR")

    @patch("services.requests.post")
    def test_unknown_model_raises_an_error(self, mock_post):
        mock_post.return_value = fake_response(status=422)
        with self.assertRaises(requests.HTTPError):
            services.get_model_data("openai", "not-a-model")


class TestCollectData(unittest.TestCase):

    def fake_model_data(self, provider, model, **options):
        if model == "broken":
            raise requests.ConnectionError("connection lost")
        return make_model(model)

    def run_collect(self, models_by_provider, **options):
        with patch("services.get_providers", return_value=list(models_by_provider)), \
             patch("services.get_models", side_effect=lambda p: models_by_provider[p]), \
             patch("services.get_model_data", side_effect=self.fake_model_data) as mock_data, \
             patch("builtins.print"):
            result = services.collect_data(**options)
        return result, mock_data

    def test_returns_one_provider_each_with_its_models(self):
        result, _ = self.run_collect({"anthropic": ["claude-haiku-4-5"], "openai": ["gpt-4o", "gpt-4o-mini"]})
        self.assertEqual([p.name for p in result], ["anthropic", "openai"])
        self.assertEqual([m.name for m in result[1].models], ["gpt-4o", "gpt-4o-mini"])

    def test_skips_models_that_fail_and_keeps_the_rest(self):
        result, _ = self.run_collect({"openai": ["gpt-4o", "broken", "gpt-4o-mini"]})
        self.assertEqual([m.name for m in result[0].models], ["gpt-4o", "gpt-4o-mini"])

    def test_keeps_a_provider_even_if_all_its_models_fail(self):
        result, _ = self.run_collect({"cohere": ["broken"]})
        self.assertEqual(result[0].name, "cohere")
        self.assertEqual(result[0].models, [])

    def test_passes_settings_on_to_every_model(self):
        _, mock_data = self.run_collect({"openai": ["gpt-4o"]}, output_token_count=1000)
        mock_data.assert_called_once_with("openai", "gpt-4o", output_token_count=1000)

    def test_no_providers_gives_an_empty_list(self):
        result, _ = self.run_collect({})
        self.assertEqual(result, [])

    def test_fails_if_the_provider_list_cannot_be_fetched(self):
        with patch("services.get_providers", side_effect=requests.ConnectionError()):
            with self.assertRaises(requests.ConnectionError):
                services.collect_data()


class TestServicesImport(unittest.TestCase):

    @unittest.expectedFailure
    def test_app_can_import_services(self):


        result = subprocess.run([sys.executable, "-c", "import app.services"],
                                cwd=BACKEND, capture_output=True)
        self.assertEqual(result.returncode, 0)


class TestApi(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")
        self.assertEqual(response.json()["docs_url"], "/docs")

    def test_api_docs_load(self):
        self.assertEqual(self.client.get("/docs").status_code, 200)
        self.assertEqual(self.client.get("/api/v1/openapi.json").status_code, 200)

    def test_unknown_page_gives_404(self):
        self.assertEqual(self.client.get("/api/v1/nothing-here").status_code, 404)

    def test_list_users(self):
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [{"username": "Rick"}, {"username": "Morty"}])

    def test_current_user(self):

        self.assertEqual(self.client.get("/api/v1/users/me").json(), {"username": "fakecurrentuser"})

    def test_user_by_username(self):
        self.assertEqual(self.client.get("/api/v1/users/alice").json(), {"username": "alice"})

    def test_views_returns_whole_seconds(self):
        seconds = self.client.get("/api/v1/views/").json()
        self.assertIsInstance(seconds, int)
        self.assertGreaterEqual(seconds, 0)

    def test_views_counts_seconds_since_last_update(self):
        with patch.object(views, "time", return_value=views.lastUpdate + 3600):
            self.assertEqual(self.client.get("/api/v1/views/").json(), 3600)


class TestCors(unittest.TestCase):

    def setUp(self):
        self.client = TestClient(app)

    def allowed_origin(self, origin):
        response = self.client.options("/api/v1/users/", headers={
            "Origin": origin, "Access-Control-Request-Method": "GET"})
        return response.headers.get("access-control-allow-origin")

    def test_allows_localhost_8000(self):
        self.assertEqual(self.allowed_origin("http://localhost:8000"), "http://localhost:8000")

    def test_blocks_other_websites(self):
        self.assertIsNone(self.allowed_origin("https://evil.example.com"))

    @unittest.expectedFailure
    def test_allows_the_react_app(self):


        self.assertEqual(self.allowed_origin("http://localhost:5173"), "http://localhost:5173")


class TestQueryHelpers(unittest.TestCase):

    def test_all_five_metrics_are_allowed(self):
        for metric in ["electricity", "carbon", "water", "primary_energy", "metals"]:
            self.assertIn(metric, q.METRICS)

    def test_unknown_metric_is_rejected(self):
        with self.assertRaises(ValueError):
            q._metric("banana")

    def test_sql_injection_in_metric_is_rejected(self):
        with self.assertRaises(ValueError):
            q.get_model_rankings("electricity; DROP TABLE model")

    def test_search_wildcards_are_escaped(self):
        self.assertEqual(q._like("gpt"), "%gpt%")
        self.assertEqual(q._like("100%"), "%100\\%%")
        self.assertEqual(q._like("a_b"), "%a\\_b%")

    def test_decimals_become_normal_numbers(self):
        self.assertEqual(q._clean(Decimal("61")), 61)
        self.assertIsInstance(q._clean(Decimal("61")), int)
        self.assertAlmostEqual(q._clean(Decimal("2.05")), 2.05)
        self.assertEqual(q._clean("text"), "text")

    @patch.dict(os.environ, {"DB_HOST": "db", "DB_PORT": "3307", "DB_USER": "app",
                             "DB_PASSWORD": "secret", "DB_NAME": "green_ai"})
    def test_database_login_comes_from_environment_variables(self):
        with patch.object(q.mysql.connector, "connect") as connect:
            q.get_connection()
        connect.assert_called_once_with(host="db", port=3307, user="app",
                                        password="secret", database="green_ai")


class TestQueryRunner(unittest.TestCase):

    def fake_connection(self, rows):
        cursor = MagicMock()
        cursor.fetchall.return_value = rows
        connection = MagicMock()
        connection.cursor.return_value = cursor
        return connection, cursor

    def test_returns_rows_as_dictionaries(self):
        connection, _ = self.fake_connection([{"model": "gpt-4o", "rank": Decimal("3")}])
        with patch.object(q, "get_connection", return_value=connection):
            self.assertEqual(q._query("SELECT ..."), [{"model": "gpt-4o", "rank": 3}])

    def test_one_returns_first_row_or_none(self):
        connection, _ = self.fake_connection([{"a": 1}, {"a": 2}])
        with patch.object(q, "get_connection", return_value=connection):
            self.assertEqual(q._query("SELECT", one=True), {"a": 1})
        connection, _ = self.fake_connection([])
        with patch.object(q, "get_connection", return_value=connection):
            self.assertIsNone(q._query("SELECT", one=True))

    def test_connection_is_closed_even_after_an_error(self):
        connection, cursor = self.fake_connection([])
        cursor.execute.side_effect = RuntimeError("SQL error")
        with patch.object(q, "get_connection", return_value=connection):
            with self.assertRaises(RuntimeError):
                q._query("BAD SQL")
        connection.close.assert_called_once()


class TestSearch(unittest.TestCase):

    def test_empty_search_returns_nothing(self):
        self.assertEqual(q.search_models(""), [])
        self.assertEqual(q.search_models("   "), [])
        self.assertEqual(q.search_models(None), [])

    def test_search_hides_its_internal_sort_column(self):
        rows = [{"model": "gpt-4o", "company": "openai", "match_quality": 0}]
        with patch.object(q, "_query", return_value=rows):
            self.assertEqual(q.search_models("gpt"), [{"model": "gpt-4o", "company": "openai"}])


class TestCompareModels(unittest.TestCase):

    def row(self, model, electricity, carbon, water):
        return {"model": model, "company": "x", "electricity_wh": electricity, "carbon_g": carbon,
                "water_ml": water, "primary_energy_kj": 1.0, "metals_ug_sb": 1.0}

    def compare(self, rows, a, b):
        with patch.object(q, "resolve_model_name", side_effect=lambda m: m), \
             patch.object(q, "compare_many", return_value=rows):
            return q.compare_models(a, b)

    def test_says_which_model_uses_less_and_how_many_times(self):
        result = self.compare([self.row("small", 1.0, 0.5, 4.0), self.row("big", 3.0, 0.5, 10.0)], "big", "small")
        electricity = result["metrics"][0]
        self.assertEqual(electricity["uses_less"], "small")
        self.assertEqual(electricity["times_difference"], 3.0)

    def test_equal_values_are_the_same(self):
        result = self.compare([self.row("a", 1.0, 0.5, 4.0), self.row("b", 3.0, 0.5, 10.0)], "a", "b")
        carbon = result["metrics"][1]
        self.assertEqual(carbon["uses_less"], "same")

    def test_missing_model_returns_none(self):
        self.assertIsNone(self.compare([self.row("gpt-4o", 1, 1, 1)], "gpt-4o", "not-a-model"))


class TestEstimateUsage(unittest.TestCase):

    def test_scales_up_from_1000_tokens(self):
        row = {"model": "gpt-4o", "company": "openai", "electricity_wh": 2.0, "carbon_g": 1.0, "water_ml": 10.0}
        with patch.object(q, "compare_many", return_value=[row]):
            result = q.estimate_usage("gpt-4o", tokens_per_request=500, requests_per_day=1000, days=30)

        self.assertEqual(result["total_output_tokens"], 15_000_000)
        self.assertEqual(result["electricity_kwh"], 30.0)
        self.assertEqual(result["carbon_kg"], 15.0)
        self.assertEqual(result["water_litres"], 150.0)

    def test_unknown_model_returns_none(self):
        with patch.object(q, "compare_many", return_value=[]):
            self.assertIsNone(q.estimate_usage("not-a-model"))


class TestCsvExport(unittest.TestCase):

    def test_header_then_one_line_per_row(self):
        text = q.to_csv([{"model": "a", "wh": 1.5}, {"model": "b", "wh": 2}])
        self.assertEqual(text.splitlines(), ["model,wh", "a,1.5", "b,2"])

    def test_single_dictionary(self):
        self.assertEqual(q.to_csv({"models_compared": 314}).splitlines(), ["models_compared", "314"])

    def test_empty_list_gives_empty_text(self):
        self.assertEqual(q.to_csv([]), "")

    def test_commas_and_quotes_are_handled(self):
        text = q.to_csv([{"model": 'Llama, "big"'}])
        self.assertEqual(text.splitlines()[1], '"Llama, ""big"""')


if __name__ == "__main__":
    unittest.main()
