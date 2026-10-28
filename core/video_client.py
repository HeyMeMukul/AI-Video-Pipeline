"""
core/video_client.py
────────────────────
Multi-backend video generation client with Kling AI multi-account support:

Backends (in priority order):
  1. "kling" (Kling AI 1.5/2.0 — Dual Google Account free daily credits w/ auto-failover)
  2. "huggingface" (100% FREE with HF_TOKEN — Stable Video Diffusion / CogVideoX)
  3. "veo" (Google Veo 3.1 with GOOGLE_API_KEY)
  4. "fal" (Ultra-cheap ~$0.01-$0.02/clip — LTX-Video, Wan 2.1)
  5. "replicate" (Ultra-cheap ~$0.01/clip — LTX-Video, SVD)
  6. "mock" (Offline / Dev mode fallback — Keyframe motion synthesis)
"""

from __future__ import annotations

import base64
import json
import os
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml


def _load_dotenv():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if k and v and k not in os.environ:
                        os.environ[k] = v


def _load_config():
    _load_dotenv()
    cfg_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            return yaml.safe_load(f) or {}
    return {}


def _truncate_prompt(prompt: str, max_chars: int = 1900) -> str:
    """Truncate long prompts safely at sentence/word boundaries."""
    if len(prompt) <= max_chars:
        return prompt
    truncated = prompt[:max_chars]
    last_period = truncated.rfind(". ")
    if last_period > max_chars // 2:
        return truncated[:last_period + 1].strip()
    last_space = truncated.rfind(" ")
    if last_space > 0:
        return truncated[:last_space].strip()
    return truncated.strip()


