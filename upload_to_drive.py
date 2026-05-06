#!/usr/bin/env python3
"""Upload PROJECT_REPORT.md to Google Drive using the Hermes OAuth token."""
import json, urllib.request, urllib.error, urllib.parse, os, sys

TOKEN_PATH = "/Users/chundatrading/.hermes/profiles/orchestrator/google_token.json"

with open(TOKEN_PATH) as f:
    token = json.load(f)

# 1. Refresh access token
params = urllib.parse.urlencode({
    "client_id": token["client_id"],
    "client_secret": token["client_secret"],
    "refresh_token": token["refresh_token"],
    "grant_type": "refresh_token",
}).encode()
req = urllib.request.Request(token["token_uri"], data=params)
resp = urllib.request.urlopen(req)
result = json.loads(resp.read())
access_token = result["access_token"]
print(f"Token refreshed. Expires in {result['expires_in']}s")

# 2. Read the report
with open("/Users/chundatrading/workspace/pet-reward-system/PROJECT_REPORT.md", encoding="utf-8") as f:
    content = f.read()

# 3. Upload to Drive via multipart
BOUNDARY = "hermes_upload_boundary"
metadata = json.dumps({
    "name": "pet-reward-system-project-report.md",
    "mimeType": "text/markdown",
})

body = (
    f"--{BOUNDARY}\r\n"
    f"Content-Type: application/json; charset=UTF-8\r\n\r\n"
    f"{metadata}\r\n"
    f"--{BOUNDARY}\r\n"
    f"Content-Type: text/markdown\r\n\r\n"
    f"{content}\r\n"
    f"--{BOUNDARY}--\r\n"
).encode("utf-8")

req = urllib.request.Request(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    data=body,
    headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": f"multipart/related; boundary={BOUNDARY}",
    },
)
resp = urllib.request.urlopen(req)
file_meta = json.loads(resp.read())
file_id = file_meta["id"]
print(f"Uploaded! File ID: {file_id}")
print(f"View URL: https://drive.google.com/file/d/{file_id}/view")
print(f"DRIVE_FILE_ID={file_id}")
