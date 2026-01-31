from pathlib import Path
import tomllib  # wbudowane w Pythonie 3.11+

def get_version() -> str:
    pyproject_path = Path(__file__).resolve().parents[1] / "pyproject.toml"
    data = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    return data["project"]["version"]

__all__ = ["get_version"]
