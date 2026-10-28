"""Vercel과 `flask --app app` 이 찾는 진입점."""
from museum_friends import create_app

app = create_app()
