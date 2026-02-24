import api from "./api";

// All promo codes (paginated)
export async function getAll({ page = 1, limit = 30, category = null } = {}) {
  const params = {
    mode: "all",
    page,
    limit,
  };

  if (category) {
    params.category = category;
  }

  return api.get("/promocodes", { params });
}

// Promo code details
export async function getById(id) {
  return api.get("/promocodes", {
    params: { id },
  });
}