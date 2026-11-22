import io
import os
import sys
import tempfile
import time
import unittest
from contextlib import redirect_stdout
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

import requests

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

# Swap the MySQL engine for in-memory SQLite BEFORE anything else in `app`
# is imported. app.database and app.main copy these names at import time.

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.databaseConfig as dbConfig

TEST_ENGINE = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=TEST_ENGINE)
dbConfig.engine = TEST_ENGINE
dbConfig.SessionLocal = TestSessionLocal

from app import database, services, utils  # noqa: E402
from app.models.customModel import CustomModel  # noqa: E402
from app.models.model import Model  # noqa: E402
from app.models.provider import Provider  # noqa: E402
from app.models.savedModel import SavedModel  # noqa: E402
from app.models.user import User  # noqa: E402
from app.sessionManager import SessionManager  # noqa: E402
import app.routers.views as views  # noqa: E402

# app.main syncs with EcoLogits on import - stop it touching the network.
with patch("app.services.collect_data", return_value=[]), redirect_stdout(io.StringIO()):
    from app.main import app as fastapi_app  # noqa: E402

from fastapi.testclient import TestClient  # noqa: E402

import ecologits_queries as q  # noqa: E402

Base = dbConfig.Base

# Helpers

def fake_response(data=None, status=200):
    """A stand-in for a requests.Response."""
    response = Mock()
    response.status_code = status
    response.json.return_value = data
    if status >= 400:
        response.raise_for_status.side_effect = requests.HTTPError(f"{status} Error")
    else:
        response.raise_for_status.return_value = None
    return response


def make_model(name, power=1.0, co2=2.0, water=3.0):
    return Model(Name=name, Power_Consumption=power, Co2=co2, Water_Usage=water)


def make_provider(name, *models):
    return Provider(Name=name, Models=list(models))


class DatabaseTestCase(unittest.TestCase):
    """Gives every test a fresh, empty SQLite database."""

    def setUp(self):
        Base.metadata.drop_all(bind=TEST_ENGINE)
        Base.metadata.create_all(bind=TEST_ENGINE)
        self.db = TestSessionLocal()

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=TEST_ENGINE)


class ApiTestCase(DatabaseTestCase):
    """A TestClient wired to the test database with a fresh SessionManager."""

    def setUp(self):
        super().setUp()

        def override_get_database():
            db = TestSessionLocal()
            try:
                yield db
            finally:
                db.close()

        fastapi_app.dependency_overrides[database.getDatabase] = override_get_database
        self._old_manager = fastapi_app.state.sessionManager
        fastapi_app.state.sessionManager = SessionManager(expiryHours=24)
        self.sessions = fastapi_app.state.sessionManager
        # https so the `secure` session cookie is sent back by the client
        self.client = TestClient(fastapi_app, base_url="https://testserver")

    def tearDown(self):
        fastapi_app.dependency_overrides.clear()
        fastapi_app.state.sessionManager = self._old_manager
        super().tearDown()

    def register(self, email="user@example.com", password="hunter22"):
        return self.client.post("/api/v1/users/register",
                                json={"email": email, "password": password})

    def login(self, email="user@example.com", password="hunter22"):
        return self.client.post("/api/v1/users/login",
                                json={"email": email, "password": password})

    def register_and_login(self, email="user@example.com", password="hunter22"):
        user_id = self.register(email, password).json()["id"]
        self.login(email, password)
        return user_id

    def add_provider(self, name, *models):
        provider = make_provider(name, *models)
        self.db.add(provider)
        self.db.commit()
        self.db.refresh(provider)
        return provider

# SessionManager

class TestSessionManager(unittest.TestCase):

    def setUp(self):
        self.manager = SessionManager(expiryHours=1)

    def test_each_session_id_is_unique(self):
        ids = {self.manager.createSession(1) for _ in range(100)}
        self.assertEqual(len(ids), 100)

    def test_created_session_is_valid_and_belongs_to_the_user(self):
        sid = self.manager.createSession(42)
        self.assertTrue(self.manager.validateSession(sid))
        self.assertEqual(self.manager.getUserID(sid), 42)

    def test_unknown_session_is_invalid(self):
        self.assertFalse(self.manager.validateSession("not-a-session"))
        self.assertIsNone(self.manager.getUserID("not-a-session"))

    def test_session_is_valid_just_before_expiry(self):
        with patch("app.sessionManager.time.time", return_value=1000.0):
            sid = self.manager.createSession(1)
        with patch("app.sessionManager.time.time", return_value=1000.0 + 3599):
            self.assertTrue(self.manager.validateSession(sid))
            self.assertEqual(self.manager.getUserID(sid), 1)

    def test_validate_rejects_and_removes_expired_session(self):
        with patch("app.sessionManager.time.time", return_value=1000.0):
            sid = self.manager.createSession(1)
        with patch("app.sessionManager.time.time", return_value=1000.0 + 3600):
            self.assertFalse(self.manager.validateSession(sid))
        self.assertNotIn(sid, self.manager.sessions)

    def test_get_user_id_returns_none_and_removes_expired_session(self):
        with patch("app.sessionManager.time.time", return_value=1000.0):
            sid = self.manager.createSession(1)
        with patch("app.sessionManager.time.time", return_value=5000.0):
            self.assertIsNone(self.manager.getUserID(sid))
        self.assertNotIn(sid, self.manager.sessions)

    def test_delete_session_logs_the_user_out(self):
        sid = self.manager.createSession(1)
        self.manager.deleteSession(sid)
        self.assertFalse(self.manager.validateSession(sid))

    def test_delete_only_removes_the_given_session(self):
        a = self.manager.createSession(1)
        b = self.manager.createSession(2)
        self.manager.deleteSession(a)
        self.assertEqual(self.manager.getUserID(b), 2)

    def test_cleanup_removes_only_expired_sessions(self):
        with patch("app.sessionManager.time.time", return_value=1000.0):
            old = self.manager.createSession(1)
        with patch("app.sessionManager.time.time", return_value=4000.0):
            fresh = self.manager.createSession(2)
        with patch("app.sessionManager.time.time", return_value=4700.0):
            self.manager.cleanup()
        self.assertNotIn(old, self.manager.sessions)
        self.assertIn(fresh, self.manager.sessions)

