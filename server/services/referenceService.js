import { pool } from "../db/pool.js";

export async function listCategories() {
  const [rows] = await pool.execute(
    `SELECT category_id, category_name, description
     FROM activity_categories
     ORDER BY category_name`,
  );
  return rows;
}

export async function listLocations(userId) {
  const [rows] = await pool.execute(
    `SELECT location_id, location_name, location_type
     FROM locations
     WHERE user_id = ?
     ORDER BY location_name, location_id`,
    [userId],
  );
  return rows;
}