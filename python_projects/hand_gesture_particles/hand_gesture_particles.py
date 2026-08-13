import argparse
import importlib.util
import math
import os
import random
import shutil
import sys
from dataclasses import dataclass, field
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
os.environ.setdefault("MPLCONFIGDIR", str(PROJECT_DIR / ".cache" / "matplotlib"))
(PROJECT_DIR / ".cache" / "matplotlib").mkdir(parents=True, exist_ok=True)


def ensure_python312_with_cv2() -> None:
    has_cv2 = importlib.util.find_spec("cv2") is not None
    is_python312 = sys.version_info[:2] == (3, 12)

    if is_python312 and has_cv2:
        return

    python312 = shutil.which("python3.12") or "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3.12"
    if Path(python312).exists() and Path(python312).resolve() != Path(sys.executable).resolve():
        os.execv(python312, [python312, str(Path(__file__).resolve()), *sys.argv[1:]])

    raise ModuleNotFoundError("Run this program with: python3.12 hand_gesture_particles.py")


ensure_python312_with_cv2()

import cv2
import mediapipe as mp
import numpy as np


WIDTH = 1200
HEIGHT = 720
CAMERA_WIDTH = 430
ATOM_LEFT = CAMERA_WIDTH
ATOM_WIDTH = WIDTH - CAMERA_WIDTH
TRAIL_LENGTH = 18

ATOM_PRESETS = [
    {
        "name": "Neon",
        "electrons": 54,
        "nucleus": 86,
        "base_radius": 105,
        "shell_gap": 28,
        "nucleus_radius": 44,
        "electron_colors": [(100, 215, 255), (255, 225, 125), (190, 170, 255), (125, 255, 215)],
        "nucleus_colors": [(255, 105, 88), (245, 190, 72)],
    },
    {
        "name": "Carbon",
        "electrons": 36,
        "nucleus": 58,
        "base_radius": 92,
        "shell_gap": 34,
        "nucleus_radius": 34,
        "electron_colors": [(120, 255, 210), (255, 230, 145), (95, 200, 255)],
        "nucleus_colors": [(255, 128, 85), (255, 214, 100)],
    },
    {
        "name": "Xenon",
        "electrons": 78,
        "nucleus": 118,
        "base_radius": 118,
        "shell_gap": 24,
        "nucleus_radius": 55,
        "electron_colors": [(160, 135, 255), (95, 220, 255), (255, 215, 120), (255, 120, 165)],
        "nucleus_colors": [(255, 92, 120), (255, 184, 77)],
    },
    {
        "name": "Gold",
        "electrons": 96,
        "nucleus": 140,
        "base_radius": 126,
        "shell_gap": 22,
        "nucleus_radius": 62,
        "electron_colors": [(255, 213, 92), (255, 245, 190), (100, 205, 255), (255, 155, 75)],
        "nucleus_colors": [(255, 194, 73), (255, 115, 80)],
    },
]


@dataclass
class Electron:
    orbit: int
    angle: float
    speed: float
    radius: float
    tilt: float
    phase: float
    color: tuple[int, int, int]
    trail: list[tuple[int, int]] = field(default_factory=list)

    def position(self, center: tuple[float, float], scale: float, rotation: float) -> tuple[float, float]:
        cx, cy = center
        angle = self.angle + rotation + self.phase
        x = math.cos(angle) * self.radius * scale
        y = math.sin(angle) * self.radius * scale * self.tilt
        plane = self.orbit % 3

        if plane == 1:
            x, y = x * 0.52 - y * 0.18, x * 0.76 + y * 0.42
        elif plane == 2:
            x, y = x * 0.52 + y * 0.18, -x * 0.76 + y * 0.42

        return cx + x, cy + y

    def step(self, spin_power: float) -> None:
        self.angle += self.speed * spin_power

    def remember(self, point: tuple[float, float]) -> None:
        self.trail.append((int(point[0]), int(point[1])))
        if len(self.trail) > TRAIL_LENGTH:
            self.trail.pop(0)


@dataclass
class NucleusParticle:
    radius: float
    angle: float
    wobble: float
    color: tuple[int, int, int]
    size: int

    def position(self, center: tuple[float, float], scale: float, tick: float) -> tuple[int, int]:
        cx, cy = center
        wobble = math.sin(tick * self.wobble + self.angle) * 3.5
        radius = (self.radius + wobble) * scale
        x = cx + math.cos(self.angle + tick * 0.45) * radius
        y = cy + math.sin(self.angle + tick * 0.35) * radius
        return int(x), int(y)