# services.py (EcoLogits API client)

class TestServices(unittest.TestCase):

    @patch("app.services.requests.get")
    def test_get_providers_returns_provider_names(self, mock_get):
        mock_get.return_value = fake_response({"providers": ["anthropic", "openai"]})
        self.assertEqual(services.get_providers(), ["anthropic", "openai"])
        mock_get.assert_called_once_with(f"{services.BASE_URL}/providers", timeout=10)

    @patch("app.services.requests.get")
    def test_get_providers_raises_when_api_fails(self, mock_get):
        mock_get.return_value = fake_response(status=503)
        with self.assertRaises(requests.HTTPError):
            services.get_providers()

    @patch("app.services.requests.get")
    def test_get_models_returns_just_the_names(self, mock_get):
        mock_get.return_value = fake_response({"models": [
            {"name": "gpt-4o", "other": 1}, {"name": "gpt-4o-mini"}]})
        self.assertEqual(services.get_models("openai"), ["gpt-4o", "gpt-4o-mini"])
        mock_get.assert_called_once_with(f"{services.BASE_URL}/models/openai", timeout=10)

    @patch("app.services.requests.get")
    def test_get_models_raises_when_api_fails(self, mock_get):
        mock_get.return_value = fake_response(status=404)
        with self.assertRaises(requests.HTTPError):
            services.get_models("nobody")

    def test_min_max_with_range(self):
        impacts = {"energy": {"value": {"min": 1.0, "max": 3.0}}}
        self.assertEqual(services._min_max(impacts, "energy"), (1.0, 3.0))

    def test_min_max_with_exact_value(self):
        impacts = {"energy": {"value": 2.5}}
        self.assertEqual(services._min_max(impacts, "energy"), (2.5, 2.5))

    def test_midpoint_of_range(self):
        impacts = {"gwp": {"value": {"min": 1.0, "max": 4.0}}}
        self.assertEqual(services._midpoint(impacts, "gwp"), 2.5)

    @patch("app.services.requests.post")
    def test_get_model_data_builds_a_model_from_midpoints(self, mock_post):
        mock_post.return_value = fake_response({"impacts": {
            "energy": {"value": {"min": 0.001, "max": 0.003}},
            "gwp": {"value": {"min": 0.0004, "max": 0.0006}},
            "wcf": {"value": 0.01},
        }})
        model = services.get_model_data("openai", "gpt-4o")
        self.assertIsInstance(model, Model)
        self.assertEqual(model.Name, "gpt-4o")
        self.assertAlmostEqual(model.Power_Consumption, 0.002)
        self.assertAlmostEqual(model.Co2, 0.0005)
        self.assertAlmostEqual(model.Water_Usage, 0.01)

    @patch("app.services.requests.post")
    def test_get_model_data_sends_the_right_request(self, mock_post):
        mock_post.return_value = fake_response({"impacts": {
            k: {"value": 1} for k in ("energy", "gwp", "wcf")}})
        services.get_model_data("anthropic", "claude", output_token_count=500,
                                electricity_mix_zone="FRA")
        args, kwargs = mock_post.call_args
        self.assertEqual(args[0], f"{services.BASE_URL}/estimations")
        self.assertEqual(kwargs["json"], {
            "provider": "anthropic", "model_name": "claude",
            "output_token_count": 500, "electricity_mix_zone": "FRA"})
        self.assertEqual(kwargs["headers"]["Content-Type"], "application/json")
        self.assertEqual(kwargs["timeout"], 10)

    @patch("app.services.requests.post")
    def test_get_model_data_raises_when_api_fails(self, mock_post):
        mock_post.return_value = fake_response(status=500)
        with self.assertRaises(requests.HTTPError):
            services.get_model_data("openai", "gpt-4o")

    def test_get_provider_data_collects_every_model(self):
        with patch("app.services.get_models", return_value=["a", "b"]), \
             patch("app.services.get_model_data",
                   side_effect=lambda p, m: make_model(m)) as get_data:
            provider = services.get_provider_data("openai")
        self.assertIsInstance(provider, Provider)
        self.assertEqual(provider.Name, "openai")
        self.assertEqual([m.Name for m in provider.Models], ["a", "b"])
        get_data.assert_any_call("openai", "a")
        get_data.assert_any_call("openai", "b")

    def test_collect_data_returns_one_provider_per_name(self):
        with patch("app.services.get_providers", return_value=["openai", "anthropic"]), \
             patch("app.services.get_provider_data",
                   side_effect=lambda name: make_provider(name)), \
             redirect_stdout(io.StringIO()):
            result = services.collect_data()
        self.assertEqual([p.Name for p in result], ["openai", "anthropic"])

    def test_collect_data_propagates_api_errors(self):
        with patch("app.services.get_providers", side_effect=requests.ConnectionError()):
            with self.assertRaises(requests.ConnectionError):
                services.collect_data()

