// src/features/teachers/teachersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

const initialState = {
    data: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    conversionStatus: 'idle', // Trạng thái cho việc chuyển đổi
    conversionError: null,
};

// Async Thunk để fetch danh sách giáo viên
export const fetchTeachers = createAsyncThunk(
    'teachers/fetchTeachers',
    async (searchKeyword = '', { rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return rejectWithValue('No auth token found');
        }
        let apiUrl = `https://localhost:8080/DSGiaoVien?token=${token}`;
        if (searchKeyword) {
            apiUrl = `https://localhost:8080/searchGiaoVienByAdmin?keyword=${searchKeyword}&token=${token}`;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Fetch error:', response.status, errorData);
                return rejectWithValue(errorData || `Failed to fetch teachers: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textData = await response.text();
                console.error('Invalid content type:', contentType, textData);
                return rejectWithValue('Invalid content type from server');
            }

            const data = await response.json();
            if (data && Array.isArray(data.results)) {
                return data.results;
            } else if (Array.isArray(data)) {
                return data;
            }
            console.error("Received data is not in expected format:", data);
            return rejectWithValue('Received data is not in expected format');
        } catch (err) {
            console.error("Error fetching teachers:", err);
            return rejectWithValue(err.message || 'An unknown error occurred');
        }
    }
);

// Async Thunk để chuyển đổi giáo viên
export const convertTeacher = createAsyncThunk(
    'teachers/convertTeacher',
    async ({ maGiaoVienItem, hoTen, email, soDienThoai, maCV, taiKhoanMaTK }, { dispatch, rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            return rejectWithValue('No auth token found');
        }
        try {
            const response = await fetch(`https://localhost:8080/chuyendoigiaovien?token=${token}&maGV=${maGiaoVienItem}&tenNV=${hoTen}&email=${email}&sDT=${soDienThoai}&maCV=${maCV}&taiKhoanMaTK=${taiKhoanMaTK}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi chuyển đổi',
                    text: `Chuyển đổi giáo viên thất bại: ${errorData || response.status}`,
                });
                return rejectWithValue(errorData || `Conversion failed: ${response.status}`);
            }
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Giáo viên đã được chuyển đổi thành công.',
                timer: 1500,
                showConfirmButton: false,
            });
            // Sau khi chuyển đổi thành công, fetch lại danh sách giáo viên
            dispatch(fetchTeachers()); // Hoặc bạn có thể truyền searchKeyword hiện tại nếu cần
            return await response.json(); // Hoặc text() nếu API không trả JSON
        } catch (error) {
            console.error('Error during conversion:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Đã có lỗi xảy ra trong quá trình chuyển đổi.',
            });
            return rejectWithValue(error.message || 'An unknown error occurred during conversion');
        }
    }
);


const teachersSlice = createSlice({
    name: 'teachers',
    initialState,
    reducers: {
        // Có thể thêm các reducers đồng bộ khác nếu cần
    },
    extraReducers: (builder) => {
        builder
            // Fetch Teachers
            .addCase(fetchTeachers.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchTeachers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // Xử lý dữ liệu nhận được, tương tự như trong component cũ
                state.data = action.payload.map((item, index) => {
                    let tenKhoaValue = 'N/A';
                    if (item.tenKhoa) {
                        tenKhoaValue = item.tenKhoa;
                    } else if (typeof item.khoa === 'object' && item.khoa && item.khoa.tenKhoa) {
                        tenKhoaValue = item.khoa.tenKhoa;
                    } else if (typeof item.khoa === 'string') {
                        tenKhoaValue = item.khoa;
                    } else if (typeof item.khoa === 'number') {
                        if (item.khoa === 1) tenKhoaValue = 'Khoa Công Nghệ Thông Tin';
                        else if (item.khoa === 2) tenKhoaValue = 'Khoa Công Nghệ Hóa Học';
                    }
                    return {
                        ...item,
                        key: item.maGiaoVien,
                        stt: index + 1,
                        tenKhoa: tenKhoaValue,
                        maKhoa: typeof item.khoa === 'object' && item.khoa ? item.khoa.maKhoa : item.khoa,
                        tenTaiKhoan: item.taiKhoan ? item.taiKhoan.tenDangNhap : 'N/A',
                        taiKhoanMaTK: item.taiKhoan ? item.taiKhoan.maTK : null,
                        email: item.email,
                        soDienThoai: item.soDienThoai,
                        hoTen: item.hoTen,
                        maGiaoVienItem: item.maGiaoVien,
                        hocViItem: item.hocVi,
                    };
                });
            })
            .addCase(fetchTeachers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
                state.data = []; // Reset data on error
            })
            // Convert Teacher
            .addCase(convertTeacher.pending, (state) => {
                state.conversionStatus = 'loading';
                state.conversionError = null;
            })
            .addCase(convertTeacher.fulfilled, (state) => {
                state.conversionStatus = 'succeeded';
                // Không cần cập nhật data ở đây vì fetchTeachers đã được gọi
            })
            .addCase(convertTeacher.rejected, (state, action) => {
                state.conversionStatus = 'failed';
                state.conversionError = action.payload || action.error.message;
            });
    },
});

export default teachersSlice.reducer;