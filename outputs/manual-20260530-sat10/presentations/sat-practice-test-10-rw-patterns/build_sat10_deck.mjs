import fs from "node:fs/promises";
import path from "node:path";
import {
  Presentation,
  PresentationFile,
  shape,
  stroke,
  text,
  textStyle,
} from "/Users/shililiu/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const workspace = "/Users/shililiu/Desktop/GitHubSite/SSAT-SAT-IELTS-coach-Steve-Liu/outputs/manual-20260530-sat10/presentations/sat-practice-test-10-rw-patterns";
const outDir = path.join(workspace, "output");
const previewDir = path.join(workspace, "preview");
const layoutDir = path.join(workspace, "layout");
const finalPptx = path.join(outDir, "sat-practice-test-10-rw-question-patterns.pptx");

const W = 1280;
const H = 720;
const COLORS = {
  ink: "#17212B",
  paper: "#F7F2E8",
  pale: "#FFFDF7",
  muted: "#66717C",
  rule: "#D8D0C1",
  red: "#B94D45",
  blue: "#2C6E8F",
  green: "#4F7D5A",
  gold: "#C58A2C",
};

const PATTERNS = {
  "Vocabulary & Meaning": {
    color: COLORS.red,
    shorthand: "Meaning",
    categories: ["Words in context"],
    move: "Use the sentence logic to predict meaning before looking at choices.",
  },
  "Evidence & Inference": {
    color: COLORS.blue,
    shorthand: "Evidence",
    categories: ["Central ideas and details", "Command of evidence", "Inferences"],
    move: "Find the claim, evidence, or necessary conclusion the text supports.",
  },
  "Structure & Logic": {
    color: COLORS.green,
    shorthand: "Logic",
    categories: ["Text structure and purpose", "Cross-text connections", "Transitions"],
    move: "Track how ideas relate: purpose, agreement, contrast, sequence, or cause.",
  },
  "Conventions & Synthesis": {
    color: COLORS.gold,
    shorthand: "Craft",
    categories: ["Boundaries", "Form, structure, and sense", "Rhetorical synthesis"],
    move: "Apply grammar rules or choose the sentence that best serves the stated goal.",
  },
};