# utils.compareProvidersAndModels

class TestCompareProvidersAndModels(unittest.TestCase):

    def compare(self, a, b):
        with redirect_stdout(io.StringIO()):
            return utils.compareProvidersAndModels(a, b)

    def sample(self, power=1.0, co2=2.0, water=3.0):
        return [
            make_provider("openai", make_model("gpt-4o", power, co2, water),
                          make_model("gpt-4o-mini")),
            make_provider("anthropic", make_model("claude")),
        ]

    def test_identical_lists_match(self):
        self.assertTrue(self.compare(self.sample(), self.sample()))

    def test_empty_lists_match(self):
        self.assertTrue(self.compare([], []))

    def test_order_of_providers_and_models_does_not_matter(self):
        a = self.sample()
        b = list(reversed(self.sample()))
        b[1].Models = list(reversed(b[1].Models))
        self.assertTrue(self.compare(a, b))

    def test_empty_versus_data_does_not_match(self):
        self.assertFalse(self.compare(self.sample(), []))
        self.assertFalse(self.compare([], self.sample()))

    def test_different_provider_names_do_not_match(self):
        b = self.sample()
        b[1].Name = "google"
        self.assertFalse(self.compare(self.sample(), b))

    def test_extra_model_does_not_match(self):
        b = self.sample()
        b[1].Models.append(make_model("claude-2"))
        self.assertFalse(self.compare(self.sample(), b))

    def test_power_change_does_not_match(self):
        self.assertFalse(self.compare(self.sample(power=1.0), self.sample(power=1.1)))

    def test_tiny_floating_point_differences_still_match(self):
        self.assertTrue(self.compare(self.sample(power=0.1 + 0.2), self.sample(power=0.3)))

    def test_duplicate_provider_count_matters(self):
        a = [make_provider("x"), make_provider("x")]
        b = [make_provider("x")]
        self.assertFalse(self.compare(a, b))

# database.py (CRUD helpers) against SQLite

