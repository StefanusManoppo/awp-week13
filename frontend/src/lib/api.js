import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/",
  withCredentials: true, // Cookie ikut terkirim
});

export default api;