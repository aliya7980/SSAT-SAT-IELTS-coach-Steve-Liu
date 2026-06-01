import fs from "node:fs/promises";
import path from "node:path";
import {
  Presentation,
  PresentationFile,
  stroke,
} from "/Users/shililiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const workspace = "/Users/shililiu/Desktop/GitHubSite/SSAT-SAT-IELTS-coach-Steve-Liu/outputs/manual-20260530-command-evidence/presentations/command-of-evidence-textual";
const previewDir = path.join(workspace, "preview");
const layoutDir = path.join(workspace, "layout");
const outDir = path.join(workspace, "output");
const finalPptx = path.join(outDir, "command-of-evidence-textual-blackboard.pptx");

const W = 1280;
const H = 720;
const C = {
  board: "#183B2B",
  board2: "#10291F",
  chalk: "#F5F0DD",
  chalkDim: "#D9DFC8",
  yellow: "#F2D46B",
  mint: "#9FE3B4",
  blue: "#A9D8FF",
  red: "#F29B91",
  dust: "#FFFFFF22",
  rail: "#0A1712",
};

const PRACTICE = [
  {
    title: "Practice 1: Controlled Fear",
    prompt: [
      "A researcher conducted an experiment inspired by studies suggesting that people may benefit from feeling frightened in controlled circumstances, such as scary movies or haunted attractions. Participants walked through a local haunted house and then completed a survey. Based on the responses, the researcher claims that feeling frightened in controlled situations can boost a person's mood and confidence.",
      "Which quotation from a participant would best illustrate the researcher's claim?",
    ],
    choices: [
      ["A", "\"My friends kept laughing as we were walking through the haunted house.\""],
      ["B", "\"The haunted house was scary at first, but I knew everyone was just acting, so I felt less scared after a few minutes.\""],
      ["C", "\"The sense of relief I felt at the end of the haunted house was similar to the feelings I have when I finish a scary movie.\""],
      ["D", "\"After I came out of the haunted house, I felt very accomplished and less stressed.\""],
    ],
    answer: "D",
  },
  {
    title: "Practice 2: Literary Evidence",
    prompt: [
      "\"The Rock and the Sea\" is an 1893 poem by Charlotte Perkins Gilman. In the poem, a rock is portrayed as intending to confront and restrain the sea: ______",
      "Which quotation from \"The Rock and the Sea\" most effectively illustrates the claim?",
    ],
    choices: [
      ["A", "\"I am the Rock. Black midnight falls; / The terrible breakers rise like walls; / With curling lips and gleaming teeth / They plunge and tear at my bones beneath.\""],
      ["B", "\"I am the Sea. The earth I sway; / Granite to me is potter's clay; / Under the touch of my careless waves / It rises in turrets and sinks in caves.\""],
      ["C", "\"I am the Sea. I hold the land / As one holds an apple in his hand, / Hold it fast with sleepless eyes, / Watching the continents sink and rise.\""],
      ["D", "\"I am the Rock, presumptuous Sea! / I am set to encounter thee. / Angry and loud or gentle and still, / I am set here to limit thy power, and I will!\""],
    ],
    answer: "D",
  },
  {
    title: "Practice 3: Gidra",
    prompt: [
      "As a monthly newsletter formed in 1969 by Asian American students at UCLA, Gidra helped raise awareness about social and political issues concerning the Asian American community on campus and beyond. Around 4,000 copies were published each month. A student hypothesizes that Gidra's influence cannot be measured by the number of newsletters published monthly alone.",
      "Which finding, if true, would most directly support the student's hypothesis?",
    ],
    choices: [
      ["A", "The students who initially formed Gidra each contributed financially to its creation."],
      ["B", "Gidra was initially based out of the Asian American Studies Center at UCLA."],
      ["C", "People would often give their copies of Gidra to others once they had finished reading an issue."],
      ["D", "In addition to covering current events, Gidra also featured works of art and literature."],
    ],
    answer: "C",
  },
  {
    title: "Practice 4: Spring",
    prompt: [
      "In her 1921 poem \"Spring,\" Edna St. Vincent Millay subverts conventional depictions of springtime. Instead of celebrating growth and renewal, Millay disputes the merit of the season entirely: ______",
      "Which quotation from \"Spring\" most effectively illustrates the claim?",
    ],
    choices: [
      ["A", "\"The sun is hot on my neck as I observe / The spikes of the crocus.\""],
      ["B", "\"The smell of the earth is good. / It is apparent that there is no death.\""],
      ["C", "\"To what purpose, April, do you return again? / Beauty is not enough.\""],
      ["D", "\"Life in itself / Is nothing, / An empty cup, a flight of uncarpeted stairs.\""],
    ],
    answer: "C",
  },
];

