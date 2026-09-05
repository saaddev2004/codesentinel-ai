from fastapi import FastAPI, Request, Header, HTTPException
import hmac
import hashlib
import os
from dotenv import load_dotenv
from github_auth import get_installation_token
from github_api import get_pr_files, post_review_comment
from ai_review import review_diff
from database import init_db, async_session, Review, Issue
import traceback
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")


@app.on_event("startup")
async def startup_event():
    await init_db()
    print("Database tables ready")


@app.get("/")
def read_root():
    return {"status": "CodeSentinel AI backend is running"}

@app.post("/webhook/github")
async def github_webhook(request: Request, x_hub_signature_256: str = Header(None)):
    body = await request.body()

    expected_signature = "sha256=" + hmac.new(
        WEBHOOK_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, x_hub_signature_256 or ""):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    event_type = request.headers.get("X-GitHub-Event")

    print(f"Received event: {event_type}")
    print(f"Action: {payload.get('action')}")

    installation_id = payload.get("installation", {}).get("id")

    if installation_id and event_type == "pull_request":
        try:
            owner = payload["repository"]["owner"]["login"]
            repo = payload["repository"]["name"]
            pull_number = payload["pull_request"]["number"]
            commit_id = payload["pull_request"]["head"]["sha"]

            print(f"Fetching diff for {owner}/{repo} PR #{pull_number}")

            files = await get_pr_files(installation_id, owner, repo, pull_number)

            print(f"Files changed: {len(files)}")
            for f in files:
                print(f"  - {f['filename']} (+{f['additions']} / -{f['deletions']})")

                if "patch" in f:
                    print(f"    Sending to AI for review...")
                    issues = await review_diff(f['filename'], f['patch'])
                    print(f"    AI found {len(issues)} issue(s)")

                    async with async_session() as session:
                        new_review = Review(
                            owner=owner,
                            repo=repo,
                            pull_number=pull_number,
                            filename=f['filename'],
                        )
                        session.add(new_review)
                        await session.flush()

                        for issue in issues:
                            new_issue = Issue(
                                review_id=new_review.id,
                                line=issue['line'],
                                severity=issue['severity'],
                                category=issue['category'],
                                message=issue['message'],
                            )
                            session.add(new_issue)

                        await session.commit()

                    for issue in issues:
                        comment_body = f"**[{issue['severity'].upper()}] {issue['category']}**: {issue['message']}"
                        await post_review_comment(
                            installation_id, owner, repo, pull_number,
                            commit_id, f['filename'], issue['line'], comment_body
                        )
                else:
                    print(f"    (No patch available - binary or too large)")

        except Exception as e:
            print(f"Error processing PR: {e}")
            traceback.print_exc()

    return {"status": "received"}


@app.get("/api/reviews")
async def get_reviews():
    async with async_session() as session:
        result = await session.execute(select(Review).order_by(Review.created_at.desc()))
        reviews = result.scalars().all()
        return [
            {
                "id": r.id,
                "owner": r.owner,
                "repo": r.repo,
                "pull_number": r.pull_number,
                "filename": r.filename,
                "created_at": r.created_at.isoformat(),
            }
            for r in reviews
        ]


@app.get("/api/reviews/{review_id}/issues")
async def get_issues(review_id: int):
    async with async_session() as session:
        result = await session.execute(select(Issue).where(Issue.review_id == review_id))
        issues = result.scalars().all()
        return [
            {
                "id": i.id,
                "line": i.line,
                "severity": i.severity,
                "category": i.category,
                "message": i.message,
            }
            for i in issues
        ]