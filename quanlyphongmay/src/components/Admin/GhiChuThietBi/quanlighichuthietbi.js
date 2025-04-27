// src/pages/QuanLyGhiChuThietBi.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Layout,
    Popover,
    Button as AntButton,
    Tag,
    Tooltip,
    Modal,
    DatePicker,
    TimePicker,
    Form,
    message,
    Select,
    Input,
    Row,
    Col
} from 'antd';
import {
    ToolOutlined,
    SunOutlined,
    MoonOutlined,
    SettingOutlined,
    SearchOutlined,
    ClearOutlined
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header, Content } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { useNavigate, useLoaderData } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Adjust path if needed
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

// --- Day.js Setup ---
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.locale('vi');

// --- Ant Design Components ---
const { Option } = Select;
const { RangePicker } = DatePicker;

// --- DarkModeToggle component ---
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    useEffect(() => {
        if (isDarkMode) {
            DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
        } else {
            if (DarkReader.isEnabled()) {
                DarkReader.disable();
            }
        }
        // Cleanup on unmount
        return () => {
            if (DarkReader.isEnabled()) {
                DarkReader.disable();
            }
        };
    }, [isDarkMode]);

    return (
        <AntButton
            icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
            }}
        />
    );
};

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

// --- Main Component: QuanLyGhiChuThietBi ---
const QuanLyGhiChuThietBi = () => {
    // --- Hooks ---
    const loaderData = useLoaderData();
    const navigate = useNavigate();
    const [form] = Form.useForm(); // Modal form instance

    // --- State ---
    const [ghiChuData, setGhiChuData] = useState([]); // Main table data
    const [loading, setLoading] = useState(false); // Main table loading state
    const [collapsed, setCollapsed] = useState(false); // Sidebar collapsed state

    // Modal State
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null); // Record for modal editing
    const [modalLoading, setModalLoading] = useState(false); // Modal submission loading state

    // Employee List State
    const [nhanVienList, setNhanVienList] = useState([]); // Fetched employee list
    const [nhanVienLoading, setNhanVienLoading] = useState(false); // Employee dropdown loading state

    // Search State
    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchDateValue, setSearchDateValue] = useState(null);
    const [searchDateRangeValue, setSearchDateRangeValue] = useState([null, null]);
    const [searchKeyword, setSearchKeyword] = useState('');

    // --- Search Configuration ---
    const searchFieldsOptions = [
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
    ];
    const searchOperatorsOptions = [
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
    ];

    // --- Derived Search State & Component Logic ---
    const getFilteredOperators = useCallback(() => {
        const selectedField = searchFieldsOptions.find(f => f.value === searchFieldValue);
        if (!selectedField) {
            return searchOperatorsOptions;
        }
        return searchOperatorsOptions.filter(op => op.types.includes(selectedField.type));
    }, [searchFieldValue]);

    const selectedField = searchFieldsOptions.find(f => f.value === searchFieldValue);
    const selectedFieldType = selectedField?.type;
    const isDateFieldSelected = selectedFieldType === 'date';
    const isOperatorRequiringValue = !['IS_NULL', 'IS_NOT_NULL'].includes(searchOperatorValue);
    const isDateRangeOperatorSelected = isDateFieldSelected && ['BETWEEN', 'NOT_BETWEEN'].includes(searchOperatorValue);
    const isSingleDateOperatorSelected = isDateFieldSelected && isOperatorRequiringValue && !isDateRangeOperatorSelected;

    const InputComponent = (() => {
        if (isDateRangeOperatorSelected) return RangePicker;
        if (isSingleDateOperatorSelected) return DatePicker;
        return Input;
    })();

    // --- Data Fetching Functions ---

    // Fetch employee list
    const fetchNhanVien = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn('No token found for fetching employees.');
            return;
        }
        setNhanVienLoading(true);
        const url = new URL('https://localhost:8080/DSNhanVien');
        url.searchParams.append('token', token);
        console.log(`Fetching employees from: ${url.toString()}`);

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log(`Employee fetch response status: ${response.status}`);

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
                const textData = await response.text();
                console.warn("Received non-JSON response for employees:", textData);
                throw new Error(`Server response was not JSON for employees. Type: ${contentType}`);
            }

            const data = await response.json();
            console.log("Raw data received from /DSNhanVien:", data);

            if (!Array.isArray(data)) {
                console.error("Employee data is not an array:", data);
                throw new Error("Dữ liệu nhân viên nhận được không phải là một danh sách.");
            }

            // Filter based on primary key needed (maNhanVien based on API response)
            const validData = data.filter(nv =>
                nv && (nv.maNhanVien !== null && nv.maNhanVien !== undefined)
            );

            if (data.length > 0 && validData.length === 0) {
                console.warn(
                    "Fetched employee data, but no entries had a valid 'maNhanVien'. Check API structure and Modal Select.",
                    data[0] // Log first item if filtering failed
                );
            }

            setNhanVienList(validData);
            console.log("Processed Valid Nhan Vien List:", validData);

        } catch (error) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            if (loaderData?.error?.type !== 'auth') { // Avoid duplicate auth errors
                message.error(`Không thể tải danh sách nhân viên: ${error.message}`);
            }
            setNhanVienList([]);
        } finally {
            setNhanVienLoading(false);
        }
    }, [loaderData?.error]);

    // Fetch device notes data (handles list and search)
    const fetchGhiChuData = useCallback(async (currentSearchKeyword = '') => {
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
        let apiUrl = 'https://localhost:8080/'; // Base URL
        const params = new URLSearchParams();
        params.append('token', token);

        // Endpoint Selection
        if (currentSearchKeyword && currentSearchKeyword.includes(':')) {
            apiUrl += 'searchGhiChuThietBiByAdmin'; // SEARCH endpoint
            params.append('keyword', currentSearchKeyword);
        } else {
            apiUrl += 'DSGhiChuThietBi'; // LIST endpoint
        }

        apiUrl += `?${params.toString()}`; // Append parameters
        console.log("Fetching Ghi Chu Thiet Bi URL:", apiUrl);

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                throw new Error('Unauthorized or Forbidden');
            }
            if (response.status === 204) { // Handle No Content
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
                const textData = await response.text();
                console.error('Invalid content type:', contentType, textData);
                throw new Error(`Unexpected response type: ${contentType}`);
            }

            const data = await response.json();

            // Handle Search Response Format
            let results = [];
            if (currentSearchKeyword && currentSearchKeyword.includes(':')) {
                // Expects { results: [...] } from search endpoint
                if (data && Array.isArray(data.results)) {
                    results = data.results;
                } else {
                    console.warn("Search response format unexpected (expected { results: [...] }):", data);
                    results = []; // Default to empty on unexpected format
                }
            } else if (Array.isArray(data)) {
                // Normal list endpoint returns direct array
                results = data;
            } else {
                console.error("Unexpected data format received for list:", data);
                results = [];
            }

            // Process the final results array
            const processedData = results.map((item, index) => ({
                ...item,
                key: item.maGhiChuTB, // Use the correct primary key
                stt: index + 1,
            }));
            setGhiChuData(processedData);

        } catch (error) {
            console.error("Error fetching Ghi Chu Thiet Bi data:", error);
            if (error.message === 'Unauthorized or Forbidden') {
                Swal.fire({
                    icon: 'error',
                    title: 'Phiên Đăng Nhập Hết Hạn',
                    text: 'Vui lòng đăng nhập lại.',
                    confirmButtonText: 'Đăng Nhập Lại'
                }).then(() => navigate('/login'));
            } else {
                Swal.fire(
                    'Lỗi',
                    `Không thể tải dữ liệu ghi chú thiết bị: ${error.message}`,
                    'error'
                );
            }
            setGhiChuData([]);
        } finally {
            setLoading(false);
        }
    }, [navigate]); // Keep navigate dependency

    // Debounced version of fetchGhiChuData
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchData = useCallback(debounce(fetchGhiChuData, 1000), [fetchGhiChuData]);

    // --- useEffect Hooks ---

    // Effect for Initial Load
    useEffect(() => {
        console.log("[Effect] Processing GhiChuThietBi loader data:", loaderData);
        setLoading(true);
        if (loaderData && !loaderData.error && Array.isArray(loaderData.data)) {
            const processedData = loaderData.data.map((item, index) => ({
                ...item,
                key: item.maGhiChuTB, // Use correct key
                stt: index + 1,
            }));
            console.log("[Effect] Processed GhiChuThietBi data:", processedData);
            setGhiChuData(processedData);
            fetchNhanVien(); // Fetch employees
        } else if (loaderData && loaderData.error) {
            console.error("Loader Error:", loaderData);
            if (loaderData.type === 'auth') {
                Swal.fire({
                    icon: 'error',
                    title: 'Phiên Đăng Nhập Hết Hạn',
                    text: loaderData.message,
                    confirmButtonText: 'Đăng Nhập Lại'
                }).then(() => navigate('/login'));
            } else {
                Swal.fire(
                    'Lỗi',
                    loaderData.message || 'Không thể tải dữ liệu ghi chú thiết bị.',
                    'error'
                );
            }
            setGhiChuData([]);
        } else {
            console.warn("No initial data from loader or format error. Attempting fetch...");
            if (loaderData?.error?.type !== 'auth') {
                fetchGhiChuData(''); // Fetch initial list
                fetchNhanVien();    // Fetch employees
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
    }, [loaderData, navigate, fetchGhiChuData, fetchNhanVien]); // Add fetch dependencies

    // Effect for Building Search Keyword
    useEffect(() => {
        let keyword = '';
        const requiresValue = isOperatorRequiringValue;

        if (searchFieldValue && searchOperatorValue) {
            let valuePart = '';
            let isValidInput = false;

            if (requiresValue) {
                if (isDateRangeOperatorSelected) {
                    const [start, end] = searchDateRangeValue;
                    if (start && end && dayjs.isDayjs(start) && dayjs.isDayjs(end) && start.isValid() && end.isValid()) {
                        valuePart = `${start.format('YYYY-MM-DD')},${end.format('YYYY-MM-DD')}`;
                        isValidInput = true;
                    }
                } else if (isSingleDateOperatorSelected) {
                    if (searchDateValue && dayjs.isDayjs(searchDateValue) && searchDateValue.isValid()) {
                        valuePart = searchDateValue.format('YYYY-MM-DD');
                        isValidInput = true;
                    }
                } else if (!isDateFieldSelected) {
                    if (searchInput.trim()) {
                        valuePart = searchInput.trim();
                        isValidInput = true;
                    }
                }
                if (isValidInput) {
                    keyword = `${searchFieldValue}:${searchOperatorValue}:${valuePart}`;
                } else {
                    keyword = '';
                }
            } else {
                keyword = `${searchFieldValue}:${searchOperatorValue}:`;
                isValidInput = true;
            }
            if (!(searchFieldValue && searchOperatorValue && isValidInput)) {
                keyword = '';
            }
        } else {
            keyword = '';
        }
        if (keyword !== searchKeyword) {
            setSearchKeyword(keyword);
        }
    }, [
        searchInput,
        searchDateValue,
        searchDateRangeValue,
        searchFieldValue,
        searchOperatorValue,
        isDateFieldSelected,
        isDateRangeOperatorSelected,
        isSingleDateOperatorSelected,
        isOperatorRequiringValue,
        searchKeyword
    ]);

    // Effect for Triggering Debounced Fetch on Keyword Change
    useEffect(() => {
        console.log("Search keyword changed, triggering fetch:", searchKeyword);
        const keywordParts = searchKeyword.split(':');
        const isValidKeyword = searchKeyword === '' || (keywordParts.length === 3 && keywordParts[0] && keywordParts[1]);

        if (isValidKeyword) {
            debouncedFetchData(searchKeyword);
        } else if (!searchFieldValue && !searchOperatorValue && !searchInput && !searchDateValue && !(searchDateRangeValue[0])) {
            debouncedFetchData(''); // Fetch all if inputs are cleared
        }
    }, [
        searchKeyword,
        debouncedFetchData,
        searchFieldValue,
        searchOperatorValue,
        searchInput,
        searchDateValue,
        searchDateRangeValue
    ]);

    // --- Helper Functions ---

    // Parse schedule info from 'noiDung' string
    const parseScheduledInfo = (noiDung) => {
        if (!noiDung) return null;
        const regex = /\(Sẽ được sửa vào ngày (\d{1,2}\/\d{1,2}\/\d{4}) từ (\d{1,2}:\d{2}) đến (\d{1,2}:\d{2})\)/;
        const match = noiDung.match(regex);
        if (match && match.length === 4) {
            return { date: match[1], startTime: match[2], endTime: match[3] };
        }
        return null;
    };

    // Format date string for display (handles potential UTC issues)
    const formatDateDisplay = (dateString) => {
        if (!dateString) return null;
        try {
            const dateObj = dayjs.utc(dateString).local(); // Assume UTC, display local
            if (!dateObj.isValid()) return 'Ngày không hợp lệ';
            return dateObj.format('DD/MM/YYYY HH:mm:ss');
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return 'Ngày không hợp lệ';
        }
    };

    // --- Modal Handling ---
    const showModal = (record) => {
        setSelectedRecord(record);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
        form.resetFields();
    };

    // --- API Call to Update Schedule ---
    const handleUpdateSchedule = async (values) => {
        if (!selectedRecord) {
            message.error('Lỗi: Không có ghi chú nào được chọn.');
            return;
        }
        if (!values.maNhanVienSua) {
            message.error('Lỗi: Vui lòng chọn người sửa lỗi.');
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            message.error('Lỗi: Không tìm thấy token xác thực.');
            navigate('/login');
            return;
        }

        // Time validation
        if (!values.ngaySua || !values.thoiGianBatDau || !values.thoiGianKetThuc ||
            !values.thoiGianKetThuc.isAfter(values.thoiGianBatDau))
        {
            message.error('Lỗi: Vui lòng kiểm tra lại ngày giờ sửa (giờ kết thúc phải sau giờ bắt đầu).');
            return;
        }

        const ngaySuaStr = values.ngaySua.format('DD/MM/YYYY');
        const thoiGianBatDau = values.thoiGianBatDau.format('HH:mm');
        const thoiGianKetThuc = values.thoiGianKetThuc.format('HH:mm');
        const maGhiChuTB = selectedRecord.maGhiChuTB; // Use ThietBi note ID
        const maTKSuaLoi = values.maNhanVienSua; // Use maNhanVien from selected option

        console.log("API Call Params (ThietBi):", {
            maGhiChuTB,
            ngaySuaStr,
            thoiGianBatDau,
            thoiGianKetThuc,
            maTKSuaLoi,
            token
        });
        setModalLoading(true);

        try {
            const url = new URL('https://localhost:8080/CapNhatNguoiSuaVaThoiGianSuaThietBi');
            url.searchParams.append('maGhiChuTB', maGhiChuTB);
            url.searchParams.append('ngaySuaStr', ngaySuaStr);
            url.searchParams.append('thoiGianBatDau', thoiGianBatDau);
            url.searchParams.append('thoiGianKetThuc', thoiGianKetThuc);
            url.searchParams.append('maTKSuaLoi', maTKSuaLoi);
            url.searchParams.append('token', token);

            const putResponse = await fetch(url.toString(), {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            let responseData = {};
            try {
                responseData = await putResponse.json();
            } catch (e) {
                if (!putResponse.ok) {
                    responseData = { message: `Lỗi máy chủ: ${putResponse.statusText}` };
                }
            }

            if (!putResponse.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${putResponse.status}`);
            }

            message.success('Đã cập nhật lịch sửa thiết bị thành công!');
            setIsModalVisible(false);

            // Refresh data using current search keyword after update
            fetchGhiChuData(searchKeyword);

        } catch (error) {
            console.error('Lỗi khi cập nhật lịch sửa thiết bị:', error);
            message.error(`Cập nhật lịch sửa thất bại: ${error.message}`);
        } finally {
            setModalLoading(false);
        }
    };

    // --- Event Handlers ---

    // Context Menu Handler
    const handleContextMenu = (event, record) => {
        event.preventDefault();
        const scheduledInfo = parseScheduledInfo(record.noiDung);
        if (!record.ngaySua && !scheduledInfo) {
            showModal(record);
        } else {
            if (record.ngaySua) message.info('Thiết bị này đã được sửa.');
            else if (scheduledInfo) message.info('Thiết bị này đã được lên lịch sửa.');
        }
    };

    // Search Handlers
    const handleClearSearch = () => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchDateValue(null);
        setSearchDateRangeValue([null, null]);
        // useEffect will trigger fetch
    };

    const handleAttributeChange = (value) => {
        const newField = searchFieldsOptions.find(f => f.value === value);
        const newFieldType = newField?.type;
        setSearchFieldValue(value);

        const currentOperatorIsValid = newFieldType && searchOperatorsOptions.find(
            op => op.value === searchOperatorValue
        )?.types.includes(newFieldType);
        if (!currentOperatorIsValid) {
            setSearchOperatorValue(null);
        }

        if (newFieldType === 'date') {
            setSearchInput('');
        } else {
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]);
        }
    };

    const handleOperatorChange = (value) => {
        setSearchOperatorValue(value);

        const newRequiresValue = !['IS_NULL', 'IS_NOT_NULL'].includes(value);
        const newIsDateRange = isDateFieldSelected && ['BETWEEN', 'NOT_BETWEEN'].includes(value);
        const newIsSingleDate = isDateFieldSelected && newRequiresValue && !newIsDateRange;

        if (!newRequiresValue) {
            setSearchInput('');
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]);
        } else if (newIsDateRange) {
            setSearchInput('');
            setSearchDateValue(null);
        } else if (newIsSingleDate) {
            setSearchInput('');
            setSearchDateRangeValue([null, null]);
        } else {
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]);
        }
    };

    // Sidebar & Logout Handlers
    const handleMenuClickSidebar = (e) => {
        const key = e.key;
        if (key === '/login') {
            handleLogout();
        } else {
            navigate(key);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        navigate('/login');
        message.success('Bạn đã đăng xuất thành công!');
    };

    // --- Table Column Definitions ---
    const ghiChuColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 60,
            sorter: (a, b) => a.stt - b.stt,
            fixed: 'left'
        },
        {
            title: 'Nội dung',
            dataIndex: 'noiDung',
            key: 'noiDung',
            ellipsis: true,
            width: 250,
            sorter: (a, b) => (a.noiDung || '').localeCompare(b.noiDung || ''),
            render: (text) => text ? (
                <Popover
                    content={<div style={{ whiteSpace: 'pre-wrap', maxWidth: '400px' }}>{text}</div>}
                    title="Nội dung chi tiết"
                    trigger="hover"
                >
                    <span>{text}</span>
                </Popover>
            ) : 'N/A'
        },
        {
            title: 'Tên Thiết Bị',
            dataIndex: 'tenThietBi',
            key: 'tenThietBi',
            width: 150,
            sorter: (a, b) => (a.tenThietBi || '').localeCompare(b.tenThietBi || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Loại Thiết Bị',
            dataIndex: 'tenLoai',
            key: 'tenLoai',
            width: 150,
            sorter: (a, b) => (a.tenLoai || '').localeCompare(b.tenLoai || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Tên Phòng',
            dataIndex: 'tenPhong',
            key: 'tenPhong',
            width: 120,
            sorter: (a, b) => (a.tenPhong || '').localeCompare(b.tenPhong || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Ngày Báo Lỗi',
            dataIndex: 'ngayBaoLoi',
            key: 'ngayBaoLoi',
            width: 180,
            sorter: (a, b) => dayjs(a.ngayBaoLoi).valueOf() - dayjs(b.ngayBaoLoi).valueOf(),
            render: (text) => formatDateDisplay(text) || 'N/A'
        },
        {
            title: 'Trạng thái Sửa',
            dataIndex: 'ngaySua', // Use ngaySua for sorting fixed items
            key: 'ngaySuaStatus',
            width: 180,
            fixed: 'right',
            sorter: (a, b) => {
                const scheduledA = parseScheduledInfo(a.noiDung) ? 1 : 0;
                const scheduledB = parseScheduledInfo(b.noiDung) ? 1 : 0;
                const fixedA = a.ngaySua ? 1 : 0;
                const fixedB = b.ngaySua ? 1 : 0;
                const statusA = fixedA ? 2 : (scheduledA ? 1 : 0); // Fixed > Scheduled > Not Fixed
                const statusB = fixedB ? 2 : (scheduledB ? 1 : 0);
                if (statusA !== statusB) return statusA - statusB; // Sort by status first
                if (fixedA && fixedB) return dayjs(a.ngaySua).valueOf() - dayjs(b.ngaySua).valueOf(); // Then by fix date
                return 0;
            },
            render: (_, record) => {
                const scheduledInfo = parseScheduledInfo(record.noiDung);
                const formattedOriginalNgaySua = formatDateDisplay(record.ngaySua);
                let content;

                if (scheduledInfo) {
                    const fixerName = record.tenTaiKhoanSuaLoi ? ` (Sửa bởi: ${record.tenTaiKhoanSuaLoi})` : '';
                    content = (
                        <Tooltip title={`Lịch dự kiến: ${scheduledInfo.date} ${scheduledInfo.startTime}-${scheduledInfo.endTime}${fixerName}`}>
                            <Tag color="processing" icon={<ToolOutlined />}>Đã lên lịch</Tag>
                        </Tooltip>
                    );
                } else if (!record.ngaySua) {
                    content = <Tag color="error">Chưa sửa</Tag>;
                } else {
                    const fixerName = record.tenTaiKhoanSuaLoi ? ` (Sửa bởi: ${record.tenTaiKhoanSuaLoi})` : '';
                    content = <Tag color="success">{formattedOriginalNgaySua || 'Đã sửa'}{fixerName}</Tag>; // Display fix date/time and fixer
                }

                const allowContextMenu = !record.ngaySua && !scheduledInfo;
                return (
                    <div
                        onContextMenu={allowContextMenu ? (e) => handleContextMenu(e, record) : undefined}
                        style={{ cursor: allowContextMenu ? 'context-menu' : 'default' }}
                    >
                        {content}
                    </div>
                );
            }
        },
        {
            title: 'Người Báo Lỗi',
            dataIndex: 'tenTaiKhoanBaoLoi',
            key: 'tenTaiKhoanBaoLoi',
            width: 150,
            sorter: (a, b) => (a.tenTaiKhoanBaoLoi || '').localeCompare(b.tenTaiKhoanBaoLoi || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Người Sửa Lỗi',
            dataIndex: 'tenTaiKhoanSuaLoi',
            key: 'tenTaiKhoanSuaLoi',
            width: 150,
            fixed: 'right',
            sorter: (a, b) => (a.tenTaiKhoanSuaLoi || '').localeCompare(b.tenTaiKhoanSuaLoi || ''),
            render: (text) => text ? text : <i>(Chưa có)</i>
        },
    ];

    // --- JSX Return ---
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin
                collapsed={collapsed}
                onCollapse={setCollapsed}
                onMenuClick={handleMenuClickSidebar}
            />
            <Layout>
                <Header
                    className="lab-management-header"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        padding: '0 24px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        borderBottom: '1px solid #f0f0f0'
                    }}
                >
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: "1.5rem",
                        fontWeight: "bold",
                        color: "#000"
                    }}>
                        <Popover
                            content={<div>Quản lí các ghi chú, báo lỗi của thiết bị phòng máy</div>}
                            trigger="hover"
                        >
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Quản Lý Ghi Chú Thiết Bị {/* Title Updated */}
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360, borderRadius: '8px' }}>

                        {/* --- Search Bar --- */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="bottom">
                            <Col xs={24} sm={12} md={10} lg={8} xl={7}>
                                <Form.Item label="Giá trị tìm kiếm" style={{ marginBottom: 0 }}>
                                    {InputComponent === Input && (
                                        <Input
                                            prefix={<SearchOutlined />}
                                            placeholder="Nhập giá trị..."
                                            value={searchInput}
                                            onChange={(e) => {
                                                setSearchInput(e.target.value);
                                                if (isDateFieldSelected) {
                                                    setSearchDateValue(null);
                                                    setSearchDateRangeValue([null, null]);
                                                }
                                            }}
                                            disabled={!isOperatorRequiringValue && !!searchOperatorValue}
                                            allowClear={{ clearIcon: <ClearOutlined onClick={() => setSearchInput('')} />}}
                                        />
                                    )}
                                    {InputComponent === DatePicker && (
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Chọn ngày"
                                            value={searchDateValue}
                                            onChange={(date) => {
                                                setSearchDateValue(date);
                                                if (searchInput) setSearchInput('');
                                                setSearchDateRangeValue([null, null]);
                                            }}
                                            format="DD/MM/YYYY"
                                            allowClear
                                            disabled={!isOperatorRequiringValue && !!searchOperatorValue}
                                        />
                                    )}
                                    {InputComponent === RangePicker && (
                                        <RangePicker
                                            style={{ width: '100%' }}
                                            value={searchDateRangeValue}
                                            onChange={(dates) => {
                                                setSearchDateRangeValue(dates || [null, null]);
                                                if (searchInput) setSearchInput('');
                                                setSearchDateValue(null);
                                            }}
                                            format="DD/MM/YYYY"
                                            placeholder={['Từ ngày', 'Đến ngày']}
                                            allowClear
                                            disabled={!isOperatorRequiringValue && !!searchOperatorValue}
                                        />
                                    )}
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={5} xl={5}>
                                <Form.Item label="Thuộc tính" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn thuộc tính"
                                        value={searchFieldValue}
                                        onChange={handleAttributeChange}
                                        style={{ width: '100%' }}
                                        allowClear
                                        onClear={() => handleAttributeChange(null)}
                                    >
                                        {searchFieldsOptions.map(item => (
                                            <Option key={item.value} value={item.value}>
                                                {item.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={5} xl={5}>
                                <Form.Item label="Phép toán" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn phép toán"
                                        value={searchOperatorValue}
                                        onChange={handleOperatorChange}
                                        style={{ width: '100%' }}
                                        disabled={!searchFieldValue}
                                        allowClear
                                        onClear={() => handleOperatorChange(null)}
                                    >
                                        {getFilteredOperators().map(item => (
                                            <Option key={item.value} value={item.value}>
                                                {item.label}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={2} lg={4} xl={3}>
                                <AntButton
                                    icon={<ClearOutlined />}
                                    onClick={handleClearSearch}
                                    style={{ width: '100%' }}
                                    danger
                                >
                                    Xóa lọc
                                </AntButton>
                            </Col>
                        </Row>
                        {/* --- End Search Bar --- */}

                        {/* --- Table --- */}
                        <Table
                            columns={ghiChuColumns}
                            dataSource={ghiChuData}
                            loading={loading}
                            pagination={{
                                pageSizeOptions: ['10', '20', '50', '100'],
                                showSizeChanger: true,
                                showQuickJumper: true,
                                position: ['bottomRight'],
                                showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`,
                                defaultPageSize: 10,
                            }}
                            scroll={{ x: 1500 }} // Adjust scroll width based on columns
                            bordered
                            size="small"
                        />
                    </div>
                </Content>
            </Layout>

            {/* --- Scheduling Modal --- */}
            {selectedRecord && (
                <Modal
                    title={`Lên lịch sửa cho thiết bị: ${selectedRecord.tenThietBi || 'N/A'}`}
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    footer={[
                        <AntButton
                            key="back"
                            onClick={handleCancel}
                            disabled={modalLoading}
                        >
                            Hủy
                        </AntButton>,
                        <AntButton
                            key="submit"
                            type="primary"
                            loading={modalLoading}
                            onClick={() => form.submit()}
                        >
                            Cập nhật lịch
                        </AntButton>,
                    ]}
                    destroyOnClose
                    forceRender
                    maskClosable={!modalLoading}
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateSchedule}
                        initialValues={{
                            ngaySua: null,
                            thoiGianBatDau: null,
                            thoiGianKetThuc: null,
                            maNhanVienSua: null
                        }}
                    >
                        {/* --- Employee Selector (Using maNhanVien/tenNV) --- */}
                        <Form.Item
                            name="maNhanVienSua" // Value submitted will be maNhanVien
                            label="Người sửa"
                            rules={[{ required: true, message: 'Vui lòng chọn người sửa!' }]}
                        >
                            <Select
                                placeholder="Chọn nhân viên thực hiện"
                                loading={nhanVienLoading}
                                showSearch
                                optionFilterProp="children" // Filter based on display text
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase()) ||
                                    (option?.value?.toString() ?? '').toLowerCase().includes(input.toLowerCase()) // Search by ID too
                                }
                                style={{ width: '100%' }}
                            >
                                {nhanVienList.map(nv => (
                                    <Option key={nv.maNhanVien} value={nv.maNhanVien}>
                                        {/* Display tenNV and maNhanVien */}
                                        {`${nv.tenNV} (ID: ${nv.maNhanVien})`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* --- Date and Time Pickers --- */}
                        <Form.Item
                            name="ngaySua"
                            label="Ngày sửa"
                            rules={[{ required: true, message: 'Vui lòng chọn ngày sửa!' }]}
                        >
                            <DatePicker
                                style={{ width: '100%' }}
                                format="DD/MM/YYYY"
                                placeholder="Chọn ngày"
                            />
                        </Form.Item>
                        <Form.Item
                            name="thoiGianBatDau"
                            label="Thời gian bắt đầu"
                            rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}
                        >
                            <TimePicker
                                style={{ width: '100%' }}
                                format="HH:mm"
                                minuteStep={15}
                                placeholder="Chọn giờ bắt đầu"
                            />
                        </Form.Item>
                        <Form.Item
                            name="thoiGianKetThuc"
                            label="Thời gian kết thúc"
                            dependencies={['thoiGianBatDau']} // Add dependency for validation
                            rules={[
                                { required: true, message: 'Vui lòng chọn thời gian kết thúc!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startTime = getFieldValue('thoiGianBatDau');
                                        if (!value || !startTime) {
                                            return Promise.resolve(); // Skip if start time is missing
                                        }
                                        if (value.isAfter(startTime)) {
                                            return Promise.resolve(); // Valid if end is after start
                                        }
                                        return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu!'));
                                    },
                                }),
                            ]}
                        >
                            <TimePicker
                                style={{ width: '100%' }}
                                format="HH:mm"
                                minuteStep={15}
                                placeholder="Chọn giờ kết thúc"
                            />
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </Layout>
    );
};

export default QuanLyGhiChuThietBi;