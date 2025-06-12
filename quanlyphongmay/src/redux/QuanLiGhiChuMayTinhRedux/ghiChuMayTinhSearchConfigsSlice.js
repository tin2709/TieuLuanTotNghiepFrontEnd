// src/redux/QuanLiGhiChuMayTinhRedux/ghiChuMayTinhSearchConfigsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

// Định nghĩa một tên đặc biệt cho cấu hình tải tất cả
export const LOAD_ALL_GHI_CHU_MAY_TINH_CONFIG_NAME = '__LOAD_ALL_GHI_CHU_MT__';

const initialState = {
    savedSearchConfigs: JSON.parse(localStorage.getItem('savedGhiChuMayTinhSearchConfigs')) || [],
    currentSearchConfig: {
        name: '',
        field: null,
        operator: null,
        keyword: '', // Chuỗi giá trị tìm kiếm (ví dụ: '2023-10-26' hoặc 'value1,value2')
    },
    // Danh sách tên cấu hình đã lưu, dùng cho dropdown
    searchConfigList: (JSON.parse(localStorage.getItem('savedGhiChuMayTinhSearchConfigs')) || []).map(config => config.name),
};

const ghiChuMayTinhSearchConfigsSlice = createSlice({
    name: 'ghiChuMayTinhSearchConfigs',
    initialState,
    reducers: {
        setCurrentSearch: (state, action) => {
            // Cập nhật từng phần của currentSearchConfig
            state.currentSearchConfig = { ...state.currentSearchConfig, ...action.payload };
        },
        saveCurrentSearchConfig: (state, action) => {
            const { name } = action.payload;
            const newConfig = {
                id: nanoid(), // ID duy nhất
                name,
                field: state.currentSearchConfig.field,
                operator: state.currentSearchConfig.operator,
                keyword: state.currentSearchConfig.keyword,
            };

            const existingConfigIndex = state.savedSearchConfigs.findIndex(config => config.name === name);
            if (existingConfigIndex !== -1) {
                // Nếu tên đã tồn tại, cập nhật
                state.savedSearchConfigs[existingConfigIndex] = newConfig;
            } else {
                // Nếu tên chưa tồn tại, thêm mới
                state.savedSearchConfigs.push(newConfig);
            }
            state.searchConfigList = state.savedSearchConfigs.map(config => config.name);
            localStorage.setItem('savedGhiChuMayTinhSearchConfigs', JSON.stringify(state.savedSearchConfigs));
            Swal.fire('Đã lưu!', `Cấu hình tìm kiếm "${name}" đã được lưu.`, 'success');
        },
        loadSearchConfig: (state, action) => {
            const configNameToLoad = action.payload;

            // Xử lý trường hợp tải cấu hình "Tải tất cả"
            if (configNameToLoad === LOAD_ALL_GHI_CHU_MAY_TINH_CONFIG_NAME) {
                state.currentSearchConfig = {
                    name: LOAD_ALL_GHI_CHU_MAY_TINH_CONFIG_NAME, // Đánh dấu là cấu hình "tải tất cả"
                    field: null,
                    operator: null,
                    keyword: '', // Keyword rỗng để API hiểu là tải tất cả
                };
                return; // Kết thúc sớm
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
            localStorage.setItem('savedGhiChuMayTinhSearchConfigs', JSON.stringify(state.savedSearchConfigs));
            // Nếu cấu hình đang được sử dụng bị xóa, reset currentSearchConfig
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
} = ghiChuMayTinhSearchConfigsSlice.actions;

export default ghiChuMayTinhSearchConfigsSlice.reducer;