const EXTRA_PRACTICE = [
  {
    title: "Extra Practice 1: Spinosaurus",
    prompt: [
      "Jan Gimsa, Robert Sleigh, and Ulrike Gimsa have hypothesized that the sail-like structure running down the back of the dinosaur Spinosaurus aegyptiacus improved the animal's success in underwater pursuits of prey species capable of making quick, evasive movements. To evaluate their hypothesis, a second team of researchers constructed two battery-powered mechanical models of S. aegyptiacus, one with a sail and one without, and subjected the models to a series of identical tests in a water-filled tank.",
      "Which finding from the model tests, if true, would most strongly support Gimsa and colleagues' hypothesis?",
    ],
    choices: [
      ["A", "The model with a sail took significantly longer to travel a specified distance while submerged than the model without a sail did."],
      ["B", "The model with a sail displaced significantly more water while submerged than the model without a sail did."],
      ["C", "The model with a sail had significantly less battery power remaining after completing the tests than the model without a sail did."],
      ["D", "The model with a sail took significantly less time to complete a sharp turn while submerged than the model without a sail did."],
    ],
    answer: "D",
  },
  {
    title: "Extra Practice 2: Cornelius Johnson",
    prompt: [
      "\"Mr. Cornelius Johnson, Office-Seeker\" is a 1900 short story by Paul Laurence Dunbar. In the story, the narrator describes Mr. Cornelius Johnson's appearance as conveying his exaggerated sense of his importance: ______",
      "Which quotation from \"Mr. Cornelius Johnson, Office-Seeker\" most effectively illustrates the claim?",
    ],
    choices: [
      ["A", "\"He carried himself always as if he were passing under his own triumphal arch.\""],
      ["B", "\"The grey Prince Albert was scrupulously buttoned about his form, and a shiny top hat replaced the felt of the afternoon.\""],
      ["C", "\"Mr. Cornelius Johnson always spoke in a large and important tone.\""],
      ["D", "\"It was a beautiful day in balmy May and the sun shone pleasantly on Mr. Cornelius Johnson's very spruce Prince Albert suit of grey as he alighted from the train in Washington.\""],
    ],
    answer: "A",
  },
  {
    title: "Extra Practice 3: Hedda Gabler",
    prompt: [
      "Hedda Gabler is an 1890 play by Henrik Ibsen. As a woman in the Victorian era, Hedda, the play's central character, is unable to freely determine her own future. Instead, she seeks to influence another person's fate, as is evident when she says to another character, ______",
      "Which quotation from a translation of Hedda Gabler most effectively illustrates the claim?",
    ],
    choices: [
      ["A", "\"Then what in heaven's name would you have me do with myself?\""],
      ["B", "\"I want for once in my life to have power to mold a human destiny.\""],
      ["C", "\"Then I, poor creature, have no sort of power over you?\""],
      ["D", "\"Faithful to your principles, now and for ever! Ah, that is how a man should be!\""],
    ],
    answer: "B",
  },
  {
    title: "Extra Practice 4: Black Beans",
    prompt: [
      "Black beans (Phaseolus vulgaris) are a nutritionally dense food, but they are difficult to digest in part because of their high levels of soluble fiber and compounds like raffinose. They also contain antinutrients like tannins and trypsin inhibitors, which interfere with the body's ability to extract nutrients from foods. In a research article, Marisela Granito and Glenda Alvarez from Simon Bolivar University in Venezuela claim that inducing fermentation of black beans using lactic acid bacteria improves the digestibility of the beans and makes them more nutritious.",
      "Which finding from Granito and Alvarez's research, if true, would most directly support their claim?",
    ],
    choices: [
      ["A", "When cooked, fermented beans contained significantly more trypsin inhibitors and tannins but significantly less soluble fiber and raffinose than nonfermented beans."],
      ["B", "Fermented beans contained significantly less soluble fiber and raffinose than nonfermented beans, and when cooked, the fermented beans also displayed a significant reduction in trypsin inhibitors and tannins."],
      ["C", "When the fermented beans were analyzed, they were found to contain two microorganisms, Lactobacillus casei and Lactobacillus plantarum, that are theorized to increase the amount of nitrogen absorbed by the gut after eating beans."],
      ["D", "Both fermented and nonfermented black beans contained significantly fewer trypsin inhibitors and tannins after being cooked at high pressure."],
    ],
    answer: "B",
  },
  {
    title: "Extra Practice 5: Ivo van Hove",
    prompt: [
      "Ivo van Hove is a theater director known for his modern reinterpretations of classic plays. To create a distinct dramatic effect, he tends to use simple-looking sets enhanced with subtle multimedia elements in his productions. Though these sets appear modest, they actually come from an expensive creative process that requires advanced technology and precise planning.",
      "Which quotation from an article about van Hove's plays, if true, would most effectively illustrate the underlined claim?",
    ],
    choices: [
      ["A", "\"For the set of his last play, van Hove used digital projection mapping, a costly technology that requires careful coordination among the set crew.\""],
      ["B", "\"Originally from Belgium, van Hove tends to hire other Belgians to work on his sets, believing that they are more likely to have similar tastes and ideas.\""],
      ["C", "\"When van Hove adapts classic plays for today's audiences, he often removes words and sayings that are no longer in use from the script so that his audience can more easily follow the dialogue.\""],
      ["D", "\"In his set design, van Hove deliberately uses colors that he believes pair well with the emotional tones of certain scenes.\""],
    ],
    answer: "A",
  },
];

