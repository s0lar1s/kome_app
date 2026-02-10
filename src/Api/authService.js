import api from "./api.js";

export async function login(email, password) {
  const result = await api.post("/login", { email, password });
  return result.data;
}

export async function register(email, password, name) {
  const result = await api.post("/register", { email, password, name });
  return result.data;
}
