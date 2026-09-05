import httpx
from github_auth import get_installation_token


async def get_pr_files(installation_id, owner, repo, pull_number):
    token = await get_installation_token(installation_id)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }

    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/files"

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
        files = response.json()

    return files


async def post_review_comment(installation_id, owner, repo, pull_number, commit_id, path, line, body):
    token = await get_installation_token(installation_id)

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }

    url = f"https://api.github.com/repos/{owner}/{repo}/pulls/{pull_number}/comments"

    data = {
        "body": body,
        "commit_id": commit_id,
        "path": path,
        "line": line,
        "side": "RIGHT",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=data)
        if response.status_code >= 400:
            print(f"Failed to post comment on {path}:{line} - {response.status_code} - {response.text}")
        else:
            print(f"Posted comment on {path}:{line}")