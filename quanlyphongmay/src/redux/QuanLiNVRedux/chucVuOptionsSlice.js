// src/redux/QuanLiNVRedux/chucVuOptionsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
    options: [], // To store { value: maCV, label: tenCV }
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// Async Thunk để fetch danh sách chức vụ
export const fetchChucVuOptions = createAsyncThunk(
    'chucVuOptions/fetchChucVuOptions',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return rejectWithValue('No auth token found');
        }
        try {
            // Assuming your backend has an endpoint for fetching all ChucVu
            const response = await fetch(`https://localhost:8080/DSChucVu?token=${token}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.text();
                return rejectWithValue(errorData || `Failed to fetch chucVu: ${response.status}`);
            }
            const data = await response.json();
            // Map the data to { value: maCV, label: tenCV } format
            return data.map(cv => ({ value: cv.maCV, label: cv.tenCV }));
        } catch (error) {
            console.error("Error fetching chucVu options:", error);
            return rejectWithValue(error.message || 'An unknown error occurred while fetching chucVu options');
        }
    }
);

const chucVuOptionsSlice = createSlice({
    name: 'chucVuOptions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchChucVuOptions.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchChucVuOptions.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.options = action.payload;
            })
            .addCase(fetchChucVuOptions.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            });
    },
});

export default chucVuOptionsSlice.reducer;