// src/pages/QuanLyGhiChuMayTinh.js

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

    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

    useEffect(() => {
        if (isDarkMode) {
            DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
        } else {
            DarkReader.disable();
        }
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

// --- Main Component: QuanLyGhiChuMayTinh ---
const QuanLyGhiChuMayTinh = () => {
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
    const [searchFieldValue, setSearchFieldValue] = useState(null); // Selected attribute
    const [searchOperatorValue, setSearchOperatorValue] = useState(null); // Selected operator
    const [searchInput, setSearchInput] = useState(''); // Text/Number search value
    const [searchDateValue, setSearchDateValue] = useState(null); // Single date search value
    const [searchDateRangeValue, setSearchDateRangeValue] = useState([null, null]); // Date range value
    const [searchKeyword, setSearchKeyword] = useState(''); // Final keyword string for API

    // --- Search Configuration ---
    const searchFieldsOptions = [
        { value: 'noiDung', label: 'Nội dung', type: 'text' },
        { value: 'tenMay', label: 'Tên Máy', type: 'text' },
        { value: 'tenPhong', label: 'Tên Phòng', type: 'text' },
        { value: 'tenTKBL', label: 'Người Báo Lỗi', type: 'text' },
        { value: 'tenTKSL', label: 'Người Sửa Lỗi', type: 'text' },
        { value: 'ngayBaoLoi', label: 'Ngày Báo Lỗi', type: 'date' },
        { value: 'ngaySua', label: 'Ngày Sửa', type: 'date' },
        { value: 'maMay', label: 'Mã Máy', type: 'number' },
        { value: 'maPhong', label: 'Mã Phòng', type: 'number' },
        { value: 'maTKBL', label: 'Mã Người Báo Lỗi', type: 'number' },
        { value: 'maTKSL', label: 'Mã Người Sửa Lỗi', type: 'number' },
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

            // Filter based on expected properties (maNhanVien is essential)
            const validData = data.filter(nv =>
                nv && (nv.maNhanVien !== null && nv.maNhanVien !== undefined)
            );

            if (data.length > 0 && validData.length === 0) {
                console.warn(
                    "Fetched employee data, but no entries had a valid 'maNhanVien'. Check API structure.",
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

    // Fetch main computer notes data (handles initial load and search)
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

        // Determine API endpoint based on search keyword presence
        if (currentSearchKeyword && currentSearchKeyword.includes(':')) {
            apiUrl += 'searchGhiChuMayTinhByAdmin'; // Search endpoint
            params.append('keyword', currentSearchKeyword);
        } else {
            apiUrl += 'DSGhiChuMayTinh'; // Default list endpoint
        }

        apiUrl += `?${params.toString()}`; // Append parameters
        console.log("Fetching Ghi Chu URL:", apiUrl);

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

            // Handle potential nested results from search endpoint
            let results = [];
            if (currentSearchKeyword && currentSearchKeyword.includes(':')) {
                if (data && Array.isArray(data.results)) {
                    results = data.results;
                } else if (Array.isArray(data)) {
                    results = data;
                    console.warn("Search response was a direct array, expected nested 'results'.");
                } else {
                    console.warn("Search response format unexpected:", data);
                    results = [];
                }
            } else if (Array.isArray(data)) {
                results = data;
            } else {
                console.error("Unexpected data format received for list:", data);
                results = [];
            }

            // Process the final results array
            const processedData = results.map((item, index) => ({
                ...item,
                key: item.maGhiChuMT || `fallback-${index}`, // Ensure unique key
                stt: index + 1,
            }));
            setGhiChuData(processedData);

        } catch (error) {
            console.error("Error fetching Ghi Chu data:", error);
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
                    `Không thể tải dữ liệu ghi chú: ${error.message}`,
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

    // Effect to process initial loader data & fetch employees
    useEffect(() => {
        console.log("[Effect] Processing loader data:", loaderData);
        setLoading(true);
        if (loaderData && !loaderData.error && Array.isArray(loaderData.data)) {
            const processedData = loaderData.data.map((item, index) => ({
                ...item,
                key: item.maGhiChuMT || `fallback-${index}`, // Ensure key
                stt: index + 1,
            }));
            console.log("[Effect] Processed data:", processedData);
            setGhiChuData(processedData);
            // Fetch employees if initial data load succeeded
            fetchNhanVien();
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
                    loaderData.message || 'Không thể tải dữ liệu ghi chú.',
                    'error'
                );
            }
            setGhiChuData([]);
        } else {
            console.warn("No initial data from loader or format error. Attempting fetch...");
            if (loaderData?.error?.type !== 'auth') {
                fetchGhiChuData(''); // Fetch initial data without search
                fetchNhanVien();    // Also attempt fetch employees
            } else if (!loaderData) {
                Swal.fire(
                    'Lỗi',
                    'Dữ liệu ghi chú không đúng định dạng hoặc bị lỗi (Loader data missing).',
                    'error'
                );
                setGhiChuData([]);
            }
        }
        setLoading(false);
    }, [loaderData, navigate, fetchGhiChuData, fetchNhanVien]); // Add fetch functions

    // Effect to build the search keyword string
    useEffect(() => {
        let keyword = '';
        const requiresValue = isOperatorRequiringValue;

        if (searchFieldValue && searchOperatorValue) {
            let valuePart = '';
            let isValidInput = false;

            if (requiresValue) {
                // Handle date range input
                if (isDateRangeOperatorSelected) {
                    const [start, end] = searchDateRangeValue;
                    if (start && end && dayjs.isDayjs(start) && dayjs.isDayjs(end) && start.isValid() && end.isValid()) {
                        valuePart = `${start.format('YYYY-MM-DD')},${end.format('YYYY-MM-DD')}`; // Format for API
                        isValidInput = true;
                    }
                    // Handle single date input
                } else if (isSingleDateOperatorSelected) {
                    if (searchDateValue && dayjs.isDayjs(searchDateValue) && searchDateValue.isValid()) {
                        valuePart = searchDateValue.format('YYYY-MM-DD'); // Format for API
                        isValidInput = true;
                    }
                    // Handle text/number input
                } else if (!isDateFieldSelected) {
                    if (searchInput.trim()) {
                        valuePart = searchInput.trim();
                        isValidInput = true;
                    }
                }

                if (isValidInput) {
                    keyword = `${searchFieldValue}:${searchOperatorValue}:${valuePart}`;
                } else {
                    keyword = ''; // Invalidate keyword if required value is missing/invalid
                }

            } else { // IS_NULL or IS_NOT_NULL
                keyword = `${searchFieldValue}:${searchOperatorValue}:`; // Value part is empty
                isValidInput = true; // No value needed, so considered valid
            }

            // Final check: Ensure all parts are present if needed
            if (!(searchFieldValue && searchOperatorValue && isValidInput)) {
                keyword = '';
            }

        } else {
            // No field or operator selected, clear keyword
            keyword = '';
        }

        // Update state only if keyword actually changed
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
        searchKeyword // Include searchKeyword to prevent infinite loops if logic is complex
    ]);

    // Effect to trigger debounced fetch when the search keyword changes
    useEffect(() => {
        console.log("Search keyword changed, triggering fetch:", searchKeyword);
        const keywordParts = searchKeyword.split(':');
        // Basic validation: keyword is empty or has 3 parts
        const isValidKeyword = searchKeyword === '' || (keywordParts.length === 3 && keywordParts[0] && keywordParts[1]);

        if (isValidKeyword) {
            // Trigger fetch only if keyword seems valid or is empty (reset)
            debouncedFetchData(searchKeyword);
        }
        // Also trigger fetch if all search inputs are cleared manually
        else if (!searchFieldValue && !searchOperatorValue && !searchInput && !searchDateValue && !(searchDateRangeValue[0])) {
            debouncedFetchData(''); // Explicitly fetch all data
        }
        // Avoid fetching if keyword is invalid mid-construction
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
            // Assume input is UTC, convert to local time for display
            const dateObj = dayjs.utc(dateString).local();
            if (!dateObj.isValid()) return 'Ngày không hợp lệ';
            return dateObj.format('DD/MM/YYYY HH:mm:ss'); // Vietnamese locale format
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return 'Ngày không hợp lệ';
        }
    };

    // --- Modal Handling ---
    const showModal = (record) => {
        setSelectedRecord(record); // Store the record to be edited
        form.resetFields(); // Clear any previous form data
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedRecord(null); // Clear the selected record
        form.resetFields(); // Clear form data
    };

    // --- API Call to Update Schedule ---
    const handleUpdateSchedule = async (values) => {
        if (!selectedRecord) {
            message.error('Lỗi: Không có ghi chú nào được chọn để cập nhật.');
            return;
        }
        if (!values.maNhanVienSua) {
            message.error('Lỗi: Vui lòng chọn người sửa lỗi.');
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) {
            message.error('Lỗi: Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
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

        // Prepare data for API
        const ngaySuaStr = values.ngaySua.format('DD/MM/YYYY');
        const thoiGianBatDau = values.thoiGianBatDau.format('HH:mm');
        const thoiGianKetThuc = values.thoiGianKetThuc.format('HH:mm');
        const maGhiChuMT = selectedRecord.maGhiChuMT;
        const maTKSuaLoi = values.maNhanVienSua; // Should be maNhanVien from the select

        console.log("API Call Params:", {
            maGhiChuMT,
            ngaySuaStr,
            thoiGianBatDau,
            thoiGianKetThuc,
            maTKSuaLoi, // This is maNhanVien
            token
        });
        setModalLoading(true);

        try {
            // Construct API URL with Query Parameters
            const url = new URL('https://localhost:8080/CapNhatNguoiSuaVaThoiGianSua');
            url.searchParams.append('maGhiChuMT', maGhiChuMT);
            url.searchParams.append('ngaySuaStr', ngaySuaStr);
            url.searchParams.append('thoiGianBatDau', thoiGianBatDau);
            url.searchParams.append('thoiGianKetThuc', thoiGianKetThuc);
            url.searchParams.append('maTKSuaLoi', maTKSuaLoi); // Send maNhanVien as maTKSuaLoi
            url.searchParams.append('token', token);

            // Make API Call
            const putResponse = await fetch(url.toString(), {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Handle API Response
            let responseData = {};
            try {
                responseData = await putResponse.json();
            } catch (e) {
                if (!putResponse.ok) {
                    responseData = { message: `Lỗi máy chủ: ${putResponse.statusText}` };
                }
            }

            // Check if the API call was successful
            if (!putResponse.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${putResponse.status}`);
            }

            message.success('Đã cập nhật lịch sửa thành công!');
            setIsModalVisible(false); // Close the modal

            // Refetch data respecting current search filter
            fetchGhiChuData(searchKeyword);

        } catch (error) {
            console.error('Lỗi khi cập nhật lịch sửa:', error);
            message.error(`Cập nhật thất bại: ${error.message}`);
        } finally {
            setModalLoading(false); // Stop modal button loading indicator
        }
    };

    // --- Context Menu Handler ---
    const handleContextMenu = (event, record) => {
        event.preventDefault(); // Prevent default browser context menu
        const scheduledInfo = parseScheduledInfo(record.noiDung);
        // Allow opening the modal only if not already fixed AND not already scheduled
        if (!record.ngaySua && !scheduledInfo) {
            showModal(record);
        }
    };

    // --- Search Event Handlers ---
    const handleClearSearch = () => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchDateValue(null);
        setSearchDateRangeValue([null, null]);
        // useEffect watching these will clear searchKeyword and trigger fetch
    };

    const handleAttributeChange = (value) => {
        const newField = searchFieldsOptions.find(f => f.value === value);
        const newFieldType = newField?.type;
        setSearchFieldValue(value); // Update selected field

        // Reset operator if incompatible
        const currentOperatorIsValid = newFieldType && searchOperatorsOptions.find(
            op => op.value === searchOperatorValue
        )?.types.includes(newFieldType);
        if (!currentOperatorIsValid) {
            setSearchOperatorValue(null);
        }

        // Clear inappropriate inputs based on new field type
        if (newFieldType === 'date') {
            setSearchInput(''); // Clear text input
        } else {
            setSearchDateValue(null); // Clear date inputs
            setSearchDateRangeValue([null, null]);
        }
    };

    const handleOperatorChange = (value) => {
        setSearchOperatorValue(value); // Update selected operator

        // Determine requirements based on the NEW operator
        const newRequiresValue = !['IS_NULL', 'IS_NOT_NULL'].includes(value);
        const newIsDateRange = isDateFieldSelected && ['BETWEEN', 'NOT_BETWEEN'].includes(value);
        const newIsSingleDate = isDateFieldSelected && newRequiresValue && !newIsDateRange;

        // Clear inappropriate inputs
        if (!newRequiresValue) {
            setSearchInput('');
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]);
        } else if (newIsDateRange) {
            setSearchInput('');
            setSearchDateValue(null);
            // Keep or clear range? Clearing for simplicity.
            // setSearchDateRangeValue([null, null]);
        } else if (newIsSingleDate) {
            setSearchInput('');
            setSearchDateRangeValue([null, null]); // Clear range
            // Keep or clear single date? Clearing for simplicity.
            // setSearchDateValue(null);
        } else { // Text/Number op
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]); // Clear date/range
            // Keep searchInput
        }
    };

    // --- Sidebar Navigation & Logout Handlers ---
    const handleMenuClickSidebar = (e) => {
        if (e.key === 'dashboard') { navigate('/admin'); }
        else if (e.key === 'computerLogManagement') { navigate('/quanlyghichumaytinh'); }
        // Add other navigation keys as needed
        else if (e.key === 'logout') { handleLogout(); }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Clear token
        Swal.fire({
            icon: 'success',
            title: 'Đã đăng xuất',
            text: 'Bạn đã đăng xuất thành công.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => navigate('/login')); // Redirect to login
    };

    // --- Table Column Definitions ---
    const ghiChuColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 60, // Tăng nhẹ
            fixed: 'left',
            sorter: (a, b) => a.stt - b.stt,
            align: 'center', // Căn giữa cho STT thường đẹp hơn
        },
        {
            title: 'Nội dung',
            dataIndex: 'noiDung',
            key: 'noiDung',
            ellipsis: true,
            width: 200, // Tăng đáng kể, cho phép nội dung dài hơn
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
            title: 'Tên Máy',
            dataIndex: 'tenMay',
            key: 'tenMay',
            width: 150, // Tăng
            sorter: (a, b) => (a.tenMay || '').localeCompare(b.tenMay || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Tên Phòng',
            dataIndex: 'tenPhong',
            key: 'tenPhong',
            width: 150, // Tăng
            sorter: (a, b) => (a.tenPhong || '').localeCompare(b.tenPhong || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Ngày Báo Lỗi',
            dataIndex: 'ngayBaoLoi',
            key: 'ngayBaoLoi',
            width: 150, // Tăng để hiển thị ngày tháng rõ ràng
            sorter: (a, b) => dayjs(a.ngayBaoLoi).valueOf() - dayjs(b.ngayBaoLoi).valueOf(),
            render: (text) => formatDateDisplay(text) || 'N/A'
        },
        {
            title: 'Người Báo Lỗi',
            dataIndex: 'tenTaiKhoanBaoLoi',
            key: 'tenTaiKhoanBaoLoi',
            width: 150, // Tăng đáng kể
            sorter: (a, b) => (a.tenTaiKhoanBaoLoi || '').localeCompare(b.tenTaiKhoanBaoLoi || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Người Sửa Lỗi',
            dataIndex: 'tenTaiKhoanSuaLoi',
            key: 'tenTaiKhoanSuaLoi',
            width: 150, // Tăng đáng kể
            sorter: (a, b) => (a.tenTaiKhoanSuaLoi || '').localeCompare(b.tenTaiKhoanSuaLoi || ''),
            render: (text) => text ? text : <i>(Chưa có)</i>
        },
        {
            title: 'Trạng thái Sửa',
            dataIndex: 'ngaySua',
            key: 'ngaySuaStatus',
            width: 120, // Tăng, đủ cho tag hoặc ngày
            fixed: 'right',
            sorter: (a, b) => {
                const scheduledA = parseScheduledInfo(a.noiDung) ? 1 : 0;
                const scheduledB = parseScheduledInfo(b.noiDung) ? 1 : 0;
                const fixedA = a.ngaySua ? 1 : 0;
                const fixedB = b.ngaySua ? 1 : 0;
                const statusA = fixedA ? 2 : (scheduledA ? 1 : 0);
                const statusB = fixedB ? 2 : (scheduledA ? 1 : 0); // Sửa lỗi: scheduledB thay vì scheduledA
                if (statusA !== statusB) return statusA - statusB;
                if (fixedA && fixedB) return dayjs(a.ngaySua).valueOf() - dayjs(b.ngaySua).valueOf();
                return 0;
            },
            render: (_, record) => {
                const scheduledInfo = parseScheduledInfo(record.noiDung);
                const formattedOriginalNgaySua = formatDateDisplay(record.ngaySua);
                const fixerName = record.tenTaiKhoanSuaLoi ? ` (Sửa bởi: ${record.tenTaiKhoanSuaLoi})` : '';

                let content;
                if (record.ngaySua && formattedOriginalNgaySua !== 'Ngày không hợp lệ') {
                    content = <Tag color="success">{formattedOriginalNgaySua}</Tag>;
                } else if (scheduledInfo) {
                    const scheduleText = `Lịch dự kiến: ${scheduledInfo.date} ${scheduledInfo.startTime}-${scheduledInfo.endTime}${fixerName}`;
                    content = (
                        <Tooltip title={scheduleText}>
                            <Tag color="processing" icon={<ToolOutlined />}>
                                Đã lên lịch
                            </Tag>
                        </Tooltip>
                    );
                } else {
                    content = <Tag color="error">Chưa sửa</Tag>;
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
                            content={<div>Quản lí các ghi chú, báo lỗi của máy tính và lên lịch sửa chữa</div>}
                            trigger="hover"
                        >
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Quản Lý Ghi Chú Máy Tính
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360, borderRadius: '8px' }}>

                        {/* --- Search Bar --- */}
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="bottom">
                            {/* Column 1: Value Input (Conditional) */}
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
                            {/* Column 2: Attribute Select */}
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
                            {/* Column 3: Operator Select */}
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
                            {/* Column 4: Clear Button */}
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
                                showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} mục`
                            }}
                            scroll={{ x: 1500 }} // Enable horizontal scroll
                            bordered
                            size="small"
                        />
                    </div>
                </Content>
            </Layout>

            {/* --- Scheduling Modal --- */}
            {selectedRecord && (
                <Modal
                    title={`Lên lịch sửa cho máy: ${selectedRecord.tenMay || 'N/A'} (Phòng: ${selectedRecord.tenPhong || 'N/A'})`}
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
                    forceRender // Keep modal content rendered if needed
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
                            maNhanVienSua: null // Name corresponds to Form.Item below
                        }}
                    >
                        {/* --- Employee Selector (Using maNhanVien/tenNV) --- */}
                        <Form.Item
                            name="maNhanVienSua" // This value (maNhanVien) is sent to API
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
                                    (option?.value?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
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
                                            // Skip validation if start time is missing
                                            return Promise.resolve();
                                        }
                                        if (value.isAfter(startTime)) {
                                            // Valid if end is after start
                                            return Promise.resolve();
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

export default QuanLyGhiChuMayTinh;