// src/redux/QuanLiNVRedux/employeeSearchConfigsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

// Định nghĩa một tên đặc biệt cho cấu hình tải tất cả
export const LOAD_ALL_EMPLOYEES_CONFIG_NAME = '__LOAD_ALL_EMPLOYEES__';

const initialState = {
    // Sử dụng key riêng để lưu vào localStorage cho nhân viên
    savedSearchConfigs: JSON.parse(localStorage.getItem('savedEmployeeSearchConfigs')) || [],
    currentSearchConfig: {
        name: '',
        field: null,
        operator: null,
        keyword: '',
    },
    searchConfigList: (JSON.parse(localStorage.getItem('savedEmployeeSearchConfigs')) || []).map(config => config.name),
};

const employeeSearchConfigsSlice = createSlice({
    name: 'employeeSearchConfigs',
    initialState,
    reducers: {
        setCurrentSearch: (state, action) => {
            state.currentSearchConfig = { ...state.currentSearchConfig, ...action.payload };
        },
        saveCurrentSearchConfig: (state, action) => {
            const { name } = action.payload;
            const newConfig = {
                id: nanoid(),
                name,
                field: state.currentSearchConfig.field,
                operator: state.currentSearchConfig.operator,
                keyword: state.currentSearchConfig.keyword,
            };

            const existingConfigIndex = state.savedSearchConfigs.findIndex(config => config.name === name);
            if (existingConfigIndex !== -1) {
                state.savedSearchConfigs[existingConfigIndex] = newConfig;
            } else {
                state.savedSearchConfigs.push(newConfig);
            }
            state.searchConfigList = state.savedSearchConfigs.map(config => config.name);
            localStorage.setItem('savedEmployeeSearchConfigs', JSON.stringify(state.savedSearchConfigs)); // Cập nhật key localStorage
            Swal.fire('Đã lưu!', `Cấu hình tìm kiếm "${name}" đã được lưu.`, 'success');
        },
        loadSearchConfig: (state, action) => {
            const configNameToLoad = action.payload;

            // Xử lý trường hợp tải cấu hình "Tải tất cả"
            if (configNameToLoad === LOAD_ALL_EMPLOYEES_CONFIG_NAME) {
                state.currentSearchConfig = {
                    name: LOAD_ALL_EMPLOYEES_CONFIG_NAME,
                    field: null,
                    operator: null,
                    keyword: '', // Quan trọng: keyword rỗng để tải tất cả
                };
                return;
            }

            // Xử lý tải cấu hình người dùng đã lưu
            const configToLoad = state.savedSearchConfigs.find(config => config.name === configNameToLoad);
            if (configToLoad) {
                state.currentSearchConfig = {
                    name: configToLoad.name,
                    field: configToLoad.field,
                    operator: configToLoad.operator,
                    keyword: configToLoad.keyword,
                };
            } else {
                Swal.fire('Lỗi!', `Không tìm thấy cấu hình "${configNameToLoad}".`, 'error');
            }
        },
        removeSearchConfig: (state, action) => {
            const configNameToRemove = action.payload;
            state.savedSearchConfigs = state.savedSearchConfigs.filter(config => config.name !== configNameToRemove);
            state.searchConfigList = state.savedSearchConfigs.map(config => config.name);
            localStorage.setItem('savedEmployeeSearchConfigs', JSON.stringify(state.savedSearchConfigs)); // Cập nhật key localStorage
            if (state.currentSearchConfig.name === configNameToRemove) {
                state.currentSearchConfig = { name: '', field: null, operator: null, keyword: '' };
            }
            Swal.fire('Đã xóa!', `Cấu hình tìm kiếm "${configNameToRemove}" đã được xóa.`, 'success');
        },
        clearCurrentSearch: (state) => {
            state.currentSearchConfig = { name: '', field: null, operator: null, keyword: '' };
        }
    },
});

export const {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch,
} = employeeSearchConfigsSlice.actions;

export default employeeSearchConfigsSlice.reducer;