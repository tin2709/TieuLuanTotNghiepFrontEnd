// phongmayHandler.js
import Swal from 'sweetalert2';
import { message } from 'antd';
import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from './action';
// --- Hàm Factory tạo Handlers ---
export const createLabManagementHandlers = ({ dispatch, state, navigate, form, setAvatarImage }) => {
// --- Helpers ---
    const getToken = () => localStorage.getItem("authToken");
    const getUsername = () => localStorage.getItem("username");
    const getPassword = () => localStorage.getItem("password");

    /**
     * Helper function to make authenticated API calls.
     * Automatically adds token and handles 401 errors.
     * Throws errors for other non-OK statuses.
     * @param {string} url API endpoint URL
     * @param {object} options Fetch options (method, headers, body, etc.)
     * @param {boolean} options.isPublic Set true for non-authenticated endpoints
     * @returns {Promise<Response>} The fetch Response object
     */
    const fetchApi = async (url, options = {}, isPublic = false) => {
        const token = getToken();
        if (!token && !isPublic) {
            console.error("Authentication token not found for protected route:", url);
            // Dispatch an error or handle globally? For now, throw.
            throw new Error("Unauthorized"); // Throw specific error for handlers to catch
        }

        const defaultHeaders = {
            'Content-Type': 'application/json',
            // Example: 'Authorization': `Bearer ${token}` // If using Bearer token
        };

        // Add token to URL if API expects it (adjust based on your backend)
        let urlWithToken = url;
        if (token && !isPublic) {
            urlWithToken = url.includes('?') ? `${url}&token=${token}` : `${url}?token=${token}`;
        }

        try {
            const response = await fetch(urlWithToken, {
                ...options,
                headers: { ...defaultHeaders, ...options.headers },
            });

            if (response.status === 401 && !isPublic) {
                console.error("API returned 401 Unauthorized:", url);
                Swal.fire({ // Show Swal notification for 401
                    title: "Lỗi Xác thực",
                    text: "Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
                    icon: "error",
                    timer: 3000,
                    showConfirmButton: false,
                    willClose: () => {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('username');
                        localStorage.removeItem('userRole');
                        localStorage.removeItem('password'); // Clear sensitive data
                        navigate('/login', { replace: true });
                    }
                });
                throw new Error("Unauthorized"); // Throw to stop further processing in the handler
            }

            if (!response.ok && response.status !== 204) { // Handle other HTTP errors (excluding 204 No Content)
                let errorMsg = `Lỗi HTTP ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorData.error || errorMsg; // Try common error fields
                } catch (e) { /* Ignore JSON parsing error */ }
                console.error(`API Error (${response.status}) on ${url}: ${errorMsg}`);
                throw new Error(errorMsg);
            }

            return response; // Return the response object for successful calls or 204

        } catch (networkError) {
            // Catch network errors (fetch failed) or errors thrown above
            console.error(`Network or Fetch API Error on ${url}:`, networkError);
            // Re-throw the error (could be "Unauthorized" or other error message)
            // Avoid showing Swal for "Unauthorized" again as it's handled above
            if (networkError.message !== "Unauthorized") {
                Swal.fire("Lỗi Mạng", `Không thể kết nối đến máy chủ hoặc đã xảy ra lỗi: ${networkError.message}`, "error");
            }
            throw networkError; // Ensure the calling handler knows about the failure
        }
    };


// --- Table & Search Handlers ---
    const handleSearchChange = (value) => {
        dispatch({ type: ACTIONS.SET_SEARCH, payload: value });
        if (!value) dispatch({ type: ACTIONS.CLEAR_SEARCH }); // useEffect handles UPDATE_DISPLAYED_DATA
    };

    const handleColumnSelect = (column) => {
        dispatch({ type: ACTIONS.SET_SEARCH_COLUMN, payload: column });
        if (state.search && column) performSearch(state.search, column);
    };

    const performSearch = async (searchValue, searchColumn) => {
        dispatch({ type: ACTIONS.SEARCH_START });
        try {
            const url = `https://localhost:8080/searchPhongMay?keyword=${searchColumn}:${searchValue}`;
            const response = await fetchApi(url);
            let results = [];
            if (response.status !== 204) results = (await response.json()).results || [];
            dispatch({ type: ACTIONS.SEARCH_COMPLETE, payload: { results } });
        } catch (error) {
            // fetchApi handles Swal for network/HTTP errors (except 401 handled globally)
            dispatch({ type: ACTIONS.SEARCH_COMPLETE, payload: { error: error.message } });
        }
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        dispatch({ type: ACTIONS.SET_PAGINATION, payload: { current: newPagination.current, pageSize: newPagination.pageSize } });
        dispatch({ type: ACTIONS.SET_SORT, payload: (sorter.field && sorter.order ? { field: sorter.field, order: sorter.order } : {}) });
        // useEffect handles UPDATE_DISPLAYED_DATA
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
            message.success(`Đã xóa phòng có mã ${maPhong}!`); // Use message for quick feedback
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { deletedIds: [maPhong] } });
        } catch (error) {
            // fetchApi handles Swal for errors (except 401)
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { error: error.message } });
        }
    };

    const handleDelete = (record) => {
        Swal.fire({
            title: "Xác nhận xóa", text: `Bạn có chắc muốn xóa phòng "${record.tenPhong}"? Thao tác này không thể hoàn tác.`, icon: "warning",
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: "Xóa", cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) deleteLabRoomApi(record.maPhong);
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
            dispatch({ type: ACTIONS.DELETE_COMPLETE, payload: { error: error.message } });
        }
    };

    const confirmDeleteMultiple = () => {
        if (!state.selectedRowKeys || state.selectedRowKeys.length === 0) return;
        Swal.fire({
            title: "Xác nhận xóa", text: `Bạn có chắc muốn xóa ${state.selectedRowKeys.length} phòng đã chọn? Thao tác này không thể hoàn tác.`, icon: "warning",
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: "Xóa", cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) deleteMultipleLabRoomsApi(state.selectedRowKeys);
        });
    };