def atom_home() -> tuple[float, float]:
    return ATOM_LEFT + ATOM_WIDTH / 2, HEIGHT / 2


def make_electrons(atom: dict) -> list[Electron]:
    electrons = []
    palette = atom["electron_colors"]
    for index in range(atom["electrons"]):
        shell = index % 6
        electrons.append(
            Electron(
                orbit=index % 3,
                angle=random.uniform(0, 2 * math.pi),
                speed=random.uniform(0.012, 0.026) * random.choice([-1, 1]),
                radius=atom["base_radius"] + shell * atom["shell_gap"] + random.uniform(-7, 7),
                tilt=random.uniform(0.28, 0.58),
                phase=random.uniform(0, 2 * math.pi),
                color=random.choice(palette),
            )
        )
    return electrons


def make_nucleus(atom: dict) -> list[NucleusParticle]:
    particles = []
    colors = atom["nucleus_colors"]
    for index in range(atom["nucleus"]):
        particles.append(
            NucleusParticle(
                radius=random.triangular(0, atom["nucleus_radius"], atom["nucleus_radius"] * 0.45),
                angle=random.uniform(0, 2 * math.pi),
                wobble=random.uniform(1.4, 3.6),
                color=colors[index % len(colors)],
                size=random.choice([3, 4, 5, 6]),
            )
        )
    return particles


def make_atom(atom_index: int) -> tuple[list[Electron], list[NucleusParticle]]:
    atom = ATOM_PRESETS[atom_index]
    return make_electrons(atom), make_nucleus(atom)


def count_fingers(hand_landmarks, handedness_label: str) -> int:
    landmarks = hand_landmarks.landmark
    fingers = 0
    for tip, pip in [(8, 6), (12, 10), (16, 14), (20, 18)]:
        if landmarks[tip].y < landmarks[pip].y:
            fingers += 1

    thumb_tip = landmarks[4]
    thumb_ip = landmarks[3]
    thumb_open = thumb_tip.x < thumb_ip.x if handedness_label == "Right" else thumb_tip.x > thumb_ip.x
    return fingers + int(thumb_open)


def hand_center(hand_landmarks) -> tuple[float, float]:
    points = hand_landmarks.landmark
    return sum(point.x for point in points) / len(points), sum(point.y for point in points) / len(points)


def hand_atom_point(hand_landmarks) -> tuple[float, float]:
    x, y = hand_center(hand_landmarks)
    return ATOM_LEFT + x * ATOM_WIDTH, y * HEIGHT


def is_pinching(hand_landmarks) -> bool:
    landmarks = hand_landmarks.landmark
    thumb = landmarks[4]
    index = landmarks[8]
    return math.hypot(thumb.x - index.x, thumb.y - index.y) < 0.065


def gesture_mode(finger_count: int | None, pinching: bool) -> str:
    if finger_count == 1:
        return "spin"
    if finger_count == 2 or pinching:
        return "pinch_close"
    if finger_count == 3:
        return "extract"
    if finger_count == 4:
        return "swap"
    if finger_count == 5:
        return "grab"
    return "idle"


def draw_camera_panel(canvas: np.ndarray, frame: np.ndarray, finger_count: int | None, mode: str, atom_name: str) -> None:
    camera_frame = cv2.resize(frame, (CAMERA_WIDTH, HEIGHT))
    canvas[:, :CAMERA_WIDTH] = camera_frame
    cv2.rectangle(canvas, (0, 0), (CAMERA_WIDTH - 1, HEIGHT - 1), (255, 255, 255), 2)
    label = "Fingers: -" if finger_count is None else f"Fingers: {finger_count}"
    cv2.rectangle(canvas, (16, 18), (286, 124), (6, 27, 45), -1)
    cv2.putText(canvas, label, (30, 48), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (245, 189, 72), 2, cv2.LINE_AA)
    cv2.putText(canvas, f"Mode: {mode}", (30, 78), cv2.FONT_HERSHEY_SIMPLEX, 0.56, (218, 238, 247), 1, cv2.LINE_AA)
    cv2.putText(canvas, f"Atom: {atom_name}", (30, 108), cv2.FONT_HERSHEY_SIMPLEX, 0.56, (218, 238, 247), 1, cv2.LINE_AA)


def draw_background(canvas: np.ndarray) -> None:
    canvas[:, ATOM_LEFT:] = (4, 13, 28)
    cx, cy = atom_home()
    for radius in [100, 170, 240, 310]:
        cv2.circle(canvas, (int(cx), int(cy)), radius, (9, 28, 48), 1, cv2.LINE_AA)


