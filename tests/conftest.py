import pytest

from museum_friends import create_app


@pytest.fixture
def app(tmp_path):
    return create_app(
        {
            "TESTING": True,
            "DATABASE_URL": "",
            "ON_VERCEL": False,
            "DB_MODE": "sqlite",
            "SQLITE_PATH": str(tmp_path / "test.db"),
        }
    )


@pytest.fixture
def client(app):
    return app.test_client()
