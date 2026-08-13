import argparse
import importlib.util
import math
import os
import random
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path

PROJECT_DIR = Path(__file__).resolve().parent
os.environ.setdefault("MPLCONFIGDIR", str(PROJECT_DIR / ".cache" / "matplotlib"))
(PROJECT_DIR / ".cache" / "matplotlib").mkdir(parents=True, exist_ok=True)


def ensure_python312_modules() -> None:
    required = ["cv2", "mediapipe", "pygame", "numpy"]
    missing = [name for name in required if importlib.util.find_spec(name) is None]
    is_python312 = sys.version_info[:2] == (3, 12)
    if is_python312 and not missing:
        return

    python312 = shutil.which("python3.12") or "/Library/Frameworks/Python.framework/Versions/3.12/bin/python3.12"
    if Path(python312).exists() and Path(python312).resolve() != Path(sys.executable).resolve():
        os.execv(python312, [python312, str(Path(__file__).resolve()), *sys.argv[1:]])

    raise ModuleNotFoundError("Run this game with: python3.12 gesture_dino_game.py")


ensure_python312_modules()

import cv2
import mediapipe as mp
import numpy as np
import pygame


WIDTH = 1000
HEIGHT = 520
GROUND_Y = 410
FPS = 60


@dataclass
class Dino:
    x: float = 116
    y: float = GROUND_Y
    vy: float = 0.0
    width: int = 50
    height: int = 70
    crouching: bool = False

    @property
    def rect(self) -> pygame.Rect:
        height = 42 if self.crouching else self.height
        width = 72 if self.crouching else self.width
        return pygame.Rect(int(self.x), int(self.y - height), width, height)

    def jump(self) -> None:
        if self.on_ground:
            self.vy = -17.5

    @property
    def on_ground(self) -> bool:
        return self.y >= GROUND_Y - 0.1

    def update(self) -> None:
        self.vy += 0.86
        self.y += self.vy
        if self.y >= GROUND_Y:
            self.y = GROUND_Y
            self.vy = 0


@dataclass
class Obstacle:
    x: float
    kind: str
    width: int
    height: int

    @property
    def rect(self) -> pygame.Rect:
        if self.kind == "bird":
            return pygame.Rect(int(self.x), GROUND_Y - 118, self.width, self.height)
        return pygame.Rect(int(self.x), GROUND_Y - self.height, self.width, self.height)

    def update(self, speed: float) -> None:
        self.x -= speed


class FingerTracker:
    def __init__(self, camera_index: int) -> None:
        self.cap = cv2.VideoCapture(camera_index)
        self.hands = mp.solutions.hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.65,
            min_tracking_confidence=0.65,
        )
        self.previous_y = None
        self.command = "none"
        self.finger_count = None
        self.camera_ok = self.cap.isOpened()
        self.last_frame = None

    def close(self) -> None:
        if self.cap:
            self.cap.release()
        self.hands.close()

    def update(self) -> str:
        self.command = "none"
        self.finger_count = None
        if not self.camera_ok:
            return self.command

        ok, frame = self.cap.read()
        if not ok:
            return self.command

        frame = cv2.flip(frame, 1)
        self.last_frame = frame
        results = self.hands.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        if not results.multi_hand_landmarks:
            self.previous_y = None
            return self.command

        landmarks = results.multi_hand_landmarks[0].landmark
        self.finger_count = self.count_fingers(landmarks, results.multi_handedness[0].classification[0].label)
        index_tip_y = landmarks[8].y

        if self.finger_count == 1 and self.previous_y is not None:
            movement = index_tip_y - self.previous_y
            if movement < -0.035:
                self.command = "jump"
            elif movement > 0.035:
                self.command = "crouch"
            elif index_tip_y > 0.62:
                self.command = "crouch"

        self.previous_y = index_tip_y
        return self.command

    @staticmethod
    def count_fingers(landmarks, handedness_label: str) -> int:
        fingers = 0
        for tip, pip in [(8, 6), (12, 10), (16, 14), (20, 18)]:
            if landmarks[tip].y < landmarks[pip].y:
                fingers += 1

        thumb_tip = landmarks[4]
        thumb_ip = landmarks[3]
        thumb_open = thumb_tip.x < thumb_ip.x if handedness_label == "Right" else thumb_tip.x > thumb_ip.x
        return fingers + int(thumb_open)


