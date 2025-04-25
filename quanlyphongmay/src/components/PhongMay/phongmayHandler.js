import Swal from 'sweetalert2';
import { message } from 'antd';
import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from './action'; // Adjust path if needed
// REMOVE useNavigate from here, it's passed in the factory function

// --- Hàm Factory tạo Handlers ---
export const createLabManagementHandlers = ({ dispatch, state, navigate, form, setAvatarImage }) => { // Add navigate here
    // ... (keep getToken, getRefreshToken, etc., isTokenExpired, refreshTokenApi) ...
    const getToken = () => localStorage.getItem("authToken");
    const getRefreshToken = () => localStorage.getItem("refreshToken");
    const getExpiresAtTimestamp = () => localStorage.getItem("expireAt");
    const getUsername = () => localStorage.getItem("username");
    // const getPassword = () => localStorage.getItem("password"); // Consider removing if not strictly needed
    const getUserRole = () => localStorage.getItem("userRole");
    const getMaTK = () => localStorage.getItem("maTK"); // Helper to get user ID

    const isTokenExpired = () => {
        const expiresAtTimestamp = getExpiresAtTimestamp();
        if (!expiresAtTimestamp) return true; // No timestamp means expired/not logged in
        // Check if timestamp is valid number before comparing
        const expiresAt = Number(expiresAtTimestamp);
        if (isNaN(expiresAt)) return true;
        return expiresAt <= Date.now();
    };

    // --- Refresh Token API ---
    const refreshTokenApi = async () => {
        // dispatch({ type: ACTIONS.REFRESH_TOKEN_START }); // Optional: track refresh attempts in state
        const refreshTokenValue = getRefreshToken();
        const maTK = getMaTK();
        if (!refreshTokenValue || !maTK) {
            console.error("Không có refresh token hoặc maTK.");
            // dispatch({ type: ACTIONS.REFRESH_TOKEN_ERROR, payload: "Không có refresh token." });
            return false;
        }

        try {
            // Use standard fetch for token refresh, no need for the wrapper here initially
            const response = await fetch('https://localhost:8080/refreshtoken?' + new URLSearchParams({
                refreshTokenValue: refreshTokenValue,
                maTK: maTK,
            }), { method: 'POST' });

            if (!response.ok) {
                if (response.status === 401 || response.status === 400) { // 400 might mean invalid refresh token
                    console.error("Lỗi làm mới token (401/400): Refresh token không hợp lệ hoặc đã hết hạn.", response.statusText);
                } else {
                    console.error("Lỗi làm mới token:", response.status, response.statusText);
                }
                // dispatch({ type: ACTIONS.REFRESH_TOKEN_ERROR, payload: `Lỗi làm mới token (${response.status})` });
                return false;
            }

            const data = await response.json();
            if (data.token && data.refreshToken && data.expiresAtTimestamp) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('expireAt', data.expiresAtTimestamp); // Ensure correct key
                // dispatch({ type: ACTIONS.REFRESH_TOKEN_SUCCESS }); // Optional
                console.log("Token làm mới thành công.");
                return true;
            } else {
                console.error("Dữ liệu phản hồi làm mới token không hợp lệ:", data);
                // dispatch({ type: ACTIONS.REFRESH_TOKEN_ERROR, payload: "Dữ liệu phản hồi làm mới token không hợp lệ." });
                return false;
            }

        } catch (error) {
            console.error("Lỗi network khi refresh token:", error);
            // dispatch({ type: ACTIONS.REFRESH_TOKEN_ERROR, payload: error.message }); // Optional
            return false;
        }
    };

    // --- fetchApi Wrapper ---
    const fetchApi = async (url, options = {}, isPublic = false) => {
        let currentToken = getToken();
        let isRefreshed = false;

        if (!isPublic && currentToken && isTokenExpired()) {
            console.log("Token hết hạn, thử làm mới...");
            const refreshSuccessful = await refreshTokenApi();
            if (refreshSuccessful) {
                console.log("Token làm mới thành công, tiếp tục request.");
                currentToken = getToken(); // Get the new token
                isRefreshed = true;
            } else {
                console.error("Không thể làm mới token, đăng xuất người dùng.");
                // Clear local storage and navigate
                localStorage.clear(); // Clear all items
                navigate('/login', { replace: true });
                Swal.fire({
                    title: "Phiên đăng nhập hết hạn",
                    text: "Không thể làm mới phiên. Vui lòng đăng nhập lại.",
                    icon: "warning",
                    timer: 3000,
                    showConfirmButton: false,
                });
                throw new Error("Unauthorized - Refresh Failed"); // Stop current API call
            }
        }

        if (!currentToken && !isPublic) {
            console.error("Không có token xác thực hoặc refresh thất bại:", url);
            // Navigate to login if no token for protected route (unless already navigated by refresh failure)
            if (!isRefreshed) { // Avoid double navigation if refresh failed
                localStorage.clear();
                navigate('/login', { replace: true });
                Swal.fire("Lỗi Xác thực", "Vui lòng đăng nhập.", "error");
            }
            throw new Error("Unauthorized");
        }

        const defaultHeaders = {
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            // Authorization header is preferred but sticking to query param for consistency
        };

        let urlWithToken = url;
        if (currentToken && !isPublic) {
            const separator = url.includes('?') ? '&' : '?';
            urlWithToken = `${url}${separator}token=${currentToken}`;
        }

        try {
            const response = await fetch(urlWithToken, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers },
            });

            // Handle 401 Unauthorized specifically - might indicate token became invalid *after* initial check/refresh
            if (response.status === 401 && !isPublic) {
                console.error("API trả về 401 Unauthorized (có thể token vừa hết hạn):", url);
                localStorage.clear();
                navigate('/login', { replace: true });
                Swal.fire({
                    title: "Lỗi Xác thực",
                    text: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
                    icon: "error",
                    timer: 3000,
                    showConfirmButton: false,
                });
                throw new Error("Unauthorized - Invalid Token");
            }

            if (!response.ok && response.status !== 204) {
                let errorMsg = `Lỗi HTTP ${response.status}`;
                let errorData = null;
                try {
                    errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || errorMsg;
                } catch (e) { /* Ignore JSON parsing error */ }
                console.error(`API Error (${response.status}) on ${url}: ${errorMsg}`, errorData);
                if (errorData && errorData.message) {
                    Swal.fire("Lỗi Máy Chủ", errorData.message, "error");
                } else {
                    Swal.fire("Lỗi", `Đã xảy ra lỗi phía máy chủ (HTTP ${response.status}).`, "error");
                }
                throw new Error(errorMsg);
            }

            return response.status === 204 ? null : response;

        } catch (networkError) {
            console.error(`Network or Fetch API Error on ${url}:`, networkError);
            // Avoid showing Swal for "Unauthorized" variations again
            const isAuthError = networkError.message.includes("Unauthorized");
            if (!isAuthError) {
                // Avoid double Swal if error was already thrown with a specific message
                if (!(networkError instanceof Error && networkError.message.startsWith('Lỗi HTTP'))) {
                    Swal.fire("Lỗi Mạng", `Không thể kết nối đến máy chủ hoặc đã xảy ra lỗi: ${networkError.message}`, "error");
                }
            }
            throw networkError; // Re-throw
        }
    };

    // --- Table & Search Handlers ---
    const handleSearchChange = (value) => {
        dispatch({ type: ACTIONS.SET_SEARCH, payload: value });
        if (!value) {
            dispatch({ type: ACTIONS.CLEAR_SEARCH });
        }
    };

    const handleColumnSelect = (column) => {
        dispatch({ type: ACTIONS.SET_SEARCH_COLUMN, payload: column });
        if (state.search && column) {
            performSearch(state.search, column);
        }
    };

    const performSearch = async (searchValue, searchColumn) => {
        if (!searchValue || !searchColumn) return;
        dispatch({ type: ACTIONS.SEARCH_START });
        try {
            const url = `https://localhost:8080/searchPhongMay?keyword=${searchColumn}:${encodeURIComponent(searchValue)}`;
            const response = await fetchApi(url);
            let results = [];
            if (response && response.status !== 204) {
                const data = await response.json();
                results = data.results || [];
            }
            dispatch({ type: ACTIONS.SEARCH_COMPLETE, payload: { results } });
        } catch (error) {
            dispatch({ type: ACTIONS.SEARCH_COMPLETE, payload: { error: error.message } });
        }
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        dispatch({ type: ACTIONS.SET_PAGINATION, payload: { current: newPagination.current, pageSize: newPagination.pageSize } });
        dispatch({ type: ACTIONS.SET_SORT, payload: (sorter.field && sorter.order ? { field: sorter.field, order: sorter.order } : {}) });
    };

    const onSelectChange = (newSelectedRowKeys) => {
        dispatch({ type: ACTIONS.SET_SELECTION, payload: newSelectedRowKeys });
    };

