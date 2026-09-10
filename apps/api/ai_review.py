import os
import json
from groq import Groq
from dotenv import load_dotenv
import hashlib

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

CODE_SYSTEM_PROMPT = """You are a senior software engineer performing a code review.
You will be given a git diff (patch) for a single file. The patch includes hunk headers like "@@ -oldStart,oldCount +newStart,newCount @@" which tell you the actual line numbers in the NEW version of the file.

Analyze the diff for:
1. Security issues (e.g. SQL injection, exposed secrets, unsafe input handling)
2. Logic bugs (e.g. null checks missing, off-by-one errors, unhandled exceptions)
3. Code style/maintainability issues

For each issue, determine the correct line number in the NEW file (not the diff line number) by counting from the hunk header's new file starting line.

Respond ONLY with valid JSON in this exact format, and nothing else:
{
  "issues": [
    {
      "line": <actual line number in the new file, integer>,
      "severity": "high" | "medium" | "low",
      "category": "security" | "logic" | "style",
      "message": "<short, clear explanation and suggestion>"
    }
  ]
}

Only report issues on lines that were added (lines starting with +). If there are no issues, respond with {"issues": []}.
"""

DOC_SYSTEM_PROMPT = """You are a technical reviewer reviewing a documentation or text file (not source code).
You will be given a git diff (patch). The patch includes hunk headers like "@@ -oldStart,oldCount +newStart,newCount @@" which tell you the actual line numbers in the NEW version of the file.

Only flag SIGNIFICANT issues, such as:
1. Factually incorrect or misleading information
2. Broken or clearly wrong links/commands/code snippets
3. Exposed secrets or credentials accidentally written in the docs

Do NOT flag minor style issues like indentation, capitalization, wording, spacing, or grammar. If the content is reasonable, respond with no issues.

For each issue, determine the correct line number in the NEW file (not the diff line number) by counting from the hunk header's new file starting line.

Respond ONLY with valid JSON in this exact format, and nothing else:
{
  "issues": [
    {
      "line": <actual line number in the new file, integer>,
      "severity": "high" | "medium" | "low",
      "category": "accuracy" | "security" | "broken-link",
      "message": "<short, clear explanation and suggestion>"
    }
  ]
}

Only report issues on lines that were added (lines starting with +). If there are no issues, respond with {"issues": []}.
"""

DOC_EXTENSIONS = (".md", ".txt", ".rst")


def get_diff_hash(filename, patch):
    content = f"{filename}:{patch}"
    return hashlib.sha256(content.encode()).hexdigest()


async def review_diff(filename, patch):
    is_doc_file = filename.lower().endswith(DOC_EXTENSIONS)
    system_prompt = DOC_SYSTEM_PROMPT if is_doc_file else CODE_SYSTEM_PROMPT

    user_prompt = f"File: {filename}\n\nDiff:\n{patch}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )

    raw_output = response.choices[0].message.content

    try:
        result = json.loads(raw_output)
        issues = result.get("issues", [])
    except json.JSONDecodeError:
        print(f"Failed to parse AI response as JSON: {raw_output}")
        issues = []

    return issues