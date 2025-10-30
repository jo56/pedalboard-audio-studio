"""
Audio effects processing using Spotify Pedalboard
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional

from pedalboard import (
    Bitcrush,
    Chorus,
    Clipping,
    Compressor,
    Convolution,
    Delay,
    Distortion,
    Gain,
    GSMFullRateCompressor,
    HighShelfFilter,
    HighpassFilter,
    Invert,
    LadderFilter,
    Limiter,
    LowShelfFilter,
    LowpassFilter,
    MP3Compressor,
    NoiseGate,
    PeakFilter,
    Pedalboard,
    Phaser,
    PitchShift,
    Resample,
    Reverb,
    VST3Plugin,
)
from pedalboard.io import AudioFile

# Directories for user-provided assets
IMPULSE_DIR = Path("impulses")
IMPULSE_DIR.mkdir(exist_ok=True)

PLUGIN_DIR = Path("plugins")
PLUGIN_DIR.mkdir(exist_ok=True)


class ParamType(str, Enum):
    """Supported parameter types for effect configuration metadata."""

    FLOAT = "float"
    INT = "int"
    ENUM = "enum"
    STRING = "string"
    BOOL = "bool"
    FILE = "file"
    DICT = "dict"


@dataclass
class EffectParamSpec:
    """Parameter metadata for effect construction and documentation."""

    type: ParamType
    default: Any
    min: Optional[float] = None
    max: Optional[float] = None
    options: Optional[List[str]] = None
    dynamic_options: Optional[Callable[[], List[str]]] = None
    required: bool = False
    arg_name: Optional[str] = None
    transform: Optional[Callable[[Any], Any]] = None
    skip_if_none: bool = True
    help_text: Optional[str] = None


@dataclass
class EffectDefinition:
    """Definition of an effect, including constructor and parameter specs."""

    name: str
    description: str
    plugin_factory: Callable[..., Any]
    params: Dict[str, EffectParamSpec] = field(default_factory=dict)
    tags: List[str] = field(default_factory=list)
    notes: Optional[str] = None
    aliases: List[str] = field(default_factory=list)


def list_impulse_responses() -> List[str]:
    """Return all available impulse response filenames."""
    return sorted(
        [file.name for file in IMPULSE_DIR.glob("*") if file.is_file()]
    )


def _resolve_impulse_response(filename: str) -> str:
    """Resolve an impulse response filename to an absolute path within IMPULSE_DIR."""
    if not filename:
        raise ValueError("An impulse response file name is required")

    root = IMPULSE_DIR.resolve()
    candidate = (IMPULSE_DIR / filename).resolve()

    if not str(candidate).startswith(str(root)):
        raise ValueError("Impulse responses must reside inside the impulses directory")
    if not candidate.exists():
        raise FileNotFoundError(f"Impulse response not found: {candidate}")

    return str(candidate)


def _resolve_plugin_path(path_value: str) -> str:
    """Resolve a plugin path, allowing absolute paths or relative references under PLUGIN_DIR."""
    if not path_value:
        raise ValueError("A plugin path is required")

    candidate_path = Path(path_value).expanduser()
    if candidate_path.is_absolute():
        candidate = candidate_path.resolve()
    else:
        candidate = (PLUGIN_DIR / candidate_path).resolve()
        root = PLUGIN_DIR.resolve()
        if not str(candidate).startswith(str(root)):
            raise ValueError(
                "Relative plugin paths must stay within the backend plugins directory"
            )

    if not candidate.exists():
        raise FileNotFoundError(f"Plugin file not found: {candidate}")

    return str(candidate)


EFFECT_REGISTRY: Dict[str, EffectDefinition] = {}
EFFECT_ALIASES: Dict[str, str] = {}


def _register_effect(key: str, definition: EffectDefinition) -> None:
    EFFECT_REGISTRY[key] = definition
    for alias in definition.aliases:
        EFFECT_ALIASES[alias] = key


_register_effect(
    "reverb",
    EffectDefinition(
        name="Reverb",
        description="Adds spatial ambience and echo",
        plugin_factory=Reverb,
        params={
            "room_size": EffectParamSpec(
                type=ParamType.FLOAT, default=0.5, min=0.0, max=1.0
            ),
            "damping": EffectParamSpec(type=ParamType.FLOAT, default=0.5, min=0.0, max=1.0),
            "wet_level": EffectParamSpec(
                type=ParamType.FLOAT, default=0.33, min=0.0, max=1.0
            ),
            "dry_level": EffectParamSpec(
                type=ParamType.FLOAT, default=0.4, min=0.0, max=1.0
            ),
            "width": EffectParamSpec(type=ParamType.FLOAT, default=1.0, min=0.0, max=1.0),
            "freeze_mode": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=0.0, max=1.0
            ),
        },
        tags=["spatial"],
    ),
)

_register_effect(
    "delay",
    EffectDefinition(
        name="Delay",
        description="Creates tempo-synced echoes",
        plugin_factory=Delay,
        params={
            "delay_seconds": EffectParamSpec(
                type=ParamType.FLOAT, default=0.5, min=0.0, max=2.0
            ),
            "feedback": EffectParamSpec(type=ParamType.FLOAT, default=0.0, min=0.0, max=0.95),
            "mix": EffectParamSpec(type=ParamType.FLOAT, default=0.5, min=0.0, max=1.0),
        },
        tags=["spatial", "time"],
    ),
)

_register_effect(
    "compressor",
    EffectDefinition(
        name="Compressor",
        description="Controls dynamic range",
        plugin_factory=Compressor,
        params={
            "threshold_db": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=-60.0, max=0.0
            ),
            "ratio": EffectParamSpec(type=ParamType.FLOAT, default=1.0, min=1.0, max=20.0),
            "attack_ms": EffectParamSpec(
                type=ParamType.FLOAT, default=1.0, min=0.1, max=100.0
            ),
            "release_ms": EffectParamSpec(
                type=ParamType.FLOAT, default=100.0, min=1.0, max=1000.0
            ),
        },
        tags=["dynamics"],
    ),
)

_register_effect(
    "limiter",
    EffectDefinition(
        name="Limiter",
        description="Prevents peaks beyond a threshold",
        plugin_factory=Limiter,
        params={
            "threshold_db": EffectParamSpec(
                type=ParamType.FLOAT, default=-10.0, min=-60.0, max=0.0
            ),
            "release_ms": EffectParamSpec(
                type=ParamType.FLOAT, default=100.0, min=1.0, max=1000.0
            ),
        },
        tags=["dynamics"],
    ),
)

_register_effect(
    "gain",
    EffectDefinition(
        name="Gain",
        description="Raises or lowers signal level",
        plugin_factory=Gain,
        params={
            "gain_db": EffectParamSpec(type=ParamType.FLOAT, default=0.0, min=-60.0, max=60.0)
        },
        tags=["utility"],
    ),
)

_register_effect(
    "distortion",
    EffectDefinition(
        name="Distortion",
        description="Adds harmonic saturation",
        plugin_factory=Distortion,
        params={
            "drive_db": EffectParamSpec(
                type=ParamType.FLOAT, default=25.0, min=0.0, max=120.0
            )
        },
        tags=["color"],
    ),
)

_register_effect(
    "chorus",
    EffectDefinition(
        name="Chorus",
        description="Thickens signals with modulated delay",
        plugin_factory=Chorus,
        params={
            "rate_hz": EffectParamSpec(type=ParamType.FLOAT, default=1.0, min=0.0, max=10.0),
            "depth": EffectParamSpec(type=ParamType.FLOAT, default=0.25, min=0.0, max=1.0),
            "centre_delay_ms": EffectParamSpec(
                type=ParamType.FLOAT, default=7.0, min=1.0, max=50.0
            ),
            "feedback": EffectParamSpec(type=ParamType.FLOAT, default=0.0, min=0.0, max=0.95),
            "mix": EffectParamSpec(type=ParamType.FLOAT, default=0.5, min=0.0, max=1.0),
        },
        tags=["modulation", "spatial"],
    ),
)

_register_effect(
    "phaser",
    EffectDefinition(
        name="Phaser",
        description="Applies sweeping phase cancellations",
        plugin_factory=Phaser,
        params={
            "rate_hz": EffectParamSpec(type=ParamType.FLOAT, default=1.0, min=0.0, max=10.0),
            "depth": EffectParamSpec(type=ParamType.FLOAT, default=0.5, min=0.0, max=1.0),
            "centre_frequency_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=1300.0, min=20.0, max=8000.0
            ),
            "feedback": EffectParamSpec(type=ParamType.FLOAT, default=0.0, min=0.0, max=0.95),
            "mix": EffectParamSpec(type=ParamType.FLOAT, default=0.5, min=0.0, max=1.0),
        },
        tags=["modulation"],
    ),
)

_register_effect(
    "bitcrush",
    EffectDefinition(
        name="Bitcrush",
        description="Reduces bit depth for lo-fi texture",
        plugin_factory=Bitcrush,
        params={
            "bit_depth": EffectParamSpec(type=ParamType.FLOAT, default=8.0, min=1.0, max=32.0)
        },
        tags=["color"],
    ),
)

_register_effect(
    "highpass",
    EffectDefinition(
        name="Highpass Filter",
        description="Removes low frequencies",
        plugin_factory=HighpassFilter,
        params={
            "cutoff_frequency_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=50.0, min=20.0, max=20000.0
            )
        },
        tags=["filter"],
        aliases=["highpassfilter"],
    ),
)

_register_effect(
    "lowpass",
    EffectDefinition(
        name="Lowpass Filter",
        description="Removes high frequencies",
        plugin_factory=LowpassFilter,
        params={
            "cutoff_frequency_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=5000.0, min=20.0, max=20000.0
            )
        },
        tags=["filter"],
        aliases=["lowpassfilter"],
    ),
)

_register_effect(
    "ladderfilter",
    EffectDefinition(
        name="Ladder Filter",
        description="Moog-style resonant filter",
        plugin_factory=LadderFilter,
        params={
            "mode": EffectParamSpec(
                type=ParamType.ENUM,
                default="LPF12",
                options=list(LadderFilter.Mode.__members__.keys()),
                transform=lambda choice: getattr(LadderFilter.Mode, choice),
                help_text="Choose the filter topology",
            ),
            "cutoff_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=200.0, min=20.0, max=20000.0
            ),
            "resonance": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=0.0, max=1.0
            ),
            "drive": EffectParamSpec(type=ParamType.FLOAT, default=1.0, min=1.0, max=10.0),
        },
        tags=["filter"],
    ),
)

_register_effect(
    "highshelf",
    EffectDefinition(
        name="High Shelf",
        description="Boosts or attenuates high frequencies",
        plugin_factory=HighShelfFilter,
        params={
            "cutoff_frequency_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=1000.0, min=20.0, max=20000.0
            ),
            "gain_db": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=-60.0, max=60.0
            ),
            "q": EffectParamSpec(type=ParamType.FLOAT, default=0.7071, min=0.1, max=10.0),
        },
        tags=["filter"],
        aliases=["highshelffilter"],
    ),
)

_register_effect(
    "lowshelf",
    EffectDefinition(
        name="Low Shelf",
        description="Boosts or attenuates low frequencies",
        plugin_factory=LowShelfFilter,
        params={
            "cutoff_frequency_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=300.0, min=20.0, max=20000.0
            ),
            "gain_db": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=-60.0, max=60.0
            ),
            "q": EffectParamSpec(type=ParamType.FLOAT, default=0.7071, min=0.1, max=10.0),
        },
        tags=["filter"],
        aliases=["lowshelffilter"],
    ),
)

_register_effect(
    "peakfilter",
    EffectDefinition(
        name="Peak / Notch Filter",
        description="Boosts or cuts around a center frequency",
        plugin_factory=PeakFilter,
        params={
            "cutoff_frequency_hz": EffectParamSpec(
                type=ParamType.FLOAT, default=440.0, min=20.0, max=20000.0
            ),
            "gain_db": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=-60.0, max=60.0
            ),
            "q": EffectParamSpec(type=ParamType.FLOAT, default=0.7071, min=0.1, max=10.0),
        },
        tags=["filter"],
    ),
)

_register_effect(
    "pitchshift",
    EffectDefinition(
        name="Pitch Shift",
        description="Shifts pitch without changing tempo",
        plugin_factory=PitchShift,
        params={
            "semitones": EffectParamSpec(
                type=ParamType.FLOAT, default=0.0, min=-24.0, max=24.0
            )
        },
        tags=["modulation"],
    ),
)

_register_effect(
    "clipping",
    EffectDefinition(
        name="Clipping",
        description="Applies hard digital clipping",
        plugin_factory=Clipping,
        params={
            "threshold_db": EffectParamSpec(
                type=ParamType.FLOAT, default=-6.0, min=-60.0, max=0.0
            )
        },
        tags=["color"],
    ),
)

_register_effect(
    "invert",
    EffectDefinition(
        name="Invert",
        description="Flips the signal polarity",
        plugin_factory=Invert,
        params={},
        tags=["utility"],
    ),
)

_register_effect(
    "mp3compressor",
    EffectDefinition(
        name="MP3 Compressor",
        description="Introduces perceptual codec artifacts",
        plugin_factory=MP3Compressor,
        params={
            "vbr_quality": EffectParamSpec(
                type=ParamType.FLOAT, default=2.0, min=0.0, max=9.9
            )
        },
        tags=["color"],
    ),
)

_register_effect(
    "resample",
    EffectDefinition(
        name="Resample",
        description="Downsamples audio for aliasing effects",
        plugin_factory=Resample,
        params={
            "target_sample_rate": EffectParamSpec(
                type=ParamType.FLOAT, default=8000.0, min=4000.0, max=192000.0
            ),
            "quality": EffectParamSpec(
                type=ParamType.ENUM,
                default="WindowedSinc",
                options=list(Resample.Quality.__members__.keys()),
                transform=lambda choice: getattr(Resample.Quality, choice),
                help_text="Select the resampling algorithm",
            ),
        },
        tags=["color", "utility"],
    ),
)

_register_effect(
    "noisegate",
    EffectDefinition(
        name="Noise Gate",
        description="Suppresses low-level noise",
        plugin_factory=NoiseGate,
        params={
            "threshold_db": EffectParamSpec(
                type=ParamType.FLOAT, default=-40.0, min=-100.0, max=0.0
            ),
            "ratio": EffectParamSpec(type=ParamType.FLOAT, default=10.0, min=1.0, max=20.0),
            "attack_ms": EffectParamSpec(
                type=ParamType.FLOAT, default=1.0, min=0.0, max=100.0
            ),
            "release_ms": EffectParamSpec(
                type=ParamType.FLOAT, default=100.0, min=1.0, max=1000.0
            ),
        },
        tags=["dynamics"],
        aliases=["gate"],
    ),
)

_register_effect(
    "gsmfullratecompressor",
    EffectDefinition(
        name="GSM Full Rate",
        description="Simulates 2G cellular codec compression",
        plugin_factory=GSMFullRateCompressor,
        params={
            "quality": EffectParamSpec(
                type=ParamType.ENUM,
                default="WindowedSinc",
                options=list(Resample.Quality.__members__.keys()),
                transform=lambda choice: getattr(Resample.Quality, choice),
                help_text="Controls the internal resampling algorithm",
            )
        },
        tags=["color"],
    ),
)

_register_effect(
    "convolution",
    EffectDefinition(
        name="Convolution",
        description="Applies an impulse response for cabinets or reverbs",
        plugin_factory=Convolution,
        params={
            "impulse_response": EffectParamSpec(
                type=ParamType.FILE,
                default="",
                required=True,
                arg_name="impulse_response_filename",
                dynamic_options=list_impulse_responses,
                transform=_resolve_impulse_response,
                help_text="Upload IR files to backend/impulses",
            ),
            "mix": EffectParamSpec(type=ParamType.FLOAT, default=1.0, min=0.0, max=1.0),
        },
        tags=["spatial", "color"],
        notes="Impulse response files must be placed in backend/impulses.",
    ),
)

# VST3 support disabled for public deployment security
# Uncomment to re-enable for private/trusted environments
# _register_effect(
#     "vst3",
#     EffectDefinition(
#         name="VST3 Plugin",
#         description="Hosts an external VST3 effect or instrument",
#         plugin_factory=VST3Plugin,
#         params={
#             "plugin_path": EffectParamSpec(
#                 type=ParamType.STRING,
#                 default="",
#                 required=True,
#                 transform=_resolve_plugin_path,
#                 help_text="Absolute path or relative to backend/plugins",
#             ),
#             "plugin_name": EffectParamSpec(
#                 type=ParamType.STRING,
#                 default=None,
#                 skip_if_none=True,
#                 help_text="Optional name when plugin bundle contains multiples",
#             ),
#             "initialization_timeout": EffectParamSpec(
#                 type=ParamType.FLOAT,
#                 default=10.0,
#                 min=1.0,
#                 max=120.0,
#                 help_text="Seconds to wait for plugin to finish loading",
#             ),
#             "parameter_values": EffectParamSpec(
#                 type=ParamType.DICT,
#                 default=None,
#                 skip_if_none=True,
#                 help_text="Dictionary of parameter overrides",
#             ),
#         },
#         tags=["external"],
#         notes="Requires compatible VST3 binaries installed on the host system.",
#         aliases=["vst3plugin"],
#     ),
# )


def _coerce_param_value(param_name: str, spec: EffectParamSpec, raw_value: Any) -> Any:
    """Convert raw parameter values into the expected type and range."""

    value = raw_value

    if spec.type == ParamType.FLOAT:
        try:
            value = float(raw_value)
        except (TypeError, ValueError):
            raise ValueError(f"Parameter '{param_name}' must be a number") from None
    elif spec.type == ParamType.INT:
        try:
            value = int(raw_value)
        except (TypeError, ValueError):
            raise ValueError(f"Parameter '{param_name}' must be an integer") from None
    elif spec.type == ParamType.BOOL:
        if isinstance(raw_value, str):
            value = raw_value.lower() in {"1", "true", "yes", "on"}
        else:
            value = bool(raw_value)
    elif spec.type == ParamType.ENUM:
        options = spec.options or (spec.dynamic_options() if spec.dynamic_options else [])
        if not options:
            raise ValueError(f"No options defined for enum parameter '{param_name}'")
        value = str(raw_value)
        if value not in options:
            raise ValueError(
                f"Invalid value '{raw_value}' for parameter '{param_name}'. Allowed: {options}"
            )
    elif spec.type == ParamType.STRING:
        value = "" if raw_value is None else str(raw_value)
        if spec.required and not value:
            raise ValueError(f"Parameter '{param_name}' requires a non-empty string")
    elif spec.type == ParamType.FILE:
        options = spec.options or (spec.dynamic_options() if spec.dynamic_options else None)
        value = "" if raw_value is None else str(raw_value)
        if spec.required and not value:
            raise ValueError(f"Parameter '{param_name}' requires a file selection")
        if options and value and value not in options:
            raise ValueError(
                f"Unknown file '{value}' for parameter '{param_name}'. Available: {options}"
            )
    elif spec.type == ParamType.DICT:
        if raw_value is None:
            value = {}
        elif isinstance(raw_value, dict):
            value = raw_value
        else:
            raise ValueError(f"Parameter '{param_name}' must be an object/dictionary")

    if spec.min is not None and isinstance(value, (int, float)) and value < spec.min:
        raise ValueError(
            f"Parameter '{param_name}' must be >= {spec.min}, received {value}"
        )
    if spec.max is not None and isinstance(value, (int, float)) and value > spec.max:
        raise ValueError(
            f"Parameter '{param_name}' must be <= {spec.max}, received {value}"
        )

    if spec.transform and value is not None:
        value = spec.transform(value)

    return value


def create_effect(effect_type: str, params: Dict[str, Any]) -> Any:
    """Create a Pedalboard plugin instance from a configuration payload."""

    params = params or {}
    effect_key = effect_type.lower()
    effect_key = EFFECT_ALIASES.get(effect_key, effect_key)

    if effect_key not in EFFECT_REGISTRY:
        raise ValueError(f"Unknown effect type: {effect_type}")

    definition = EFFECT_REGISTRY[effect_key]

    unknown_params = set(params.keys()) - set(definition.params.keys())
    if unknown_params:
        raise ValueError(
            f"Unsupported parameter(s) for '{effect_key}': {', '.join(sorted(unknown_params))}"
        )

    kwargs: Dict[str, Any] = {}
    for param_name, spec in definition.params.items():
        if param_name in params:
            raw_value = params[param_name]
        else:
            raw_value = spec.default

        if raw_value is None:
            if spec.required:
                raise ValueError(
                    f"Parameter '{param_name}' is required for effect '{effect_key}'"
                )
            if spec.skip_if_none and param_name not in params:
                continue

        value = _coerce_param_value(param_name, spec, raw_value)

        if value is None and spec.skip_if_none:
            continue

        kwargs[spec.arg_name or param_name] = value

    return definition.plugin_factory(**kwargs)


def apply_effects_chain(input_path: str, output_path: str, effects: List[Dict[str, Any]]):
    """
    Apply a chain of effects to an audio file.

    Args:
        input_path: Path to input audio file
        output_path: Path to save processed audio
        effects: List of effect configurations, each with 'type' and 'params'
    """

    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    effect_chain = []
    for effect_config in effects:
        effect_type = effect_config.get("type")
        if not effect_type:
            raise ValueError("Each effect must define a 'type'")
        effect_params = effect_config.get("params", {})
        effect_chain.append(create_effect(effect_type, effect_params))

    board = Pedalboard(effect_chain)

    with AudioFile(input_path) as reader:
        audio = reader.read(reader.frames)
        sample_rate = reader.samplerate
        num_channels = audio.shape[0] if hasattr(audio, "shape") and audio.ndim > 1 else 1

    processed_audio = board(audio, sample_rate)

    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with AudioFile(output_path, "w", sample_rate, num_channels) as writer:
        writer.write(processed_audio)


def get_available_effects() -> Dict[str, Any]:
    """Return effect metadata for client configuration UIs."""

    available: Dict[str, Any] = {}
    for key, definition in EFFECT_REGISTRY.items():
        params_description: Dict[str, Any] = {}
        for param_name, spec in definition.params.items():
            entry: Dict[str, Any] = {
                "type": spec.type.value,
                "default": spec.default,
            }
            if spec.min is not None:
                entry["min"] = spec.min
            if spec.max is not None:
                entry["max"] = spec.max
            options = spec.options or (spec.dynamic_options() if spec.dynamic_options else None)
            if options:
                entry["options"] = options
            if spec.required:
                entry["required"] = True
            if spec.help_text:
                entry["help"] = spec.help_text

            params_description[param_name] = entry

        effect_entry: Dict[str, Any] = {
            "name": definition.name,
            "description": definition.description,
            "params": params_description,
        }
        if definition.tags:
            effect_entry["tags"] = definition.tags
        if definition.notes:
            effect_entry["notes"] = definition.notes
        if definition.aliases:
            effect_entry["aliases"] = definition.aliases

        available[key] = effect_entry

    return available
