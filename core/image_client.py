"""
core/image_client.py
────────────────────
Client for reference image generation (Imagen / DALL-E / Pollinations AI).
Used by the Reference Image Agent to generate character sheets and
scene keyframes before video generation.
"""

from __future__ import annotations

import base64
import os
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Optional

import yaml


def _load_config():
    cfg_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(cfg_path):
        with open(cfg_path) as f:
            return yaml.safe_load(f) or {}
    return {}


class ImageClient:
    """Generate reference images for characters and scenes."""

    def __init__(self):
        cfg = _load_config()
        icfg = cfg.get("image", {})
        self.provider = icfg.get("provider", "pollinations")
        self.model = icfg.get("model", "imagen-4.0-generate-preview-06-06")
        self._client = self._init_client()

    def _init_client(self):
        if self.provider in ("imagen", "gemini"):
            try:
                from google import genai as google_genai  # type: ignore
                api_key = (
                    os.getenv("GOOGLE_API_KEY")
                    or _load_config().get("api_keys", {}).get("google_api_key", "")
                )
                if api_key:
                    return google_genai.Client(api_key=api_key)
            except Exception:
                pass
            return None
        elif self.provider == "dalle":
            try:
                from openai import OpenAI  # type: ignore
                key = os.getenv("OPENAI_API_KEY", "")
                if key:
                    return OpenAI(api_key=key)
            except Exception:
                pass
            return None
        return None

    def generate(
        self,
        prompt: str,
        output_path: str | Path,
        *,
        aspect_ratio: str = "9:16",
        negative_prompt: str = "",
    ) -> str:
        """Generate an image and save to output_path. Returns the path."""
        output_path = Path(output_path)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # 1. Try configured paid provider if client is initialized
        if self.provider == "imagen" and self._client:
            try:
                return self._imagen_generate(prompt, output_path, aspect_ratio)
            except Exception as e:
                print(f"[ImageClient] Imagen failed ({e}), falling back to Pollinations AI...")

        elif self.provider == "dalle" and self._client:
            try:
                return self._dalle_generate(prompt, output_path)
            except Exception as e:
                print(f"[ImageClient] DALL-E failed ({e}), falling back to Pollinations AI...")

        # 1b. Gemini native image generation (free tier — same GOOGLE_API_KEY)
        if self.provider == "gemini" and self._client:
            try:
                return self._gemini_generate(prompt, output_path, aspect_ratio)
            except Exception as e:
                print(f"[ImageClient] Gemini image failed ({e}), falling back to Pollinations AI...")

        # 2. Free AI generation via Pollinations
        try:
            return self._pollinations_generate(prompt, output_path, aspect_ratio)
        except Exception as e:
            print(f"[ImageClient] Pollinations failed ({e}), using mock placeholder...")

        # 3. Offline fallback
        return self._mock_generate(output_path, prompt)

    # ─────────────────────────────────────────────────────────
    # Pollinations AI (Free, high-fidelity AI diffusion generation)
    # ─────────────────────────────────────────────────────────

    def _pollinations_generate(self, prompt: str, output_path: Path, aspect_ratio: str = "9:16") -> str:
        out_file = output_path.with_suffix(".png")
        # Determine dimensions
        if aspect_ratio == "9:16":
            width, height = 1080, 1920
        elif aspect_ratio == "16:9":
            width, height = 1920, 1080
        else:
            width, height = 1024, 1024

        # Clean prompt
        clean_prompt = prompt.replace("\n", " ").strip()
        encoded = urllib.parse.quote(clean_prompt)
        url = f"https://image.pollinations.ai/prompt/{encoded}?width={width}&height={height}&nologo=true&seed=42"
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )

        with urllib.request.urlopen(req, timeout=60) as resp:
            data = resp.read()
            if len(data) < 1000:
                raise ValueError(f"Received empty or truncated image ({len(data)} bytes)")
            out_file.write_bytes(data)

        print(f"[ImageClient] ✅ AI Reference Image Saved: {out_file} ({len(data)} bytes)")
        return str(out_file)

    # ─────────────────────────────────────────────────────────
    # Imagen
    # ─────────────────────────────────────────────────────────

    def _imagen_generate(self, prompt: str, output_path: Path, aspect_ratio: str) -> str:
        from google.genai import types as gtypes  # type: ignore

        result = self._client.models.generate_images(
            model=self.model,
            prompt=prompt,
            config=gtypes.GenerateImagesConfig(
                number_of_images=1,
                aspect_ratio=aspect_ratio,
                safety_filter_level="block_only_high",
                person_generation="allow_adult",
            ),
        )
        image_data = result.generated_images[0].image.image_bytes
        output_path.write_bytes(image_data)
        print(f"[ImageClient] Saved: {output_path}")
        return str(output_path)

    # ─────────────────────────────────────────────────────────
    # Gemini native image generation (free tier via GOOGLE_API_KEY)
    # ─────────────────────────────────────────────────────────

    def _gemini_generate(self, prompt: str, output_path: Path, aspect_ratio: str) -> str:
        """Gemini 2.5 Flash Image — photoreal plates on the free tier."""
        from google.genai import types as gtypes  # type: ignore

        model = self.model if ("gemini" in self.model and "image" in self.model) else "gemini-2.5-flash-image"
        ar = aspect_ratio if aspect_ratio in (
            "1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9",
        ) else "9:16"

        resp = self._client.models.generate_content(
            model=model,
            contents=[prompt],
            config=gtypes.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=gtypes.ImageConfig(aspect_ratio=ar),
            ),
        )
        for part in resp.candidates[0].content.parts:
            blob = getattr(part, "inline_data", None)
            if blob and blob.data:
                output_path.write_bytes(blob.data)
                print(f"[ImageClient] Saved Gemini image: {output_path} ({len(blob.data)} bytes)")
                return str(output_path)
        raise RuntimeError("Gemini returned no image data (possibly safety-filtered).")

    # ─────────────────────────────────────────────────────────
    # DALL-E
    # ─────────────────────────────────────────────────────────

    def _dalle_generate(self, prompt: str, output_path: Path) -> str:
        response = self._client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
            response_format="b64_json",
        )
        b64 = response.data[0].b64_json
        output_path.write_bytes(base64.b64decode(b64))
        print(f"[ImageClient] Saved: {output_path}")
        return str(output_path)

    # ─────────────────────────────────────────────────────────
    # Mock (offline fallback)
    # ─────────────────────────────────────────────────────────

    def _mock_generate(self, output_path: Path, prompt: str) -> str:
        png_path = output_path.with_suffix(".png")
        try:
            from PIL import Image, ImageDraw
            img = Image.new("RGB", (768, 1024), color=(15, 20, 28))
            draw = ImageDraw.Draw(img)
            draw.rectangle([10, 10, 758, 1014], outline=(70, 130, 180), width=3)
            title = f"AI FILM PIPELINE: {output_path.stem}"
            draw.text((30, 40), title, fill=(240, 240, 240))
            draw.text((30, 80), f"Prompt preview: {prompt[:120]}...", fill=(180, 180, 180))
            img.save(png_path, "PNG")
            print(f"[ImageClient] MOCK PNG created: {png_path}")
            return str(png_path)
        except Exception:
            placeholder = output_path.with_suffix(".txt")
            placeholder.write_text(f"[MOCK IMAGE]\nPrompt: {prompt}\n", encoding="utf-8")
            print(f"[ImageClient] MOCK — placeholder: {placeholder}")
            return str(placeholder)
