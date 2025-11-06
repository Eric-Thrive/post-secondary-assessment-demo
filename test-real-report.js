/**
 * Test parser with actual report from tonight
 */

const realReport = `# Student Support Report
✔ = what to do (recommended strategies/supports)  
✘ = what not to do (common mistakes/counterproductive actions)

---

## Student Overview
Yasmine is a friendly, determined 5th grader who loves school, math, and helping classmates. She has hearing loss and struggles with reading, writing, and expressive communication, but she's eager to learn and enjoys being part of her classroom community. Yasmine is kind, organized, and takes on leadership roles with peers, though she sometimes feels left out or frustrated when others can't understand her speech. She works hard but needs extra support to access grade-level material, especially with language-heavy tasks. Yasmine benefits from targeted classroom strategies for reading, writing, and communication.

---

## Key Support Strategies
**Use strengths:** peer helper, positive attitude, organized, enjoys drawing  
**Support challenges:** reading words, writing independently, understanding directions, expressing ideas clearly  
**Small changes go far:** read instructions aloud, use visuals, break tasks down, offer sentence starters  
**Don't underestimate her:** With the right support, Yasmine's determination and kindness help her shine—she's ready to grow.

---

## Strengths
| Strength                | What You See                                         | What to Do                                   |
|-------------------------|------------------------------------------------------|----------------------------------------------|
| **Peer Helper & Leader**| Reminds classmates, helps others, takes initiative   | ✔ Give her classroom jobs or leadership roles|
|                         |                                                      | ✘ Ignore her desire to help or lead          |
| **Positive Attitude**   | Enjoys school, eager to learn, hopeful about future  | ✔ Praise her effort and celebrate progress   |
|                         |                                                      | ✘ Focus only on what she can't do            |
| **Organized & Responsible** | Keeps materials neat, completes work on time     | ✔ Let her model organization for classmates  |
|                         |                                                      | ✘ Overwhelm her with too many tasks at once  |

---

## Challenges / Areas of Need
| Challenge                       | What You See                                         | What to Do                                   |
|----------------------------------|------------------------------------------------------|----------------------------------------------|
| **Reading Words & Letters**      | Struggles to recognize letters, reads below grade    | ✔ Use visuals, read aloud, pair with strong readers |
|                                  |                                                      | ✘ Expect silent, independent reading         |
| **Writing Independently**        | Needs help writing ideas, can copy but not generate  | ✔ Offer sentence starters, scribe as needed  |
|                                  |                                                      | ✘ Make her write long assignments alone      |
| **Understanding Directions**     | Has trouble with multi-step or verbal instructions   | ✔ Break tasks into steps, check for understanding |
|                                  |                                                      | ✘ Give long, complex directions all at once  |
| **Expressing Ideas Clearly**     | Speech is hard to understand, gets frustrated        | ✔ Allow alternative ways to show knowledge (drawing, pointing) |
|                                  |                                                      | ✘ Correct or rush her speech in front of peers|

---

## Additional Notes
- Yasmine enjoys drawing and hands-on activities—use these for learning and assessment.
- She may become quiet or withdrawn when frustrated; check in gently if she seems upset.
- She is deeply connected to her brother and may feel sad or distracted after visits—offer understanding and flexibility.
- Yasmine's hearing loss means she benefits from clear, face-to-face communication and reduced background noise when possible.`;

// Simulate the fixed parser functions
function extractSection(markdown, header) {
  const escapedHeader = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `${escapedHeader}[^\\n]*([\\s\\S]*?)(?=##|---|$)`,
    "i"
  );
  const match = markdown.match(regex);
  return match ? match[1].trim() : "";
}

function parseStrategies(content) {
  const strategies = [];
  if (!content) return strategies;

  const lines = content.split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const cleaned = line
      .replace(/^[-]\s*/, "")
      .replace(/^\*\s+/, "")
      .trim();
    if (!cleaned.includes(":")) continue;

    const boldMatch = cleaned.match(/\*\*(.+?):\*\*\s*(.+)$/);
    let name = null;
    let description = null;

    if (boldMatch) {
      name = boldMatch[1].trim();
      description = boldMatch[2].trim();
    } else {
      const colonIndex = cleaned.indexOf(":");
      if (colonIndex > 0) {
        name = cleaned.slice(0, colonIndex).replace(/\*\*/g, "").trim();
        description = cleaned.slice(colonIndex + 1).trim();
      }
    }

    if (name && description) {
      const cleanName = name.replace(/:\s*$/, "").trim();
      const cleanDescription = description.replace(/^\*\*\s*/, "").trim();
      if (cleanName && cleanDescription) {
        strategies.push({ strategy: cleanName, description: cleanDescription });
      }
    }
  }
  return strategies;
}

