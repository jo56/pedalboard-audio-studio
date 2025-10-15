"""
Audio effects processing using Spotify Pedalboard
"""
from pedalboard import (
    Pedalboard,
    Reverb,
    Delay,
    Compressor,
    Limiter,
    Gain,
    Distortion,
    Chorus,
    Phaser,
    Bitcrush,
    HighpassFilter,
    LowpassFilter,
    LadderFilter,
    HighShelfFilter,
    LowShelfFilter,
    PitchShift,
    Clipping,
    Invert,
    Convolution,
    MP3Compressor,
    Resample
)
from pedalboard.io import AudioFile
from typing import List, Dict, Any


def create_effect(effect_type: str, params: Dict[str, Any]):
    """
    Create a Pedalboard effect instance based on type and parameters

    Args:
        effect_type: Name of the effect (e.g., 'reverb', 'delay')
        params: Dictionary of effect parameters

    Returns:
        Pedalboard effect instance
    """

    effect_type = effect_type.lower()

    # Reverb - spatial effect
    if effect_type == "reverb":
        return Reverb(
            room_size=params.get("room_size", 0.5),
            damping=params.get("damping", 0.5),
            wet_level=params.get("wet_level", 0.33),
            dry_level=params.get("dry_level", 0.4),
            width=params.get("width", 1.0),
            freeze_mode=params.get("freeze_mode", 0.0)
        )

    # Delay - echo effect
    elif effect_type == "delay":
        return Delay(
            delay_seconds=params.get("delay_seconds", 0.5),
            feedback=params.get("feedback", 0.0),
            mix=params.get("mix", 0.5)
        )

    # Compressor - dynamic range compression
    elif effect_type == "compressor":
        return Compressor(
            threshold_db=params.get("threshold_db", 0.0),
            ratio=params.get("ratio", 1.0),
            attack_ms=params.get("attack_ms", 1.0),
            release_ms=params.get("release_ms", 100.0)
        )

    # Limiter - prevent audio from exceeding threshold
    elif effect_type == "limiter":
        return Limiter(
            threshold_db=params.get("threshold_db", -10.0),
            release_ms=params.get("release_ms", 100.0)
        )

    # Gain - volume adjustment
    elif effect_type == "gain":
        return Gain(
            gain_db=params.get("gain_db", 0.0)
        )

    # Distortion - harmonic distortion
    elif effect_type == "distortion":
        return Distortion(
            drive_db=params.get("drive_db", 25.0)
        )

    # Chorus - modulated delay effect
    elif effect_type == "chorus":
        return Chorus(
            rate_hz=params.get("rate_hz", 1.0),
            depth=params.get("depth", 0.25),
            centre_delay_ms=params.get("centre_delay_ms", 7.0),
            feedback=params.get("feedback", 0.0),
            mix=params.get("mix", 0.5)
        )

    # Phaser - phase shifting effect
    elif effect_type == "phaser":
        return Phaser(
            rate_hz=params.get("rate_hz", 1.0),
            depth=params.get("depth", 0.5),
            centre_frequency_hz=params.get("centre_frequency_hz", 1300.0),
            feedback=params.get("feedback", 0.0),
            mix=params.get("mix", 0.5)
        )

    # Bitcrush - reduce bit depth for lo-fi effect
    elif effect_type == "bitcrush":
        return Bitcrush(
            bit_depth=params.get("bit_depth", 8.0)
        )

    # Highpass Filter - attenuate low frequencies
    elif effect_type == "highpass":
        return HighpassFilter(
            cutoff_frequency_hz=params.get("cutoff_frequency_hz", 50.0)
        )

    # Lowpass Filter - attenuate high frequencies
    elif effect_type == "lowpass":
        return LowpassFilter(
            cutoff_frequency_hz=params.get("cutoff_frequency_hz", 5000.0)
        )

    # Ladder Filter - Moog-style filter
    elif effect_type == "ladderfilter":
        return LadderFilter(
            mode=LadderFilter.Mode[params.get("mode", "LPF12")],
            cutoff_hz=params.get("cutoff_hz", 200.0),
            resonance=params.get("resonance", 0.0),
            drive=params.get("drive", 1.0)
        )

    # High Shelf Filter - boost/cut high frequencies
    elif effect_type == "highshelf":
        return HighShelfFilter(
            cutoff_frequency_hz=params.get("cutoff_frequency_hz", 1000.0),
            gain_db=params.get("gain_db", 0.0),
            q=params.get("q", 0.7071067690849304)
        )

    # Low Shelf Filter - boost/cut low frequencies
    elif effect_type == "lowshelf":
        return LowShelfFilter(
            cutoff_frequency_hz=params.get("cutoff_frequency_hz", 300.0),
            gain_db=params.get("gain_db", 0.0),
            q=params.get("q", 0.7071067690849304)
        )

    # Pitch Shift - change pitch without changing tempo
    elif effect_type == "pitchshift":
        return PitchShift(
            semitones=params.get("semitones", 0.0)
        )

    # Clipping - hard clipping distortion
    elif effect_type == "clipping":
        return Clipping(
            threshold_db=params.get("threshold_db", -6.0)
        )

    # Invert - flip signal polarity
    elif effect_type == "invert":
        return Invert()

    # MP3 Compressor - add MP3 compression artifacts
    elif effect_type == "mp3compressor":
        return MP3Compressor(
            vbr_quality=params.get("vbr_quality", 2.0)
        )

    # Resample - change sample rate
    elif effect_type == "resample":
        return Resample(
            target_sample_rate=params.get("target_sample_rate", 44100.0)
        )

    else:
        raise ValueError(f"Unknown effect type: {effect_type}")