// --- Delete Handlers ---
    const deleteLabRoomApi = async (maPhong) => {
        dispatch({ type: ACTIONS.DELETE_START });
        try {
            const url = `https://localhost:8080/XoaPhongMay?maPhong=${maPhong}`;
            await fetchApi(url, { method: 'DELETE' });
            message.success(`Đã xóa phòng có mã ${maPhong}!`);
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { deletedIds: [maPhong] } });
        } catch (error) {
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { error: error.message, deletedIds: [] } });
        }
    };

    const handleDelete = (record) => {
        Swal.fire({
            title: "Xác nhận xóa", text: `Bạn có chắc muốn xóa phòng "${record.tenPhong}" (ID: ${record.maPhong})? Thao tác này không thể hoàn tác.`, icon: "warning",
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: "Xóa", cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteLabRoomApi(record.maPhong);
            }
        });
    };

    const deleteMultipleLabRoomsApi = async (maPhongList) => {
        dispatch({ type: ACTIONS.DELETE_START });
        try {
            const maPhongListString = maPhongList.join(",");
            const url = `https://localhost:8080/XoaNhieuPhongMay?maPhongList=${maPhongListString}`;
            await fetchApi(url, { method: 'DELETE' });
            message.success(`Đã xóa ${maPhongList.length} phòng đã chọn!`);
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { deletedIds: maPhongList } });
        } catch (error) {
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { error: error.message, deletedIds: [] } });
        }
    };

    const confirmDeleteMultiple = () => {
        const selectedKeys = state.selectedRowKeys;
        if (!selectedKeys || selectedKeys.length === 0) {
            message.warning("Vui lòng chọn ít nhất một phòng để xóa.");
            return;
        }
        Swal.fire({
            title: "Xác nhận xóa", text: `Bạn có chắc muốn xóa ${selectedKeys.length} phòng đã chọn? Thao tác này không thể hoàn tác.`, icon: "warning",
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: "Xóa", cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMultipleLabRoomsApi(selectedKeys);
            }
        });
    };

