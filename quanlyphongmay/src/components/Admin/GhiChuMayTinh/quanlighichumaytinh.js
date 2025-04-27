// src/pages/QuanLyGhiChuMayTinh.js

import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, Layout, Popover, Button as AntButton, Tag, Tooltip,
    Modal, DatePicker, TimePicker, Form, message, Select // Added Select
} from 'antd';
import {
    // Keep necessary icons
    ToolOutlined, SunOutlined, MoonOutlined, SettingOutlined
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header, Content } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { useNavigate, useLoaderData } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Adjust path if needed
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.locale('vi');

const { Option } = Select; // Destructure Option from Select

// --- DarkModeToggle component (Keep as is) ---
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
    useEffect(() => {
        if (isDarkMode) DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
        else DarkReader.disable();
    }, [isDarkMode]);
    return <AntButton icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />} onClick={toggleDarkMode} style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }} />;
};


const QuanLyGhiChuMayTinh = () => {
    const loaderData = useLoaderData();
    const [ghiChuData, setGhiChuData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    // --- State for the Modal ---
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();

    // --- State for Employee List ---
    const [nhanVienList, setNhanVienList] = useState([]);
    const [nhanVienLoading, setNhanVienLoading] = useState(false);

    // --- Function to fetch employee list ---
    const fetchNhanVien = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            // Don't show error here, let the main data load handle auth errors
            console.warn('No token found for fetching employees.');
            return;
        }
        setNhanVienLoading(true);
        try {
            // Use the provided API URL
            const url = new URL('https://localhost:8080/DSNhanVien'); // Correct API URL
            url.searchParams.append('token', token);

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    // Add Authorization header IF your backend security filter requires it
                    // even when token is in query param. Adjust if needed.
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                let errorMsg = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) { /* Ignore JSON parsing error if response is not JSON */ }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            // IMPORTANT: Adjust 'maNhanVien' and 'tenNV' based on your actual API response object keys
            // Example: If API returns { id: 1, name: 'John Doe' }, use nv.id and nv.name
            setNhanVienList(data || []); // Ensure it's an array
            console.log("Fetched Nhan Vien:", data);

        } catch (error) {
            console.error('Lỗi khi tải danh sách nhân viên:', error);
            // Avoid showing duplicate errors if main data load also failed due to auth
            if (!loaderData?.error?.type === 'auth') {
                message.error(`Không thể tải danh sách nhân viên: ${error.message}`);
            }
            setNhanVienList([]);
        } finally {
            setNhanVienLoading(false);
        }
        // Removed navigate dependency as it's not directly used inside
        // Added loaderData?.error to prevent duplicate auth messages
    }, [loaderData?.error]);

    // --- Process Loader Data & Fetch Employees ---
    useEffect(() => {
        console.log("[Effect] Processing loader data:", loaderData);
        setLoading(true);
        if (loaderData && !loaderData.error && Array.isArray(loaderData.data)) {
            const processedData = loaderData.data.map((item, index) => ({
                ...item,
                key: item.maGhiChuMT,
                stt: index + 1,
            }));
            console.log("[Effect] Processed data:", processedData);
            setGhiChuData(processedData);
            fetchNhanVien(); // Fetch employees after processing main data
        } else if (loaderData && loaderData.error) {
            console.error("Loader Error:", loaderData);
            if (loaderData.type === 'auth') {
                Swal.fire({
                    icon: 'error', title: 'Phiên Đăng Nhập Hết Hạn',
                    text: loaderData.message, confirmButtonText: 'Đăng Nhập Lại'
                }).then(() => navigate('/login'));
            } else {
                Swal.fire('Lỗi', loaderData.message || 'Không thể tải dữ liệu ghi chú.', 'error');
            }
            setGhiChuData([]);
        } else {
            console.error("Loader Data Error: Data is not an array or loader failed.", loaderData);
            Swal.fire('Lỗi', 'Dữ liệu ghi chú không đúng định dạng hoặc bị lỗi.', 'error');
            setGhiChuData([]);
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loaderData, navigate]); // Keep navigate dependency for error handling redirect

    // --- Helper functions (parseScheduledInfo, formatDateDisplay - Keep as is) ---
    const parseScheduledInfo = (noiDung) => {
        if (!noiDung) return null;
        const regex = /\(Sẽ được sửa vào ngày (\d{1,2}\/\d{1,2}\/\d{4}) từ (\d{1,2}:\d{2}) đến (\d{1,2}:\d{2})\)/;
        const match = noiDung.match(regex);
        if (match && match.length === 4) {
            return { date: match[1], startTime: match[2], endTime: match[3] };
        }
        return null;
    };
    const formatDateDisplay = (dateString) => {
        if (!dateString) return null;
        try {
            const dateObj = dayjs(dateString);
            if (!dateObj.isValid()) return 'Ngày không hợp lệ';
            return dateObj.format('DD/MM/YYYY HH:mm:ss');
        } catch (e) { console.error("Error formatting date:", dateString, e); return 'Ngày không hợp lệ'; }
    };

    // --- Modal Handling (showModal, handleCancel - Keep as is) ---
    const showModal = (record) => {
        setSelectedRecord(record);
        form.resetFields(); // Clear previous values before showing
        setIsModalVisible(true);
    };
    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
        form.resetFields();
    };

    // --- API Call to Update Schedule (MODIFIED) ---
    const handleUpdateSchedule = async (values) => {
        // Validation: Check if a record is selected
        if (!selectedRecord) {
            message.error('Lỗi: Không có ghi chú nào được chọn.');
            return;
        }
        // Validation: Check if employee is selected (already handled by form rules, but double-check)
        if (!values.maNhanVienSua) {
            message.error('Lỗi: Vui lòng chọn người sửa lỗi.');
            return; // Should not happen if form validation works
        }

        const token = localStorage.getItem('authToken');
        if (!token) {
            message.error('Lỗi: Không tìm thấy token xác thực.');
            navigate('/login');
            return;
        }

        // Format data from the form
        const ngaySuaStr = values.ngaySua.format('DD/MM/YYYY');
        const thoiGianBatDau = values.thoiGianBatDau.format('HH:mm');
        const thoiGianKetThuc = values.thoiGianKetThuc.format('HH:mm');
        const maGhiChuMT = selectedRecord.maGhiChuMT;
        const maTKSuaLoi = values.maNhanVienSua; // Get selected employee ID from form

        console.log("API Call Params:", { maGhiChuMT, ngaySuaStr, thoiGianBatDau, thoiGianKetThuc, maTKSuaLoi, token });

        setModalLoading(true);
        try {
            // Use the provided API URL
            const url = new URL('https://localhost:8080/CapNhatNguoiSuaVaThoiGianSua'); // Correct API URL
            url.searchParams.append('maGhiChuMT', maGhiChuMT);
            url.searchParams.append('ngaySuaStr', ngaySuaStr);
            url.searchParams.append('thoiGianBatDau', thoiGianBatDau);
            url.searchParams.append('thoiGianKetThuc', thoiGianKetThuc);
            url.searchParams.append('maTKSuaLoi', maTKSuaLoi);
            url.searchParams.append('token', token);

            const putResponse = await fetch(url.toString(), {
                method: 'PUT',
                headers: {
                    // Add Authorization header IF needed
                    'Authorization': `Bearer ${token}`
                }
            });

            // Try parsing JSON regardless of status for potential error messages
            let responseData = {};
            try {
                responseData = await putResponse.json();
            } catch (e) {
                console.warn("Response was not JSON", e);
                // If not JSON, might be plain text error from server
                if (!putResponse.ok) {
                    responseData = { message: `Lỗi máy chủ: ${putResponse.statusText} (Status: ${putResponse.status})` };
                }
            }


            if (!putResponse.ok) {
                throw new Error(responseData.message || `HTTP error! status: ${putResponse.status}`);
            }

            message.success('Đã cập nhật lịch sửa thành công!');
            setIsModalVisible(false);

            // --- Update UI ---
            const index = ghiChuData.findIndex(item => item.maGhiChuMT === maGhiChuMT);
            if (index !== -1) {
                const newData = [...ghiChuData];
                // Update based on the response DTO. Ensure responseData fields match your DTO.
                newData[index] = {
                    ...newData[index], // Keep existing fields that weren't updated
                    noiDung: responseData.noiDung, // Update content from response
                    maTaiKhoanSuaLoi: responseData.maTaiKhoanSuaLoi, // Update fixer ID from response
                    tenTaiKhoanSuaLoi: responseData.tenTaiKhoanSuaLoi, // Update fixer name from response
                    // ngaySua: responseData.ngaySua // Only update if API response includes it and it's meaningful
                };
                setGhiChuData(newData);
            } else {
                console.warn("Updated record not found in local state, consider refetching.");
                // Optionally trigger a full refresh: fetchGhiChuData();
            }

        } catch (error) {
            console.error('Lỗi khi cập nhật lịch sửa:', error);
            message.error(`Cập nhật thất bại: ${error.message}`);
        } finally {
            setModalLoading(false);
            // Reset form fields even if API call fails? Maybe not, user might want to retry.
            // form.resetFields(); // Consider if needed here
        }
    };

    // --- Right-click handler (Keep as is) ---
    const handleContextMenu = (event, record) => {
        event.preventDefault();
        const scheduledInfo = parseScheduledInfo(record.noiDung);
        if (!record.ngaySua && !scheduledInfo) { // Only allow if not fixed and not scheduled
            showModal(record);
        }
    };

    // --- Sidebar navigation and Logout logic (Keep as is) ---
    const handleMenuClickSidebar = (e) => { /* ... */ };
    const handleLogout = () => { /* ... */ };


    // --- Define Table Columns (MODIFIED 'Trạng thái Sửa' and 'Người Sửa Lỗi' render) ---
    const ghiChuColumns = [
        { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, sorter: (a, b) => a.stt - b.stt },
        {
            title: 'Nội dung', dataIndex: 'noiDung', key: 'noiDung', ellipsis: true,
            sorter: (a, b) => (a.noiDung || '').localeCompare(b.noiDung || ''),
            render: (text) => text ? <Popover content={<div style={{ whiteSpace: 'pre-wrap', maxWidth: '400px' }}>{text}</div>} title="Nội dung chi tiết" trigger="hover"><span>{text}</span></Popover> : 'N/A'
        },
        { title: 'Tên Máy', dataIndex: 'tenMay', key: 'tenMay', width: 120, sorter: (a, b) => (a.tenMay || '').localeCompare(b.tenMay || ''), render: (text) => text || 'N/A' },
        { title: 'Tên Phòng', dataIndex: 'tenPhong', key: 'tenPhong', width: 120, sorter: (a, b) => (a.tenPhong || '').localeCompare(b.tenPhong || ''), render: (text) => text || 'N/A' },
        {
            title: 'Ngày Báo Lỗi', dataIndex: 'ngayBaoLoi', key: 'ngayBaoLoi', width: 180,
            sorter: (a, b) => dayjs(a.ngayBaoLoi).valueOf() - dayjs(b.ngayBaoLoi).valueOf(),
            render: (text) => formatDateDisplay(text) || 'N/A'
        },
        {
            title: 'Trạng thái Sửa',
            dataIndex: 'ngaySua',
            key: 'ngaySuaStatus',
            width: 180,
            sorter: (a, b) => { /* ... keep sorting logic ... */
                const scheduledA = parseScheduledInfo(a.noiDung) ? 1 : 0; const scheduledB = parseScheduledInfo(b.noiDung) ? 1 : 0;
                const fixedA = a.ngaySua ? 1 : 0; const fixedB = b.ngaySua ? 1 : 0;
                if (scheduledA && !scheduledB) return -1; if (!scheduledA && scheduledB) return 1; if (scheduledA && scheduledB) return 0;
                if (!fixedA && fixedB) return -1; if (fixedA && !fixedB) return 1; if (fixedA && fixedB) return dayjs(a.ngaySua).valueOf() - dayjs(b.ngaySua).valueOf();
                return 0;
            },
            render: (text_ngaySua_original, record) => {
                const scheduledInfo = parseScheduledInfo(record.noiDung);
                const formattedOriginalNgaySua = formatDateDisplay(record.ngaySua);
                let content;

                // Check if noiDung contains the scheduled pattern
                if (scheduledInfo) {
                    // Display "Đã lên lịch" regardless of original ngaySua field,
                    // as the text in noiDung is the source of truth for scheduling.
                    const fixerName = record.tenTaiKhoanSuaLoi ? ` (${record.tenTaiKhoanSuaLoi})` : '';
                    content = (
                        <Tooltip title={`Lịch: ${scheduledInfo.date} ${scheduledInfo.startTime}-${scheduledInfo.endTime}${fixerName}`}>
                            <Tag color="processing">Đã lên lịch</Tag>
                        </Tooltip>
                    );
                } else if (!record.ngaySua) { // If not scheduled in text AND original ngaySua is empty
                    content = <Tag color="error">Chưa sửa</Tag>;
                } else { // If not scheduled in text AND original ngaySua has a value
                    content = formattedOriginalNgaySua || 'N/A'; // Display the fix date
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
        { title: 'Người Báo Lỗi', dataIndex: 'tenTaiKhoanBaoLoi', key: 'tenTaiKhoanBaoLoi', width: 150, sorter: (a, b) => (a.tenTaiKhoanBaoLoi || '').localeCompare(b.tenTaiKhoanBaoLoi || ''), render: (text) => text || 'N/A' },
        {
            title: 'Người Sửa Lỗi',
            dataIndex: 'tenTaiKhoanSuaLoi',
            key: 'tenTaiKhoanSuaLoi',
            width: 150,
            sorter: (a, b) => (a.tenTaiKhoanSuaLoi || '').localeCompare(b.tenTaiKhoanSuaLoi || ''),
            render: (text, record) => {
                // Display the name if available (either from initial load or after update)
                return text ? text : <i>(Chưa có)</i>;
            }
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={collapsed} onCollapse={setCollapsed} onMenuClick={handleMenuClickSidebar} />
            <Layout>
                <Header
                    className="lab-management-header"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#fff',
                        padding: '0 24px',
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                        <Popover content={<div>Quản lí các ghi chú, báo lỗi của máy tính</div>} trigger="hover">
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
                        <Table /* ... Table props ... */
                            columns={ghiChuColumns}
                            dataSource={ghiChuData}
                            loading={loading}
                            pagination={{ pageSizeOptions: ['10', '20', '50', '100'], showSizeChanger: true, showQuickJumper: true, position: ['bottomRight'], showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items` }}
                            scroll={{ x: 1300 }}
                            bordered
                        />
                    </div>
                </Content>
            </Layout>

            {/* --- Scheduling Modal (MODIFIED) --- */}
            {selectedRecord && (
                <Modal
                    title={`Lên lịch sửa cho máy: ${selectedRecord.tenMay || 'N/A'}`}
                    visible={isModalVisible}
                    onCancel={handleCancel}
                    footer={[
                        <AntButton key="back" onClick={handleCancel}>Hủy</AntButton>,
                        <AntButton key="submit" type="primary" loading={modalLoading} onClick={() => form.submit()}>Cập nhật lịch</AntButton>,
                    ]}
                    destroyOnClose
                    forceRender // Keep modal content rendered to allow form instance persistence
                >
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleUpdateSchedule}
                        initialValues={{ ngaySua: null, thoiGianBatDau: null, thoiGianKetThuc: null, maNhanVienSua: null }}
                    >
                        {/* --- Employee Selector --- */}
                        <Form.Item
                            name="maNhanVienSua"
                            label="Người sửa"
                            rules={[{ required: true, message: 'Vui lòng chọn người sửa!' }]}
                        >
                            <Select
                                placeholder="Chọn nhân viên thực hiện"
                                loading={nhanVienLoading}
                                showSearch
                                optionFilterProp="children"
                                filterOption={(input, option) =>
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                style={{ width: '100%' }} // Ensure select takes full width
                            >
                                {nhanVienList.map(nv => (
                                    // !! ADJUST KEYS !! Use the actual keys from your API response
                                    <Option key={nv.maNhanVien} value={nv.maNhanVien}>
                                        {nv.tenNV} {/* Display Name */}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

                        {/* --- Date and Time Pickers --- */}
                        <Form.Item name="ngaySua" label="Ngày sửa" rules={[{ required: true, message: 'Vui lòng chọn ngày sửa!' }]}>
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item name="thoiGianBatDau" label="Thời gian bắt đầu" rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu!' }]}>
                            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} placeholder="Chọn giờ bắt đầu"/>
                        </Form.Item>
                        <Form.Item
                            name="thoiGianKetThuc"
                            label="Thời gian kết thúc"
                            rules={[
                                { required: true, message: 'Vui lòng chọn thời gian kết thúc!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startTime = getFieldValue('thoiGianBatDau');
                                        if (!value || !startTime || value.isAfter(startTime)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Giờ kết thúc phải sau giờ bắt đầu!'));
                                    },
                                }),
                            ]}
                        >
                            <TimePicker style={{ width: '100%' }} format="HH:mm" minuteStep={15} placeholder="Chọn giờ kết thúc"/>
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </Layout>
    );
};

export default QuanLyGhiChuMayTinh;