def apply_effects_chain(input_path: str, output_path: str, effects: List[Dict[str, Any]]):
    """
    Apply a chain of effects to an audio file

    Args:
        input_path: Path to input audio file
        output_path: Path to save processed audio
        effects: List of effect configurations, each with 'type' and 'params'
    """
    import os

    # Validate input file exists
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    # Create effect instances
    effect_chain = []
    for effect_config in effects:
        effect = create_effect(effect_config["type"], effect_config["params"])
        effect_chain.append(effect)

    # Create Pedalboard with all effects (empty chain is valid - it will just copy the audio)
    board = Pedalboard(effect_chain)

    # Read input audio file
    with AudioFile(input_path) as f:
        audio = f.read(f.frames)
        sample_rate = f.samplerate
        num_channels = audio.shape[0] if len(audio.shape) > 1 else 1

    # Apply effects
    processed_audio = board(audio, sample_rate)

    # Ensure output directory exists
    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    # Write output audio file
    with AudioFile(output_path, 'w', sample_rate, num_channels) as f:
        f.write(processed_audio)


def get_available_effects():
    """
    Return a list of all available effects with their parameters
    """
    return {
        "reverb": {
            "name": "Reverb",
            "description": "Adds spatial ambience and echo",
            "params": {
                "room_size": {"min": 0.0, "max": 1.0, "default": 0.5},
                "damping": {"min": 0.0, "max": 1.0, "default": 0.5},
                "wet_level": {"min": 0.0, "max": 1.0, "default": 0.33},
                "dry_level": {"min": 0.0, "max": 1.0, "default": 0.4},
                "width": {"min": 0.0, "max": 1.0, "default": 1.0},
                "freeze_mode": {"min": 0.0, "max": 1.0, "default": 0.0}
            }
        },
        "delay": {
            "name": "Delay",
            "description": "Creates echo effect",
            "params": {
                "delay_seconds": {"min": 0.0, "max": 2.0, "default": 0.5},
                "feedback": {"min": 0.0, "max": 1.0, "default": 0.0},
                "mix": {"min": 0.0, "max": 1.0, "default": 0.5}
            }
        },
        "compressor": {
            "name": "Compressor",
            "description": "Reduces dynamic range",
            "params": {
                "threshold_db": {"min": -60.0, "max": 0.0, "default": 0.0},
                "ratio": {"min": 1.0, "max": 20.0, "default": 1.0},
                "attack_ms": {"min": 0.1, "max": 100.0, "default": 1.0},
                "release_ms": {"min": 1.0, "max": 1000.0, "default": 100.0}
            }
        },
        "limiter": {
            "name": "Limiter",
            "description": "Prevents audio from exceeding threshold",
            "params": {
                "threshold_db": {"min": -60.0, "max": 0.0, "default": -10.0},
                "release_ms": {"min": 1.0, "max": 1000.0, "default": 100.0}
            }
        },
        "gain": {
            "name": "Gain",
            "description": "Adjusts volume",
            "params": {
                "gain_db": {"min": -60.0, "max": 60.0, "default": 0.0}
            }
        },
        "distortion": {
            "name": "Distortion",
            "description": "Adds harmonic distortion",
            "params": {
                "drive_db": {"min": 0.0, "max": 100.0, "default": 25.0}
            }
        },
        "chorus": {
            "name": "Chorus",
            "description": "Modulated delay for thickness",
            "params": {
                "rate_hz": {"min": 0.0, "max": 10.0, "default": 1.0},
                "depth": {"min": 0.0, "max": 1.0, "default": 0.25},
                "centre_delay_ms": {"min": 1.0, "max": 50.0, "default": 7.0},
                "feedback": {"min": 0.0, "max": 1.0, "default": 0.0},
                "mix": {"min": 0.0, "max": 1.0, "default": 0.5}
            }
        },
        "phaser": {
            "name": "Phaser",
            "description": "Sweeping phase shift effect",
            "params": {
                "rate_hz": {"min": 0.0, "max": 10.0, "default": 1.0},
                "depth": {"min": 0.0, "max": 1.0, "default": 0.5},
                "centre_frequency_hz": {"min": 200.0, "max": 5000.0, "default": 1300.0},
                "feedback": {"min": 0.0, "max": 1.0, "default": 0.0},
                "mix": {"min": 0.0, "max": 1.0, "default": 0.5}
            }
        },
        "bitcrush": {
            "name": "Bitcrush",
            "description": "Lo-fi digital reduction",
            "params": {
                "bit_depth": {"min": 1.0, "max": 32.0, "default": 8.0}
            }
        },
        "highpass": {
            "name": "Highpass Filter",
            "description": "Removes low frequencies",
            "params": {
                "cutoff_frequency_hz": {"min": 20.0, "max": 20000.0, "default": 50.0}
            }
        },
        "lowpass": {
            "name": "Lowpass Filter",
            "description": "Removes high frequencies",
            "params": {
                "cutoff_frequency_hz": {"min": 20.0, "max": 20000.0, "default": 5000.0}
            }
        },
        "ladderfilter": {
            "name": "Ladder Filter",
            "description": "Moog-style resonant filter",
            "params": {
                "mode": {"options": ["LPF12", "HPF12", "BPF12", "LPF24", "HPF24", "BPF24"], "default": "LPF12"},
                "cutoff_hz": {"min": 20.0, "max": 20000.0, "default": 200.0},
                "resonance": {"min": 0.0, "max": 1.0, "default": 0.0},
                "drive": {"min": 1.0, "max": 10.0, "default": 1.0}
            }
        },
        "highshelf": {
            "name": "High Shelf Filter",
            "description": "Boost/cut high frequencies",
            "params": {
                "cutoff_frequency_hz": {"min": 20.0, "max": 20000.0, "default": 1000.0},
                "gain_db": {"min": -60.0, "max": 60.0, "default": 0.0},
                "q": {"min": 0.1, "max": 10.0, "default": 0.7071067690849304}
            }
        },
        "lowshelf": {
            "name": "Low Shelf Filter",
            "description": "Boost/cut low frequencies",
            "params": {
                "cutoff_frequency_hz": {"min": 20.0, "max": 20000.0, "default": 300.0},
                "gain_db": {"min": -60.0, "max": 60.0, "default": 0.0},
                "q": {"min": 0.1, "max": 10.0, "default": 0.7071067690849304}
            }
        },
        "pitchshift": {
            "name": "Pitch Shift",
            "description": "Change pitch without tempo change",
            "params": {
                "semitones": {"min": -12.0, "max": 12.0, "default": 0.0}
            }
        },
        "clipping": {
            "name": "Clipping",
            "description": "Hard clipping distortion",
            "params": {
                "threshold_db": {"min": -60.0, "max": 0.0, "default": -6.0}
            }
        },
        "invert": {
            "name": "Invert",
            "description": "Flips signal polarity",
            "params": {}
        },
        "mp3compressor": {
            "name": "MP3 Compressor",
            "description": "Adds MP3 compression artifacts",
            "params": {
                "vbr_quality": {"min": 0.0, "max": 9.9, "default": 2.0}
            }
        },
        "resample": {
            "name": "Resample",
            "description": "Changes sample rate",
            "params": {
                "target_sample_rate": {"min": 8000.0, "max": 192000.0, "default": 44100.0}
            }
        }
    }
