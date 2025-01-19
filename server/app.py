from flask import Flask, request, jsonify, session, send_file
import tempfile
import os
import mimetypes
import shutil
import zipfile
import uuid

import oxen
from oxen.auth import config_auth
from oxen import RemoteRepo, Repo

app = Flask(__name__)
app.secret_key = "REPLACE_WITH_SOMETHING_SECURE"

# In-memory store of a single user’s token for MVP
logged_in_users = {}

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    api_key = data.get("apiKey")
    if not api_key:
        return jsonify({"error": "Missing API key"}), 400

    # Store it in a global dictionary (MVP approach)
    session_id = "default-user"
    logged_in_users[session_id] = api_key

    # Optional: Validate the token by calling the SDK
    try:
        config_auth(api_key)
        # Quick test: list any public or known repo (to ensure token is valid)
        test_repo = RemoteRepo("ox/SpanishToEnglish")  # a known public repo
        test_repo.ls()  # If this fails, token is invalid
    except Exception as e:
        return jsonify({"error": f"API key invalid: {str(e)}"}), 400

    return jsonify({"message": "Logged in", "sessionId": session_id}), 200


def get_api_key():
    # For an MVP, always returning from memory with a “default-user” session.
    return logged_in_users.get("default-user")


@app.route("/api/repos/<path:namespace_repo>/list", methods=["GET"])
def list_files(namespace_repo):
    """List files in a given directory (or top-level) of a repo."""

    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "Not logged in"}), 401

    config_auth(api_key)
    repo = RemoteRepo(namespace_repo)

    branch = request.args.get("branch", "main")
    directory = request.args.get("dir", "")

    repo.checkout(branch)
    listing = repo.ls(directory) if directory else repo.ls()
    entries = []

    for entry in listing.entries:
        print("File:", dir)  # optional debug print
        entries.append({
            "filename": entry.filename,
            "path": f"{directory}/{entry.filename}".strip("/"),
            "type": entry.data_type
        })

    return jsonify({"entries": entries})


@app.route("/api/repos/<path:namespace_repo>/file", methods=["GET"])
def get_file_info(namespace_repo):
    """
    Return a direct link (fileUrl) or minimal metadata about a file
    — plus we can optionally handle smaller file downloads here.
    """
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "Not logged in"}), 401

    config_auth(api_key)

    file_path = request.args.get("filePath", "")
    branch = request.args.get("branch", "main")

    # We can build a direct link for the user to do an HTTP GET from OxenHub:
    # https://hub.oxen.ai/api/repos/<ns>/<repo>/file/<branch>/<file_path>
    file_url = f"https://hub.oxen.ai/api/repos/{namespace_repo}/file/{branch}/{file_path}"

    return jsonify({"fileUrl": file_url})


@app.route("/api/repos/<path:namespace_repo>/download_file", methods=["GET"])
def download_file(namespace_repo):
    """
    Download a single file from the remote repo and return it as an attachment.
    """
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "Not logged in"}), 401
    config_auth(api_key)

    file_path = request.args.get("filePath", "")
    branch = request.args.get("branch", "main")

    # Basic validation
    if not file_path:
        return jsonify({"error": "Missing filePath"}), 400

    # Create a temporary directory to download the file
    tmpdir = tempfile.mkdtemp(prefix="oxen-file-")
    try:
        local_repo_path = os.path.join(tmpdir, "repo")
        os.makedirs(local_repo_path, exist_ok=True)

        # Create a remote repo object and checkout the requested branch
        remote_repo = RemoteRepo(namespace_repo)
        remote_repo.checkout(branch)

        # Destination on the local filesystem
        filename_only = os.path.basename(file_path)  # e.g. "image.jpg"
        local_file_path = os.path.join(local_repo_path, filename_only)

        # Download the single file
        remote_repo.download(src=file_path, dst=local_file_path)

        # Send that file to the user
        return send_file(
            local_file_path,
            as_attachment=True,
            download_name=filename_only,
        )

    finally:
        # Carefully remove the temp directory.
        # (In production, you might want a more robust cleanup schedule.)
        shutil.rmtree(tmpdir, ignore_errors=True)