const questions = [
  { n: 1, c: "Words in context", p: ["In the early 1800s, the Cherokee scholar Sequoyah created the first script, or writing system, for an Indigenous language in the United States. Because it represented the sounds of spoken Cherokee so accurately, his script was easy to learn and thus quickly achieved ______ use: by 1830, over 90 percent of the Cherokee people could read and write it.", "Which choice completes the text with the most logical and precise word or phrase?"], a: [["A", "widespread"], ["B", "careful"], ["C", "unintended"], ["D", "infrequent"]] },
  { n: 2, c: "Words in context", p: ["Due to their often strange images, highly experimental syntax, and opaque subject matter, many of John Ashbery's poems can be quite difficult to ______ and thus are the object of heated debate among scholars.", "Which choice completes the text with the most logical and precise word or phrase?"], a: [["A", "delegate"], ["B", "compose"], ["C", "interpret"], ["D", "renounce"]] },
  { n: 3, c: "Words in context", p: ["Beginning in the 1950s, Navajo Nation legislator Annie Dodge Wauneka continuously worked to promote public health; this ______ effort involved traveling throughout the vast Navajo homeland and writing a medical dictionary for speakers of Dine bizaad, the Navajo language.", "Which choice completes the text with the most logical and precise word or phrase?"], a: [["A", "impartial"], ["B", "offhand"], ["C", "persistent"], ["D", "mandatory"]] },
  { n: 4, c: "Words in context", p: ["Kelp forests grow underwater along the eastern Pacific Coast. These underwater forests are important to fish and other marine animals. Ocean currents can be powerful and rough, making it difficult for animals to find safe places to hide from predators. The underwater forests slow down the currents. This creates a more _____ environment with calmer waters where animals can take shelter.", "Which choice completes the text with the most logical and precise word or phrase?"], a: [["A", "tranquil"], ["B", "dangerous"], ["C", "imaginative"], ["D", "surprising"]] },
  { n: 5, c: "Words in context", p: ["People sometimes dismiss a claim if it comes from a source they regard as self-interested, but from a strictly logical perspective, the source of a claim is _____: it has no direct bearing on whether the claim is true.", "Which choice completes the text with the most logical and precise word or phrase?"], a: [["A", "indistinct"], ["B", "irrelevant"], ["C", "indisputable"], ["D", "implicit"]] },
  { n: 6, c: "Text structure and purpose", p: ["Jazz tap is a dance form that was first developed in African American communities. Jazz tap was heavily influenced by jazz music, which became widely popular in the United States in the 1920s. Tap dancers were inspired by jazz music's quick rhythms and by the way jazz musicians would make up melodies as they played. As jazz music continued to develop in the 1930s and 1940s, jazz tap evolved with it. Because of jazz music's influence, jazz tap quickly developed into a dance form that was very different from earlier kinds of tap dance.", "Which choice best states the main purpose of the text?"], a: [["A", "It explains why audiences prefer some kinds of music over others."], ["B", "It discusses the development of a dance form."], ["C", "It describes how to play a musical instrument."], ["D", "It emphasizes the popularity of a famous dancer."]] },
  { n: 7, c: "Text structure and purpose", p: ["The following text is adapted from Jane Austen's 1814 novel Mansfield Park. The speaker, Tom, is considering staging a play at home with a group of his friends and family.", "We mean nothing but a little amusement among ourselves, just to vary the scene, and exercise our powers in something new. We want no audience, no publicity. We may be trusted, I think, in choosing some play most perfectly unexceptionable; and I can conceive no greater harm or danger to any of us in conversing in the elegant written language of some respectable author than in chattering in words of our own.", "Which choice best states the main purpose of the text?"], a: [["A", "To offer Tom's assurance that the play will be inoffensive and involve only a small number of people"], ["B", "To clarify that the play will not be performed in the manner Tom had originally intended"], ["C", "To elaborate on the idea that the people around Tom lack the skills to successfully stage a play"], ["D", "To assert that Tom believes the group performing the play will be able to successfully promote it"]] },
  { n: 8, c: "Cross-text connections", p: ["Text 1: French Impressionist artist Edgar Degas insisted that his paintings be kept in their original frames after they were sold. Like many Impressionist painters, Degas used painted frames that stood in contrast to the gold frames frequently seen at the Paris Salon, a prestigious art exhibition that was sponsored by the French government and promoted traditional painting styles. Impressionist painters likely chose these colorful frames to distinguish themselves from what was considered conventional at the time.", "Text 2: Impressionist painters often focused on the interplay of color and light in their works. As such, those Impressionists who placed their works in painted frames instead of the more traditional gold ones did so for aesthetic reasons: a frame's color was likely chosen because it would harmonize with the colors or subjects in a painting. Gold, conversely, could distract from the subtleties in a painted scene.", "Based on the texts, both authors would most likely agree with which statement?"], a: [["A", "Gold frames were considered especially desirable by those who purchased works from Impressionist painters."], ["B", "The colors in an Impressionist painting were often chosen to complement the colors of the frame it would be placed in."], ["C", "Many Impressionist painters were intentional about the frames they selected for their works."], ["D", "Degas's preferred framing style was different from that of most Impressionist painters."]] },
  { n: 9, c: "Central ideas and details", p: ["Choctaw/Cherokee artist Jeffrey Gibson turns punching bags used by boxers into art by decorating them with beadwork and elements of Native dressmaking. These elements include leather fringe and jingles, the metal cones that cover the dresses worn in the jingle dance, a women's dance of the Ojibwe people. Thus, Gibson combines an object commonly associated with masculinity (a punching bag) with art forms traditionally practiced by women in most Native communities (beadwork and dressmaking). In this way, he rejects the division of male and female gender roles.", "Which choice best describes Gibson's approach to art, as presented in the text?"], a: [["A", "He draws from traditional Native art forms to create his original works."], ["B", "He finds inspiration from boxing in designing the dresses he makes."], ["C", "He rejects expectations about color and pattern when incorporating beadwork."], ["D", "He has been influenced by Native and non-Native artists equally."]] },
  { n: 10, c: "Central ideas and details", p: ["Believing that living in an impractical space can heighten awareness and even improve health, conceptual artists Madeline Gins and Shusaku Arakawa designed an apartment building in Japan to be more fanciful than functional. A kitchen counter is chest-high on one side and knee-high on the other; a ceiling has a door to nowhere. The effect is disorienting but invigorating: after four years there, filmmaker Nobu Yamaoka reported significant health benefits.", "Which choice best states the main idea of the text?"], a: [["A", "Although inhabiting a home surrounded by fanciful features such as those designed by Gins and Arakawa can be rejuvenating, it is unsustainable."], ["B", "Designing disorienting spaces like those in the Gins and Arakawa building is the most effective way to create a physically stimulating environment."], ["C", "As a filmmaker, Yamaoka has long supported the designs of conceptual artists such as Gins and Arakawa."], ["D", "Although impractical, the design of the apartment building by Gins and Arakawa may improve the well-being of the building's residents."]] },
  { n: 11, c: "Command of textual evidence", p: ["Many insects are iridescent, or have colors that appear to shimmer and change when seen from different angles. Scientists have assumed that this feature helps to attract mates but could also attract predators. But biologist Karin Kjernsmo and a team had the idea that the shifting appearance of colors might actually make it harder for other animals to see iridescent insects. To test this idea, the team put beetle forewings on leaves along a forest path and then asked human participants to look for them. Some of the wings were naturally iridescent. Others were painted with a nonchanging color from the iridescent spectrum, such as purple or blue.", "Which finding, if true, would most directly support the team's idea?"], a: [["A", "On average, participants found most of the purple wings and blue wings and far fewer of the iridescent wings."], ["B", "On average, participants found the iridescent wings faster than they found the purple wings or blue wings."], ["C", "Some participants reported that the purple wings were easier to see than the blue wings."], ["D", "Some participants successfully found all of the wings on the leaves."]] },
  { n: 12, c: "Command of textual evidence", p: ["The Post Office is a 1912 play by Rabindranath Tagore, originally written in Bengali. The character Amal is a young boy who imagines that the people he sees passing the window of his home are carefree even when engaged in work or chores, as is evident when he says to the daughter of a flower seller, ______", "Which quotation from The Post Office most effectively illustrates the claim?"], a: [["A", "\"I see, you don't wish to stop; I don't care to stay on here either.\""], ["B", "\"Oh, flower gathering? That is why your feet seem so glad and your anklets jingle so merrily as you walk.\""], ["C", "\"I'll pay when I grow up-before I leave to look for work out on the other side of that stream there.\""], ["D", "\"Wish I could be out too. Then I would pick some flowers for you from the very topmost branches right out of sight.\""]] },
  { n: 13, c: "Command of quantitative evidence", p: ["Graph context: Spider Population Count over 30 days compares two enclosures: with lizards and no lizards.", "To investigate the effect of lizard predation on spider populations, a student in a biology class placed spiders in two enclosures, one with lizards and one without, and tracked the number of spiders in the enclosures for 30 days. The student concluded that the reduction in the spider population count in the enclosure with lizards by day 30 was entirely attributable to the presence of the lizards.", "Which choice best describes data from the graph that weaken the student's conclusion?"], a: [["A", "The spider population count was the same in both enclosures on day 1."], ["B", "The spider population count also substantially declined by day 30 in the enclosure without lizards."], ["C", "The largest decline in spider population count in the enclosure with lizards occurred from day 1 to day 10."], ["D", "The spider population count on day 30 was lower in the enclosure with lizards than in the enclosure without lizards."]] },
  { n: 14, c: "Inferences", p: ["Many mosquito repellents contain natural components that work by activating multiple odor receptors on mosquitoes' antennae. As the insects develop resistance, new repellents are needed. Ke Dong and her team found that EBF, a molecular component of a chrysanthemum-flower extract, can repel mosquitoes by activating just one odor receptor-and this receptor, Or31, is present in all mosquito species known to carry diseases. Therefore, the researchers suggest that in developing new repellents, it would be most useful to ______", "Which choice most logically completes the text?"], a: [["A", "identify molecular components similar to EBF that target the activation of Or31 receptors."], ["B", "investigate alternative methods for extracting EBF molecules from chrysanthemums."], ["C", "verify the precise locations of Or31 and other odor receptors on mosquitoes' antennae."], ["D", "determine the maximum number of different odor receptors that can be activated by a single molecule."]] },
  { n: 15, c: "Inferences", p: ["Euphorbia esula (leafy spurge) is a Eurasian plant that has become invasive in North America, where it displaces native vegetation and sickens cattle. E. esula can be controlled with chemical herbicides, but that approach can also kill harmless plants nearby. Recent research on introducing engineered DNA into plant species to inhibit their reproduction may offer a path toward exclusively targeting E. esula, consequently ______", "Which choice most logically completes the text?"], a: [["A", "making individual E. esula plants more susceptible to existing chemical herbicides."], ["B", "enhancing the ecological benefits of E. esula in North America."], ["C", "enabling cattle to consume E. esula without becoming sick."], ["D", "reducing invasive E. esula numbers without harming other organisms."]] },
  { n: 16, c: "Boundaries", p: ["While many video game creators strive to make their graphics ever more ______ others look to the past, developing titles with visuals inspired by the \"8-bit\" games of the 1980s and 1990s. (The term \"8-bit\" refers to a console whose processor could only handle eight bits of data at once.)", "Which choice completes the text so that it conforms to the conventions of Standard English?"], a: [["A", "lifelike but"], ["B", "lifelike"], ["C", "lifelike,"], ["D", "lifelike, but"]] },
  { n: 17, c: "Boundaries", p: ["As British scientist Peter Whibberley has observed, \"the Earth is not a very good timekeeper.\" Earth's slightly irregular rotation rate means that measurements of time must be periodically adjusted. Specifically, an extra \"leap second\" (the 86,401st second of the day) is ______ time based on the planet's rotation lags a full nine-tenths of a second behind time kept by precise atomic clocks.", "Which choice completes the text so that it conforms to the conventions of Standard English?"], a: [["A", "added, whenever"], ["B", "added; whenever"], ["C", "added. Whenever"], ["D", "added whenever"]] },
  { n: 18, c: "Form, structure, and sense", p: ["In Death Valley National Park's Racetrack Playa, a flat, dry lakebed, are 162 rocks-some weighing less than a pound but others almost 700 pounds-that move periodically from place to place, seemingly of their own volition. Racetrack-like trails in the ______ mysterious migration.", "Which choice completes the text so that it conforms to the conventions of Standard English?"], a: [["A", "playas sediment mark the rock's"], ["B", "playa's sediment mark the rocks"], ["C", "playa's sediment mark the rocks'"], ["D", "playas' sediment mark the rocks'"]] },
  { n: 19, c: "Boundaries", p: ["Along with carbon dioxide concentration and temperature, light intensity affects the chemical reaction rate of _____ as light intensity increases, so does the rate at which the reactants (water and carbon dioxide) are converted into their products (glucose and oxygen).", "Which choice completes the text so that it conforms to the conventions of Standard English?"], a: [["A", "photosynthesis and"], ["B", "photosynthesis,"], ["C", "photosynthesis:"], ["D", "photosynthesis"]] },
  { n: 20, c: "Boundaries", p: ["Paintings by the renowned twentieth-century US _____ were featured in Artist to Artist, an exhibition at the Smithsonian Art Museum that paired the works of artists whose career trajectories intersected in meaningful ways.", "Which choice completes the text so that it conforms to the conventions of Standard English?"], a: [["A", "artists: Thomas Hart Benton and Jackson Pollock,"], ["B", "artists Thomas Hart Benton and Jackson Pollock"], ["C", "artists Thomas Hart Benton, and Jackson Pollock,"], ["D", "artists, Thomas Hart Benton and Jackson Pollock"]] },
  { n: 21, c: "Transitions", p: ["In her 2012 analysis of tree rings from Japan's Yaku Island, cosmic ray physicist Fusa Miyake noted an anomalous carbon-14 spike dating to 774-775 CE, indicating that a massive burst of radiation reached Earth during that time. _____ this unprecedented radiocarbon surge was dubbed a \"Miyake event\" in honor of its discoverer.", "Which choice completes the text with the most logical transition?"], a: [["A", "Fittingly,"], ["B", "Similarly,"], ["C", "However,"], ["D", "In other words,"]] },
  { n: 22, c: "Transitions", p: ["One poll taken after the first 1960 presidential debate suggested that John Kennedy lost badly: only 21 percent of those who listened on the radio rated him the winner. ______ the debate was ultimately considered a victory for the telegenic young senator, who rated higher than his opponent, Vice President Richard Nixon, among those watching on the new medium of television.", "Which choice completes the text with the most logical transition?"], a: [["A", "In other words,"], ["B", "Therefore,"], ["C", "Likewise,"], ["D", "Nevertheless,"]] },
  { n: 23, c: "Transitions", p: ["In his 1925 book The Morphology of Landscape, US geographer Carl Sauer challenged prevailing views about how natural landscapes influence human cultures. ______ Sauer argued that instead of being shaped entirely by their natural surroundings, cultures play an active role in their own development by virtue of their interactions with the environment.", "Which choice completes the text with the most logical transition?"], a: [["A", "Similarly,"], ["B", "Finally,"], ["C", "Therefore,"], ["D", "Specifically,"]] },
  { n: 24, c: "Rhetorical synthesis", p: ["While researching a topic, a student has taken the following notes:", "Dr. Sunil Bajpai studies dinosaurs at the Indian Institute of Technology.", "Bajpai's research team recently found a 167-million-year-old dicraeosaurid fossil.", "It is the oldest fossil from the dicraeosaurid dinosaur group ever recovered.", "It was found in the Thar Desert in western India.", "The student wants to indicate where the dicraeosaurid fossil was found. Which choice most effectively uses relevant information from the notes to accomplish this goal?"], a: [["A", "The dicraeosaurid fossil was found in western India's Thar Desert."], ["B", "Bajpai's team recently found the oldest dicraeosaurid fossil ever recovered."], ["C", "Dr. Sunil Bajpai, of the Indian Institute of Technology, is part of a research team."], ["D", "The fossil, which is from the dicraeosaurid dinosaur group, is 167 million years old."]] },
  { n: 25, c: "Rhetorical synthesis", p: ["While researching a topic, a student has taken the following notes:", "Ancient Native American and Australian Aboriginal cultures described the Pleiades star cluster as having seven stars.", "It was referred to as the Seven Sisters in the mythology of ancient Greece.", "Today, the cluster appears to have only six stars.", "Two of the stars have moved so close together that they now appear as one.", "The student wants to specify the reason the Pleiades' appearance changed. Which choice most effectively uses relevant information from the notes to accomplish this goal?"], a: [["A", "Ancient Native American and Australian Aboriginal cultures described the Pleiades, which was referred to in Greek mythology as the Seven Sisters, as having seven stars."], ["B", "Although once referred to as the Seven Sisters, the Pleiades appears to have only six stars today."], ["C", "In the time since ancient cultures described the Pleiades as having seven stars, two of the cluster's stars have moved so close together that they now appear as one."], ["D", "The Pleiades has seven stars, but two are so close together that they appear to be a single star."]] },
  { n: 26, c: "Rhetorical synthesis", p: ["While researching a topic, a student has taken the following notes:", "Severo Ochoa discovered the enzyme PNPase in 1955.", "PNPase is involved in both the creation and degradation of mRNA.", "Ochoa incorrectly hypothesized that PNPase provides the genetic blueprints for mRNA.", "The discovery of PNPase proved critical to deciphering the human genetic code.", "Deciphering the genetic code has led to a better understanding of how genetic variations affect human health.", "The student wants to emphasize the significance of Ochoa's discovery. Which choice most effectively uses relevant information from the notes to accomplish this goal?"], a: [["A", "Ochoa's 1955 discovery of PNPase proved critical to deciphering the human genetic code, leading to a better understanding of how genetic variations affect human health."], ["B", "Ochoa first discovered PNPase, an enzyme that he hypothesized contained the genetic blueprints for mRNA, in 1955."], ["C", "In 1955, Ochoa discovered the PNPase enzyme, which is involved in both the creation and degradation of mRNA."], ["D", "Though his discovery of PNPase was critical to deciphering the human genetic code, Ochoa incorrectly hypothesized that the enzyme was the source of mRNA's genetic blueprints."]] },
  { n: 27, c: "Rhetorical synthesis", p: ["While researching a topic, a student has taken the following notes:", "In the late 1890s, over 14,000 unique varieties of apples were grown in the US.", "The rise of industrial agriculture in the mid-1900s narrowed the range of commercially grown crops.", "Thousands of apple varieties considered less suitable for commercial growth were lost.", "Today, only 15 apple varieties dominate the market, making up 90% of apples purchased in the US.", "The Lost Apple Project, based in Washington State, attempts to find and grow lost apple varieties.", "The student wants to emphasize the decline in unique apple varieties in the US and specify why this decline occurred. Which choice most effectively uses relevant information from the notes to accomplish these goals?"], a: [["A", "The Lost Apple Project is dedicated to finding some of the apple varieties lost following a shift in agricultural practices in the mid-1900s."], ["B", "While over 14,000 apple varieties were grown in the US in the late 1890s, only 15 unique varieties make up most of the apples sold today."], ["C", "Since the rise of industrial agriculture, US farmers have mainly grown the same few unique apple varieties, resulting in the loss of thousands of varieties less suitable for commercial growth."], ["D", "As industrial agriculture rose to prominence in the mid-1900s, the number of crops selected for cultivation decreased dramatically."]] },
];