// --- QR Modal Handlers ---
    const fetchLabRoomsForQrCode = async () => {
        dispatch({ type: ACTIONS.SHOW_QR_MODAL_START });
        try {
            const url = `https://localhost:8080/phong-may-thong-ke`;
            const response = await fetchApi(url);
            if (!response) throw new Error("Không nhận được phản hồi từ API QR.");

            const data = await response.json();
            const qrDataString = JSON.stringify(data, null, 2);

            // Approximate check (UTF-8 encoded)
            const byteLength = new Blob([qrDataString]).size;
            if (byteLength > 2953) { // QR Code max capacity for Binary/Byte mode is 2953 bytes
                dispatch({ type: ACTIONS.SHOW_QR_MODAL_DATA_TOO_LONG_ERROR });
            } else {
                dispatch({ type: ACTIONS.SHOW_QR_MODAL_SUCCESS, payload: qrDataString });
            }
        } catch (error) {
            dispatch({ type: ACTIONS.SHOW_QR_MODAL_ERROR, payload: error.message });
        }
    };

    const handleCancelQrModal = () => dispatch({ type: ACTIONS.HIDE_QR_MODAL });


// --- Status Modal (Computers & Devices) Handlers ---
    const fetchComputers = async (maPhong) => {
        if (!maPhong) return;
        dispatch({ type: ACTIONS.LOAD_COMPUTERS_START });
        try {
            const url = `https://localhost:8080/DSMayTinhTheoPhong?maPhong=${maPhong}`;
            const response = await fetchApi(url);
            let data = [];
            if (response && response.status !== 204) data = await response.json();
            dispatch({ type: ACTIONS.LOAD_COMPUTERS_SUCCESS, payload: data || [] });
        } catch (error) {
            dispatch({ type: ACTIONS.LOAD_COMPUTERS_ERROR, payload: error.message });
        }
    };

    const fetchDeviceTypes = async () => {
        dispatch({ type: ACTIONS.LOAD_DEVICE_TYPES_START });
        try {
            const url = `https://localhost:8080/DSLoaiThietBi`;
            const response = await fetchApi(url);
            if (!response) throw new Error("Không nhận được phản hồi từ API loại thiết bị.");

            const data = await response.json();
            dispatch({ type: ACTIONS.LOAD_DEVICE_TYPES_SUCCESS, payload: data || [] });
        } catch (error) {
            dispatch({ type: ACTIONS.LOAD_DEVICE_TYPES_ERROR, payload: error.message });
        }
    };

    const fetchDevicesByType = async (maLoai) => {
        const maPhong = state.statusModal.roomId;
        if (!maPhong || !maLoai) return;
        dispatch({ type: ACTIONS.LOAD_DEVICES_BY_TYPE_START });
        try {
            const url = `https://localhost:8080/DSThietBiTheoPhong?maPhong=${maPhong}&maLoai=${maLoai}`;
            const response = await fetchApi(url);
            let data = [];
            if (response && response.status !== 204) data = await response.json();
            dispatch({ type: ACTIONS.LOAD_DEVICES_BY_TYPE_SUCCESS, payload: data || [] });
        } catch (error) {
            dispatch({ type: ACTIONS.LOAD_DEVICES_BY_TYPE_ERROR, payload: error.message });
        }
    };

    const showComputerStatusModal = (record) => {
        dispatch({ type: ACTIONS.SHOW_STATUS_MODAL, payload: record });
        fetchComputers(record.maPhong);
        fetchDeviceTypes();
    };

    const handleStatusModalClose = () => dispatch({ type: ACTIONS.HIDE_STATUS_MODAL });

    const handleTabChange = (key) => {
        dispatch({ type: ACTIONS.SET_STATUS_MODAL_TAB, payload: key });
        if (key !== 'computers') {
            const maLoai = parseInt(key, 10);
            if (!isNaN(maLoai)) {
                fetchDevicesByType(maLoai);
            }
        }
    };

// --- Computer Detail Modal Handlers ---
    const fetchComputerDetail = async (maMay) => {
        if (!maMay) return;
        dispatch({ type: ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_START });
        try {
            const url = `https://localhost:8080/MayTinh?maMay=${maMay}`;
            const response = await fetchApi(url);
            if (!response) throw new Error("Không nhận được phản hồi từ API chi tiết máy tính.");
            const data = await response.json();
            dispatch({ type: ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_SUCCESS, payload: data });
        } catch (error) {
            dispatch({ type: ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_ERROR, payload: error.message });
        }
    };

    const handleComputerDetailModalClose = () => dispatch({ type: ACTIONS.HIDE_COMPUTER_DETAIL_MODAL });

// --- Device Detail Modal Handlers ---
    const fetchDeviceDetail = async (maThietBi) => {
        if (!maThietBi) return;
        dispatch({ type: ACTIONS.SHOW_DEVICE_DETAIL_MODAL_START });
        try {
            const url = `https://localhost:8080/ThietBi?maThietBi=${maThietBi}`;
            const response = await fetchApi(url);
            if (!response) throw new Error("Không nhận được phản hồi từ API chi tiết thiết bị.");
            const data = await response.json();
            dispatch({ type: ACTIONS.SHOW_DEVICE_DETAIL_MODAL_SUCCESS, payload: data });
        } catch (error) {
            dispatch({ type: ACTIONS.SHOW_DEVICE_DETAIL_MODAL_ERROR, payload: error.message });
        }
    };

    const handleDeviceDetailModalClose = () => dispatch({ type: ACTIONS.HIDE_DEVICE_DETAIL_MODAL });


