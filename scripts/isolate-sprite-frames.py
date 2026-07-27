from collections import deque
from pathlib import Path
import sys

from PIL import Image


def isolate_frames(source_path: str, output_path: str) -> None:
    source = Image.open(source_path).convert("RGBA")
    width, height = source.size
    alpha = source.getchannel("A")
    alpha_bytes = alpha.tobytes()
    visited = bytearray(width * height)
    components = []

    for start in range(width * height):
        if visited[start] or alpha_bytes[start] <= 20:
            continue

        queue = deque([start])
        visited[start] = 1
        pixels = []
        min_x = max_x = start % width
        min_y = max_y = start // width

        while queue:
            index = queue.popleft()
            x = index % width
            y = index // width
            pixels.append((x, y))
            min_x = min(min_x, x)
            max_x = max(max_x, x)
            min_y = min(min_y, y)
            max_y = max(max_y, y)

            for neighbor in (
                index - 1,
                index + 1,
                index - width,
                index + width,
            ):
                if neighbor < 0 or neighbor >= width * height or visited[neighbor]:
                    continue
                nx = neighbor % width
                ny = neighbor // width
                if abs(nx - x) + abs(ny - y) != 1:
                    continue
                if alpha_bytes[neighbor] > 20:
                    visited[neighbor] = 1
                    queue.append(neighbor)

        if len(pixels) > 500:
            components.append(
                {
                    "pixels": pixels,
                    "bbox": (min_x, min_y, max_x + 1, max_y + 1),
                    "center": ((min_x + max_x) / 2, (min_y + max_y) / 2),
                }
            )

    if len(components) != 16:
        raise RuntimeError(f"Expected 16 puppy components, found {len(components)}")

    cell = 320
    canvas = Image.new("RGBA", (cell * 4, cell * 4), (0, 0, 0, 0))
    remaining = components[:]

    for row in range(4):
        for column in range(4):
            expected_x = (column + 0.5) * width / 4
            expected_y = (row + 0.5) * height / 4
            component = min(
                remaining,
                key=lambda item: (item["center"][0] - expected_x) ** 2
                + (item["center"][1] - expected_y) ** 2,
            )
            remaining.remove(component)

            left, top, right, bottom = component["bbox"]
            crop = source.crop((left, top, right, bottom))
            mask = Image.new("L", crop.size, 0)
            mask_pixels = mask.load()
            for x, y in component["pixels"]:
                mask_pixels[x - left, y - top] = alpha.getpixel((x, y))
            crop.putalpha(mask)

            max_width = 280
            max_height = 250
            scale = min(max_width / crop.width, max_height / crop.height, 1.0)
            resized = crop.resize(
                (max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
                Image.Resampling.LANCZOS,
            )
            x_position = column * cell + (cell - resized.width) // 2
            y_position = row * cell + cell - resized.height - 24
            canvas.alpha_composite(resized, (x_position, y_position))

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, optimize=True)


if __name__ == "__main__":
    isolate_frames(sys.argv[1], sys.argv[2])
