#!/usr/bin/env python3
"""Scan staged changes or a Git-aware export, without copying private runtime files."""
import argparse
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
IMAGE = "ghcr.io/gitleaks/gitleaks:v8.30.1"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--staged", action="store_true")
    parser.add_argument("--container", action="store_true")
    parser.add_argument("--engine", choices=["container", "docker"], default="container")
    args = parser.parse_args()
    flags = ["--redact", "--no-banner", "--no-color", "--max-archive-depth", "2"]
    if args.staged:
        return subprocess.run(["gitleaks", "git", "--pre-commit", "--staged", *flags, str(ROOT)]).returncode
    files = subprocess.check_output(["git", "-C", str(ROOT), "ls-files", "-c", "-o", "--exclude-standard", "-z"])
    with tempfile.TemporaryDirectory(prefix="resilix-secret-scan-") as directory:
        for relative in set(files.decode().split("\0")) - {""}:
            source = ROOT / relative
            if source.is_file() and not source.is_symlink():
                if source.name.startswith(".env") and source.name != ".env.example":
                    raise ValueError("Private environment file is not excluded from Git")
                target = Path(directory) / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
        if args.container:
            command = [args.engine, "run", "--rm", "--volume", f"{directory}:/scan:ro", IMAGE, "dir", "/scan", *flags]
        else:
            command = ["gitleaks", "dir", *flags, directory]
        return subprocess.run(command).returncode


if __name__ == "__main__":
    raise SystemExit(main())