// --- QR Modal Handlers ---
    const fetchLabRoomsForQrCode = async () => { // Renamed to indicate it fetches and shows
        dispatch({ type: ACTIONS.SHOW_QR_MODAL_START });
        try {
            const url = `https://localhost:8080/phong-may-thong-ke`;
            const response = await fetchApi(url); // Token added automatically
            const data = await response.json();
            const qrData = JSON.stringify(data, null, 2); // Adjust transformation if needed
            dispatch({ type: ACTIONS.SHOW_QR_MODAL_SUCCESS, payload: qrData });
        } catch (error) {
            // fetchApi shows Swal for errors (except 401)
            dispatch({ type: ACTIONS.SHOW_QR_MODAL_ERROR });
        }
    };
    const handleCancelQrModal = () => dispatch({ type: ACTIONS.HIDE_QR_MODAL });


// --- Status Modal (Computers & Devices) Handlers ---
    const fetchComputers = async (maPhong) => {
        dispatch({ type: ACTIONS.LOAD_COMPUTERS_START });
        try {
            const url = `https://localhost:8080/DSMayTinhTheoPhong?maPhong=${maPhong}`;
            const response = await fetchApi(url);
            let data = [];
            if (response.status !== 204) data = await response.json();
            dispatch({ type: ACTIONS.LOAD_COMPUTERS_SUCCESS, payload: data || [] });
        } catch (error) {
            dispatch({ type: ACTIONS.LOAD_COMPUTERS_ERROR, payload: error.message });
            // Don't show Swal here, let the UI reflect the loading error
        }
    };

    const fetchDeviceTypes = async () => {
        dispatch({ type: ACTIONS.LOAD_DEVICE_TYPES_START });
        try {
            const url = `https://localhost:8080/DSLoaiThietBi`;
            const response = await fetchApi(url);
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
            if (response.status !== 204) data = await response.json();
            dispatch({ type: ACTIONS.LOAD_DEVICES_BY_TYPE_SUCCESS, payload: data || [] });
        } catch (error) {
            dispatch({ type: ACTIONS.LOAD_DEVICES_BY_TYPE_ERROR, payload: error.message });
        }
    };

    const showComputerStatusModal = (maPhong, tenPhong) => {
        dispatch({ type: ACTIONS.SHOW_STATUS_MODAL, payload: { maPhong, tenPhong } });
        fetchComputers(maPhong);
        fetchDeviceTypes();
    };

    const handleStatusModalClose = () => dispatch({ type: ACTIONS.HIDE_STATUS_MODAL });

    const handleTabChange = (key) => {
        dispatch({ type: ACTIONS.SET_STATUS_MODAL_TAB, payload: key });
        if (key !== 'computers') {
            const maLoai = parseInt(key, 10);
            if (!isNaN(maLoai)) fetchDevicesByType(maLoai);
        }
    };