def draw_orbits(canvas: np.ndarray, center: tuple[float, float], scale: float, rotation: float) -> None:
    cx, cy = int(center[0]), int(center[1])
    for index, radius in enumerate([115, 170, 225, 275]):
        color = (22, 70, 104)
        axes = (int(radius * scale), int(radius * scale * 0.38))
        cv2.ellipse(canvas, (cx, cy), axes, rotation * 22 + index * 55, 0, 360, color, 1, cv2.LINE_AA)
        cv2.ellipse(canvas, (cx, cy), axes, -rotation * 19 - index * 55, 0, 360, color, 1, cv2.LINE_AA)


def draw_nucleus(canvas: np.ndarray, nucleus: list[NucleusParticle], center: tuple[float, float], scale: float, tick: float, atom: dict) -> None:
    cv2.circle(canvas, (int(center[0]), int(center[1])), int(58 * scale), (18, 42, 64), -1, cv2.LINE_AA)
    cv2.circle(canvas, (int(center[0]), int(center[1])), int((atom["nucleus_radius"] + 24) * scale), (255, 190, 80), 2, cv2.LINE_AA)
    for particle in nucleus:
        x, y = particle.position(center, scale, tick)
        cv2.circle(canvas, (x, y), particle.size, particle.color, -1, cv2.LINE_AA)
    cv2.circle(canvas, (int(center[0]), int(center[1])), int(18 * scale), (255, 245, 220), -1, cv2.LINE_AA)


def draw_electrons(
    canvas: np.ndarray,
    electrons: list[Electron],
    center: tuple[float, float],
    scale: float,
    rotation: float,
    extracted_index: int | None,
    extract_point: tuple[float, float] | None,
) -> None:
    for index, electron in enumerate(electrons):
        point = electron.position(center, scale, rotation)
        if extracted_index == index and extract_point is not None:
            point = (
                point[0] + (extract_point[0] - point[0]) * 0.86,
                point[1] + (extract_point[1] - point[1]) * 0.86,
            )
            cv2.line(canvas, (int(center[0]), int(center[1])), (int(point[0]), int(point[1])), (80, 170, 255), 2, cv2.LINE_AA)

        electron.remember(point)
        for trail_index, trail_point in enumerate(electron.trail[:-1]):
            alpha = (trail_index + 1) / TRAIL_LENGTH
            trail_color = tuple(int(channel * alpha * 0.55) for channel in electron.color)
            cv2.circle(canvas, trail_point, 2, trail_color, -1, cv2.LINE_AA)

        glow = 9 if extracted_index == index else 6
        cv2.circle(canvas, (int(point[0]), int(point[1])), glow, tuple(max(c - 70, 0) for c in electron.color), -1, cv2.LINE_AA)
        cv2.circle(canvas, (int(point[0]), int(point[1])), 4 if extracted_index == index else 3, electron.color, -1, cv2.LINE_AA)


