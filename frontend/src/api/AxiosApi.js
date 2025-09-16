import axios from "axios";

// const axiosApi = axios.create({
//   baseURL: "http://localhost:3001/api/",
//   withCredentials: true,
// });
const axiosApi = axios.create({
  baseURL: "https://tutedude-cpib.onrender.com",
  withCredentials: true,
});

export default axiosApi;