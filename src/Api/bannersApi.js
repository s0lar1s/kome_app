 import api from "./api";

 export async function getAll() {
    return api.get('/banners')
  }
  