// --- Computer Update Modal Handlers ---
    const handleOpenUpdateModal = () => {
        if (!state.statusModal.computers || state.statusModal.computers.length === 0) {
            message.warning("Không có dữ liệu máy tính để cập nhật."); return;
        }
        const userRole = getUserRole();
        if (state.statusModal.roomStatus === 'Đang có tiết' && userRole === '3') {
            Swal.fire('Cảnh báo', 'Bạn không thể cập nhật trạng thái khi phòng máy đang có tiết!', 'warning');
            return;
        }
        dispatch({ type: ACTIONS.SHOW_COMPUTER_UPDATE_MODAL, payload: { userRole } });
    };

    const handleComputerUpdateModalClose = () => dispatch({ type: ACTIONS.HIDE_COMPUTER_UPDATE_MODAL });

    const toggleComputerAttendanceSelection = (maMay, computerStatus) => {
        const userRole = getUserRole();
        const roomStatusForUpdate = state.statusModal.roomStatus;
        dispatch({ type: ACTIONS.TOGGLE_COMPUTER_ATTENDANCE_SELECTION, payload: { key: maMay, userRole, roomStatusForUpdate, computerStatus } });
    };

    const toggleComputerReportBrokenSelection = (maMay, computerStatus) => {
        const userRole = getUserRole();
        const roomStatusForUpdate = state.statusModal.roomStatus;
        dispatch({ type: ACTIONS.TOGGLE_COMPUTER_REPORT_BROKEN_SELECTION, payload: { key: maMay, userRole, roomStatusForUpdate, computerStatus } });
    };

    const handleChangeAllBroken = () => {
        const userRole = getUserRole();
        const roomStatusForUpdate = state.statusModal.roomStatus;
        if (userRole === '3' && roomStatusForUpdate === 'Trống') {
            message.warning("Vai trò của bạn không thể dùng chức năng này trong phòng trống.");
            return;
        }
        dispatch({ type: ACTIONS.TOGGLE_CHANGE_ALL_BROKEN_ACTIVE });
    };

// --- Helper for actual status update API call (can be called from handler or notes page) ---
// NOTE: This function now requires the necessary context passed as arguments
// if called from the ReportBrokenNotes page.
    const performComputerStatusUpdate = async (
        computersToUpdateFrom, // The list of computers to base the update on (original list)
        attendanceKeys,
        brokenReportKeys,
        userRole,
        roomStatusForUpdate
    ) => {
        // Validate input if called externally
        if (!Array.isArray(computersToUpdateFrom) || !Array.isArray(attendanceKeys) || !Array.isArray(brokenReportKeys)) {
            console.error("Invalid input to performComputerStatusUpdate");
            message.error("Lỗi nội bộ: Dữ liệu cập nhật trạng thái không hợp lệ.");
            throw new Error("Lỗi nội bộ: Dữ liệu cập nhật trạng thái không hợp lệ."); // Throw to signal failure
        }

        const updates = computersToUpdateFrom
            .filter(comp => comp && (attendanceKeys.includes(comp.maMay) || brokenReportKeys.includes(comp.maMay))) // Added comp null check
            .map(comp => {
                let newStatus;
                if (brokenReportKeys.includes(comp.maMay)) {
                    newStatus = BROKEN_STATUS;
                } else if (userRole === '3' && roomStatusForUpdate === 'Trống' && comp.trangThai === BROKEN_STATUS && attendanceKeys.includes(comp.maMay)) {
                    newStatus = ACTIVE_STATUS;
                } else if (attendanceKeys.includes(comp.maMay) && comp.trangThai !== BROKEN_STATUS) {
                    newStatus = comp.trangThai === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
                } else {
                    newStatus = comp.trangThai;
                }

                // Final check
                if (comp.trangThai === BROKEN_STATUS && !(userRole === '3' && roomStatusForUpdate === 'Trống' && attendanceKeys.includes(comp.maMay))) {
                    newStatus = BROKEN_STATUS;
                }

                return { maMay: comp.maMay, newStatus: newStatus };
            })
            .filter(upd => {
                const originalComp = computersToUpdateFrom.find(c => c && c.maMay === upd.maMay); // Added c null check
                return originalComp && originalComp.trangThai !== upd.newStatus;
            });

        if (updates.length === 0) {
            console.log("Không có thay đổi trạng thái thực tế nào được phát hiện.");
            return { success: true, message: "Không có thay đổi trạng thái nào cần áp dụng." }; // Indicate success but no action
        }

        // Note: The START/COMPLETE actions are dispatched by the *caller* (handleCompleteComputerUpdate or ReportBrokenNotes)
        // to manage the spinner state correctly in the originating UI context.

        try {
            const params = new URLSearchParams();
            updates.forEach(upd => {
                // Add checks for undefined values before appending
                if (upd.maMay !== undefined && upd.newStatus !== undefined) {
                    params.append('maMayTinhList', upd.maMay);
                    params.append('trangThaiList', upd.newStatus);
                } else {
                    console.warn("Skipping invalid update entry:", upd);
                }
            });

            // Ensure params has entries
            if (!params.toString()) {
                console.log("Không có dữ liệu cập nhật trạng thái hợp lệ sau khi lọc.");
                return { success: true, message: "Không có thay đổi trạng thái hợp lệ." };
            }

            const url = `https://localhost:8080/CapNhatTrangThaiNhieuMay`;
            await fetchApi(`${url}?${params.toString()}`, { method: "PUT" });

            // Return success status, let the caller handle UI updates (message, dispatch, refresh)
            return { success: true, count: updates.length };

        } catch (error) {
            // fetchApi shows Swal/error message
            // Re-throw the error so the caller knows the update failed
            throw error;
        }
    };