// --- Computer Update Modal Handlers ---
    const handleOpenUpdateModal = () => {
        if (!state.statusModal.computers || state.statusModal.computers.length === 0) {
            message.warning("Không có dữ liệu máy tính để cập nhật."); return;
        }
        dispatch({ type: ACTIONS.SHOW_COMPUTER_UPDATE_MODAL });
    };

    const handleComputerUpdateModalClose = () => dispatch({ type: ACTIONS.HIDE_COMPUTER_UPDATE_MODAL });

    const toggleComputerUpdateSelection = (maMay) => {
        dispatch({ type: ACTIONS.TOGGLE_COMPUTER_UPDATE_SELECTION, payload: maMay });
    };

    const handleCompleteComputerUpdate = async () => {
        const selectedKeys = state.computerUpdateModal.selectedKeys;
        if (selectedKeys.length === 0) { message.info("Chưa chọn máy tính nào để thay đổi trạng thái."); return; }

        dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_START });
        const updates = state.statusModal.computers
            .filter(comp => selectedKeys.includes(comp.maMay) && comp.trangThai !== BROKEN_STATUS)
            .map(comp => ({
                maMay: comp.maMay,
                newStatus: comp.trangThai === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS
            }));

        if (updates.length === 0) {
            message.warning("Không có thay đổi trạng thái hợp lệ nào (chỉ có thể thay đổi máy đang hoạt động/không hoạt động).");
            dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE, payload: { success: false } });
            return;
        }

        try {
            const params = new URLSearchParams();
            updates.forEach(upd => {
                params.append('maMayTinhList', upd.maMay);
                params.append('trangThaiList', upd.newStatus);
            });
            const url = `https://localhost:8080/CapNhatTrangThaiNhieuMay`; // Token added by fetchApi via query param
            await fetchApi(`${url}?${params.toString()}`, { method: "PUT" }); // Send as PUT

            message.success(`Đã cập nhật trạng thái ${updates.length} máy tính!`);
            dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE, payload: { success: true } }); // Closes modal via reducer
            if (state.statusModal.roomId) fetchComputers(state.statusModal.roomId); // Refresh list in background
        } catch (error) {
            // fetchApi shows Swal for errors (except 401)
            dispatch({ type: ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE, payload: { error: error.message } }); // Still closes modal
        }
    };