function canonicalCategory(category) {
  return category.toLowerCase();
}

function patternFor(category) {
  const c = canonicalCategory(category);
  if (c.includes("word")) return "Vocabulary & Meaning";
  if (c.includes("bound") || c.includes("form") || c.includes("rhetorical")) return "Conventions & Synthesis";
  if (c.includes("central") || c.includes("command") || c.includes("inference")) return "Evidence & Inference";
  if (c.includes("structure") || c.includes("cross") || c.includes("transition")) return "Structure & Logic";
  return "Conventions & Synthesis";
}

function addText(slide, value, x, y, w, h, opts = {}) {
  const {
    size = 22,
    color = COLORS.ink,
    bold = false,
    align = "left",
    valign = "top",
    typeface = "Avenir Next",
  } = opts;
  const box = slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill: { type: "none" },
    line: { fill: { type: "none" }, width: 0 },
  });
  box.text.set(value);
  box.text.fontSize = size;
  box.text.color = color;
  box.text.bold = bold;
  box.text.typeface = typeface;
  box.text.alignment = align;
  box.text.verticalAlignment = valign;
  box.text.insets = { top: 0, right: 0, bottom: 0, left: 0 };
}

function addRect(slide, x, y, w, h, fill, line = "none", radius = 0) {
  slide.shapes.add({
    geometry: "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: line === "none" ? { fill: { type: "none" }, width: 0 } : stroke(line),
    borderRadius: radius,
  });
}

