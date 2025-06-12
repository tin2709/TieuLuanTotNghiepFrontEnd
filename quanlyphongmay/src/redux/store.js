// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import teachersReducer from './QuanLiGVRedux/teachersSlice';
import positionsReducer from './QuanLiGVRedux/positionsSlice';
import searchConfigsReducer from './QuanLiGVRedux/searchConfigsSlice'; // for teachers

import employeesReducer from './QuanLiNVRedux/employeesSlice';
import khoaOptionsReducer from './QuanLiNVRedux/khoaOptionsSlice';
import employeeSearchConfigsReducer from './QuanLiNVRedux/employeeSearchConfigsSlice'; // for employees
import chucVuOptionsReducer from './QuanLiNVRedux/chucVuOptionsSlice'; // <-- Add this

// IMPORT MỚI
import ghiChuMayTinhSearchConfigsReducer from './QuanLiGhiChuMayTinhRedux/ghiChuMayTinhSearchConfigsSlice'; // for ghiChuMayTinh

// IMPORT MỚI CHO MÔN HỌC


// IMPORT MỚI CHO GHI CHÚ THIẾT BỊ
import ghiChuThietBiSearchConfigsReducer from './QuanLiGhiChuThietBiRedux/ghiChuThietBiSearchConfigsSlice';


export const store = configureStore({
    reducer: {
        teachers: teachersReducer,
        positions: positionsReducer,
        searchConfigs: searchConfigsReducer, // for teachers
        employees: employeesReducer,
        khoaOptions: khoaOptionsReducer,

        employeeSearchConfigs: employeeSearchConfigsReducer, // for employees
        ghiChuMayTinhSearchConfigs: ghiChuMayTinhSearchConfigsReducer, // for ghiChuMayTinh

        ghiChuThietBiSearchConfigs: ghiChuThietBiSearchConfigsReducer, // <-- THÊM DÒNG


    },
});

export default store;