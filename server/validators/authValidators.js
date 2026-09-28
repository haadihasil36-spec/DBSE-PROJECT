const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validationError(details) {
  const error = new Error("Validation failed");
  error.statusCode = 400;
  error.details = details;
  return error;
}

export function validateRegisterInput(input = {}) {
  const fullName = typeof input.full_name === "string" ? input.full_name.trim() : "";
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const details = [];

  if (!fullName) details.push("full_name is required");
  if (fullName.length > 100) details.push("full_name must be 100 characters or fewer");
  if (!emailPattern.test(email)) details.push("email must be valid");
  if (email.length > 150) details.push("email must be 150 characters or fewer");
  if (password.length < 6) details.push("password must be at least 6 characters");

  if (details.length) throw validationError(details);
  return { fullName, email, password };
}

export function validateLoginInput(input = {}) {
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const details = [];

  if (!emailPattern.test(email)) details.push("email must be valid");
  if (!password) details.push("password is required");

  if (details.length) throw validationError(details);
  return { email, password };
}