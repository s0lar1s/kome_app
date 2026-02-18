 import api from "./api";

 export async function getAll() {
    return api.get('/shops')
  }
  
export async function getOne(id) {
  return api.get('/shops', { params: { id } });
}