class TestDatabase(DatabaseTestCase):

    def save_sample(self):
        providers = [
            make_provider("openai", make_model("gpt-4o", 1, 1, 1), make_model("gpt-4o-mini")),
            make_provider("anthropic", make_model("claude-3-opus")),
        ]
        return database.saveAllProvidersAndModels(self.db, providers)

    def test_get_database_yields_a_session_and_closes_it(self):
        session = MagicMock()
        with patch.object(database, "SessionLocal", return_value=session):
            gen = database.getDatabase()
            self.assertIs(next(gen), session)
            session.close.assert_not_called()
            with self.assertRaises(StopIteration):
                next(gen)
        session.close.assert_called_once()

    def test_save_all_assigns_ids_and_links_models(self):
        providers = self.save_sample()
        for p in providers:
            self.assertIsNotNone(p.id)
            for m in p.Models:
                self.assertEqual(m.Provider_ID, p.id)
        self.assertEqual(self.db.query(Model).count(), 3)
        self.assertEqual(self.db.query(Provider).count(), 2)

    def test_save_all_rolls_back_and_reraises_on_error(self):
        db = MagicMock()
        db.commit.side_effect = RuntimeError("db down")
        with redirect_stdout(io.StringIO()), self.assertRaises(RuntimeError):
            database.saveAllProvidersAndModels(db, [make_provider("x")])
        db.rollback.assert_called_once()

    def test_read_provider_list(self):
        self.assertEqual(database.readProviderList(self.db), [])
        self.save_sample()
        names = sorted(p.Name for p in database.readProviderList(self.db))
        self.assertEqual(names, ["anthropic", "openai"])

    def test_read_provider_by_id(self):
        providers = self.save_sample()
        self.assertEqual(database.readProvider(self.db, providers[0].id).Name, "openai")
        self.assertIsNone(database.readProvider(self.db, 9999))

    def test_read_provider_by_name(self):
        self.save_sample()
        self.assertEqual(database.readProviderByName(self.db, "anthropic").Name, "anthropic")
        self.assertIsNone(database.readProviderByName(self.db, "google"))

    def test_read_models_by_provider(self):
        providers = self.save_sample()
        names = sorted(m.Name for m in database.readModelsByProvider(self.db, providers[0].id))
        self.assertEqual(names, ["gpt-4o", "gpt-4o-mini"])
        self.assertEqual(database.readModelsByProvider(self.db, 9999), [])

    def test_read_model_by_id(self):
        providers = self.save_sample()
        model_id = providers[1].Models[0].id
        self.assertEqual(database.readModel(self.db, model_id).Name, "claude-3-opus")
        self.assertIsNone(database.readModel(self.db, 9999))

    def test_search_model_matches_substrings_sorted_by_name(self):
        self.save_sample()
        self.assertEqual([m.Name for m in database.searchModel(self.db, "gpt")],
                         ["gpt-4o", "gpt-4o-mini"])
        self.assertEqual([m.Name for m in database.searchModel(self.db, "opus")],
                         ["claude-3-opus"])

    def test_search_model_escapes_wildcards(self):
        self.save_sample()
        self.assertEqual(database.searchModel(self.db, "%"), [])
        self.assertEqual(database.searchModel(self.db, "gpt_4o"), [])

    def test_delete_all_removes_models_and_providers(self):
        db = MagicMock()
        with redirect_stdout(io.StringIO()):
            database.deleteAllProvidersAndModels(db)
        queried = [c.args[0] for c in db.query.call_args_list]
        self.assertEqual(queried, [Model, Provider])
        self.assertEqual(db.execute.call_count, 2)  # two AUTO_INCREMENT resets
        db.commit.assert_called_once()
        db.rollback.assert_not_called()

    def test_delete_all_rolls_back_and_reraises_on_error(self):
        db = MagicMock()
        db.commit.side_effect = RuntimeError("fail")
        with redirect_stdout(io.StringIO()), self.assertRaises(RuntimeError):
            database.deleteAllProvidersAndModels(db)
        db.rollback.assert_called_once()

    def test_write_and_read_user(self):
        database.writeUser(self.db, User(email="a@b.com", password="hash"))
        user = database.readUser(self.db, "a@b.com")
        self.assertIsNotNone(user.id)
        self.assertEqual(user.password, "hash")
        self.assertIsNone(database.readUser(self.db, "missing@b.com"))

    def test_user_email_must_be_unique(self):
        from sqlalchemy.exc import IntegrityError
        database.writeUser(self.db, User(email="a@b.com", password="x"))
        with self.assertRaises(IntegrityError):
            database.writeUser(self.db, User(email="a@b.com", password="y"))

    def _user(self, email="a@b.com"):
        user = User(email=email, password="x")
        database.writeUser(self.db, user)
        return user

    def test_custom_models_are_stored_per_user(self):
        alice, bob = self._user("alice@x.com"), self._user("bob@x.com")
        database.writeCustomModel(self.db, CustomModel(
            Name="mine", Power_Consumption=1, Co2=2, Water_Usage=3, User_ID=alice.id))
        database.writeCustomModel(self.db, CustomModel(
            Name="bobs", Power_Consumption=1, Co2=2, Water_Usage=3, User_ID=bob.id))
        self.assertEqual([c.Name for c in database.readCustomModelsByUser(self.db, alice.id)],
                         ["mine"])
        self.assertEqual(database.readCustomModelsByUser(self.db, 9999), [])

    def test_read_and_search_custom_model(self):
        user = self._user()
        cm = CustomModel(Name="My Model", Power_Consumption=1, Co2=2, Water_Usage=3,
                         User_ID=user.id)
        database.writeCustomModel(self.db, cm)
        self.assertEqual(database.readCustomModel(self.db, cm.id).Name, "My Model")
        self.assertIsNone(database.readCustomModel(self.db, 9999))
        self.assertEqual(len(database.searchCustomModel(self.db, "Model")), 1)
        self.assertEqual(database.searchCustomModel(self.db, "zzz"), [])

    def test_saved_models_are_stored_per_user(self):
        alice, bob = self._user("alice@x.com"), self._user("bob@x.com")
        database.writeSavedModel(self.db, SavedModel(
            ModelName="gpt-4o", ModelProvider="openai", User_ID=alice.id))
        saved = database.readSavedModelsByUser(self.db, alice.id)
        self.assertEqual([(s.ModelName, s.ModelProvider) for s in saved],
                         [("gpt-4o", "openai")])
        self.assertEqual(database.readSavedModelsByUser(self.db, bob.id), [])

# views.updateModelsAndProviders (daily data sync)

class TestUpdateModelsAndProviders(unittest.TestCase):

    def run_update(self, new, saved, same):
        db = Mock()
        with patch.object(views.services, "collect_data", return_value=new), \
             patch.object(views.database, "readProviderList", return_value=saved), \
             patch.object(views, "compareProvidersAndModels", return_value=same) as cmp, \
             patch.object(views.database, "deleteAllProvidersAndModels") as delete, \
             patch.object(views.database, "saveAllProvidersAndModels") as save, \
             redirect_stdout(io.StringIO()):
            views.updateModelsAndProviders(db)
        return db, cmp, delete, save

    def test_nothing_is_rewritten_when_data_is_unchanged(self):
        _, cmp, delete, save = self.run_update(["new"], ["saved"], same=True)
        cmp.assert_called_once_with(["new"], ["saved"])
        delete.assert_not_called()
        save.assert_not_called()

    def test_data_is_replaced_when_it_changed(self):
        db, _, delete, save = self.run_update(["new"], ["saved"], same=False)
        delete.assert_called_once_with(db)
        save.assert_called_once_with(db, ["new"])

    def test_api_failure_leaves_database_untouched(self):
        with patch.object(views.services, "collect_data", side_effect=requests.ConnectionError), \
             patch.object(views.database, "deleteAllProvidersAndModels") as delete:
            with self.assertRaises(requests.ConnectionError):
                views.updateModelsAndProviders(Mock())
        delete.assert_not_called()

# API: health check, CORS, views