function addRect(slide, x, y, w, h, fill, line = "none", radius = 0) {
  slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line === "none" ? { fill: { type: "none" }, width: 0 } : stroke(line),
    borderRadius: radius,
  });
}

function addText(slide, value, x, y, w, h, opts = {}) {
  const box = slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill: { type: "none" },
    line: { fill: { type: "none" }, width: 0 },
  });
  box.text.set(value);
  box.text.fontSize = opts.size ?? 26;
  box.text.color = opts.color ?? C.chalk;
  box.text.bold = opts.bold ?? false;
  box.text.typeface = opts.typeface ?? "Chalkboard";
  box.text.alignment = opts.align ?? "left";
  box.text.verticalAlignment = opts.valign ?? "top";
  box.text.insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return box;
}

function addLine(slide, x1, y1, x2, y2, color = C.chalkDim, width = 2) {
  addRect(
    slide,
    Math.min(x1, x2),
    Math.min(y1, y2) - width / 2,
    Math.abs(x2 - x1) || width,
    width,
    color,
  );
}

function board(slide, page, kicker = "COMMAND OF EVIDENCE") {
  addRect(slide, 0, 0, W, H, C.board);
  addRect(slide, 0, 0, W, H, "#00000000", `6 ${C.rail}`);
  addRect(slide, 0, 0, W, 18, C.rail);
  addRect(slide, 0, H - 24, W, 24, C.rail);
  for (let i = 0; i < 22; i += 1) {
    const x = 58 + ((i * 173) % 1160);
    const y = 58 + ((i * 97) % 568);
    addRect(slide, x, y, 2 + (i % 5), 1, C.dust);
  }
  addText(slide, kicker, 58, 42, 420, 24, { size: 15, color: C.chalkDim, bold: true });
  addText(slide, String(page).padStart(2, "0"), 1155, 650, 64, 32, { size: 22, color: C.chalkDim, bold: true, align: "right" });
}

