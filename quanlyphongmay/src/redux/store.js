// src/app/store.js
import { configureStore } from '@reduxjs/toolkit';
import teachersReducer from '../redux/QuanLiGVRedux/teachersSlice';
import positionsReducer from '../redux/QuanLiGVRedux/positionsSlice';
import searchConfigsReducer from '../redux/QuanLiGVRedux/searchConfigsSlice';

export const store = configureStore({
    reducer: {
        teachers: teachersReducer,
        positions: positionsReducer,
        searchConfigs: searchConfigsReducer,
    },
});

export default store;