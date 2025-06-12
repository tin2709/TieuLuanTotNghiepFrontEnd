// // src/features/CaThucHanh/caThucHanhHandler.js
// import Swal from 'sweetalert2';
// import { ACTIONS } from './action';
//
// export const createCaThucHanhHandlers = ({ dispatch, state, navigate }) => {
//     // --- Helpers ---
//     const getToken = () => localStorage.getItem("authToken");
//
//     /**
//      * Helper function to make authenticated API calls.
//      */
//     const fetchApi = async (url, options = {}, isPublic = false) => {
//         const token = getToken();
//         if (!token && !isPublic) {
//             console.error("Authentication token not found for protected route:", url);
//             throw new Error("Unauthorized");
//         }
//
//         const defaultHeaders = {
//             'Content-Type': 'application/json',
//         };
//
//         let urlWithToken = url;
//         if (token && !isPublic) {
//             urlWithToken = url.includes('?') ? `${url}&token=${token}` : `${url}?token=${token}`;
//         }
//
//         try {
//             const response = await fetch(urlWithToken, {
//                 ...options,
//                 headers: { ...defaultHeaders, ...options.headers },
//             });
//
//             if (response.status === 401 && !isPublic) {
//                 console.error("API returned 401 Unauthorized:", url);
//                 Swal.fire({
//                     title: "Lỗi Xác thực",
//                     text: "Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
//                     icon: "error",
//                     timer: 3000,
//                     showConfirmButton: false,
//                     willClose: () => {
//                         localStorage.removeItem('authToken');
//                         localStorage.removeItem('username');
//                         localStorage.removeItem('userRole');
//                         localStorage.removeItem('password');
//                         navigate('/login', { replace: true });
//                     }
//                 });
//                 throw new Error("Unauthorized");
//             }
//
//             if (!response.ok && response.status !== 204) {
//                 let errorMsg = `Lỗi HTTP ${response.status}`;
//                 try {
//                     const errorData = await response.json();
//                     errorMsg = errorData.message || errorData.error || errorMsg;
//                 } catch (e) { }
//                 console.error(`API Error (${response.status}) on ${url}: ${errorMsg}`);
//                 throw new Error(errorMsg);
//             }
//
//             return response;
//
//         } catch (networkError) {
//             console.error(`Network or Fetch API Error on ${url}:`, networkError);
//             if (networkError.message !== "Unauthorized") {
//                 Swal.fire("Lỗi Mạng", `Không thể kết nối đến máy chủ hoặc đã xảy ra lỗi: ${networkError.message}`, "error");
//             }
//             throw networkError;
//         }
//     };
//
//     // --- Table Handlers ---
//     const handleTableChange = (newPagination, filters, sorter) => {
//         dispatch({ type: ACTIONS.SET_PAGINATION, payload: { current: newPagination.current, pageSize: newPagination.pageSize } });
//         dispatch({ type: ACTIONS.SET_SORT, payload: (sorter.field && sorter.order ? { field: sorter.field, order: sorter.order } : {}) });
//     };
//
//
//     // --- Load Data Handler ---
//     const loadCaThucHanhData = async () => {
//         dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: null }); // Clear previous error
//         dispatch({ type: ACTIONS.TABLE_LOADING, payload: true }); // Start loading
//         try {
//             const url = `https://localhost:8080/DSCaThucHanh`;
//             const response = await fetchApi(url);
//             let data = [];
//             if (response.status !== 204) data = await response.json();
//             dispatch({ type: ACTIONS.LOAD_DATA_SUCCESS, payload: data });
//         } catch (error) {
//             dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: error.message });
//         } finally {
//             dispatch({ type: ACTIONS.TABLE_LOADING, payload: false }); // End loading regardless of success or error
//         }
//     };
//
//
//     return {
//         handleTableChange,
//         loadCaThucHanhData,
//     };
// };