// --- Device Update Modal Handlers ---
    const handleOpenDeviceUpdateModal = (maLoai, tenLoai) => {
        if (!state.statusModal.currentDevices || state.statusModal.currentDevices.length === 0) {
            message.warning(`Không có dữ liệu ${tenLoai} để cập nhật.`); return;
        }
        dispatch({ type: ACTIONS.SHOW_DEVICE_UPDATE_MODAL, payload: { maLoai, tenLoai } });
    };

    const handleDeviceUpdateModalClose = () => dispatch({ type: ACTIONS.HIDE_DEVICE_UPDATE_MODAL });

    const toggleDeviceUpdateSelection = (maThietBi) => {
        dispatch({ type: ACTIONS.TOGGLE_DEVICE_UPDATE_SELECTION, payload: maThietBi });
    };

    const handleCompleteDeviceUpdate = async () => {
        const selectedKeys = state.deviceUpdateModal.selectedKeys;
        if (selectedKeys.length === 0) { message.info("Chưa chọn thiết bị nào để thay đổi trạng thái."); return; }

        dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_START });
        const updates = state.statusModal.currentDevices
            .filter(dev => selectedKeys.includes(dev.maThietBi) && dev.trangThai !== BROKEN_STATUS)
            .map(dev => ({
                maThietBi: dev.maThietBi,
                newStatus: dev.trangThai === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS
            }));

        if (updates.length === 0) {
            message.warning("Không có thay đổi trạng thái hợp lệ.");
            dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE, payload: { success: false } });
            return;
        }

        try {
            const params = new URLSearchParams();
            updates.forEach(upd => {
                params.append('maThietBiList', upd.maThietBi);
                params.append('trangThaiList', upd.newStatus);
            });
            const url = `https://localhost:8080/CapNhatTrangThaiNhieuThietBi`;
            await fetchApi(`${url}?${params.toString()}`, { method: "PUT" });

            message.success(`Đã cập nhật trạng thái ${updates.length} thiết bị!`);
            dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE, payload: { success: true } }); // Closes modal
            const maLoaiToRefresh = state.deviceUpdateModal.currentType.maLoai; // Get type before modal state resets
            if (maLoaiToRefresh) fetchDevicesByType(maLoaiToRefresh); // Refresh list
        } catch (error) {
            dispatch({ type: ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE, payload: { error: error.message } }); // Closes modal
        }
    };


// --- User Profile Handlers ---
    const checkUserAndShowModal = async () => {
        dispatch({ type: ACTIONS.LOAD_USER_PROFILE_START });
        try {
            // Assuming an API endpoint to get profile using the token
            const username = getUsername();
            const password = getPassword();
            if (!username || !password) {
                console.error("Username or password not found in localStorage for checkUser");
                throw new Error("Unauthorized");
            }

            const params = new URLSearchParams();
            params.append('username', username);
            params.append('password', password);

            const url = `https://localhost:8080/checkUser?${params.toString()}`;
            const response = await fetchApi(url, {}, true); // Mark as public
            const responseData = await response.json();

            if (responseData.status === "success") {
                const profileData = responseData.data;
                dispatch({ type: ACTIONS.LOAD_USER_PROFILE_SUCCESS, payload: profileData });
                // Set form values AFTER dispatch updates the state
                form.setFieldsValue({
                    tenDangNhap: profileData.tenDangNhap,
                    email: profileData.email,
                });
                // Update avatar state (reducer handles image URL processing)
                // Need to access the updated state *after* dispatch
                // This might require accessing state directly or using a separate effect
                // For simplicity, let's assume reducer updates image correctly and maybe LabManagement uses state.userProfileModal.image directly
                if (setAvatarImage && profileData.image) {
                    const urls = profileData.image.split(' ').filter(url => url && url.startsWith('http'));
                    const imageUrl = urls.length > 0 ? urls[urls.length - 1] : null;
                    setAvatarImage(imageUrl); // Update the separate avatar state
                } else {
                    setAvatarImage(null);
                }

            } else {
                throw new Error(responseData.message || "Lỗi khi tải dữ liệu hồ sơ");
            }
        } catch (error) {
            // fetchApi shows Swal for network/HTTP errors (except 401)
            if (error.message !== "Unauthorized") { // Prevent duplicate error for unauthorized
                Swal.fire("Lỗi", `Không thể tải hồ sơ người dùng: ${error.message}`, "error");
            }
            dispatch({ type: ACTIONS.LOAD_USER_PROFILE_ERROR, payload: error.message });
        }
    };

    const handleUserProfileUpdate = async () => {
        try {
            const values = await form.validateFields();
            const token = getToken(); // Needed for FormData fetch
            if (!token) throw new Error("Unauthorized");

            dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_START });

            const formData = new FormData();
            // Use profile data from current state
            formData.append("maTK", state.userProfileModal.profile.maTK);
            formData.append("tenDangNhap", values.tenDangNhap);
            formData.append("email", values.email);
            // Only include imageFile if a new file was selected
            if (values.image && values.image.length > 0 && values.image[0].originFileObj) {
                formData.append("imageFile", values.image[0].originFileObj);
            }
            formData.append("maQuyen", state.userProfileModal.profile.quyen);
            // Password handling: Avoid sending password if possible.
            // If required, get it securely, not from localStorage ideally.
            // const matKhau = localStorage.getItem("password"); // Avoid if possible
            // if (matKhau) formData.append("matKhau", matKhau);

            // Use standard fetch for FormData
            const response = await fetch(`https://localhost:8080/CapNhatTaiKhoan?token=${token}`, {
                method: "PUT", body: formData,
                // No 'Content-Type' header needed for FormData
            });

            // Manual error handling similar to fetchApi for non-JSON responses or FormData cases
            if (response.status === 401) throw new Error("Unauthorized"); // Handle 401 specifically
            if (!response.ok) {
                let errorMsg = `Lỗi HTTP ${response.status}`;
                try { errorMsg = (await response.json()).message || errorMsg } catch(e){}
                throw new Error(errorMsg);
            }

            const updatedUser = await response.json();
            message.success("Cập nhật hồ sơ thành công!");
            dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_SUCCESS, payload: updatedUser }); // Closes modal via reducer

            // Update separate avatar state based on the new profile data in the reducer state
            let updatedImageUrl = null;
            if (updatedUser.image) {
                const urls = updatedUser.image.split(' ').filter(url => url && url.startsWith('http'));
                updatedImageUrl = urls.length > 0 ? urls[urls.length - 1] : null;
            }
            if(setAvatarImage) setAvatarImage(updatedImageUrl);


        } catch (error) {
            if (error.message !== "Unauthorized") { // Avoid duplicate Swal for 401
                Swal.fire("Lỗi", `Cập nhật hồ sơ thất bại: ${error.message}`, "error");
            }
            dispatch({ type: ACTIONS.UPDATE_USER_PROFILE_ERROR, payload: error.message }); // Still closes modal? No, keep open on error.
            // Adjust reducer: UPDATE_USER_PROFILE_ERROR should only set updating=false, not close modal.
        }
    };

    const handleUserProfileModalCancel = () => dispatch({ type: ACTIONS.HIDE_USER_PROFILE_MODAL });


