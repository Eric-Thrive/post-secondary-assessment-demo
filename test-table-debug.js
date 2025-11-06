const strengthsSection = `| Strength                | What You See                                         | What to Do                                   |
|-------------------------|------------------------------------------------------|----------------------------------------------|
| **Peer Helper & Leader**| Reminds classmates, helps others, takes initiative   | ✔ Give her classroom jobs or leadership roles|
|                         |                                                      | ✘ Ignore her desire to help or lead          |
| **Positive Attitude**   | Enjoys school, eager to learn, hopeful about future  | ✔ Praise her effort and celebrate progress   |
|                         |                                                      | ✘ Focus only on what she can't do            |`;

console.log("=== DEBUGGING TABLE PARSING ===\n");

const lines = strengthsSection.split("\n");
console.log(`Total lines: ${lines.length}\n`);

lines.forEach((line, i) => {
  console.log(`Line ${i}: "${line}"`);
  console.log(`  Starts with |: ${line.trim().startsWith("|")}`);

  if (line.trim().startsWith("|")) {
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());
    console.log(
      `  Cells (${cells.length}): [${cells
        .map((c) => `"${c.substring(0, 20)}..."`)
        .join(", ")}]`
    );

    // Check if divider
    const isDivider = cells.every(
      (cell) => !cell || /^-+$/.test(cell.replace(/\s+/g, ""))
    );
    console.log(`  Is divider: ${isDivider}`);

    // Check if header
    const combined = cells.join(" ").toLowerCase();
    const isHeader = combined.includes("strength") && combined.includes("what");
    console.log(`  Is header: ${isHeader}`);

    // Check if continuation
    const isContinuation = cells[0].length === 0;
    console.log(`  Is continuation: ${isContinuation}`);
  }
  console.log();
});
