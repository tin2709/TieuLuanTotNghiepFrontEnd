// src/redux/QuanLiGhiChuThietBiRedux/ghiChuThietBiSearchConfigsSlice.js
import { createSlice, nanoid } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

// Định nghĩa một tên đặc biệt cho cấu hình tải tất cả ghi chú thiết bị
export const LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME = '__LOAD_ALL_GHI_CHU_TB__';

const initialState = {
    // Lưu vào localStorage với key riêng cho GhiChuThietBi
    savedSearchConfigs: JSON.parse(localStorage.getItem('savedGhiChuThietBiSearchConfigs')) || [],
    currentSearchConfig: {
        name: '', // Tên của cấu hình đang được áp dụng/xây dựng
        field: null,
        operator: null,
        keyword: '', // Chuỗi giá trị tìm kiếm
    },
    // Danh sách tên cấu hình đã lưu, dùng cho dropdown (cũng đọc từ localStorage)
    searchConfigList: (JSON.parse(localStorage.getItem('savedGhiChuThietBiSearchConfigs')) || []).map(config => config.name),
};

const ghiChuThietBiSearchConfigsSlice = createSlice({
    name: 'ghiChuThietBiSearchConfigs', // Tên slice độc nhất
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

            // Kiểm tra xem tên cấu hình đã tồn tại chưa để cập nhật hoặc thêm mới
            const existingConfigIndex = state.savedSearchConfigs.findIndex(config => config.name === name);
            if (existingConfigIndex !== -1) {
                state.savedSearchConfigs[existingConfigIndex] = newConfig;
            } else {
                state.savedSearchConfigs.push(newConfig);
            }
            state.searchConfigList = state.savedSearchConfigs.map(config => config.name);
            // Lưu vào localStorage với key riêng
            localStorage.setItem('savedGhiChuThietBiSearchConfigs', JSON.stringify(state.savedSearchConfigs));
            Swal.fire('Đã lưu!', `Cấu hình tìm kiếm "${name}" đã được lưu.`, 'success');
        },
        loadSearchConfig: (state, action) => {
            const configNameToLoad = action.payload;

            // Xử lý trường hợp tải cấu hình "Tải tất cả"
            if (configNameToLoad === LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME) {
                state.currentSearchConfig = {
                    name: LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME, // Đánh dấu là cấu hình "tải tất cả"
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
            // Loại bỏ cấu hình khỏi danh sách
            state.savedSearchConfigs = state.savedSearchConfigs.filter(config => config.name !== configNameToRemove);
            state.searchConfigList = state.savedSearchConfigs.map(config => config.name);
            // Cập nhật localStorage
            localStorage.setItem('savedGhiChuThietBiSearchConfigs', JSON.stringify(state.savedSearchConfigs));
            // Nếu cấu hình đang được sử dụng bị xóa, reset currentSearchConfig
            if (state.currentSearchConfig.name === configNameToRemove) {
                state.currentSearchConfig = { name: '', field: null, operator: null, keyword: '' };
            }
            Swal.fire('Đã xóa!', `Cấu hình tìm kiếm "${configNameToRemove}" đã được xóa.`, 'success');
        },
        clearCurrentSearch: (state) => {
            // Đặt lại currentSearchConfig về trạng thái ban đầu rỗng
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
} = ghiChuThietBiSearchConfigsSlice.actions;

export default ghiChuThietBiSearchConfigsSlice.reducer;