def draw_dino(screen: pygame.Surface, dino: Dino, tick: int) -> None:
    rect = dino.rect
    color = (38, 48, 58)
    accent = (34, 154, 104)
    pygame.draw.rect(screen, color, rect, border_radius=8)
    pygame.draw.circle(screen, color, (rect.right - 8, rect.top + 12), 18)
    pygame.draw.circle(screen, (255, 255, 255), (rect.right - 2, rect.top + 6), 4)
    pygame.draw.circle(screen, (5, 14, 20), (rect.right - 1, rect.top + 6), 2)
    pygame.draw.polygon(screen, color, [(rect.left + 8, rect.bottom - 8), (rect.left - 26, rect.bottom - 22), (rect.left + 6, rect.bottom - 24)])

    if dino.crouching:
        pygame.draw.line(screen, accent, (rect.left + 12, rect.bottom), (rect.left + 45, rect.bottom + 12), 5)
        pygame.draw.line(screen, accent, (rect.left + 52, rect.bottom), (rect.left + 78, rect.bottom + 10), 5)
    else:
        step = 8 if (tick // 8) % 2 == 0 else -8
        pygame.draw.line(screen, accent, (rect.left + 14, rect.bottom), (rect.left + 14 + step, rect.bottom + 17), 5)
        pygame.draw.line(screen, accent, (rect.left + 35, rect.bottom), (rect.left + 35 - step, rect.bottom + 17), 5)


def draw_obstacle(screen: pygame.Surface, obstacle: Obstacle) -> None:
    rect = obstacle.rect
    if obstacle.kind == "bird":
        pygame.draw.ellipse(screen, (45, 56, 68), rect)
        pygame.draw.polygon(screen, (45, 56, 68), [(rect.left + 12, rect.centery), (rect.left - 22, rect.centery - 18), (rect.left + 18, rect.centery - 6)])
        pygame.draw.polygon(screen, (45, 56, 68), [(rect.right - 12, rect.centery), (rect.right + 26, rect.centery - 18), (rect.right - 18, rect.centery - 6)])
    else:
        pygame.draw.rect(screen, (40, 120, 72), rect, border_radius=4)
        pygame.draw.rect(screen, (40, 120, 72), (rect.left - 12, rect.top + 24, 14, 32), border_radius=4)
        pygame.draw.rect(screen, (40, 120, 72), (rect.right - 2, rect.top + 14, 13, 26), border_radius=4)


def spawn_obstacle(score: int) -> Obstacle:
    if score > 250 and random.random() < 0.28:
        return Obstacle(WIDTH + 40, "bird", 58, 32)
    width = random.choice([30, 36, 44])
    height = random.choice([52, 64, 76])
    return Obstacle(WIDTH + 40, "cactus", width, height)


def draw_hud(screen: pygame.Surface, font: pygame.font.Font, score: int, command: str, finger_count: int | None, camera_ok: bool) -> None:
    screen.blit(font.render(f"Score {score}", True, (45, 56, 68)), (WIDTH - 170, 26))
    gesture = "camera off" if not camera_ok else f"fingers {finger_count if finger_count is not None else '-'} | {command}"
    screen.blit(font.render(gesture, True, (45, 56, 68)), (24, 24))
    screen.blit(font.render("One finger up = jump | one finger down = crouch", True, (90, 100, 110)), (24, HEIGHT - 34))


def run_self_test() -> None:
    dino = Dino()
    obstacle = spawn_obstacle(0)
    assert dino.rect.width > 0
    assert obstacle.rect.width > 0
    print("Self-test passed")
    print(f"Pygame: {pygame.version.ver}")
    print(f"OpenCV: {cv2.__version__}")
    print(f"MediaPipe: {mp.__version__}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Gesture controlled dinosaur runner")
    parser.add_argument("--self-test", action="store_true")
    parser.add_argument("--camera", type=int, default=0)
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Gesture Dino Runner")
    clock = pygame.time.Clock()
    font = pygame.font.SysFont("Arial", 24, bold=True)
    big_font = pygame.font.SysFont("Arial", 54, bold=True)
    tracker = FingerTracker(args.camera)

    dino = Dino()
    obstacles = [spawn_obstacle(0)]
    speed = 7.0
    score = 0
    tick = 0
    game_over = False
    running = True

    while running:
        command = tracker.update()
        keys = pygame.key.get_pressed()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_r and game_over:
                    dino = Dino()
                    obstacles = [spawn_obstacle(0)]
                    speed = 7.0
                    score = 0
                    game_over = False

        if not game_over:
            dino.crouching = command == "crouch" or keys[pygame.K_DOWN]
            if command == "jump" or keys[pygame.K_SPACE]:
                dino.jump()

            dino.update()
            for obstacle in obstacles:
                obstacle.update(speed)
            if obstacles[-1].x < WIDTH - random.randint(260, 410):
                obstacles.append(spawn_obstacle(score))
            obstacles = [obstacle for obstacle in obstacles if obstacle.x > -100]

            for obstacle in obstacles:
                if dino.rect.colliderect(obstacle.rect.inflate(-8, -8)):
                    game_over = True

            speed += 0.002
            score += 1
            tick += 1

        screen.fill((247, 250, 252))
        pygame.draw.line(screen, (80, 90, 98), (0, GROUND_Y + 1), (WIDTH, GROUND_Y + 1), 3)
        for x in range(0, WIDTH, 38):
            pygame.draw.line(screen, (205, 213, 220), (x - tick % 38, GROUND_Y + 20), (x + 16 - tick % 38, GROUND_Y + 20), 2)

        draw_dino(screen, dino, tick)
        for obstacle in obstacles:
            draw_obstacle(screen, obstacle)
        draw_hud(screen, font, score, command, tracker.finger_count, tracker.camera_ok)

        if game_over:
            text = big_font.render("GAME OVER", True, (45, 56, 68))
            hint = font.render("Press R to restart or Esc to quit", True, (90, 100, 110))
            screen.blit(text, text.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 34)))
            screen.blit(hint, hint.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 24)))

        pygame.display.flip()
        clock.tick(FPS)

    tracker.close()
    pygame.quit()


if __name__ == "__main__":
    main()
