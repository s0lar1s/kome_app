import api from "./api";

export async function getMine() {
  return api.get("/client-cards");
}

export async function setCard(data) {
  return api.post("/client-cards", data);
}

export async function removeCard() {
  return api.delete("/client-cards");
}

export async function createVirtual(data) {
  return api.post("/client-cards/virtual", data);
}


