// src/hooks/useCaThucHanhManager.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { Form, message } from 'antd';
import Swal from 'sweetalert2';
import { useNavigate, useLoaderData } from 'react-router-dom';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

// Extend dayjs with necessary plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.locale('vi');

// Define the debounce function directly within this file
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const useCaThucHanhManager = () => {
    const navigate = useNavigate();
    const loaderData = useLoaderData();
    const [form] = Form.useForm(); // Ant Design Form instance

    // --- State Variables ---
    const [caThucHanhData, setCaThucHanhData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState('');
    const [hoveredRowKey, setHoveredRowKey] = useState(''); // Exposed for UI to use
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // --- Options for Select dropdowns (GiaoVien, PhongMay, MonHoc) ---
    const [giaoVienOptions, setGiaoVienOptions] = useState([]);
    const [phongMayOptions, setPhongMayOptions] = useState([]);
    const [monHocOptions, setMonHocOptions] = useState([]);

    // --- Search State Variables ---
    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState(''); // For text/number input
    const [searchDateValue, setSearchDateValue] = useState(null); // For single date input
    const [searchDateRangeValue, setSearchDateRangeValue] = useState([null, null]); // For date range input
    const [apiQueryKeyword, setApiQueryKeyword] = useState(''); // The actual keyword sent to API

    const tableRef = useRef(null); // Ref for table scroll

    // --- Search Options (Constants) ---
    const searchFieldsOptions = [
        { value: 'maCa', label: 'Mã Ca', type: 'number' },
        { value: 'tenCa', label: 'Tên Ca', type: 'text' },
        { value: 'ngayThucHanh', label: 'Ngày Thực Hành', type: 'date' },
        { value: 'tietBatDau', label: 'Tiết Bắt Đầu', type: 'number' },
        { value: 'tietKetThuc', label: 'Tiết Kết Thúc', type: 'number' },
        { value: 'buoiSo', label: 'Buổi Số', type: 'number' },
        { value: 'giaoVienMa', label: 'Mã Giáo Viên', type: 'text' },
        { value: 'giaoVienHoTen', label: 'Tên Giáo Viên', type: 'text' },
        { value: 'phongMayMa', label: 'Mã Phòng Máy', type: 'number' },
        { value: 'phongMayTen', label: 'Tên Phòng Máy', type: 'text' },
        { value: 'monHocMa', label: 'Mã Môn Học', type: 'number' },
        { value: 'monHocTen', label: 'Tên Môn Học', type: 'text' },
    ];
    const searchOperatorsOptions = [
        { value: 'EQ', label: 'Bằng (=)', types: ['text', 'number', 'date'] },
        { value: 'NE', label: 'Không bằng (!=)', types: ['text', 'number', 'date'] },
        { value: 'LIKE', label: 'Chứa (like)', types: ['text'] },
        { value: 'NOT_LIKE', label: 'Không chứa (not like)', types: ['text'] },
        { value: 'STARTS_WITH', label: 'Bắt đầu với', types: ['text'] },
        { value: 'ENDS_WITH', label: 'Kết thúc với', types: ['text'] },
        { value: 'GT', label: 'Lớn hơn (>)' , types: ['number', 'date']},
        { value: 'GTE', label: 'Lớn hơn hoặc bằng (>=)', types: ['number', 'date'] },
        { value: 'LT', label: 'Nhỏ hơn (<)', types: ['number', 'date'] },
        { value: 'LTE', label: 'Nhỏ hơn hoặc bằng (<=)', types: ['number', 'date'] },
        { value: 'BETWEEN', label: 'Trong khoảng (Between)', types: ['date', 'number'] },
        { value: 'IS_NULL', label: 'Là Rỗng (is null)', types: ['text', 'number', 'date'] },
        { value: 'IS_NOT_NULL', label: 'Không Rỗng (is not null)', types: ['text', 'number', 'date'] },
        { value: 'IN', label: 'Trong danh sách (in)', types: ['text', 'number', 'date'] },
        { value: 'NOT_IN', label: 'Ngoài danh sách (not in)', types: ['text', 'number', 'date'] },
    ];

    // --- Derived Search States for UI Logic ---
    const selectedField = searchFieldsOptions.find(f => f.value === searchFieldValue);
    const selectedFieldType = selectedField?.type;
    const operatorRequiresValue = !['IS_NULL', 'IS_NOT_NULL'].includes(searchOperatorValue);
    const isDateRangeOperator = selectedFieldType === 'date' && ['BETWEEN', 'NOT_BETWEEN'].includes(searchOperatorValue);
    const isListOperator = ['IN', 'NOT_IN'].includes(searchOperatorValue);

    const getFilteredOperators = useCallback(() => {
        if (!selectedField) return searchOperatorsOptions;
        return searchOperatorsOptions.filter(op => op.types.includes(selectedField.type));
    }, [selectedField]);


    // --- Fetching Options for Dropdowns (GiaoVien, PhongMay, MonHoc) ---
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("Token not found, cannot fetch options.");
            return;
        }

        const fetchGenericOptions = async (url, setter, valueField, labelField, entityName) => {
            try {
                const response = await fetch(`${url}?token=${token}`, { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.status === 401 || response.status === 403) {
                    console.error(`Unauthorized or Forbidden (status ${response.status}) to fetch ${entityName}.`);
                    setter([]);
                    return;
                }
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP error ${response.status} fetching ${entityName}: ${errorText}`);
                }
                if (response.status === 204) {
                    setter([]);
                    return;
                }
                let data;
                try {
                    data = await response.json();
                } catch (parseError) {
                    console.error(`Error parsing JSON for ${entityName}:`, parseError, "Raw text was:", await response.text());
                    throw new Error(`Invalid JSON response for ${entityName}`);
                }
                const list = Array.isArray(data) ? data : (Array.isArray(data.content) ? data.content : []);
                if (!Array.isArray(list)) {
                    console.error(`Expected an array for ${entityName}, but got:`, typeof list, list);
                    setter([]); return;
                }
                const mappedData = list.map(item => {
                    if (typeof item !== 'object' || item === null || !(valueField in item) || !(labelField in item)) {
                        return null;
                    }
                    return { value: item[valueField], label: item[labelField] };
                }).filter(Boolean);
                setter(mappedData);
            } catch (error) {
                console.error(`ERROR fetching or processing ${entityName}:`, error.message);
                setter([]);
            }
        };

        fetchGenericOptions('https://localhost:8080/DSGiaoVien', setGiaoVienOptions, 'maGiaoVien', 'hoTen', 'Giáo Viên');
        fetchGenericOptions('https://localhost:8080/DSPhongMay', setPhongMayOptions, 'maPhong', 'tenPhong', 'Phòng Máy');
        fetchGenericOptions('https://localhost:8080/DSMonHoc', setMonHocOptions, 'maMon', 'tenMon', 'Môn Học');
    }, [navigate]);


    // --- Data Fetching Logic for CaThucHanh Table ---
    const fetchCaThucHanhData = useCallback(async (currentSearchKeyword = '', page = 1, pageSize = pagination.pageSize) => {
        const token = localStorage.getItem('authToken');
        if (!token) { Swal.fire('Lỗi', 'Token không hợp lệ.', 'error').then(() => navigate('/login')); return; }
        setLoading(true);

        let apiUrl = 'https://localhost:8080/';
        const params = new URLSearchParams({ token });
        let isAdvancedSearch = false;

        if (currentSearchKeyword && currentSearchKeyword.includes(':')) {
            apiUrl += 'searchCaThucHanhByAdmin';
            params.append('keyword', currentSearchKeyword);
            isAdvancedSearch = true;
        } else {
            apiUrl += 'DSCaThucHanh';
        }
        apiUrl += `?${params.toString()}`;

        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401 || response.status === 403) throw new Error('Unauthorized or Forbidden');
            if (response.status === 204) { setCaThucHanhData([]); setPagination(p => ({ ...p, total: 0, current: 1 })); setSelectedRowKeys([]); return; }
            if (!response.ok) {
                const errText = await response.text();
                try { const err = JSON.parse(errText); throw new Error(err.message || `HTTP error ${response.status}`); }
                catch (e) { throw new Error(errText || `HTTP error ${response.status}`); }
            }
            const data = await response.json();

            let results, totalItems;
            if (isAdvancedSearch) {
                results = Array.isArray(data.results) ? data.results : [];
                totalItems = typeof data.size === 'number' ? data.size : results.length;
            } else {
                results = Array.isArray(data) ? data : (Array.isArray(data.content) ? data.content : []); // Handle both plain array and Page object
                totalItems = typeof data.totalElements === 'number' ? data.totalElements : results.length; // Use totalElements if present
            }

            // Client-side pagination logic for APIs that don't return paginated data
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginatedResults = results.slice(start, end);

            const processedData = paginatedResults.map((item, index) => ({
                ...item,
                key: item.maCa,
                stt: (page - 1) * pageSize + index + 1,
                ngayThucHanh: item.ngayThucHanh ? dayjs.utc(item.ngayThucHanh).local() : null,
                maGiaoVien: item.giaoVien?.maGiaoVien, // Extract IDs for editable fields
                maPhong: item.phongMay?.maPhong,
                maMon: item.monHoc?.maMon,
            }));
            setCaThucHanhData(processedData);
            setPagination(p => ({ ...p, total: totalItems, current: page, pageSize: pageSize }));
            setSelectedRowKeys([]); // Clear selection on data reload
        } catch (error) {
            console.error("Fetch CaThucHanh error:", error);
            if (error.message.includes('Unauthorized')) Swal.fire('Lỗi', 'Phiên hết hạn hoặc không có quyền.', 'error').then(() => navigate('/login'));
            else Swal.fire('Lỗi', `Không tải được dữ liệu Ca Thực Hành: ${error.message}`, 'error');
            setCaThucHanhData([]); setSelectedRowKeys([]);
        } finally { setLoading(false); }
    }, [navigate, pagination.pageSize]);

    const debouncedFetchData = useCallback(debounce(fetchCaThucHanhData, 700), [fetchCaThucHanhData]);

    // --- Effects for Initial Load and Search Trigger ---
    useEffect(() => {
        console.log("⚡️ [Hook] Received loaderData:", loaderData); // Debugging
        if (loaderData && loaderData.error) {
            if (loaderData.type === 'auth') {
                Swal.fire('Lỗi xác thực', loaderData.message, 'error').then(() => navigate('/login'));
            } else {
                Swal.fire('Lỗi Tải Dữ Liệu Ban Đầu', loaderData.message || 'Không thể tải danh sách ca thực hành.', 'error');
            }
            setCaThucHanhData([]);
            setPagination(p => ({ ...p, total: 0, current: 1 }));
        } else if (loaderData && Array.isArray(loaderData.data)) {
            const initialData = loaderData.data; // Assuming loader already returns plain array
            const page = 1;
            const pageSize = pagination.pageSize;
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginatedInitialData = initialData.slice(start, end);

            const processedData = paginatedInitialData.map((item, index) => ({
                ...item,
                key: item.maCa,
                stt: (page - 1) * pageSize + index + 1,
                ngayThucHanh: item.ngayThucHanh ? dayjs.utc(item.ngayThucHanh).local() : null,
                maGiaoVien: item.giaoVien?.maGiaoVien,
                maPhong: item.phongMay?.maPhong,
                maMon: item.monHoc?.maMon,
            }));
            setCaThucHanhData(processedData);
            setPagination(p => ({ ...p, total: initialData.length, current: page, pageSize: pageSize }));
        } else {
            // Fallback: If loaderData is not provided or not in expected format, trigger a fetch.
            // This ensures data loads even if loader is skipped or fails unexpectedly.
            console.warn("[Hook] loaderData is not in expected format or missing, attempting initial fetch via debouncedFetchData.");
            debouncedFetchData('', 1, pagination.pageSize);
        }
    }, [loaderData, navigate, pagination.pageSize, debouncedFetchData]); // Add debouncedFetchData to dependency array

    useEffect(() => {
        let newKeyword = '';
        if (searchFieldValue && searchOperatorValue) {
            let valueForApi = '';
            let isValueValidAndProvided = false;

            if (operatorRequiresValue) {
                if (selectedFieldType === 'date') {
                    if (isDateRangeOperator) {
                        const [start, end] = searchDateRangeValue;
                        if (start && end && dayjs.isDayjs(start) && dayjs.isDayjs(end) && start.isValid() && end.isValid() && !start.isAfter(end)) {
                            valueForApi = `${start.format('YYYY-MM-DD')},${end.format('YYYY-MM-DD')}`;
                            isValueValidAndProvided = true;
                        }
                    } else {
                        if (searchDateValue && dayjs.isDayjs(searchDateValue) && searchDateValue.isValid()) {
                            valueForApi = searchDateValue.format('YYYY-MM-DD');
                            isValueValidAndProvided = true;
                        }
                    }
                } else {
                    const trimmedInput = String(searchInput).trim();
                    if (trimmedInput !== '') {
                        if (selectedFieldType === 'number' && !isListOperator && isNaN(Number(trimmedInput))) {
                            isValueValidAndProvided = false;
                        } else {
                            valueForApi = trimmedInput;
                            isValueValidAndProvided = true;
                        }
                    }
                }
            } else {
                isValueValidAndProvided = true;
                valueForApi = '';
            }

            if (isValueValidAndProvided) {
                newKeyword = `${searchFieldValue}:${searchOperatorValue}:${valueForApi}`;
            }
        }
        if (newKeyword !== apiQueryKeyword) {
            setApiQueryKeyword(newKeyword);
        }
    }, [
        searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue,
        selectedFieldType, operatorRequiresValue, isDateRangeOperator, isListOperator, apiQueryKeyword
    ]);

    useEffect(() => {
        // Trigger fetch only if the apiQueryKeyword changes or if it's an intentional reset
        // And ensure it doesn't re-fetch immediately after loaderData provides initial data
        const isInitialLoadWithNoSearch = apiQueryKeyword === '' && !searchFieldValue && !searchOperatorValue && !searchInput && !searchDateValue && !searchDateRangeValue[0];

        // Only fetch if apiQueryKeyword is non-empty (a search is active),
        // or if it's an initial load where loaderData was *not* provided,
        // or if search is actively cleared (apiQueryKeyword becomes '').
        if (apiQueryKeyword || (isInitialLoadWithNoSearch && !loaderData?.data)) {
            // If loaderData was provided, we don't want this effect to trigger an immediate fetch on initial render
            // This is a subtle point to prevent double-fetching on initial load.
            // After initial load, if apiQueryKeyword changes (user performs search), it should fetch.
            debouncedFetchData(apiQueryKeyword, 1, pagination.pageSize);
        }
    }, [apiQueryKeyword, pagination.pageSize, debouncedFetchData, searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue, loaderData]);


    // --- Search Handlers ---
    const handleClearSearch = useCallback(() => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchDateValue(null);
        setSearchDateRangeValue([null, null]);
        setApiQueryKeyword(''); // This will trigger fetch of all data
    }, []);

    const handleFieldChange = useCallback((value) => {
        setSearchFieldValue(value);
    }, []);

    const handleOperatorChange = useCallback((value) => {
        setSearchOperatorValue(value);
        if (value && !['IS_NULL', 'IS_NOT_NULL'].includes(value)) {
            // Operator requires a value, do nothing to existing value inputs
        } else {
            // Operator is IS_NULL/IS_NOT_NULL or operator is cleared, clear value inputs
            setSearchInput('');
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]);
        }
    }, []);

    const handleValueChange = useCallback((val) => {
        if (selectedFieldType === 'date') {
            if (isDateRangeOperator) {
                setSearchDateRangeValue(val || [null, null]);
            } else {
                setSearchDateValue(val);
            }
        } else {
            const inputValue = (typeof val === 'number' || typeof val === 'string') ? String(val) : (val?.target?.value ?? '');
            setSearchInput(inputValue);
        }
    }, [selectedFieldType, isDateRangeOperator]);


    // --- Table Editing Logic ---
    const isEditing = useCallback((record) => record && record.key === editingKey, [editingKey]);

    const edit = useCallback((record) => {
        if (!record) return;
        form.setFieldsValue({
            tenCa: record.tenCa,
            ngayThucHanh: record.ngayThucHanh ? dayjs(record.ngayThucHanh) : null,
            tietBatDau: record.tietBatDau,
            tietKetThuc: record.tietKetThuc,
            buoiSo: record.buoiSo,
            maGiaoVien: record.maGiaoVien,
            maPhong: record.maPhong,
            maMon: record.maMon,
        });
        setEditingKey(record.key);
    }, [form]);

    const cancel = useCallback((key) => {
        const record = caThucHanhData.find(item => item.key === key);
        // If it was a new unsaved record, remove it from data
        if (record?.isNew) {
            setCaThucHanhData(prev => {
                const updatedData = prev.filter(item => item.key !== key);
                // Recalculate STT for remaining items
                return updatedData.map((item, idx) => ({...item, stt: (pagination.current -1) * pagination.pageSize + idx + 1}));
            });
            setPagination(prev => ({...prev, total: Math.max(0, prev.total -1)}));
        }
        setEditingKey('');
    }, [caThucHanhData, pagination.current, pagination.pageSize]);

    const save = useCallback(async (key) => {
        try {
            const row = await form.validateFields();
            const itemToSave = caThucHanhData.find(item => item.key === key);
            if (!itemToSave) throw new Error("Không tìm thấy mục để lưu.");
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Token không hợp lệ.");

            const isNewRecord = itemToSave.isNew || !itemToSave.maCa;
            let apiUrl = 'https://localhost:8080/';
            const params = new URLSearchParams({ token });

            params.append('tenCa', row.tenCa || '');
            params.append('ngayThucHanh', row.ngayThucHanh ? dayjs(row.ngayThucHanh).format('YYYY-MM-DD') : '');
            params.append('tietBatDau', String(row.tietBatDau || 1));
            params.append('tietKetThuc', String(row.tietKetThuc || 1));
            params.append('buoiSo', String(row.buoiSo || 1));
            params.append('maGiaoVien', String(row.maGiaoVien || ''));
            params.append('maPhong', String(row.maPhong || ''));
            params.append('maMon', String(row.maMon || ''));

            if (isNewRecord) {
                apiUrl += 'LuuCaThucHanh';
            } else {
                apiUrl += `CapNhatCaThucHanh`;
                params.append('maCaThucHanh', String(itemToSave.maCa));
            }
            const method = isNewRecord ? 'POST' : 'PUT';
            const response = await fetch(`${apiUrl}?${params.toString()}`, { method, headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Lỗi server ${response.status}` }));
                throw new Error(errorData.message || `Lỗi ${isNewRecord ? 'lưu' : 'cập nhật'}`);
            }
            Swal.fire({ icon: 'success', title: 'Thành công!', text: `Đã ${isNewRecord ? 'lưu' : 'cập nhật'} ca thực hành.` });
            debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize); // Reload data after save
            setEditingKey('');
        } catch (errInfo) {
            console.error('Save/Validate Error:', errInfo);
            if (errInfo.errorFields) message.error('Dữ liệu không hợp lệ.');
            else Swal.fire({ icon: 'error', title: 'Thất bại!', text: errInfo.message || 'Lỗi không xác định.' });
        }
    }, [form, caThucHanhData, debouncedFetchData, pagination, apiQueryKeyword]);

    const handleDelete = useCallback((recordKey) => {
        const recordToDelete = caThucHanhData.find(item => item.key === recordKey);
        if (!recordToDelete) return;
        if (recordToDelete.isNew) { // If it's a new unsaved record, just cancel it
            cancel(recordKey);
            return;
        }
        if (!recordToDelete.maCa) { message.error("Không thể xóa ca thực hành không có Mã Ca."); return; } // Should not happen for saved records

        Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?', text: `Ca thực hành: ${recordToDelete.tenCa || '(Chưa có tên)'}`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa!', cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const token = localStorage.getItem('authToken');
                if (!token) { message.error("Token không hợp lệ"); return; }
                setLoading(true);
                const apiUrl = new URL(`https://localhost:8080/XoaCaThucHanh/${recordToDelete.maCa}`);
                apiUrl.searchParams.append('token', token);
                try {
                    const response = await fetch(apiUrl.toString(), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    const resDataText = await response.text();
                    let resData;
                    try { resData = JSON.parse(resDataText); } catch (e) { resData = resDataText; }

                    if (!response.ok) throw new Error( (typeof resData === 'string' ? resData : resData.message) || 'Lỗi xóa ca thực hành');
                    Swal.fire('Đã xóa!', (typeof resData === 'string' ? resData : (resData.message || 'Ca thực hành đã được xóa.')) , 'success');
                    debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
                } catch (error) { Swal.fire('Lỗi!', `Xóa thất bại: ${error.message}`, 'error'); }
                finally { setLoading(false); }
            }
        });
    }, [caThucHanhData, debouncedFetchData, pagination, apiQueryKeyword, cancel]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedRowKeys.length === 0) { message.warn("Vui lòng chọn ít nhất một ca thực hành để xóa."); return; }
        // Filter out new, unsaved records from selection if they somehow got there (checkboxes should disable them)
        const maCaToDelete = selectedRowKeys.filter(key => caThucHanhData.find(cth => cth.key === key)?.maCa);

        if (maCaToDelete.length === 0) { message.info("Không có ca thực hành hợp lệ (đã lưu) được chọn để xóa."); return; }

        Swal.fire({
            title: `Bạn chắc chắn muốn xóa ${maCaToDelete.length} ca thực hành đã chọn?`, text: "Hành động này không thể hoàn tác!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa!', cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const token = localStorage.getItem('authToken');
                if (!token) { message.error("Token không hợp lệ"); return; }
                setLoading(true);
                const params = new URLSearchParams({ token });
                maCaToDelete.forEach(maCa => params.append('maCaThucHanhList', maCa.toString()));
                const apiUrl = `https://localhost:8080/XoaNhieuCaThucHanh?${params.toString()}`;
                try {
                    const response = await fetch(apiUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    const resData = await response.json().catch(() => ({ message: response.statusText }));
                    if (!response.ok) throw new Error(resData.message || 'Lỗi xóa nhiều ca thực hành');
                    Swal.fire('Đã xóa!', resData.message || `${maCaToDelete.length} ca thực hành đã được xóa.`, 'success');
                    debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
                } catch (error) { Swal.fire('Lỗi!', `Xóa thất bại: ${error.message}`, 'error'); }
                finally { setLoading(false); }
            }
        });
    }, [selectedRowKeys, caThucHanhData, debouncedFetchData, pagination, apiQueryKeyword]);

    const handleAddBelow = useCallback((currentRowKey) => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const currentIndex = caThucHanhData.findIndex(item => item.key === currentRowKey);
        const baseSTT = caThucHanhData[currentIndex]?.stt || ((pagination.current - 1) * pagination.pageSize + caThucHanhData.length);
        const newRecord = { key: newKey, maCa: null, tenCa: '', ngayThucHanh: dayjs(), tietBatDau: 1, tietKetThuc: 2, buoiSo: 1, maGiaoVien: null, maPhong: null, maMon: null, isNew: true, stt: baseSTT + 1 };

        setCaThucHanhData(prev => {
            let newData = [...prev];
            newData.splice(currentIndex + 1, 0, newRecord);
            // Re-index STT for items that follow the new one on the current page
            return newData.map((item, idx) => ({ ...item, stt: (pagination.current - 1) * pagination.pageSize + idx + 1 }));
        });
        setPagination(prev => ({...prev, total: prev.total + 1}));
        edit(newRecord);
    }, [editingKey, caThucHanhData, pagination.current, pagination.pageSize, edit]);

    const handleGlobalAddNew = useCallback(() => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const newTotal = pagination.total + 1;
        // The STT for a new record (especially when not on page 1 or filling a page)
        // should ideally be managed by the backend or after a full reload.
        // For local display, assigning the new total as a temporary STT is a quick fix.
        const newRecord = { key: newKey, maCa: null, tenCa: '', ngayThucHanh: dayjs(), tietBatDau: 1, tietKetThuc: 2, buoiSo: 1, maGiaoVien: null, maPhong: null, maMon: null, isNew: true, stt: newTotal };

        const newPageForItem = Math.ceil(newTotal / pagination.pageSize);

        if (newPageForItem > pagination.current && caThucHanhData.length >= pagination.pageSize) {
            // New item goes to a new page. We update pagination to go there
            // and simply add the record to the local state (it will be replaced by fetch).
            setPagination(prev => ({ ...prev, current: newPageForItem, total: newTotal }));
            setCaThucHanhData(prev => [...prev, newRecord]); // Add to current data (will be replaced by fetch)
            setEditingKey(newKey); // Set editing key immediately
        } else {
            // Add to current page's data and update STT for all current items
            setCaThucHanhData(prev => {
                const newData = [...prev, newRecord];
                return newData.map((item, idx) => ({ ...item, stt: (pagination.current - 1) * pagination.pageSize + idx + 1 }));
            });
            setPagination(prev => ({ ...prev, total: newTotal }));
            edit(newRecord);
        }

        // Scroll to the bottom of the table
        setTimeout(() => {
            if (tableRef.current) {
                const tableBody = tableRef.current.querySelector('.ant-table-body');
                if (tableBody) tableBody.scrollTop = tableBody.scrollHeight;
            }
        }, 200); // Small delay to allow render
    }, [editingKey, pagination, tableRef, caThucHanhData, edit]);


    // --- Table & Row Selection Handlers ---
    const handleTableChange = useCallback((newPagination, filters, sorter) => {
        // If sorting or filtering while editing, cancel editing
        if (editingKey && (sorter.field || Object.keys(filters).length > 0)) {
            cancel(editingKey);
        }
        setSelectedRowKeys([]); // Clear selection on page change
        fetchCaThucHanhData(apiQueryKeyword, newPagination.current, newPagination.pageSize);
    }, [editingKey, cancel, fetchCaThucHanhData, apiQueryKeyword]);

    const onSelectChange = useCallback((keys) => setSelectedRowKeys(keys), []);

    // --- Derived UI Flags ---
    const hasSelected = selectedRowKeys.length > 0;
    const showGlobalAddButton = pagination.current > 1 || caThucHanhData.length >= pagination.pageSize || pagination.total > caThucHanhData.length;


    // --- Return values to the component ---
    return {
        // Data and Loading States
        caThucHanhData,
        loading,
        pagination,
        selectedRowKeys,

        // Options for Selects
        giaoVienOptions,
        phongMayOptions,
        monHocOptions,

        // Editing States & Functions
        editingKey,
        hoveredRowKey,
        setHoveredRowKey, // So the UI can set it on mouse enter/leave
        isEditing,
        edit,
        cancel,
        save,
        handleDelete,
        handleAddBelow,
        handleGlobalAddNew,
        handleDeleteSelected,

        // Search States & Functions
        searchFieldValue,
        searchOperatorValue,
        searchInput,
        searchDateValue,
        searchDateRangeValue,
        handleFieldChange,
        handleOperatorChange,
        handleValueChange,
        handleClearSearch,
        searchFieldsOptions,
        getFilteredOperators,
        selectedFieldType,
        operatorRequiresValue,
        isDateRangeOperator,
        isListOperator,

        // Table Control
        form, // Ant Design Form instance
        tableRef, // Ref for table element
        handleTableChange,
        onSelectChange,

        // UI Helpers
        hasSelected,
        showGlobalAddButton,
    };
};

export default useCaThucHanhManager;