// --- *** MODIFIED: Handle completion trigger from Computer Update Modal *** ---
    const handleCompleteComputerUpdate = async () => {
        const { attendanceKeys, brokenReportKeys } = state.computerUpdateModal;
        const userRole = getUserRole();
        const { computers: originalComputerList, roomId, roomName, roomStatus } = state.statusModal; // Get necessary context

        if (attendanceKeys.length === 0 && brokenReportKeys.length === 0) {
            message.info("Chưa chọn máy tính nào để thay đổi trạng thái."); return;
        }
        if (userRole === '3' && roomStatus === 'Đang có tiết') {
            Swal.fire('Cảnh báo', 'Bạn không thể cập nhật trạng thái khi phòng máy đang có tiết!', 'warning');
            return;
        }

        // Set loading state for the modal
        dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_START });

        try {
            // --- Role 2 Check for Broken Reports ---
            if (userRole === '2' && brokenReportKeys.length > 0) {
                const computersToReportDetails = originalComputerList
                    .filter(comp => comp && brokenReportKeys.includes(comp.maMay)) // Added comp null check
                    .map(comp => ({ maMay: comp.maMay, tenMay: comp.tenMay, moTa: comp.moTa })); // Pass necessary info

                if (computersToReportDetails.length > 0) {
                    console.log("Vai trò 2 báo hỏng. Điều hướng sang trang ghi chú.");

                    // Prepare state for navigation
                    const navigationState = {
                        computersToReport: computersToReportDetails,
                        roomId: roomId,
                        roomName: roomName,
                        // Pass the keys and context needed for the *final* status update on the notes page
                        attendanceKeys: attendanceKeys,
                        brokenReportKeys: brokenReportKeys,
                        userRole: userRole,
                        roomStatusForUpdate: roomStatus,
                        originalComputerList: originalComputerList // Pass the original list
                    };

                    // Navigate to the new notes page
                    navigate(`/report-notes/${roomId}`, { state: navigationState, replace: false }); // Don't replace history yet

                    // Important: Don't dispatch COMPLETE here, the modal closes implicitly on navigation.
                    // The loading state will reset if the user navigates back or when the component unmounts.
                    // Alternatively, explicitly close the modal *before* navigation if preferred.
                    dispatch({ type: ACTIONS.HIDE_COMPUTER_UPDATE_MODAL }); // Close modal before navigating
                    return; // Stop further execution in this handler
                } else {
                    console.warn("Có mã máy báo hỏng nhưng không tìm thấy chi tiết máy tính tương ứng.");
                    // Fall through to normal update if details are missing (unlikely)
                }
            }

            // --- Normal Update (Not Role 2 reporting broken, or no broken items) ---
            console.log("Cập nhật trạng thái trực tiếp.");
            const updateResult = await performComputerStatusUpdate(
                originalComputerList,
                attendanceKeys,
                brokenReportKeys,
                userRole,
                roomStatus
            );

            if (updateResult.success) {
                if (updateResult.count > 0) {
                    message.success(`Đã cập nhật trạng thái ${updateResult.count} máy tính!`);
                } else {
                    message.info(updateResult.message || "Không có thay đổi trạng thái nào được áp dụng.");
                }
                // Refresh the computer list in the (now hidden) status modal state for consistency
                if (roomId) fetchComputers(roomId);
            }
            // Always dispatch COMPLETE on success or no-op to close modal/reset spinner
            dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE });

        } catch (error) {
            // Error handled by performComputerStatusUpdate (Swal)
            // Dispatch COMPLETE to reset spinner, modal stays open showing the error implicitly via Swal
            dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE });
        }
    };