class TestGeneralApi(ApiTestCase):

    def test_health_check(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "healthy")
        self.assertEqual(body["docs_url"], "/docs")
        self.assertIn("project", body)

    def cors_origin(self, origin):
        response = self.client.options("/api/v1/providers/", headers={
            "Origin": origin, "Access-Control-Request-Method": "GET"})
        return response.headers.get("access-control-allow-origin")

    def test_cors_allows_the_listed_origins(self):
        self.assertEqual(self.cors_origin("http://localhost:8000"), "http://localhost:8000")
        self.assertEqual(self.cors_origin("http://127.0.0.1:8000"), "http://127.0.0.1:8000")

    def test_cors_blocks_other_websites(self):
        self.assertIsNone(self.cors_origin("https://evil.example.com"))

    def test_views_does_not_sync_before_refresh_delay(self):
        with patch.object(views, "time", return_value=views.lastUpdate + 10), \
             patch.object(views, "updateModelsAndProviders") as update:
            response = self.client.get("/api/v1/views/")
        self.assertEqual(response.status_code, 200)
        update.assert_not_called()

    def test_views_syncs_after_refresh_delay(self):
        with patch.object(views, "time", return_value=views.lastUpdate + views.refreshDelay + 1), \
             patch.object(views, "updateModelsAndProviders") as update:
            self.client.get("/api/v1/views/")
        update.assert_called_once()

    def test_views_only_syncs_once_per_refresh_period(self):
        # lastUpdate is never reset, so every request after 24h triggers a full sync
        later = views.lastUpdate + views.refreshDelay + 1
        with patch.object(views, "time", return_value=later), \
             patch.object(views, "updateModelsAndProviders") as update:
            self.client.get("/api/v1/views/")
            self.client.get("/api/v1/views/")
        self.assertEqual(update.call_count, 1)

# API: users (register / login)

class TestUsersApi(ApiTestCase):

    def test_register_returns_id_and_email(self):
        response = self.register("new@example.com")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["email"], "new@example.com")
        self.assertIsInstance(body["id"], int)
        self.assertNotIn("password", body)

    def test_register_lowercases_email(self):
        self.assertEqual(self.register("MiXeD@Example.COM").json()["email"], "mixed@example.com")

    def test_password_is_hashed_not_stored_in_plain_text(self):
        self.register("a@b.com", "plaintext-pw")
        user = database.readUser(TestSessionLocal(), "a@b.com")
        self.assertNotEqual(user.password, "plaintext-pw")
        self.assertNotIn("plaintext-pw", user.password)

    def test_duplicate_email_is_rejected(self):
        self.register("dup@example.com")
        response = self.register("dup@example.com")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Email is already registered")

    def test_duplicate_email_check_ignores_case(self):
        self.register("dup@example.com")
        self.assertEqual(self.register("DUP@example.com").status_code, 400)

    def test_register_requires_email_and_password(self):
        self.assertEqual(self.client.post("/api/v1/users/register",
                                          json={"email": "a@b.com"}).status_code, 422)
        self.assertEqual(self.client.post("/api/v1/users/register",
                                          json={"password": "x"}).status_code, 422)
        self.assertEqual(self.client.post("/api/v1/users/register").status_code, 422)

    def test_login_with_correct_password_sets_session_cookie(self):
        self.register("a@b.com", "pw123")
        response = self.login("a@b.com", "pw123")
        self.assertEqual(response.status_code, 200)
        cookie = response.headers.get("set-cookie", "")
        self.assertIn("sessionID=", cookie)
        self.assertIn("HttpOnly", cookie)
        self.assertIn("Secure", cookie)
        self.assertIn("samesite=lax", cookie.lower())
        self.assertIn("Max-Age=86400", cookie)

    def test_login_cookie_is_a_valid_session_for_that_user(self):
        user_id = self.register("a@b.com", "pw123").json()["id"]
        response = self.login("a@b.com", "pw123")
        sid = response.cookies.get("sessionID")
        self.assertTrue(self.sessions.validateSession(sid))
        self.assertEqual(self.sessions.getUserID(sid), user_id)

    def test_login_email_is_case_insensitive(self):
        self.register("a@b.com", "pw123")
        self.assertEqual(self.login("A@B.COM", "pw123").status_code, 200)

    def test_login_with_wrong_password_is_rejected(self):
        self.register("a@b.com", "pw123")
        response = self.login("a@b.com", "wrong")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid email or password")
        self.assertNotIn("sessionID", response.headers.get("set-cookie", ""))

    def test_login_with_unknown_email_gives_same_error(self):
        response = self.login("nobody@b.com", "pw123")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid email or password")

# API: providers

