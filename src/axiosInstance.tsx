import axios, { AxiosInstance } from "axios";
import { message } from "antd";

// Function to get the JWT token from wherever it's stored
const getToken = (): string | null => {
  // For example, if you store it in localStorage
  return localStorage.getItem("jwtToken");
};

// https://grand-mellienum-surveys-backend.onrender.com
// Create an Axios instance
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Replace with your API base URL
});

// Add a request interceptor to include the JWT token if it exists
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Handle the error
    return Promise.reject(error);
  }
);

// Global error toast in Arabic — several pages swallow request errors
// (console.error only), so staff used to click Save, see nothing, and
// assume it worked. Every failed request now explains itself.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    let text = "حدث خطأ غير متوقع — لم يتم الحفظ، حاول مرة أخرى";

    if (!error?.response) {
      text = "تعذر الاتصال بالخادم — تحقق من الإنترنت وحاول مجدداً";
    } else if (status === 413) {
      text =
        "الصورة كبيرة جداً — الحد الأقصى 10 ميغابايت. صغّر الصورة وحاول مجدداً";
    } else if (status === 401 || status === 403) {
      const isLogin = String(error.config?.url || "").includes("/login");
      text = isLogin
        ? "بيانات الدخول غير صحيحة"
        : "انتهت صلاحية الجلسة — سجّل الدخول من جديد";
    } else if (status === 404) {
      text = "العنصر غير موجود — ربما حُذف من جهاز آخر";
    } else if (status === 400) {
      const serverMsg = error.response.data?.message;
      const detail = Array.isArray(serverMsg) ? serverMsg.join("، ") : serverMsg;
      text = detail
        ? `البيانات المدخلة غير صالحة: ${detail}`
        : "البيانات المدخلة غير صالحة — راجع الحقول وحاول مجدداً";
    } else if (status >= 500) {
      text = "خطأ في الخادم — لم يتم الحفظ، حاول مرة أخرى بعد قليل";
    }

    message.error(text, 6);
    return Promise.reject(error);
  }
);

export default axiosInstance;
