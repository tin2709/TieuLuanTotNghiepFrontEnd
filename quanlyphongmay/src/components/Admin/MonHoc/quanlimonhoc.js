// src/pages/QuanLyMonHoc.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Table,
    Layout,
    Popover,
    Button as AntButton,
    Tooltip,
    DatePicker,
    Form,
    message,
    Select,
    Input,
    InputNumber,
    Row,
    Col,
    Space,
} from 'antd';
import {
    BookOutlined,
    SunOutlined,
    MoonOutlined,
    SearchOutlined,
    ClearOutlined,
    PlusCircleFilled,
    EditFilled,
    DeleteFilled,
    SaveOutlined,
    CloseCircleOutlined,
    PlusOutlined,
    DeleteOutlined as DeleteBulkOutlined,
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header, Content } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { useNavigate, useLoaderData } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(isBetween);
dayjs.locale('vi');

const { Option } = Select;
const { RangePicker } = DatePicker;

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
    useEffect(() => {
        if (isDarkMode) DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
        else DarkReader.disable();
    }, [isDarkMode]);
    return <AntButton icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />} onClick={toggleDarkMode} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }} />;
};

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const EditableCell = ({ editing, dataIndex, title, inputType, children, form, ...restProps }) => {
    let inputNode;
    if (inputType === 'number') {
        inputNode = <InputNumber style={{ width: '100%' }} />;
    } else if (inputType === 'date') {
        inputNode = <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />;
    } else {
        inputNode = <Input style={{ width: '100%' }} />;
    }
    const safeTitle = title || '';
    let rules = [{ required: true, message: `Vui lòng nhập ${safeTitle.toLowerCase()}!` }];
    if (dataIndex === 'soBuoi') rules.push({ type: 'number', min: 1, message: 'Số buổi phải lớn hơn 0' });
    if (dataIndex === 'ngayKetThuc') {
        rules.push(({ getFieldValue }) => ({
            validator(_, value) {
                const ngayBatDau = getFieldValue('ngayBatDau');
                if (!value || !ngayBatDau) return Promise.resolve();
                if (dayjs(value).isAfter(ngayBatDau)) return Promise.resolve();
                return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu!'));
            },
        }));
    }
    return (
        <td {...restProps}>
            {editing ? (
                <Form.Item name={dataIndex} style={{ margin: 0 }} rules={rules}>
                    {inputNode}
                </Form.Item>
            ) : (
                children
            )}
        </td>
    );
};

