"""
core/llm.py
───────────
Smart multi-provider LLM client with OmniRoute support.

Priority order:
  1. OmniRoute (if OMNIROUTE_API_KEY set) → routes across all your providers
  2. OpenRouter (if OPENROUTER_API_KEY set) → free tier models available
  3. Gemini (if GOOGLE_API_KEY set)
  4. OpenAI-compatible (any base_url override)
  5. Anthropic (if ANTHROPIC_API_KEY set)
  6. DeepSeek / Qwen / NVIDIA NIM (via openai-compat)
  7. HuggingFace Inference (free tier)

Each agent in the pipeline gets its own routing tier:
  - HEAVY (director, character-bible): best available reasoning model
  - MEDIUM (story-breakdown, cinematography, environment): balanced model
  - FAST (prompt-builder, qc, audio): fast + cheap model
  - ULTRA-FAST (simple transforms): smallest free model
"""

from __future__ import annotations

import json
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

import yaml


# ─────────────────────────────────────────────────────────
# Agent → Routing Tier mapping
# ─────────────────────────────────────────────────────────

# ─────────────────────────────────────────────────────────
# Agent → Routing Tier mapping
# ─────────────────────────────────────────────────────────

AGENT_TIERS = {
    # DIRECTOR TIER: Most critical reasoning — uses cutting-edge Gemini 3
    "director":          "director",

    # HEAVY: complex creative continuity (Character Bible)
    "character_bible":   "heavy",

    # QWEN SPECIALIST TIER: Visual prompts, reference concept art & detailed environments
    # Qwen excels at rich sensory world-building and exact prompt formula formatting!
    "prompt_builder":    "qwen_builder",
    "reference_image":   "qwen_builder",
    "environment_bible": "qwen_builder",

    # MEDIUM: creative but structured — auto-balanced
    "story_breakdown":   "medium",
    "cinematography":    "medium",
    "audio":             "medium",

    # FAST: evaluation & assembly — OmniRoute auto-switch or free fast models
    "qc":                "fast",

    # ULTRA-FAST: simple transforms
    "editor":            "ultra_fast",
    "video_generator":   "ultra_fast",
}


def _load_dotenv():
    """Load environment variables from .env file if present."""
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    k, v = line.split("=", 1)
                    k, v = k.strip(), v.strip()
                    if k and not os.environ.get(k):
                        os.environ[k] = v.strip("\"'")
        except Exception:
            pass

_load_dotenv()


def _load_config() -> Dict[str, Any]:
    _load_dotenv()
    config_path = os.path.join(os.path.dirname(__file__), "..", "config.yaml")
    if os.path.exists(config_path):
        with open(config_path, "r") as f:
            return yaml.safe_load(f) or {}
    return {}


def _get_env(*keys: str, fallback: str = "") -> str:
    """Return first matching env var from a list of candidates."""
    _load_dotenv()
    for key in keys:
        val = os.getenv(key, "")
        if val:
            return val
    return fallback


# ─────────────────────────────────────────────────────────
# Model catalogues per provider
# ─────────────────────────────────────────────────────────

# OmniRoute model IDs — Gemini 3 for Director + Qwen for Prompt/Environment + auto-switching / free models
OMNIROUTE_MODELS = {
    "director":     "google/gemini-3-flash",              # Gemini 3 for Director ✓
    "heavy":        "google/gemini-2.0-flash-thinking-exp", # Gemini 2.0 Flash Thinking / Pro ✓
    "qwen_builder": "qwen/qwen-2.5-72b-instruct",         # Qwen 2.5 for prompt building & visual world ✓
    "medium":       "auto",                               # OmniRoute auto-switch ✓
    "fast":         "auto:free",                          # OmniRoute auto free model ✓
    "ultra_fast":   "auto:free",                          # OmniRoute auto free model ✓
}

# OpenRouter model IDs (100% free tier models)
OPENROUTER_MODELS = {
    "director":     "google/gemini-2.0-flash-thinking-exp:free",
    "heavy":        "google/gemini-2.0-flash-exp:free",
    "qwen_builder": "qwen/qwen3-8b:free",
    "medium":       "deepseek/deepseek-chat-v3-0324:free",
    "fast":         "qwen/qwen3-8b:free",
    "ultra_fast":   "meta-llama/llama-3.1-8b-instruct:free",
}

