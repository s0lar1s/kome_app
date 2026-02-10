 import api from "./api";

 export async function getAll() {
    return api.get('/brochures')
  }
  
export async function getOne(id) {
  return api.get('/brochures', { params: { id } });
}

