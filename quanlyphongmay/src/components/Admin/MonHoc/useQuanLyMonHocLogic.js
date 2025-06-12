// src/hooks/useMonHocManager.js
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

const useMonHocManager = () => {
    const navigate = useNavigate();
    const loaderData = useLoaderData();
    const [form] = Form.useForm();

    // --- State Variables ---
    const [monHocData, setMonHocData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingKey, setEditingKey] = useState('');
    const [hoveredRowKey, setHoveredRowKey] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    // --- Search State Variables ---
    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchDateValue, setSearchDateValue] = useState(null);
    const [searchDateRangeValue, setSearchDateRangeValue] = useState([null, null]);
    const [apiQueryKeyword, setApiQueryKeyword] = useState('');

    const tableRef = useRef(null);

    // --- Search Options (Constants) ---
    const searchFieldsOptions = [
        { value: 'tenMon', label: 'Tên Môn', type: 'text' },
        { value: 'ngayBatDau', label: 'Ngày Bắt Đầu', type: 'date' },
        { value: 'ngayKetThuc', label: 'Ngày Kết Thúc', type: 'date' },
        { value: 'soBuoi', label: 'Số Buổi', type: 'number' },
        { value: 'maMon', label: 'Mã Môn', type: 'number' }
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


    // --- Data Fetching Logic ---
    const fetchMonHocData = useCallback(async (currentSearchKeyword = '', page = 1, pageSize = pagination.pageSize) => {
        const token = localStorage.getItem('authToken');
        if (!token) { Swal.fire('Lỗi', 'Token không hợp lệ.', 'error').then(() => navigate('/login')); return; }
        setLoading(true);

        let apiUrl = 'https://localhost:8080/';
        const params = new URLSearchParams({ token });
        let isAdvancedSearch = false;

        if (currentSearchKeyword && currentSearchKeyword.includes(':')) {
            apiUrl += 'searchMonHocByAdmin';
            params.append('keyword', currentSearchKeyword);
            isAdvancedSearch = true;
        } else {
            apiUrl += 'DSMonHoc';
        }
        apiUrl += `?${params.toString()}`;

        try {
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401 || response.status === 403) throw new Error('Unauthorized or Forbidden');
            if (response.status === 204) { setMonHocData([]); setPagination(p => ({ ...p, total: 0, current: 1 })); setSelectedRowKeys([]); return; }
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
                results = Array.isArray(data.content) ? data.content : (Array.isArray(data) ? data : []);
                totalItems = typeof data.totalElements === 'number' ? data.totalElements : results.length;
            }
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginatedResults = (isAdvancedSearch || !data.content) ? results.slice(start, end) : results;
            const processedData = paginatedResults.map((item, index) => ({
                ...item, key: item.maMon, stt: (page - 1) * pageSize + index + 1,
                ngayBatDau: item.ngayBatDau ? dayjs.utc(item.ngayBatDau).local() : null,
                ngayKetThuc: item.ngayKetThuc ? dayjs.utc(item.ngayKetThuc).local() : null,
            }));
            setMonHocData(processedData);
            setPagination(p => ({ ...p, total: totalItems, current: page, pageSize: pageSize }));
            setSelectedRowKeys([]);
        } catch (error) {
            console.error("Fetch error:", error);
            if (error.message.includes('Unauthorized')) Swal.fire('Lỗi', 'Phiên hết hạn', 'error').then(() => navigate('/login'));
            else Swal.fire('Lỗi', `Không tải được dữ liệu: ${error.message}`, 'error');
            setMonHocData([]); setSelectedRowKeys([]);
        } finally { setLoading(false); }
    }, [navigate, pagination.pageSize]);

    const debouncedFetchData = useCallback(debounce(fetchMonHocData, 700), [fetchMonHocData]);

    // --- Effects for Initial Load and Search Trigger ---
    useEffect(() => {
        if (loaderData && !loaderData.error && Array.isArray(loaderData.data)) {
            const initialData = loaderData.data.map((item, index) => ({
                ...item, key: item.maMon, stt: index + 1,
                ngayBatDau: item.ngayBatDau ? dayjs.utc(item.ngayBatDau).local() : null,
                ngayKetThuc: item.ngayKetThuc ? dayjs.utc(item.ngayKetThuc).local() : null,
            }));
            setMonHocData(initialData);
            setPagination(p => ({ ...p, total: initialData.length, current: 1 }));
        } else if (loaderData?.error) {
            if (loaderData.type === 'auth') Swal.fire('Phiên Hết Hạn', loaderData.message, 'error').then(() => navigate('/login'));
            else Swal.fire('Lỗi Tải Dữ Liệu', loaderData.message || 'Không thể tải danh sách môn học.', 'error');
        } else {
            debouncedFetchData('', 1, pagination.pageSize);
        }
    }, [loaderData, navigate, debouncedFetchData, pagination.pageSize]);

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
        const isReset = apiQueryKeyword === '' && !searchFieldValue && !searchOperatorValue && !searchInput && !searchDateValue && !searchDateRangeValue[0];
        if (apiQueryKeyword || isReset) {
            debouncedFetchData(apiQueryKeyword, 1, pagination.pageSize);
        }
    }, [apiQueryKeyword, pagination.pageSize, debouncedFetchData, searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue]);

    // --- Search Handlers ---
    const handleClearSearch = useCallback(() => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchDateValue(null);
        setSearchDateRangeValue([null, null]);
        setApiQueryKeyword('');
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
            tenMon: record.tenMon,
            ngayBatDau: record.ngayBatDau ? dayjs(record.ngayBatDau) : null,
            ngayKetThuc: record.ngayKetThuc ? dayjs(record.ngayKetThuc) : null,
            soBuoi: record.soBuoi,
        });
        setEditingKey(record.key);
    }, [form]);

    const cancel = useCallback((key) => {
        const record = monHocData.find(item => item.key === key);
        if (record?.isNew) {
            setMonHocData(prev => {
                const updatedData = prev.filter(item => item.key !== key);
                return updatedData.map((item, idx) => ({...item, stt: (pagination.current -1) * pagination.pageSize + idx + 1}));
            });
            setPagination(prev => ({...prev, total: Math.max(0, prev.total -1)}));
        }
        setEditingKey('');
    }, [monHocData, pagination.current, pagination.pageSize]);

    const save = useCallback(async (key) => {
        try {
            const row = await form.validateFields();
            const itemToSave = monHocData.find(item => item.key === key);
            if (!itemToSave) throw new Error("Không tìm thấy mục để lưu.");
            const token = localStorage.getItem('authToken');
            if (!token) throw new Error("Token không hợp lệ.");

            const isNewRecord = itemToSave.isNew || !itemToSave.maMon;
            let apiUrl = 'https://localhost:8080/';
            const params = new URLSearchParams({ token });

            if (isNewRecord) {
                apiUrl += 'LuuMonHoc';
            } else {
                apiUrl += `CapNhatMonHoc`;
                params.append('maMon', String(itemToSave.maMon));
            }
            params.append('tenMon', row.tenMon || '');
            params.append('ngayBatDau', row.ngayBatDau ? dayjs(row.ngayBatDau).format('YYYY-MM-DD') : '');
            params.append('ngayKetThuc', row.ngayKetThuc ? dayjs(row.ngayKetThuc).format('YYYY-MM-DD') : '');
            params.append('soBuoi', String(row.soBuoi || 0));

            const method = isNewRecord ? 'POST' : 'PUT';
            const response = await fetch(`${apiUrl}?${params.toString()}`, { method, headers: { 'Authorization': `Bearer ${token}` } });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Lỗi server ${response.status}` }));
                throw new Error(errorData.message || `Lỗi ${isNewRecord ? 'lưu' : 'cập nhật'}`);
            }

            Swal.fire({ icon: 'success', title: 'Thành công!', text: `Đã ${isNewRecord ? 'lưu' : 'cập nhật'} môn học.` });
            debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
            setEditingKey('');
        } catch (errInfo) {
            console.error('Save/Validate Error:', errInfo);
            if (errInfo.errorFields) message.error('Dữ liệu không hợp lệ.');
            else Swal.fire({ icon: 'error', title: 'Thất bại!', text: errInfo.message || 'Lỗi không xác định.' });
        }
    }, [form, monHocData, debouncedFetchData, pagination, apiQueryKeyword]);

    const handleDelete = useCallback((recordKey) => {
        const recordToDelete = monHocData.find(item => item.key === recordKey);
        if (!recordToDelete) return;
        if (recordToDelete.isNew) {
            cancel(recordKey);
            return;
        }
        if (!recordToDelete.maMon) { message.error("Không thể xóa môn học không có Mã Môn."); return; }

        Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?', text: `Môn học: ${recordToDelete.tenMon || '(Chưa có tên)'}`, icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa!', cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const token = localStorage.getItem('authToken');
                if (!token) { message.error("Token không hợp lệ"); return; }
                setLoading(true);
                const apiUrl = new URL(`https://localhost:8080/XoaMonHoc/${recordToDelete.maMon}`);
                apiUrl.searchParams.append('token', token);
                try {
                    const response = await fetch(apiUrl.toString(), { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    const resData = await response.json().catch(() => ({ message: response.statusText }));
                    if (!response.ok) throw new Error(resData.message || 'Lỗi xóa môn học');
                    Swal.fire('Đã xóa!', resData.message || 'Môn học đã được xóa.', 'success');
                    debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
                } catch (error) { Swal.fire('Lỗi!', `Xóa thất bại: ${error.message}`, 'error'); }
                finally { setLoading(false); }
            }
        });
    }, [monHocData, debouncedFetchData, pagination, apiQueryKeyword, cancel]);

    const handleDeleteSelected = useCallback(() => {
        if (selectedRowKeys.length === 0) { message.warn("Vui lòng chọn ít nhất một môn học để xóa."); return; }
        const maMonToDelete = selectedRowKeys.filter(key => monHocData.find(mh => mh.key === key)?.maMon);

        if (maMonToDelete.length === 0) { message.info("Không có môn học hợp lệ (đã lưu) được chọn để xóa."); return; }

        Swal.fire({
            title: `Bạn chắc chắn muốn xóa ${maMonToDelete.length} môn học đã chọn?`, text: "Hành động này không thể hoàn tác!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa!', cancelButtonText: 'Hủy'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const token = localStorage.getItem('authToken');
                if (!token) { message.error("Token không hợp lệ"); return; }
                setLoading(true);
                const params = new URLSearchParams({ token });
                maMonToDelete.forEach(maMon => params.append('maMonList', maMon.toString()));
                const apiUrl = `https://localhost:8080/XoaNhieuMonHoc?${params.toString()}`;
                try {
                    const response = await fetch(apiUrl, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    const resData = await response.json().catch(() => ({ message: response.statusText }));
                    if (!response.ok) throw new Error(resData.message || 'Lỗi xóa nhiều môn học');
                    Swal.fire('Đã xóa!', resData.message || `${maMonToDelete.length} môn học đã được xóa.`, 'success');
                    debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
                } catch (error) { Swal.fire('Lỗi!', `Xóa thất bại: ${error.message}`, 'error'); }
                finally { setLoading(false); }
            }
        });
    }, [selectedRowKeys, monHocData, debouncedFetchData, pagination, apiQueryKeyword]);

    const handleAddBelow = useCallback((currentRowKey) => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const currentIndex = monHocData.findIndex(item => item.key === currentRowKey);
        const baseSTT = monHocData[currentIndex]?.stt || ((pagination.current - 1) * pagination.pageSize + monHocData.length);
        const newRecord = { key: newKey, maMon: null, tenMon: '', ngayBatDau: null, ngayKetThuc: null, soBuoi: null, isNew: true, stt: baseSTT + 1 };

        setMonHocData(prev => {
            let newData = [...prev];
            newData.splice(currentIndex + 1, 0, newRecord);
            return newData.map((item, idx) => ({ ...item, stt: (pagination.current - 1) * pagination.pageSize + idx + 1 }));
        });
        setPagination(prev => ({...prev, total: prev.total + 1}));
        edit(newRecord);
    }, [editingKey, monHocData, pagination.current, pagination.pageSize, edit]);

    const handleGlobalAddNew = useCallback(() => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const newTotal = pagination.total + 1;
        const newRecord = { key: newKey, maMon: null, tenMon: '', ngayBatDau: null, ngayKetThuc: null, soBuoi: null, isNew: true, stt: newTotal };

        const newPageForItem = Math.ceil(newTotal / pagination.pageSize);

        if (newPageForItem > pagination.current) {
            setPagination(prev => ({ ...prev, current: newPageForItem, total: newTotal }));
            setMonHocData(prev => [...prev, newRecord]);
            setEditingKey(newKey);
        } else {
            setMonHocData(prev => {
                const newData = [...prev, newRecord];
                return newData.map((item, idx) => ({ ...item, stt: (pagination.current - 1) * pagination.pageSize + idx + 1 }));
            });
            setPagination(prev => ({ ...prev, total: newTotal }));
            edit(newRecord);
        }

        setTimeout(() => {
            if (tableRef.current) {
                const tableBody = tableRef.current.querySelector('.ant-table-body');
                if (tableBody) tableBody.scrollTop = tableBody.scrollHeight;
            }
        }, 200);
    }, [editingKey, pagination, tableRef, edit]);


    // --- Table & Row Selection Handlers ---
    const handleTableChange = useCallback((newPagination, filters, sorter) => {
        if (editingKey && (sorter.field || Object.keys(filters).length > 0)) {
            cancel(editingKey);
        }
        setSelectedRowKeys([]);
        fetchMonHocData(apiQueryKeyword, newPagination.current, newPagination.pageSize);
    }, [editingKey, cancel, fetchMonHocData, apiQueryKeyword]);

    const onSelectChange = useCallback((keys) => setSelectedRowKeys(keys), []);

    // --- Derived UI Flags ---
    const hasSelected = selectedRowKeys.length > 0;
    const showGlobalAddButton = pagination.current > 1 || monHocData.length >= pagination.pageSize || pagination.total > monHocData.length;


    // --- Return values to the component ---
    return {
        // Data and Loading States
        monHocData,
        loading,
        pagination,
        selectedRowKeys,

        // Editing States & Functions
        editingKey,
        hoveredRowKey,
        setHoveredRowKey,
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
        searchOperatorsOptions, // Still needed for options list
        getFilteredOperators,
        selectedFieldType,
        operatorRequiresValue,
        isDateRangeOperator,
        isListOperator,

        // Table Control
        form,
        tableRef,
        handleTableChange,
        onSelectChange,

        // UI Helpers
        hasSelected,
        showGlobalAddButton,
    };
};

export default useMonHocManager;