class TestProvidersApi(ApiTestCase):

    def test_list_providers_empty(self):
        response = self.client.get("/api/v1/providers/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_list_providers_returns_id_and_name_only(self):
        p = self.add_provider("openai", make_model("gpt-4o"))
        self.assertEqual(self.client.get("/api/v1/providers/").json(),
                         [{"id": p.id, "Name": "openai"}])

    def test_list_provider_models(self):
        p = self.add_provider("openai", make_model("gpt-4o", 0.1, 0.2, 0.3))
        self.add_provider("anthropic", make_model("claude"))
        response = self.client.get("/api/v1/providers/openai/models")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(len(body), 1)
        self.assertEqual(body[0]["Name"], "gpt-4o")
        self.assertEqual(body[0]["Provider_ID"], p.id)
        self.assertEqual((body[0]["Power_Consumption"], body[0]["Co2"], body[0]["Water_Usage"]),
                         (0.1, 0.2, 0.3))

    
    def test_unknown_provider_returns_404(self):
        # readProviderByName returns None, then `.id` crashes with a 500
        client = TestClient(fastapi_app, base_url="https://testserver",
                            raise_server_exceptions=False)
        self.assertEqual(client.get("/api/v1/providers/nobody/models").status_code, 404)

# API: models (search, get, saved models)

class TestModelsApi(ApiTestCase):

    def setUp(self):
        super().setUp()
        self.provider = self.add_provider(
            "openai", make_model("gpt-4o", 0.1, 0.2, 0.3), make_model("gpt-4o-mini"))
        self.add_provider("anthropic", make_model("claude-3-opus"))

    def test_search_returns_matching_models_with_provider(self):
        response = self.client.get("/api/v1/models/search", params={"Name": "gpt"})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual([m["Name"] for m in body], ["gpt-4o", "gpt-4o-mini"])
        self.assertEqual(body[0]["Provider"], {"id": self.provider.id, "Name": "openai"})
        self.assertEqual(body[0]["Power_Consumption"], 0.1)

    def test_search_requires_at_least_two_characters(self):
        self.assertEqual(self.client.get("/api/v1/models/search",
                                         params={"Name": "g"}).status_code, 422)

    
    def test_get_model_by_id(self):
        # The route is declared as "/{modelID : int}" - the spaces stop Starlette
        # treating it as a path parameter, so /models/1 is never matched.
        model_id = self.provider.Models[0].id
        response = self.client.get(f"/api/v1/models/{model_id}")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["Name"], "gpt-4o")

    # ---- saved models ----

    def save(self, name="gpt-4o", provider="openai"):
        return self.client.post("/api/v1/models/saveModel",
                                json={"modelName": name, "modelProvider": provider})

    def test_save_model_requires_login(self):
        self.assertEqual(self.save().status_code, 401)
        self.assertEqual(self.save().json()["detail"], "Not authenticated")

    def test_save_model_rejects_invalid_session(self):
        self.client.cookies.set("sessionID", "forged")
        response = self.save()
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid or expired session")

    def test_save_model_rejects_expired_session(self):
        self.register_and_login()
        with patch("app.sessionManager.time.time", return_value=time.time() + 90000):
            self.assertEqual(self.save().status_code, 401)

    def test_save_model_validates_body(self):
        self.register_and_login()
        response = self.client.post("/api/v1/models/saveModel", json={"modelName": "x"})
        self.assertEqual(response.status_code, 422)

    def test_saved_models_round_trip(self):
        self.register_and_login()
        self.assertEqual(self.save("gpt-4o", "openai").status_code, 200)
        self.assertEqual(self.save("claude-3-opus", "anthropic").status_code, 200)
        response = self.client.get("/api/v1/models/viewSavedModels")
        self.assertEqual(response.status_code, 200)
        saved = {(m["ModelName"], m["ModelProvider"]) for m in response.json()}
        self.assertEqual(saved, {("gpt-4o", "openai"), ("claude-3-opus", "anthropic")})

    def test_saved_models_are_private_to_each_user(self):
        self.register_and_login("alice@x.com")
        self.save()
        self.client.cookies.clear()
        self.register_and_login("bob@x.com")
        self.assertEqual(self.client.get("/api/v1/models/viewSavedModels").json(), [])

    def test_view_saved_models_requires_login(self):
        self.assertEqual(self.client.get("/api/v1/models/viewSavedModels").status_code, 401)

# API: custom models

class TestCustomModelsApi(ApiTestCase):

    PAYLOAD = {"name": "My model", "powerConsumption": 0.1234567,
               "waterUsage": 2.0, "Co2": 0.5}

    def test_save_requires_login(self):
        response = self.client.post("/api/v1/customModels/save", json=self.PAYLOAD)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Not authenticated")

    def test_save_rejects_invalid_session(self):
        self.client.cookies.set("sessionID", "forged")
        response = self.client.post("/api/v1/customModels/save", json=self.PAYLOAD)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Invalid or expired session")

    def test_save_validates_numbers(self):
        self.register_and_login()
        bad = dict(self.PAYLOAD, powerConsumption="lots")
        self.assertEqual(self.client.post("/api/v1/customModels/save", json=bad).status_code, 422)

    
    def test_save_custom_model_succeeds(self):
        # saveCustomModel calls round() on the name (a string), which raises TypeError
        user_id = self.register_and_login()
        client = TestClient(fastapi_app, base_url="https://testserver",
                            raise_server_exceptions=False, cookies=self.client.cookies)
        response = client.post("/api/v1/customModels/save", json=self.PAYLOAD)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"custom": True})
        saved = database.readCustomModelsByUser(TestSessionLocal(), user_id)
        self.assertEqual(saved[0].Name, "My model")

    def test_get_all_requires_login(self):
        self.assertEqual(self.client.get("/api/v1/customModels/getAll").status_code, 401)

    def test_get_all_returns_only_this_users_models(self):
        user_id = self.register_and_login("alice@x.com")
        other = User(email="bob@x.com", password="x")
        database.writeUser(self.db, other)
        database.writeCustomModel(self.db, CustomModel(
            Name="alice-model", Power_Consumption=1, Co2=2, Water_Usage=3, User_ID=user_id))
        database.writeCustomModel(self.db, CustomModel(
            Name="bob-model", Power_Consumption=1, Co2=2, Water_Usage=3, User_ID=other.id))
        response = self.client.get("/api/v1/customModels/getAll")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([m["Name"] for m in response.json()], ["alice-model"])