// --- Device Update Modal Handlers ---
    const handleOpenDeviceUpdateModal = (maLoai, tenLoai) => {
        if (!state.statusModal.currentDevices || state.statusModal.currentDevices.length === 0) {
            message.warning(`Không có dữ liệu ${tenLoai} để cập nhật.`); return;
        }
        const userRole = getUserRole();
        if (state.statusModal.roomStatus !== 'Trống' && userRole === '3') {
            Swal.fire('Cảnh báo', 'Bạn không thể cập nhật trạng thái thiết bị khi phòng máy đang có tiết!', 'warning');
            return;
        }
        dispatch({ type: ACTIONS.SHOW_DEVICE_UPDATE_MODAL, payload: { maLoai, tenLoai } });
    };

    const handleDeviceUpdateModalClose = () => dispatch({ type: ACTIONS.HIDE_DEVICE_UPDATE_MODAL });

    const toggleDeviceUpdateSelection = (maThietBi, deviceStatus) => {
        dispatch({ type: ACTIONS.TOGGLE_DEVICE_UPDATE_SELECTION, payload: { key: maThietBi, deviceStatus } });
    };

    const toggleDeviceReportBrokenSelection = (maThietBi, deviceStatus) => {
        dispatch({ type: ACTIONS.TOGGLE_DEVICE_REPORT_BROKEN_SELECTION, payload: { key: maThietBi, deviceStatus } });
    };

    const handleCompleteDeviceUpdate = async () => {
        // --- Get State and User Info ---
        const { selectedKeys, brokenReportKeys, currentType } = state.deviceUpdateModal; // Include currentType
        const userRole = getUserRole(); // Assuming this function correctly returns '1', '2', or '3'
        // Get context from statusModal: full list of devices for the current type, room details
        const { currentDevices: originalDeviceList, roomId, roomName, roomStatus } = state.statusModal;

        // --- Initial Checks ---
        if (selectedKeys.length === 0 && brokenReportKeys.length === 0) {
            message.info("Chưa chọn thiết bị nào để thay đổi trạng thái.");
            return;
        }
        // Role 3 cannot update devices during class (adjust if needed)
        if (roomStatus === 'Đang có tiết' && userRole === '3') {
            Swal.fire('Cảnh báo', `Bạn không thể cập nhật trạng thái ${currentType.tenLoai || 'thiết bị'} khi phòng máy đang có tiết!`, 'warning');
            return;
        }

        // --- Set Loading State ---
        dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_START }); // Use specific action for devices

        try {
            // --- Role 2 Reporting Broken Devices: Navigate to Report Notes ---
            if (userRole === '2' && brokenReportKeys.length > 0) {

                // Filter and map the details of devices marked as broken
                const devicesToReportDetails = originalDeviceList
                    .filter(dev => dev && brokenReportKeys.includes(dev.maThietBi))
                    .map(dev => ({
                        maThietBi: dev.maThietBi,
                        tenThietBi: dev.tenThietBi,
                        moTa: dev.moTa, // Include any other relevant info needed by ReportBrokenNotes
                        // You might not need the full loaiThietBi object, deviceTypeName is passed separately
                    }));

                if (devicesToReportDetails.length > 0) {
                    console.log("Vai trò 2 báo hỏng thiết bị. Điều hướng sang trang ghi chú.");

                    // --- Construct Navigation State ---
                    // This state object passes all necessary info to the ReportBrokenNotes component
                    const navigationState = {
                        reportType: 'device', // Crucial: Identify the type of report
                        itemsToReport: devicesToReportDetails, // The list of broken devices with their details
                        originalItemsFullList: originalDeviceList, // The complete original list of devices *of this type*
                        roomId: roomId,
                        roomName: roomName,
                        deviceTypeName: currentType.tenLoai, // Name of the device type (e.g., "Máy chiếu")
                        deviceTypeId: currentType.maLoai,     // ID of the device type
                        // Pass the initial selections made in this modal:
                        initialSelectedKeys: selectedKeys,        // For non-broken toggles/fixes
                        initialBrokenReportKeys: brokenReportKeys,// For broken items
                        // Pass context needed for final update logic on the notes page:
                        userRole: userRole,
                        roomStatusForUpdate: roomStatus,
                    };

                    // --- Navigate ---
                    // Ensure '/phongmay/report-broken-notes' is the correct route for your unified notes component
                    navigate(`/reportdevice-notes/${roomId}`, { state: navigationState, replace: false }); // Don't replace history yet


                    // --- Close Current Modal ---
                    // Close the device update modal *before* navigating away
                    dispatch({ type: ACTIONS.HIDE_DEVICE_UPDATE_MODAL }); // Use the correct action type for hiding this specific modal
                    return; // Stop execution in this handler, as navigation will occur
                } else {
                    // Edge case: brokenReportKeys had IDs, but no matching devices found in the list
                    console.warn("Có mã thiết bị báo hỏng nhưng không tìm thấy chi tiết thiết bị tương ứng.");
                    // Decide whether to fall through to direct update or show an error. Falling through might be okay.
                }
            }

            // --- Direct Update Path (Not Role 2 reporting broken, or no broken items reported) ---
            console.log("Cập nhật trạng thái thiết bị trực tiếp.");

            // Calculate updates based on selectedKeys and brokenReportKeys (if any, for non-Role 2)
            // This logic should correctly determine the final status based on role, room status, and selections
            const updates = originalDeviceList // Use originalDeviceList for accurate comparison
                .filter(dev => dev) // Ensure device object exists
                .map(dev => {
                    let newStatus = dev.trangThai; // Start with the original status

                    // Priority 1: Marked as broken (by any role *except* Role 2 who navigates away)
                    // Or if already broken and not being fixed.
                    if (brokenReportKeys.includes(dev.maThietBi)) {
                        // If Role 2, this block wouldn't be reached for broken items.
                        // For other roles, marking broken takes precedence.
                        newStatus = BROKEN_STATUS;
                    }
                    // Priority 2: Role 3 fixing a BROKEN device in an empty room
                    else if (userRole === '3' && roomStatus === 'Trống' && dev.trangThai === BROKEN_STATUS && selectedKeys.includes(dev.maThietBi)) {
                        newStatus = ACTIVE_STATUS;
                    }
                    // Priority 3: Toggling ACTIVE <-> INACTIVE (if selected and not currently broken)
                    else if (selectedKeys.includes(dev.maThietBi) && dev.trangThai !== BROKEN_STATUS) {
                        newStatus = dev.trangThai === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
                    }
                    // Else: status remains unchanged (newStatus = dev.trangThai)

                    // Final safeguard: If a device was originally broken, it cannot become INACTIVE directly here.
                    // It must either stay BROKEN or be explicitly fixed to ACTIVE by Role 3.
                    if (dev.trangThai === BROKEN_STATUS && newStatus === INACTIVE_STATUS) {
                        newStatus = BROKEN_STATUS; // Revert unintended change
                    }
                    // Also ensure BROKEN status persists if marked broken and not fixed
                    if (dev.trangThai === BROKEN_STATUS && !(userRole === '3' && roomStatus === 'Trống' && selectedKeys.includes(dev.maThietBi)) ) {
                        // If it started broken and wasn't explicitly fixed by Role 3, it stays broken,
                        // regardless of whether it was in `selectedKeys` or `brokenReportKeys` this time.
                        newStatus = BROKEN_STATUS;
                    }


                    return { maThietBi: dev.maThietBi, newStatus: newStatus };
                })
                .filter(upd => {
                    // Only include updates where the status actually changes
                    const originalDev = originalDeviceList.find(d => d && d.maThietBi === upd.maThietBi);
                    return originalDev && originalDev.trangThai !== upd.newStatus;
                });

            // --- Perform API Call if Updates Exist ---
            if (updates.length === 0) {
                message.info(`Không có thay đổi trạng thái ${currentType.tenLoai || 'thiết bị'} nào được áp dụng.`);
                dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE }); // Close modal, reset state
                return;
            }

            const params = new URLSearchParams();
            updates.forEach(upd => {
                if (upd.maThietBi !== undefined && upd.newStatus !== undefined) {
                    params.append('maThietBiList', upd.maThietBi);
                    params.append('trangThaiList', upd.newStatus);
                }
            });

            if (!params.toString()) {
                message.info("Không có dữ liệu cập nhật hợp lệ.");
                dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE });
                return;
            }

            // Assuming fetchApi handles auth, errors, and Swal messages
            // Ensure the URL is correct for updating multiple devices
            const url = `https://localhost:8080/CapNhatTrangThaiNhieuThietBi`;
            await fetchApi(`${url}?${params.toString()}`, { method: "PUT" }, false, navigate); // Pass navigate

            // --- Success Handling ---
            message.success(`Đã cập nhật trạng thái ${updates.length} ${currentType.tenLoai || 'thiết bị'}!`);
            dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE }); // Close modal, reset state

            // --- Refresh Data ---
            // Refresh the list of devices for the specific type that was just updated
            const maLoaiToRefresh = currentType.maLoai;
            if (maLoaiToRefresh && roomId) { // Check if we have the type ID and room ID
                fetchDevicesByType(roomId, maLoaiToRefresh); // Call your function to refresh the list
            }

        } catch (error) {
            // Error messages are likely shown by fetchApi via Swal
            console.error(`Lỗi khi cập nhật trạng thái ${currentType.tenLoai || 'thiết bị'}:`, error);
            // Ensure loading state is reset even on error
            dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE });
            // Modal might stay open if fetchApi error occurred, allowing user to retry or cancel
        }
    };