function parseTableSection(content) {
  const results = [];
  if (!content || !content.includes("|")) {
    console.log("⚠️ No table found");
    return results;
  }

  const lines = content.split("\n");
  let currentItem = null;

  for (const rawLine of lines) {
    if (!rawLine.trim().startsWith("|")) continue;

    const cells = rawLine
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (cells.length === 0) continue;

    // Skip divider rows
    if (cells.every((cell) => !cell || /^-+$/.test(cell.replace(/\s+/g, "")))) {
      continue;
    }

    const isContinuationRow = cells[0].length === 0;

    if (!isContinuationRow) {
      if (currentItem) {
        results.push(currentItem);
      }

      const titleMatch = cells[0].match(/\*\*([^*]+)\*\*/);
      const title = titleMatch ? titleMatch[1].trim() : cells[0];

      currentItem = {
        title,
        whatYouSee: cells[1] ? [cells[1]] : [],
        whatToDo: [],
      };

      if (cells[2]) {
        const type = cells[2].startsWith("✔") ? "do" : "dont";
        const text = cells[2].replace(/^[✔✘]\s*/, "").trim();
        if (text) currentItem.whatToDo.push({ type, text });
      }
    } else if (currentItem) {
      if (cells[1]) {
        currentItem.whatYouSee.push(cells[1]);
      }
      if (cells[2]) {
        const type = cells[2].startsWith("✔") ? "do" : "dont";
        const text = cells[2].replace(/^[✔✘]\s*/, "").trim();
        if (text) currentItem.whatToDo.push({ type, text });
      }
    }
  }

  if (currentItem) {
    results.push(currentItem);
  }

  return results;
}

console.log("=== TESTING REAL REPORT ===\n");

// Test 1: Student Overview
console.log("1. Student Overview");
const overview = extractSection(realReport, "## Student Overview");
console.log(`   Length: ${overview.length} chars`);
console.log(`   Contains "Yasmine": ${overview.includes("Yasmine")}`);
console.log(`   ✓ ${overview.length > 0 ? "PASS" : "FAIL"}\n`);

// Test 2: Key Support Strategies
console.log("2. Key Support Strategies");
const strategiesSection = extractSection(
  realReport,
  "## Key Support Strategies"
);
const strategies = parseStrategies(strategiesSection);
console.log(`   Parsed: ${strategies.length} strategies`);
strategies.forEach((s, i) => {
  console.log(`   ${i + 1}. ${s.strategy}`);
});
console.log(`   ✓ ${strategies.length === 4 ? "PASS" : "FAIL"}\n`);

// Test 3: Strengths
console.log("3. Strengths");
const strengthsSection = extractSection(realReport, "## Strengths");
const strengths = parseTableSection(strengthsSection);
console.log(`   Parsed: ${strengths.length} strengths`);
strengths.forEach((s, i) => {
  console.log(`   ${i + 1}. ${s.title} (${s.whatToDo.length} actions)`);
});
console.log(`   ✓ ${strengths.length === 3 ? "PASS" : "FAIL"}\n`);

// Test 4: Challenges
console.log("4. Challenges / Areas of Need");
const challengesSection = extractSection(realReport, "## Challenges");
const challenges = parseTableSection(challengesSection);
console.log(`   Parsed: ${challenges.length} challenges`);
challenges.forEach((c, i) => {
  console.log(`   ${i + 1}. ${c.title} (${c.whatToDo.length} actions)`);
});
console.log(`   ✓ ${challenges.length === 4 ? "PASS" : "FAIL"}\n`);

// Summary
const allPassed =
  overview.length > 0 &&
  strategies.length === 4 &&
  strengths.length === 3 &&
  challenges.length === 4;

console.log("===================");
console.log(allPassed ? "✅ ALL TESTS PASSED!" : "❌ SOME TESTS FAILED");
console.log("===================");
