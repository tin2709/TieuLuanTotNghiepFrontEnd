// src/pages/QuanLyCaThucHanh.js
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
    CalendarOutlined,
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
import { useNavigate, useLoaderData } from "react-router-dom"; // useLoaderData is key
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

const EditableCell = ({ editing, dataIndex, title, inputType, children, form, options = [], ...restProps }) => {
    let inputNode;
    const safeTitle = title || '';
    let rules = [{ required: true, message: `Vui lòng nhập ${safeTitle.toLowerCase()}!` }];

    if (inputType === 'number') {
        inputNode = <InputNumber style={{ width: '100%' }} min={ (dataIndex === 'tietBatDau' || dataIndex === 'tietKetThuc' || dataIndex === 'buoiSo') ? 1 : undefined } />;
        if (dataIndex === 'tietBatDau' || dataIndex === 'tietKetThuc' || dataIndex === 'buoiSo') {
            rules.push({ type: 'integer', min: 1, message: `${safeTitle} phải là số nguyên dương!` });
        }
    } else if (inputType === 'date') {
        inputNode = <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />;
    } else if (inputType === 'select') {
        inputNode = (
            <Select
                style={{ width: '100%' }}
                placeholder={`Chọn ${safeTitle.toLowerCase()}`}
                options={options}
                showSearch
                filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
            />
        );
    } else { // text
        inputNode = <Input style={{ width: '100%' }} />;
    }

    if (dataIndex === 'tietKetThuc') {
        rules.push(({ getFieldValue }) => ({
            validator(_, value) {
                const tietBatDau = getFieldValue('tietBatDau');
                if (!value || !tietBatDau || tietBatDau === '') return Promise.resolve();
                if (parseInt(value, 10) > parseInt(tietBatDau, 10)) return Promise.resolve();
                return Promise.reject(new Error('Tiết kết thúc phải sau tiết bắt đầu!'));
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


const QuanLyCaThucHanh = () => {
    const loaderData = useLoaderData(); // Get data from the loader
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [caThucHanhData, setCaThucHanhData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [editingKey, setEditingKey] = useState('');
    const [hoveredRowKey, setHoveredRowKey] = useState('');
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    const tableRef = useRef(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);

    const [giaoVienOptions, setGiaoVienOptions] = useState([]);
    const [phongMayOptions, setPhongMayOptions] = useState([]);
    const [monHocOptions, setMonHocOptions] = useState([]);

    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchDateValue, setSearchDateValue] = useState(null);
    const [searchDateRangeValue, setSearchDateRangeValue] = useState([null, null]);
    const [apiQueryKeyword, setApiQueryKeyword] = useState('');

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

    const selectedField = searchFieldsOptions.find(f => f.value === searchFieldValue);
    const selectedFieldType = selectedField?.type;
    const operatorRequiresValue = !['IS_NULL', 'IS_NOT_NULL'].includes(searchOperatorValue);
    const isDateRangeOperator = selectedFieldType === 'date' && ['BETWEEN', 'NOT_BETWEEN'].includes(searchOperatorValue);
    const isSingleDateOperator = selectedFieldType === 'date' && operatorRequiresValue && !isDateRangeOperator;
    const isListOperator = ['IN', 'NOT_IN'].includes(searchOperatorValue);

    const getFilteredOperators = useCallback(() => {
        if (!selectedField) return searchOperatorsOptions;
        return searchOperatorsOptions.filter(op => op.types.includes(selectedField.type));
    }, [selectedField]);

    const ValueInputComponent = (() => {
        if (searchOperatorValue && !operatorRequiresValue) {
            return () => <Input disabled placeholder="Không cần giá trị" />;
        }
        if (selectedFieldType === 'date') {
            return isDateRangeOperator ? RangePicker : DatePicker;
        }
        if (selectedFieldType === 'number' && !isListOperator) {
            return InputNumber;
        }
        return Input;
    })();

    // Fetch GiaoVien, PhongMay, MonHoc for dropdowns (logging remains for debugging)
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error("Token not found, cannot fetch options.");
            return;
        }
        // console.log("Using token to fetch options:", token); // Less verbose now

        const fetchGenericOptions = async (url, setter, valueField, labelField, entityName) => {
            // console.log(`Fetching ${entityName} from ${url}?token=${token}`);
            try {
                const response = await fetch(`${url}?token=${token}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                // console.log(`Response status for ${entityName}: ${response.status}`);
                const responseText = await response.text();
                // console.log(`Raw response text for ${entityName}:`, responseText);

                if (response.status === 401 || response.status === 403) {
                    console.error(`Unauthorized or Forbidden (status ${response.status}) to fetch ${entityName}.`);
                    setter([]);
                    return;
                }
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status} fetching ${entityName}: ${responseText}`);
                }
                if (response.status === 204 || responseText.trim() === '') {
                    // console.log(`${entityName} response is empty or No Content.`);
                    setter([]);
                    return;
                }
                let data;
                try {
                    data = JSON.parse(responseText);
                    // console.log(`Parsed JSON data for ${entityName}:`, data);
                } catch (parseError) {
                    console.error(`Error parsing JSON for ${entityName}:`, parseError, "Raw text was:", responseText);
                    throw new Error(`Invalid JSON response for ${entityName}`);
                }
                const list = Array.isArray(data) ? data : (Array.isArray(data.content) ? data.content : []);
                // console.log(`List to process for ${entityName}:`, list);
                if (!Array.isArray(list)) {
                    console.error(`Expected an array for ${entityName}, but got:`, typeof list, list);
                    setter([]); return;
                }
                const mappedData = list.map(item => {
                    if (typeof item !== 'object' || item === null || !(valueField in item) || !(labelField in item)) {
                        // console.warn(`Skipping invalid item in ${entityName} list:`, item);
                        return null;
                    }
                    return { value: item[valueField], label: item[labelField] };
                }).filter(Boolean);
                // console.log(`Mapped data for ${entityName} Select:`, mappedData);
                setter(mappedData);
            } catch (error) {
                console.error(`ERROR fetching or processing ${entityName}:`, error.message);
                setter([]);
            }
        };
        fetchGenericOptions('https://localhost:8080/DSGiaoVien', setGiaoVienOptions, 'maGiaoVien', 'hoTen', 'Giáo Viên');
        fetchGenericOptions('https://localhost:8080/DSPhongMay', setPhongMayOptions, 'maPhong', 'tenPhong', 'Phòng Máy');
        fetchGenericOptions('https://localhost:8080/DSMonHoc', setMonHocOptions, 'maMon', 'tenMon', 'Môn Học');
    }, [navigate]); // navigate might be used in more robust error handling later

    // useEffect(() => { console.log("GiaoVien Options State:", giaoVienOptions); }, [giaoVienOptions]);
    // useEffect(() => { console.log("PhongMay Options State:", phongMayOptions); }, [phongMayOptions]);
    // useEffect(() => { console.log("MonHoc Options State:", monHocOptions); }, [monHocOptions]);


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
            } else { // DSCaThucHanh might return a plain array
                results = Array.isArray(data) ? data : [];
                totalItems = results.length;
            }

            // Client-side pagination for DSCaThucHanh if not paginated by backend
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginatedResults = results.slice(start, end);

            const processedData = paginatedResults.map((item, index) => ({
                ...item,
                key: item.maCa,
                stt: (page - 1) * pageSize + index + 1,
                ngayThucHanh: item.ngayThucHanh ? dayjs.utc(item.ngayThucHanh).local() : null,
                maGiaoVien: item.giaoVien?.maGiaoVien,
                maPhong: item.phongMay?.maPhong,
                maMon: item.monHoc?.maMon,
            }));
            setCaThucHanhData(processedData);
            setPagination(p => ({ ...p, total: totalItems, current: page, pageSize: pageSize }));
            setSelectedRowKeys([]);
        } catch (error) {
            console.error("Fetch CaThucHanh error:", error);
            if (error.message.includes('Unauthorized')) Swal.fire('Lỗi', 'Phiên hết hạn hoặc không có quyền.', 'error').then(() => navigate('/login'));
            else Swal.fire('Lỗi', `Không tải được dữ liệu Ca Thực Hành: ${error.message}`, 'error');
            setCaThucHanhData([]); setSelectedRowKeys([]);
        } finally { setLoading(false); }
    }, [navigate, pagination.pageSize]);

    const debouncedFetchData = useCallback(debounce(fetchCaThucHanhData, 700), [fetchCaThucHanhData]);

    // --- INTEGRATE LOADER DATA ---
    useEffect(() => {
        console.log("⚡️ [Component] Received loaderData:", loaderData);
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
            // Client-side pagination for initial load if loader returns full list
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
            // Fallback if loaderData is undefined or not in expected format, though ideally loader handles this.
            // This might still be needed if the route can be accessed without the loader (e.g. direct navigation after initial load).
            console.warn("[Component] loaderData is not in expected format or missing, attempting initial fetch via debouncedFetchData.");
            debouncedFetchData('', 1, pagination.pageSize);
        }
    }, [loaderData, navigate, pagination.pageSize, debouncedFetchData]); // Added debouncedFetchData


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
    }, [searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue, selectedFieldType, operatorRequiresValue, isDateRangeOperator, isListOperator, apiQueryKeyword]);

    // This effect triggers fetches when search keyword or page size changes
    // It should NOT run on initial mount if loaderData is providing the data.
    // The previous useEffect handles initial data from loaderData.
    useEffect(() => {
        // Condition to prevent fetching if loader already provided data and apiQuery is still empty (initial state)
        // Only fetch if apiQueryKeyword changes from its initial empty state, or if it becomes empty due to clearing search.
        const isInitialLoadWithNoSearch = apiQueryKeyword === '' && !searchFieldValue && !searchOperatorValue && !searchInput && !searchDateValue && !searchDateRangeValue[0];

        if (!isInitialLoadWithNoSearch || (isInitialLoadWithNoSearch && !loaderData?.data)) { // if loader didn't provide data, or if search is actively cleared
            debouncedFetchData(apiQueryKeyword, 1, pagination.pageSize);
        }
    }, [apiQueryKeyword, pagination.pageSize, debouncedFetchData, searchFieldValue, searchOperatorValue, searchInput, searchDateValue, searchDateRangeValue, loaderData]);


    const handleClearSearch = () => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchDateValue(null);
        setSearchDateRangeValue([null, null]);
        // setApiQueryKeyword(''); // This will be handled by the useEffect above
    };
    const handleFieldChange = (value) => setSearchFieldValue(value);
    const handleOperatorChange = (value) => {
        setSearchOperatorValue(value);
        if (value && !['IS_NULL', 'IS_NOT_NULL'].includes(value)) { /* Do nothing */ }
        else { setSearchInput(''); setSearchDateValue(null); setSearchDateRangeValue([null, null]); }
    };
    const handleValueChange = (val) => {
        if (selectedFieldType === 'date') {
            if (isDateRangeOperator) setSearchDateRangeValue(val || [null, null]);
            else setSearchDateValue(val);
        } else {
            const inputValue = (typeof val === 'number' || typeof val === 'string') ? String(val) : (val?.target?.value ?? '');
            setSearchInput(inputValue);
        }
    };

    const isEditing = (record) => record && record.key === editingKey;
    const edit = (record) => {
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
    };
    const cancel = (key) => {
        const record = caThucHanhData.find(item => item.key === key);
        if (record?.isNew) {
            setCaThucHanhData(prev => prev.filter(item => item.key !== key).map((item, idx) => ({...item, stt: (pagination.current -1) * pagination.pageSize + idx + 1})));
            setPagination(prev => ({...prev, total: Math.max(0, prev.total -1)}));
        }
        setEditingKey('');
    };
    const save = async (key) => {
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
            // Fetch current page data after save
            debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
            setEditingKey('');
        } catch (errInfo) {
            console.error('Save/Validate Error:', errInfo);
            if (errInfo.errorFields) message.error('Dữ liệu không hợp lệ.');
            else Swal.fire({ icon: 'error', title: 'Thất bại!', text: errInfo.message || 'Lỗi không xác định.' });
        }
    };
    const handleDelete = (recordKey) => {
        const recordToDelete = caThucHanhData.find(item => item.key === recordKey);
        if (!recordToDelete) return;
        if (recordToDelete.isNew) { cancel(recordKey); return; }
        if (!recordToDelete.maCa) { message.error("Không thể xóa ca thực hành không có Mã Ca."); return; }
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
                    // Fetch current page data after delete
                    debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
                } catch (error) { Swal.fire('Lỗi!', `Xóa thất bại: ${error.message}`, 'error'); }
                finally { setLoading(false); }
            }
        });
    };
    const handleDeleteSelected = () => {
        if (selectedRowKeys.length === 0) { message.warn("Vui lòng chọn ít nhất một ca thực hành để xóa."); return; }
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
                    // Fetch current page data after bulk delete
                    debouncedFetchData(apiQueryKeyword, pagination.current, pagination.pageSize);
                } catch (error) { Swal.fire('Lỗi!', `Xóa thất bại: ${error.message}`, 'error'); }
                finally { setLoading(false); }
            }
        });
    };
    const handleAddBelow = (currentRowKey) => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const currentIndex = caThucHanhData.findIndex(item => item.key === currentRowKey);
        const baseSTT = caThucHanhData[currentIndex]?.stt || ((pagination.current - 1) * pagination.pageSize + caThucHanhData.length);
        const newRecord = { key: newKey, maCa: null, tenCa: '', ngayThucHanh: dayjs(), tietBatDau: 1, tietKetThuc: 2, buoiSo: 1, maGiaoVien: null, maPhong: null, maMon: null, isNew: true, stt: baseSTT + 1 };
        let newData = [...caThucHanhData];
        newData.splice(currentIndex + 1, 0, newRecord);
        newData = newData.map((item, idx) => ({ ...item, stt: (pagination.current -1) * pagination.pageSize + idx + 1 }));
        setCaThucHanhData(newData);
        setPagination(prev => ({...prev, total: prev.total + 1}));
        edit(newRecord);
    };
    const handleGlobalAddNew = () => {
        if (editingKey) { message.warn('Vui lòng lưu hoặc hủy dòng đang sửa.'); return; }
        const newKey = `new-${Date.now()}`;
        const newSTT = pagination.total + 1; // This should be based on the true total
        const newRecord = { key: newKey, maCa: null, tenCa: '', ngayThucHanh: dayjs(), tietBatDau: 1, tietKetThuc: 2, buoiSo: 1, maGiaoVien: null, maPhong: null, maMon: null, isNew: true, stt: newSTT };

        // Determine if adding this item requires moving to a new page
        const newTotalAfterAdd = pagination.total + 1;
        const newPageForItem = Math.ceil(newTotalAfterAdd / pagination.pageSize);

        if (newPageForItem > pagination.current && caThucHanhData.length >= pagination.pageSize) {
            // New item goes to a new page, fetch that page and then add the new record UI
            // For simplicity, we'll just go to the new page and let the user add there or add to current data then navigate
            // Or better, add to data, then set editing, then update pagination.
            // This case requires careful handling of pagination vs local data array.
            // For now, let's simplify and add to current view if possible, or tell user.
            const newData = [...caThucHanhData, newRecord].map((item, idx) => ({
                ...item,
                stt: (pagination.current - 1) * pagination.pageSize + idx + 1,
            }));
            setCaThucHanhData(newData);
            setPagination(prev => ({ ...prev, total: newTotalAfterAdd, current: newPageForItem })); // Go to new page
        } else {
            // Add to current page's data
            const newData = [...caThucHanhData, newRecord].map((item, idx) => ({
                ...item,
                stt: (pagination.current - 1) * pagination.pageSize + idx + 1,
            }));
            setCaThucHanhData(newData);
            setPagination(prev => ({ ...prev, total: newTotalAfterAdd }));
        }
        edit(newRecord); // Set editing for the new record
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
        // When table changes (pagination, sorting, filtering by AntD table),
        // we fetch data for that specific page and size.
        // The apiQueryKeyword (from advanced search) should be maintained.
        fetchCaThucHanhData(apiQueryKeyword, newPagination.current, newPagination.pageSize);
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
        { title: 'Mã Ca', dataIndex: 'maCa', key: 'maCa', width: 100, render: (text) => text || '(Tự động)' },
        { title: 'Tên Ca', dataIndex: 'tenCa', key: 'tenCa', width: 180, editable: true },
        { title: 'Ngày Thực Hành', dataIndex: 'ngayThucHanh', key: 'ngayThucHanh', width: 130, editable: true, render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : 'N/A' },
        { title: 'Tiết BĐ', dataIndex: 'tietBatDau', key: 'tietBatDau', width: 90, align: 'center', editable: true },
        { title: 'Tiết KT', dataIndex: 'tietKetThuc', key: 'tietKetThuc', width: 90, align: 'center', editable: true },
        { title: 'Buổi Số', dataIndex: 'buoiSo', key: 'buoiSo', width: 90, align: 'center', editable: true },
        {
            title: 'Giáo Viên', dataIndex: 'maGiaoVien', key: 'maGiaoVien', width: 200, editable: true,
            render: (text, record) => {
                const selectedOption = giaoVienOptions.find(opt => opt.value === text);
                return selectedOption ? selectedOption.label : (record.giaoVien?.hoTen || text || 'N/A');
            }
        },
        {
            title: 'Phòng Máy', dataIndex: 'maPhong', key: 'maPhong', width: 150, editable: true,
            render: (text, record) => {
                const selectedOption = phongMayOptions.find(opt => opt.value === text);
                return selectedOption ? selectedOption.label : (record.phongMay?.tenPhong || text || 'N/A');
            }
        },
        {
            title: 'Môn Học', dataIndex: 'maMon', key: 'maMon', width: 200, editable: true,
            render: (text, record) => {
                const selectedOption = monHocOptions.find(opt => opt.value === text);
                return selectedOption ? selectedOption.label : (record.monHoc?.tenMon || text || 'N/A');
            }
        },
    ];
    const mergedColumns = columns.map((col) => {
        if (col.key === 'stt' || !col.editable) return col;
        return {
            ...col,
            onCell: (record) => ({
                record,
                inputType: col.dataIndex === 'ngayThucHanh' ? 'date' :
                    (col.dataIndex === 'tietBatDau' || col.dataIndex === 'tietKetThuc' || col.dataIndex === 'buoiSo') ? 'number' :
                        (col.dataIndex === 'maGiaoVien' || col.dataIndex === 'maPhong' || col.dataIndex === 'maMon') ? 'select' : 'text',
                dataIndex: col.dataIndex,
                title: col.title,
                editing: isEditing(record),
                form: form,
                options: col.dataIndex === 'maGiaoVien' ? giaoVienOptions :
                    col.dataIndex === 'maPhong' ? phongMayOptions :
                        col.dataIndex === 'maMon' ? monHocOptions : [],
            }),
        };
    });
    const onSelectChange = (keys) => setSelectedRowKeys(keys);
    const rowSelection = { selectedRowKeys, onChange: onSelectChange, getCheckboxProps: (record) => ({ disabled: record.isNew }) };
    const hasSelected = selectedRowKeys.length > 0;
    const showGlobalAddButton = pagination.current > 1 || caThucHanhData.length >= pagination.pageSize || pagination.total > caThucHanhData.length;

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout>
                <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                        <Popover content={<div>Quản lý danh sách các ca thực hành</div>} trigger="hover"><CalendarOutlined style={{ marginRight: 8, cursor: 'pointer' }} /></Popover>
                        Quản Lý Ca Thực Hành
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
                                        placeholder={selectedFieldType === 'date' ? (isDateRangeOperator ? "Từ ngày - Đến ngày" : "Chọn ngày") : (isListOperator ? "Giá trị 1,Giá trị 2,..." : "Nhập giá trị...")}
                                        value={selectedFieldType === 'date' ? (isDateRangeOperator ? searchDateRangeValue : searchDateValue) : searchInput}
                                        onChange={handleValueChange}
                                        disabled={searchOperatorValue && !operatorRequiresValue}
                                        allowClear={ValueInputComponent !== RangePicker && (selectedFieldType !== 'number' || isListOperator)}
                                        format={selectedFieldType === 'date' && !isDateRangeOperator ? "DD/MM/YYYY" : undefined}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                                <Form.Item label="Thuộc tính" style={{ marginBottom: 0 }}>
                                    <Select placeholder="Chọn thuộc tính" value={searchFieldValue} onChange={handleFieldChange} style={{ width: '100%' }} allowClear>
                                        {searchFieldsOptions.map(item => (<Option key={item.value} value={item.value}>{item.label}</Option>))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={12} md={6} lg={6} xl={6}>
                                <Form.Item label="Phép toán" style={{ marginBottom: 0 }}>
                                    <Select placeholder="Chọn phép toán" value={searchOperatorValue} onChange={handleOperatorChange} style={{ width: '100%' }} disabled={!searchFieldValue} allowClear>
                                        {getFilteredOperators().map(item => (<Option key={item.value} value={item.value}>{item.label}</Option>))}
                                    </Select>
                                </Form.Item>
                            </Col>
                            <Col xs={24} sm={6} md={3} lg={2} xl={2}>
                                <AntButton icon={<ClearOutlined />} onClick={handleClearSearch} style={{ width: '100%' }} danger>Xóa lọc</AntButton>
                            </Col>
                        </Row>

                        <Form form={form} component={false}>
                            <div ref={tableRef}>
                                <Table
                                    rowSelection={rowSelection}
                                    components={{ body: { cell: EditableCell } }}
                                    bordered
                                    dataSource={caThucHanhData}
                                    columns={mergedColumns}
                                    rowKey="key"
                                    rowClassName={(record) => `editable-row ${hoveredRowKey === record.key && !isEditing(record) ? 'row-hover-actions' : ''}`}
                                    loading={loading}
                                    pagination={{ ...pagination, showSizeChanger: true, pageSizeOptions: ['10', '20', '50', '100'], showTotal: (total, range) => `${range[0]}-${range[1]} trên ${total} mục`}}
                                    onChange={handleTableChange}
                                    scroll={{ x: 1300 }}
                                    size="small"
                                    onRow={(record) => ({
                                        onMouseEnter: () => { if (!editingKey) setHoveredRowKey(record.key); },
                                        onMouseLeave: () => { if (!editingKey) setHoveredRowKey(''); }
                                    })}
                                />
                            </div>
                        </Form>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {!showGlobalAddButton && caThucHanhData.length < pagination.pageSize && caThucHanhData.length > 0 && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Ca Thực Hành</AntButton>
                            )}
                            {caThucHanhData.length === 0 && !loading && (
                                <AntButton type="dashed" onClick={handleGlobalAddNew} icon={<PlusOutlined />} style={{ width: '100%' }}>Thêm Ca Thực Hành đầu tiên</AntButton>
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
export default QuanLyCaThucHanh;