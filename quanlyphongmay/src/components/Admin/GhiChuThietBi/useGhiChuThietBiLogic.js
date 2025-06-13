// src/pages/useGhiChuThietBiLogic.js
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'; // Add useMemo
import { message, Form } from 'antd';
import Swal from 'sweetalert2';
import { useNavigate, useLoaderData } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// Import Redux
import { useSelector, useDispatch } from 'react-redux';
import {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch,
    LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME // Import the new constant
} from '../../../redux/QuanLiGhiChuThietBiRedux/ghiChuThietBiSearchConfigsSlice'; // Correct path to the new slice

// --- Day.js Setup ---
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('vi');

// --- Debounce Function ---
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const useGhiChuThietBiLogic = () => {
    // --- Hooks ---
    const loaderData = useLoaderData();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const dispatch = useDispatch(); // Initialize useDispatch

    // --- State từ Redux ---
    const { currentSearchConfig, searchConfigList, savedSearchConfigs } = useSelector(
        (state) => state.ghiChuThietBiSearchConfigs // Select from the new slice
    );

    // --- State cục bộ ---
    const [ghiChuData, setGhiChuData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    // Employee List State
    const [nhanVienList, setNhanVienList] = useState([]);
    const [nhanVienLoading, setNhanVienLoading] = useState(false);

    // Ref to prevent multiple notifications within the SAME component instance
    const hasNotifiedUnscheduledInSession = useRef(false);

    // --- Search Configuration (kept local, could be moved to Redux if needed globally) ---
    const searchFieldsOptions = useMemo(() => [
        { value: 'noiDung', label: 'Nội dung Ghi chú', type: 'text' },
        { value: 'ngayBaoLoi', label: 'Ngày Báo Lỗi', type: 'date' },
        { value: 'ngaySua', label: 'Ngày Sửa', type: 'date' },
        { value: 'tenTKBL', label: 'Tên Người Báo Lỗi', type: 'text' },
        { value: 'maTKBL', label: 'Mã Người Báo Lỗi', type: 'number' },
        { value: 'tenTKSL', label: 'Tên Người Sửa Lỗi', type: 'text' },
        { value: 'maTKSL', label: 'Mã Người Sửa Lỗi', type: 'number' },
        { value: 'maThietBi', label: 'Mã Thiết Bị', type: 'number' },
        { value: 'tenThietBi', label: 'Tên Thiết Bị', type: 'text' },
        { value: 'maLoai', label: 'Mã Loại TB', type: 'number' },
        { value: 'tenLoai', label: 'Tên Loại TB', type: 'text' },
        { value: 'maPhong', label: 'Mã Phòng', type: 'number' },
        { value: 'tenPhong', label: 'Tên Phòng', type: 'text' },
    ], []);

    const searchOperatorsOptions = useMemo(() => [
        { value: 'EQUALS', label: 'Bằng (=)', types: ['text', 'number', 'date'] },
        { value: 'NOT_EQUALS', label: 'Không bằng (!=)', types: ['text', 'number', 'date'] },
        { value: 'LIKE', label: 'Chứa (like)', types: ['text'] },
        { value: 'NOT_LIKE', label: 'Không chứa (not like)', types: ['text'] },
        { value: 'STARTS_WITH', label: 'Bắt đầu với', types: ['text'] },
        { value: 'ENDS_WITH', label: 'Kết thúc với', types: ['text'] },
        { value: 'GREATER_THAN', label: 'Lớn hơn (>)' , types: ['number', 'date']},
        { value: 'GREATER_THAN_OR_EQUAL', label: 'Lớn hơn hoặc bằng (>=)', types: ['number', 'date'] },
        { value: 'LESS_THAN', label: 'Nhỏ hơn (<)', types: ['number', 'date'] },
        { value: 'LESS_THAN_OR_EQUAL', label: 'Nhỏ hơn hoặc bằng (<=)', types: ['number', 'date'] },
        { value: 'IN', label: 'Trong (in)', types: ['text', 'number'] },
        { value: 'NOT_IN', label: 'Ngoài (not in)', types: ['text', 'number'] },
        { value: 'IS_NULL', label: 'Là Rỗng (is null)', types: ['text', 'number', 'date'] },
        { value: 'IS_NOT_NULL', label: 'Không Rỗng (is not null)', types: ['text', 'number', 'date'] },
        { value: 'BETWEEN', label: 'Trong khoảng (Between)', types: ['date', 'number'] },
        { value: 'NOT_BETWEEN', label: 'Ngoài khoảng (Not Between)', types: ['date', 'number'] },
    ], []);

    // --- Derived Search State & Component Logic (from Redux currentSearchConfig) ---
    const selectedField = useMemo(() => searchFieldsOptions.find(f => f.value === currentSearchConfig.field), [currentSearchConfig.field, searchFieldsOptions]);
    const selectedFieldType = selectedField?.type;
    const isDateFieldSelected = selectedFieldType === 'date';
    const isOperatorRequiringValue = useMemo(() => !['IS_NULL', 'IS_NOT_NULL'].includes(currentSearchConfig.operator), [currentSearchConfig.operator]);
    const isDateRangeOperatorSelected = useMemo(() => isDateFieldSelected && ['BETWEEN', 'NOT_BETWEEN'].includes(currentSearchConfig.operator), [isDateFieldSelected, currentSearchConfig.operator]);
    const isSingleDateOperatorSelected = useMemo(() => isDateFieldSelected && isOperatorRequiringValue && !isDateRangeOperatorSelected, [isDateFieldSelected, isOperatorRequiringValue, isDateRangeOperatorSelected]);

    const getFilteredOperators = useCallback(() => {
        if (!currentSearchConfig.field) {
            return searchOperatorsOptions;
        }
        return searchOperatorsOptions.filter(op => op.types.includes(selectedFieldType));
    }, [currentSearchConfig.field, searchOperatorsOptions, selectedFieldType]);

    // UI Input values derived from Redux's keyword
    const searchInput = useMemo(() => isDateFieldSelected ? '' : currentSearchConfig.keyword, [isDateFieldSelected, currentSearchConfig.keyword]);
    const searchDateValue = useMemo(() => {
        if (isSingleDateOperatorSelected && currentSearchConfig.keyword) {
            const date = dayjs(currentSearchConfig.keyword, 'YYYY-MM-DD');
            return date.isValid() ? date : null;
        }
        return null;
    }, [isSingleDateOperatorSelected, currentSearchConfig.keyword]);

    const searchDateRangeValue = useMemo(() => {
        if (isDateRangeOperatorSelected && currentSearchConfig.keyword) {
            const dates = currentSearchConfig.keyword.split(',').map(d => dayjs(d, 'YYYY-MM-DD'));
            if (dates.length === 2 && dates[0].isValid() && dates[1].isValid()) {
                return [dates[0], dates[1]];
            }
        }
        return [null, null];
    }, [isDateRangeOperatorSelected, currentSearchConfig.keyword]);


    // --- Helper Functions ---
    const parseScheduledInfo = useCallback((noiDung) => {
        if (!noiDung) return null;
        const regex = /\(Sẽ được sửa vào ngày (\d{1,2}\/\d{1,2}\/\d{4}) từ (\d{1,2}:\d{2}) đến (\d{1,2}:\d{2})\)/;
        const match = noiDung.match(regex);
        if (match && match.length === 4) {
            return { date: match[1], startTime: match[2], endTime: match[3] };
        }
        return null;
    }, []);

    const formatDateDisplay = useCallback((dateString) => {
        if (!dateString) return null;
        try {
            const dateObj = dayjs.utc(dateString).local();
            if (!dateObj.isValid()) return 'Ngày không hợp lệ';
            return dateObj.format('DD/MM/YYYY HH:mm:ss');
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return 'Ngày không hợp lệ';
        }
    }, []);

    // --- Data Fetching Functions ---

    // Fetch employee list for the modal dropdown
    const fetchNhanVien = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No token found for fetching employees.');
            return;
        }
        setNhanVienLoading(true);
        const url = new URL('https://localhost:8080/DSNhanVien');
        url.searchParams.append('token', token);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                let errorMsg = `Lỗi HTTP khi tải nhân viên: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) { /* Ignore JSON parse error */ }
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Server response was not JSON for employees. Type: ${contentType}`);
            }

            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error("Dữ liệu nhân viên nhận được không phải là một danh sách.");
            }

            const validData = data.filter(nv =>
                nv && (nv.maNhanVien !== null && nv.maNhanVien !== undefined)
            );
            setNhanVienList(validData);

        } catch (error) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            if (loaderData?.error?.type !== 'auth') {
                message.error(`Không thể tải danh sách nhân viên: ${error.message}`);
            }
            setNhanVienList([]);
        } finally {
            setNhanVienLoading(false);
        }
    }, [loaderData?.error]);

    // Fetch main device notes data (handles initial load and search)
    const fetchGhiChuData = useCallback(async (keyword = '') => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("No auth token found.");
            Swal.fire(
                'Lỗi',
                'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.',
                'error'
            ).then(() => navigate('/login'));
            return;
        }

        setLoading(true);
        let apiUrl = 'https://localhost:8080/';
        const params = new URLSearchParams();
        params.append('token', token);

        // API endpoint depends on whether a search keyword is present
        if (keyword && keyword.includes(':')) {
            apiUrl += 'searchGhiChuThietBiByAdmin';
            params.append('keyword', keyword);
        } else {
            apiUrl += 'DSGhiChuThietBi';
        }

        apiUrl += `?${params.toString()}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error('Unauthorized or Forbidden');
            }
            if (response.status === 204) {
                setGhiChuData([]);
                return;
            }
            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || JSON.stringify(errorData) || errorMsg;
                } catch (e) { /* Ignore JSON parse error */ }
                throw new Error(errorMsg);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error(`Unexpected response type: ${contentType}`);
            }

            const data = await response.json();

            let results = [];
            if (keyword && keyword.includes(':')) {
                // For search results, check if 'results' array exists
                if (data && Array.isArray(data.results)) {
                    results = data.results;
                } else if (Array.isArray(data)) { // Fallback for direct array response
                    results = data;
                } else {
                    console.warn("Search response format unexpected (expected { results: [...] } or array):", data);
                    results = [];
                }
            } else if (Array.isArray(data)) {
                results = data;
            } else {
                console.error("Unexpected data format received for list:", data);
                results = [];
            }

            const processedData = results.map((item, index) => ({
                ...item,
                key: item.maGhiChuTB || `fallback-${index}`, // Use the correct primary key
                stt: index + 1,
            }));
            setGhiChuData(processedData);

        } catch (error) {
            console.error("Error fetching Ghi Chu Thiet Bi data:", error);
            if (error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Phiên Đăng Nhập Hết Hạn',
                    text: 'Vui lòng đăng nhập lại.',
                    confirmButtonText: 'Đăng Nhập Lại'
                }).then(() => navigate('/login'));
            } else {

            }
            setGhiChuData([]);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    // Debounced version of fetchGhiChuData
    const debouncedFetchData = useCallback(debounce(fetchGhiChuData, 1000), [fetchGhiChuData]);

    // --- useEffect Hooks ---

    // Effect to process initial loader data & fetch employees
    useEffect(() => {
        setLoading(true);
        let currentGhiChuData = [];

        if (loaderData && !loaderData.error && Array.isArray(loaderData.data)) {
            const processedData = loaderData.data.map((item, index) => ({
                ...item,
                key: item.maGhiChuTB || `fallback-${index}`,
                stt: index + 1,
            }));
            setGhiChuData(processedData);
            currentGhiChuData = processedData;
            fetchNhanVien();
        } else if (loaderData && loaderData.error) {
            console.error("Loader Error:", loaderData);
            if (loaderData.error.type === 'auth') {
                Swal.fire({
                    icon: 'error',
                    title: 'Phiên Đăng Nhập Hết Hạn',
                    text: loaderData.error.message,
                    confirmButtonText: 'Đăng Nhập Lại'
                }).then(() => navigate('/login'));
            } else {
                Swal.fire(
                    'Lỗi',
                    loaderData.error.message || 'Không thể tải dữ liệu ghi chú thiết bị.',
                    'error'
                );
            }
            setGhiChuData([]);
        } else {
            console.warn("No initial data from loader or format error. Attempting fetch...");
            if (loaderData?.error?.type !== 'auth') {
                // If no valid loader data, fetch all data by default on initial load
                fetchGhiChuData('');
                fetchNhanVien();
            } else if (!loaderData) {
                Swal.fire(
                    'Lỗi',
                    'Dữ liệu ghi chú thiết bị không đúng định dạng hoặc bị lỗi (Loader data missing).',
                    'error'
                );
                setGhiChuData([]);
            }
        }
        setLoading(false);

        // --- Notification Logic for Unscheduled Devices ---
        if (currentGhiChuData.length > 0 &&
            !sessionStorage.getItem('hasNotifiedUnscheduledDevices') &&
            !hasNotifiedUnscheduledInSession.current)
        {
            const unscheduledDevices = currentGhiChuData.filter(item => {
                const isFixed = item.ngaySua !== null && item.ngaySua !== undefined;
                const isScheduledInContent = item.noiDung?.includes('(Sẽ được sửa');
                return !isFixed && !isScheduledInContent;
            });

            if (unscheduledDevices.length > 0) {
                const deviceDetails = unscheduledDevices.map(d => `(ID: ${d.maThietBi}, Tên: ${d.tenThietBi || 'N/A'})`).join(', ');
                message.warning(
                    `Có ${unscheduledDevices.length} thiết bị chưa được lên lịch sửa hoặc đã báo hỏng nhưng chưa được xử lý: ${deviceDetails}`,
                    5
                );
                hasNotifiedUnscheduledInSession.current = true;
                sessionStorage.setItem('hasNotifiedUnscheduledDevices', 'true');
            }
        }
    }, [loaderData, navigate, fetchGhiChuData, fetchNhanVien]);

    // Effect to trigger fetch when `currentSearchConfig` from Redux changes
    useEffect(() => {
        const keyword = currentSearchConfig.field && currentSearchConfig.operator
            ? `${currentSearchConfig.field}:${currentSearchConfig.operator}:${currentSearchConfig.keyword}`
            : '';
        debouncedFetchData(keyword);
    }, [currentSearchConfig, debouncedFetchData]);


    // --- Modal Handling ---
    const showModal = useCallback((record) => {
        setSelectedRecord(record);
        form.resetFields();
        const scheduledInfo = parseScheduledInfo(record.noiDung);
        if (scheduledInfo) {
            form.setFieldsValue({
                ngaySua: dayjs(scheduledInfo.date, 'DD/MM/YYYY'),
                thoiGianBatDau: dayjs(scheduledInfo.startTime, 'HH:mm'),
                thoiGianKetThuc: dayjs(scheduledInfo.endTime, 'HH:mm'),
                maNhanVienSua: record.maTaiKhoanSuaLoi // Assuming this field exists for scheduled items
            });
        } else if (record.ngaySua && record.maTaiKhoanSuaLoi) {
            const fixedDateTime = dayjs.utc(record.ngaySua).local();
            form.setFieldsValue({
                ngaySua: fixedDateTime,
                thoiGianBatDau: fixedDateTime,
                thoiGianKetThuc: fixedDateTime,
                maNhanVienSua: record.maTaiKhoanSuaLoi
            });
        }
        setIsModalVisible(true);
    }, [form, parseScheduledInfo]);

    const handleCancel = useCallback(() => {
        setIsModalVisible(false);
        setSelectedRecord(null);
        form.resetFields();
    }, [form]);

    // --- API Call to Update Schedule ---
    const handleUpdateSchedule = useCallback(async (values) => {
        if (!selectedRecord) { message.error('Lỗi: Không có ghi chú nào được chọn.'); return; }
        if (!values.maNhanVienSua) { message.error('Lỗi: Vui lòng chọn người sửa lỗi.'); return; }
        const token = localStorage.getItem('authToken');
        if (!token) { message.error('Lỗi: Không tìm thấy token xác thực.'); navigate('/login'); return; }

        if (!values.ngaySua || !values.thoiGianBatDau || !values.thoiGianKetThuc ||
            !values.thoiGianKetThuc.isAfter(values.thoiGianBatDau))
        {
            message.error('Lỗi: Vui lòng kiểm tra lại ngày giờ sửa (giờ kết thúc phải sau giờ bắt đầu).');
            return;
        }

        const ngaySuaStr = values.ngaySua.format('DD/MM/YYYY');
        const thoiGianBatDauStr = values.thoiGianBatDau.format('HH:mm');
        const thoiGianKetThucStr = values.thoiGianKetThuc.format('HH:mm');
        const maGhiChuTB = selectedRecord.maGhiChuTB;
        const maTKSuaLoi = values.maNhanVienSua;

        // --- CONFLICT CHECK (Exact Duplicate Scheduled Entry Check) ---
        const conflictingRecord = ghiChuData.find(item => {
            if (item.maGhiChuTB === maGhiChuTB) return false;

            const existingScheduledInfo = parseScheduledInfo(item.noiDung);
            if (item.ngaySua || !existingScheduledInfo) return false;

            const isSameFixer = item.maTaiKhoanSuaLoi === maTKSuaLoi;
            const isSameDate = existingScheduledInfo.date === ngaySuaStr;
            const isSameStartTime = existingScheduledInfo.startTime === thoiGianBatDauStr;
            const isSameEndTime = existingScheduledInfo.endTime === thoiGianKetThucStr;

            if (isSameFixer && isSameDate && isSameStartTime && isSameEndTime) {
                console.log(`Exact duplicate schedule found for maGhiChuTB: ${item.maGhiChuTB}. Proposed: ${maTKSuaLoi}, ${ngaySuaStr}, ${thoiGianBatDauStr}-${thoiGianKetThucStr}. Existing: ${item.maTaiKhoanSuaLoi}, ${existingScheduledInfo.date}, ${existingScheduledInfo.startTime}-${existingScheduledInfo.endTime}`);
                return true;
            }
            return false;
        });

        if (conflictingRecord) {
            Swal.fire({
                icon: 'warning',
                title: 'Lịch Sửa Trùng Lặp!',
                html: `<strong>Một lịch sửa với thông tin tương tự (người sửa, ngày, giờ) đã tồn tại cho ghi chú thiết bị khác.</strong><br/>
                       Vui lòng điều chỉnh để tránh trùng lặp.<br/><br/>
                       Chi tiết ghi chú bị trùng:
                       <ul>
                           <li>Thiết bị: <strong>${conflictingRecord.tenThietBi || 'N/A'}</strong> (Mã: ${conflictingRecord.maThietBi || 'N/A'})</li>
                           <li>Phòng: ${conflictingRecord.tenPhong || 'N/A'} (Mã: ${conflictingRecord.maPhong || 'N/A'})</li>
                           <li>Nội dung hiện tại: <i>${conflictingRecord.noiDung || 'N/A'}</i></li>
                       </ul>`,
                confirmButtonText: 'Đóng'
            });
            setModalLoading(false);
            return;
        }
        // --- END CONFLICT CHECK ---

        setModalLoading(true);

        try {
            const url = new URL('https://localhost:8080/CapNhatNguoiSuaVaThoiGianSuaThietBi');
            url.searchParams.append('maGhiChuTB', maGhiChuTB);
            url.searchParams.append('ngaySuaStr', ngaySuaStr);
            url.searchParams.append('thoiGianBatDau', thoiGianBatDauStr);
            url.searchParams.append('thoiGianKetThuc', thoiGianKetThucStr);
            url.searchParams.append('maTKSuaLoi', maTKSuaLoi);
            url.searchParams.append('token', token);

            const putResponse = await fetch(url.toString(), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let responseData = {};
            try { responseData = await putResponse.json(); } catch (e) { if (!putResponse.ok) { responseData = { message: `Lỗi máy chủ: ${putResponse.statusText}` }; } }

            if (!putResponse.ok) throw new Error(responseData.message || `HTTP error! status: ${putResponse.status}`);

            message.success('Đã cập nhật lịch sửa thiết bị thành công!');
            setIsModalVisible(false);
            // Re-fetch data using the current Redux search config keyword
            const currentKeyword = currentSearchConfig.field && currentSearchConfig.operator
                ? `${currentSearchConfig.field}:${currentSearchConfig.operator}:${currentSearchConfig.keyword}`
                : '';
            fetchGhiChuData(currentKeyword);

        } catch (error) {
            console.error('Lỗi khi cập nhật lịch sửa thiết bị:', error);
            message.error(`Cập nhật lịch sửa thất bại: ${error.message}`);
        } finally {
            setModalLoading(false);
        }
    }, [selectedRecord, navigate, fetchGhiChuData, currentSearchConfig, ghiChuData, parseScheduledInfo]);

    // --- Context Menu Handler ---
    const handleContextMenu = useCallback((event, record) => {
        event.preventDefault();
        const scheduledInfo = parseScheduledInfo(record.noiDung);
        if (!record.ngaySua && !scheduledInfo) {
            showModal(record);
        } else {
            message.info('Ghi chú này đã được sửa hoặc đã có lịch hẹn.');
        }
    }, [parseScheduledInfo, showModal]);

    // --- Search Event Handlers ---
    const handleClearSearch = useCallback(() => {
        dispatch(clearCurrentSearch());
    }, [dispatch]);

    // --- Optimized `handleAttributeChange` and `handleOperatorChange` (Redux-aware) ---
    const handleAttributeChange = useCallback((value) => {
        const oldField = searchFieldsOptions.find(f => f.value === currentSearchConfig.field);
        const newField = searchFieldsOptions.find(f => f.value === value);

        const oldFieldType = oldField?.type;
        const newFieldType = newField?.type;

        let newKeyword = currentSearchConfig.keyword;

        if (!value || (oldFieldType && newFieldType && oldFieldType !== newFieldType)) {
            newKeyword = '';
        }

        dispatch(setCurrentSearch({ field: value, operator: null, keyword: newKeyword }));
    }, [dispatch, searchFieldsOptions, currentSearchConfig.field]);

    const handleOperatorChange = useCallback((value) => {
        const newRequiresValue = !['IS_NULL', 'IS_NOT_NULL'].includes(value);
        let newKeyword = currentSearchConfig.keyword;

        if (!newRequiresValue) {
            newKeyword = '';
        } else if (isDateFieldSelected) {
            const isNewOperatorRange = ['BETWEEN', 'NOT_BETWEEN'].includes(value);

            if (
                (!isOperatorRequiringValue) ||
                (isDateRangeOperatorSelected && !isNewOperatorRange) ||
                (isSingleDateOperatorSelected && isNewOperatorRange)
            ) {
                newKeyword = '';
            }
        }

        dispatch(setCurrentSearch({ operator: value, keyword: newKeyword }));
    }, [dispatch, currentSearchConfig.keyword, isDateFieldSelected, isOperatorRequiringValue, isDateRangeOperatorSelected, isSingleDateOperatorSelected]);


    // --- Handlers for search config management ---
    const handleLoadAllGhiChuThietBi = useCallback(() => {
        dispatch(loadSearchConfig(LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME));
    }, [dispatch, LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME]);

    const handleSaveSearchConfig = useCallback(async () => {
        if (!currentSearchConfig.field || !currentSearchConfig.operator) {
            Swal.fire('Thiếu thông tin!', 'Vui lòng chọn thuộc tính và phép toán trước khi lưu.', 'warning');
            return;
        }
        if (isOperatorRequiringValue && !currentSearchConfig.keyword) {
            Swal.fire('Thiếu giá trị!', 'Phép toán này yêu cầu một giá trị tìm kiếm.', 'warning');
            return;
        }

        const { value: configName } = await Swal.fire({
            title: 'Đặt tên cho cấu hình tìm kiếm',
            input: 'text',
            inputValue: currentSearchConfig.name || `Tìm kiếm ${currentSearchConfig.field}`,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) return 'Bạn cần nhập tên cho cấu hình!';
                if (value === LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME) {
                    return `Tên "${LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME}" được dành riêng cho chức năng tải tất cả ghi chú.`;
                }
                if (searchConfigList.includes(value) && value !== currentSearchConfig.name) return 'Tên cấu hình này đã tồn tại!';
            }
        });

        if (configName) {
            dispatch(saveCurrentSearchConfig({ name: configName }));
        }
    }, [currentSearchConfig, searchConfigList, dispatch, isOperatorRequiringValue, LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME]);

    const handleLoadSearchConfig = useCallback((configName) => {
        dispatch(loadSearchConfig(configName));
    }, [dispatch]);

    const handleRemoveSearchConfig = useCallback((configName) => {
        if (configName === LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME) {
            Swal.fire('Không thể xóa!', `Cấu hình "${LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME}" là mặc định và không thể xóa.`, 'error');
            return;
        }
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
    }, [dispatch, LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME]);


    // --- Sidebar Navigation & Logout Handlers ---
    const handleMenuClickSidebar = useCallback((e) => {
        const key = e.key;
        if (key === '/login') {
            handleLogout();
        } else {
            navigate(key);
        }
    }, [navigate]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        sessionStorage.removeItem('hasNotifiedUnscheduledDevices'); // Clear flag on logout

        Swal.fire({
            icon: 'success',
            title: 'Đã đăng xuất',
            text: 'Bạn đã đăng xuất thành công.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => navigate('/login'));
    }, [navigate]);


    // --- Setters for search input (dispatching Redux actions) ---
    const setSearchInputRedux = useCallback((value) => {
        dispatch(setCurrentSearch({ keyword: value }));
    }, [dispatch]);

    const setSearchDateValueRedux = useCallback((date) => {
        const formattedDate = date ? date.format('YYYY-MM-DD') : '';
        dispatch(setCurrentSearch({ keyword: formattedDate }));
    }, [dispatch]);

    const setSearchDateRangeValueRedux = useCallback((dates) => {
        const formattedDates = dates && dates[0] && dates[1]
            ? `${dates[0].format('YYYY-MM-DD')},${dates[1].format('YYYY-MM-DD')}`
            : '';
        dispatch(setCurrentSearch({ keyword: formattedDates }));
    }, [dispatch]);


    return {
        // State
        ghiChuData,
        loading,
        collapsed,
        isModalVisible,
        selectedRecord,
        modalLoading,
        nhanVienList,
        nhanVienLoading,
        // searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue (now derived from Redux)
        searchFieldValue: currentSearchConfig.field,
        searchOperatorValue: currentSearchConfig.operator,
        searchInput, // This is derived from Redux's keyword
        searchDateValue, // This is derived from Redux's keyword
        searchDateRangeValue, // This is derived from Redux's keyword

        // Derived Search State
        searchFieldsOptions,
        searchOperatorsOptions,
        selectedFieldType,
        isDateFieldSelected,
        isOperatorRequiringValue,
        isDateRangeOperatorSelected,
        isSingleDateOperatorSelected,

        // Redux Search Config States
        currentSearchConfig,
        searchConfigList,
        LOAD_ALL_GHI_CHU_THIET_BI_CONFIG_NAME, // Expose the constant

        // Functions / Handlers
        setCollapsed,
        // Use the Redux-aware setters
        setSearchFieldValue: handleAttributeChange, // Direct call to handleAttributeChange (which dispatches)
        setSearchOperatorValue: handleOperatorChange, // Direct call to handleOperatorChange (which dispatches)
        setSearchInput: setSearchInputRedux,
        setSearchDateValue: setSearchDateValueRedux,
        setSearchDateRangeValue: setSearchDateRangeValueRedux,

        form,
        getFilteredOperators,
        parseScheduledInfo,
        formatDateDisplay,
        handleCancel,
        handleUpdateSchedule,
        handleContextMenu,
        handleClearSearch,
        // handleAttributeChange, handleOperatorChange are already exposed as setSearchFieldValue/OperatorValue
        handleMenuClickSidebar,
        handleLogout,
        // Add search config management handlers
        handleLoadAllGhiChuThietBi,
        handleSaveSearchConfig,
        handleLoadSearchConfig,
        handleRemoveSearchConfig,
    };
};

export default useGhiChuThietBiLogic;