import argparse
import importlib.util
import math
import os
import random
import shutil
import sys
import time
from dataclasses import dataclass
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
os.environ.setdefault("MPLCONFIGDIR", str(PROJECT_DIR / ".cache" / "matplotlib"))
(PROJECT_DIR / ".cache" / "matplotlib").mkdir(parents=True, exist_ok=True)


def ensure_python312_modules() -> None:
    required = ["cv2", "mediapipe", "numpy"]
    missing = [name for name in required if importlib.util.find_spec(name) is None]
    is_python312 = sys.version_info[:2] == (3, 12)
    if is_python312 and not missing:
        return

    python312 = shutil.which("python3.12") or "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3.12"
    if Path(python312).exists() and Path(python312).resolve() != Path(sys.executable).resolve():
        os.execv(python312, [python312, str(Path(__file__).resolve()), *sys.argv[1:]])

    raise ModuleNotFoundError("Run this program with: python3.12 sand_simulation.py")


ensure_python312_modules()

import cv2
import mediapipe as mp
import numpy as np


WIDTH = 1040
HEIGHT = 680
FLOOR_Y = HEIGHT - 58
PARTICLE_COUNT = 3200
FPS = 60

NONE = "NONE"
FIST = "FIST"
ONE_FINGER = "ONE FINGER"
MIDDLE_FINGER = "MIDDLE FINGER"
TWO_FINGERS = "TWO FINGERS"
THREE_FINGERS = "THREE FINGERS"
FOUR_FINGERS = "FOUR FINGERS"
FIVE_FINGERS = "FIVE FINGERS"
TWO_HAND_SCOOP = "TWO HAND SCOOP"

MODE_IDLE = "HEAP"
MODE_POKE = "POKE"
MODE_CONDENSE = "CONDENSE"
MODE_STORM = "SANDSTORM"
MODE_DISPERSE = "DISPERSE"
MODE_PACK = "PACK"
MODE_SCOOP = "SCOOP"
MODE_V_SHAPE = "V SHAPE"
MODE_ANGRY_FACE = "ANGRY FACE"


PALETTES = [
    ("Golden Desert", [(214, 170, 78), (235, 195, 112), (184, 132, 55), (246, 216, 145)]),
    ("Mars Sand", [(188, 78, 44), (226, 110, 55), (150, 57, 39), (244, 141, 75)]),
    ("Beach Sand", [(228, 214, 170), (246, 234, 194), (197, 178, 128), (255, 244, 207)]),
    ("Cyber Sand", [(65, 212, 255), (45, 142, 214), (134, 240, 255), (30, 90, 180)]),
    ("Purple Neon", [(185, 105, 255), (120, 70, 205), (235, 165, 255), (95, 50, 150)]),
]


@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    target_x: float
    target_y: float
    size: int
    color: tuple[int, int, int]