// --- User Profile Handlers ---
    const checkUserAndShowModal = async () => {
        dispatch({ type: ACTIONS.LOAD_USER_PROFILE_START });
        try {
            const username = getUsername();
            if (!username) throw new Error("Không tìm thấy tên đăng nhập.");

            const params = new URLSearchParams({ username });
            const url = `https://localhost:8080/checkUser?${params.toString()}`;
            // checkUser often doesn't need auth if it's just checking existence/basic info
            const response = await fetchApi(url, {}, true); // Assuming public or adjust isPublic
            if (!response) throw new Error("Không nhận được phản hồi từ API kiểm tra người dùng.");

            const responseData = await response.json();

            if (responseData.status === "success" && responseData.data) {
                const profileData = responseData.data;
                dispatch({ type: ACTIONS.LOAD_USER_PROFILE_SUCCESS, payload: profileData });

                if (form) {
                    form.setFieldsValue({
                        tenDangNhap: profileData.tenDangNhap,
                        email: profileData.email,
                        image: profileData.image ? [{ // Format for Antd Upload
                            uid: '-1', // Static UID for existing image
                            name: 'avatar.png', // Placeholder name
                            status: 'done',
                            url: profileData.image.split(' ').filter(url => url && url.startsWith('http')).pop(), // Get last valid URL
                        }] : [], // Empty array if no image
                    });
                }
                if (setAvatarImage) { // Update header avatar too
                    setAvatarImage(profileData.image ? profileData.image.split(' ').filter(url => url && url.startsWith('http')).pop() : null);
                }

            } else {
                throw new Error(responseData.message || "Lỗi khi tải dữ liệu hồ sơ");
            }
        } catch (error) {
            dispatch({ type: ACTIONS.LOAD_USER_PROFILE_ERROR, payload: error.message });
            // Close modal on load error? Or keep open to show error? Let's keep it open.
            message.error(`Lỗi tải hồ sơ: ${error.message}`); // Show direct message
        }
    };

    const handleUserProfileUpdate = async () => {
        if (!form) return;

        try {
            const values = await form.validateFields();
            const currentToken = getToken();
            // No need to check token here, fetchApi inside this function will handle it if needed for other calls,
            // but the main update call below uses standard fetch with manual token. Check manually.
            if (!currentToken && !isTokenExpired()) { // Check if token exists and is not expired
                console.log("Token hết hạn trước khi cập nhật hồ sơ, thử làm mới...");
                const refreshed = await refreshTokenApi();
                if (!refreshed) throw new Error("Unauthorized - Refresh Failed");
                // currentToken = getToken(); // Get the new token if needed below (it is for the fetch URL)
            }
            // Re-check after potential refresh
            const finalToken = getToken();
            if (!finalToken) throw new Error("Unauthorized - No Token");


            dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_START });

            const formData = new FormData();
            formData.append("maTK", state.userProfileModal.profile.maTK);
            formData.append("tenDangNhap", values.tenDangNhap);
            formData.append("email", values.email);

            // Handle file upload: Antd Form stores file info in values.image
            if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
                // New file uploaded
                formData.append("imageFile", values.image[0].originFileObj);
            } else if (!values.image || values.image.length === 0) {
                // Image was removed in the form, signal backend to potentially clear it
                // Option 1: Send a specific flag (if backend supports it)
                // formData.append("clearImage", "true");
                // Option 2: Send an empty value for the file (might not work reliably)
                // formData.append("imageFile", ""); // Or just don't append imageFile
                // Option 3: Explicitly send the existing URL to keep it (if backend defaults to clearing if no file)
                // if (state.userProfileModal.profile.image) { formData.append("existingImageUrl", state.userProfileModal.profile.image); }
                // *** Let's assume backend keeps image if `imageFile` is not sent ***
            } // Else: Existing image file is shown but not changed, do nothing for imageFile


            formData.append("maQuyen", state.userProfileModal.profile.quyen);

            // Use standard fetch for FormData, add token MANUALLY to URL
            const response = await fetch(`https://localhost:8080/CapNhatTaiKhoan?token=${finalToken}`, {
                method: "PUT",
                body: formData,
            });

            // Manual error handling
            if (response.status === 401) throw new Error("Unauthorized");
            if (!response.ok) {
                let errorMsg = `Lỗi HTTP ${response.status}`;
                try { errorMsg = (await response.json()).message || errorMsg; } catch (e) {}
                throw new Error(errorMsg);
            }

            const updatedUser = await response.json();
            message.success("Cập nhật hồ sơ thành công!");
            dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_SUCCESS, payload: updatedUser });

            if (setAvatarImage) {
                let updatedImageUrl = null;
                if (updatedUser.image) {
                    const urls = updatedUser.image.split(' ').filter(url => url && url.startsWith('http'));
                    updatedImageUrl = urls.length > 0 ? urls[urls.length - 1] : null;
                }
                // If image was removed, updatedUser.image should be null/empty from backend
                else if (!values.image || values.image.length === 0) {
                    updatedImageUrl = null; // Explicitly clear avatar if removed
                }
                // If existing image kept, updatedUser.image should still have the old URL
                else {
                    updatedImageUrl = state.userProfileModal.image; // Keep old image if no change
                }
                setAvatarImage(updatedImageUrl);
            }

        } catch (errorInfo) {
            if (errorInfo.errorFields) {
                console.log("Lỗi xác thực form:", errorInfo);
                message.error("Vui lòng kiểm tra lại thông tin đã nhập.");
                dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_ERROR, payload: "Lỗi xác thực form." });
            } else {
                console.error("Lỗi cập nhật hồ sơ:", errorInfo);
                // Avoid duplicate Swal for Unauthorized variations
                if (!errorInfo.message.includes("Unauthorized")) {
                    Swal.fire("Lỗi", `Cập nhật hồ sơ thất bại: ${errorInfo.message}`, "error");
                }
                dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_ERROR, payload: errorInfo.message });
            }
        }
    };

    const handleUserProfileModalCancel = () => dispatch({ type: ACTIONS.HIDE_USER_PROFILE_MODAL });


