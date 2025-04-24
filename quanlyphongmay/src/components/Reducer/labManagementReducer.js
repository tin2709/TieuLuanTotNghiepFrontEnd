// src/Reducer/labManagementReducer.js

import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from '../PhongMay/action'; // Adjust path if needed
import { message } from 'antd'; // Ant Design message (optional, but good practice)
// No need for useNavigate here

// --- Helper Function: Sort Data ---
const sortData = (data, sortKey, sortOrder) => {
    // ... (keep existing sortData function) ...
    if (!sortKey || !data || !Array.isArray(data)) return data;

    return [...data].sort((a, b) => {
        const valueA = a ? a[sortKey] : undefined;
        const valueB = b ? b[sortKey] : undefined;

        if (valueA === undefined && valueB === undefined) return 0;
        if (valueA === undefined) return sortOrder === "ascend" ? 1 : -1;
        if (valueB === undefined) return sortOrder === "ascend" ? -1 : 1;

        if (typeof valueA === "string" && typeof valueB === "string") {
            return sortOrder === "ascend" ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
        } else if (typeof valueA === "number" && typeof valueB === "number") {
            return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
        }
        return 0;
    });
};

// --- Initial State ---
export const initialState = {
    // Table & Data
    initialLabRooms: [],
    filteredLabRooms: null,
    labRooms: [],
    search: '',
    selectedColumn: null,
    pagination: { current: 1, pageSize: 10 },
    sortInfo: {},
    tableLoading: false,
    loadError: null,
    // Selection
    selectedRowKeys: [],
    hasSelected: false,
    // UI Interaction
    showColumnSelect: false,
    // Modals
    qrModal: { visible: false, value: '', loading: false, qrError: null },
    userProfileModal: { visible: false, profile: {}, image: null, loading: false, updating: false },
    statusModal: { visible: false, loadingComputers: false, loadingDeviceTypes: false, loadingDevices: false, computers: [], deviceTypes: [], currentDevices: [], roomName: '', roomId: null, activeTab: 'computers', roomStatus: '' },
    computerUpdateModal: {
        visible: false,
        attendanceKeys: [],
        brokenReportKeys: [],
        updating: false, // Spinner specifically for the status update API call (or navigation start)
        isChangeAllBrokenActive: false,
        userRole: null,
        roomStatusForUpdate: '',
    },
    deviceUpdateModal: {
        visible: false,
        selectedKeys: [],
        updating: false,
        currentType: { maLoai: null, tenLoai: '' },
        brokenReportKeys: [],
    },
    computerDetailModal: { visible: false, detailLoading: false, computerDetail: null, detailError: null },
    deviceDetailModal: { visible: false, detailLoading: false, deviceDetail: null, detailError: null },
    // *** REMOVED: reportNotesModal state is no longer needed here ***
};

