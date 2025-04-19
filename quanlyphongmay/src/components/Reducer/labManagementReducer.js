import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from '../PhongMay/action'; // Adjust path if needed

// --- Helper Function: Sort Data ---
const sortData = (data, sortKey, sortOrder) => {
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
    qrModal: { visible: false, value: '', loading: false, qrError: null }, // Added qrError for error message
    userProfileModal: { visible: false, profile: {}, image: null, loading: false, updating: false },
    statusModal: { visible: false, loadingComputers: false, loadingDeviceTypes: false, loadingDevices: false, computers: [], deviceTypes: [], currentDevices: [], roomName: '', roomId: null, activeTab: 'computers', roomStatus: '' }, // Added roomStatus
    computerUpdateModal: {
        visible: false,
        attendanceKeys: [], // Renamed from selectedKeys for clarity
        brokenReportKeys: [], // New state for reported broken keys
        updating: false,
        isChangeAllBrokenActive: false, // State for "Change All Broken" button
        userRole: null, // Store user role for modal context
        roomStatusForUpdate: '', // Store room status for update modal context
    },
    deviceUpdateModal: {
        visible: false,
        selectedKeys: [],
        updating: false,
        currentType: { maLoai: null, tenLoai: '' },
        brokenReportKeys: [], // New state for device broken reports
    },
    computerDetailModal: { visible: false, detailLoading: false, computerDetail: null, detailError: null }, // New modal state for computer detail
    deviceDetailModal: { visible: false, detailLoading: false, deviceDetail: null, detailError: null }, // New modal state for device detail
};