function title(slide, main, sub) {
  addText(slide, main, 72, 95, 880, 120, { size: 54, bold: true, color: C.chalk });
  addLine(slide, 74, 230, 1030, 230, C.yellow, 3);
  addText(slide, sub, 76, 254, 900, 64, { size: 24, color: C.chalkDim });
}

function bullet(slide, x, y, text, color = C.mint, size = 24) {
  addText(slide, "•", x, y - 2, 22, 30, { size: size + 2, color, bold: true });
  addText(slide, text, x + 32, y, 840, 52, { size, color: C.chalk });
}

function card(slide, x, y, w, h, heading, body, color = C.mint) {
  addRect(slide, x, y, w, h, "#FFFFFF08", `2 ${color}`, 8);
  addText(slide, heading, x + 22, y + 18, w - 44, 30, { size: 24, color, bold: true });
  addText(slide, body, x + 22, y + 58, w - 44, h - 74, { size: 19, color: C.chalkDim });
}

function footer(slide) {
  addText(slide, "Adapted as a classroom summary from Khan Academy SAT Reading and Writing: Command of Evidence: Textual.", 58, 660, 880, 16, { size: 11, color: "#B8C7B4" });
}

function slide01(p) {
  const s = p.slides.add(); board(s, 1, "SAT READING & WRITING");
  title(s, "Command of Evidence:\nTextual", "How to choose the quote or finding that best supports a claim.");
  card(s, 76, 365, 320, 155, "The promise", "You do not need outside knowledge. The passage gives the claim; the choices give possible evidence.", C.mint);
  card(s, 440, 365, 320, 155, "The job", "Match the evidence to the exact claim, not to the general topic.", C.yellow);
  card(s, 804, 365, 320, 155, "The danger", "A choice can sound related but still miss the key idea.", C.red);
  footer(s); return s;
}

function slide02(p) {
  const s = p.slides.add(); board(s, 2);
  title(s, "What This Question Type Asks", "Find evidence that proves, supports, illustrates, or sometimes challenges a stated claim.");
  bullet(s, 110, 350, "First locate the claim: the hypothesis, interpretation, or argument.");
  bullet(s, 110, 410, "Then simplify the claim into a short test phrase.");
  bullet(s, 110, 470, "Finally choose the answer that directly matches the test phrase.");
  addText(s, "claim  ->  test phrase  ->  evidence", 175, 555, 820, 48, { size: 38, color: C.yellow, bold: true, align: "center" });
  footer(s); return s;
}

function slide03(p) {
  const s = p.slides.add(); board(s, 3);
  title(s, "Two Common Forms", "Same skill, different costume.");
  card(s, 90, 300, 500, 230, "Scientific / Social Science", "A researcher has a hypothesis. You choose the experimental result, survey quote, or observation that would support it.", C.blue);
  card(s, 690, 300, 500, 230, "Literary", "A passage makes an interpretation of a poem, play, or story. You choose the quotation that best proves that interpretation.", C.mint);
  footer(s); return s;
}

function slide04(p) {
  const s = p.slides.add(); board(s, 4);
  title(s, "The Three-Step Method", "This is the repeatable routine.");
  card(s, 88, 325, 315, 190, "1. Identify", "Underline the claim. Ask: What must the answer prove?", C.yellow);
  card(s, 482, 325, 315, 190, "2. Rephrase", "Convert the claim into a simple test phrase with plain words.", C.mint);
  card(s, 876, 325, 315, 190, "3. Test", "Compare each choice to the test phrase. Eliminate almost-right choices.", C.red);
  addLine(s, 410, 420, 470, 420, C.chalkDim, 3);
  addLine(s, 805, 420, 865, 420, C.chalkDim, 3);
  footer(s); return s;
}

function slide05(p) {
  const s = p.slides.add(); board(s, 5);
  title(s, "Step 1: Spot the Claim", "The answer must support this, not just mention the same topic.");
  addText(s, "Look for signal language:", 96, 285, 480, 34, { size: 28, color: C.yellow, bold: true });
  bullet(s, 120, 352, "researchers hypothesize that...", C.blue);
  bullet(s, 120, 412, "the narrator suggests that...", C.mint);
  bullet(s, 120, 472, "the student claims that...", C.red);
  addText(s, "Board rule: no claim, no answer.", 710, 390, 360, 80, { size: 38, color: C.chalk, bold: true, align: "center" });
  footer(s); return s;
}

