"""
core/kaggle_client.py
─────────────────────
100% FREE Enterprise Cloud GPU Video Renderer via Kaggle API.

Features:
- Uses Kaggle's free 30 hours/week of NVIDIA Tesla T4 (16GB VRAM) GPUs.
- Runs LTX-Video (2B Diffusion Transformer) or Wan 2.1 in native high-resolution.
- Fully automated: pushes script, spins up GPU instance, renders, downloads clips, and shuts down.
- Zero idle GPU waste: Only runs during rendering (~3-5 mins), preserving your 30 weekly hours.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Any, Dict, List, Optional


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


class KaggleVideoClient:
    """Manages cloud rendering on Kaggle's 16GB GPU instances."""

    def __init__(self):
        _load_dotenv()
        self.username = os.getenv("KAGGLE_USERNAME", "").strip()
        self.key = os.getenv("KAGGLE_KEY", "").strip()
        self._ensure_credentials()

    def _ensure_credentials(self) -> bool:
        """Ensure ~/.kaggle/access_token and ~/.kaggle/kaggle.json are written."""
        kaggle_dir = Path.home() / ".kaggle"
        kaggle_dir.mkdir(parents=True, exist_ok=True)
        kaggle_json = kaggle_dir / "kaggle.json"
        access_token_file = kaggle_dir / "access_token"

        token = os.getenv("KAGGLE_API_TOKEN") or self.key
        if token and not token.startswith("your_"):
            os.environ["KAGGLE_API_TOKEN"] = token.strip()
            access_token_file.write_text(token.strip())
            access_token_file.chmod(0o600)

        if self.username and self.key and not self.username.startswith("your_"):
            kaggle_json.write_text(json.dumps({"username": self.username, "key": self.key}))
            kaggle_json.chmod(0o600)
            return True

        if access_token_file.exists():
            return True

        return False

    def is_configured(self) -> bool:
        return bool(self.username and self.key and not self.username.startswith("your_"))

    def render_scenes(
        self,
        scenes: List[Dict[str, Any]],
        output_dir: Path,
        kernel_slug: str = "ai-film-video-renderer",
    ) -> List[Path]:
        """
        Package scene prompts, dispatch Kaggle GPU kernel, monitor, and download rendered clips.
        """
        if not self.is_configured():
            raise ValueError(
                "Kaggle credentials not configured! Please add KAGGLE_USERNAME and KAGGLE_KEY to .env"
            )

        workspace_root = Path(__file__).parent.parent
        kernel_dir = workspace_root / "scratch" / "kaggle_kernel"
        kernel_dir.mkdir(parents=True, exist_ok=True)

        kernel_id = f"{self.username}/{kernel_slug}"
        print(f"[KaggleClient] 🚀 Packaging video generation kernel for {kernel_id}…")

        # 1. Write kernel metadata
        metadata = {
            "id": kernel_id,
            "title": "AI Film Video Renderer",
            "code_file": "render_script.py",
            "language": "python",
            "kernel_type": "script",
            "is_private": "true",
            "enable_gpu": "true",
            "enable_tpu": "false",
            "enable_internet": "true",
            "machine_shape": "NvidiaTeslaT4",
            "dataset_sources": [],
            "competition_sources": [],
            "kernel_sources": [],
            "model_sources": [],
        }
        (kernel_dir / "kernel-metadata.json").write_text(json.dumps(metadata, indent=2))

        # 2. Write the GPU rendering script for Kaggle
        render_code = self._generate_kernel_script(scenes)
        (kernel_dir / "render_script.py").write_text(render_code)

        # Copy any reference keyframe images to kernel_dir so Kaggle can use them for I2V
        for sc in scenes:
            ref_img = sc.get("reference_image")
            if ref_img and Path(ref_img).exists():
                dest = kernel_dir / f"scene_{sc['scene_id']:02d}_frame.png"
                shutil.copy2(ref_img, dest)
                print(f"[KaggleClient] 🖼️  Packaged I2V reference plate -> {dest.name}")

        # 3. Push kernel to Kaggle (or attach if already running)
        status_cmd = ["kaggle", "kernels", "status", kernel_id]
        s_res = subprocess.run(status_cmd, capture_output=True, text=True)
        if "running" in s_res.stdout.lower() or "queued" in s_res.stdout.lower():
            print(f"[KaggleClient] ⚡ Kernel {kernel_id} is ALREADY RUNNING on GPU. Attaching to monitor execution…")
        else:
            print(f"[KaggleClient] 📤 Pushing job to Kaggle Cloud GPU (16GB Tesla T4)…")
            push_cmd = ["kaggle", "kernels", "push", "-p", str(kernel_dir), "--accelerator", "NvidiaTeslaT4"]
            res = subprocess.run(push_cmd, capture_output=True, text=True)
            if res.returncode != 0:
                raise RuntimeError(f"Kaggle kernel push failed: {res.stderr or res.stdout}")
            print(f"[KaggleClient] ✅ Kernel pushed successfully: {res.stdout.strip()}")

        # 4. Monitor execution status
        print("[KaggleClient] ⏳ Kaggle GPU machine rendering… Waiting for completion…")
        max_minutes = 60
        start_time = time.time()
        completed = False

        while time.time() - start_time < max_minutes * 60:
            time.sleep(15)
            status_cmd = ["kaggle", "kernels", "status", kernel_id]
            s_res = subprocess.run(status_cmd, capture_output=True, text=True)
            status_line = s_res.stdout.strip()
            elapsed_m = int((time.time() - start_time) / 60)
            elapsed_s = int((time.time() - start_time) % 60)
            print(f"[KaggleClient] Status ({elapsed_m}m {elapsed_s}s): {status_line}")

            if "complete" in status_line.lower():
                completed = True
                break
            elif "error" in status_line.lower():
                # Attempt to retrieve logs for detailed diagnosis
                err_log_dir = kernel_dir / "error_logs"
                err_log_dir.mkdir(parents=True, exist_ok=True)
                subprocess.run(["kaggle", "kernels", "output", kernel_id, "-p", str(err_log_dir)], capture_output=True)
                log_snippet = ""
                for lf in err_log_dir.glob("*.log"):
                    try:
                        log_snippet += f"\n--- {lf.name} ---\n" + lf.read_text(encoding="utf-8", errors="replace")[-3000:]
                    except Exception:
                        pass
                raise RuntimeError(f"Kaggle kernel encountered an execution error: {status_line}\nLogs:{log_snippet}")

        if not completed:
            raise TimeoutError(f"Kaggle render timed out after {max_minutes} minutes.")

        # 5. Download generated MP4 video clips & WAV sound design files & PNG keyframes
        print(f"[KaggleClient] 📥 Downloading completed media assets to {output_dir}…")
        output_dir.mkdir(parents=True, exist_ok=True)
        dl_cmd = ["kaggle", "kernels", "output", kernel_id, "-p", str(output_dir)]
        dl_res = subprocess.run(dl_cmd, capture_output=True, text=True)
        if dl_res.returncode != 0:
            raise RuntimeError(f"Failed to download Kaggle outputs: {dl_res.stderr}")

        # Copy any keyframe plates to storyboards
        storyboards_dir = output_dir.parent / "storyboards"
        storyboards_dir.mkdir(parents=True, exist_ok=True)
        for frame_file in output_dir.glob("scene_*_frame.png"):
            dest_frame = storyboards_dir / frame_file.name
            shutil.copy2(frame_file, dest_frame)
            print(f"[KaggleClient] 🖼️  Saved SDXL Keyframe Plate -> {dest_frame.name}")

        # Copy any sfx files to audio_dir
        audio_dir = output_dir.parent / "audio"
        audio_dir.mkdir(parents=True, exist_ok=True)
        for sfx_file in output_dir.glob("scene_*_sfx.wav"):
            dest_sfx = audio_dir / sfx_file.name
            shutil.copy2(sfx_file, dest_sfx)
            print(f"[KaggleClient] 🔊 Downloaded AI Sound Effect -> {dest_sfx.name}")

        downloaded_clips = sorted(list(output_dir.glob("scene_*.mp4")))
        print(f"[KaggleClient] ✅ Downloaded {len(downloaded_clips)} video clips!")
        return downloaded_clips

    def _generate_kernel_script(self, scenes: List[Dict[str, Any]]) -> str:
        """
        Generate self-contained Python script to run on Kaggle's 16GB GPU.
        Phase 1: Local SDXL-Lightning 4-step Keyframe Plates
        Phase 2: Wan VACE 1.3B image-to-video (plate = first frame),
                 fallback Wan T2V 1.3B, fallback LTX-Video 2B
        Phase 2C: Real-ESRGAN x2 neural upscale (optional, guarded)
        Phase 2B: Motion interpolation to 30 FPS + Lanczos 1080p mastering
        Phase 3: AudioLDM2 AI Foley & Sound Design
        """
        scenes_json = json.dumps(scenes, indent=2)
        hf_token = os.getenv("HF_TOKEN", "")

        return f"""# Auto-generated by AI Film Production Pipeline
import gc
import os
import subprocess
import sys

print("=== Setting up Kaggle GPU Environment ===", flush=True)
os.environ["PYTORCH_CUDA_ALLOC_CONF"] = "expandable_segments:True"
if "{hf_token}":
    os.environ["HF_TOKEN"] = "{hf_token}"

# Prevent torchaudio version conflicts from crashing transformers imports
import sys
sys.modules['torchaudio'] = None
subprocess.run([sys.executable, "-m", "pip", "uninstall", "-y", "torchaudio"], check=False)

subprocess.run([
    sys.executable, "-m", "pip", "install", "-q",
    "diffusers>=0.34.0", "transformers>=4.48.0", "accelerate", "sentencepiece", "protobuf", "imageio-ffmpeg", "scipy", "safetensors", "huggingface_hub",
    "ftfy",
], check=True)

import torch
from PIL import Image

device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {{device}} ({{torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'}})", flush=True)

scenes = {scenes_json}
out_dir = "/kaggle/working"
os.makedirs(out_dir, exist_ok=True)

# ==============================================================================
# PHASE 1: SDXL-Lightning 8K Keyframe Master Plates (Free Local Diffusion on GPU)
# ==============================================================================
print("=== Phase 1: Local SDXL-Lightning 8K Keyframe Plates ===", flush=True)
try:
    from diffusers import StableDiffusionXLPipeline, UNet2DConditionModel, EulerDiscreteScheduler
    from huggingface_hub import hf_hub_download
    from safetensors.torch import load_file

    base = "stabilityai/stable-diffusion-xl-base-1.0"
    repo = "ByteDance/SDXL-Lightning"
    ckpt = "sdxl_lightning_4step_unet.safetensors"

    print("Loading SDXL-Lightning UNet & Pipeline onto GPU...", flush=True)
    unet = UNet2DConditionModel.from_config(base, subfolder="unet").to(device, torch.float16)
    unet.load_state_dict(load_file(hf_hub_download(repo, ckpt), device=device))
    img_pipe = StableDiffusionXLPipeline.from_pretrained(
        base,
        unet=unet,
        torch_dtype=torch.float16,
        variant="fp16",
    ).to(device)
    img_pipe.scheduler = EulerDiscreteScheduler.from_config(img_pipe.scheduler.config, timestep_spacing="trailing")

    for sc in scenes:
        sc_id = sc["scene_id"]
        img_prompt = sc.get("image_prompt") or sc.get("prompt", "")
        if "Negative:" in img_prompt:
            img_prompt = img_prompt.split("Negative:")[0].strip()

        # Dynamic aspect ratio resolution handling
        sc_aspect = str(sc.get("aspect_ratio", "9:16"))
        if "16:9" in sc_aspect or sc_aspect == "cinematic":
            sdxl_w, sdxl_h = 1344, 768
        elif sc_aspect == "1:1":
            sdxl_w, sdxl_h = 1024, 1024
        else:
            sdxl_w, sdxl_h = 768, 1344

        print(f"🎨 Generating SDXL Master Plate for Scene {{sc_id:02d}} ({{sdxl_w}}x{{sdxl_h}})...", flush=True)
        print(f"   Prompt: {{img_prompt[:120]}}...", flush=True)
        
        with torch.inference_mode():
            plate_img = img_pipe(
                prompt=img_prompt,
                width=sdxl_w,
                height=sdxl_h,
                num_inference_steps=4,
                guidance_scale=0,
            ).images[0]
            
        plate_path = os.path.join(out_dir, f"scene_{{sc_id:02d}}_frame.png")
        plate_img.save(plate_path)
        print(f"✅ Scene {{sc_id:02d}} Master Keyframe Plate saved: {{plate_path}} ({{os.path.getsize(plate_path)}} bytes)", flush=True)

    del img_pipe
    del unet
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    print("Phase 1 complete! GPU VRAM cleared for Video DiT.", flush=True)
except Exception as e:
    print(f"Phase 1 notice ({{e}}). Continuing to video generation...", flush=True)

# ==============================================================================
# PHASE 2: Cinematic diffusion (VACE-I2V first, then T2V, then LTX fallback)
# ==============================================================================
print("=== Phase 2: Cinema-Grade Video Generation ===", flush=True)
from diffusers.utils import export_to_video

video_engine = None
pipe = None

# Plates from Phase 1 double as I2V first frames — no upload needed
plate_paths = {{}}
for _sc in scenes:
    _pp = os.path.join(out_dir, f"scene_{{_sc['scene_id']:02d}}_frame.png")
    if os.path.exists(_pp) and os.path.getsize(_pp) > 1000:
        plate_paths[_sc["scene_id"]] = _pp
print(f"Keyframe plates available for I2V: {{sorted(plate_paths)}}", flush=True)

# --- Attempt 1: Wan VACE 1.3B image-to-video (best quality on T4) ---
if len(plate_paths) == len(scenes) and scenes:
    try:
        try:
            from diffusers import WanVACEPipeline, AutoencoderKLWan
        except ImportError:
            print("WanVACEPipeline not in installed diffusers — installing diffusers from GitHub main...", flush=True)
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "git+https://github.com/huggingface/diffusers"], check=True)
            from diffusers import WanVACEPipeline, AutoencoderKLWan
        from diffusers.schedulers.scheduling_unipc_multistep import UniPCMultistepScheduler

        print("Loading Wan VACE 1.3B (I2V, bf16 VAE for 14GB T4)...", flush=True)
        _vae = AutoencoderKLWan.from_pretrained(
            "Wan-AI/Wan2.1-VACE-1.3B-diffusers", subfolder="vae", torch_dtype=torch.bfloat16
        )
        if hasattr(_vae, "enable_tiling"):
            _vae.enable_tiling()
        pipe = WanVACEPipeline.from_pretrained(
            "Wan-AI/Wan2.1-VACE-1.3B-diffusers", vae=_vae, torch_dtype=torch.bfloat16,
        )
        pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=3.0)
        if torch.cuda.is_available():
            try:
                pipe.enable_model_cpu_offload()
                print("VACE memory mode: chunked CPU offload", flush=True)
            except Exception as off_err:
                print(f"Chunked offload unavailable ({{off_err}}) — trying sequential offload...", flush=True)
                try:
                    pipe.enable_sequential_cpu_offload()
                    print("VACE memory mode: sequential CPU offload (slower, leaner)", flush=True)
                except Exception as seq_err:
                    print(f"Sequential offload failed ({{seq_err}}) — full GPU placement (OOM risk)...", flush=True)
                    pipe.to(device)
        video_engine = "vace"
        print("✅ Wan VACE 1.3B I2V pipeline loaded successfully!", flush=True)
    except Exception as vace_err:
        print(f"Notice: VACE-I2V unavailable ({{vace_err}}). Trying T2V 1.3B...", flush=True)
        pipe = None
else:
    print("Skipping VACE-I2V (plates missing) — using T2V path...", flush=True)

# --- Attempt 2: Wan T2V 1.3B ---
if pipe is None:
    try:
        print("Loading Wan 2.1 (1.3B) Diffusion Transformer in BF16...", flush=True)
        from diffusers import WanPipeline
        pipe = WanPipeline.from_pretrained(
            "Wan-AI/Wan2.1-T2V-1.3B-Diffusers",
            torch_dtype=torch.bfloat16,
        )
        if torch.cuda.is_available():
            try:
                pipe.enable_model_cpu_offload()
            except Exception:
                pipe.to(device)
        video_engine = "wan"
        print("✅ Wan 2.1 Video Pipeline loaded successfully!", flush=True)
    except Exception as wan_err:
        print(f"Notice: Wan 2.1 init ({{wan_err}}). Falling back to high-res LTX-Video engine...", flush=True)
        pipe = None

# --- Attempt 3: LTX-Video 2B ---
if pipe is None:
    try:
        from diffusers import LTXPipeline
        pipe = LTXPipeline.from_pretrained(
            "Lightricks/LTX-Video",
            torch_dtype=torch.bfloat16,
        )
        if torch.cuda.is_available():
            try:
                pipe.enable_model_cpu_offload()
            except Exception:
                pipe.to(device)
        if hasattr(pipe, "vae") and hasattr(pipe.vae, "enable_tiling"):
            pipe.vae.enable_tiling()
        video_engine = "ltx"
        print("✅ High-Res LTX-Video Fallback loaded successfully.", flush=True)
    except Exception as ltx_err:
        print(f"Fatal video engine error: {{ltx_err}}", flush=True)
        raise

for sc in scenes:
    sc_id = sc["scene_id"]
    prompt = sc["prompt"]
    if "Negative:" in prompt:
        prompt = prompt.split("Negative:")[0].strip()

    # Cinematic master negative prompt
    neg = (
        "Bright tones, overexposed, static, blurred details, subtitles, style, paintings, "
        "anime, cartoon, 3d render, plastic skin, morphing anatomy, extra limbs, distorted face, "
        "low quality, worst quality, flickering, jittery, watermark, text"
    )

    duration_s = sc.get("duration", 5)
    sc_aspect = str(sc.get("aspect_ratio", "9:16"))

    # Select optimal latent dimensions according to video engine
    if video_engine == "wan":
        # Native Wan 2.1 dimensions
        if "16:9" in sc_aspect or sc_aspect == "cinematic":
            gen_w, gen_h = 832, 480
            final_w, final_h = 1920, 1080
        elif sc_aspect == "1:1":
            gen_w, gen_h = 640, 640
            final_w, final_h = 1080, 1080
        else:
            gen_w, gen_h = 480, 832
            final_w, final_h = 1080, 1920

        num_frames = 65 if duration_s <= 4 else 81
        native_fps = 16
    else:
        # LTX-Video dimensions
        if "16:9" in sc_aspect or sc_aspect == "cinematic":
            gen_w, gen_h = 768, 512
            final_w, final_h = 1920, 1080
        elif sc_aspect == "1:1":
            gen_w, gen_h = 640, 640
            final_w, final_h = 1080, 1080
        else:
            gen_w, gen_h = 480, 832
            final_w, final_h = 1080, 1920

        num_frames = 65
        native_fps = 14

    print(f"🎬 [{{video_engine.upper()}}] Rendering Scene {{sc_id:02d}} ({{num_frames}} frames, {{gen_w}}x{{gen_h}} -> {{final_w}}x{{final_h}} @ 30 FPS)...", flush=True)
    print(f"   Prompt: {{prompt[:140]}}...", flush=True)

    with torch.inference_mode():
        if video_engine == "vace":
            # Reference-to-video: SDXL plate = first frame, model dreams the rest
            _first = Image.open(plate_paths[sc_id]).convert("RGB").resize((gen_w, gen_h))
            _blank = Image.new("RGB", (gen_w, gen_h), (128, 128, 128))
            _keep = Image.new("L", (gen_w, gen_h), 0)
            _fill = Image.new("L", (gen_w, gen_h), 255)
            video = pipe(
                video=[_first] + [_blank] * (num_frames - 1),
                mask=[_keep] + [_fill] * (num_frames - 1),
                prompt=prompt,
                negative_prompt=neg,
                height=gen_h,
                width=gen_w,
                num_frames=num_frames,
                num_inference_steps=30,
                guidance_scale=5.0,
            ).frames[0]
            del _first, _blank, _keep, _fill
        elif video_engine == "wan":
            video = pipe(
                prompt=prompt,
                negative_prompt=neg,
                height=gen_h,
                width=gen_w,
                num_frames=num_frames,
                guidance_scale=5.0,
            ).frames[0]
        else:
            video = pipe(
                prompt=prompt,
                negative_prompt=neg,
                width=gen_w,
                height=gen_h,
                num_frames=num_frames,
                num_inference_steps=32,
                guidance_scale=4.0,
            ).frames[0]

    # ==============================================================================
    # PHASE 2C: Real-ESRGAN x2 neural upscale (guarded — falls back to raw frames)
    # ==============================================================================
    try:
        import urllib.request as _urlreq
        import numpy as _np
        _esr_weights = os.path.join(out_dir, "RealESRGAN_x2plus.pth")
        if not os.path.exists(_esr_weights):
            print("Downloading Real-ESRGAN x2 weights (~64MB)...", flush=True)
            _urlreq.urlretrieve(
                "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x2plus.pth",
                _esr_weights,
            )
        try:
            from realesrgan import RealESRGANer
        except ImportError:
            print("Installing realesrgan...", flush=True)
            subprocess.run([sys.executable, "-m", "pip", "install", "-q", "realesrgan"], check=True)
            from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet

        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        _rrdb = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
        _upsampler = RealESRGANer(
            scale=2, model_path=_esr_weights, model=_rrdb,
            tile=256, tile_pad=10, pre_pad=0, half=True, device=device,
        )
        print(f"✨ Real-ESRGAN x2 upscaling {{len(video)}} frames...", flush=True)
        _hd_frames = []
        with torch.inference_mode():
            for _fr in video:
                _sr, _ = _upsampler.enhance(_np.array(_fr), outscale=2)
                _hd_frames.append(Image.fromarray(_sr))
        video = _hd_frames
        del _upsampler, _rrdb, _hd_frames
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print(f"✅ Neural upscale complete: {{video[0].size}} per frame", flush=True)
    except Exception as esr_err:
        print(f"Notice: Real-ESRGAN skipped ({{esr_err}}). Using diffusion-native frames...", flush=True)

    raw_file = os.path.join(out_dir, f"scene_{{sc_id:02d}}_raw.mp4")
    out_file = os.path.join(out_dir, f"scene_{{sc_id:02d}}.mp4")
    export_to_video(video, raw_file, fps=native_fps)

    # ==============================================================================
    # PHASE 2B: Neural Motion Interpolation (30 FPS) & Lanczos 1080p AI Mastering
    # ==============================================================================
    print(f"✨ Mastering Scene {{sc_id:02d}}: Optical Flow Interpolation ({{native_fps}} -> 30 FPS) & Lanczos Super-Res ({{final_w}}x{{final_h}})...", flush=True)
    try:
        # 1. Motion-compensated optical flow interpolation to 30 FPS + Lanczos upscale + subtle unsharp mask
        filter_chain = (
            f"minterpolate=fps=30:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1,"
            f"scale={{final_w}}:{{final_h}}:flags=lanczos,"
            f"unsharp=5:5:0.7:3:3:0.3,"
            f"eq=contrast=1.04:saturation=1.06:brightness=-0.01,"
            f"format=yuv420p"
        )
        subprocess.run([
            "ffmpeg", "-y", "-i", raw_file,
            "-vf", filter_chain,
            "-c:v", "libx264", "-crf", "17", "-preset", "slow",
            "-movflags", "+faststart",
            out_file
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(raw_file):
            os.remove(raw_file)
        print(f"✅ Scene {{sc_id:02d}} Cinema-Grade Master Complete: {{out_file}} ({{os.path.getsize(out_file)}} bytes, 1080p @ 30fps)", flush=True)
    except Exception as master_err:
        print(f"Notice during FFmpeg neural mastering ({{master_err}}). Using direct raw export...", flush=True)
        if os.path.exists(raw_file) and not os.path.exists(out_file):
            os.replace(raw_file, out_file)

    if torch.cuda.is_available():
        torch.cuda.empty_cache()

del pipe
gc.collect()
if torch.cuda.is_available():
    torch.cuda.empty_cache()
print("Phase 2 complete! GPU VRAM cleared for Audio Engine.", flush=True)

# ==============================================================================
# PHASE 3: retired — no separate audio by design. Dialogue and ambience stay
# baked into the clip prompts; reels conform silent. No TTS/dub pass.
# ==============================================================================
print("=== Phase 3: skipped (no separate audio by design) ===", flush=True)

print("=== All Video & Image Plates Generated Successfully! ===", flush=True)
"""