function addBase(slide, page, accent = COLORS.ink) {
  addRect(slide, 0, 0, W, H, COLORS.paper);
  addRect(slide, 0, 0, 190, H, accent);
  addRect(slide, 190, 0, 3, H, "#00000022");
  addText(slide, "SAT RW", 34, 36, 120, 26, { size: 18, color: "#FFFFFF", bold: true, align: "center" });
  addText(slide, String(page).padStart(2, "0"), 44, 646, 100, 32, { size: 24, color: "#FFFFFF", bold: true, align: "center" });
}

function titleSlide(p) {
  const slide = p.slides.add();
  addRect(slide, 0, 0, W, H, COLORS.paper);
  addRect(slide, 0, 0, W, 18, COLORS.ink);
  addRect(slide, 70, 150, 10, 310, COLORS.red);
  addText(slide, "Official SAT Practice Test 10", 110, 142, 900, 56, { size: 26, color: COLORS.muted, bold: true });
  addText(slide, "Reading & Writing: Questions by Pattern", 110, 205, 940, 160, { size: 58, color: COLORS.ink, bold: true, lineSpacing: 0.95 });
  addText(slide, "Four pattern lens + 27 question slides. Answers and explanations are intentionally omitted.", 114, 400, 820, 54, { size: 22, color: COLORS.muted });
  const x0 = 110;
  Object.entries(PATTERNS).forEach(([name, meta], i) => {
    const x = x0 + i * 270;
    addRect(slide, x, 530, 230, 54, meta.color, "none", 4);
    addText(slide, meta.shorthand, x + 16, 544, 198, 24, { size: 18, color: "#FFFFFF", bold: true, align: "center" });
  });
  return slide;
}