// --- Reducer Function ---
export function labManagementReducer(state, action) {
    console.log("[Reducer Action]", action.type, action.payload); // For debugging

    switch (action.type) {
        // --- Load Data ---
        case ACTIONS.LOAD_DATA_SUCCESS: {
            const initialData = action.payload || [];
            const displayData = initialData.slice(0, state.pagination.pageSize);
            return {
                ...state,
                initialLabRooms: initialData,
                labRooms: displayData,
                filteredLabRooms: null,
                loadError: null,
                tableLoading: false,
                pagination: { ...state.pagination, current: 1 },
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
                pagination: error ? state.pagination : { ...state.pagination, current: 1 },
                loadError: error ? { message: error } : null, // Store error message
                selectedRowKeys: [], hasSelected: false, // Reset selection on search
            };
        }
        case ACTIONS.CLEAR_SEARCH:
            return {
                ...state, search: '', selectedColumn: null, showColumnSelect: false,
                filteredLabRooms: null, loadError: null,
                pagination: { ...state.pagination, current: 1 },
            };

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
            if (error) return { ...state, tableLoading: false /* Optionally add delete error state */ };
            const newInitial = state.initialLabRooms.filter(room => !deletedIds.includes(room.maPhong));
            const newFiltered = state.filteredLabRooms ? state.filteredLabRooms.filter(room => !deletedIds.includes(room.maPhong)) : null;
            // Reset pagination to avoid staying on an empty page after deletion
            const totalItems = (newFiltered !== null ? newFiltered.length : newInitial.length);
            const maxPage = Math.ceil(totalItems / state.pagination.pageSize) || 1;
            const currentPage = Math.min(state.pagination.current, maxPage);

            return {
                ...state, tableLoading: false,
                initialLabRooms: newInitial, filteredLabRooms: newFiltered,
                selectedRowKeys: state.selectedRowKeys.filter(key => !deletedIds.includes(key)), // Remove deleted keys from selection
                hasSelected: state.selectedRowKeys.some(key => !deletedIds.includes(key)), // Recalculate hasSelected
                pagination: { ...state.pagination, current: currentPage }, // Adjust current page if needed
                // UPDATE_DISPLAYED_DATA will be triggered by useEffect
            };
        }

        // --- QR Modal ---
        case ACTIONS.SHOW_QR_MODAL_START:
            return { ...state, qrModal: { ...state.qrModal, visible: true, loading: true, value: '', qrError: null } }; // Reset qrError
        case ACTIONS.SHOW_QR_MODAL_SUCCESS:
            return { ...state, qrModal: { ...state.qrModal, loading: false, value: action.payload, qrError: null } };
        case ACTIONS.SHOW_QR_MODAL_ERROR:
            return { ...state, qrModal: { ...state.qrModal, loading: false, qrError: action.payload || 'Không thể tạo mã QR.' } }; // Set qrError message
        case ACTIONS.SHOW_QR_MODAL_DATA_TOO_LONG_ERROR:
            return { ...state, qrModal: { ...state.qrModal, loading: false, qrError: 'Dữ liệu quá lớn để tạo mã QR. Vui lòng xuất dữ liệu theo cách khác.' } }; // Specific error for data too long
        case ACTIONS.HIDE_QR_MODAL:
            return { ...state, qrModal: { ...initialState.qrModal } }; // Reset QR modal state

        // --- User Profile Modal ---
        case ACTIONS.LOAD_USER_PROFILE_START:
            return { ...state, userProfileModal: { ...state.userProfileModal, loading: true } };
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
            return { ...state, userProfileModal: { ...state.userProfileModal, loading: false /* Add error state? */ } };
        case ACTIONS.UPDATE_USER_PROFILE_START:
            return { ...state, userProfileModal: { ...state.userProfileModal, updating: true } };
        case ACTIONS.UPDATE_USER_PROFILE_SUCCESS: {
            const updatedProfile = action.payload || {};
            let updatedImageUrl = state.userProfileModal.image;
            if (updatedProfile.image) {
                const urls = updatedProfile.image.split(' ').filter(url => url && url.startsWith('http'));
                updatedImageUrl = urls.length > 0 ? urls[urls.length - 1] : null;
            }
            // Close modal on success
            return {
                ...state,
                // Keep profile & image data updated even when modal is closed
                userProfileModal: { ...initialState.userProfileModal, profile: updatedProfile, image: updatedImageUrl }
            };
        }
        case ACTIONS.UPDATE_USER_PROFILE_ERROR:
            return { ...state, userProfileModal: { ...state.userProfileModal, updating: false /* Add error state? */ } };
        case ACTIONS.HIDE_USER_PROFILE_MODAL:
            // Only hide, keep data
            return { ...state, userProfileModal: { ...state.userProfileModal, visible: false, loading: false, updating: false } };

        // --- Status Modal ---
        case ACTIONS.SHOW_STATUS_MODAL:
            return { ...state, statusModal: { ...initialState.statusModal, visible: true, roomName: action.payload.tenPhong, roomId: action.payload.maPhong, roomStatus: action.payload.trangThaiPhong } }; // Store roomStatus
        case ACTIONS.HIDE_STATUS_MODAL:
            return { ...state, statusModal: { ...initialState.statusModal } };
        case ACTIONS.LOAD_COMPUTERS_START:
            return { ...state, statusModal: { ...state.statusModal, loadingComputers: true } };
        case ACTIONS.LOAD_COMPUTERS_SUCCESS:
            return { ...state, statusModal: { ...state.statusModal, loadingComputers: false, computers: action.payload || [] } };
        case ACTIONS.LOAD_COMPUTERS_ERROR:
            return { ...state, statusModal: { ...state.statusModal, loadingComputers: false, computers: [] } };
        case ACTIONS.LOAD_DEVICE_TYPES_START:
            return { ...state, statusModal: { ...state.statusModal, loadingDeviceTypes: true } };
        case ACTIONS.LOAD_DEVICE_TYPES_SUCCESS:
            return { ...state, statusModal: { ...state.statusModal, loadingDeviceTypes: false, deviceTypes: action.payload || [] } };
        case ACTIONS.LOAD_DEVICE_TYPES_ERROR:
            return { ...state, statusModal: { ...state.statusModal, loadingDeviceTypes: false, deviceTypes: [] } };
        case ACTIONS.LOAD_DEVICES_BY_TYPE_START:
            return { ...state, statusModal: { ...state.statusModal, loadingDevices: true, currentDevices: [] } };
        case ACTIONS.LOAD_DEVICES_BY_TYPE_SUCCESS:
            return { ...state, statusModal: { ...state.statusModal, loadingDevices: false, currentDevices: action.payload || [] } };
        case ACTIONS.LOAD_DEVICES_BY_TYPE_ERROR:
            return { ...state, statusModal: { ...state.statusModal, loadingDevices: false, currentDevices: [] } };
        case ACTIONS.SET_STATUS_MODAL_TAB:
            return { ...state, statusModal: { ...state.statusModal, activeTab: action.payload, ...(action.payload === 'computers' ? { currentDevices: [], loadingDevices: false } : {}) } };

        // --- Computer Update Modal ---
        case ACTIONS.SHOW_COMPUTER_UPDATE_MODAL:
            return { ...state, statusModal: { ...state.statusModal, visible: false }, computerUpdateModal: { ...initialState.computerUpdateModal, visible: true, userRole: action.payload.userRole, roomStatusForUpdate: state.statusModal.roomStatus } }; //Pass userRole and roomStatus
        case ACTIONS.HIDE_COMPUTER_UPDATE_MODAL:
            return { ...state, computerUpdateModal: { ...initialState.computerUpdateModal } };
        case ACTIONS.TOGGLE_COMPUTER_ATTENDANCE_SELECTION: {
            const key = action.payload.key;
            const userRole = action.payload.userRole;
            const roomStatusForUpdate = action.payload.roomStatusForUpdate;
            const computerStatus = action.payload.computerStatus;

            let newAttendanceKeys = [...state.computerUpdateModal.attendanceKeys];
            let newBrokenReportKeys = [...state.computerUpdateModal.brokenReportKeys];

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                if (computerStatus !== BROKEN_STATUS) return state; // Role 3 only updates from BROKEN
                if (!newAttendanceKeys.includes(key)) {
                    newAttendanceKeys.push(key); // Select attendance (meaning active/inactive for role 3 from BROKEN)
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key); // Deselect broken report just in case
                    return { ...state, computerUpdateModal: { ...state.computerUpdateModal, attendanceKeys: newAttendanceKeys, brokenReportKeys: newBrokenReportKeys, isChangeAllBrokenActive: false } };
                } else {
                    newAttendanceKeys = newAttendanceKeys.filter(k => k !== key); // Deselect attendance
                    return { ...state, computerUpdateModal: { ...state.computerUpdateModal, attendanceKeys: newAttendanceKeys, brokenReportKeys: newBrokenReportKeys, isChangeAllBrokenActive: false } };
                }
            } else { // For other roles or non-empty rooms, keep original logic
                if (newAttendanceKeys.includes(key)) {
                    newAttendanceKeys = newAttendanceKeys.filter(k => k !== key); // Deselect attendance
                } else {
                    newAttendanceKeys.push(key); // Select attendance
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key); // Deselect broken report
                }
                return { ...state, computerUpdateModal: { ...state.computerUpdateModal, attendanceKeys: newAttendanceKeys, brokenReportKeys: newBrokenReportKeys, isChangeAllBrokenActive: false } }; // Reset "Change All Broken" state when individual toggles are used
            }
        }
        case ACTIONS.TOGGLE_COMPUTER_REPORT_BROKEN_SELECTION: {
            const key = action.payload.key;
            const userRole = action.payload.userRole;
            const roomStatusForUpdate = action.payload.roomStatusForUpdate;
            const computerStatus = action.payload.computerStatus;

            let newAttendanceKeys = [...state.computerUpdateModal.attendanceKeys];
            let newBrokenReportKeys = [...state.computerUpdateModal.brokenReportKeys];

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                return state; // Role 3 should not report broken from modal in empty room context
            } else { // Original logic for other roles/contexts
                if (newBrokenReportKeys.includes(key)) {
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key); // Deselect broken report
                } else {
                    newBrokenReportKeys.push(key); // Select broken report
                    newAttendanceKeys = newAttendanceKeys.filter(k => k !== key); // Deselect attendance
                }
                return { ...state, computerUpdateModal: { ...state.computerUpdateModal, attendanceKeys: newAttendanceKeys, brokenReportKeys: newBrokenReportKeys, isChangeAllBrokenActive: false } }; // Reset "Change All Broken" state when individual toggles are used
            }
        }
        case ACTIONS.UPDATE_COMPUTER_STATUS_START:
            return { ...state, computerUpdateModal: { ...state.computerUpdateModal, updating: true } };
        case ACTIONS.UPDATE_COMPUTER_STATUS_COMPLETE:
            return { ...state, computerUpdateModal: { ...initialState.computerUpdateModal } };
        case ACTIONS.TOGGLE_CHANGE_ALL_BROKEN_ACTIVE: {
            const shouldActivateAllBroken = !state.computerUpdateModal.isChangeAllBrokenActive;
            let newBrokenReportKeys = [...state.computerUpdateModal.brokenReportKeys];

            if (shouldActivateAllBroken) {
                newBrokenReportKeys = state.statusModal.computers
                    .filter(comp => comp.trangThai !== BROKEN_STATUS)
                    .map(comp => comp.maMay);
            } else {
                newBrokenReportKeys = []; // Clear all broken reports if deactivating
            }

            return {
                ...state,
                computerUpdateModal: {
                    ...state.computerUpdateModal,
                    isChangeAllBrokenActive: shouldActivateAllBroken,
                    brokenReportKeys: newBrokenReportKeys,
                    attendanceKeys: state.computerUpdateModal.attendanceKeys.filter(key => !newBrokenReportKeys.includes(key)), // Deselect attendance for newly broken reports
                }
            };
        }


        // --- Device Update Modal ---
        case ACTIONS.SHOW_DEVICE_UPDATE_MODAL:
            return { ...state, deviceUpdateModal: { ...initialState.deviceUpdateModal, visible: true, currentType: action.payload } };
        case ACTIONS.HIDE_DEVICE_UPDATE_MODAL:
            return { ...state, deviceUpdateModal: { ...initialState.deviceUpdateModal } };
        case ACTIONS.TOGGLE_DEVICE_UPDATE_SELECTION: {
            const key = action.payload;
            const userRole = localStorage.getItem("userRole");
            const roomStatusForUpdate = state.computerUpdateModal.roomStatusForUpdate;
            const deviceStatus = action.payload.deviceStatus;

            let newSelectedKeys = [...state.deviceUpdateModal.selectedKeys];
            let newBrokenReportKeys = [...state.deviceUpdateModal.brokenReportKeys];

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                if (deviceStatus !== BROKEN_STATUS) return state; // Role 3 only updates from BROKEN
                if (!newSelectedKeys.includes(key)) {
                    newSelectedKeys.push(key); // Select for active/inactive toggle
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key); // Deselect broken report just in case
                    return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, selectedKeys: newSelectedKeys, brokenReportKeys: newBrokenReportKeys } };
                } else {
                    newSelectedKeys = newSelectedKeys.filter(k => k !== key); // Deselect
                    return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, selectedKeys: newSelectedKeys, brokenReportKeys: newBrokenReportKeys } };
                }
            } else {
                if (newSelectedKeys.includes(key)) {
                    newSelectedKeys = newSelectedKeys.filter(k => k !== key);
                } else {
                    newSelectedKeys.push(key);
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key); // Deselect broken report when toggling active/inactive
                }
                return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, selectedKeys: newSelectedKeys, brokenReportKeys: newBrokenReportKeys } };
            }
        }
        case ACTIONS.TOGGLE_DEVICE_REPORT_BROKEN_SELECTION: {
            const key = action.payload;
            const userRole = localStorage.getItem("userRole");
            const roomStatusForUpdate = state.computerUpdateModal.roomStatusForUpdate;
            const deviceStatus = action.payload.deviceStatus;

            let newSelectedKeys = [...state.deviceUpdateModal.selectedKeys];
            let newBrokenReportKeys = [...state.deviceUpdateModal.brokenReportKeys];

            if (userRole === '3' && roomStatusForUpdate === 'Trống') {
                return state; // Role 3 should not report broken from modal in empty room context
            } else {
                if (newBrokenReportKeys.includes(key)) {
                    newBrokenReportKeys = newBrokenReportKeys.filter(k => k !== key);
                } else {
                    newBrokenReportKeys.push(key);
                    newSelectedKeys = newSelectedKeys.filter(k => k !== key) // Deselect active/inactive when reporting broken
                }
                return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, brokenReportKeys: newBrokenReportKeys, selectedKeys: newSelectedKeys } };
            }
        }
        case ACTIONS.UPDATE_DEVICE_STATUS_START:
            return { ...state, deviceUpdateModal: { ...state.deviceUpdateModal, updating: true } };
        case ACTIONS.UPDATE_DEVICE_STATUS_COMPLETE:
            // Close modal regardless of success/error
            return { ...state, deviceUpdateModal: { ...initialState.deviceUpdateModal } }; // Reset and close

        // --- Computer Detail Modal ---
        case ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_START:
            return { ...state, computerDetailModal: { ...initialState.computerDetailModal, visible: true, detailLoading: true } };
        case ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_SUCCESS:
            return { ...state, computerDetailModal: { ...state.computerDetailModal, detailLoading: false, computerDetail: action.payload } };
        case ACTIONS.SHOW_COMPUTER_DETAIL_MODAL_ERROR:
            return { ...state, computerDetailModal: { ...state.computerDetailModal, detailLoading: false, detailError: action.payload } };
        case ACTIONS.HIDE_COMPUTER_DETAIL_MODAL:
            return { ...state, computerDetailModal: { ...initialState.computerDetailModal } };

        // --- Device Detail Modal ---
        case ACTIONS.SHOW_DEVICE_DETAIL_MODAL_START:
            return { ...state, deviceDetailModal: { ...initialState.deviceDetailModal, visible: true, detailLoading: true } };
        case ACTIONS.SHOW_DEVICE_DETAIL_MODAL_SUCCESS:
            return { ...state, deviceDetailModal: { ...state.deviceDetailModal, detailLoading: false, deviceDetail: action.payload } };
        case ACTIONS.SHOW_DEVICE_DETAIL_MODAL_ERROR:
            return { ...state, deviceDetailModal: { ...state.deviceDetailModal, detailLoading: false, detailError: action.payload } };
        case ACTIONS.HIDE_DEVICE_DETAIL_MODAL:
            return { ...state, deviceDetailModal: { ...initialState.deviceDetailModal } };

        default:
            console.warn("Unhandled action type:", action.type);
            return state;
    }
}