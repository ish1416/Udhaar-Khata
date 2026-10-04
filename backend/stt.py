import os
import tempfile
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_whisper_model = None

def get_whisper_model(model_size: str = "tiny"):
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            # 'tiny' or 'base' are super lightweight (~75MB) and blazing fast on Mac CPU/int8
            logger.info(f"Loading open-weight Whisper model ({model_size})...")
            _whisper_model = WhisperModel(model_size, device="cpu", compute_type="int8")
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to initialize faster-whisper: {e}")
            _whisper_model = False
    return _whisper_model

def transcribe_audio_bytes(audio_bytes: bytes, file_ext: str = ".webm", language: Optional[str] = None) -> Optional[str]:
    """Transcribe raw audio bytes using open-weight Whisper."""
    model = get_whisper_model()
    if not model:
        logger.warning("Whisper model unavailable.")
        return None

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as f:
            f.write(audio_bytes)
            temp_path = f.name

        # Transcribe
        # language='hi' or None (let Whisper auto-detect Hindi/English/Hinglish)
        segments, info = model.transcribe(
            temp_path,
            beam_size=5,
            language=language, # If None, auto detects
            task="transcribe"
        )
        transcript = " ".join([segment.text for segment in segments]).strip()
        logger.info(f"Detected language '{info.language}' with probability {info.language_probability:.2f}")
        return transcript
    except Exception as e:
        logger.error(f"Error during audio transcription: {e}")
        return None
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass
