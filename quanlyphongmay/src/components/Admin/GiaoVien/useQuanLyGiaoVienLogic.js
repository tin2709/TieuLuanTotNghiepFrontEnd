// src/hooks/useQuanLyGiaoVienLogic.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Import actions và thunks từ Redux slices
import { fetchTeachers, convertTeacher } from '../../../redux/QuanLiGVRedux/teachersSlice';
import { fetchPositionOptions } from '../../../redux/QuanLiGVRedux/positionsSlice';
import {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch,
    LOAD_ALL_CONFIG_NAME
} from '../../../redux/QuanLiGVRedux/searchConfigsSlice';

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

const useQuanLyGiaoVienLogic = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy dữ liệu từ Redux store
    const { data: giaoVienData, status: teachersStatus, conversionStatus } = useSelector((state) => state.teachers);
    const { options: chucVuOptions, status: positionsStatus } = useSelector((state) => state.positions);
    const { currentSearchConfig, searchConfigList, savedSearchConfigs } = useSelector((state) => state.searchConfigs);

    // State cục bộ cho UI
    const [collapsed, setCollapsed] = useState(false);
    const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
    const [selectedGiaoVienForConversion, setSelectedGiaoVienForConversion] = useState(null);
    const [selectedChucVu, setSelectedChucVu] = useState(null);
    // NEW: State để lưu trữ các maGiaoVien có ca thực hành
    const [teachersWithCa, setTeachersWithCa] = useState(new Set());
    const [caThucHanhStatus, setCaThucHanhStatus] = useState('idle'); // 'idle', 'loading', 'succeeded', 'failed'


    // Giá trị searchKeyword được tạo ra từ currentSearchConfig
    const searchKeyword = useMemo(() => {
        if (currentSearchConfig.keyword && currentSearchConfig.field && currentSearchConfig.operator) {
            return `${currentSearchConfig.field}:${currentSearchConfig.operator}:${currentSearchConfig.keyword}`;
        }
        return '';
    }, [currentSearchConfig]);

    // Cấu hình các lựa chọn tìm kiếm
    const searchFieldsOptions = useMemo(() => ([
        { value: 'hoTen', label: 'Họ Tên' },
        { value: 'soDienThoai', label: 'Số Điện Thoại' },
        { value: 'email', label: 'Email' },
        { value: 'hocVi', label: 'Học Vị' },
        { value: 'tenKhoa', label: 'Tên Khoa' },
    ]), []);

    const searchOperatorsOptions = useMemo(() => ([
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'LIKE', label: 'Like' },
        { value: 'STARTS_WITH', label: 'Starts With' },
        { value: 'ENDS_WITH', label: 'Ends With' },
    ]), []);

    // Debounced fetch for teachers
    const debouncedFetchTeachers = useCallback(
        debounce(() => {
            dispatch(fetchTeachers(searchKeyword));
        }, 1000),
        [dispatch, searchKeyword]
    );

    // NEW: Function to fetch DSCaThucHanh
    const fetchCaThucHanhTeachers = useCallback(async () => {
        setCaThucHanhStatus('loading');
        const token = localStorage.getItem("authToken");
        if (!token) {
            setCaThucHanhStatus('failed');
            console.error("No token found for fetching CaThucHanh.");
            return;
        }

        try {
            const url = `https://localhost:8080/DSCaThucHanh?token=${token}`;
            const response = await fetch(url);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API error: ${response.status}`);
            }

            const data = await response.json();
            const maGiaoVienSet = new Set();
            if (Array.isArray(data)) {
                data.forEach(ca => {
                    if (ca.giaoVien && ca.giaoVien.maGiaoVien) {
                        maGiaoVienSet.add(ca.giaoVien.maGiaoVien);
                    }
                });
            }
            setTeachersWithCa(maGiaoVienSet);
            setCaThucHanhStatus('succeeded');
        } catch (error) {
            console.error("Failed to fetch CaThucHanh data:", error);
            setCaThucHanhStatus('failed');
            // Swal.fire({
            //     icon: 'error',
            //     title: 'Lỗi tải Ca Thực Hành',
            //     text: 'Không thể tải dữ liệu ca thực hành. Tính năng kiểm tra ca có thể không hoạt động đúng.',
            // });
        }
    }, []);


    // Effect để fetch dữ liệu khi searchKeyword thay đổi
    useEffect(() => {
        debouncedFetchTeachers();
    }, [searchKeyword, debouncedFetchTeachers]);

    // Effect để fetch danh sách chức vụ và ca thực hành khi component mount
    useEffect(() => {
        dispatch(fetchPositionOptions());
        fetchCaThucHanhTeachers(); // NEW: Fetch ca thực hành khi mount
    }, [dispatch, fetchCaThucHanhTeachers]);

    // --- Search Handlers ---
    const handleLoadAllTeachers = useCallback(() => {
        dispatch(loadSearchConfig(LOAD_ALL_CONFIG_NAME));
    }, [dispatch]);

    const handleSearchInputChange = useCallback((e) => {
        dispatch(setCurrentSearch({ keyword: e.target.value }));
    }, [dispatch]);

    const handleSearchFieldChange = useCallback((value) => {
        dispatch(setCurrentSearch({ field: value }));
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
                // Kiểm tra tên trùng, loại trừ trường hợp đang chỉnh sửa chính nó
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
        else if (e.key === 'employeeManagement') navigate('/quanlinhanvien');
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
        setSelectedGiaoVienForConversion(record);
        setIsConversionModalVisible(true);
    }, []);

    const handleCancelConversionModal = useCallback(() => {
        setIsConversionModalVisible(false);
        setSelectedChucVu(null);
        setSelectedGiaoVienForConversion(null);
    }, []);

    const handleConvertGiaoVien = useCallback(async () => {
        if (!selectedGiaoVienForConversion || !selectedChucVu) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Vui lòng chọn chức vụ.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Bạn có chắc chắn muốn chuyển đổi giáo viên này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Có, chuyển đổi!',
            cancelButtonText: 'Không, hủy bỏ!'
        });

        if (result.isConfirmed) {
            dispatch(convertTeacher({
                maGiaoVienItem: selectedGiaoVienForConversion.maGiaoVienItem,
                hoTen: selectedGiaoVienForConversion.hoTen,
                email: selectedGiaoVienForConversion.email,
                soDienThoai: selectedGiaoVienForConversion.soDienThoai,
                maCV: selectedChucVu,
                taiKhoanMaTK: selectedGiaoVienForConversion.taiKhoanMaTK, // Corrected typo here
            })).then((actionResult) => {
                // Kiểm tra actionResult.meta.requestStatus để biết thành công hay thất bại
                if (actionResult.meta.requestStatus === 'fulfilled') {
                    setIsConversionModalVisible(false);
                    setSelectedChucVu(null);
                    setSelectedGiaoVienForConversion(null);
                    // fetchTeachers đã được dispatch trong thunk convertTeacher, không cần gọi lại ở đây
                    // NEW: Cập nhật lại danh sách ca thực hành sau khi chuyển đổi thành công
                    fetchCaThucHanhTeachers();
                }
                // Nếu thất bại, Swal đã được gọi trong thunk, không cần làm gì thêm ở đây
            });
        }
    }, [selectedGiaoVienForConversion, selectedChucVu, dispatch, fetchCaThucHanhTeachers]); // Add fetchCaThucHanhTeachers to dependency array

    // Trả về tất cả state và hàm cần thiết cho component UI
    return {
        // State từ Redux
        giaoVienData,
        teachersStatus,
        conversionStatus,
        chucVuOptions,
        positionsStatus,
        currentSearchConfig,
        searchConfigList,
        savedSearchConfigs,
        LOAD_ALL_CONFIG_NAME,

        // State cục bộ
        collapsed,
        setCollapsed,
        isConversionModalVisible,
        selectedGiaoVienForConversion,
        selectedChucVu,
        setSelectedChucVu,
        teachersWithCa, // NEW: Export teachersWithCa
        caThucHanhStatus, // NEW: Export caThucHanhStatus

        // Cấu hình tìm kiếm
        searchFieldsOptions,
        searchOperatorsOptions,

        // Handlers
        handleLoadAllTeachers,
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
        handleConvertGiaoVien,
    };
};

export default useQuanLyGiaoVienLogic;