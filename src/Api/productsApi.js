import api from "./api";

// Home (carousel)
export async function getHome(limit = 12, category = null) {
  const params = {
    mode: 'home',
    limit,
  };

  if (category) {
    params.category = category;
  }

  return api.get('/products', { params });
}

// All products (paginated)
export async function getAll({ page = 1, limit = 30, category = null } = {}) {
  const params = {
    mode: 'all',
    page,
    limit,
  };

  if (category) {
    params.category = category;
  }

  return api.get('/products', { params });
}

// Product details
export async function getById(id) {
  return api.get('/products', {
    params: { id },
  });
}
