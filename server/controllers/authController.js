import {
  getUserById,
  loginUser,
  registerUser,
} from "../services/authService.js";
import {
  validateLoginInput,
  validateRegisterInput,
} from "../validators/authValidators.js";

export async function register(request, response, next) {
  try {
    const input = validateRegisterInput(request.body);
    const result = await registerUser(input);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const input = validateLoginInput(request.body);
    const result = await loginUser(input);
    response.json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(request, response, next) {
  try {
    const user = await getUserById(request.user.userId);
    response.json({ user });
  } catch (error) {
    next(error);
  }
}