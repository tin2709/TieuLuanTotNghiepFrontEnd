// src/redux/QuanLiNVRedux/employeesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Swal from 'sweetalert2';

const initialState = {
    data: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
    conversionStatus: 'idle', // Trạng thái riêng cho việc chuyển đổi
    conversionError: null,
    addStatus: 'idle', // NEW: Trạng thái riêng cho việc thêm mới
    addError: null,    // NEW: Lỗi khi thêm mới
};

// Async Thunk để fetch danh sách nhân viên
export const fetchEmployees = createAsyncThunk(
    'employees/fetchEmployees',
    async (searchKeyword = '', { rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi xác thực',
                text: 'Không tìm thấy token. Vui lòng đăng nhập lại.',
            }).then(() => window.location.href = '/login'); // Redirect to login
            return rejectWithValue('No auth token found');
        }
        let apiUrl = `https://localhost:8080/DSNhanVien?token=${token}`;
        if (searchKeyword) {
            apiUrl = `https://localhost:8080/searchNhanVienByAdmin?keyword=${searchKeyword}&token=${token}`;
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
                console.error('Fetch employees error:', response.status, errorData);
                if (response.status === 401 || response.status === 403) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Phiên Đăng Nhập Hết Hạn',
                        text: 'Vui lòng đăng nhập lại.',
                        confirmButtonText: 'Đăng Nhập Lại'
                    }).then(() => window.location.href = '/login'); // Redirect to login
                }
                return rejectWithValue(errorData || `Failed to fetch employees: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textData = await response.text();
                console.error('Invalid content type for employees:', contentType, textData);
                return rejectWithValue('Invalid content type from server for employees data');
            }

            const data = await response.json();
            if (data && Array.isArray(data.results)) {
                return data.results;
            } else if (Array.isArray(data)) {
                return data;
            }
            console.error("Received employee data is not in expected format:", data);
            return rejectWithValue('Received employee data is not in expected format');
        } catch (err) {
            // console.error("Error fetching employees:", err);
            // Swal.fire({
            //     icon: 'error',
            //     title: 'Lỗi',
            //     text: `Không thể tải dữ liệu nhân viên: ${err.message}`,
            // });
            return rejectWithValue(err.message || 'An unknown error occurred while fetching employees');
        }
    }
);

// Async Thunk để chuyển đổi nhân viên thành giáo viên
export const convertEmployee = createAsyncThunk(
    'employees/convertEmployee',
    async ({ maNV, hoTen, soDienThoai, email, hocVi, taiKhoanMaTK, khoaMaKhoa }, { dispatch, rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi xác thực',
                text: 'Không tìm thấy token. Vui lòng đăng nhập lại.',
            }).then(() => window.location.href = '/login'); // Redirect to login
            return rejectWithValue('No auth token found');
        }
        try {
            const url = new URL('https://localhost:8080/chuyendoinhanvien');
            url.searchParams.append('token', token);
            url.searchParams.append('maNV', maNV.toString());
            url.searchParams.append('hoTen', hoTen);
            url.searchParams.append('soDienThoai', soDienThoai);
            url.searchParams.append('email', email);
            url.searchParams.append('hocVi', hocVi);
            url.searchParams.append('taiKhoanMaTK', taiKhoanMaTK);
            url.searchParams.append('khoaMaKhoa', khoaMaKhoa);

            const response = await fetch(url.toString(), {
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
                    text: `Chuyển đổi nhân viên thất bại: ${errorData || response.statusText}`,
                });
                return rejectWithValue(errorData || `Conversion failed: ${response.status}`);
            }
            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Nhân viên đã được chuyển đổi thành giáo viên.',
                timer: 1500,
                showConfirmButton: false,
            });
            dispatch(fetchEmployees()); // Refresh the list
            return await response.json();
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

// NEW: Async Thunk để thêm nhân viên mới
export const addEmployee = createAsyncThunk(
    'employees/addEmployee',
    async (employeeData, { dispatch, rejectWithValue }) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi xác thực',
                text: 'Không tìm thấy token. Vui lòng đăng nhập lại.',
            }).then(() => window.location.href = '/login');
            return rejectWithValue('No auth token found');
        }
        try {
            // Ensure employeeData matches backend's expected payload for POST
            // e.g., { tenNV, email, sDT, maChucVu }
            const payload = {
                tenNV: employeeData.hoTen, // map hoTen to tenNV for backend
                email: employeeData.email,
                sDT: employeeData.soDienThoai, // map soDienThoai to sDT for backend
                maChucVu: employeeData.maChucVu,
                // taiKhoanMaTK is likely generated by backend or assigned separately
            };

            const response = await fetch(`https://localhost:8080/themNhanVien?token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                const errorMessage = errorText || response.statusText;
                console.error('Add employee error:', response.status, errorMessage);
                Swal.fire({
                    icon: 'error',
                    title: 'Thêm nhân viên thất bại',
                    text: `Lỗi: ${errorMessage}`,
                });
                return rejectWithValue(errorMessage);
            }

            Swal.fire({
                icon: 'success',
                title: 'Thành công!',
                text: 'Nhân viên đã được thêm.',
                timer: 1500,
                showConfirmButton: false,
            });
            dispatch(fetchEmployees()); // Refresh the list after successful addition
            return await response.json();
        } catch (error) {
            console.error('Error adding employee:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Đã có lỗi xảy ra khi thêm nhân viên.',
            });
            return rejectWithValue(error.message || 'An unknown error occurred while adding employee');
        }
    }
);


const employeesSlice = createSlice({
    name: 'employees',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            // Fetch Employees
            .addCase(fetchEmployees.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchEmployees.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload.map((item, index) => ({
                    ...item,
                    key: item.maNhanVien,
                    stt: index + 1,
                    tenCV: item.chucVu ? item.chucVu.tenCV : 'N/A',
                    maNV: item.maNhanVien,
                    taiKhoanMaTK: item.taiKhoan ? item.taiKhoan.maTK : null,
                    email: item.email,
                    hoTen: item.tenNV,
                    soDienThoai: item.sDT,
                    isTeacher: item.maGiaoVien ? true : false,
                }));
            })
            .addCase(fetchEmployees.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload || action.error.message;
                state.data = [];
            })
            // Convert Employee
            .addCase(convertEmployee.pending, (state) => {
                state.conversionStatus = 'loading';
                state.conversionError = null;
            })
            .addCase(convertEmployee.fulfilled, (state) => {
                state.conversionStatus = 'succeeded';
            })
            .addCase(convertEmployee.rejected, (state, action) => {
                state.conversionStatus = 'failed';
                state.conversionError = action.payload || action.error.message;
            })
            // NEW: Add Employee
            .addCase(addEmployee.pending, (state) => {
                state.addStatus = 'loading';
                state.addError = null;
            })
            .addCase(addEmployee.fulfilled, (state) => {
                state.addStatus = 'succeeded';
                // No need to modify state.data here, as fetchEmployees() will be dispatched to refresh
            })
            .addCase(addEmployee.rejected, (state, action) => {
                state.addStatus = 'failed';
                state.addError = action.payload || action.error.message;
            });
    },
});

export default employeesSlice.reducer;