# NVIDIA NIM free inference
NVIDIA_NIM_MODELS = {
    "director":     "nvidia/llama-3.1-nemotron-70b-instruct",
    "heavy":        "nvidia/llama-3.1-nemotron-70b-instruct",
    "qwen_builder": "meta/llama-3.3-70b-instruct",
    "medium":       "meta/llama-3.3-70b-instruct",
    "fast":         "meta/llama-3.1-8b-instruct",
    "ultra_fast":   "meta/llama-3.1-8b-instruct",
}

# Gemini models (Student Discount / Google AI Studio)
GEMINI_MODELS = {
    "director":     "gemini-3.7-flash",                   # Cutting-edge Gemini for Director
    "heavy":        "gemini-3.7-flash",                   # Deep reasoning for bibles
    "qwen_builder": "gemini-3.6-flash",                   # Rich visual world & prompts
    "medium":       "gemini-3.6-flash",                   # Fast & smart
    "fast":         "gemini-flash-lite-latest",           # Fast
    "ultra_fast":   "gemini-flash-lite-latest",           # Light
}

# DeepSeek direct
DEEPSEEK_MODELS = {
    "director":     "deepseek-reasoner",
    "heavy":        "deepseek-reasoner",
    "qwen_builder": "deepseek-chat",
    "medium":       "deepseek-chat",
    "fast":         "deepseek-chat",
    "ultra_fast":   "deepseek-chat",
}

# Qwen Cloud (Direct API)
QWEN_MODELS = {
    "director":     "qwen-max",
    "heavy":        "qwen-plus",
    "qwen_builder": "qwen-plus",                          # Qwen Plus for prompts & environment visual bibles ✓
    "medium":       "qwen-turbo",
    "fast":         "qwen-turbo",
    "ultra_fast":   "qwen-turbo",
}


# ─────────────────────────────────────────────────────────
# Router: detects available providers from env vars
# ─────────────────────────────────────────────────────────