function slide06(p) {
  const s = p.slides.add(); board(s, 6);
  title(s, "Step 2: Make a Test Phrase", "Shorten the claim until the right answer has nowhere to hide.");
  card(s, 92, 325, 460, 170, "Too much", "A fossil model, a specific species, a tank, and a set of measurements about movement.", C.red);
  card(s, 700, 325, 390, 170, "Better", "The special feature helps the animal move or turn better underwater.", C.mint);
  addLine(s, 565, 410, 675, 410, C.yellow, 4);
  addText(s, "Simplify, but keep the core relationship.", 230, 535, 780, 40, { size: 30, color: C.yellow, bold: true, align: "center" });
  footer(s); return s;
}

function slide07(p) {
  const s = p.slides.add(); board(s, 7);
  title(s, "Step 3: Be Strict With Choices", "Related is not the same as supporting.");
  card(s, 88, 315, 330, 205, "Wrong: same topic", "Mentions the subject but does not prove the claim.", C.red);
  card(s, 475, 315, 330, 205, "Wrong: too broad", "Goes beyond what the claim says or changes the focus.", C.yellow);
  card(s, 862, 315, 330, 205, "Right: exact match", "Shows the same cause, effect, quality, or relationship as the claim.", C.mint);
  footer(s); return s;
}

function slide08(p) {
  const s = p.slides.add(); board(s, 8, "WORKED EXAMPLE: LITERARY");
  title(s, "Literary Evidence Logic", "A quotation must illustrate the interpretation.");
  addText(s, "Claim pattern", 96, 275, 260, 28, { size: 24, color: C.yellow, bold: true });
  addText(s, "Character has an inflated sense of importance.", 96, 320, 470, 58, { size: 30, color: C.chalk, bold: true });
  addText(s, "Test phrase", 720, 275, 240, 28, { size: 24, color: C.yellow, bold: true });
  addText(s, "Acts as if he is grand or triumphant.", 720, 320, 430, 58, { size: 30, color: C.chalk, bold: true });
  addLine(s, 590, 345, 690, 345, C.yellow, 4);
  addText(s, "Best evidence should show attitude or behavior, not merely clothing, weather, or setting.", 188, 495, 880, 44, { size: 24, color: C.chalkDim, align: "center" });
  footer(s); return s;
}

function slide09(p) {
  const s = p.slides.add(); board(s, 9, "WORKED EXAMPLE: SCIENTIFIC");
  title(s, "Scientific Evidence Logic", "A finding must make the hypothesis more likely.");
  addText(s, "Hypothesis", 96, 265, 260, 28, { size: 24, color: C.yellow, bold: true });
  addText(s, "A feature improves underwater pursuit of quick prey.", 96, 310, 510, 70, { size: 30, color: C.chalk, bold: true });
  addText(s, "Matching finding", 720, 265, 260, 28, { size: 24, color: C.yellow, bold: true });
  addText(s, "The model with the feature turns or moves better underwater.", 720, 310, 460, 70, { size: 30, color: C.chalk, bold: true });
  addText(s, "Ignore findings about unrelated measurements unless they connect to the claim.", 220, 505, 830, 40, { size: 25, color: C.chalkDim, align: "center" });
  footer(s); return s;
}

function slide10(p) {
  const s = p.slides.add(); board(s, 10, "TOP TIPS");
  title(s, "Useful Habits From the Lesson", "These are secondary strategies; the main method still comes first.");
  bullet(s, 100, 305, "Be strict: almost evidence is usually wrong.", C.red, 27);
  bullet(s, 100, 375, "Stay specific: do not broaden or blur the claim.", C.yellow, 27);
  bullet(s, 100, 445, "Read the verb: support, illustrate, undermine, or challenge.", C.blue, 27);
  bullet(s, 100, 515, "Abbreviate jargon so the big relationship stays visible.", C.mint, 27);
  footer(s); return s;
}

