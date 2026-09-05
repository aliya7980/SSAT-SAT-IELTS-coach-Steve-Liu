#!/usr/bin/env python3
"""
Small desktop dancing sprite.

Controls:
- Drag the sprite to move it.
- Hover over it to get a greeting.
- Press Esc or Q while the sprite is focused to close it.
- Right-click / two-finger click the sprite to close it.
"""

from __future__ import annotations

import sys
import random
import tkinter as tk
from pathlib import Path

from PIL import Image, ImageSequence, ImageTk


DEFAULT_GIF = Path("/Users/shililiu/Desktop/yuexinmao_clean_loop.gif")
TRANSPARENT_KEY = "#123456"


class DancingSprite:
    def __init__(self, gif_path: Path, scale: float = 1.75, frame_delay_ms: int | None = None) -> None:
        self.gif_path = gif_path
        self.scale = scale
        self.root = tk.Tk()
        self.root.title("Desktop Dancing Sprite")
        self.root.overrideredirect(True)
        self.root.attributes("-topmost", True)

        self.window_bg = TRANSPARENT_KEY
        self.root.configure(bg=TRANSPARENT_KEY)
        try:
            self.root.wm_attributes("-transparentcolor", TRANSPARENT_KEY)
        except tk.TclError:
            self.root.attributes("-alpha", 0.98)

        self.frames, self.delays = self.load_frames(frame_delay_ms)
        self.frame_index = 0
        self.drag_x = 0
        self.drag_y = 0
        self.dragging = False
        self.target_x = 0
        self.target_y = 0
        self.next_target_ms = 0
        self.hovering = False

        self.label = tk.Label(self.root, image=self.frames[0], bd=0, bg=self.window_bg, highlightthickness=0)
        self.label.pack()
        self.bubble = self.create_greeting_bubble()

        self.place_top_left()
        self.choose_new_target()
        self.bind_controls()
        self.animate()
        self.wander()
        self.root.lift()
        self.root.focus_force()
        self.root.after(250, self.show_greeting)
        self.root.after(2600, self.hide_greeting)
        self.root.after(500, self.root.lift)

    def load_frames(self, forced_delay: int | None) -> tuple[list[ImageTk.PhotoImage], list[int]]:
        if not self.gif_path.exists():
            raise FileNotFoundError(f"Could not find GIF: {self.gif_path}")

        source = Image.open(self.gif_path)
        frames: list[ImageTk.PhotoImage] = []
        delays: list[int] = []

        for frame in ImageSequence.Iterator(source):
            rgba = frame.convert("RGBA")
            rgba = self.cut_out_avatar(rgba)
            if self.scale != 1:
                w, h = rgba.size
                rgba = rgba.resize((int(w * self.scale), int(h * self.scale)), Image.Resampling.LANCZOS)
            frames.append(ImageTk.PhotoImage(rgba))
            delays.append(forced_delay or max(35, int(frame.info.get("duration", 85))))

        if not frames:
            raise ValueError("The GIF has no readable animation frames.")

        return frames, delays

    @staticmethod
    def cut_out_avatar(image: Image.Image) -> Image.Image:
        """Remove only the outer white/purple background, then crop to the avatar."""
        image = image.copy()
        width, height = image.size
        pixels = image.load()
        seen = set()
        stack = []

        def is_background(x: int, y: int) -> bool:
            r, g, b, a = pixels[x, y]
            is_near_white = r > 238 and g > 238 and b > 238
            is_purple_matte = r > 170 and b > 170 and g < 135
            is_pale_purple_matte = r > 190 and b > 190 and abs(r - b) < 55 and g < 190
            return a < 8 or is_near_white or is_purple_matte or is_pale_purple_matte

        for x in range(width):
            stack.append((x, 0))
            stack.append((x, height - 1))
        for y in range(height):
            stack.append((0, y))
            stack.append((width - 1, y))

        while stack:
            x, y = stack.pop()
            if (x, y) in seen or not (0 <= x < width and 0 <= y < height):
                continue
            seen.add((x, y))
            if not is_background(x, y):
                continue
            r, g, b, _a = pixels[x, y]
            pixels[x, y] = (r, g, b, 0)
            stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

        bbox = image.getbbox()
        if bbox:
            pad = 4
            left = max(0, bbox[0] - pad)
            top = max(0, bbox[1] - pad)
            right = min(width, bbox[2] + pad)
            bottom = min(height, bbox[3] + pad)
            image = image.crop((left, top, right, bottom))

        return image

    def place_top_left(self) -> None:
        self.root.update_idletasks()
        width = self.frames[0].width()
        height = self.frames[0].height()
        x = 80
        y = 80
        self.root.geometry(f"{width}x{height}+{x}+{y}")
        self.target_x = x
        self.target_y = y

    def bind_controls(self) -> None:
        self.label.bind("<Enter>", self.show_greeting)
        self.label.bind("<Leave>", self.hide_greeting)
        self.label.bind("<ButtonPress-1>", self.start_drag)
        self.label.bind("<ButtonRelease-1>", self.stop_drag)
        self.label.bind("<B1-Motion>", self.drag)
        self.label.bind("<Button-2>", lambda _event: self.close())
        self.label.bind("<Button-3>", lambda _event: self.close())
        self.root.bind("<Escape>", lambda _event: self.close())
        self.root.bind("q", lambda _event: self.close())
        self.root.bind("Q", lambda _event: self.close())

    def create_greeting_bubble(self) -> tk.Toplevel:
        bubble = tk.Toplevel(self.root)
        bubble.overrideredirect(True)
        bubble.attributes("-topmost", True)
        bubble.configure(bg="#fff4c7")
        bubble.withdraw()

        text = tk.Label(
            bubble,
            text="Hi Steve!",
            font=("Helvetica", 15, "bold"),
            fg="#5a3518",
            bg="#fff4c7",
            padx=14,
            pady=8,
            bd=2,
            relief="solid",
        )
        text.pack()
        return bubble

    def show_greeting(self, _event: tk.Event | None = None) -> None:
        self.hovering = True
        self.update_greeting_position()
        self.bubble.deiconify()

    def hide_greeting(self, _event: tk.Event | None = None) -> None:
        self.hovering = False
        self.bubble.withdraw()
        self.choose_new_target()

    def update_greeting_position(self) -> None:
        self.bubble.update_idletasks()
        bubble_w = self.bubble.winfo_reqwidth()
        bubble_h = self.bubble.winfo_reqheight()
        sprite_w = self.frames[0].width()
        x = self.root.winfo_x() + max(0, (sprite_w - bubble_w) // 2)
        y = self.root.winfo_y() - bubble_h - 8

        if y < 12:
            y = self.root.winfo_y() + self.frames[0].height() + 8
        x, y = self.keep_window_inside_screen(x, y, bubble_w, bubble_h)
        self.bubble.geometry(f"+{x}+{y}")

    def start_drag(self, event: tk.Event) -> None:
        self.dragging = True
        self.drag_x = event.x
        self.drag_y = event.y

    def stop_drag(self, _event: tk.Event) -> None:
        self.dragging = False
        self.choose_new_target()

    def drag(self, event: tk.Event) -> None:
        x = self.root.winfo_x() + event.x - self.drag_x
        y = self.root.winfo_y() + event.y - self.drag_y
        x, y = self.keep_inside_screen(x, y)
        self.root.geometry(f"+{x}+{y}")
        if self.hovering:
            self.update_greeting_position()

    def keep_inside_screen(self, x: float, y: float) -> tuple[int, int]:
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        width = self.frames[0].width()
        height = self.frames[0].height()
        margin = 18
        max_x = max(margin, screen_w - width - margin)
        max_y = max(margin, screen_h - height - 58)
        return int(min(max(x, margin), max_x)), int(min(max(y, margin), max_y))

    def keep_window_inside_screen(self, x: float, y: float, width: int, height: int) -> tuple[int, int]:
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        margin = 10
        max_x = max(margin, screen_w - width - margin)
        max_y = max(margin, screen_h - height - 38)
        return int(min(max(x, margin), max_x)), int(min(max(y, margin), max_y))

    def choose_new_target(self) -> None:
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        width = self.frames[0].width()
        height = self.frames[0].height()
        margin = 24
        self.target_x = random.randint(margin, max(margin, screen_w - width - margin))
        self.target_y = random.randint(margin, max(margin, screen_h - height - 62))
        self.next_target_ms = random.randint(1200, 3600)

    def wander(self) -> None:
        if self.hovering:
            self.update_greeting_position()
        elif not self.dragging:
            x = self.root.winfo_x()
            y = self.root.winfo_y()
            eased_x = x + (self.target_x - x) * 0.025
            eased_y = y + (self.target_y - y) * 0.025
            next_x, next_y = self.keep_inside_screen(eased_x, eased_y)
            self.root.geometry(f"+{next_x}+{next_y}")

            if abs(self.target_x - next_x) < 6 and abs(self.target_y - next_y) < 6:
                self.choose_new_target()

        self.next_target_ms -= 33
        if self.next_target_ms <= 0 and not self.dragging:
            self.choose_new_target()
        self.root.after(33, self.wander)

    def animate(self) -> None:
        self.label.configure(image=self.frames[self.frame_index])
        delay = self.delays[self.frame_index]
        self.frame_index = (self.frame_index + 1) % len(self.frames)
        self.root.after(delay, self.animate)

    def close(self) -> None:
        try:
            self.bubble.destroy()
        except tk.TclError:
            pass
        self.root.destroy()

    def run(self) -> None:
        self.root.mainloop()


def main() -> None:
    gif_path = Path(sys.argv[1]).expanduser() if len(sys.argv) > 1 else DEFAULT_GIF
    DancingSprite(gif_path).run()


if __name__ == "__main__":
    main()