@app.route("/api/repos/<path:namespace_repo>/download_repo", methods=["GET"])
def download_repo(namespace_repo):
    """
    Clone the entire repo, zip it up, and return the zip. This can be huge
    for large datasets; recommended only for small/medium data or specialized use.
    """
    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "Not logged in"}), 401

    config_auth(api_key)

    try:
        branch = request.args.get("branch", "main")

        tmpdir = tempfile.mkdtemp(prefix="oxen-repo-")
        local_repo_path = os.path.join(tmpdir, "repo")

        # Remove existing directory if it’s somehow already there
        if os.path.exists(local_repo_path):
            shutil.rmtree(local_repo_path)

        # Now clone into the empty directory
        oxen.clone(
            repo_id=f"{namespace_repo}",
            path=local_repo_path,
            branch=branch
        )

        # Zip it
        zip_filename = f"{namespace_repo.replace('/', '_')}_{branch}.zip"
        zip_path = os.path.join(tmpdir, zip_filename)
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # Walk the entire local_repo_path
            for root, dirs, files in os.walk(local_repo_path):
                for f in files:
                    full_path = os.path.join(root, f)
                    # relative path inside the zip
                    arcname = os.path.relpath(full_path, start=local_repo_path)
                    zf.write(full_path, arcname=arcname)

        # Send the zip file
        return send_file(zip_path, as_attachment=True, download_name=zip_filename)
    finally:
        # For a real application, you’d want a robust cleanup strategy
        pass


# Example: Stub to return some user repos, to display on /repos page
@app.route("/api/repos", methods=["GET"])
def list_my_repos():
    """
    Return some example repos the user might have access to.
    In reality you'd call an API or maintain a user->repo list.
    """
    # Hard-code or fetch from an Oxen API if it becomes available
    # For now, just returning a couple examples:
    return jsonify([
        {"namespace": "ox", "name": "CatDogBBox"},
        {"namespace": "ox", "name": "SpanishToEnglish"},
    ])


@app.route("/api/repos/<path:namespace_repo>/preview_file", methods=["GET"])
def preview_file(namespace_repo):
    """
    Fetch the file from the remote repo (with the user’s API token)
    then return raw text or the actual file bytes to the browser.
    """
    import mimetypes

    api_key = get_api_key()
    if not api_key:
        return jsonify({"error": "Not logged in"}), 401
    config_auth(api_key)

    file_path = request.args.get("filePath", "")
    branch = request.args.get("branch", "main")
    if not file_path:
        return jsonify({"error": "Missing filePath"}), 400

    tmpdir = tempfile.mkdtemp(prefix="oxen-preview-")
    try:
        local_repo_path = os.path.join(tmpdir, "repo")
        os.makedirs(local_repo_path, exist_ok=True)

        remote_repo = RemoteRepo(namespace_repo)
        remote_repo.checkout(branch)

        filename = os.path.basename(file_path)
        local_file_path = os.path.join(local_repo_path, filename)

        # Download from the OxenHub server to local file system
        remote_repo.download(src=file_path, dst=local_file_path)

        # Either send as a file download or, if you want raw text, read it and return as JSON/text
        mime_type, _ = mimetypes.guess_type(local_file_path)
        if not mime_type:
            mime_type = "application/octet-stream"

        # If you specifically want to return text for .md or .txt
        # you could do something like:
        if file_path.lower().endswith(".md") or file_path.lower().endswith(".txt"):
            with open(local_file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw_text = f.read()
            return jsonify({"rawText": raw_text})

        # Otherwise fallback to streaming the file
        return send_file(local_file_path, mimetype=mime_type)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == "__main__":
    app.run(debug=True)
