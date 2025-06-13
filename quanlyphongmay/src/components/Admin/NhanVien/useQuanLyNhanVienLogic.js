// src/hooks/useQuanLyNhanVienLogic.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Import actions và thunks từ Redux slices mới
import { fetchEmployees, convertEmployee } from '../../../redux/QuanLiNVRedux/employeesSlice';
import { fetchKhoaOptions } from '../../../redux/QuanLiNVRedux/khoaOptionsSlice';
import {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch,
    LOAD_ALL_EMPLOYEES_CONFIG_NAME // Import hằng số riêng cho nhân viên
} from '../../../redux/QuanLiNVRedux/employeeSearchConfigsSlice'; // Make sure this path is correct

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
    // Correctly select from the new slice state:
    const { currentSearchConfig, searchConfigList, savedSearchConfigs } = useSelector((state) => state.employeeSearchConfigs);

    // State cục bộ cho UI
    const [collapsed, setCollapsed] = useState(false);
    const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
    const [selectedNhanVienForConversion, setSelectedNhanVienForConversion] = useState(null);
    const [hocVi, setHocVi] = useState('');
    const [selectedKhoaMaKhoa, setSelectedKhoaMaKhoa] = useState(null);

    // NEW: State để lưu trữ các maTaiKhoanSuaLoi có lịch sửa chữa
    const [employeesWithRepairTasks, setEmployeesWithRepairTasks] = useState(new Set());
    const [repairTasksStatus, setRepairTasksStatus] = useState('idle'); // 'idle', 'loading', 'succeeded', 'failed'


    // Giá trị searchKeyword được tạo ra từ currentSearchConfig
    const searchKeyword = useMemo(() => {
        // Only generate keyword if there's enough info for a search
        if (currentSearchConfig.field && currentSearchConfig.operator) {
            const operatorRequiresKeyword = !['IS_NULL', 'IS_NOT_NULL'].includes(currentSearchConfig.operator);
            if (operatorRequiresKeyword && currentSearchConfig.keyword) {
                return `${currentSearchConfig.field}:${currentSearchConfig.operator}:${currentSearchConfig.keyword}`;
            } else if (!operatorRequiresKeyword) {
                // For IS_NULL/IS_NOT_NULL, keyword part is empty
                return `${currentSearchConfig.field}:${currentSearchConfig.operator}:`;
            }
        }
        return ''; // Return empty string if no valid search config
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

    // NEW: Function to fetch repair tasks for computers and equipment
    const fetchRepairTasks = useCallback(async () => {
        setRepairTasksStatus('loading');
        const token = localStorage.getItem("authToken");
        if (!token) {
            setRepairTasksStatus('failed');
            console.error("No token found for fetching repair tasks.");
            return;
        }

        try {
            const [computerResponse, equipmentResponse] = await Promise.all([
                fetch(`https://localhost:8080/DSGhiChuMayTinh?token=${token}`),
                fetch(`https://localhost:8080/DSGhiChuThietBi?token=${token}`)
            ]);

            let maTaiKhoanSuaLoiSet = new Set();

            // Process computer repair notes
            if (computerResponse.ok) {
                const computerData = await computerResponse.json();
                if (Array.isArray(computerData)) {
                    computerData.forEach(item => {
                        if (item.maTaiKhoanSuaLoi) {
                            maTaiKhoanSuaLoiSet.add(item.maTaiKhoanSuaLoi);
                        }
                    });
                }
            } else {
                console.error(`Failed to fetch computer repair notes: ${computerResponse.status}`);
            }

            // Process equipment repair notes
            if (equipmentResponse.ok) {
                const equipmentData = await equipmentResponse.json();
                if (Array.isArray(equipmentData)) {
                    equipmentData.forEach(item => {
                        if (item.maTaiKhoanSuaLoi) {
                            maTaiKhoanSuaLoiSet.add(item.maTaiKhoanSuaLoi);
                        }
                    });
                }
            } else {
                console.error(`Failed to fetch equipment repair notes: ${equipmentResponse.status}`);
            }

            setEmployeesWithRepairTasks(maTaiKhoanSuaLoiSet);
            setRepairTasksStatus('succeeded');
        } catch (error) {
            console.error("Failed to fetch repair tasks data:", error);
            setRepairTasksStatus('failed');
            // Swal.fire({
            //     icon: 'error',
            //     title: 'Lỗi tải lịch sửa chữa',
            //     text: 'Không thể tải dữ liệu lịch sửa chữa. Tính năng kiểm tra lịch có thể không hoạt động đúng.',
            // });
        }
    }, []);


    // Effects để fetch dữ liệu
    useEffect(() => {
        debouncedFetchEmployees();
    }, [searchKeyword, debouncedFetchEmployees]); // Phụ thuộc vào searchKeyword và hàm debounced

    useEffect(() => {
        dispatch(fetchKhoaOptions());
        fetchRepairTasks(); // NEW: Fetch repair tasks when component mounts
    }, [dispatch, fetchRepairTasks]); // Add fetchRepairTasks to dependency array


    // --- Search Handlers ---
    const handleLoadAllEmployees = useCallback(() => {
        dispatch(loadSearchConfig(LOAD_ALL_EMPLOYEES_CONFIG_NAME));
    }, [dispatch]);

    const handleSearchInputChange = useCallback((e) => {
        // Clear operator and field if keyword is cleared
        if (e.target.value === '') {
            dispatch(clearCurrentSearch());
        } else {
            dispatch(setCurrentSearch({ keyword: e.target.value }));
        }
    }, [dispatch]);

    const handleSearchFieldChange = useCallback((value) => {
        // Reset keyword if field changes, to avoid logic errors with different input types (text/number)
        dispatch(setCurrentSearch({ field: value, keyword: '' }));
    }, [dispatch]);

    const handleSearchOperatorChange = useCallback((value) => {
        dispatch(setCurrentSearch({ operator: value }));
    }, [dispatch]);

    const handleClearSearch = useCallback(() => {
        dispatch(clearCurrentSearch());
    }, [dispatch]);

    const handleSaveSearchConfig = useCallback(async () => {
        // Validation: Ensure there's a keyword, field, and operator (unless operator is IS_NULL/IS_NOT_NULL)
        const operatorRequiresKeyword = !['IS_NULL', 'IS_NOT_NULL'].includes(currentSearchConfig.operator);
        if (!currentSearchConfig.field || !currentSearchConfig.operator || (operatorRequiresKeyword && !currentSearchConfig.keyword)) {
            Swal.fire('Thiếu thông tin!', 'Vui lòng nhập đầy đủ tiêu chí tìm kiếm hoặc chọn toán tử phù hợp trước khi lưu.', 'warning');
            return;
        }

        const { value: configName } = await Swal.fire({
            title: 'Đặt tên cho cấu hình tìm kiếm',
            input: 'text',
            inputValue: currentSearchConfig.name === 'Mặc định' || currentSearchConfig.name === LOAD_ALL_EMPLOYEES_CONFIG_NAME
                ? `Tìm kiếm ${currentSearchConfig.field || ''}`
                : currentSearchConfig.name, // Pre-fill with existing name or a default
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Bạn cần nhập tên cho cấu hình!';
                }
                // Check for duplicate names, excluding itself if editing an existing config
                // We use savedSearchConfigs keys for this check
                if (Object.keys(savedSearchConfigs).includes(value) && value !== currentSearchConfig.name) {
                    return 'Tên cấu hình này đã tồn tại!';
                }
            }
        });

        if (configName) {
            // Dispatch action to save the current search config with the given name
            dispatch(saveCurrentSearchConfig({ name: configName }));
            Swal.fire('Thành công!', `Cấu hình tìm kiếm "${configName}" đã được lưu.`, 'success');
        }
    }, [currentSearchConfig, savedSearchConfigs, dispatch]); // Use savedSearchConfigs for validation

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
                Swal.fire('Đã xóa!', `Cấu hình tìm kiếm "${configName}" đã được xóa.`, 'success');
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
                maNV: selectedNhanVienForConversion.maNhanVien, // Use maNhanVien as per data structure
                hoTen: selectedNhanVienForConversion.hoTen,
                soDienThoai: selectedNhanVienForConversion.soDienThoai,
                email: selectedNhanVienForConversion.email,
                hocVi: hocVi,
                taiKhoanMaTK: selectedNhanVienForConversion.taiKhoanMaTK,
                khoaMaKhoa: selectedKhoaMaKhoa,
            })).then((actionResult) => {
                if (actionResult.meta.requestStatus === 'fulfilled') {
                    setIsConversionModalVisible(false);
                    setHocVi('');
                    setSelectedKhoaMaKhoa(null);
                    setSelectedNhanVienForConversion(null);
                    Swal.fire('Thành công!', 'Chuyển đổi vai trò thành công!', 'success');
                    // NEW: Cập nhật lại danh sách lịch sửa chữa sau khi chuyển đổi thành công
                    fetchRepairTasks();
                } else if (actionResult.meta.requestStatus === 'rejected') {
                    // Assuming error message is already handled in thunk
                    Swal.fire('Thất bại!', actionResult.payload || 'Chuyển đổi vai trò thất bại.', 'error');
                }
            });
        }
    }, [hocVi, selectedKhoaMaKhoa, selectedNhanVienForConversion, dispatch, fetchRepairTasks]); // Add fetchRepairTasks to dependency array

    return {
        // State từ Redux
        nhanVienData,
        employeesStatus,
        conversionStatus,
        khoaOptions,
        khoaOptionsStatus,
        currentSearchConfig,
        searchConfigList,
        // savedSearchConfigs, // Not directly used by UI, but useful for debugging
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
        employeesWithRepairTasks, // NEW: Export employeesWithRepairTasks
        repairTasksStatus,       // NEW: Export repairTasksStatus

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