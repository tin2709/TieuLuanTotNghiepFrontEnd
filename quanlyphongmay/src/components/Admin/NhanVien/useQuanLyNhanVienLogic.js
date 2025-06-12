// src/hooks/useQuanLyNhanVienLogic.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Import actions và thunks từ Redux slices mới
import { fetchEmployees, convertEmployee } from '../redux/QuanLiNVRedux/employeesSlice';
import { fetchKhoaOptions } from '../redux/QuanLiNVRedux/khoaOptionsSlice';
import {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch,
    LOAD_ALL_EMPLOYEES_CONFIG_NAME // Import hằng số riêng cho nhân viên
} from '../redux/QuanLiNVRedux/employeeSearchConfigsSlice';

// --- Debounce Function ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const useQuanLyNhanVienLogic = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy dữ liệu từ Redux store
    const { data: nhanVienData, status: employeesStatus, conversionStatus } = useSelector((state) => state.employees);
    const { options: khoaOptions, status: khoaOptionsStatus } = useSelector((state) => state.khoaOptions);
    const { currentSearchConfig, searchConfigList, savedSearchConfigs } = useSelector((state) => state.employeeSearchConfigs);

    // State cục bộ cho UI
    const [collapsed, setCollapsed] = useState(false);
    const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
    const [selectedNhanVienForConversion, setSelectedNhanVienForConversion] = useState(null);
    const [hocVi, setHocVi] = useState('');
    const [selectedKhoaMaKhoa, setSelectedKhoaMaKhoa] = useState(null);


    // Giá trị searchKeyword được tạo ra từ currentSearchConfig
    const searchKeyword = useMemo(() => {
        // Chỉ tạo keyword nếu có đủ field, operator và keyword (hoặc operator là IS_NULL/IS_NOT_NULL)
        if (currentSearchConfig.field && currentSearchConfig.operator) {
            // Check if operator requires a keyword value
            const operatorRequiresKeyword = !['IS_NULL', 'IS_NOT_NULL'].includes(currentSearchConfig.operator);
            if (operatorRequiresKeyword && currentSearchConfig.keyword) {
                return `${currentSearchConfig.field}:${currentSearchConfig.operator}:${currentSearchConfig.keyword}`;
            } else if (!operatorRequiresKeyword) {
                return `${currentSearchConfig.field}:${currentSearchConfig.operator}:`; // For IS_NULL/IS_NOT_NULL, keyword is empty
            }
        }
        return ''; // Trả về rỗng nếu không đủ điều kiện
    }, [currentSearchConfig]);


    const searchFieldsOptions = useMemo(() => ([
        { value: 'tenNV', label: 'Tên Nhân Viên' },
        { value: 'email', label: 'Email' },
        { value: 'sDT', label: 'Số Điện Thoại' },
        { value: 'tenCV', label: 'Tên Chức Vụ' },
        // Thêm các trường khác nếu API search hỗ trợ
    ]), []);

    const searchOperatorsOptions = useMemo(() => ([
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'LIKE', label: 'Like' },
        { value: 'STARTS_WITH', label: 'Starts With' },
        { value: 'ENDS_WITH', label: 'Ends With' },
        // Giữ các toán tử này nếu backend hỗ trợ cho kiểu dữ liệu text/number
        { value: 'GT', label: 'Greater Than' }, // Greater Than
        { value: 'LT', label: 'Less Than' },    // Less Than
        { value: 'IN', label: 'In' },
        { value: 'NOT_IN', label: 'Not In' },
        { value: 'IS_NULL', label: 'Is Null' },
        { value: 'IS_NOT_NULL', label: 'Is Not Null' },
    ]), []);

    // Debounced fetch cho nhân viên
    const debouncedFetchEmployees = useCallback(
        debounce(() => {
            dispatch(fetchEmployees(searchKeyword));
        }, 1000),
        [dispatch, searchKeyword]
    );

    // Effects để fetch dữ liệu
    useEffect(() => {
        debouncedFetchEmployees();
    }, [searchKeyword, debouncedFetchEmployees]); // Phụ thuộc vào searchKeyword và hàm debounced

    useEffect(() => {
        dispatch(fetchKhoaOptions());
    }, [dispatch]);

    // --- Search Handlers ---
    const handleLoadAllEmployees = useCallback(() => {
        dispatch(loadSearchConfig(LOAD_ALL_EMPLOYEES_CONFIG_NAME));
    }, [dispatch]);

    const handleSearchInputChange = useCallback((e) => {
        dispatch(setCurrentSearch({ keyword: e.target.value }));
    }, [dispatch]);

    const handleSearchFieldChange = useCallback((value) => {
        // Reset keyword nếu trường thay đổi, để tránh lỗi logic với các loại input khác nhau (text/number)
        dispatch(setCurrentSearch({ field: value, keyword: '' }));
    }, [dispatch]);

    const handleSearchOperatorChange = useCallback((value) => {
        dispatch(setCurrentSearch({ operator: value }));
    }, [dispatch]);

    const handleClearSearch = useCallback(() => {
        dispatch(clearCurrentSearch());
    }, [dispatch]);

    const handleSaveSearchConfig = useCallback(async () => {
        if (!currentSearchConfig.field || !currentSearchConfig.operator || !currentSearchConfig.keyword) {
            Swal.fire('Thiếu thông tin!', 'Vui lòng nhập đầy đủ tiêu chí tìm kiếm trước khi lưu.', 'warning');
            return;
        }

        const { value: configName } = await Swal.fire({
            title: 'Đặt tên cho cấu hình tìm kiếm',
            input: 'text',
            inputValue: currentSearchConfig.name || `Tìm kiếm ${currentSearchConfig.field}`,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Bạn cần nhập tên cho cấu hình!';
                }
                if (searchConfigList.includes(value) && value !== currentSearchConfig.name) {
                    return 'Tên cấu hình này đã tồn tại!';
                }
            }
        });

        if (configName) {
            dispatch(saveCurrentSearchConfig({ name: configName }));
        }
    }, [currentSearchConfig, searchConfigList, dispatch]);

    const handleLoadSearchConfig = useCallback((configName) => {
        dispatch(loadSearchConfig(configName));
    }, [dispatch]);

    const handleRemoveSearchConfig = useCallback((configName) => {
        Swal.fire({
            title: `Bạn chắc chắn muốn xóa cấu hình "${configName}"?`,
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa!',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(removeSearchConfig(configName));
            }
        });
    }, [dispatch]);


    // --- Sidebar & Logout Handlers ---
    const handleMenuClickSidebar = useCallback((e) => {
        if (e.key === 'dashboard') navigate('/admin');
        else if (e.key === 'userManagement') navigate('/quanlitaikhoan');
        else if (e.key === 'teacherManagement') navigate('/quanlygiaovien');
        else if (e.key === 'employeeManagement') navigate('/quanlynhanvien');
        else if (e.key === 'logout') handleLogout();
    }, [navigate]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        Swal.fire({
            icon: 'success',
            title: 'Đã đăng xuất',
            text: 'Bạn đã đăng xuất thành công.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => navigate('/login'));
    }, [navigate]);

    // --- Conversion Modal Handlers ---
    const showConversionModal = useCallback((record) => {
        setSelectedNhanVienForConversion(record);
        setHocVi(''); // Reset học vị và khoa mỗi khi mở modal
        setSelectedKhoaMaKhoa(null);
        setIsConversionModalVisible(true);
    }, []);

    const handleCancelConversionModal = useCallback(() => {
        setIsConversionModalVisible(false);
        setHocVi('');
        setSelectedKhoaMaKhoa(null);
        setSelectedNhanVienForConversion(null);
    }, []);

    const handleConvertNhanVien = useCallback(async () => {
        if (!hocVi || !selectedKhoaMaKhoa || !selectedNhanVienForConversion) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Vui lòng nhập đầy đủ thông tin học vị và khoa.',
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Bạn có chắc chắn muốn chuyển đổi nhân viên này thành giáo viên?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Có, chuyển đổi!',
            cancelButtonText: 'Không, hủy bỏ!'
        });

        if (result.isConfirmed) {
            dispatch(convertEmployee({
                maNV: selectedNhanVienForConversion.maNV,
                hoTen: selectedNhanVienForConversion.hoTen,
                soDienThoai: selectedNhanVienForConversion.soDienThoai,
                email: selectedNhanVienForConversion.email,
                hocVi: hocVi,
                taiKhoanMaTK: selectedNhanVienForConversion.taiKhoanMaTK,
                khoaMaKhoa: selectedKhoaMaKhoa,
            })).then((actionResult) => {
                // Kiểm tra actionResult.meta.requestStatus để biết thành công hay thất bại
                if (actionResult.meta.requestStatus === 'fulfilled') {
                    setIsConversionModalVisible(false);
                    setHocVi('');
                    setSelectedKhoaMaKhoa(null);
                    setSelectedNhanVienForConversion(null);
                    // fetchEmployees đã được dispatch trong thunk convertEmployee, không cần gọi lại ở đây
                }
                // Nếu thất bại, Swal đã được gọi trong thunk, không cần làm gì thêm ở đây
            });
        }
    }, [hocVi, selectedKhoaMaKhoa, selectedNhanVienForConversion, dispatch]);

    return {
        // State từ Redux
        nhanVienData,
        employeesStatus,
        conversionStatus,
        khoaOptions,
        khoaOptionsStatus,
        currentSearchConfig,
        searchConfigList,
        LOAD_ALL_EMPLOYEES_CONFIG_NAME, // Export hằng số

        // State cục bộ
        collapsed,
        setCollapsed,
        isConversionModalVisible,
        selectedNhanVienForConversion,
        hocVi,
        setHocVi,
        selectedKhoaMaKhoa,
        setSelectedKhoaMaKhoa,

        // Cấu hình tìm kiếm
        searchFieldsOptions,
        searchOperatorsOptions,

        // Handlers
        handleLoadAllEmployees,
        handleSearchInputChange,
        handleSearchFieldChange,
        handleSearchOperatorChange,
        handleClearSearch,
        handleSaveSearchConfig,
        handleLoadSearchConfig,
        handleRemoveSearchConfig,
        handleMenuClickSidebar,
        handleLogout,
        showConversionModal,
        handleCancelConversionModal,
        handleConvertNhanVien,
    };
};

export default useQuanLyNhanVienLogic;