// --- Logout Handler ---
    const handleLogout = async () => {
        try {
            const url = `https://localhost:8080/logout`;
            await fetchApi(url, { method: 'POST' });
            // message.success("Đã gửi yêu cầu đăng xuất!"); // Optional feedback
        } catch (error) {
            // Log non-auth errors, but proceed with client logout
            if (!error.message.includes("Unauthorized")) {
                console.error("Lỗi API đăng xuất (không nghiêm trọng):", error);
                message.warning("Lỗi liên hệ máy chủ đăng xuất, bạn sẽ được đăng xuất khỏi trình duyệt.", 3);
            }
            // If error was auth-related, fetchApi already handled navigation/Swal
        } finally {
            // Always clear local storage and navigate
            localStorage.clear();
            navigate("/login", { replace: true });
            message.success("Đăng xuất thành công!", 2);
        }
    };

// --- Return all handlers ---
    return {
        // Search & Table
        handleSearchChange, handleColumnSelect, performSearch, handleTableChange, onSelectChange,
        // Delete
        handleDelete, confirmDeleteMultiple,
        // QR
        fetchLabRoomsForQrCode, handleCancelQrModal,
        // Status Modal
        showComputerStatusModal, handleStatusModalClose, handleTabChange,
        fetchComputers, fetchDeviceTypes, fetchDevicesByType,
        // Computer Update Modal
        handleOpenUpdateModal, handleComputerUpdateModalClose,
        toggleComputerAttendanceSelection, toggleComputerReportBrokenSelection,
        handleChangeAllBroken, handleCompleteComputerUpdate, // Modified trigger
        // Device Update Modal
        handleOpenDeviceUpdateModal, handleDeviceUpdateModalClose,
        toggleDeviceUpdateSelection, toggleDeviceReportBrokenSelection,
        handleCompleteDeviceUpdate,
        // *** NO Report Notes Modal Handlers needed here ***
        // Detail Modals
        fetchComputerDetail, handleComputerDetailModalClose,
        fetchDeviceDetail, handleDeviceDetailModalClose,
        // User Profile
        checkUserAndShowModal, handleUserProfileUpdate, handleUserProfileModalCancel,
        // Auth
        handleLogout,
        isTokenExpired,
        // Expose fetchApi and performComputerStatusUpdate if needed by ReportBrokenNotes
        fetchApi,
        performComputerStatusUpdate,
    };
};