// --- Reducer Function ---
export function labManagementReducer(state, action) {
    console.log("[Reducer Action]", action.type, action.payload); // For debugging

    switch (action.type) {
        // --- Load Data ---
        case ACTIONS.LOAD_DATA_SUCCESS: {
            const initialData = action.payload || [];
            const totalItems = initialData.length;
            const maxPage = Math.ceil(totalItems / state.pagination.pageSize) || 1;
            // Start on page 1 when new data is loaded
            const currentPage = 1; // Reset to page 1 on new load/refresh
            const displayData = initialData.slice(0, state.pagination.pageSize); // Show first page

            return {
                ...state,
                initialLabRooms: initialData,
                labRooms: displayData, // Show first page data
                filteredLabRooms: null,
                loadError: null,
                tableLoading: false,
                pagination: { ...state.pagination, current: currentPage }, // Update pagination to page 1
                selectedRowKeys: [],
                hasSelected: false,
            };
        }
        case ACTIONS.LOAD_DATA_ERROR:
            return {
                ...state,
                initialLabRooms: [], labRooms: [], filteredLabRooms: null,
                loadError: action.payload, tableLoading: false,
            };

        // --- Search ---
        case ACTIONS.SET_SEARCH:
            return {
                ...state,
                search: action.payload,
                showColumnSelect: !!action.payload,
                ...(action.payload === '' ? { filteredLabRooms: null, selectedColumn: null } : {})
            };
        case ACTIONS.SET_SEARCH_COLUMN:
            return { ...state, selectedColumn: action.payload };
        case ACTIONS.SEARCH_START:
            return { ...state, tableLoading: true, loadError: null };
        case ACTIONS.SEARCH_COMPLETE: {
            const { results, error } = action.payload;
            const newFiltered = error ? state.filteredLabRooms : (results ?? []);
            const displayData = error ? state.labRooms : newFiltered.slice(0, state.pagination.pageSize);
            return {
                ...state,
                tableLoading: false,
                filteredLabRooms: error ? state.filteredLabRooms : newFiltered,
                labRooms: displayData,
                pagination: error ? state.pagination : { ...state.pagination, current: 1 }, // Reset to page 1 after search
                loadError: error ? { message: error } : null,
                selectedRowKeys: [], hasSelected: false,
            };
        }
        case ACTIONS.CLEAR_SEARCH: {
            const { pageSize } = state.pagination;
            const dataToUse = state.initialLabRooms;
            const sortedData = sortData(dataToUse, state.sortInfo.field, state.sortInfo.order);
            const paginatedData = sortedData.slice(0, pageSize); // Go back to page 1

            return {
                ...state, search: '', selectedColumn: null, showColumnSelect: false,
                filteredLabRooms: null, loadError: null,
                labRooms: paginatedData, // Update displayed data
                pagination: { ...state.pagination, current: 1 }, // Reset to page 1
            };
        }

        // --- Table State ---
        case ACTIONS.SET_PAGINATION:
            return { ...state, pagination: action.payload };
        case ACTIONS.SET_SORT:
            return { ...state, sortInfo: action.payload };
        case ACTIONS.SET_SELECTION: {
            const selectedKeys = action.payload;
            return { ...state, selectedRowKeys: selectedKeys, hasSelected: selectedKeys.length > 0 };
        }
        case ACTIONS.UPDATE_DISPLAYED_DATA: {
            const { current, pageSize } = state.pagination;
            const { field, order } = state.sortInfo;
            const dataToUse = state.filteredLabRooms !== null ? state.filteredLabRooms : state.initialLabRooms;
            if (!Array.isArray(dataToUse)) return { ...state, labRooms: [] };
            const sortedData = sortData(dataToUse, field, order);
            const startIndex = (current - 1) * pageSize;
            const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
            return { ...state, labRooms: paginatedData };
        }

        // --- Delete ---
        case ACTIONS.DELETE_START:
            return { ...state, tableLoading: true };
        case ACTIONS.DELETE_COMPLETE: {
            const { error, deletedIds } = action.payload;
            if (error) {
                // message.error(`Lỗi xóa phòng: ${error}`); // Handled by fetchApi Swal
                return { ...state, tableLoading: false };
            }
            const newInitial = state.initialLabRooms.filter(room => !deletedIds.includes(room.maPhong));
            const newFiltered = state.filteredLabRooms ? state.filteredLabRooms.filter(room => !deletedIds.includes(room.maPhong)) : null;

            const { pageSize } = state.pagination;
            const totalItems = (newFiltered !== null ? newFiltered.length : newInitial.length);
            const maxPage = Math.ceil(totalItems / pageSize) || 1;
            const currentPage = Math.min(state.pagination.current, maxPage);

            const dataToUse = newFiltered !== null ? newFiltered : newInitial;
            const sortedData = sortData(dataToUse, state.sortInfo.field, state.sortInfo.order);
            const startIndex = (currentPage - 1) * pageSize;
            const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);

            return {
                ...state, tableLoading: false,
                initialLabRooms: newInitial,
                filteredLabRooms: newFiltered,
                labRooms: paginatedData,
                selectedRowKeys: state.selectedRowKeys.filter(key => !deletedIds.includes(key)),
                hasSelected: state.selectedRowKeys.some(key => !deletedIds.includes(key)),
                pagination: { ...state.pagination, current: currentPage },
            };
        }

        // --- QR Modal ---
        case ACTIONS.SHOW_QR_MODAL_START:
            return { ...state, qrModal: { ...state.qrModal, visible: true, loading: true, value: '', qrError: null } };
        case ACTIONS.SHOW_QR_MODAL_SUCCESS:
            return { ...state, qrModal: { ...state.qrModal, loading: false, value: action.payload, qrError: null } };
        case ACTIONS.SHOW_QR_MODAL_ERROR:
            return { ...state, qrModal: { ...state.qrModal, loading: false, qrError: action.payload || 'Không thể tạo mã QR.' } };
        case ACTIONS.SHOW_QR_MODAL_DATA_TOO_LONG_ERROR:
            // Show message directly as modal is less suitable for this
            message.error('Dữ liệu quá lớn để tạo mã QR. Vui lòng xuất dữ liệu theo cách khác.', 5);
            return { ...state, qrModal: { ...initialState.qrModal } }; // Hide modal
        case ACTIONS.HIDE_QR_MODAL:
            return { ...state, qrModal: { ...initialState.qrModal } };

        // --- User Profile Modal ---
        case ACTIONS.LOAD_USER_PROFILE_START:
            return { ...state, userProfileModal: { ...state.userProfileModal, visible: true, loading: true } };
        case ACTIONS.LOAD_USER_PROFILE_SUCCESS: {
            const profileData = action.payload || {};
            let imageUrl = null;
            if (profileData.image) {
                const urls = profileData.image.split(' ').filter(url => url && url.startsWith('http'));
                imageUrl = urls.length > 0 ? urls[urls.length - 1] : null;
            }
            return {
                ...state,
                userProfileModal: { ...state.userProfileModal, visible: true, loading: false, profile: profileData, image: imageUrl }
            };
        }
        case ACTIONS.LOAD_USER_PROFILE_ERROR:
            // message.error(`Lỗi tải hồ sơ: ${action.payload}`); // Handled by fetchApi Swal
            return { ...state, userProfileModal: { ...state.userProfileModal, visible: true, loading: false /* Add error state? e.g., loadProfileError: action.payload */ } };
        case ACTIONS.UPDATE_USER_PROFILE_START:
            return { ...state, userProfileModal: { ...state.userProfileModal, updating: true } };
        case ACTIONS.UPDATE_USER_PROFILE_SUCCESS: {
            const updatedProfile = action.payload || {};
            let updatedImageUrl = state.userProfileModal.image;
            if (updatedProfile.image) {
                const urls = updatedProfile.image.split(' ').filter(url => url && url.startsWith('http'));
                updatedImageUrl = urls.length > 0 ? urls[urls.length - 1] : null;
            }
            return {
                ...state,
                // Keep modal open briefly? Or close immediately? Let's close.
                userProfileModal: { ...initialState.userProfileModal } // Reset fully on success
            };
        }
        case ACTIONS.UPDATE_USER_PROFILE_ERROR:
            // message.error(`Lỗi cập nhật hồ sơ: ${action.payload}`); // Handled by fetchApi Swal
            return { ...state, userProfileModal: { ...state.userProfileModal, updating: false /* Add updateError state? */ } };
        case ACTIONS.HIDE_USER_PROFILE_MODAL:
            return { ...state, userProfileModal: { ...initialState.userProfileModal } }; // Reset fully on cancel/close

        // --- Status Modal ---
        case ACTIONS.SHOW_STATUS_MODAL:
            return { ...state, statusModal: { ...initialState.statusModal, visible: true, roomName: action.payload.tenPhong, roomId: action.payload.maPhong, roomStatus: action.payload.trangThai } };
        case ACTIONS.HIDE_STATUS_MODAL:
            return {
                ...state,
                statusModal: { ...initialState.statusModal },
                computerUpdateModal: { ...initialState.computerUpdateModal }, // Also reset update modals
                deviceUpdateModal: { ...initialState.deviceUpdateModal },
            };
        case ACTIONS.LOAD_COMPUTERS_START:
            return { ...state, statusModal: { ...state.statusModal, loadingComputers: true } };
        case ACTIONS.LOAD_COMPUTERS_SUCCESS:
            return { ...state, statusModal: { ...state.statusModal, loadingComputers: false, computers: action.payload || [] } };
        case ACTIONS.LOAD_COMPUTERS_ERROR:
            // message.error(`Lỗi tải danh sách máy tính: ${action.payload}`); // Handled by fetchApi Swal
            return { ...state, statusModal: { ...state.statusModal, loadingComputers: false, computers: [] } };
        case ACTIONS.LOAD_DEVICE_TYPES_START:
            return { ...state, statusModal: { ...state.statusModal, loadingDeviceTypes: true } };
        case ACTIONS.LOAD_DEVICE_TYPES_SUCCESS:
            return { ...state, statusModal: { ...state.statusModal, loadingDeviceTypes: false, deviceTypes: action.payload || [] } };
        case ACTIONS.LOAD_DEVICE_TYPES_ERROR:
            // message.error(`Lỗi tải loại thiết bị: ${action.payload}`); // Handled by fetchApi Swal
            return { ...state, statusModal: { ...state.statusModal, loadingDeviceTypes: false, deviceTypes: [] } };
        case ACTIONS.LOAD_DEVICES_BY_TYPE_START:
            return { ...state, statusModal: { ...state.statusModal, loadingDevices: true, currentDevices: [] } };
        case ACTIONS.LOAD_DEVICES_BY_TYPE_SUCCESS:
            return { ...state, statusModal: { ...state.statusModal, loadingDevices: false, currentDevices: action.payload || [] } };
        case ACTIONS.LOAD_DEVICES_BY_TYPE_ERROR:
            // message.error(`Lỗi tải danh sách thiết bị: ${action.payload}`); // Handled by fetchApi Swal
            return { ...state, statusModal: { ...state.statusModal, loadingDevices: false, currentDevices: [] } };
        case ACTIONS.SET_STATUS_MODAL_TAB:
            return { ...state, statusModal: { ...state.statusModal, activeTab: action.payload, ...(action.payload === 'computers' ? { currentDevices: [], loadingDevices: false } : {}) } };

        // --- Computer Update Modal ---
        case ACTIONS.SHOW_COMPUTER_UPDATE_MODAL:
            return {
                ...state,
                statusModal: { ...state.statusModal, visible: false }, // Close status modal when opening update
                computerUpdateModal: {
                    ...initialState.computerUpdateModal,
                    visible: true,
                    userRole: action.payload.userRole,
                    roomStatusForUpdate: state.statusModal.roomStatus
                }
            };
        case ACTIONS.HIDE_COMPUTER_UPDATE_MODAL:
            return { ...state, computerUpdateModal: { ...initialState.computerUpdateModal } };
        case ACTIONS.TOGGLE_COMPUTER_ATTENDANCE_SELECTION: {
            const { key, userRole, roomStatusForUpdate, computerStatus } = action.payload;
            let newAttendanceKeys = [...state.computerUpdateModal.attendanceKeys];
            let newBrokenReportKeys = [...state.computerUpdateModal.brokenReportKeys];
            const isSelected = newAttendanceKeys.includes(key);

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                if (computerStatus !== BROKEN_STATUS) return state; // Role 3 only changes from BROKEN
                if (!isSelected) {
                    newAttendanceKeys.push(key);
                } else {
                    newAttendanceKeys = newAttendanceKeys.filter(k => k !== key);
                }
            } else { // Other roles or non-empty rooms
                if (isSelected) {
                    newAttendanceKeys = newAttendanceKeys.filter(k => k !== key); // Deselect attendance
                } else {
                    newAttendanceKeys.push(key); // Select attendance
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key); // Deselect broken report
                }
            }
            return {
                ...state,
                computerUpdateModal: {
                    ...state.computerUpdateModal,
                    attendanceKeys: newAttendanceKeys,
                    brokenReportKeys: newBrokenReportKeys,
                    isChangeAllBrokenActive: false
                }
            };
        }
        case ACTIONS.TOGGLE_COMPUTER_REPORT_BROKEN_SELECTION: {
            const { key, userRole, roomStatusForUpdate, computerStatus } = action.payload;
            let newAttendanceKeys = [...state.computerUpdateModal.attendanceKeys];
            let newBrokenReportKeys = [...state.computerUpdateModal.brokenReportKeys];
            const isSelected = newBrokenReportKeys.includes(key);

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                return state; // Role 3 cannot report broken
            } else {
                if (isSelected) {
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key);
                } else {
                    newBrokenReportKeys.push(key);
                    newAttendanceKeys = newAttendanceKeys.filter(k => k !== key); // Deselect attendance
                }
            }
            return {
                ...state,
                computerUpdateModal: {
                    ...state.computerUpdateModal,
                    attendanceKeys: newAttendanceKeys,
                    brokenReportKeys: newBrokenReportKeys,
                    isChangeAllBrokenActive: false
                }
            };
        }
        case ACTIONS.TOGGLE_CHANGE_ALL_BROKEN_ACTIVE: {
            const shouldActivateAllBroken = !state.computerUpdateModal.isChangeAllBrokenActive;
            let newBrokenReportKeys = [];
            let newAttendanceKeys = [...state.computerUpdateModal.attendanceKeys];

            if (shouldActivateAllBroken) {
                newBrokenReportKeys = state.statusModal.computers
                    .filter(comp => comp.trangThai !== BROKEN_STATUS)
                    .map(comp => comp.maMay);
                newAttendanceKeys = newAttendanceKeys.filter(key => !newBrokenReportKeys.includes(key));
            } // No else needed, keys are reset individually or by toggling again

            return {
                ...state,
                computerUpdateModal: {
                    ...state.computerUpdateModal,
                    isChangeAllBrokenActive: shouldActivateAllBroken,
                    brokenReportKeys: newBrokenReportKeys,
                    attendanceKeys: newAttendanceKeys,
                }
            };
        }
        // UPDATE_COMPUTER_STATUS_START: Triggered by handler before API call or navigation
        case ACTIONS.UPDATE_COMPUTER_STATUS_START:
            return { ...state, computerUpdateModal: { ...state.computerUpdateModal, updating: true } };
        // UPDATE_COMPUTER_STATUS_COMPLETE: Triggered by handler after API call or navigation logic completes
        case ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE:
            // Close the modal and reset its state, regardless of success/failure (error shown via Swal/message)
            return { ...state, computerUpdateModal: { ...initialState.computerUpdateModal } };


        // --- Device Update Modal ---
        case ACTIONS.SHOW_DEVICE_UPDATE_MODAL:
            return {
                ...state,
                statusModal: { ...state.statusModal, visible: false }, // Close status modal
                deviceUpdateModal: {
                    ...initialState.deviceUpdateModal,
                    visible: true,
                    currentType: action.payload,
                }
            };
        case ACTIONS.HIDE_DEVICE_UPDATE_MODAL:
            return { ...state, deviceUpdateModal: { ...initialState.deviceUpdateModal } };
        case ACTIONS.TOGGLE_DEVICE_UPDATE_SELECTION: {
            const { key, deviceStatus } = action.payload;
            const userRole = localStorage.getItem("userRole"); // Get role inside reducer if needed
            const roomStatusForUpdate = state.statusModal.roomStatus;
            let newSelectedKeys = [...state.deviceUpdateModal.selectedKeys];
            let newBrokenReportKeys = [...state.deviceUpdateModal.brokenReportKeys];
            const isSelected = newSelectedKeys.includes(key);

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                if (deviceStatus !== BROKEN_STATUS) return state;
                if (!isSelected) {
                    newSelectedKeys.push(key);
                } else {
                    newSelectedKeys = newSelectedKeys.filter(k => k !== key);
                }
            } else {
                if (isSelected) {
                    newSelectedKeys = newSelectedKeys.filter(k => k !== key);
                } else {
                    newSelectedKeys.push(key);
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key);
                }
            }
            return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, selectedKeys: newSelectedKeys, brokenReportKeys: newBrokenReportKeys } };
        }
        case ACTIONS.TOGGLE_DEVICE_REPORT_BROKEN_SELECTION: {
            const { key, deviceStatus } = action.payload;
            const userRole = localStorage.getItem("userRole");
            const roomStatusForUpdate = state.statusModal.roomStatus;
            let newSelectedKeys = [...state.deviceUpdateModal.selectedKeys];
            let newBrokenReportKeys = [...state.deviceUpdateModal.brokenReportKeys];
            const isSelected = newBrokenReportKeys.includes(key);

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                return state;
            } else {
                if (isSelected) {
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key);
                } else {
                    newBrokenReportKeys.push(key);
                    newSelectedKeys = newSelectedKeys.filter(k => k !== key);
                }
            }
            return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, brokenReportKeys: newBrokenReportKeys, selectedKeys: newSelectedKeys } };
        }
        case ACTIONS.UPDATE_DEVICE_STATUS_START:
            return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, updating: true } };
        case ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE:
            return { ...state, deviceUpdateModal: { ...initialState.deviceUpdateModal } }; // Close modal

        // --- Computer Detail Modal ---
        case ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_START:
            return { ...state, computerDetailModal: { ...initialState.computerDetailModal, visible: true, detailLoading: true } };
        case ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_SUCCESS:
            return { ...state, computerDetailModal: { ...state.computerDetailModal, detailLoading: false, computerDetail: action.payload, detailError: null } };
        case ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_ERROR:
            // message.error(`Lỗi tải chi tiết máy tính: ${action.payload}`); // Swal handled by fetchApi
            return { ...state, computerDetailModal: { ...state.computerDetailModal, detailLoading: false, detailError: action.payload } };
        case ACTIONS.HIDE_COMPUTER_DETAIL_MODAL:
            return { ...state, computerDetailModal: { ...initialState.computerDetailModal } };

        // --- Device Detail Modal ---
        case ACTIONS.SHOW_DEVICE_DETAIL_MODAL_START:
            return { ...state, deviceDetailModal: { ...initialState.deviceDetailModal, visible: true, detailLoading: true } };
        case ACTIONS.SHOW_DEVICE_DETAIL_MODAL_SUCCESS:
            return { ...state, deviceDetailModal: { ...state.deviceDetailModal, detailLoading: false, deviceDetail: action.payload, detailError: null } };
        case ACTIONS.SHOW_DEVICE_DETAIL_MODAL_ERROR:
            // message.error(`Lỗi tải chi tiết thiết bị: ${action.payload}`); // Swal handled by fetchApi
            return { ...state, deviceDetailModal: { ...state.deviceDetailModal, detailLoading: false, detailError: action.payload } };
        case ACTIONS.HIDE_DEVICE_DETAIL_MODAL:
            return { ...state, deviceDetailModal: { ...initialState.deviceDetailModal } };

        // --- REMOVED: Report Notes Modal Cases ---

        default:
            console.warn("Unhandled action type:", action.type);
            return state;
    }
}