// --- Logout Handler ---
    const handleLogout = async () => {
        try {
            const url = `https://localhost:8080/logout`;
            await fetchApi(url, { method: 'POST' }); // fetchApi handles token & 401
            // Proceed with client-side logout regardless of server response (unless 401 handled navigation)
            message.success("Đăng xuất thành công!");
        } catch (error) {
            // Log error but proceed with client logout if not already navigated by 401 handler
            if (error.message !== "Unauthorized") {
                console.error("Logout API error:", error);
                message.warning("Đã xảy ra lỗi khi liên hệ máy chủ đăng xuất, nhưng bạn sẽ được đăng xuất khỏi trình duyệt.");
            }
        } finally {
            // Always clear local storage and navigate on logout attempt
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
            localStorage.removeItem('password');
            navigate("/login", { replace: true });
        }
    };

// --- Return all handlers ---
    return {
        handleSearchChange, handleColumnSelect, performSearch, handleTableChange, onSelectChange,
        handleDelete, confirmDeleteMultiple,
        fetchLabRoomsForQrCode, handleCancelQrModal,
        showComputerStatusModal, handleStatusModalClose, handleTabChange,
        handleOpenUpdateModal, handleComputerUpdateModalClose, toggleComputerUpdateSelection, handleCompleteComputerUpdate,
        handleOpenDeviceUpdateModal, handleDeviceUpdateModalClose, toggleDeviceUpdateSelection, handleCompleteDeviceUpdate,
        checkUserAndShowModal, handleUserProfileUpdate, handleUserProfileModalCancel,
        handleLogout,
    };
};