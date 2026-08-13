# MediaPipe Hand-Controlled Sand Simulation

Interactive real-time sand simulation controlled by MediaPipe webcam hand gestures and displayed with OpenCV.

## Gestures

- Fist: form an angry face.
- One finger: condense the sand into a ball.
- Two fingers: form a sharp V shape.
- Three fingers: sandstorm swirl.
- Four fingers: change sand color once per gesture.
- Five fingers moving upward: disperse/explode sand upward and outward.
- Two open hands: scoop and lift the sand between your hands; some sand leaks out through the gap.

## Keyboard Debug Controls

- `0`: pack the sand back into a mound
- `1`: ball mode
- `2`: V-shape mode
- `3`: sandstorm
- `4`: change color
- `5`: disperse
- `6`: test scoop in the center of the screen
- `Space`: return to live hand control
- `R`: reset heap
- `Q` or `Esc`: quit

## Run

```bash
python3.12 sand_simulation.py
```

If macOS asks for camera permission, allow Terminal or VS Code to use the camera.
