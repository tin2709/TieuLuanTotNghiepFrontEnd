import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Swal from 'sweetalert2'; // Sử dụng Swal để hiển thị lỗi

// Define the async thunk for fetching khoa options
export const fetchKhoaOptions = createAsyncThunk(
    'khoaOptions/fetchKhoaOptions', // Unique action type string for this thunk
    async (_, { rejectWithValue }) => { // '_' means no arguments are passed, { rejectWithValue } is for custom error handling
        const token = localStorage.getItem('authToken');

        if (!token) {
            // If no token, reject the thunk with a specific error message
            return rejectWithValue('Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
        }

        try {
            const response = await fetch(`https://localhost:8080/DSKhoa?token=${token}`, {
                headers: {
                    'Authorization': `Bearer ${token}`, // It's good practice to send token in header too
                },
            });

            if (!response.ok) {
                // If API response is not OK, try to parse error message from response body
                const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response.' }));
                // Reject the thunk with the error message from the backend or a default one
                return rejectWithValue(errorData.message || `Lỗi ${response.status}: Không thể tải danh sách khoa.`);
            }

            const data = await response.json();
            // Map the data to { value, label } format which is suitable for Ant Design Select component
            // Assuming the API returns an array of objects like { maKhoa: ..., tenKhoa: ... }
            return data.map(khoa => ({ value: khoa.maKhoa, label: khoa.tenKhoa }));

        } catch (error) {
            // Handle network errors or other unexpected exceptions
            return rejectWithValue('Lỗi mạng hoặc không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại.');
        }
    }
);

// Define the initial state for the khoa options slice
const initialState = {
    options: [], // Array to hold the fetched khoa options
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null, // To store any error messages
};

// Create the khoa options slice using createSlice
const khoaOptionsSlice = createSlice({
    name: 'khoaOptions', // Name of the slice, used as a prefix for generated action types
    initialState,
    reducers: {
        // No synchronous reducers are needed for this slice as all state updates come from async thunk
    },
    extraReducers: (builder) => {
        builder
            // Handle the pending state of fetchKhoaOptions thunk
            .addCase(fetchKhoaOptions.pending, (state) => {
                state.status = 'loading'; // Set status to loading
                state.error = null; // Clear any previous error
            })
            // Handle the fulfilled (successful) state of fetchKhoaOptions thunk
            .addCase(fetchKhoaOptions.fulfilled, (state, action) => {
                state.status = 'succeeded'; // Set status to succeeded
                state.options = action.payload; // Store the fetched and mapped data in options
            })
            // Handle the rejected (failed) state of fetchKhoaOptions thunk
            .addCase(fetchKhoaOptions.rejected, (state, action) => {
                state.status = 'failed'; // Set status to failed
                // Store the error message. Use action.payload if rejectWithValue was used, otherwise action.error.message
                state.error = action.payload || action.error.message;
                state.options = []; // Clear options on failure to prevent stale data
                // Optionally, show a Swal alert directly from the slice (or let the component handle it)
                // Swal.fire({
                //     icon: 'error',
                //     title: 'Lỗi tải danh sách khoa',
                //     text: action.payload || action.error.message || 'Đã xảy ra lỗi không xác định khi tải khoa.',
                // });
            });
    },
});

// Export the reducer. This will be combined in your root Redux store.
export default khoaOptionsSlice.reducer;