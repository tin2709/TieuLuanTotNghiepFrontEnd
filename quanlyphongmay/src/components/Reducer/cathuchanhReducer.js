// src/Reducer/cathuchanhReducer.js
import { ACTIONS } from '../CaThucHanh/action'

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
        } else if (valueA instanceof Date && valueB instanceof Date) {
            return sortOrder === "ascend" ? valueA.getTime() - valueB.getTime() : valueB.getTime() - valueA.getTime();
        }
        return 0;
    });
};

// --- Initial State ---
export const initialState = {
    caThucHanhList: [],
    filteredCaThucHanh: null,
    displayedCaThucHanh: [],
    search: '',
    selectedColumn: null,
    pagination: { current: 1, pageSize: 10 },
    sortInfo: {},
    tableLoading: false,
    loadError: null,
    selectedRowKeys: [],
    hasSelected: false,
};

// --- Reducer Function ---
export function caThucHanhReducer(state, action) {
    console.log("[Reducer Action]", action.type, action.payload);

    switch (action.type) {
        // --- Load Data ---
        case ACTIONS.LOAD_DATA_SUCCESS: {
            const initialData = action.payload || [];
            const displayData = initialData.slice(0, state.pagination.pageSize);
            return {
                ...state,
                caThucHanhList: initialData,
                displayedCaThucHanh: displayData,
                filteredCaThucHanh: null,
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
                caThucHanhList: [], displayedCaThucHanh: [], filteredCaThucHanh: null,
                loadError: action.payload, tableLoading: false,
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
            const dataToUse = state.filteredCaThucHanh !== null ? state.filteredCaThucHanh : state.caThucHanhList;
            if (!Array.isArray(dataToUse)) return { ...state, displayedCaThucHanh: [] };
            const sortedData = sortData(dataToUse, field, order);
            const startIndex = (current - 1) * pageSize;
            const paginatedData = sortedData.slice(startIndex, startIndex + pageSize);
            return { ...state, displayedCaThucHanh: paginatedData };
        }

        default:
            console.warn("Unhandled action type:", action.type);
            return state;
    }
}