function slide11(p) {
  const s = p.slides.add(); board(s, 11);
  title(s, "Trap Answers", "Most wrong choices fail in predictable ways.");
  card(s, 92, 315, 330, 205, "Partial match", "Supports only half of the claim. It may prove the topic, but not the full relationship.", C.yellow);
  card(s, 475, 315, 330, 205, "Reversal", "Flips the direction: less instead of more, cause instead of effect, support instead of challenge.", C.red);
  card(s, 858, 315, 330, 205, "Extra idea", "Adds a new claim that the passage never asked the evidence to prove.", C.blue);
  footer(s); return s;
}

function choice(slide, x, y, letter, body, color = C.chalkDim) {
  addRect(slide, x, y, 42, 42, "#FFFFFF10", `2 ${color}`, 21);
  addText(slide, letter, x, y + 8, 42, 20, { size: 18, color, bold: true, align: "center" });
  addText(slide, body, x + 58, y + 4, 390, 50, { size: 18, color: C.chalk });
}

function practiceSlide(p, item, index) {
  const s = p.slides.add(); board(s, 11 + index, "FOUNDATIONS PRACTICE");
  addText(s, item.title, 72, 95, 900, 84, { size: 50, bold: true, color: C.chalk });
  addLine(s, 74, 230, 1030, 230, C.yellow, 3);
  addText(s, `Question ${index} of 4 from the lesson practice set.`, 76, 248, 620, 24, { size: 18, color: C.chalkDim });
  const prompt = item.prompt.join("\n\n");
  const promptSize = prompt.length > 620 ? 15 : prompt.length > 470 ? 16 : 18;
  addText(s, prompt, 76, 282, 1040, 112, { size: promptSize, color: C.chalk });
  const choiceSize = Math.max(...item.choices.map(([, body]) => body.length)) > 145 ? 13 : 16;
  item.choices.forEach(([letter, body], i) => {
    const x = i % 2 === 0 ? 76 : 665;
    const y = 420 + Math.floor(i / 2) * 82;
    addRect(s, x, y, 44, 44, "#FFFFFF10", `2 ${[C.red, C.mint, C.yellow, C.blue][i]}`, 22);
    addText(s, letter, x, y + 9, 44, 18, { size: 17, color: [C.red, C.mint, C.yellow, C.blue][i], bold: true, align: "center" });
    addText(s, body, x + 58, y + 2, 500, 68, { size: choiceSize, color: C.chalk });
  });
  addText(s, `Answer: ${item.answer}`, 525, 610, 240, 40, { size: 32, color: C.board, bold: true, align: "center" });
  footer(s); return s;
}

function extraPracticeSlide(p, item, index, page) {
  const s = p.slides.add(); board(s, page, "TEXTUAL EVIDENCE: EXAMPLE");
  addText(s, item.title, 72, 82, 960, 60, { size: 42, bold: true, color: C.chalk });
  addLine(s, 74, 170, 1030, 170, C.yellow, 3);
  addText(s, `Question ${index} of ${EXTRA_PRACTICE.length}`, 76, 188, 340, 22, { size: 17, color: C.chalkDim });
  const prompt = item.prompt.join("\n\n");
  const promptSize = prompt.length > 720 ? 12.5 : prompt.length > 560 ? 14 : 16;
  addText(s, prompt, 76, 218, 1060, 150, { size: promptSize, color: C.chalk });
  const maxChoice = Math.max(...item.choices.map(([, body]) => body.length));
  const choiceSize = maxChoice > 220 ? 9.5 : maxChoice > 170 ? 10.5 : maxChoice > 125 ? 12 : 14;
  item.choices.forEach(([letter, body], i) => {
    const x = i % 2 === 0 ? 76 : 665;
    const y = 405 + Math.floor(i / 2) * 88;
    const color = [C.red, C.mint, C.yellow, C.blue][i];
    addRect(s, x, y, 44, 44, "#FFFFFF10", `2 ${color}`, 22);
    addText(s, letter, x, y + 9, 44, 18, { size: 17, color, bold: true, align: "center" });
    addText(s, body, x + 58, y, 500, 76, { size: choiceSize, color: C.chalk });
  });
  addText(s, `Answer: ${item.answer}`, 525, 615, 240, 34, { size: 28, color: C.board, bold: true, align: "center" });
  footer(s); return s;
}