function patternIntroSlide(p) {
  const slide = p.slides.add();
  addBase(slide, 2, COLORS.ink);
  addText(slide, "The four patterns of SAT questions", 240, 48, 820, 52, { size: 38, bold: true });
  addText(slide, "Each question is less about topic and more about the move it asks you to make.", 242, 100, 760, 30, { size: 19, color: COLORS.muted });
  Object.entries(PATTERNS).forEach(([name, meta], i) => {
    const x = 242 + (i % 2) * 500;
    const y = 170 + Math.floor(i / 2) * 220;
    addRect(slide, x, y, 430, 154, COLORS.pale, `2 ${meta.color}`, 4);
    addRect(slide, x, y, 12, 154, meta.color);
    addText(slide, name, x + 30, y + 24, 350, 32, { size: 24, bold: true, color: meta.color });
    addText(slide, meta.move, x + 30, y + 64, 354, 54, { size: 18, color: COLORS.ink });
    addText(slide, meta.categories.join(" / "), x + 30, y + 124, 354, 20, { size: 12, color: COLORS.muted, bold: true });
  });
  return slide;
}

function categoryMapSlide(p) {
  const slide = p.slides.add();
  addBase(slide, 3, COLORS.ink);
  addText(slide, "Pattern map for this practice set", 240, 48, 820, 52, { size: 38, bold: true });
  addText(slide, "Use this slide as the sorting key while reviewing questions.", 242, 100, 760, 30, { size: 19, color: COLORS.muted });
  const counts = questions.reduce((acc, q) => {
    const pat = patternFor(q.c);
    acc[pat] = (acc[pat] || 0) + 1;
    return acc;
  }, {});
  Object.entries(PATTERNS).forEach(([name, meta], i) => {
    const y = 166 + i * 118;
    addRect(slide, 248, y, 840, 82, COLORS.pale, `1 ${COLORS.rule}`, 4);
    addRect(slide, 248, y, 96, 82, meta.color);
    addText(slide, `${counts[name] || 0}`, 270, y + 18, 52, 38, { size: 34, color: "#FFFFFF", bold: true, align: "center" });
    addText(slide, name, 370, y + 14, 280, 28, { size: 24, color: meta.color, bold: true });
    addText(slide, meta.categories.join(" / "), 370, y + 48, 610, 22, { size: 17, color: COLORS.ink });
  });
  return slide;
}

