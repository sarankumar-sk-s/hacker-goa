import io
import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import cv2
import numpy as np
from app.models.schemas import GenerateFrameRequest, GenerateBuilderCardRequest


class ImageProcessorService:
    """
    Core image processing service utilizing Pillow and OpenCV to generate 
    Hacker House Goa 2026 Profile Frames and Builder ID Cards with 4K resolution support,
    automatic aspect-ratio cover crop, neon borders, and QR Code generation.
    """

    def _hex_to_rgb(self, hex_str: str) -> tuple:
        hex_str = hex_str.lstrip("#")
        return tuple(int(hex_str[i:i+2], 16) for i in (0, 2, 4))

    def _cover_crop(self, img: Image.Image, target_w: int, target_h: int) -> Image.Image:
        """
        Crops the input image from the center to match the target aspect ratio
        and resizes it to the target dimensions without stretching.
        """
        img_w, img_h = img.size
        target_aspect = target_w / target_h
        img_aspect = img_w / img_h
        
        if img_aspect > target_aspect:
            # Image is wider than target aspect ratio: crop sides
            new_w = int(img_h * target_aspect)
            left = (img_w - new_w) // 2
            top = 0
            right = left + new_w
            bottom = img_h
        else:
            # Image is taller than target aspect ratio: crop top/bottom
            new_h = int(img_w / target_aspect)
            left = 0
            top = (img_h - new_h) // 2
            right = img_w
            bottom = top + new_h
            
        cropped = img.crop((left, top, right, bottom))
        return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

    def _load_font(self, font_type: str, size: int):
        # Candidates for fonts
        font_names = {
            "bold": ["trebucbd.ttf", "arialbd.ttf", "segoeuib.ttf", "LiberationSans-Bold.ttf"],
            "regular": ["trebuc.ttf", "arial.ttf", "segoeui.ttf", "LiberationSans-Regular.ttf"],
            "mono": ["consola.ttf", "cour.ttf", "LiberationMono-Regular.ttf"]
        }
        candidates = font_names.get(font_type, ["arial.ttf"])
        
        search_dirs = [
            "C:\\Windows\\Fonts",
            "/usr/share/fonts/truetype",
            "/usr/share/fonts/truetype/dejavu",
            "/usr/share/fonts/truetype/liberation",
            "/System/Library/Fonts",
            "/System/Library/Fonts/Supplemental",
            "."
        ]
        
        for name in candidates:
            for d in search_dirs:
                for root, _, files in os.walk(d) if os.path.exists(d) else []:
                    if name in files:
                        p = os.path.join(root, name)
                        try:
                            return ImageFont.truetype(p, size)
                        except Exception:
                            continue
                            
        # Fallback to default
        return ImageFont.load_default()

    def _draw_arched_text(self, draw_im, text: str, center: tuple, radius: float, start_angle: float, end_angle: float, font, fill: tuple, scale: float):
        """
        Custom utility to render characters along a curved path in Pillow.
        """
        cx, cy = center
        num_chars = len(text)
        if num_chars == 0:
            return
        
        angle_step = (end_angle - start_angle) / max(1, num_chars - 1)
        # Scale char canvas size
        char_canvas_size = int(120 * scale)
        half_canvas = char_canvas_size // 2

        for i, char in enumerate(text):
            angle = start_angle + i * angle_step
            rad = math.radians(angle)
            
            x = cx + radius * math.cos(rad)
            y = cy + radius * math.sin(rad)
            
            # Draw individual rotated character using small temporary canvas
            char_img = Image.new("RGBA", (char_canvas_size, char_canvas_size), (0, 0, 0, 0))
            char_draw = ImageDraw.Draw(char_img)
            char_draw.text((half_canvas, half_canvas), char, font=font, fill=fill, anchor="mm")
            
            # Rotate character image
            char_rot = char_img.rotate(-angle - 90, resample=Image.Resampling.BICUBIC)
            draw_im.paste(char_rot, (int(x - half_canvas), int(y - half_canvas)), char_rot)

    def _draw_qr_code(self, draw, top_left: tuple, size: float, color_rgb: tuple, scale: float = 1.0):
        """
        Draw a vector-styled QR Code matrix mockup with finder patterns in active accent color and black.
        """
        tx, ty = top_left
        # Background container: solid black background with accent color outline
        draw.rectangle([top_left, (tx + size, ty + size)], fill=(0, 0, 0, 255), outline=color_rgb, width=max(1, int(2 * scale)))
        
        grid_size = 21
        block_size = size / grid_size
        
        # Finder pattern drawing helper (7x7 blocks)
        def draw_finder(x, y):
            draw.rectangle([x, y, x + 7 * block_size, y + 7 * block_size], fill=color_rgb)
            draw.rectangle([x + block_size, y + block_size, x + 6 * block_size, y + 6 * block_size], fill=(0, 0, 0, 255))
            draw.rectangle([x + 2 * block_size, y + 2 * block_size, x + 5 * block_size, y + 5 * block_size], fill=color_rgb)
            
        draw_finder(tx, ty)
        draw_finder(tx + (grid_size - 7) * block_size, ty)
        draw_finder(tx, ty + (grid_size - 7) * block_size)
        
        # Draw randomized QR data pixels (seeded for consistency)
        random.seed(42)
        for r in range(grid_size):
            for c in range(grid_size):
                # Skip finder pattern areas
                if (r < 8 and c < 8) or (r < 8 and c >= grid_size - 8) or (r >= grid_size - 8 and c < 8):
                    continue
                if random.choice([True, False]):
                    draw.rectangle([
                        tx + c * block_size, 
                        ty + r * block_size, 
                        tx + (c + 1) * block_size, 
                        ty + (r + 1) * block_size
                    ], fill=color_rgb)

    def apply_profile_frame(self, raw_image_bytes: bytes, config: GenerateFrameRequest) -> bytes:
        """
        Processes avatar image, applies center cropping/masking, and overlays
        the premium Goa-themed event profile frame in 1080p or native 4K.
        """
        # Determine scale multiplier
        scale = 2.0 if config.resolution == "4k" else 1.0
        
        base_size = 1080
        target_size = int(base_size * scale)

        # Color palette
        accent_rgb = (57, 255, 136)  # controlled neon green (#39FF88)
        emerald_rgb = (8, 42, 28)    # deep emerald (#082A1C)
        gold_rgb = (214, 184, 90)    # muted gold (#D6B85A)
        black_rgb = (5, 8, 7)        # near black (#050807)
        white_rgb = (245, 245, 245)  # white (#F5F5F5)

        # 1. Standardize User Avatar (Cover Crop to fit Circular Frame)
        avatar = Image.open(io.BytesIO(raw_image_bytes))
        if avatar.mode != "RGBA":
            avatar = avatar.convert("RGBA")

        # Circular mask diameter size is 62% of total width (669.6px at 1080p)
        circle_diameter = int(669.6 * scale)
        w_orig, h_orig = avatar.size
        
        # Aspect-ratio preserving cover scale calculation
        base_scale = max(float(circle_diameter) / w_orig, float(circle_diameter) / h_orig)
        final_scale = base_scale * config.zoom

        w_scaled = int(w_orig * final_scale)
        h_scaled = int(h_orig * final_scale)
        avatar_resized = avatar.resize((w_scaled, h_scaled), Image.Resampling.LANCZOS)

        # Create avatar cropping canvas
        avatar_canvas = Image.new("RGBA", (circle_diameter, circle_diameter), (0, 0, 0, 0))
        scale_factor = (base_size * scale) / 340.0
        
        center_offset = circle_diameter / 2.0
        x = int(center_offset - w_scaled / 2.0 + config.x_offset * scale_factor)
        y = int(center_offset - h_scaled / 2.0 + config.y_offset * scale_factor)

        # Paste resized avatar on canvas
        avatar_canvas.paste(avatar_resized, (x, y))

        # Crop avatar to circular mask
        mask = Image.new("L", (circle_diameter, circle_diameter), 0)
        draw_mask = ImageDraw.Draw(mask)
        draw_mask.ellipse((0, 0, circle_diameter, circle_diameter), fill=255)

        avatar_circle = Image.new("RGBA", (circle_diameter, circle_diameter), (0, 0, 0, 0))
        avatar_circle.paste(avatar_canvas, (0, 0), mask=mask)

        # 2. Build background card canvas
        bg_card = Image.new("RGBA", (target_size, target_size), black_rgb + (255,))
        draw_bg = ImageDraw.Draw(bg_card)

        # Radial ambient glow from top-left
        for r in range(int(800 * scale), 0, int(-40 * scale)):
            alpha = int(45 * (1.0 - r / (800.0 * scale)))
            draw_bg.ellipse([(-r, -r), (r, r)], fill=emerald_rgb + (alpha,))

        # Tech Grid overlay
        grid_spacing = int(108 * scale)
        for i in range(0, target_size, grid_spacing):
            draw_bg.line([(i, 0), (i, target_size)], fill=accent_rgb + (12,), width=1)
            draw_bg.line([(0, i), (target_size, i)], fill=accent_rgb + (12,), width=1)

        # Fine circuit lines
        draw_bg.line([(int(108*scale), int(54*scale)), (target_size - int(108*scale), int(54*scale))], fill=accent_rgb + (25,), width=1)
        draw_bg.line([(int(54*scale), int(108*scale)), (int(54*scale), target_size - int(108*scale))], fill=accent_rgb + (25,), width=1)
        draw_bg.line([(target_size - int(54*scale), int(108*scale)), (target_size - int(54*scale), target_size - int(108*scale))], fill=accent_rgb + (25,), width=1)
        draw_bg.line([(int(108*scale), target_size - int(54*scale)), (target_size - int(108*scale), target_size - int(54*scale))], fill=accent_rgb + (25,), width=1)

        # Coastline wave curves (Goa tropical watermark)
        draw_bg.arc([int(-108 * scale), int(648 * scale), int(1188 * scale), int(1404 * scale)], start=180, end=360, fill=emerald_rgb + (120,), width=int(3 * scale))
        draw_bg.arc([int(-108 * scale), int(670 * scale), int(1188 * scale), int(1426 * scale)], start=180, end=360, fill=accent_rgb + (25,), width=int(1.5 * scale))

        # Star dots details
        draw_bg.ellipse([(int(162 * scale), int(486 * scale)), (int(166 * scale), int(490 * scale))], fill=gold_rgb + (80,))
        draw_bg.ellipse([(int(918 * scale), int(486 * scale)), (int(922 * scale), int(490 * scale))], fill=gold_rgb + (80,))
        draw_bg.ellipse([(int(324 * scale), int(237 * scale)), (int(327 * scale), int(240 * scale))], fill=white_rgb + (100,))
        draw_bg.ellipse([(int(756 * scale), int(237 * scale)), (int(759 * scale), int(240 * scale))], fill=white_rgb + (100,))

        # Top Header Texts
        font_header_hh = self._load_font("bold", int(45 * scale))
        font_header_date = self._load_font("mono", int(22 * scale))
        
        draw_bg.text((int(540 * scale), int(113 * scale)), "HACKER HOUSE GOA", font=font_header_hh, fill=white_rgb, anchor="mm")
        draw_bg.text((int(540 * scale), int(153 * scale)), "28–31 OCT 2026", font=font_header_date, fill=gold_rgb, anchor="mm")

        # Bottom signature branding Texts
        font_monogram = self._load_font("bold", int(26 * scale))
        font_sig_name = self._load_font("bold", int(28 * scale))
        font_sig_est = self._load_font("mono", int(18 * scale))

        draw_bg.text((int(540 * scale), int(955 * scale)), "HH", font=font_monogram, fill=gold_rgb, anchor="mm")
        draw_bg.text((int(540 * scale), int(993 * scale)), "HACKER HOUSE GOA", font=font_sig_name, fill=white_rgb, anchor="mm")
        draw_bg.text((int(540 * scale), int(1023 * scale)), "EST. 2026", font=font_sig_est, fill=gold_rgb, anchor="mm")

        # Tech tags in corners
        font_tech_tag = self._load_font("mono", int(19 * scale))
        font_tech_sub = self._load_font("mono", int(15 * scale))

        # Top Left
        draw_bg.text((int(64 * scale), int(237 * scale)), "</>", font=font_tech_tag, fill=accent_rgb + (90,))
        draw_bg.text((int(64 * scale), int(270 * scale)), "AI.DEV", font=font_tech_sub, fill=white_rgb + (50,))

        # Top Right
        draw_bg.text((target_size - int(64 * scale), int(237 * scale)), "01", font=font_tech_tag, fill=accent_rgb + (90,), anchor="ra")
        draw_bg.text((target_size - int(64 * scale), int(270 * scale)), "VERIFIED", font=font_tech_sub, fill=white_rgb + (50,), anchor="ra")

        # 3. Paste avatar centered at cx=540*scale, cy=540*scale
        paste_x = int((target_size - circle_diameter) / 2.0)
        paste_y = int((target_size - circle_diameter) / 2.0)
        bg_card.paste(avatar_circle, (paste_x, paste_y), mask=avatar_circle)

        # 4. Draw double rings around cutout on top of avatar
        draw_fg = ImageDraw.Draw(bg_card)
        # Inner gold ring: r = circle_diameter / 2 + 1 * scale
        inner_r = int((circle_diameter / 2) + 1 * scale)
        draw_fg.ellipse([
            (540 * scale - inner_r, 540 * scale - inner_r), 
            (540 * scale + inner_r, 540 * scale + inner_r)
        ], fill=None, outline=gold_rgb, width=int(2 * scale))

        # Middle neon green ring (with neon blur glow)
        glow_r = int((circle_diameter / 2) + 5 * scale)
        glow_img = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        glow_draw.ellipse([
            (540 * scale - glow_r, 540 * scale - glow_r), 
            (540 * scale + glow_r, 540 * scale + glow_r)
        ], fill=None, outline=accent_rgb + (120,), width=int(8 * scale))
        glow_blur = glow_img.filter(ImageFilter.GaussianBlur(int(4 * scale)))
        bg_card = Image.alpha_composite(bg_card, glow_blur)
        
        # Sharp middle neon green ring on top
        draw_fg = ImageDraw.Draw(bg_card)
        draw_fg.ellipse([
            (540 * scale - glow_r, 540 * scale - glow_r), 
            (540 * scale + glow_r, 540 * scale + glow_r)
        ], fill=None, outline=accent_rgb, width=int(3 * scale))

        # Outer thin dark emerald border ring: r = circle_diameter / 2 + 9 * scale
        outer_r = int((circle_diameter / 2) + 9 * scale)
        draw_fg.ellipse([
            (540 * scale - outer_r, 540 * scale - outer_r), 
            (540 * scale + outer_r, 540 * scale + outer_r)
        ], fill=None, outline=emerald_rgb, width=int(3 * scale))

        # 5. Draw outer card frame border
        b_x1, b_y1 = int(21 * scale), int(21 * scale)
        b_x2, b_y2 = int(1059 * scale), int(1059 * scale)
        draw_fg.rounded_rectangle([(b_x1, b_y1), (b_x2, b_y2)], radius=int(32 * scale), fill=None, outline=emerald_rgb, width=int(3 * scale))
        
        # Corner accents
        c_size = int(45 * scale)
        # Top Left
        draw_fg.line([(b_x1 + c_size, b_y1), (b_x1, b_y1), (b_x1, b_y1 + c_size)], fill=accent_rgb + (180,), width=int(3 * scale))
        # Top Right
        draw_fg.line([(b_x2 - c_size, b_y1), (b_x2, b_y1), (b_x2, b_y1 + c_size)], fill=accent_rgb + (180,), width=int(3 * scale))
        # Bottom Left
        draw_fg.line([(b_x1, b_y2 - c_size), (b_x1, b_y2), (b_x1 + c_size, b_y2)], fill=accent_rgb + (180,), width=int(3 * scale))
        # Bottom Right
        draw_fg.line([(b_x2 - c_size, b_y2), (b_x2, b_y2), (b_x2, b_y2 - c_size)], fill=accent_rgb + (180,), width=int(3 * scale))

        # 6. Draw rotated BUILDER badge
        badge_w, badge_h = int(180 * scale), int(54 * scale)
        badge_img = Image.new("RGBA", (badge_w, badge_h), (0, 0, 0, 0))
        draw_badge = ImageDraw.Draw(badge_img)
        draw_badge.rounded_rectangle([(0, 0), (badge_w, badge_h)], radius=int(10 * scale), fill=black_rgb + (255,), outline=accent_rgb, width=int(2 * scale))
        
        font_builder = self._load_font("bold", int(26 * scale))
        draw_badge.text((badge_w // 2, badge_h // 2), config.role.upper(), font=font_builder, fill=white_rgb, anchor="mm")
        
        # Rotate badge (tilt counter-clockwise by -8 deg, so rotate by 8 deg)
        badge_rotated = badge_img.rotate(8, resample=Image.Resampling.BICUBIC, expand=True)
        
        # Position badge at lower-left of the circle
        bx = int(216 * scale)
        by = int(766 * scale)
        bg_card.paste(badge_rotated, (bx, by), mask=badge_rotated)

        # 7. Apply Root Card rounded corners (subtle transparent corners)
        frame_mask = Image.new("L", (target_size, target_size), 0)
        draw_fmask = ImageDraw.Draw(frame_mask)
        draw_fmask.rounded_rectangle([(0, 0), (target_size, target_size)], radius=int(32 * scale), fill=255)

        final_canvas = Image.new("RGBA", (target_size, target_size), (0, 0, 0, 0))
        final_canvas.paste(bg_card, (0, 0), mask=frame_mask)

        # Save transparent PNG to output bytes
        output_buffer = io.BytesIO()
        final_canvas.save(output_buffer, format="PNG")
        return output_buffer.getvalue()

    def generate_id_card(self, avatar_image_bytes: bytes, config: GenerateBuilderCardRequest) -> bytes:
        """
        Generates high-resolution 1200x1800 (1080p) or 2400x3600 (4K) Cyberpunk ID Card,
        drawing cover-cropped avatar, neon border, and high-tech vector QR code decoration.
        """
        # Scale resolution factor
        scale = 2.0 if config.resolution == "4k" else 1.0
        
        card_width = int(1200 * scale)
        card_height = int(1800 * scale)

        color_themes = {
            "neon-green": "#39FF14",
            "cyber-cyan": "#00F0FF",
            "laser-purple": "#BD00FF",
            "sunset-orange": "#FF5C00",
        }
        theme_color_hex = color_themes.get(config.accent_color, color_themes["neon-green"])
        accent_rgb = self._hex_to_rgb(theme_color_hex)

        # 1. Background Setup
        card = Image.new("RGBA", (card_width, card_height), (5, 5, 7, 255))
        
        # Load Goa cyberpunk background image
        bg_paths = [
            "static/assets/goa_cyberpunk_badge_bg.png",
            "../frontend/public/goa_cyberpunk_badge_bg.png",
            "frontend/public/goa_cyberpunk_badge_bg.png"
        ]
        bg_loaded = False
        for p in bg_paths:
            if os.path.exists(p):
                try:
                    bg_img = Image.open(p).convert("RGBA")
                    bg_resized = bg_img.resize((card_width, card_height), Image.Resampling.LANCZOS)
                    card.paste(bg_resized, (0, 0))
                    bg_loaded = True
                    break
                except Exception:
                    continue

        if not bg_loaded:
            # Fallback radial gradient glow
            draw = ImageDraw.Draw(card)
            for r in range(int(1200 * scale), int(100 * scale), int(-80 * scale)):
                alpha = int(35 * (1.0 - r / (1200.0 * scale)))
                cx = int(600 * scale)
                cy = int(300 * scale)
                draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=accent_rgb + (alpha,))

        # Read avatar
        avatar = Image.open(io.BytesIO(avatar_image_bytes))
        if avatar.mode != "RGBA":
            avatar = avatar.convert("RGBA")

        # 2. Resize and Rounded-Crop avatar (500x500 at center (350, 320) scaled) using cover crop helper
        avatar_size = int(500 * scale)
        avatar_resized = self._cover_crop(avatar, avatar_size, avatar_size)

        avatar_mask = Image.new("L", (avatar_size, avatar_size), 0)
        mask_draw = ImageDraw.Draw(avatar_mask)
        mask_draw.rounded_rectangle([(0, 0), (avatar_size, avatar_size)], radius=int(30 * scale), fill=255)

        avatar_final = Image.new("RGBA", (avatar_size, avatar_size), (0, 0, 0, 0))
        avatar_final.paste(avatar_resized, (0, 0), mask=avatar_mask)

        # Paste avatar at scaled (350, 320)
        avatar_x = int(350 * scale)
        avatar_y = int(320 * scale)
        card.paste(avatar_final, (avatar_x, avatar_y), mask=avatar_mask)

        # 3. Draw Symmetrical Neon Outer Border framing (Double-stroke glow)
        glow_img = Image.new("RGBA", (card_width, card_height), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        
        # Outer Border box
        b1_x1 = int(40 * scale)
        b1_y1 = int(40 * scale)
        b1_x2 = int(1160 * scale)
        b1_y2 = int(1760 * scale)
        
        # Inner Border box
        b2_x1 = int(56 * scale)
        b2_y1 = int(56 * scale)
        b2_x2 = int(1144 * scale)
        b2_y2 = int(1744 * scale)
        
        # Draw outer glow stroke
        glow_draw.rounded_rectangle([(b1_x1, b1_y1), (b1_x2, b1_y2)], radius=int(40 * scale), fill=None, outline=accent_rgb + (180,), width=int(12 * scale))
        # Draw inner glow stroke
        glow_draw.rounded_rectangle([(b2_x1, b2_y1), (b2_x2, b2_y2)], radius=int(32 * scale), fill=None, outline=accent_rgb + (180,), width=int(8 * scale))
        
        # Blur the glows
        glow_blur = glow_img.filter(ImageFilter.GaussianBlur(int(10 * scale)))
        card = Image.alpha_composite(card, glow_blur)
        
        # Draw sharp double-stroke borders on top
        draw = ImageDraw.Draw(card)
        draw.rounded_rectangle([(b1_x1, b1_y1), (b1_x2, b1_y2)], radius=int(40 * scale), fill=None, outline=accent_rgb + (255,), width=int(3 * scale))
        draw.rounded_rectangle([(b2_x1, b2_y1), (b2_x2, b2_y2)], radius=int(32 * scale), fill=None, outline=accent_rgb + (255,), width=int(2 * scale))

        # Scaled Fonts
        font_header = self._load_font("bold", int(44 * scale))
        font_subheader = self._load_font("regular", int(32 * scale))
        font_name = self._load_font("bold", int(72 * scale))
        font_title = self._load_font("regular", int(40 * scale))
        font_badge = self._load_font("bold", int(32 * scale))
        font_mono = self._load_font("mono", int(32 * scale))
        font_mono_small = self._load_font("mono", int(28 * scale))

        # Draw Header
        draw.text((int(100 * scale), int(150 * scale)), "HACKER HOUSE GOA 2026", fill=(255, 255, 255, 255), font=font_header)
        draw.text((int(100 * scale), int(210 * scale)), "BUILDER PASS", fill=(255, 255, 255, 102), font=font_subheader)
        draw.rectangle([(int(100 * scale), int(240 * scale)), (int(1100 * scale), int(246 * scale))], fill=accent_rgb)

        # Draw Avatar border frame
        draw.rounded_rectangle([(avatar_x, avatar_y), (avatar_x + avatar_size, avatar_y + avatar_size)], radius=int(30 * scale), fill=None, outline=accent_rgb + (102,), width=int(8 * scale))

        # 4. Details
        # Name
        draw.text((int(600 * scale), int(930 * scale)), config.name, fill=(255, 255, 255, 255), font=font_name, anchor="mm")
        # Title (Builder Title)
        draw.text((int(600 * scale), int(1000 * scale)), config.title or "Builder & Hacker", fill=(255, 255, 255, 178), font=font_title, anchor="mm")

        # Role Badge Pill
        role_label = config.role.upper()
        text_w = len(role_label) * int(22 * scale)
        badge_w = text_w + int(80 * scale)
        badge_h = int(70 * scale)
        bx = int(600 * scale) - badge_w // 2
        by = int(1050 * scale)

        draw.rounded_rectangle([(bx, by), (bx + badge_w, by + badge_h)], radius=int(15 * scale), fill=accent_rgb + (26,), outline=accent_rgb + (51,), width=int(3 * scale))
        draw.text((int(600 * scale), by + int(35 * scale)), role_label, fill=accent_rgb, font=font_badge, anchor="mm")

        # Tech stack
        draw.text((int(600 * scale), int(1210 * scale)), (config.tech_stack or "TypeScript, React, Python").upper(), fill=(255, 255, 255, 102), font=font_mono, anchor="mm")

        # Grid Divider line
        draw.line([(int(100 * scale), int(1310 * scale)), (int(1100 * scale), int(1310 * scale))], fill=(255, 255, 255, 12), width=int(2 * scale))

        # Handles
        draw.text((int(150 * scale), int(1390 * scale)), f"GH: @{config.github or 'hacker'}", fill=(255, 255, 255, 127), font=font_mono)
        draw.text((int(150 * scale), int(1460 * scale)), f"TW: @{config.twitter or 'hacker'}", fill=(255, 255, 255, 127), font=font_mono)

        # Location details
        draw.text((int(1050 * scale), int(1390 * scale)), "GOA, INDIA", fill=(255, 255, 255, 127), font=font_mono, anchor="rm")
        draw.text((int(1050 * scale), int(1450 * scale)), "15.2993° N, 74.1240° E", fill=(255, 255, 255, 76), font=font_mono_small, anchor="rm")

        # 5. Draw QR Code matrix decoration (at lower right coordinates slot)
        # Centered around (900, 1310) scaled, size ~150px
        qr_size = int(140 * scale)
        qr_x = int(910 * scale)
        qr_y = int(1496 * scale)
        self._draw_qr_code(draw, (qr_x, qr_y), qr_size, accent_rgb, scale)

        # 6. Pseudo Barcode drawing at the bottom center
        barcode_x = int(150 * scale)
        barcode_y = int(1640 * scale)
        barcode_h = int(40 * scale)
        for i in range(0, int(600 * scale), int(10 * scale)):
            stripe_w = int(6 * scale) if i % 30 == 0 else (int(4 * scale) if i % 20 == 0 else int(2 * scale))
            draw.rectangle([(barcode_x + i, barcode_y), (barcode_x + i + stripe_w, barcode_y + barcode_h)], fill=(255, 255, 255, 153))

        draw.text((int(450 * scale), int(1700 * scale)), "HHG-2026-BUILDER-VERIFIED", fill=(255, 255, 255, 51), font=font_mono_small, anchor="lm")

        # Save transparent PNG to output bytes
        output_buffer = io.BytesIO()
        card.save(output_buffer, format="PNG")
        return output_buffer.getvalue()


# Instantiate service singleton
image_processor_service = ImageProcessorService()
