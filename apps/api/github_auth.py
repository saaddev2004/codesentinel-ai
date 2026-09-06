import jwt
import time
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

APP_ID = os.getenv("GITHUB_APP_ID")
PRIVATE_KEY_PATH = os.getenv("GITHUB_PRIVATE_KEY_PATH")


def generate_jwt():
    private_key = os.getenv("GITHUB_PRIVATE_KEY")
    if not private_key:
        with open(PRIVATE_KEY_PATH, "r") as key_file:
            private_key = key_file.read()

    now = int(time.time())
    payload = {
        "iat": now - 60,
        "exp": now + (10 * 60),
        "iss": APP_ID,
    }

    token = jwt.encode(payload, private_key, algorithm="RS256")
    return token


async def get_installation_token(installation_id):
    jwt_token = generate_jwt()

    headers = {
        "Authorization": f"Bearer {jwt_token}",
        "Accept": "application/vnd.github+json",
    }

    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers)
        response.raise_for_status()
        data = response.json()

    return data["token"]