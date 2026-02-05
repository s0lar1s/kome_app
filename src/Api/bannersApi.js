 import api from "./api";

 export async function getAll() {
    return api.get('/banners')
  }
  
export async function getOne(id) {
  return api.get('/banners', { params: { id } });
}