# ecologits_queries.py (pure logic, database calls mocked)

def row(model, electricity=1.0, carbon=1.0, water=1.0, pe=1.0, metals=1.0, company="x"):
    return {"model": model, "company": company, "electricity_wh": electricity,
            "carbon_g": carbon, "water_ml": water, "primary_energy_kj": pe,
            "metals_ug_sb": metals}


class TestQueryHelpers(unittest.TestCase):

    def test_metric_lookup(self):
        self.assertEqual(q._metric("electricity")[0], "EnergyKwh")
        self.assertEqual(q._metric("metals")[1], 1_000_000_000)

    def test_unknown_metric_raises_value_error(self):
        with self.assertRaises(ValueError) as ctx:
            q._metric("electricity; DROP TABLE model")
        self.assertIn("Choose from", str(ctx.exception))

    def test_clean_converts_decimals(self):
        self.assertEqual(q._clean(Decimal("5")), 5)
        self.assertIsInstance(q._clean(Decimal("5")), int)
        self.assertEqual(q._clean(Decimal("1.25")), 1.25)
        self.assertIsInstance(q._clean(Decimal("1.25")), float)

    def test_like_wraps_and_escapes(self):
        self.assertEqual(q._like("gpt"), "%gpt%")
        self.assertEqual(q._like("50%_off\\"), "%50\\%\\_off\\\\%")

    def test_query_returns_cleaned_rows(self):
        cursor = MagicMock()
        cursor.fetchall.return_value = [{"a": Decimal("2"), "b": "x"}]
        conn = MagicMock()
        conn.cursor.return_value = cursor
        with patch.object(q, "get_connection", return_value=conn):
            self.assertEqual(q._query("SELECT 1"), [{"a": 2, "b": "x"}])
            self.assertEqual(q._query("SELECT 1", one=True), {"a": 2, "b": "x"})
        cursor.execute.assert_called_with("SELECT 1", ())
        conn.close.assert_called()
        cursor.close.assert_called()

    @patch.dict(os.environ, {"DB_HOST": "db", "DB_PORT": "3307", "DB_USER": "app",
                             "DB_PASSWORD": "pw", "DB_NAME": "green"})
    def test_connection_uses_environment(self):
        with patch.object(q.mysql.connector, "connect") as connect:
            q.get_connection()
        connect.assert_called_once_with(host="db", port=3307, user="app",
                                        password="pw", database="green")

    def test_resolve_model_name_uses_alias(self):
        with patch.object(q, "_query", return_value={"SameAs": "gpt-4o"}):
            self.assertEqual(q.resolve_model_name("gpt-4o-2024-05-13"), "gpt-4o")

    def test_resolve_model_name_falls_back_to_input(self):
        with patch.object(q, "_query", return_value=None):
            self.assertEqual(q.resolve_model_name("gpt-4o"), "gpt-4o")


