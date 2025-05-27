// src/features/searchConfigs/searchConfigsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

// Định nghĩa một tên đặc biệt cho cấu hình tải tất cả
export const LOAD_ALL_CONFIG_NAME = '__LOAD_ALL_TEACHERS__';

const initialState = {
    savedSearchConfigs: JSON.parse(localStorage.getItem('savedTeacherSearchConfigs')) || [],
    currentSearchConfig: {
        name: '',
        field: null,
        operator: null,
        keyword: '',
    },
    searchConfigList: (JSON.parse(localStorage.getItem('savedTeacherSearchConfigs')) || []).map(config => config.name),
};

const searchConfigsSlice = createSlice({
    name: 'searchConfigs',
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
            localStorage.setItem('savedTeacherSearchConfigs', JSON.stringify(state.savedSearchConfigs));
            Swal.fire('Đã lưu!', `Cấu hình tìm kiếm "${name}" đã được lưu.`, 'success');
        },
        loadSearchConfig: (state, action) => {
            const configNameToLoad = action.payload;

            // Xử lý trường hợp tải cấu hình "Tải tất cả"
            if (configNameToLoad === LOAD_ALL_CONFIG_NAME) {
                state.currentSearchConfig = {
                    name: LOAD_ALL_CONFIG_NAME, // Có thể đặt tên hoặc để trống
                    field: null,
                    operator: null,
                    keyword: '', // Quan trọng: keyword rỗng để tải tất cả
                };
                // Không cần thông báo Swal ở đây vì nó là hành động reset
                // Hoặc có thể thông báo "Đã tải lại danh sách đầy đủ."
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
            localStorage.setItem('savedTeacherSearchConfigs', JSON.stringify(state.savedSearchConfigs));
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
} = searchConfigsSlice.actions;

export default searchConfigsSlice.reducer;