class VideoClient:
    """
    Multi-provider Video Generation Client.
    Supports Kling AI (2-account rotation), HuggingFace SVD, Google Veo, Fal, Replicate, and Mock.
    """

    def __init__(self, provider: Optional[str] = None, model: Optional[str] = None):
        _load_dotenv()
        cfg = _load_config()
        vcfg = cfg.get("video", {})
        self.provider = provider or vcfg.get("provider", "kling")
        self.model = model or vcfg.get("model", "kling-v1")
        self.default_duration = vcfg.get("default_duration_seconds", 5)
        self.default_aspect = vcfg.get("default_aspect_ratio", "9:16")
        self.max_retries = vcfg.get("max_retries", 3)

    def generate(
        self,
        prompt: str,
        output_path: str | Path,
        *,
        duration_seconds: Optional[int] = None,
        aspect_ratio: Optional[str] = None,
        reference_image_path: Optional[str] = None,
        negative_prompt: str = "morphing, distorted limbs, extra characters, text, watermark, logo, blurry",
    ) -> str:
        """
        Generate a video clip using the selected backend with automatic fallback.
        Returns the path to the saved .mp4 file.
        """
        duration = duration_seconds or self.default_duration
        aspect = aspect_ratio or self.default_aspect
        out_file = Path(output_path)
        out_file.parent.mkdir(parents=True, exist_ok=True)

        print(f"[VideoClient] Requesting video ({self.provider}:{self.model}) -> {out_file.name}")
        try:
            if self.provider == "kaggle":
                return self._generate_kaggle(prompt, out_file, duration, negative_prompt, aspect)
            elif self.provider == "kling":
                return self._generate_kling(prompt, out_file, duration, aspect, reference_image_path)
            elif self.provider == "huggingface":
                return self._generate_huggingface_free(prompt, out_file, duration, reference_image_path, aspect)
            elif self.provider == "veo":
                return self._generate_veo(prompt, out_file, duration, aspect, negative_prompt)
            elif self.provider == "krea":
                return self._generate_krea(prompt, out_file, duration, aspect, reference_image_path, negative_prompt)
            elif self.provider == "fal":
                return self._generate_fal(prompt, out_file, duration, aspect, reference_image_path)
            elif self.provider == "replicate":
                return self._generate_replicate(prompt, out_file, duration, reference_image_path)
            elif self.provider == "mock":
                return self._mock_generate(out_file, prompt, duration, aspect, reference_image_path)
            else:
                print(f"[VideoClient] Unknown provider '{self.provider}'. Trying Kling first.")
                return self._generate_kling(prompt, out_file, duration, aspect, reference_image_path)
        except Exception as err:
            print(f"[VideoClient] Generation with {self.provider} failed: {err}")
            # Dynamic Fallback Cascade: kling → krea → huggingface → veo → mock
            if self.provider != "kling":
                try:
                    print("[VideoClient] Trying Kling AI as fallback…")
                    return self._generate_kling(prompt, out_file, duration, aspect, reference_image_path)
                except Exception as kling_err:
                    print(f"[VideoClient] Kling fallback note: {kling_err}")
            if self.provider != "krea":
                try:
                    print("[VideoClient] Trying Krea AI as fallback…")
                    return self._generate_krea(prompt, out_file, duration, aspect, reference_image_path, negative_prompt)
                except Exception as krea_err:
                    print(f"[VideoClient] Krea fallback note: {krea_err}")
            if self.provider != "huggingface":
                try:
                    print("[VideoClient] Trying HuggingFace as fallback…")
                    return self._generate_huggingface_free(prompt, out_file, duration, reference_image_path, aspect)
                except Exception as hf_err:
                    print(f"[VideoClient] HuggingFace fallback note: {hf_err}")
            if self.provider != "veo":
                try:
                    print("[VideoClient] Trying Veo as fallback…")
                    return self._generate_veo(prompt, out_file, duration, aspect, negative_prompt)
                except Exception as veo_err:
                    print(f"[VideoClient] Veo fallback note: {veo_err}")

            print("[VideoClient] All external video APIs unavailable. Synthesizing cinematic shot from keyframe...")
            return self._mock_generate(out_file, prompt, duration, aspect, reference_image_path)

    # ─────────────────────────────────────────────────────────
    # 1. Kling AI (Dual-Account Free Daily Credits w/ Auto-Failover)
    # ─────────────────────────────────────────────────────────

    def _generate_kling(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        aspect: str = "9:16",
        reference_image_path: Optional[str] = None,
    ) -> str:
        """
        Kling AI API integration with automatic 2-Account failover.
        Supports both AccessKey/SecretKey (JWT auth) and direct API token.
        Supports Image-to-Video (I2V) and Text-to-Video (T2V).
        """
        _load_dotenv()
        accounts = self._get_kling_accounts()

        if not accounts:
            raise ValueError(
                "No Kling AI credentials configured. Please set KLING_ACCESS_KEY_1 / KLING_SECRET_KEY_1 "
                "or KLING_API_KEY_1 in your .env file."
            )

        # Clean prompt for Kling (declarative sentences, 80-150 words)
        clean_prompt = _truncate_prompt(prompt, max_chars=800)
        # Kling duration is either "5" or "10"
        kling_duration = "10" if duration >= 8 else "5"
        kling_aspect = aspect if aspect in ("9:16", "16:9", "1:1") else "9:16"

        # Resolve starting image if available for I2V
        ref_img = None
        if reference_image_path and Path(reference_image_path).exists() and Path(reference_image_path).stat().st_size > 1000:
            ref_img = str(reference_image_path)
        else:
            candidate = output_path.parent.parent / "storyboards" / f"{output_path.stem}_frame.png"
            if candidate.exists() and candidate.stat().st_size > 1000:
                ref_img = str(candidate)

        last_error = None
        for acc_idx, acc_token in enumerate(accounts, start=1):
            print(f"[VideoClient] Attempting Kling AI generation with Account {acc_idx}…")
            try:
                video_url = self._call_kling_api(acc_token, clean_prompt, kling_duration, kling_aspect, ref_img)
                if video_url:
                    # Download video
                    import urllib.request
                    urllib.request.urlretrieve(video_url, str(output_path))
                    print(f"[VideoClient] ✅ Kling AI Video Saved via Account {acc_idx}: {output_path.name}")
                    return str(output_path)
            except Exception as e:
                err_str = str(e)
                print(f"[VideoClient] ⚠️ Kling Account {acc_idx} failed: {err_str[:200]}")
                last_error = e
                # Continue loop to next account (automatic failover!)

        raise RuntimeError(f"All configured Kling AI accounts failed. Last error: {last_error}")

    def _get_kling_accounts(self) -> List[str]:
        """Collect authentication tokens for Account 1 and Account 2."""
        _load_dotenv()
        tokens = []

        # Account 1
        tok1 = self._resolve_kling_token(
            os.getenv("KLING_ACCESS_KEY_1") or os.getenv("KLING_ACCESS_KEY"),
            os.getenv("KLING_SECRET_KEY_1") or os.getenv("KLING_SECRET_KEY"),
            os.getenv("KLING_API_KEY_1") or os.getenv("KLING_API_KEY"),
        )
        if tok1:
            tokens.append(tok1)

        # Account 2
        tok2 = self._resolve_kling_token(
            os.getenv("KLING_ACCESS_KEY_2"),
            os.getenv("KLING_SECRET_KEY_2"),
            os.getenv("KLING_API_KEY_2"),
        )
        if tok2:
            tokens.append(tok2)

        return tokens

    def _resolve_kling_token(self, ak: Optional[str], sk: Optional[str], api_key: Optional[str]) -> Optional[str]:
        """Generate JWT Bearer token or return raw API key."""
        if api_key and not api_key.startswith("your_"):
            return api_key.strip()
        if ak and sk and not ak.startswith("your_") and not sk.startswith("your_"):
            try:
                import jwt
                headers = {"alg": "HS256", "typ": "JWT"}
                now = int(time.time())
                payload = {
                    "iss": ak.strip(),
                    "exp": now + 1800,
                    "nbf": now - 5,
                }
                return jwt.encode(payload, sk.strip(), headers=headers)
            except Exception as e:
                print(f"[VideoClient] Error generating Kling JWT token: {e}")
                return None
        return None

    def _call_kling_api(
        self,
        token: str,
        prompt: str,
        duration: str,
        aspect: str,
        image_path: Optional[str] = None,
    ) -> str:
        """Submit job to Kling API and poll until complete."""
        base_url = "https://api.klingai.com/v1"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "AIVideoPipeline/1.0",
        }

        kling_model = self.model if self.model in ("kling-v2-6", "kling-v3", "kling-v1-6") else "kling-v2-6"

        # 1. Choose endpoint (Image-to-Video vs Text-to-Video)
        if image_path and Path(image_path).exists():
            endpoint = "/videos/image2video"
            img_b64 = base64.b64encode(Path(image_path).read_bytes()).decode("utf-8")
            payload = {
                "model_name": kling_model,
                "image": img_b64,
                "prompt": prompt,
                "cfg_scale": 0.5,
                "mode": "std",
                "duration": duration,
            }
        else:
            endpoint = "/videos/text2video"
            payload = {
                "model_name": kling_model,
                "prompt": prompt,
                "aspect_ratio": aspect,
                "cfg_scale": 0.5,
                "mode": "std",
                "duration": duration,
            }

        # 2. Submit task
        req = urllib.request.Request(
            f"{base_url}{endpoint}",
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
                msg = err_body.get("message") or err_body
            except Exception:
                msg = str(e)
            raise RuntimeError(f"Kling API error ({e.code}): {msg}")

        if data.get("code") != 0:
            raise RuntimeError(f"Kling API submission rejected: {data.get('message', data)}")

        task_id = data.get("data", {}).get("task_id")
        if not task_id:
            raise RuntimeError(f"No task_id in Kling response: {data}")

        print(f"[VideoClient] Kling task submitted ({task_id}), waiting for render…")

        # 3. Poll task status
        poll_url = f"{base_url}{endpoint}/{task_id}"
        max_polls = 60  # 10 minutes max
        for poll in range(max_polls):
            time.sleep(8)
            poll_req = urllib.request.Request(poll_url, headers=headers, method="GET")
            with urllib.request.urlopen(poll_req, timeout=30) as poll_resp:
                poll_data = json.loads(poll_resp.read().decode("utf-8"))

            t_data = poll_data.get("data", {})
            status = t_data.get("task_status")

            if status == "succeed":
                videos = t_data.get("task_result", {}).get("videos", [])
                if videos and "url" in videos[0]:
                    return videos[0]["url"]
                raise RuntimeError("Kling task succeeded but returned no video URL")

            elif status == "failed":
                reason = t_data.get("task_status_msg", "Unknown error")
                raise RuntimeError(f"Kling task failed: {reason}")

            if (poll + 1) % 3 == 0:
                print(f"[VideoClient] Kling render in progress… ({(poll + 1) * 8}s elapsed)")

        raise TimeoutError(f"Kling task timed out after {max_polls * 8} seconds.")

    # ─────────────────────────────────────────────────────────
    # 2. 100% FREE: HuggingFace Spaces (Stable Video Diffusion / CogVideoX)
    # ─────────────────────────────────────────────────────────

    def _generate_huggingface_free(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        reference_image_path: Optional[str] = None,
        aspect: str = "9:16",
    ) -> str:
        """
        Generate true AI temporal diffusion video using Hugging Face ZeroGPU Spaces.
        100% FREE with authenticated HF_TOKEN.
        """
        try:
            from gradio_client import Client, handle_file  # type: ignore
        except ImportError:
            print("[VideoClient] gradio_client not installed. Falling back to mock.")
            return self._mock_generate(output_path, prompt, duration, aspect, reference_image_path)

        _load_dotenv()
        hf_token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY")
        width, height = (1080, 1920) if aspect == "9:16" else (1920, 1080)

        ref_img = None
        if reference_image_path and Path(reference_image_path).exists() and Path(reference_image_path).stat().st_size > 1000:
            ref_img = str(reference_image_path)
        else:
            candidate = output_path.parent.parent / "storyboards" / f"{output_path.stem}_frame.png"
            if candidate.exists() and candidate.stat().st_size > 1000:
                ref_img = str(candidate)

        space_name = self.model if "/" in self.model else "multimodalart/stable-video-diffusion"
        print(f"[VideoClient] Connecting to free HuggingFace Space: {space_name}…")

        try:
            client = Client(space_name, token=hf_token)
        except TypeError:
            client = Client(space_name)

        raw_video = None
        if "stable-video-diffusion" in space_name.lower():
            if not ref_img or not Path(ref_img).exists():
                raise ValueError("SVD requires a reference keyframe image, but none was provided.")

            print(f"[VideoClient] 🎬 Submitting SVD diffusion job: {Path(ref_img).name} -> {output_path.name}…")
            result = client.predict(
                image=handle_file(ref_img),
                seed=42,
                randomize_seed=True,
                motion_bucket_id=127,
                fps_id=6,
                api_name="/video",
            )
            raw_video = result[0]["video"] if isinstance(result[0], dict) else result[0]
        else:
            print(f"[VideoClient] 🎬 Submitting CogVideoX job: {output_path.name}…")
            result = client.predict(
                prompt=prompt,
                image_input=handle_file(ref_img) if ref_img else None,
                video_input=None,
                video_strength=0.8,
                seed_value=-1,
                scale_status=False,
                rife_status=False,
                api_name="/generate",
            )
            raw_video = result[1] if isinstance(result, (list, tuple)) and len(result) > 1 else result[0]
            if isinstance(raw_video, dict):
                raw_video = raw_video.get("video", str(raw_video))

        if not raw_video or not Path(raw_video).exists():
            raise RuntimeError(f"HuggingFace space did not return a valid video file: {raw_video}")

        import subprocess
        vf = (
            f"scale={width}:{height}:force_original_aspect_ratio=increase,"
            f"crop={width}:{height},"
            f"fps=30"
        )
        cmd = [
            "ffmpeg", "-y",
            "-stream_loop", "-1",
            "-i", str(raw_video),
            "-vf", vf,
            "-t", str(duration),
            "-c:v", "libx264",
            "-preset", "fast",
            "-pix_fmt", "yuv420p",
            str(output_path),
        ]
        subprocess.run(cmd, capture_output=True, check=True)
        print(f"[VideoClient] ✅ Free AI Diffusion Video Saved: {output_path} ({duration}s @ {width}x{height})")
        return str(output_path)

    # ─────────────────────────────────────────────────────────
    # 3. Google Veo 3.1 (FREE with GOOGLE_API_KEY on free tier)
    # ─────────────────────────────────────────────────────────

    def _generate_veo(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        aspect_ratio: str,
        negative_prompt: str,
    ) -> str:
        """Google Veo 3.1 via google.genai SDK."""
        from google import genai as google_genai  # type: ignore
        from google.genai import types as gtypes  # type: ignore

        _load_dotenv()
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY not found in environment.")

        client = google_genai.Client(api_key=api_key)
        veo_duration = max(5, min(8, duration))
        prompt_text = _truncate_prompt(prompt, max_chars=1900)
        veo_aspect = aspect_ratio if aspect_ratio in ("9:16", "16:9", "1:1") else "9:16"

        veo_models = [
            "veo-3.1-lite-generate-preview",
            "veo-3.1-fast-generate-preview",
            "veo-3.1-generate-preview",
        ]
        if "veo" in self.model:
            if self.model in veo_models:
                veo_models = [self.model] + [m for m in veo_models if m != self.model]
            else:
                veo_models = [self.model] + veo_models

        last_err = None
        for veo_model in veo_models:
            try:
                print(f"[VideoClient] Submitting Veo job ({veo_model}): {output_path.name}…")
                operation = client.models.generate_videos(
                    model=veo_model,
                    source=gtypes.GenerateVideosSource(prompt=prompt_text),
                    config=gtypes.GenerateVideosConfig(
                        aspect_ratio=veo_aspect,
                        number_of_videos=1,
                        duration_seconds=veo_duration,
                    ),
                )

                max_polls = 60
                polls = 0
                while not operation.done and polls < max_polls:
                    time.sleep(10)
                    operation = client.operations.get(operation)
                    polls += 1
                    print(f"[VideoClient] Veo processing… ({polls * 10}s elapsed)")

                if not operation.done:
                    raise TimeoutError(f"Veo job timed out after {polls * 10}s")

                if not operation.response or not operation.response.generated_videos:
                    raise RuntimeError("Veo returned empty response (no generated_videos)")

                video = operation.response.generated_videos[0]
                client.files.download(file=video.video, download_path=str(output_path))
                print(f"[VideoClient] ✅ Veo Video Saved: {output_path}")
                return str(output_path)

            except Exception as e:
                err_msg = str(e)
                if "RESOURCE_EXHAUSTED" in err_msg or "quota" in err_msg.lower():
                    print(f"[VideoClient] Veo quota exceeded on {veo_model}: {err_msg[:200]}")
                    last_err = e
                    break
                elif "INVALID_ARGUMENT" in err_msg:
                    print(f"[VideoClient] Veo invalid arg on {veo_model}: {err_msg[:200]}")
                    last_err = e
                    continue
                else:
                    print(f"[VideoClient] Veo error on {veo_model}: {err_msg[:200]}")
                    last_err = e
                    continue

        raise RuntimeError(f"All Veo model tiers failed. Last error: {last_err}")

    # ─────────────────────────────────────────────────────────
    # 4. Ultra-Cheap (~$0.01): fal.ai
    # ─────────────────────────────────────────────────────────

    def _generate_fal(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        aspect_ratio: str,
        reference_image_path: Optional[str] = None,
    ) -> str:
        """fal.ai API — LTX-Video (~$0.01) or Wan 2.1 (~$0.02)"""
        _load_dotenv()
        fal_key = os.getenv("FAL_KEY") or os.getenv("FAL_API_KEY")
        if not fal_key:
            raise ValueError("FAL_KEY not found in environment.")

        try:
            import fal_client  # type: ignore
        except ImportError:
            raise ImportError("fal-client not installed (pip install fal-client).")

        model_id = self.model if "fal-ai" in self.model else "fal-ai/wan/v2.1/1.3b"
        print(f"[VideoClient] Calling fal.ai model: {model_id}…")

        arguments = {
            "prompt": prompt,
            "duration": f"{duration}s",
            "aspect_ratio": aspect_ratio,
        }

        if reference_image_path and Path(reference_image_path).exists():
            image_url = fal_client.upload_file(reference_image_path)
            arguments["image_url"] = image_url

        result = fal_client.subscribe(model_id, arguments=arguments)
        video_url = result.get("video", {}).get("url")

        if not video_url:
            raise RuntimeError(f"No video URL in fal response: {result}")

        import urllib.request
        urllib.request.urlretrieve(video_url, str(output_path))
        print(f"[VideoClient] ✅ fal.ai Video Saved: {output_path}")
        return str(output_path)

    # ─────────────────────────────────────────────────────────
    # 5. Ultra-Cheap (~$0.01): Replicate
    # ─────────────────────────────────────────────────────────

    def _generate_replicate(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        reference_image_path: Optional[str] = None,
    ) -> str:
        """Replicate API — LTX-Video (~$0.01) or SVD (~$0.008)"""
        _load_dotenv()
        rep_token = os.getenv("REPLICATE_API_TOKEN")
        if not rep_token:
            raise ValueError("REPLICATE_API_TOKEN not found.")

        try:
            import replicate  # type: ignore
        except ImportError:
            raise ImportError("replicate not installed (pip install replicate).")

        model_id = self.model if "/" in self.model else "lightricks/ltx-video"
        print(f"[VideoClient] Calling Replicate: {model_id}…")

        inputs = {"prompt": prompt}
        if reference_image_path and Path(reference_image_path).exists():
            inputs["image"] = open(reference_image_path, "rb")

        output = replicate.run(model_id, input=inputs)
        video_url = output if isinstance(output, str) else str(output)

        import urllib.request
        urllib.request.urlretrieve(video_url, str(output_path))
        print(f"[VideoClient] ✅ Replicate Video Saved: {output_path}")
        return str(output_path)

    # ─────────────────────────────────────────────────────────
    # 6. Krea AI (Universal Video Generation API)
    # ─────────────────────────────────────────────────────────

    def _generate_krea(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        aspect: str = "16:9",
        reference_image_path: Optional[str] = None,
        negative_prompt: str = "",
    ) -> str:
        """
        Krea AI API integration (https://docs.krea.ai).
        Uses KREA_API_KEY or KREA_API_TOKEN environment variable.
        Supports async video generation with polling.
        """
        _load_dotenv()
        api_key = os.getenv("KREA_API_KEY") or os.getenv("KREA_API_TOKEN")
        if not api_key:
            raise ValueError(
                "KREA_API_KEY (or KREA_API_TOKEN) not found in environment. "
                "Get your key from https://krea.ai/settings/api-tokens"
            )

        clean_prompt = _truncate_prompt(prompt, max_chars=1000)
        krea_aspect = aspect if aspect in ("16:9", "9:16", "1:1") else "16:9"
        krea_duration = min(max(duration, 4), 10)

        headers = {
            "Authorization": f"Bearer {api_key.strip()}",
            "Content-Type": "application/json",
            "User-Agent": "CineStorm-AI-Film-Studio/2.0",
        }

        # Krea uses model-specific endpoints: https://api.krea.ai/generate/video/{provider}/{model}
        model_mapping = {
            "seedance-2": "bytedance/seedance-2",
            "seedance-2-5": "bytedance/seedance-2-5",
            "kling-3.0": "kling/kling-3.0",
            "kling": "kling/kling-3.0",
            "veo-3.1": "bytedance/seedance-2",
            "default": "bytedance/seedance-2",
        }
        endpoint_model = model_mapping.get(self.model, "bytedance/seedance-2")
        target_url = f"https://api.krea.ai/generate/video/{endpoint_model}"

        payload: Dict[str, Any] = {
            "prompt": clean_prompt,
            "aspect_ratio": krea_aspect,
            "duration": krea_duration,
        }
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt

        # Image-to-Video if reference frame exists
        if reference_image_path and Path(reference_image_path).exists() and Path(reference_image_path).stat().st_size > 1000:
            import base64
            with open(reference_image_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode("utf-8")
            payload["start_image"] = f"data:image/png;base64,{img_b64}"

        print(f"[VideoClient] Dispatching to Krea AI ({target_url})…")
        
        import json
        import urllib.request
        import time

        try:
            req = urllib.request.Request(
                target_url,
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as http_err:
            err_body = http_err.read().decode("utf-8", errors="ignore")
            if http_err.code == 402:
                raise RuntimeError(
                    f"Krea API Key authenticated, but API credit balance is $0.00: {err_body} "
                    "(Note: Krea API balance is separate from web app compute balance; top up at https://krea.ai/settings/api-tokens)"
                )
            raise RuntimeError(f"Krea API HTTP {http_err.code} error: {err_body}")

        task_id = data.get("task_id") or data.get("id") or data.get("job_id")
        if not task_id and data.get("video_url"):
            urllib.request.urlretrieve(data["video_url"], str(output_path))
            print(f"[VideoClient] ✅ Krea AI Video Saved directly: {output_path.name}")
            return str(output_path)

        if not task_id:
            raise RuntimeError(f"Krea AI response missing task_id: {data}")

        print(f"[VideoClient] Polling Krea task {task_id}…")
        poll_url = f"https://api.krea.ai/tasks/{task_id}"
        max_polls = 60
        for attempt in range(max_polls):
            time.sleep(5)
            try:
                poll_req = urllib.request.Request(poll_url, headers=headers)
                with urllib.request.urlopen(poll_req, timeout=20) as poll_resp:
                    poll_data = json.loads(poll_resp.read().decode("utf-8"))

                status = str(poll_data.get("status", "")).lower()
                if status in ("completed", "succeeded", "success", "done"):
                    video_url = poll_data.get("video_url") or poll_data.get("output", {}).get("video_url")
                    if video_url:
                        urllib.request.urlretrieve(video_url, str(output_path))
                        print(f"[VideoClient] ✅ Krea AI Video Saved: {output_path.name}")
                        return str(output_path)
                elif status in ("failed", "error"):
                    raise RuntimeError(f"Krea AI task failed: {poll_data.get('error') or poll_data}")
            except Exception as e:
                if "failed" in str(e).lower() or attempt == max_polls - 1:
                    raise
                print(f"[VideoClient] (Poll attempt {attempt + 1}/{max_polls}) waiting for Krea video render…")

        raise TimeoutError(f"Krea AI video generation timed out after {max_polls * 5} seconds.")

    # ─────────────────────────────────────────────────────────
    # 7. Mock Mode (Placeholder for offline development)
    # ─────────────────────────────────────────────────────────

    def _mock_generate(
        self,
        output_path: Path,
        prompt: str,
        duration: int = 7,
        aspect: str = "9:16",
        reference_image_path: Optional[str] = None,
    ) -> str:
        """Synthesize a cinematic shot using keyframe and FFmpeg motion."""
        mp4_path = output_path.with_suffix(".mp4")
        width, height = (1080, 1920) if aspect == "9:16" else (1920, 1080)

        img_path = None
        if reference_image_path and Path(reference_image_path).exists() and Path(reference_image_path).stat().st_size > 1000:
            img_path = Path(reference_image_path)
        else:
            candidate = output_path.parent.parent / "storyboards" / f"{output_path.stem}_frame.png"
            if candidate.exists() and candidate.stat().st_size > 1000:
                img_path = candidate

        import subprocess
        if img_path and img_path.exists() and img_path.stat().st_size > 1000:
            try:
                total_frames = duration * 30
                vf = (
                    f"scale={width}:{height}:force_original_aspect_ratio=increase,"
                    f"crop={width}:{height},"
                    f"zoompan=z='min(zoom+0.0012,1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={total_frames}:s={width}x{height}:fps=30,"
                    f"noise=alls=10:allf=t+u"
                )
                cmd = [
                    "ffmpeg", "-y",
                    "-loop", "1",
                    "-i", str(img_path),
                    "-vf", vf,
                    "-t", str(duration),
                    "-c:v", "libx264",
                    "-preset", "fast",
                    "-pix_fmt", "yuv420p",
                    str(mp4_path),
                ]
                subprocess.run(cmd, capture_output=True, check=True)
                print(f"[VideoClient] ✅ Cinematic Motion Clip Rendered: {mp4_path.name} ({duration}s)")
                return str(mp4_path)
            except Exception as e:
                print(f"[VideoClient] FFmpeg motion render error: {e}")

        try:
            cmd = [
                "ffmpeg", "-y",
                "-f", "lavfi",
                "-i", f"gradients=s={width}x{height}:c0=0x0a1420:c1=0x203040:d={duration}:r=30",
                "-f", "lavfi",
                "-i", "anullsrc=r=44100:cl=stereo",
                "-t", str(duration),
                "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-shortest",
                str(mp4_path),
            ]
            subprocess.run(cmd, capture_output=True, check=True)
            return str(mp4_path)
        except Exception:
            placeholder = output_path.with_suffix(".txt")
            placeholder.write_text(f"[MOCK VIDEO]\nPrompt: {prompt}\n", encoding="utf-8")
            return str(placeholder)

    def _generate_kaggle(
        self,
        prompt: str,
        output_path: Path,
        duration: int,
        negative_prompt: str,
        aspect: str = "9:16",
    ) -> str:
        """Generate a single clip via Kaggle cloud GPU."""
        import shutil
        from core.kaggle_client import KaggleVideoClient

        k_client = KaggleVideoClient()
        scene = {
            "scene_id": 1,
            "prompt": prompt,
            "duration": duration,
            "negative_prompt": negative_prompt,
            "aspect_ratio": aspect,
        }
        clips = k_client.render_scenes([scene], output_path.parent)
        if clips:
            if Path(clips[0]).resolve() != output_path.resolve():
                shutil.copy(clips[0], output_path)
            return str(output_path)
        raise RuntimeError("Kaggle rendering returned no clips.")

