// src/features/positions/positionsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
    options: [], // Dùng để lưu { value, label }
    status: 'idle',
    error: null,
};

export const fetchPositionOptions = createAsyncThunk(
    'positions/fetchPositionOptions',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return rejectWithValue('No auth token found');
        }
        try {
            const response = await fetch(`https://localhost:8080/DSChucVu?token=${token}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.text();
                return rejectWithValue(errorData || `Failed to fetch positions: ${response.status}`);
            }
            const data = await response.json();
            return data.map(chucVu => ({ value: chucVu.maCV, label: chucVu.tenCV }));
        } catch (error) {
            return rejectWithValue(error.message || 'An unknown error occurred');
        }
    }
);

const positionsSlice = createSlice({
    name: 'positions',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPositionOptions.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchPositionOptions.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.options = action.payload;
            })
            .addCase(fetchPositionOptions.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
            });
    },
});

export default positionsSlice.reducer;