class TestQueryLogic(unittest.TestCase):

    def setUp(self):
        patcher = patch.object(q, "resolve_model_name", side_effect=lambda m: m)
        patcher.start()
        self.addCleanup(patcher.stop)

    def test_rankings_reject_bad_metric_before_querying(self):
        with patch.object(q, "_query") as query:
            with self.assertRaises(ValueError):
                q.get_model_rankings("bogus")
        query.assert_not_called()

    def test_rankings_add_limit_and_direction(self):
        with patch.object(q, "_query", return_value=[]) as query:
            q.get_model_rankings("carbon", most_first=True, provider="openai", limit="5")
        sql, params = query.call_args.args
        self.assertIn("GwpKg", sql)
        self.assertIn("DESC", sql)
        self.assertIn("LIMIT %s", sql)
        self.assertEqual(params, ["openai", "openai", 5])

    def test_compare_models_finds_lower_and_ratio(self):
        rows = [row("small", electricity=1.0, carbon=4.0), row("big", electricity=3.0, carbon=2.0)]
        with patch.object(q, "compare_many", return_value=rows):
            result = q.compare_models("big", "small")
        metrics = {m["metric"]: m for m in result["metrics"]}
        self.assertEqual(set(metrics), set(q.METRICS))
        self.assertEqual(metrics["electricity"]["uses_less"], "small")
        self.assertEqual(metrics["electricity"]["times_difference"], 3.0)
        self.assertEqual(metrics["carbon"]["uses_less"], "big")
        self.assertEqual(metrics["carbon"]["times_difference"], 2.0)
        self.assertEqual(result["model_a"]["model"], "big")

    def test_compare_models_equal_values(self):
        with patch.object(q, "compare_many", return_value=[row("a"), row("b")]):
            result = q.compare_models("a", "b")
        for m in result["metrics"]:
            self.assertEqual(m["uses_less"], "same")
            self.assertEqual(m["times_difference"], 1.0)

    def test_compare_models_zero_value_has_no_ratio(self):
        with patch.object(q, "compare_many",
                          return_value=[row("a", electricity=0.0), row("b", electricity=2.0)]):
            result = q.compare_models("a", "b")
        self.assertIsNone(result["metrics"][0]["times_difference"])
        self.assertEqual(result["metrics"][0]["uses_less"], "a")

    def test_compare_models_missing_model_returns_none(self):
        with patch.object(q, "compare_many", return_value=[row("a")]):
            self.assertIsNone(q.compare_models("a", "missing"))

    def test_compare_many_empty_list_skips_query(self):
        with patch.object(q, "_query") as query:
            self.assertEqual(q.compare_many([]), [])
        query.assert_not_called()

    def test_compare_many_uses_one_placeholder_per_model(self):
        with patch.object(q, "_query", return_value=[]) as query:
            q.compare_many(["a", "b", "c"])
        sql, params = query.call_args.args
        self.assertIn("IN (%s, %s, %s)", sql)
        self.assertEqual(params, ["a", "b", "c"])

    def test_search_blank_term_returns_nothing(self):
        with patch.object(q, "_query") as query:
            self.assertEqual(q.search_models("   "), [])
            self.assertEqual(q.search_models(None), [])
        query.assert_not_called()

    def test_search_strips_match_quality_and_escapes_term(self):
        with patch.object(q, "_query",
                          return_value=[dict(row("gpt-4o"), match_quality=0)]) as query:
            result = q.search_models(" gpt_ ", limit="5")
        self.assertNotIn("match_quality", result[0])
        params = query.call_args.args[1]
        self.assertEqual(params, ("gpt_", "gpt\\_%", "%gpt\\_%", "%gpt\\_%", 5))

    def test_model_details_adds_warnings_and_aliases(self):
        with patch.object(q, "_query", return_value={"model": "gpt-4o"}), \
             patch.object(q, "get_model_warnings", return_value=["w"]), \
             patch.object(q, "get_model_aliases", return_value=["gpt-4o-2024"]):
            details = q.get_model_details("gpt-4o")
        self.assertEqual(details["warnings"], ["w"])
        self.assertEqual(details["also_known_as"], ["gpt-4o-2024"])

    def test_model_details_unknown_model(self):
        with patch.object(q, "_query", return_value=None):
            self.assertIsNone(q.get_model_details("nope"))

    def test_estimate_usage_scales_totals(self):
        r = row("gpt-4o", electricity=2.0, carbon=1.0, water=10.0, company="openai")
        with patch.object(q, "compare_many", return_value=[r]):
            result = q.estimate_usage("gpt-4o", tokens_per_request=500,
                                      requests_per_day=1000, days=30)
        self.assertEqual(result["total_output_tokens"], 15_000_000)
        self.assertEqual(result["electricity_kwh"], 30.0)
        self.assertEqual(result["carbon_kg"], 15.0)
        self.assertEqual(result["water_litres"], 150.0)
        self.assertEqual(result["equivalents"]["phone_charges"], 2000.0)
        self.assertEqual(result["equivalents"]["petrol_car_km"], round(15 / 0.17, 2))
        self.assertEqual(result["equivalents"]["glasses_of_water"], 600.0)
        self.assertEqual(result["company"], "openai")

    def test_estimate_usage_unknown_model(self):
        with patch.object(q, "compare_many", return_value=[]):
            self.assertIsNone(q.estimate_usage("missing"))

    def test_carbon_by_country_uppercases_zone(self):
        with patch.object(q, "_query", return_value=None) as query:
            q.get_carbon_by_country("gpt-4o", "fra")
        self.assertEqual(query.call_args.args[1], ("gpt-4o", "FRA"))

    def test_compare_countries_sorts_and_drops_missing(self):
        results = {"FRA": {"carbon_g": 1.0}, "POL": {"carbon_g": 9.0}, "XXX": None,
                   "USA": {"carbon_g": 4.0}}
        with patch.object(q, "get_carbon_by_country", side_effect=lambda m, z: results[z]):
            ordered = q.compare_countries("gpt-4o", ["POL", "XXX", "USA", "FRA"])
        self.assertEqual([r["carbon_g"] for r in ordered], [1.0, 4.0, 9.0])

class TestCsvExport(unittest.TestCase):

    def test_csv_header_and_rows(self):
        text = q.to_csv([{"model": "a", "wh": 1}, {"model": "b", "wh": 2}])
        self.assertEqual(text.splitlines(), ["model,wh", "a,1", "b,2"])

    def test_csv_quotes_commas_and_quotes(self):
        text = q.to_csv([{"model": 'Llama, "big"', "wh": 1.5}])
        self.assertEqual(text.splitlines(), ["model,wh", '"Llama, ""big""",1.5'])

    def test_csv_accepts_a_single_dict(self):
        self.assertEqual(q.to_csv({"a": 1}).splitlines(), ["a", "1"])

    def test_csv_empty_input(self):
        self.assertEqual(q.to_csv([]), "")
        self.assertEqual(q.to_csv(None), "")

    def test_save_csv_writes_utf8_file(self):
        with tempfile.TemporaryDirectory() as folder:
            path = os.path.join(folder, "out.csv")
            self.assertEqual(q.save_csv([{"unit": "µg Sb eq"}], path), path)
            with open(path, encoding="utf-8") as f:
                self.assertEqual(f.read().splitlines(), ["unit", "µg Sb eq"])


if __name__ == "__main__":
    unittest.main()
