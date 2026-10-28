"""
core/rea_bridge.py
───────────────────
Reverse Engineering Bridge (morluto/rea integration).

Wraps the REA (Reverse Engineer Anything) CLI to analyze web bundles, browser scenarios,
and desktop application architectures. Stores extracted prompt expansion rules,
camera trajectory vectors, and video conditioning formulas into the studio knowledge base.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

from rich.console import Console

console = Console()

REA_BIN = shutil.which("rea") or "/home/cyb3rfy/.npm-global/bin/rea"
PROFILES_DIR = Path(__file__).resolve().parent.parent / "references" / "reverse_engineered"


class REABridge:
    """Interacts with the REA CLI and manages reverse-engineered AI video profiles."""

    def __init__(self, profiles_dir: Optional[Path] = None):
        self.bin_path = REA_BIN if os.path.exists(REA_BIN) else "rea"
        self.profiles_dir = profiles_dir or PROFILES_DIR
        self.profiles_dir.mkdir(parents=True, exist_ok=True)

    def is_available(self) -> bool:
        """Check if REA CLI is installed and responsive."""
        try:
            res = subprocess.run([self.bin_path, "--version"], capture_output=True, text=True, timeout=5)
            return res.returncode == 0
        except Exception:
            return False

    def get_version(self) -> str:
        """Get the REA version string."""
        try:
            res = subprocess.run([self.bin_path, "--version"], capture_output=True, text=True, timeout=5)
            return res.stdout.strip()
        except Exception as e:
            return f"Unavailable ({e})"

    def run_command(self, cmd: str, args: Optional[List[str]] = None, timeout: int = 60) -> Dict[str, Any]:
        """Execute any REA CLI command and return structured JSON output."""
        full_cmd = [self.bin_path, cmd] + (args or []) + ["--format", "json"]
        try:
            res = subprocess.run(full_cmd, capture_output=True, text=True, timeout=timeout)
            if res.returncode == 0:
                try:
                    return json.loads(res.stdout)
                except json.JSONDecodeError:
                    return {"status": "ok", "raw_output": res.stdout}
            else:
                return {
                    "status": "error",
                    "returncode": res.returncode,
                    "stderr": res.stderr,
                    "stdout": res.stdout,
                }
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def capture_browser_target(self, url: str, output_evidence: Path) -> Dict[str, Any]:
        """Run a bounded browser scenario via Playwright to inspect network/bundle payloads."""
        args = ["--url", url, "--out", str(output_evidence)]
        return self.run_command("capture-browser-scenario", args)

    def analyze_web_bundle(self, target_origin: str, output_evidence: Path) -> Dict[str, Any]:
        """Capture and statically analyze page bundles from a web origin."""
        args = ["--target", target_origin, "--out", str(output_evidence)]
        return self.run_command("analyze-web-bundle", args)

    def save_profile(self, name: str, data: Dict[str, Any]) -> Path:
        """Save an extracted intelligence profile."""
        clean_name = name.lower().replace(" ", "_").replace("-", "_")
        filepath = self.profiles_dir / f"{clean_name}.json"
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        return filepath

    def load_profile(self, name: str) -> Optional[Dict[str, Any]]:
        """Load an intelligence profile by name."""
        clean_name = name.lower().replace(" ", "_").replace("-", "_")
        filepath = self.profiles_dir / f"{clean_name}.json"
        if not filepath.exists():
            return None
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)

    def list_profiles(self) -> List[str]:
        """List all available reverse-engineered profiles."""
        return [f.stem for f in self.profiles_dir.glob("*.json")]