function slide21(p) {
  const s = p.slides.add(); board(s, 21);
  title(s, "Final Blackboard Checklist", "Use this on every Command of Evidence: Textual question.");
  bullet(s, 150, 300, "What exactly is the claim?", C.yellow, 28);
  bullet(s, 150, 370, "Can I rewrite it in 5-8 plain words?", C.mint, 28);
  bullet(s, 150, 440, "Which choice proves the whole claim directly?", C.blue, 28);
  bullet(s, 150, 510, "Did the question ask for support or challenge?", C.red, 28);
  addText(s, "Strict match wins.", 710, 390, 360, 60, { size: 42, color: C.chalk, bold: true, align: "center" });
  footer(s); return s;
}

async function saveBlob(blob, filePath) {
  await fs.writeFile(filePath, Buffer.from(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(previewDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(workspace, "source-notes.txt"), [
    "Source studied: Khan Academy SAT Reading and Writing, Lesson 1: Command of Evidence: Textual.",
    "Main URL: https://www.khanacademy.org/test-prep/sat-reading-and-writing/x0d47bcec73eb6c4b:foundations-information-and-ideas/x0d47bcec73eb6c4b:command-of-evidence-textual/v/v2-sat-command-of-evidence-textual-video",
    "Pages reviewed: lesson article, top tips article, literary worked example, scientific worked example, quick example, foundations practice set.",
    "Deck approach: classroom summary plus a practice section based on the Khan foundations questions.",
    "",
  ].join("\n"), "utf8");
  await fs.writeFile(path.join(workspace, "profile-plan.txt"), "Task mode: create\nPrimary deck-profile: appendix-heavy\nAudience: SAT students\nVisual style: dark green blackboard, chalk accents\nQA gates: readable text, source-safe paraphrase, one complete lesson arc.\n", "utf8");
  await fs.writeFile(path.join(workspace, "claim-spine.txt"), "Thesis: Command of Evidence: Textual questions are solved by matching evidence to the exact claim.\nArc: define the task, split the two forms, teach a three-step method, model literary/scientific logic, practice, close with checklist.\n", "utf8");
  await fs.writeFile(path.join(workspace, "design-system.txt"), "16:9 dark green blackboard background, chalk-style typography, cream/mint/yellow/blue/red accents, thin chalk rules, boxed practice choices.\n", "utf8");
  await fs.writeFile(path.join(workspace, "contact-sheet-plan.txt"), "21 slides: cover, concept, two forms, method, step detail, worked-example logic, tips, traps, four foundations practice questions, five textual-evidence example questions, checklist.\n", "utf8");

  const p = Presentation.create({ slideSize: { width: W, height: H } });
  [slide01, slide02, slide03, slide04, slide05, slide06, slide07, slide08, slide09, slide10, slide11].forEach(fn => fn(p));
  PRACTICE.forEach((item, i) => practiceSlide(p, item, i + 1));
  EXTRA_PRACTICE.forEach((item, i) => extraPracticeSlide(p, item, i + 1, 16 + i));
  slide21(p);
  for (let i = 0; i < p.slides.count; i += 1) {
    const slide = p.slides.getItem(i);
    const n = String(i + 1).padStart(2, "0");
    await saveBlob(await p.export({ slide, format: "png", scale: 1 }), path.join(previewDir, `slide-${n}.png`));
    await fs.writeFile(path.join(layoutDir, `slide-${n}.layout.json`), await (await p.export({ slide, format: "layout" })).text(), "utf8");
  }
  const pptx = await PresentationFile.exportPptx(p);
  await pptx.save(finalPptx);
  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify({ finalPptx, slides: p.slides.count }, null, 2), "utf8");
  console.log(JSON.stringify({ finalPptx, slides: p.slides.count }, null, 2));
}

main().catch(error => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
