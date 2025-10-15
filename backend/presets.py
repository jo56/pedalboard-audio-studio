"""Utility functions for storing and retrieving effect presets."""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from effects import create_effect

PRESETS_DIR = Path("presets")
PRESETS_DIR.mkdir(exist_ok=True)

SCHEMA_VERSION = 1


class PresetValidationError(ValueError):
    """Raised when a preset payload fails validation."""


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _preset_file(preset_id: str) -> Path:
    return PRESETS_DIR / f"{preset_id}.json"


def validate_effect_chain(effects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Ensure the provided effect chain is constructible."""

    validated: List[Dict[str, Any]] = []
    for index, effect in enumerate(effects):
        if "type" not in effect:
            raise PresetValidationError(f"Effect at position {index} is missing a 'type'")

        effect_type = effect["type"]
        params = effect.get("params", {}) or {}

        # Attempt to construct the plugin to ensure parameters are valid
        create_effect(effect_type, params)

        validated.append({
            "type": effect_type,
            "params": params,
        })

    return validated


def create_preset(
    name: str,
    effects: List[Dict[str, Any]],
    description: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a preset file from an effect chain."""

    if not name:
        raise PresetValidationError("Preset name is required")

    validated_effects = validate_effect_chain(effects)

    preset_id = uuid.uuid4().hex
    payload: Dict[str, Any] = {
        "id": preset_id,
        "name": name,
        "description": description or "",
        "created_at": _timestamp(),
        "effects": validated_effects,
        "schema_version": SCHEMA_VERSION,
    }
    if metadata:
        payload["metadata"] = metadata

    file_path = _preset_file(preset_id)
    with file_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)

    return payload


def load_preset(preset_id: str) -> Dict[str, Any]:
    """Load a preset from disk."""

    file_path = _preset_file(preset_id)
    if not file_path.exists():
        raise FileNotFoundError(f"Preset not found: {preset_id}")

    with file_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def list_presets() -> List[Dict[str, Any]]:
    """Return summary details for all stored presets."""

    presets: List[Dict[str, Any]] = []
    for preset_file in sorted(PRESETS_DIR.glob("*.json")):
        try:
            with preset_file.open("r", encoding="utf-8") as handle:
                data = json.load(handle)
            presets.append({
                "id": data.get("id"),
                "name": data.get("name"),
                "description": data.get("description", ""),
                "created_at": data.get("created_at"),
                "effects_count": len(data.get("effects", [])),
            })
        except json.JSONDecodeError:
            # Skip malformed files but continue listing others
            continue

    return presets


def delete_preset(preset_id: str) -> None:
    """Remove a preset from disk."""

    file_path = _preset_file(preset_id)
    if not file_path.exists():
        raise FileNotFoundError(f"Preset not found: {preset_id}")

    file_path.unlink()


def preset_file_path(preset_id: str) -> Path:
    """Return the file path for a stored preset."""

    file_path = _preset_file(preset_id)
    if not file_path.exists():
        raise FileNotFoundError(f"Preset not found: {preset_id}")
    return file_path