class ProviderRouter:
    """
    Detects which providers are configured and picks the best one
    for a given tier. Falls back gracefully if a provider is unavailable.
    """

    def __init__(self):
        self._providers = self._detect_providers()

    def _detect_providers(self) -> List[str]:
        """Return ordered list of available providers (best first)."""
        available = []

        # Gemini Pro (Student Discount — primary workhorse)
        if _get_env("GOOGLE_API_KEY", "GEMINI_API_KEY"):
            available.append("gemini")

        # OmniRoute — if configured, routes through user's free/cheap model selections
        if _get_env("OMNIROUTE_API_KEY", "OMNIROUTE_KEY"):
            available.append("omniroute")

        # Qwen Cloud (Specialist for prompts & world descriptions)
        if _get_env("QWEN_CLOUD_API_KEY", "QWEN_API_KEY", "DASHSCOPE_API_KEY"):
            available.append("qwen")

        # OpenRouter — 100% free model endpoints (:free)
        if _get_env("OPENROUTER_API_KEY", "OPENROUTER_KEY"):
            available.append("openrouter")

        # DeepSeek (Free Web / Ultra-cheap API)
        if _get_env("DEEPSEEK_API_KEY"):
            available.append("deepseek")

        # NVIDIA NIM (Free tier)
        if _get_env("NVIDIA_API_KEY", "NIM_API_KEY"):
            available.append("nvidia_nim")

        # OpenAI (if configured)
        if _get_env("OPENAI_API_KEY"):
            available.append("openai")

        # HuggingFace (free inference)
        available.append("huggingface")

        # Anthropic (OpenCode Go — kept at lowest priority to avoid burning tokens)
        if _get_env("ANTHROPIC_API_KEY", "OPENCODE_API_KEY") and _get_env("ALLOW_EXPENSIVE_CLAUDE", "0") == "1":
            available.append("anthropic")

        return available

    def pick(self, tier: str = "medium") -> Tuple[str, str]:
        """
        Return (provider_name, model_id) for the best available provider
        at the given tier. Falls back through the priority chain.
        """
        valid_tiers = ("director", "heavy", "qwen_builder", "medium", "fast", "ultra_fast")
        tier = tier if tier in valid_tiers else "medium"

        for provider in self._providers:
            model = self._model_for(provider, tier)
            if model:
                return provider, model

        # Absolute fallback — use HuggingFace with a small model
        return "huggingface", "mistralai/Mistral-7B-Instruct-v0.3"

    def _model_for(self, provider: str, tier: str) -> Optional[str]:
        mapping = {
            "omniroute":  OMNIROUTE_MODELS,
            "openrouter": OPENROUTER_MODELS,
            "anthropic":  {"heavy": "claude-sonnet-4-5", "medium": "claude-haiku-3-5",
                           "fast": "claude-haiku-3-5", "ultra_fast": "claude-haiku-3-5"},
            "gemini":     GEMINI_MODELS,
            "nvidia_nim": NVIDIA_NIM_MODELS,
            "deepseek":   DEEPSEEK_MODELS,
            "qwen":       QWEN_MODELS,
            "openai":     {"heavy": "gpt-4o", "medium": "gpt-4o-mini",
                           "fast": "gpt-4o-mini", "ultra_fast": "gpt-4o-mini"},
            "huggingface": {"heavy": "mistralai/Mistral-7B-Instruct-v0.3",
                            "medium": "mistralai/Mistral-7B-Instruct-v0.3",
                            "fast": "mistralai/Mistral-7B-Instruct-v0.3",
                            "ultra_fast": "mistralai/Mistral-7B-Instruct-v0.3"},
        }
        return mapping.get(provider, {}).get(tier)

    @property
    def available(self) -> List[str]:
        return self._providers

    def summary(self) -> str:
        lines = ["Available LLM providers (priority order):"]
        for i, p in enumerate(self._providers, 1):
            heavy_provider, heavy_model = self.pick("heavy")
            fast_provider, fast_model = self.pick("fast")
            if p == heavy_provider:
                lines.append(f"  {i}. ★ {p} [HEAVY → {heavy_model}]")
            elif p == fast_provider:
                lines.append(f"  {i}. ✓ {p} [FAST → {fast_model}]")
            else:
                lines.append(f"  {i}.   {p}")
        return "\n".join(lines)


# Singleton router
_router: Optional[ProviderRouter] = None

def get_router() -> ProviderRouter:
    global _router
    if _router is None:
        _router = ProviderRouter()
    return _router


# ─────────────────────────────────────────────────────────
# LLMClient — unified interface
# ─────────────────────────────────────────────────────────