function textSizeFor(q) {
  const chars = q.p.join(" ").length;
  if (chars > 980) return 13.5;
  if (chars > 760) return 15;
  if (chars > 560) return 16.5;
  return 18;
}

function choiceSizeFor(q) {
  const maxChoice = Math.max(...q.a.map(([, v]) => v.length));
  if (maxChoice > 145) return 12;
  if (maxChoice > 100) return 13;
  return 15;
}

function questionSlide(p, q, index) {
  const pat = patternFor(q.c);
  const meta = PATTERNS[pat];
  const slide = p.slides.add();
  addBase(slide, index + 3, meta.color);
  addText(slide, `Pattern ${Object.keys(PATTERNS).indexOf(pat) + 1}`, 30, 118, 130, 24, { size: 16, color: "#FFFFFF", bold: true, align: "center" });
  const railTitle = pat === "Conventions & Synthesis" ? "Conventions\n& Synthesis" : pat.replace(" & ", "\n& ");
  const railSize = pat === "Conventions & Synthesis" ? 22 : 25;
  addText(slide, railTitle, 18, 158, 156, 96, { size: railSize, color: "#FFFFFF", bold: true, align: "center", lineSpacing: 0.92 });
  addText(slide, meta.move, 24, 294, 144, 136, { size: 14, color: "#FFFFFF", align: "center", lineSpacing: 1.06 });

  addText(slide, `Question ${q.n}`, 238, 36, 180, 34, { size: 28, color: meta.color, bold: true });
  addText(slide, q.c, 425, 44, 460, 24, { size: 17, color: COLORS.muted, bold: true });
  addRect(slide, 238, 88, 900, 2, COLORS.rule);

  const prompt = q.p.join("\n\n");
  addText(slide, prompt, 240, 112, 888, 318, { size: textSizeFor(q), color: COLORS.ink, lineSpacing: 1.06 });
  addText(slide, "Choose 1 answer", 240, 448, 220, 22, { size: 15, color: COLORS.muted, bold: true });

  const choiceFont = choiceSizeFor(q);
  q.a.forEach(([letter, value], i) => {
    const x = 240 + (i % 2) * 455;
    const y = 486 + Math.floor(i / 2) * 86;
    addRect(slide, x, y, 410, 62, COLORS.pale, `1 ${COLORS.rule}`, 4);
    addRect(slide, x + 14, y + 16, 30, 30, meta.color, "none", 15);
    addText(slide, letter, x + 14, y + 20, 30, 16, { size: 14, color: "#FFFFFF", bold: true, align: "center" });
    addText(slide, value, x + 58, y + 11, 330, 40, { size: choiceFont, color: COLORS.ink, lineSpacing: 1.05 });
  });
  return slide;
}

