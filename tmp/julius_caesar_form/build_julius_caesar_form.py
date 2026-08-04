from pathlib import Path
import re
import textwrap

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfbase.acroform import AcroForm
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "tmp" / "julius_caesar_form" / "source.txt"
OUTPUT = ROOT / "output" / "pdf" / "Julius_Caesar_Study_Guide_Form.pdf"

PAGE_W, PAGE_H = letter
MARGIN_X = 54
TOP = PAGE_H - 54
BOTTOM = 54
INK = colors.HexColor("#102a43")
BODY = colors.HexColor("#243b53")
MUTED = colors.HexColor("#5f6f7f")
GOLD = colors.HexColor("#d4af37")
PAPER = colors.HexColor("#f7f3eb")
LINE = colors.HexColor("#d9c9a7")


def clean(text: str) -> str:
    replacements = {
        "\u2018": "'",
        "\u2019": "'",
        "\u201c": '"',
        "\u201d": '"',
        "\u2013": "-",
        "\u2014": "-",
        "\xa0": " ",
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return re.sub(r"\s+", " ", text).strip()


def parse_source():
    raw = SOURCE.read_text(errors="ignore")
    student = raw.split("ANSWER KEY:")[0]
    lines = [clean(line) for line in student.splitlines()]

    characters = []
    for line in lines:
        if line.startswith("Julius Caesar Short Answer"):
            break
        match = re.match(r"^(.+?)\s*-\s*$", line)
        if match:
            characters.append(match.group(1))

    acts = {}
    current_act = None
    current_question = None
    for line in lines:
        if line in {"Act I", "Act II", "Act III", "Act IV", "Act V"}:
            current_act = line
            acts[current_act] = []
            current_question = None
            continue
        if not current_act or not line or line.startswith("Julius Caesar Short Answer"):
            continue
        match = re.match(r"^(\d+)\.\s*(.*)$", line)
        if match:
            current_question = [int(match.group(1)), match.group(2)]
            acts[current_act].append(current_question)
        elif current_question:
            current_question[1] = clean(current_question[1] + " " + line)

    return characters, acts


class FormBuilder:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.c = canvas.Canvas(str(path), pagesize=letter)
        self.c.setTitle("Julius Caesar Study Guide Form")
        self.page_num = 0
        self.y = TOP

    def new_page(self, title=None):
        if self.page_num:
            self.footer()
            self.c.showPage()
        self.page_num += 1
        self.c.setFillColor(colors.white)
        self.c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        self.c.setFillColor(PAPER)
        self.c.rect(0, PAGE_H - 30, PAGE_W, 30, stroke=0, fill=1)
        self.c.setFillColor(INK)
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(MARGIN_X, PAGE_H - 20, "The Tragedy of Julius Caesar - Study Guide Form")
        if title:
            self.y = PAGE_H - 62
            self.section_title(title)
        else:
            self.y = TOP

    def footer(self):
        self.c.setStrokeColor(LINE)
        self.c.line(MARGIN_X, 36, PAGE_W - MARGIN_X, 36)
        self.c.setFillColor(MUTED)
        self.c.setFont("Helvetica", 8)
        self.c.drawRightString(PAGE_W - MARGIN_X, 24, f"Page {self.page_num}")

    def ensure(self, height, title=None):
        if self.y - height < BOTTOM:
            self.new_page(title)

    def section_title(self, text):
        self.c.setFillColor(INK)
        self.c.setFont("Helvetica-Bold", 18)
        self.c.drawString(MARGIN_X, self.y, text)
        self.c.setStrokeColor(GOLD)
        self.c.setLineWidth(3)
        self.c.line(MARGIN_X, self.y - 8, MARGIN_X + 120, self.y - 8)
        self.y -= 32

    def paragraph(self, text, width=86, size=10, leading=14):
        self.c.setFillColor(BODY)
        self.c.setFont("Helvetica", size)
        for line in textwrap.wrap(text, width=width):
            self.c.drawString(MARGIN_X, self.y, line)
            self.y -= leading
        self.y -= 4

    def label_field(self, label, name, x, y, w, h, font_size=9, multiline=False):
        self.c.setFillColor(INK)
        self.c.setFont("Helvetica-Bold", 9)
        self.c.drawString(x, y + h + 4, label)
        flags = "multiline" if multiline else ""
        self.c.acroForm.textfield(
            name=name,
            tooltip=label,
            x=x,
            y=y,
            width=w,
            height=h,
            borderWidth=1,
            borderColor=LINE,
            fillColor=colors.white,
            textColor=BODY,
            forceBorder=True,
            fontName="Helvetica",
            fontSize=font_size,
            fieldFlags=flags,
            maxlen=3000,
        )

    def cover(self):
        self.new_page()
        self.c.setFillColor(INK)
        self.c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        self.c.setFillColor(GOLD)
        self.c.rect(MARGIN_X, PAGE_H - 190, 120, 6, stroke=0, fill=1)
        self.c.setFillColor(colors.white)
        self.c.setFont("Helvetica-Bold", 30)
        self.c.drawString(MARGIN_X, PAGE_H - 150, "Julius Caesar")
        self.c.setFont("Helvetica-Bold", 22)
        self.c.drawString(MARGIN_X, PAGE_H - 184, "Study Guide Form")
        self.c.setFillColor(colors.HexColor("#e5e7eb"))
        self.c.setFont("Helvetica", 13)
        self.c.drawString(MARGIN_X, PAGE_H - 220, "Short-answer questions organized by character notes and act.")

        field_y = PAGE_H - 330
        self.label_field("Student Name", "student_name", MARGIN_X, field_y, 260, 24)
        self.label_field("Date", "date", MARGIN_X + 290, field_y, 140, 24)
        self.label_field("Class / Period", "class_period", MARGIN_X, field_y - 58, 260, 24)
        self.label_field("Teacher", "teacher", MARGIN_X + 290, field_y - 58, 140, 24)

        self.c.setFillColor(colors.HexColor("#e5e7eb"))
        self.c.setFont("Helvetica", 10)
        self.c.drawString(MARGIN_X, 70, "Answer key removed. Use the fields to type responses or print and write by hand.")

    def character_page(self, characters):
        self.new_page("Character Notes")
        self.paragraph("Use this section to record each character's role in the play.", width=85)
        col_w = (PAGE_W - 2 * MARGIN_X - 24) / 2
        row_h = 42
        left_x = MARGIN_X
        right_x = MARGIN_X + col_w + 24
        start_y = self.y
        for idx, character in enumerate(characters):
            col = idx % 2
            row = idx // 2
            x = left_x if col == 0 else right_x
            y = start_y - row * row_h - 24
            if y < BOTTOM:
                self.new_page("Character Notes")
                start_y = self.y
                row = 0
                y = start_y - 24
            self.c.setFillColor(INK)
            self.c.setFont("Helvetica-Bold", 9)
            self.c.drawString(x, y + 17, f"{character} -")
            field_x = x + 104
            self.c.acroForm.textfield(
                name=f"char_{idx+1}",
                tooltip=f"{character} role",
                x=field_x,
                y=y + 9,
                width=col_w - 104,
                height=20,
                borderWidth=1,
                borderColor=LINE,
                fillColor=colors.white,
                textColor=BODY,
                forceBorder=True,
                fontName="Helvetica",
                fontSize=8,
                maxlen=300,
            )
        self.y = BOTTOM

    def question(self, act, number, text):
        wrapped = textwrap.wrap(text, width=90)
        q_h = len(wrapped) * 12 + 68
        self.ensure(q_h, act)
        self.c.setFillColor(INK)
        self.c.setFont("Helvetica-Bold", 10)
        self.c.drawString(MARGIN_X, self.y, f"{number}.")
        self.c.setFont("Helvetica", 10)
        qx = MARGIN_X + 22
        line_y = self.y
        for line in wrapped:
            self.c.drawString(qx, line_y, line)
            line_y -= 12
        self.y = line_y - 4
        self.c.acroForm.textfield(
            name=f"{act.lower().replace(' ', '_')}_q{number}",
            tooltip=f"{act} Question {number}",
            x=MARGIN_X,
            y=self.y - 48,
            width=PAGE_W - 2 * MARGIN_X,
            height=46,
            borderWidth=1,
            borderColor=LINE,
            fillColor=colors.white,
            textColor=BODY,
            forceBorder=True,
            fontName="Helvetica",
            fontSize=9,
            fieldFlags="multiline",
            maxlen=2000,
        )
        self.y -= 66

    def act_questions(self, acts):
        for act, questions in acts.items():
            self.new_page(act)
            for number, text in questions:
                self.question(act, number, text)

    def save(self):
        self.footer()
        self.c.save()


def main():
    characters, acts = parse_source()
    builder = FormBuilder(OUTPUT)
    builder.cover()
    builder.character_page(characters)
    builder.act_questions(acts)
    builder.save()
    print(f"Wrote {OUTPUT}")
    print(f"Characters: {len(characters)}")
    print(f"Questions: {sum(len(qs) for qs in acts.values())}")


if __name__ == "__main__":
    main()