class LLMClient:
    """
    Unified LLM client. Supports OmniRoute, OpenRouter, Gemini,
    Anthropic, NVIDIA NIM, DeepSeek, Qwen, OpenAI, and HuggingFace.

    All OpenRouter/OmniRoute/DeepSeek/NIM/Qwen calls go through
    the OpenAI-compatible chat completions API — one unified path.
    """

    def __init__(
        self,
        provider: Optional[str] = None,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
        agent_name: Optional[str] = None,   # e.g. "director", "qc"
        tier: Optional[str] = None,         # override tier: heavy/medium/fast
    ):
        cfg = _load_config()
        llm_cfg = cfg.get("llm", {})

        # If provider/model explicitly given, use them directly
        if provider and model:
            self.provider = provider
            self.model = model
        elif agent_name:
            # Auto-route based on agent name
            tier = tier or AGENT_TIERS.get(agent_name, "medium")
            self.provider, self.model = get_router().pick(tier)
        else:
            # Use config.yaml default
            self.provider = llm_cfg.get("provider", "gemini")
            self.model = llm_cfg.get("model", "gemini-2.0-flash")

        self.temperature = temperature
        self.max_tokens = max_tokens
        self._openai_client = None  # Cached for OpenAI-compat providers

    # ─────────────────────────────────────────────────────────
    # Provider base URLs (OpenAI-compatible)
    # ─────────────────────────────────────────────────────────

    _OPENAI_COMPAT_URLS = {
        "omniroute":  ("OMNIROUTE_API_KEY",  "https://omniroute.ai/v1"),
        "openrouter": ("OPENROUTER_API_KEY",  "https://openrouter.ai/api/v1"),
        "nvidia_nim": ("NVIDIA_API_KEY",      "https://integrate.api.nvidia.com/v1"),
        "deepseek":   ("DEEPSEEK_API_KEY",    "https://api.deepseek.com"),
        "qwen":       ("QWEN_API_KEY",        "https://dashscope.aliyuncs.com/compatible-mode/v1"),
        "openai":     ("OPENAI_API_KEY",      "https://api.openai.com/v1"),
        # DASHSCOPE_API_KEY is the alias Alibaba uses for Qwen Cloud
    }

    def _get_openai_compat_client(self):
        """Return an openai.OpenAI client configured for the right base URL."""
        if self._openai_client:
            return self._openai_client

        from openai import OpenAI  # type: ignore

        if self.provider in self._OPENAI_COMPAT_URLS:
            env_key, base_url = self._OPENAI_COMPAT_URLS[self.provider]
            if self.provider == "qwen":
                api_key = _get_env("QWEN_CLOUD_API_KEY", "QWEN_API_KEY", "DASHSCOPE_API_KEY")
            else:
                api_key = _get_env(env_key)
            if not api_key:
                api_key = "dummy"  # Some providers (NIM free) accept dummy keys

            # Special headers for OpenRouter
            extra_headers = {}
            if self.provider == "openrouter":
                extra_headers = {
                    "HTTP-Referer": "https://github.com/cyb3rfy/AI-Video",
                    "X-Title": "AI-Film-Pipeline",
                }

            self._openai_client = OpenAI(
                api_key=api_key,
                base_url=base_url,
                default_headers=extra_headers if extra_headers else None,
            )
        else:
            api_key = _get_env("OPENAI_API_KEY")
            self._openai_client = OpenAI(api_key=api_key)

        return self._openai_client

    # ─────────────────────────────────────────────────────────
    # Unified complete()
    # ─────────────────────────────────────────────────────────

    def complete(self, system_prompt: str, user_message: str, retries: int = 3) -> str:
        """Return the model's text response with automatic retry."""
        last_err = None
        for attempt in range(retries):
            try:
                return self._complete_once(system_prompt, user_message)
            except Exception as e:
                last_err = e
                if attempt < retries - 1:
                    wait = 2 ** attempt  # exponential backoff: 1s, 2s, 4s
                    time.sleep(wait)
        raise RuntimeError(f"LLM call failed after {retries} retries: {last_err}")

    def _complete_once(self, system_prompt: str, user_message: str) -> str:
        # ── Gemini ──────────────────────────────────────────
        if self.provider == "gemini":
            return self._complete_gemini(system_prompt, user_message)

        # ── Anthropic (direct) ──────────────────────────────
        if self.provider == "anthropic":
            return self._complete_anthropic(system_prompt, user_message)

        # ── HuggingFace (free inference API) ────────────────
        if self.provider == "huggingface":
            return self._complete_huggingface(system_prompt, user_message)

        # ── All OpenAI-compatible providers ─────────────────
        # omniroute, openrouter, nvidia_nim, deepseek, qwen, openai
        client = self._get_openai_compat_client()
        response = client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        return response.choices[0].message.content

    def _complete_gemini(self, system_prompt: str, user_message: str) -> str:
        api_key = _get_env("GOOGLE_API_KEY", "GEMINI_API_KEY")
        models_to_try = [self.model, "gemini-2.5-flash-lite", "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"]
        unique_models = []
        for m in models_to_try:
            if m and m not in unique_models:
                unique_models.append(m)

        last_exc = None
        try:
            from google import genai
            from google.genai import types
            client = genai.Client(api_key=api_key)
            for m in unique_models:
                try:
                    resp = client.models.generate_content(
                        model=m,
                        contents=f"{system_prompt}\n\n{user_message}",
                        config=types.GenerateContentConfig(
                            temperature=self.temperature,
                            max_output_tokens=self.max_tokens,
                        )
                    )
                    if resp and resp.text:
                        return resp.text
                except Exception as e:
                    last_exc = e
                    continue
        except ImportError:
            pass

        # Legacy fallback
        import google.generativeai as genai_legacy
        if api_key:
            genai_legacy.configure(api_key=api_key)
        for m in unique_models:
            try:
                mod = genai_legacy.GenerativeModel(
                    model_name=m,
                    generation_config=genai_legacy.GenerationConfig(
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                    ),
                )
                response = mod.generate_content(f"{system_prompt}\n\n{user_message}")
                return response.text
            except Exception as e:
                last_exc = e
                continue
        raise last_exc or RuntimeError("All Gemini models failed")

    def _complete_anthropic(self, system_prompt: str, user_message: str) -> str:
        from anthropic import Anthropic  # type: ignore
        api_key = _get_env("ANTHROPIC_API_KEY", "OPENCODE_API_KEY")
        client = Anthropic(api_key=api_key)
        response = client.messages.create(
            model=self.model,
            max_tokens=self.max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text

    def _complete_huggingface(self, system_prompt: str, user_message: str) -> str:
        """Free HuggingFace Inference API — no key required for most models."""
        import urllib.request
        hf_key = _get_env("HUGGINGFACE_API_KEY", "HF_TOKEN", fallback="")
        headers = {"Content-Type": "application/json"}
        if hf_key:
            headers["Authorization"] = f"Bearer {hf_key}"

        payload = json.dumps({
            "inputs": f"<s>[INST] {system_prompt}\n\n{user_message} [/INST]",
            "parameters": {"max_new_tokens": min(self.max_tokens, 2048)},
        }).encode()

        url = f"https://api-inference.huggingface.co/models/{self.model}"
        req = urllib.request.Request(url, data=payload, headers=headers, method="POST")

        with urllib.request.urlopen(req, timeout=60) as resp:
            result = json.loads(resp.read())

        if isinstance(result, list) and result:
            return result[0].get("generated_text", str(result))
        return str(result)

    def complete_json(self, system_prompt: str, user_message: str) -> Dict[str, Any]:
        """Call the LLM and parse the response as JSON."""
        # Strengthen the prompt to demand JSON output
        json_system = (
            system_prompt
            + "\n\nIMPORTANT: Your response MUST be valid JSON only. "
            + "No explanation, no markdown, no code fences. "
            + "Start your response with { or [ directly."
        )
        raw = self.complete(json_system, user_message)
        return parse_json_response(raw)

    def __repr__(self) -> str:
        return f"LLMClient(provider={self.provider!r}, model={self.model!r})"


# ─────────────────────────────────────────────────────────
# Agent-specific factory function
# ─────────────────────────────────────────────────────────

def get_llm_for_agent(agent_name: str, **kwargs) -> LLMClient:
    """
    Get the best available LLM client for a specific agent.

    The router picks the optimal provider + model based on:
    1. Which API keys are set in environment
    2. The agent's complexity tier (heavy/medium/fast)
    3. Cost optimization (free models preferred)

    Usage:
        llm = get_llm_for_agent("director")    # Gets best available
        llm = get_llm_for_agent("qc")          # Gets fast/cheap model
    """
    return LLMClient(agent_name=agent_name, **kwargs)


# ─────────────────────────────────────────────────────────
# Legacy singleton (backward compatible)
# ─────────────────────────────────────────────────────────

_default_client: Optional[LLMClient] = None


def get_llm_client() -> LLMClient:
    """Return (or create) the shared singleton LLM client (backward compat)."""
    global _default_client
    if _default_client is None:
        _default_client = LLMClient()
    return _default_client


# ─────────────────────────────────────────────────────────
# JSON parser (unchanged)
# ─────────────────────────────────────────────────────────

def parse_json_response(text: str) -> Dict[str, Any]:
    """Extract and parse JSON from a possibly markdown-wrapped LLM response."""
    # Strip ```json ... ``` fences
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", text)
    if match:
        text = match.group(1)
    else:
        # Try to find a raw JSON object / array
        match = re.search(r"(\{[\s\S]+\}|\[[\s\S]+\])", text)
        if match:
            text = match.group(1)

    return json.loads(text.strip())
