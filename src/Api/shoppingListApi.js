import api from "./api";

export async function getAll(params) {
  return api.get("/shopping-list", { params });
}

export async function create(data) {
  return api.post("/shopping-list", data);
}

export async function update(data) {
  return api.put("/shopping-list", data);
}

export async function toggleDone(data) {
  return api.patch("/shopping-list", data);
}

export async function remove(id) {
  return api.delete("/shopping-list", { data: { id } });
}