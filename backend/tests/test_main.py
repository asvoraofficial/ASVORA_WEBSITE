import asyncio
import datetime as dt
import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-validation-123456"
os.environ["ADMIN_EMAIL"] = "admin@example.com"
os.environ["ADMIN_PASSWORD"] = "test-password-123"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main


class PortfolioPersistenceTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.data_file = main.DATA_FILE
        self.analytics_file = main.ANALYTICS_FILE
        self.mongo_db = main.mongo_db
        self.test_database_name = f"asvora_test_{main.uuid.uuid4().hex}"
        if main.is_mongo_available():
            main.mongo_db = main.mongo_client[self.test_database_name]
        self.store = dict(main.store)
        main.DATA_FILE = os.path.join(self.temp_dir.name, "data.json")
        main.ANALYTICS_FILE = os.path.join(self.temp_dir.name, "analytics.sqlite3")
        for collection in main.store:
            main.store[collection] = []

    def tearDown(self):
        main.DATA_FILE = self.data_file
        main.ANALYTICS_FILE = self.analytics_file
        if main.is_mongo_available():
            try:
                main.mongo_client.drop_database(main.mongo_db.name)
            except Exception:
                pass
        main.mongo_db = self.mongo_db
        main.store.clear()
        main.store.update(self.store)
        self.temp_dir.cleanup()

    def test_fresh_install_uses_real_brand_without_sample_claims(self):
        asyncio.run(main.seed())
        content = main.find_one("content", _id="site")
        self.assertEqual(content["brand"], "ASZENIX")
        self.assertEqual(content["email"], "")
        self.assertTrue(all(not content[f"stat{i}"] for i in range(1, 5)))
        self.assertEqual(len(main.store["services"]), 3)
        self.assertEqual(main.store["projects"], [])
        self.assertEqual(main.store["testimonials"], [])

        asyncio.run(main.track({"path": "/"}))
        stats = asyncio.run(main.stats())
        self.assertEqual(stats["visits"], 1)
        self.assertEqual(stats["series"][-1]["n"], 1)

    def test_migrates_legacy_data_and_sends_enquiry_email(self):
        timestamp = dt.datetime.now(dt.timezone.utc).replace(tzinfo=None).isoformat()
        legacy_data = {
            "admins": [{
                "_id": "admin", "email": "admin@example.com",
                "name": "TECHPRO Admin", "hash": "test-hash",
            }],
            "content": [{"_id": "site", **main.LEGACY_CONTENT}],
            "services": [
                {
                    "_id": f"service-{index}", "title": title,
                    "description": description, "created": timestamp, "published": True,
                }
                for index, (title, description) in enumerate(main.LEGACY_SERVICES)
            ],
            "projects": [
                {
                    "_id": f"project-{index}", "title": title, "category": category,
                    "description": description, "result": result,
                    "created": timestamp, "published": True,
                }
                for index, (title, category, description, result) in enumerate(main.LEGACY_PROJECTS)
            ] + [{
                "_id": "real-project", "title": "My real project",
                "created": timestamp, "published": True,
            }],
            "testimonials": [
                {
                    "_id": f"testimonial-{index}", "name": name, "role": role,
                    "quote": quote, "created": timestamp, "published": True,
                }
                for index, (name, role, quote) in enumerate(main.LEGACY_TESTIMONIALS)
            ] + [{
                "_id": "real-review", "name": "Real client",
                "quote": "Verified review", "created": timestamp, "published": True,
            }],
            "enquiries": [], "quotes": [], "media": [], "notifications": [],
            "visits": [{"path": "/", "created": timestamp}, {"path": "/about", "created": timestamp}],
        }
        with open(main.DATA_FILE, "w", encoding="utf-8") as data_file:
            json.dump(legacy_data, data_file)

        asyncio.run(main.seed())

        self.assertEqual(main.find_one("content", _id="site")["brand"], "ASZENIX")
        self.assertEqual(main.find_one("content", _id="site")["email"], "")
        self.assertEqual(main.find_one("admins")["name"], "ASZENIX Admin")
        self.assertEqual(len(main.store["services"]), 3)
        self.assertEqual([row["title"] for row in main.store["projects"]], ["My real project"])
        self.assertEqual([row["name"] for row in main.store["testimonials"]], ["Real client"])
        self.assertEqual(asyncio.run(main.stats())["visits"], 2)

        with patch.dict(os.environ, {"SMTP_HOST": "smtp.example.com"}):
            with patch.object(main, "send_enquiry_email") as send_email:
                asyncio.run(main.intake(
                    "enquiries",
                    {"name": "Visitor", "email": "visitor@example.com", "message": "Hello"},
                    "enquiry",
                ))
        send_email.assert_called_once()
        self.assertEqual(len(main.store["notifications"]), 1)

    def test_reviews_are_stored_unpublished_for_admin_approval(self):
        asyncio.run(main.seed())

        result = asyncio.run(main.review(main.ReviewSubmission(
            name="  Visitor  ",
            rating=5,
            quote="  Helpful and creative studio.  ",
        )))

        self.assertEqual(result, {"ok": True})
        self.assertEqual(len(main.store["testimonials"]), 1)
        self.assertEqual(main.store["testimonials"][0]["name"], "Visitor")
        self.assertEqual(main.store["testimonials"][0]["quote"], "Helpful and creative studio.")
        self.assertFalse(main.store["testimonials"][0]["published"])
        self.assertEqual(asyncio.run(main.public())["testimonials"], [])
        self.assertEqual(main.store["notifications"][0]["title"], "New review to approve")

        with self.assertRaises(main.HTTPException) as error:
            asyncio.run(main.review(main.ReviewSubmission(name="Visitor", rating=6)))
        self.assertEqual(error.exception.status_code, 422)

    def test_persists_and_reloads_portfolio_data_from_mongodb(self):
        if not main.is_mongo_available():
            self.skipTest("MongoDB not available")
        asyncio.run(main.seed())
        main.insert("projects", {"_id": "saved-project", "title": "Saved project"})
        main.save_store()
        for collection in main.store:
            main.store[collection] = []

        self.assertTrue(main.load_store())
        self.assertEqual(main.find_one("projects", _id="saved-project")["title"], "Saved project")
        self.assertEqual(main.mongo_db["projects"].count_documents({"_id": "saved-project"}), 1)

    def test_authentication_and_works_flow(self):
        asyncio.run(main.seed())
        request = main.Request({
            "type": "http",
            "method": "POST",
            "path": "/api/auth/login",
            "headers": [],
            "client": ("127.0.0.1", 12345),
        })

        # 1. Successful login
        login_res = asyncio.run(main.login(main.Login(
            email="admin@example.com",
            password="test-password-123"
        ), request))
        self.assertIn("token", login_res)
        token = login_res["token"]

        # 2. Invalid password
        with self.assertRaises(main.HTTPException) as err:
            asyncio.run(main.login(main.Login(
                email="admin@example.com",
                password="wrong-password"
            ), request))
        self.assertEqual(err.exception.status_code, 401)

        # 3. Unknown email
        with self.assertRaises(main.HTTPException) as err:
            asyncio.run(main.login(main.Login(
                email="nobody@example.com",
                password="test-password-123"
            ), request))
        self.assertEqual(err.exception.status_code, 401)

        # 4. Auth dependency with valid token
        admin_info = asyncio.run(main.auth(token=token))
        self.assertEqual(admin_info["email"], "admin@example.com")
        me_res = asyncio.run(main.me(admin=admin_info))
        self.assertEqual(me_res["email"], "admin@example.com")
        self.assertEqual(me_res["name"], "ASZENIX Admin")

        # 5. Auth dependency with invalid token
        with self.assertRaises(main.HTTPException) as err:
            asyncio.run(main.auth(token="invalid.bearer.token"))
        self.assertEqual(err.exception.status_code, 401)

        # 6. Profile update
        update_res = asyncio.run(main.profile(
            main.ProfileUpdate(name="Updated Studio Lead"),
            admin=admin_info
        ))
        self.assertIn("token", update_res)
        self.assertEqual(admin_info["name"], "Updated Studio Lead")

        # 7. Create work / project
        created_work = asyncio.run(main.create(
            "projects",
            {
                "title": "ASZENIX Commerce",
                "category": "Web Development",
                "result": "+50% sales",
                "description": "Full featured online store.",
                "published": True
            },
            admin_info
        ))
        self.assertEqual(created_work["title"], "ASZENIX Commerce")
        self.assertIn("id", created_work)

        # 8. List works / projects
        works_list = asyncio.run(main.list_("projects", _=admin_info))
        self.assertEqual(len(works_list), 1)
        self.assertEqual(works_list[0]["title"], "ASZENIX Commerce")

        # 9. Verify work is returned in public API
        public_data = asyncio.run(main.public())
        self.assertEqual(len(public_data["projects"]), 1)
        self.assertEqual(public_data["projects"][0]["title"], "ASZENIX Commerce")

    def test_admin_login_limits_repeated_failed_attempts(self):
        asyncio.run(main.seed())
        request = main.Request({
            "type": "http",
            "method": "POST",
            "path": "/api/auth/login",
            "headers": [],
            "client": ("192.0.2.10", 12345),
        })
        credentials = main.Login(email="admin@example.com", password="wrong-password")

        for _ in range(main.LOGIN_ATTEMPT_LIMIT):
            with self.assertRaises(main.HTTPException) as error:
                asyncio.run(main.login(credentials, request))
            self.assertEqual(error.exception.status_code, 401)

        with self.assertRaises(main.HTTPException) as error:
            asyncio.run(main.login(credentials, request))
        self.assertEqual(error.exception.status_code, 429)
        self.assertGreaterEqual(int(error.exception.headers["Retry-After"]), 1)
        self.assertLessEqual(int(error.exception.headers["Retry-After"]), 900)


if __name__ == "__main__":
    unittest.main()