const QuanLyMonHoc = () => {
    const loaderData = useLoaderData();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [monHocData, setMonHocData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [editingKey, setEditingKey] = useState('');
    const [hoveredRowKey, setHoveredRowKey] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const tableRef = useRef(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchDateValue, setSearchDateValue] = useState(null);
    const [searchDateRangeValue, setSearchDateRangeValue] = useState([null, null]);
    const [apiQueryKeyword, setApiQueryKeyword] = useState('');

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

    // --- Derived state for UI rendering ---
    const selectedField = searchFieldsOptions.find(f => f.value === searchFieldValue);
    const selectedFieldType = selectedField?.type;
    const operatorRequiresValue = !['IS_NULL', 'IS_NOT_NULL'].includes(searchOperatorValue);
    const isDateRangeOperator = selectedFieldType === 'date' && ['BETWEEN', 'NOT_BETWEEN'].includes(searchOperatorValue);
    const isSingleDateOperator = selectedFieldType === 'date' && operatorRequiresValue && !isDateRangeOperator;
    const isListOperator = ['IN', 'NOT_IN'].includes(searchOperatorValue);

    const getFilteredOperators = useCallback(() => {
        if (!selectedField) return searchOperatorsOptions; // Show all if no field selected
        return searchOperatorsOptions.filter(op => op.types.includes(selectedField.type));
    }, [selectedField]);


    const ValueInputComponent = (() => {
        // If an operator is chosen that doesn't need a value, show disabled input
        if (searchOperatorValue && !operatorRequiresValue) {
            return () => <Input disabled placeholder="Không cần giá trị" />;
        }
        // Determine input based on selected field type (if a field is selected)
        if (selectedFieldType === 'date') {
            return isDateRangeOperator ? RangePicker : DatePicker;
        }
        if (selectedFieldType === 'number' && !isListOperator) {
            return InputNumber;
        }
        return Input; // Default for text, lists, or if field type is not yet determined
    })();


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

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedFetchData = useCallback(debounce(fetchMonHocData, 700), [fetchMonHocData]);

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
            // Fetch initial data if no loader data or loader error
            debouncedFetchData('', 1, pagination.pageSize);
        }
    }, [loaderData, navigate, debouncedFetchData, pagination.pageSize]);


    // Effect to construct and set the API query keyword
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
                    } else { // Single date
                        if (searchDateValue && dayjs.isDayjs(searchDateValue) && searchDateValue.isValid()) {
                            valueForApi = searchDateValue.format('YYYY-MM-DD');
                            isValueValidAndProvided = true;
                        }
                    }
                } else { // Text or Number
                    const trimmedInput = String(searchInput).trim();
                    if (trimmedInput !== '') {
                        if (selectedFieldType === 'number' && !isListOperator && isNaN(Number(trimmedInput))) {
                            // Invalid number for a non-list number field
                            isValueValidAndProvided = false;
                        } else {
                            valueForApi = trimmedInput;
                            isValueValidAndProvided = true;
                        }
                    }
                }
            } else { // Operator does not require a value (IS_NULL, IS_NOT_NULL)
                isValueValidAndProvided = true; // Considered valid as no value is needed
                valueForApi = ''; // API expects an empty string for the value part
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

    // Effect to trigger data fetching when apiQueryKeyword or pageSize changes
    useEffect(() => {
        // Only fetch if apiQueryKeyword is non-empty (meaning a valid criterion is formed)
        // or if it's an intentional reset (empty string).
        // This prevents fetching with partially formed keywords.
        if (apiQueryKeyword || (apiQueryKeyword === '' && !searchFieldValue && !searchOperatorValue && !searchInput && !searchDateValue && !searchDateRangeValue[0])) {
            debouncedFetchData(apiQueryKeyword, 1, pagination.pageSize);
        }
    }, [apiQueryKeyword, pagination.pageSize, debouncedFetchData, searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue]);


    const handleClearSearch = () => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchDateValue(null);
        setSearchDateRangeValue([null, null]);
        // This will cause apiQueryKeyword to become '' in the useEffect, triggering a fetch for all data.
    };

    // --- Handler for Attribute Select ---
    const handleFieldChange = (value) => {
        setSearchFieldValue(value);
        // No automatic clearing of operator or value, user can change them independently
    };

    // --- Handler for Operator Select ---
    const handleOperatorChange = (value) => {
        setSearchOperatorValue(value);
        // No automatic clearing of value, user can change it independently
        // However, if new op doesn't need a value, we can clear the value inputs
        if (value && !['IS_NULL', 'IS_NOT_NULL'].includes(value)) {
            // Operator requires a value, do nothing to existing value inputs
        } else {
            // Operator is IS_NULL/IS_NOT_NULL or operator is cleared, clear value inputs
            setSearchInput('');
            setSearchDateValue(null);
            setSearchDateRangeValue([null, null]);
        }
    };

    // --- Handler for Value Input ---
    const handleValueChange = (val) => {
        if (selectedFieldType === 'date') {
            if (isDateRangeOperator) {
                setSearchDateRangeValue(val || [null, null]);
            } else {
                setSearchDateValue(val);
            }
        } else { // Text or Number
            const inputValue = (typeof val === 'number' || typeof val === 'string') ? String(val) : (val?.target?.value ?? '');
            setSearchInput(inputValue);
        }
    };


    const isEditing = (record) => record && record.key === editingKey;
    const edit = (record) => {
        if (!record) return;
        form.setFieldsValue({
            tenMon: record.tenMon,
            ngayBatDau: record.ngayBatDau ? dayjs(record.ngayBatDau) : null,
            ngayKetThuc: record.ngayKetThuc ? dayjs(record.ngayKetThuc) : null,
            soBuoi: record.soBuoi,
        });
        setEditingKey(record.key);
    };
    const cancel = (key) => {
        const record = monHocData.find(item => item.key === key);
        if (record?.isNew) {
            setMonHocData(prev => prev.filter(item => item.key !== key).map((item, idx) => ({...item, stt: (pagination.current -1) * pagination.pageSize + idx + 1})));
            setPagination(prev => ({...prev, total: Math.max(0, prev.total -1)}));
        }
        setEditingKey('');
    };
    const save = async (key) => {
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
                params.append('tenMon', row.tenMon || '');
                params.append('ngayBatDau', row.ngayBatDau ? dayjs(row.ngayBatDau).format('YYYY-MM-DD') : '');
                params.append('ngayKetThuc', row.ngayKetThuc ? dayjs(row.ngayKetThuc).format('YYYY-MM-DD') : '');
                params.append('soBuoi', String(row.soBuoi || 0));
            } else {
                apiUrl += `CapNhatMonHoc`;
                params.append('maMon', String(itemToSave.maMon));
                params.append('tenMon', row.tenMon || '');
                params.append('ngayBatDau', row.ngayBatDau ? dayjs(row.ngayBatDau).format('YYYY-MM-DD') : '');
                params.append('ngayKetThuc', row.ngayKetThuc ? dayjs(row.ngayKetThuc).format('YYYY-MM-DD') : '');
                params.append('soBuoi', String(row.soBuoi || 0));
            }
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
    };
    const handleDelete = (recordKey) => {
        const recordToDelete = monHocData.find(item => item.key === recordKey);
        if (!recordToDelete) return;
        if (recordToDelete.isNew) { cancel(recordKey); return; }
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
    };
    const handleDeleteSelected = () => {
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
    };
    const handleAddBelow = (currentRowKey) => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const currentIndex = monHocData.findIndex(item => item.key === currentRowKey);
        const baseSTT = monHocData[currentIndex]?.stt || ((pagination.current - 1) * pagination.pageSize + monHocData.length);
        const newRecord = { key: newKey, maMon: null, tenMon: '', ngayBatDau: null, ngayKetThuc: null, soBuoi: null, isNew: true, stt: baseSTT + 1 };
        let newData = [...monHocData];
        newData.splice(currentIndex + 1, 0, newRecord);
        newData = newData.map((item, idx) => ({ ...item, stt: (pagination.current -1) * pagination.pageSize + idx + 1 }));
        setMonHocData(newData);
        setPagination(prev => ({...prev, total: prev.total + 1}));
        edit(newRecord);
    };
    const handleGlobalAddNew = () => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const newSTT = pagination.total + 1;
        const newRecord = { key: newKey, maMon: null, tenMon: '', ngayBatDau: null, ngayKetThuc: null, soBuoi: null, isNew: true, stt: newSTT };
        const newTotal = pagination.total + 1;
        const newPageForItem = Math.ceil(newTotal / pagination.pageSize);
        if (newPageForItem > pagination.current && monHocData.length >= pagination.pageSize) {
            setPagination(prev => ({ ...prev, current: newPageForItem, total: newTotal }));
            setMonHocData(prev => [...prev, newRecord]);
            setEditingKey(newKey);
        } else {
            const newData = [...monHocData, newRecord].map((item, idx) => ({ ...item, stt: (pagination.current - 1) * pagination.pageSize + idx + 1, }));
            setMonHocData(newData);
            setPagination(prev => ({ ...prev, total: newTotal }));
            edit(newRecord);
        }
        setTimeout(() => {
            if (tableRef.current) {
                const tableBody = tableRef.current.querySelector('.ant-table-body');
                if (tableBody) tableBody.scrollTop = tableBody.scrollHeight;
            }
        }, 200);
    };
    const handleTableChange = (newPagination, filters, sorter) => {
        if (editingKey && (sorter.field || Object.keys(filters).length > 0)) cancel(editingKey);
        setSelectedRowKeys([]);
        fetchMonHocData(apiQueryKeyword, newPagination.current, newPagination.pageSize);
    };
    const columns = [
        {
            title: 'STT', dataIndex: 'stt', key: 'stt', width: 80, align: 'center',
            render: (text, record) => {
                const editableRow = isEditing(record);
                if (editableRow) {
                    return (
                        <Space style={{ justifyContent: 'center', width: '100%' }}>
                            <Tooltip title="Lưu"><AntButton type="link" shape="circle" icon={<SaveOutlined style={{color: 'green'}}/>} onClick={() => save(record.key)} /></Tooltip>
                            <Tooltip title="Hủy"><AntButton type="link" shape="circle" icon={<CloseCircleOutlined style={{color: 'red'}}/>} onClick={() => cancel(record.key)} /></Tooltip>
                        </Space>
                    );
                }
                if (hoveredRowKey === record.key) {
                    return (
                        <Space style={{ justifyContent: 'center', width: '100%', position: 'relative', bottom: '-8px' }}>
                            <Tooltip title="Thêm dòng mới bên dưới"><PlusCircleFilled style={{ color: '#1890ff', cursor: 'pointer', fontSize: '16px' }} onClick={() => handleAddBelow(record.key)} /></Tooltip>
                            <Tooltip title="Sửa dòng này"><EditFilled style={{ color: '#faad14', cursor: 'pointer', fontSize: '16px' }} onClick={() => edit(record)} /></Tooltip>
                            <Tooltip title="Xóa dòng này"><DeleteFilled style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: '16px' }} onClick={() => handleDelete(record.key)} /></Tooltip>
                        </Space>
                    );
                }
                return text;
            }
        },
        { title: 'Mã Môn', dataIndex: 'maMon', key: 'maMon', width: 100, editable: (record) => record?.isNew, render: (text) => text || '(Tự động)' },
        { title: 'Tên Môn', dataIndex: 'tenMon', key: 'tenMon', width: 250, editable: true },
        { title: 'Ngày Bắt Đầu', dataIndex: 'ngayBatDau', key: 'ngayBatDau', width: 150, editable: true, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Ngày Kết Thúc', dataIndex: 'ngayKetThuc', key: 'ngayKetThuc', width: 150, editable: true, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Số Buổi', dataIndex: 'soBuoi', key: 'soBuoi', width: 100, align: 'center', editable: true },
    ];
    const mergedColumns = columns.map((col) => {
        if (col.key === 'stt') return col;
        const isActuallyEditable = (record) => typeof col.editable === 'function' ? (record ? col.editable(record) : false) : !!col.editable;
        if (!isActuallyEditable(undefined)) return col;
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'soBuoi' || (col.dataIndex === 'maMon' && record.isNew) ? 'number' : (col.dataIndex === 'ngayBatDau' || col.dataIndex === 'ngayKetThuc' ? 'date' : 'text'),
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isActuallyEditable(record) && isEditing(record),
                form: form,
            }),
        };
    });
    const onSelectChange = (keys) => setSelectedRowKeys(keys);
    const rowSelection = { selectedRowKeys, onChange: onSelectChange, getCheckboxProps: (record) => ({ disabled: record.isNew }) };
    const hasSelected = selectedRowKeys.length > 0;
    const showGlobalAddButton = pagination.current > 1 || monHocData.length >= pagination.pageSize || pagination.total > monHocData.length;

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout>
                <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                        <Popover content={<div>Quản lý danh sách các môn học</div>} trigger="hover"><BookOutlined style={{ marginRight: 8, cursor: 'pointer' }} /></Popover>
                        Quản Lý Môn Học
                    </div>
                    <Space>
                        {showGlobalAddButton && (<AntButton type="primary" icon={<PlusOutlined />} onClick={handleGlobalAddNew}>Tạo mới</AntButton>)}
                        <DarkModeToggle />
                    </Space>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360, borderRadius: '8px' }}>
                        <Row gutter={[16, 16]} style={{ marginBottom: 24 }} align="bottom">
                            <Col xs={24} sm={18} md={9} lg={8} xl={8}>
                                <Form.Item label="Giá trị tìm kiếm" style={{ marginBottom: 0 }}>
                                    <ValueInputComponent
                                        style={{ width: '100%' }}
                                        placeholder={
                                            selectedFieldType === 'date' ? (isDateRangeOperator ? "Từ ngày - Đến ngày" : "Chọn ngày") :
                                                (isListOperator ? "Giá trị 1,Giá trị 2,..." : "Nhập giá trị...")
                                        }
                                        value={
                                            selectedFieldType === 'date' ? (isDateRangeOperator ? searchDateRangeValue : searchDateValue) : searchInput
                                        }
                                        onChange={handleValueChange} // Independent change
                                        disabled={searchOperatorValue && !operatorRequiresValue} // Only disable if op explicitly doesn't need value
                                        allowClear={ValueInputComponent !== RangePicker && (selectedFieldType !== 'number' || isListOperator)}
                                        format={selectedFieldType === 'date' && !isDateRangeOperator ? "DD/MM/YYYY" : undefined}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                                <Form.Item label="Thuộc tính" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn thuộc tính"
                                        value={searchFieldValue}
                                        onChange={handleFieldChange} // Independent change
                                        style={{ width: '100%' }}
                                        allowClear
                                    >
                                        {searchFieldsOptions.map(item => (<Option key={item.value} value={item.value}>{item.label}</Option>))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                                <Form.Item label="Phép toán" style={{ marginBottom: 0 }}>
                                    <Select
                                        placeholder="Chọn phép toán"
                                        value={searchOperatorValue}
                                        onChange={handleOperatorChange} // Independent change
                                        style={{ width: '100%' }}
                                        disabled={!searchFieldValue} // Still makes sense to disable if no field context
                                        allowClear
                                    >
                                        {getFilteredOperators().map(item => (<Option key={item.value} value={item.value}>{item.label}</Option>))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} sm={6} md={3} lg={2} xl={2}> {/* Adjusted width for the button */}
                                <AntButton icon={<ClearOutlined />} onClick={handleClearSearch} style={{ width: '100%' }} danger>
                                    Xóa lọc
                                </AntButton>
                            </Col>
                        </Row>

                        <Form form={form} component={false}>
                            <div ref={tableRef}>
                                <Table
                                    rowSelection={rowSelection}
                                    components={{ body: { cell: EditableCell } }}
                                    bordered
                                    dataSource={monHocData}
                                    columns={mergedColumns}
                                    rowKey="key"
                                    rowClassName={(record) => `editable-row ${hoveredRowKey === record.key && !isEditing(record) ? 'row-hover-actions' : ''}`}
                                    loading={loading}
                                    pagination={{ ...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} mục`}}
                                    onChange={handleTableChange}
                                    scroll={{ x: 1000 }}
                                    size="small"
                                    onRow={(record) => ({
                                        onMouseEnter: () => { if (!editingKey) setHoveredRowKey(record.key); },
                                        onMouseLeave: () => { if (!editingKey) setHoveredRowKey(''); }
                                    })}
                                />
                            </div>
                        </Form>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {!showGlobalAddButton && monHocData.length < pagination.pageSize && monHocData.length > 0 && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Môn Học</AntButton>
                            )}
                            {monHocData.length === 0 && !loading && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Môn Học đầu tiên</AntButton>
                            )}
                            {hasSelected && (
                                <AntButton type="danger" icon={<DeleteBulkOutlined />} onClick={handleDeleteSelected} style={{ width: '100%' }} disabled={loading}>
                                    Xóa {selectedRowKeys.length} dòng đã chọn
                                </AntButton>
                            )}
                        </div>
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};
export default QuanLyMonHoc;