def draw_instructions(canvas: np.ndarray, mode: str, scale: float, spin_power: float, atom_name: str) -> None:
    x = ATOM_LEFT + 22
    cv2.putText(canvas, "Interactive Atom", (x, HEIGHT - 146), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(canvas, "1 finger: spin electrons", (x, HEIGHT - 108), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (190, 214, 225), 1, cv2.LINE_AA)
    cv2.putText(canvas, "2 fingers / pinch: draw orbits closer", (x, HEIGHT - 84), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (190, 214, 225), 1, cv2.LINE_AA)
    cv2.putText(canvas, "3 fingers: pick out one electron", (x, HEIGHT - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (190, 214, 225), 1, cv2.LINE_AA)
    cv2.putText(canvas, "4 fingers: swap atom | 5 fingers: grab atom | q: quit", (x, HEIGHT - 36), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (190, 214, 225), 1, cv2.LINE_AA)
    cv2.putText(canvas, f"{atom_name} | mode {mode} | scale {scale:.2f} | spin {spin_power:.2f}", (x, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.58, (170, 195, 205), 1, cv2.LINE_AA)


def run_self_test() -> None:
    electrons, nucleus = make_atom(0)
    assert len(electrons) == ATOM_PRESETS[0]["electrons"]
    assert len(nucleus) == ATOM_PRESETS[0]["nucleus"]
    assert gesture_mode(1, False) == "spin"
    assert gesture_mode(2, False) == "pinch_close"
    assert gesture_mode(3, False) == "extract"
    assert gesture_mode(4, False) == "swap"
    assert gesture_mode(5, False) == "grab"
    print("Self-test passed")
    print(f"Electrons: {len(electrons)}")
    print(f"Nucleus particles: {len(nucleus)}")
    print(f"Atom presets: {', '.join(atom['name'] for atom in ATOM_PRESETS)}")
    print(f"OpenCV: {cv2.__version__}")
    print(f"MediaPipe: {mp.__version__}")
    print("Gestures: 1 spin, 2 pinch closer, 3 extract electron, 4 swap atom, 5 grab atom")


def main() -> None:
    parser = argparse.ArgumentParser(description="Hand controlled atom structure")
    parser.add_argument("--self-test", action="store_true", help="Check imports and logic without opening the webcam.")
    parser.add_argument("--camera", type=int, default=0, help="Camera index to use. Default: 0.")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        raise RuntimeError("Could not open the webcam. Check camera permission for Terminal or VS Code.")

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    atom_index = 0
    electrons, nucleus = make_atom(atom_index)
    center = atom_home()
    target_center = atom_home()
    scale = 1.0
    target_scale = 1.0
    spin_power = 1.0
    rotation = 0.0
    tick = 0.0
    extracted_index = 7
    four_finger_ready = True

    with mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.65, min_tracking_confidence=0.65) as hands:
        while True:
            ok, frame = cap.read()
            if not ok:
                break

            frame = cv2.flip(frame, 1)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb)
            finger_count = None
            mode = "idle"
            hand_point = None
            extract_point = None

            if results.multi_hand_landmarks:
                hand_landmarks = results.multi_hand_landmarks[0]
                hand_label = results.multi_handedness[0].classification[0].label
                finger_count = count_fingers(hand_landmarks, hand_label)
                pinching = is_pinching(hand_landmarks)
                mode = gesture_mode(finger_count, pinching)
                hand_point = hand_atom_point(hand_landmarks)

                if mode == "spin":
                    spin_power += 0.18
                elif mode == "pinch_close":
                    target_scale = 0.48
                elif mode == "extract":
                    extract_point = hand_point
                    extracted_index = min(len(electrons) - 1, max(0, int((hand_point[1] / HEIGHT) * len(electrons))))
                elif mode == "swap":
                    if four_finger_ready:
                        atom_index = (atom_index + 1) % len(ATOM_PRESETS)
                        electrons, nucleus = make_atom(atom_index)
                        target_scale = 1.0
                        target_center = atom_home()
                        center = atom_home()
                        spin_power = 1.0
                        extracted_index = min(extracted_index, len(electrons) - 1)
                        four_finger_ready = False
                elif mode == "grab":
                    target_center = hand_point

                mp_drawing.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)
            else:
                target_scale = 1.0
                target_center = atom_home()
                four_finger_ready = True

            if finger_count != 4:
                four_finger_ready = True

            if mode not in {"spin", "extract"}:
                spin_power += (1.0 - spin_power) * 0.03
            if mode != "pinch_close" and mode != "reset":
                target_scale += (1.0 - target_scale) * 0.012
            if mode != "grab" and mode != "reset":
                target_center = (target_center[0] + (atom_home()[0] - target_center[0]) * 0.012, target_center[1] + (atom_home()[1] - target_center[1]) * 0.012)

            center = (center[0] + (target_center[0] - center[0]) * 0.12, center[1] + (target_center[1] - center[1]) * 0.12)
            scale += (target_scale - scale) * 0.09
            spin_power = min(max(spin_power, 0.35), 5.2)
            rotation += 0.018 * spin_power
            tick += 0.035

            for electron in electrons:
                electron.step(spin_power)

            canvas = np.zeros((HEIGHT, WIDTH, 3), dtype=np.uint8)
            draw_background(canvas)
            atom = ATOM_PRESETS[atom_index]
            draw_camera_panel(canvas, frame, finger_count, mode, atom["name"])
            draw_orbits(canvas, center, scale, rotation)
            draw_nucleus(canvas, nucleus, center, scale, tick, atom)
            draw_electrons(canvas, electrons, center, scale, rotation, extracted_index if mode == "extract" else None, extract_point)
            if hand_point is not None and mode == "grab":
                cv2.circle(canvas, (int(hand_point[0]), int(hand_point[1])), 38, (255, 225, 125), 2, cv2.LINE_AA)
            draw_instructions(canvas, mode, scale, spin_power, atom["name"])

            cv2.imshow("Interactive Atom", canvas)
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
