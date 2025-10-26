import pg from "pg";
const { Pool } = pg;

async function getTemplate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const result = await pool.query(`
      SELECT content 
      FROM prompt_sections 
      WHERE section_key = 'markdown_report_template_post_secondary_format'
    `);

    if (result.rows.length > 0) {
      console.log(result.rows[0].content);
    } else {
      console.log("Template not found");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await pool.end();
  }
}

getTemplate();