class SandSimulation:
    def __init__(self, width: int, height: int, count: int) -> None:
        self.width = width
        self.height = height
        self.count = count
        self.floor_y = FLOOR_Y
        self.palette_index = 0
        self.palette_name, self.palette = PALETTES[self.palette_index]
        self.particles: list[Particle] = []
        self.mode = MODE_IDLE
        self.reset_heap()

    def reset_heap(self) -> None:
        self.particles.clear()
        cx = self.width / 2
        for _ in range(self.count):
            spread = random.gauss(0, 126)
            height = abs(random.gauss(0, 58))
            x = cx + spread
            y = self.floor_y - height + abs(spread) * 0.22 + random.uniform(-5, 5)
            y = min(max(y, 120), self.floor_y)
            self.particles.append(
                Particle(
                    x=x,
                    y=y,
                    vx=random.uniform(-0.15, 0.15),
                    vy=random.uniform(-0.15, 0.15),
                    target_x=x,
                    target_y=y,
                    size=random.choice([1, 1, 1, 2]),
                    color=random.choice(self.palette),
                )
            )
        self.mode = MODE_IDLE

    def change_color(self) -> None:
        self.palette_index = (self.palette_index + 1) % len(PALETTES)
        self.palette_name, self.palette = PALETTES[self.palette_index]
        for particle in self.particles:
            particle.color = random.choice(self.palette)

    def poke(self, x: float, y: float) -> None:
        self.mode = MODE_POKE
        radius = 82
        radius_sq = radius * radius
        for particle in self.particles:
            dx = particle.x - x
            dy = particle.y - y
            dist_sq = dx * dx + dy * dy
            if 1 < dist_sq < radius_sq:
                dist = math.sqrt(dist_sq)
                strength = (1 - dist / radius) ** 2
                particle.vx += (dx / dist) * strength * 15.5
                particle.vy += (dy / dist) * strength * 12.5 - strength * 1.2

    def condense_ball(self, dt: float) -> None:
        self.mode = MODE_CONDENSE
        cx = self.width / 2
        cy = self.height / 2 + 20
        ball_radius = 128
        for index, particle in enumerate(self.particles):
            angle = index * 2.399963
            layer = math.sqrt((index % self.count) / self.count)
            target_x = cx + math.cos(angle) * ball_radius * layer
            target_y = cy + math.sin(angle) * ball_radius * layer
            particle.vx += (target_x - particle.x) * 6.2 * dt + random.uniform(-0.08, 0.08)
            particle.vy += (target_y - particle.y) * 6.2 * dt + random.uniform(-0.08, 0.08)
            particle.vx *= 0.965
            particle.vy *= 0.965

    def form_v_shape(self, dt: float) -> None:
        self.mode = MODE_V_SHAPE
        cx = self.width / 2
        top_y = self.height / 2 - 155
        bottom_y = self.height / 2 + 155
        half_width = 165
        for index, particle in enumerate(self.particles):
            side = -1 if index % 2 == 0 else 1
            t = ((index // 2) % (self.count // 2)) / max(self.count // 2 - 1, 1)
            jitter = ((index * 17) % 19 - 9) * 0.9
            target_x = cx + side * half_width * (1 - t) + jitter
            target_y = top_y + (bottom_y - top_y) * t + random.uniform(-0.25, 0.25)
            particle.vx += (target_x - particle.x) * 7.0 * dt
            particle.vy += (target_y - particle.y) * 7.0 * dt
            particle.vx *= 0.94
            particle.vy *= 0.94

    def form_angry_face(self, dt: float) -> None:
        self.mode = MODE_ANGRY_FACE
        cx = self.width / 2
        cy = self.height / 2 + 5
        shape_points = self._angry_face_points(cx, cy)
        for index, particle in enumerate(self.particles):
            target_x, target_y = shape_points[index % len(shape_points)]
            target_x += random.uniform(-1.2, 1.2)
            target_y += random.uniform(-1.2, 1.2)
            particle.vx += (target_x - particle.x) * 7.6 * dt
            particle.vy += (target_y - particle.y) * 7.6 * dt
            particle.vx *= 0.935
            particle.vy *= 0.935

    def _angry_face_points(self, cx: float, cy: float) -> list[tuple[float, float]]:
        points = []
        for i in range(760):
            angle = 2 * math.pi * i / 760
            points.append((cx + math.cos(angle) * 168, cy + math.sin(angle) * 168))

        for start, end, count in [
            ((cx - 118, cy - 78), (cx - 38, cy - 32), 360),
            ((cx + 118, cy - 78), (cx + 38, cy - 32), 360),
            ((cx - 92, cy - 28), (cx - 48, cy - 28), 240),
            ((cx + 48, cy - 28), (cx + 92, cy - 28), 240),
        ]:
            for step in range(count):
                t = step / max(count - 1, 1)
                points.append((start[0] + (end[0] - start[0]) * t, start[1] + (end[1] - start[1]) * t))

        for i in range(720):
            t = i / 719
            angle = math.radians(205 + 130 * t)
            points.append((cx + math.cos(angle) * 88, cy + 96 + math.sin(angle) * 54))

        return points

    def pack_heap(self, dt: float) -> None:
        self.mode = MODE_PACK
        cx = self.width / 2
        for index, particle in enumerate(self.particles):
            offset = ((index * 37) % 320) - 160
            layer = (index % 95) / 95
            target_x = cx + offset * (0.45 + layer * 0.65)
            target_y = self.floor_y - abs(offset) * 0.22 - layer * 58
            particle.vx += (target_x - particle.x) * 4.4 * dt
            particle.vy += (target_y - particle.y) * 4.4 * dt
            particle.vx *= 0.9
            particle.vy *= 0.9

    def sandstorm(self, hand_height: float | None, dt: float) -> None:
        self.mode = MODE_STORM
        cx = self.width / 2
        cy = self.height / 2
        height_boost = 1.0 if hand_height is None else 1.0 + (1 - hand_height) * 1.5
        for particle in self.particles:
            dx = particle.x - cx
            dy = particle.y - cy
            dist = max(math.hypot(dx, dy), 1)
            tangent_x = -dy / dist
            tangent_y = dx / dist
            radial_wave = math.sin(time.monotonic() * 2.5 + dist * 0.024)
            particle.vx += tangent_x * 95 * height_boost * dt
            particle.vy += tangent_y * 95 * height_boost * dt
            particle.vx += (dx / dist) * radial_wave * 32 * dt
            particle.vy += (dy / dist) * radial_wave * 32 * dt
            particle.vx += random.uniform(-16, 16) * dt
            particle.vy += random.uniform(-16, 16) * dt

    def scoop(self, left_hand: tuple[float, float], right_hand: tuple[float, float], lift_power: float, dt: float) -> None:
        self.mode = MODE_SCOOP
        left_x, left_y = left_hand
        right_x, right_y = right_hand
        if left_x > right_x:
            left_x, right_x = right_x, left_x
            left_y, right_y = right_y, left_y

        cup_center_x = (left_x + right_x) / 2
        cup_center_y = (left_y + right_y) / 2 + 72
        cup_width = max(right_x - left_x, 150)
        lift = 180 + min(lift_power, 1.8) * 760
        gap_width = max(24, min(58, cup_width * 0.18))

        for particle in self.particles:
            between_hands = left_x - 62 < particle.x < right_x + 62
            below_palms = particle.y > min(left_y, right_y) - 22
            near_cup = abs(particle.x - cup_center_x) < cup_width * 0.78 and abs(particle.y - cup_center_y) < 230

            if between_hands and below_palms and near_cup:
                dx = cup_center_x - particle.x
                dy = cup_center_y - particle.y
                side_wall = 1.0 - min(abs(dx) / (cup_width * 0.72), 1.0)
                particle.vx += dx * 5.4 * dt
                particle.vy += dy * 2.7 * dt
                particle.vy -= lift * (0.45 + side_wall * 0.75) * dt
                particle.vx += random.uniform(-38, 38) * dt

                # A cup made of hands should leak: particles near the lower middle slip through.
                in_gap = abs(particle.x - cup_center_x) < gap_width and particle.y > cup_center_y + 14
                if in_gap:
                    particle.vx += random.uniform(-32, 32) * dt
                    particle.vy += (520 + random.uniform(0, 240)) * dt

            # Hands act like rough side walls and shove stray sand back into the cup.
            for hand_x, hand_y, direction in [(left_x, left_y, 1), (right_x, right_y, -1)]:
                hx = particle.x - hand_x
                hy = particle.y - hand_y
                dist_sq = hx * hx + hy * hy
                if 1 < dist_sq < 95 * 95:
                    dist = math.sqrt(dist_sq)
                    pressure = (1 - dist / 95) ** 2
                    particle.vx += direction * pressure * 240 * dt
                    particle.vy -= pressure * 135 * dt

    def disperse(self, power: float) -> None:
        self.mode = MODE_DISPERSE
        cx = self.width / 2
        for particle in self.particles:
            dx = particle.x - cx
            sideways = np.sign(dx) if abs(dx) > 3 else random.choice([-1, 1])
            burst = random.uniform(0.8, 1.45) * power
            particle.vx += sideways * random.uniform(70, 160) * burst
            particle.vy -= random.uniform(180, 360) * burst

    def update(self, dt: float) -> None:
        gravity = 680
        damping = 0.992
        floor_friction = 0.72
        left = 4
        right = self.width - 4

        for particle in self.particles:
            if self.mode not in {MODE_CONDENSE, MODE_STORM, MODE_V_SHAPE, MODE_ANGRY_FACE}:
                particle.vy += gravity * dt
            particle.vx *= damping
            particle.vy *= damping
            particle.x += particle.vx * dt
            particle.y += particle.vy * dt

            if particle.x < left:
                particle.x = left
                particle.vx *= -0.45
            elif particle.x > right:
                particle.x = right
                particle.vx *= -0.45

            if particle.y > self.floor_y:
                particle.y = self.floor_y
                if particle.vy > 0:
                    particle.vy *= -0.18
                particle.vx *= floor_friction

            if particle.y < 8:
                particle.y = 8
                particle.vy *= -0.25

    def draw(self, canvas: np.ndarray) -> None:
        for particle in self.particles:
            x = int(particle.x)
            y = int(particle.y)
            if not (0 <= x < self.width and 0 <= y < self.height):
                continue
            color = (particle.color[2], particle.color[1], particle.color[0])
            if particle.size == 1:
                canvas[y, x] = color
            else:
                cv2.circle(canvas, (x, y), particle.size, color, -1, lineType=cv2.LINE_AA)


class HandController:
    def __init__(self, camera_index: int, width: int, height: int) -> None:
        self.width = width
        self.height = height
        self.cap = cv2.VideoCapture(camera_index)
        self.camera_ok = self.cap.isOpened()
        self.hand_window_name = "MediaPipe 21-Point Hand Tracking"
        cv2.namedWindow(self.hand_window_name, cv2.WINDOW_NORMAL)
        cv2.resizeWindow(self.hand_window_name, 520, 360)
        cv2.moveWindow(self.hand_window_name, 30, 90)
        self.hands = mp.solutions.hands.Hands(
            max_num_hands=2,
            model_complexity=1,
            min_detection_confidence=0.45,
            min_tracking_confidence=0.45,
        )
        self.drawer = mp.solutions.drawing_utils
        self.drawing_styles = mp.solutions.drawing_styles
        self.active_gesture = NONE
        self.candidate_gesture = NONE
        self.candidate_started = time.monotonic()
        self.previous_frame_time = time.monotonic()
        self.previous_palm_y = None
        self.palm_velocity_y = 0.0
        self.previous_scoop_y = None
        self.scoop_velocity_y = 0.0
        self.index_tip = None
        self.scoop_points = None
        self.hand_height = None
        self.four_ready = True
        self.last_preview = None

    def close(self) -> None:
        if self.cap:
            self.cap.release()
        self.hands.close()
        cv2.destroyAllWindows()

    def read(self) -> dict:
        self.index_tip = None
        self.scoop_points = None
        raw_gesture = NONE
        now = time.monotonic()
        frame_dt = max(now - self.previous_frame_time, 1 / FPS)
        self.previous_frame_time = now

        if not self.camera_ok:
            return self._state(raw_gesture)

        ok, frame = self.cap.read()
        if not ok:
            return self._state(raw_gesture)

        frame = cv2.flip(frame, 1)
        results = self.hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        if results.multi_hand_landmarks:
            hands_data = []
            for hand_landmarks, handedness in zip(results.multi_hand_landmarks, results.multi_handedness):
                label = handedness.classification[0].label
                raised_fingers = self.raised_finger_names(hand_landmarks, label)
                fingers = len(raised_fingers)
                wrist = hand_landmarks.landmark[0]
                index = hand_landmarks.landmark[8]
                center_x = sum(point.x for point in hand_landmarks.landmark) / len(hand_landmarks.landmark)
                center_y = sum(point.y for point in hand_landmarks.landmark) / len(hand_landmarks.landmark)
                hands_data.append(
                    {
                        "landmarks": hand_landmarks,
                        "fingers": fingers,
                        "raised_fingers": raised_fingers,
                        "wrist_y": wrist.y,
                        "index_tip": (index.x * self.width, index.y * self.height),
                        "center": (center_x * self.width, center_y * self.height),
                    }
                )
                self.drawer.draw_landmarks(
                    frame,
                    hand_landmarks,
                    mp.solutions.hands.HAND_CONNECTIONS,
                    self.drawing_styles.get_default_hand_landmarks_style(),
                    self.drawing_styles.get_default_hand_connections_style(),
                )
                self.draw_numbered_landmarks(frame, hand_landmarks)

            hands_data.sort(key=lambda item: item["center"][0])
            primary = hands_data[0]
            raw_gesture = self._gesture_from_raised(primary["raised_fingers"])
            self.hand_height = primary["wrist_y"]
            self.index_tip = primary["index_tip"]

            if len(hands_data) >= 2:
                raw_gesture = TWO_HAND_SCOOP
                self.scoop_points = (hands_data[0]["center"], hands_data[1]["center"])
                scoop_y = (hands_data[0]["center"][1] + hands_data[1]["center"][1]) / 2 / self.height
                if self.previous_scoop_y is not None:
                    self.scoop_velocity_y = (scoop_y - self.previous_scoop_y) / frame_dt
                self.previous_scoop_y = scoop_y
            else:
                self.previous_scoop_y = None
                self.scoop_velocity_y = 0.0

            palm_y = primary["wrist_y"]
            if self.previous_palm_y is not None:
                self.palm_velocity_y = (palm_y - self.previous_palm_y) / frame_dt
            self.previous_palm_y = palm_y
        else:
            self.previous_palm_y = None
            self.previous_scoop_y = None
            self.palm_velocity_y = 0.0
            self.scoop_velocity_y = 0.0
            self.hand_height = None

        self._stabilize(raw_gesture, now)
        preview = cv2.resize(frame, (520, 360))
        cv2.putText(
            preview,
            "21-point MediaPipe hand graph",
            (10, 24),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.58,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )
        cv2.imshow(self.hand_window_name, preview)
        return self._state(raw_gesture)

    def _state(self, raw_gesture: str) -> dict:
        return {
            "gesture": self.active_gesture,
            "raw_gesture": raw_gesture,
            "index_tip": self.index_tip,
            "scoop_points": self.scoop_points,
            "palm_velocity_y": self.palm_velocity_y,
            "scoop_velocity_y": self.scoop_velocity_y,
            "hand_height": self.hand_height,
        }

    def _stabilize(self, raw_gesture: str, now: float) -> None:
        if raw_gesture != self.candidate_gesture:
            self.candidate_gesture = raw_gesture
            self.candidate_started = now
            return
        if now - self.candidate_started >= 0.08:
            self.active_gesture = raw_gesture

    @staticmethod
    def _gesture_from_count(count: int) -> str:
        return {
            0: FIST,
            1: ONE_FINGER,
            2: TWO_FINGERS,
            3: THREE_FINGERS,
            4: FOUR_FINGERS,
            5: FIVE_FINGERS,
        }.get(count, NONE)

    @staticmethod
    def _gesture_from_raised(raised_fingers: set[str]) -> str:
        if not raised_fingers:
            return FIST
        if raised_fingers == {"index"}:
            return ONE_FINGER
        if raised_fingers == {"middle"}:
            return MIDDLE_FINGER
        if raised_fingers == {"index", "middle"}:
            return TWO_FINGERS
        return HandController._gesture_from_count(len(raised_fingers))

    @staticmethod
    def count_fingers(hand_landmarks, handedness_label: str) -> int:
        return len(HandController.raised_finger_names(hand_landmarks, handedness_label))

    @staticmethod
    def raised_finger_names(hand_landmarks, handedness_label: str) -> set[str]:
        landmarks = hand_landmarks.landmark
        fingers = set()
        sensitivity_margin = 0.025
        for name, tip, pip in [("index", 8, 6), ("middle", 12, 10), ("ring", 16, 14), ("pinky", 20, 18)]:
            if landmarks[tip].y < landmarks[pip].y + sensitivity_margin:
                fingers.add(name)

        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        if handedness_label == "Right":
            thumb_open = thumb_tip.x < thumb_ip.x + sensitivity_margin
        else:
            thumb_open = thumb_tip.x > thumb_ip.x - sensitivity_margin
        if thumb_open:
            fingers.add("thumb")
        return fingers

    @staticmethod
    def draw_numbered_landmarks(frame: np.ndarray, hand_landmarks) -> None:
        frame_height, frame_width = frame.shape[:2]
        for index, landmark in enumerate(hand_landmarks.landmark):
            x = int(landmark.x * frame_width)
            y = int(landmark.y * frame_height)
            cv2.circle(frame, (x, y), 5, (0, 255, 255), -1, lineType=cv2.LINE_AA)
            cv2.putText(
                frame,
                str(index),
                (x + 6, y - 6),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.38,
                (255, 255, 255),
                1,
                cv2.LINE_AA,
            )


def count_fingers(hand_landmarks, handedness_label: str = "Right") -> int:
    return HandController.count_fingers(hand_landmarks, handedness_label)


def draw_hud(
    canvas: np.ndarray,
    gesture: str,
    mode: str,
    palette_name: str,
    fps: float,
    camera_ok: bool,
) -> None:
    lines = [
        f"GESTURE: {gesture}",
        f"MODE: {mode}",
        f"COLOR: {palette_name}",
        f"FPS: {fps:0.0f}",
        "Camera: ON" if camera_ok else "Camera: OFF - use keyboard",
        "0 pack | 1 ball | 2 V shape | M angry face | 3 storm | 4 color | 5 disperse | 6 scoop",
    ]
    for row, line in enumerate(lines):
        color = (246, 241, 232) if row < 4 else (186, 174, 154)
        cv2.putText(canvas, line, (18, 30 + row * 27), cv2.FONT_HERSHEY_SIMPLEX, 0.62, color, 2, cv2.LINE_AA)


def run_self_test() -> None:
    sim = SandSimulation(WIDTH, HEIGHT, PARTICLE_COUNT)
    assert len(sim.particles) >= 3000
    assert HandController._gesture_from_count(0) == FIST
    assert HandController._gesture_from_count(1) == ONE_FINGER
    assert HandController._gesture_from_count(5) == FIVE_FINGERS
    assert HandController._gesture_from_raised({"index"}) == ONE_FINGER
    assert HandController._gesture_from_raised({"middle"}) == MIDDLE_FINGER
    assert HandController._gesture_from_raised({"index", "middle"}) == TWO_FINGERS
    print("Self-test passed")
    print(f"Particles: {len(sim.particles)}")
    print(f"OpenCV: {cv2.__version__}")
    print(f"MediaPipe: {mp.__version__}")


def main() -> None:
    parser = argparse.ArgumentParser(description="MediaPipe hand-controlled sand simulation")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--camera", type=int, default=0)
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    window_name = "MediaPipe Sand Simulation"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(window_name, WIDTH, HEIGHT)
    cv2.moveWindow(window_name, 580, 90)
    sim = SandSimulation(WIDTH, HEIGHT, PARTICLE_COUNT)
    hand = HandController(args.camera, WIDTH, HEIGHT)
    running = True
    keyboard_mode = NONE
    previous_time = time.monotonic()
    fps_average = FPS

    while running:
        now = time.monotonic()
        dt = min(now - previous_time, 1 / 28)
        previous_time = now
        if dt > 0:
            fps_average = fps_average * 0.9 + (1 / dt) * 0.1
        state = hand.read()
        gesture = state["gesture"]

        active = keyboard_mode if keyboard_mode != NONE else gesture
        if state["raw_gesture"] == TWO_HAND_SCOOP and state["scoop_points"] is not None:
            active = TWO_HAND_SCOOP

        if active == FIST:
            sim.pack_heap(dt)
        elif active == TWO_HAND_SCOOP:
            if state["scoop_points"] is not None:
                left_hand, right_hand = state["scoop_points"]
            else:
                left_hand = (WIDTH / 2 - 110, HEIGHT / 2 + 35)
                right_hand = (WIDTH / 2 + 110, HEIGHT / 2 + 35)
            lift_power = max(0.0, -state["scoop_velocity_y"])
            if keyboard_mode == TWO_HAND_SCOOP:
                lift_power = 1.0
            sim.scoop(left_hand, right_hand, lift_power, dt)
        elif active == ONE_FINGER:
            sim.condense_ball(dt)
        elif active == MIDDLE_FINGER:
            sim.form_angry_face(dt)
        elif active == TWO_FINGERS:
            sim.form_v_shape(dt)
        elif active == THREE_FINGERS:
            sim.sandstorm(state["hand_height"], dt)
        elif active == FOUR_FINGERS:
            if hand.four_ready:
                sim.change_color()
                hand.four_ready = False
        elif active == FIVE_FINGERS:
            upward = state["palm_velocity_y"] < -0.22
            if upward:
                power = min(max(abs(state["palm_velocity_y"]) * 1.65, 0.75), 3.0)
                sim.disperse(power)
        else:
            sim.mode = MODE_IDLE

        if active != FOUR_FINGERS:
            hand.four_ready = True

        sim.update(dt)

        canvas = np.full((HEIGHT, WIDTH, 3), (18, 12, 6), dtype=np.uint8)
        canvas[FLOOR_Y + 2 :, :] = (29, 21, 15)
        cv2.line(canvas, (0, FLOOR_Y + 1), (WIDTH, FLOOR_Y + 1), (60, 50, 38), 2, lineType=cv2.LINE_AA)
        sim.draw(canvas)

        draw_hud(canvas, active, sim.mode, sim.palette_name, fps_average, hand.camera_ok)
        cv2.imshow(window_name, canvas)
        key = cv2.waitKey(1) & 0xFF
        if key in {ord("q"), 27}:
            running = False
        elif key == ord("r"):
            sim.reset_heap()
            keyboard_mode = NONE
        elif key == ord("0"):
            keyboard_mode = FIST
        elif key == ord("1"):
            keyboard_mode = ONE_FINGER
        elif key == ord("2"):
            keyboard_mode = TWO_FINGERS
        elif key == ord("m"):
            keyboard_mode = MIDDLE_FINGER
        elif key == ord("3"):
            keyboard_mode = THREE_FINGERS
        elif key == ord("4"):
            sim.change_color()
        elif key == ord("5"):
            sim.disperse(1.25)
        elif key == ord("6"):
            keyboard_mode = TWO_HAND_SCOOP
        elif key == ord(" "):
            keyboard_mode = NONE

    hand.close()


if __name__ == "__main__":
    main()