async function saveBlob(blob, filePath) {
  const ab = await blob.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(ab));
}

async function main() {
  await fs.mkdir(outDir, { recursive: true });
  await fs.mkdir(previewDir, { recursive: true });
  await fs.mkdir(layoutDir, { recursive: true });

  await fs.writeFile(path.join(workspace, "source-notes.txt"), [
    "Source: Khan Academy, Official SAT Practice Test 10 Review, Reading and Writing - Part 1",
    "User-provided URL: https://www.khanacademy.org/test-prep/dsat-practice-test-10-11/x1cad15f2ebbde4e3:dsat-practice-test-10-11/x1cad15f2ebbde4e3:dsat-practice-test-10-11-rw/a/dsat--practice-test--10-rw-0",
    "Retrieved: 2026-05-30",
    "Scope: question stems and answer choices only; correct answers and explanations omitted.",
    "",
  ].join("\n"));
  await fs.writeFile(path.join(workspace, "profile-plan.txt"), "Task mode: create\nPrimary deck-profile: appendix-heavy\nAudience: SAT students in a tutor-led review session\nQA gates: readable question text, one pattern label per question, no answer key.\n");
  await fs.writeFile(path.join(workspace, "claim-spine.txt"), "Thesis: SAT Reading and Writing review is easier when students classify each item by the thinking pattern it tests.\nSlides: title, four-pattern overview, category map, then one slide per question.\n");
  await fs.writeFile(path.join(workspace, "design-system.txt"), "Classroom deck, 16:9, warm paper background, left pattern rail, high-contrast question field, four pattern accents.\n");
  await fs.writeFile(path.join(workspace, "contact-sheet-plan.txt"), "Cover, pattern matrix, category map, then stable question-review slide grammar with varied accent colors.\n");

  const presentation = Presentation.create({ slideSize: { width: W, height: H } });
  titleSlide(presentation);
  patternIntroSlide(presentation);
  categoryMapSlide(presentation);
  questions.forEach((q, i) => questionSlide(presentation, q, i + 1));

  for (let i = 0; i < presentation.slides.count; i += 1) {
    const slide = presentation.slides.getItem(i);
    await saveBlob(await presentation.export({ slide, format: "png", scale: 1 }), path.join(previewDir, `slide-${String(i + 1).padStart(2, "0")}.png`));
    await fs.writeFile(path.join(layoutDir, `slide-${String(i + 1).padStart(2, "0")}.layout.json`), await (await presentation.export({ slide, format: "layout" })).text(), "utf8");
  }

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(finalPptx);

  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify({
    finalPptx,
    slideCount: presentation.slides.count,
    questionCount: questions.length,
    previewDir,
  }, null, 2));
  console.log(JSON.stringify({ finalPptx, slides: presentation.slides.count }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
