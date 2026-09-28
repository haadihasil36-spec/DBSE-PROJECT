import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";

const passwordRounds = 12;

function publicUser(row) {
  return {
    user_id: row.user_id,
    full_name: row.full_name,
    email: row.email,
    date_of_birth: row.date_of_birth,
    created_at: row.created_at,
  };
}

function createToken(userId) {
  return jwt.sign({ user_id: userId }, env.jwtSecret, { expiresIn: "1d" });
}

export async function registerUser({ fullName, email, password }) {
  const passwordHash = await bcrypt.hash(password, passwordRounds);

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES (?, ?, ?)`,
      [fullName, email, passwordHash],
    );

    const user = {
      user_id: result.insertId,
      full_name: fullName,
      email,
      date_of_birth: null,
      created_at: new Date(),
    };

    return { user, token: createToken(user.user_id) };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const duplicateError = new Error("An account with this email already exists");
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  const [rows] = await pool.execute(
    `SELECT user_id, full_name, email, password_hash, date_of_birth, created_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email],
  );

  const user = rows[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!passwordMatches) {
    const error = new Error("Email or password is incorrect");
    error.statusCode = 401;
    throw error;
  }

  return { user: publicUser(user), token: createToken(user.user_id) };
}

export async function getUserById(userId) {
  const [rows] = await pool.execute(
    `SELECT user_id, full_name, email, date_of_birth, created_at
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );

  if (!rows[0]) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return publicUser(rows[0]);
}