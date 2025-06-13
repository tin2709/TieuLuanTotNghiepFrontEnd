import React, { useState, useEffect, useReducer, useMemo, useRef } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
    Layout, Button, Input, Select, Table, Checkbox, Dropdown, Menu,
    Modal, QRCode, Avatar, Form, Upload, Spin, Tabs, Result, message,
    notification // <<< Đảm bảo đã import notification
} from "antd";
import {
    HomeOutlined, EditOutlined, DeleteOutlined, MessageOutlined, PlusOutlined,
    FileAddOutlined, LogoutOutlined, QrcodeOutlined, UserOutlined, InboxOutlined,
    DesktopOutlined, ToolOutlined, QuestionCircleOutlined,InfoCircleOutlined,
    SunOutlined, MoonOutlined
} from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import * as DarkReader from "darkreader";
import 'intro.js/introjs.css';
import introJs from 'intro.js';

// Internal Imports
import { labManagementReducer, initialState } from '../Reducer/labManagementReducer';
import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from './action'; // <<< BROKEN_STATUS vẫn cần cho phần khác của code
import { createLabManagementHandlers } from './phongmayHandler';

const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;
const { Dragger } = Upload;

// --- UI Helpers (Giữ nguyên) ---
const getDeviceStatusColor = (status) => {
    if (status === BROKEN_STATUS) return '#ff4d4f'; // Red for broken
    if (status === ACTIVE_STATUS) return '#52c41a'; // Green for active
    return '#bfbfbf'; // Gray for inactive/other
};
const getDeviceIcon = (deviceName) => {
    const lowerName = deviceName?.toLowerCase() || '';
    if (lowerName.includes('máy lạnh') || lowerName.includes('điều hòa')) return <ToolOutlined />;
    if (lowerName.includes('máy chiếu')) return <DesktopOutlined />;
    if (lowerName.includes('quạt')) return <ToolOutlined />;
    return <ToolOutlined />;
};

const RenderGroupedItemsComponent = ({ items, isComputerTab = false, onComputerIconRightClick, onDeviceIconRightClick }) => {
    if (!items || items.length === 0) return <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>Không có dữ liệu.</p>;

    const renderItem = (item) => (
        <div
            key={isComputerTab ? item.maMay : item.maThietBi}
            style={{ textAlign: 'center', width: '100px', padding: '10px', borderRadius: '4px', userSelect: 'none', cursor: 'context-menu' }}
            onContextMenu={(e) => {
                e.preventDefault();
                if (isComputerTab && onComputerIconRightClick) {
                    onComputerIconRightClick(e, item);
                } else if (!isComputerTab && onDeviceIconRightClick) {
                    onDeviceIconRightClick(e, item);
                }
            }}
        >
            {React.cloneElement(
                isComputerTab ? <DesktopOutlined /> : getDeviceIcon(item.tenThietBi),
                { style: { fontSize: '3rem', color: getDeviceStatusColor(item.trangThai) } }
            )}
            <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word', color: '#555' }}>
                {isComputerTab ? (item.tenMay || `Máy ${item.maMay}`) : (item.tenThietBi || `TB ${item.maThietBi}`)}
            </div>
            {isComputerTab && (item.moTa?.toLowerCase().includes('gv') || item.moTa?.toLowerCase().includes('giáo viên')) && (
                <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: '#1890ff' }}>(GV)</div>
            )}
        </div>
    );

    const renderComputerGroups = () => {
        const teacherComputers = items.filter(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
        const otherComputers = items.filter(m => !(m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')));

        const needsGrouping = teacherComputers.length > 0 && otherComputers.length > 0;

        return (
            <>
                {teacherComputers.length > 0 && (
                    <div style={{ marginBottom: needsGrouping ? '20px' : '0', paddingBottom: needsGrouping ? '15px' : '0', borderBottom: needsGrouping ? '1px solid #eee' : 'none' }}>
                        {needsGrouping && <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>Máy Giáo Viên</h4>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                            {teacherComputers.map(renderItem)}
                        </div>
                    </div>
                )}
                {otherComputers.length > 0 && (
                    <div>
                        {needsGrouping && <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold', color: '#333' }}>Máy Sinh Viên / Khác</h4>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                            {otherComputers.map(renderItem)}
                        </div>
                    </div>
                )}
            </>
        );
    };

    return (
        <div style={{ padding: '10px 0' }}>
            {isComputerTab ? renderComputerGroups() : (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                    {items.map(renderItem)}
                </div>
            )}

            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', color: '#666' }}>
                 <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {React.cloneElement(isComputerTab ? <DesktopOutlined /> : <ToolOutlined />, { style: { color: getDeviceStatusColor(ACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' } })}: {ACTIVE_STATUS}
                 </span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {React.cloneElement(isComputerTab ? <DesktopOutlined /> : <ToolOutlined />, { style: { color: getDeviceStatusColor(INACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' } })}: {INACTIVE_STATUS}
                 </span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {React.cloneElement(isComputerTab ? <DesktopOutlined /> : <ToolOutlined />, { style: { color: getDeviceStatusColor(BROKEN_STATUS), marginRight: '5px', fontSize: '1.2em' } })}: {BROKEN_STATUS}
                 </span>
            </div>
        </div>
    );
};


// --- Main Component: LabManagement ---
export default function LabManagement() {
    // --- Hooks ---
    const loaderResult = useLoaderData();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const [state, dispatch] = useReducer(labManagementReducer, initialState);
    const [avatarImage, setAvatarImage] = useState(null);
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Lấy userRole ngay từ đầu component
    const userRole = localStorage.getItem("userRole");
    const isTeacherRole = userRole === '2'; // Cờ cho vai trò giáo viên
    const isStaffRole = userRole === '3';   // Cờ cho vai trò staff/admin (hoặc vai trò bạn muốn hiển thị thông báo)

    console.log(`[LabManagement Component] User Role: ${userRole}, Is Teacher: ${isTeacherRole}, Is Staff: ${isStaffRole}`);

    // Context Menu State
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuComputerId, setContextMenuComputerId] = useState(null);
    const [deviceContextMenuVisible, setDeviceContextMenuVisible] = useState(false);
    const [deviceContextMenuPosition, setDeviceContextMenuPosition] = useState({ x: 0, y: 0 });
    const [deviceContextMenuDeviceId, setDeviceContextMenuDeviceId] = useState(null);

    const contextMenuRef = useRef(null);
    const deviceContextMenuRef = useRef(null);

    const handlers = useMemo(() => createLabManagementHandlers({
        dispatch,
        state,
        navigate,
        form,
        setAvatarImage
    }), [dispatch, state, navigate, form, setAvatarImage]);

    const homeDropdownMenu = (
        <Menu>
            <Menu.Item key="home" onClick={() => navigate('/')}>
                Trang chủ
            </Menu.Item>
            {/* Assuming these are your paths, adjust if different */}
            <Menu.Item key="quanliphongmay" onClick={() => navigate('/phongmay')}>
                Quản lí phòng máy
            </Menu.Item>
            <Menu.Item key="quanlicathuchanh" onClick={() => navigate('/cathuchanh')}>
                Quản lí ca thực hành
            </Menu.Item>
            <Menu.Item key="quanlimonhoc" onClick={() => navigate('/quanlimonhoc')}>
                Quản lí môn học
            </Menu.Item>
        </Menu>
    );
    // --- Intro.js Tour (Giữ nguyên) ---
    const startIntroTour = () => {
        const steps = [
            { element: '#search-input', intro: 'Nhập tên phòng hoặc thông tin liên quan để tìm kiếm.', position: 'bottom-start' },
            { element: '#column-select', intro: 'Chọn cột bạn muốn tìm kiếm (Tên phòng, Số máy, Mô tả, Trạng thái).', position: 'bottom-start' },
            { element: '#qr-code-button', intro: 'Tạo mã QR để thống kê nhanh thông tin phòng máy.', position: 'bottom-start' },
            { element: '#export-pdf-button', intro: 'Xuất danh sách phòng máy ra file PDF.', position: 'bottom-start' },
            { element: '#export-excel-button', intro: 'Xuất danh sách phòng máy ra file Excel.', position: 'bottom-start' },
            // Conditionally add 'create-new-dropdown' step
            ...(!isTeacherRole ? [{ element: '#create-new-dropdown', intro: 'Tạo phòng máy mới bằng form hoặc import từ file.', position: 'bottom-start' }] : []),
            { element: '.ant-table-thead > tr > th:nth-child(3)', intro: 'Click vào đây để sắp xếp danh sách phòng máy theo tên phòng.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(5)', intro: 'Click vào đây để sắp xếp danh sách phòng máy theo số lượng máy.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(6)', intro: 'Click vào đây để sắp xếp danh sách phòng máy theo trạng thái hoạt động.', position: 'bottom' },
            // Adjust action column step based on role
            // Bổ sung step cho giáo viên:
            { element: '.ant-table-thead > tr > th:last-child', intro: 'Tại cột này, bạn có thể xem trạng thái chi tiết của phòng máy.', position: 'left' },
            // Chỉ thêm step xóa nếu không phải giáo viên
            ...(!isTeacherRole ? [{ element: '#delete-selected-button', intro: 'Xóa các phòng máy đã được chọn (tick vào checkbox).', position: 'top-end' }] : []),
            { element: '#dark-mode-button', intro: 'Bật/tắt chế độ Dark Mode.', position: 'bottom-end' },
            { element: '#user-avatar', intro: 'Xem và chỉnh sửa thông tin hồ sơ người dùng.', position: 'bottom-end' },
            { element: '#logout-button', intro: 'Đăng xuất khỏi ứng dụng.', position: 'bottom-end' },
        ];

        introJs().setOptions({
            steps: steps,
            nextLabel: 'Tiếp theo >',
            prevLabel: '< Quay lại',
            doneLabel: 'Hoàn tất',
            overlayOpacity: 0.6,
            exitOnOverlayClick: true,
            showProgress: true,
        }).start();
    };


    // --- Effects ---
    // Load initial data from loader and handle notifications
    useEffect(() => {
        console.log("[LabManagement] Loader Result:", loaderResult);
        if (loaderResult?.error) {
            if (loaderResult.type === 'auth') {
                message.error('Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', 5);
            }
            dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: loaderResult });
        } else if (loaderResult?.data) {
            // Dispatch labRooms to state as before
            dispatch({ type: ACTIONS.LOAD_DATA_SUCCESS, payload: loaderResult.data.labRooms });

            // --- Xử lý hiển thị thông báo máy/thiết bị hỏng ---
            // Sử dụng một cờ trong sessionStorage để chỉ hiển thị thông báo một lần mỗi phiên
            const hasShownBrokenNotifications = sessionStorage.getItem('hasShownBrokenNotificationsPhongMay');

            // CHỈ hiển thị nếu:
            // 1. Chưa hiển thị trong phiên này.
            // 2. userRole là '3' (IsStaffRole là true).
            // 3. Có dữ liệu phòng máy.
            // 4. Đảm bảo computerNotes và deviceNotes tồn tại và là mảng (có thể rỗng)
            if (!hasShownBrokenNotifications && isStaffRole && loaderResult.data.labRooms && loaderResult.data.labRooms.length > 0) {
                const { labRooms, computerNotes, deviceNotes } = loaderResult.data;

                // Khởi tạo các Map mới để lưu trữ số lượng máy/thiết bị hỏng theo loại
                const roomBrokenComputersScheduled = new Map(); // Máy hỏng đã lên lịch sửa
                const roomBrokenComputersNotScheduled = new Map(); // Máy hỏng chưa lên lịch sửa
                const roomBrokenDevicesScheduled = new Map();     // Thiết bị hỏng đã lên lịch sửa
                const roomBrokenDevicesNotScheduled = new Map();  // Thiết bị hỏng chưa lên lịch sửa

                // Đếm số máy hỏng theo phòng từ computerNotes
                if (computerNotes && Array.isArray(computerNotes)) {
                    computerNotes.forEach(note => {
                        // Chỉ xem xét các ghi chú cho máy hiện đang hỏng (ngày sửa là null)
                        if (note.ngaySua === null) {
                            const roomId = note.maPhong;
                            if (roomId) { // Đảm bảo roomId không null/undefined
                                if (note.noiDung?.includes('(Sẽ được sửa')) {
                                    roomBrokenComputersScheduled.set(roomId, (roomBrokenComputersScheduled.get(roomId) || 0) + 1);
                                } else {
                                    roomBrokenComputersNotScheduled.set(roomId, (roomBrokenComputersNotScheduled.get(roomId) || 0) + 1);
                                }
                            }
                        }
                    });
                }

                // Đếm số thiết bị hỏng theo phòng từ deviceNotes
                if (deviceNotes && Array.isArray(deviceNotes)) {
                    deviceNotes.forEach(note => {
                        // Chỉ xem xét các ghi chú cho thiết bị hiện đang hỏng (ngày sửa là null)
                        if (note.ngaySua === null) {
                            const roomId = note.maPhong;
                            if (roomId) { // Đảm bảo roomId không null/undefined
                                if (note.noiDung?.includes('(Sẽ được sửa')) {
                                    roomBrokenDevicesScheduled.set(roomId, (roomBrokenDevicesScheduled.get(roomId) || 0) + 1);
                                } else {
                                    roomBrokenDevicesNotScheduled.set(roomId, (roomBrokenDevicesNotScheduled.get(roomId) || 0) + 1);
                                }
                            }
                        }
                    });
                }

                // Duyệt qua các phòng máy và hiển thị thông báo nếu có máy/thiết bị hỏng
                labRooms.forEach(room => {
                    const scheduledComputers = roomBrokenComputersScheduled.get(room.maPhong) || 0;
                    const notScheduledComputers = roomBrokenComputersNotScheduled.get(room.maPhong) || 0;
                    const scheduledDevices = roomBrokenDevicesScheduled.get(room.maPhong) || 0;
                    const notScheduledDevices = roomBrokenDevicesNotScheduled.get(room.maPhong) || 0;

                    // Chỉ hiển thị thông báo nếu có bất kỳ máy/thiết bị nào bị hỏng (đã lên lịch hoặc chưa)
                    if (scheduledComputers > 0 || notScheduledComputers > 0 || scheduledDevices > 0 || notScheduledDevices > 0) {
                        let descriptionParts = [];

                        if (scheduledComputers > 0 || scheduledDevices > 0) {
                            let scheduledSubParts = [];
                            if (scheduledComputers > 0) scheduledSubParts.push(`${scheduledComputers} máy`);
                            if (scheduledDevices > 0) scheduledSubParts.push(`${scheduledDevices} thiết bị`);
                            descriptionParts.push(`${scheduledSubParts.join(' và ')} hỏng (đã lên lịch sửa)`);
                        }

                        if (notScheduledComputers > 0 || notScheduledDevices > 0) {
                            let notScheduledSubParts = [];
                            if (notScheduledComputers > 0) notScheduledSubParts.push(`${notScheduledComputers} máy`);
                            if (notScheduledDevices > 0) notScheduledSubParts.push(`${notScheduledDevices} thiết bị`);
                            descriptionParts.push(`${notScheduledSubParts.join(' và ')} hỏng (chưa lên lịch sửa)`);
                        }

                        notification.info({
                            message: `Phòng ${room.tenPhong} - Tình trạng Hỏng hóc`,
                            description: `Hiện đang có ${descriptionParts.join('; ')}.`,
                            placement: 'bottomRight',
                            duration: 5,
                            key: `broken-room-${room.maPhong}` // Đảm bảo key duy nhất cho mỗi thông báo
                        });
                    }
                });

                // Đặt cờ vào sessionStorage để không hiển thị lại trong phiên này
                sessionStorage.setItem('hasShownBrokenNotificationsPhongMay', 'true');
            }

        } else {
            dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: { error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." } });
        }
    }, [loaderResult, dispatch, isStaffRole]);

    // Dark Mode cleanup (Giữ nguyên)
    useEffect(() => {
        return () => { DarkReader.disable(); };
    }, []);

    // Handle clicks outside context menus (Giữ nguyên)
    useEffect(() => {
        const handleClickOutsideContextMenu = (event) => {
            if (contextMenuVisible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setContextMenuVisible(false);
            }
        };
        const handleClickOutsideDeviceContextMenu = (event) => {
            if (deviceContextMenuVisible && deviceContextMenuRef.current && !deviceContextMenuRef.current.contains(event.target)) {
                setDeviceContextMenuVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutsideContextMenu);
        document.addEventListener('mousedown', handleClickOutsideDeviceContextMenu);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideContextMenu);
            document.removeEventListener('mousedown', handleClickOutsideDeviceContextMenu);
        };
    }, [contextMenuVisible, deviceContextMenuVisible]);

    // Periodic token check (silent refresh handled by fetchApi) (Giữ nguyên)
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (handlers.isTokenExpired()) {
                console.log("Token check: Expired or nearing expiry. Next API call will attempt refresh.");
            }
        }, 60000); // Check every 60 seconds
        return () => clearInterval(intervalId);
    }, [handlers]);


    // --- Dark Mode Handler (Giữ nguyên) ---
    const toggleDarkMode = () => {
        setIsDarkMode((prevIsDarkMode) => {
            const nextIsDarkMode = !prevIsDarkMode;
            if (nextIsDarkMode) {
                DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
            } else {
                DarkReader.disable();
            }
            return nextIsDarkMode;
        });
    };

    // --- Columns Definitions (Giữ nguyên) ---
    const columns = useMemo(() => {
        const currentIsTeacherRole = userRole === '2';

        const baseColumns = [
            !currentIsTeacherRole ? {
                title: (<Checkbox
                    checked={state.labRooms.length > 0 && state.labRooms.every(r => state.selectedRowKeys.includes(r.maPhong))}
                    indeterminate={state.selectedRowKeys.length > 0 && state.labRooms.some(r => state.selectedRowKeys.includes(r.maPhong)) && !state.labRooms.every(r => state.selectedRowKeys.includes(r.maPhong))}
                    onChange={(e) => {
                        const currentPageKeys = state.labRooms.map(r => r.maPhong);
                        const newSelectedKeys = e.target.checked
                            ? [...new Set([...state.selectedRowKeys, ...currentPageKeys])]
                            : state.selectedRowKeys.filter(k => !currentPageKeys.includes(k));
                        handlers.onSelectChange(newSelectedKeys);
                    }}
                    aria-label="Chọn tất cả trên trang này"
                />),
                key: "selection", width: 60, fixed: "left",
                render: (text, record) => <Checkbox checked={state.selectedRowKeys.includes(record.maPhong)} onChange={(e) => {
                    const isChecked = e.target.checked;
                    const newSelectedKeys = isChecked
                        ? [...state.selectedRowKeys, record.maPhong]
                        : state.selectedRowKeys.filter(key => key !== record.maPhong);
                    handlers.onSelectChange(newSelectedKeys);
                }} aria-label={`Chọn phòng ${record.tenPhong}`} />
            } : null,
            { title: "STT", key: "stt", width: 60, align: "center", render: (text, record, index) => (state.pagination.current - 1) * state.pagination.pageSize + index + 1 },
            { title: "Tên phòng", dataIndex: "tenPhong", key: "tenPhong", sorter: true, width: 150 },
            { title: "Mô tả", dataIndex: "moTa", key: "moTa", sorter: true, ellipsis: true },
            { title: "Số máy", dataIndex: "soMay", key: "soMay", align: "center", sorter: true, width: 100 },
            { title: "Trạng thái", dataIndex: "trangThai", key: "trangThai", sorter: true, width: 150 },
            {
                title: "Hành động", key: "action", align: "center", width: 120, fixed: 'right', render: (text, record) => (
                    <div className="flex justify-center gap-2">
                        {!currentIsTeacherRole && (
                            <>
                                <Button icon={<EditOutlined />} size="small" type="link" onClick={() => navigate(`/editphongmay/${record.maPhong}`)} aria-label={`Sửa phòng ${record.tenPhong}`} />
                                <Button icon={<DeleteOutlined />} size="small" type="link" danger onClick={() => handlers.handleDelete(record)} aria-label={`Xóa phòng ${record.tenPhong}`} />
                            </>
                        )}
                        <Button icon={<MessageOutlined />} size="small" type="link" onClick={() => handlers.showComputerStatusModal(record)} aria-label={`Xem trạng thái phòng ${record.tenPhong}`} />
                    </div>
                )
            },
        ].filter(Boolean);
        return baseColumns;
    }, [state.labRooms, state.selectedRowKeys, state.pagination, handlers, navigate, userRole]);

    // Columns for Computer Update Modal (Giữ nguyên)
    const computerUpdateColumns = useMemo(() => {
        const role = state.computerUpdateModal.userRole;
        const isRole3 = role === '3';
        const roomStatusForUpdate = state.computerUpdateModal.roomStatusForUpdate;

        return [
            { title: 'Tên máy', dataIndex: 'tenMay', key: 'tenMay', render: (text, record) => { const n = text || `Máy ${record.maMay}`; return (record.moTa?.toLowerCase().includes('gv')||record.moTa?.toLowerCase().includes('giáo viên'))?`${n} (GV)`:n; }},
            { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (status) => (<span style={{ fontWeight: 'bold', color: getDeviceStatusColor(status) }}>{status}</span>)},
            ...(isRole3 && roomStatusForUpdate === 'Trống' ? [
                { title: 'Sửa chữa (Hỏng -> Hoạt động)', key: 'fixBroken', align: 'center', width: '25%', render: (text, record) => {
                        if (record.trangThai !== BROKEN_STATUS) return <span style={{ fontStyle: 'italic', color: '#888' }}>-</span>;
                        return (<Checkbox
                            checked={state.computerUpdateModal.attendanceKeys.includes(record.maMay)}
                            onChange={() => handlers.toggleComputerAttendanceSelection(record.maMay, record.trangThai)}
                            aria-label={`Chọn sửa máy ${record.tenMay || record.maMay}`}
                        />);
                    }}
            ] : [
                { title: 'Điểm danh (Hoạt động <-> Không)', key: 'attendance', align: 'center', width: '15%', render: (text, record) => {
                        if (record.trangThai === BROKEN_STATUS) return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Hỏng</span>;
                        return (<Checkbox
                            checked={state.computerUpdateModal.attendanceKeys.includes(record.maMay) ? record.trangThai !== ACTIVE_STATUS : record.trangThai === ACTIVE_STATUS}
                            onChange={() => handlers.toggleComputerAttendanceSelection(record.maMay, record.trangThai)}
                            disabled={record.trangThai === BROKEN_STATUS}
                            aria-label={`Điểm danh máy ${record.tenMay || record.maMay}`}
                        />);
                    }},
                {
                    title: 'Báo hỏng', key: 'reportBroken', align: 'center', width: '15%', render: (text, record) => {
                        if (record.trangThai === BROKEN_STATUS) return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Hỏng</span>;
                        return (<Checkbox
                            checked={state.computerUpdateModal.brokenReportKeys.includes(record.maMay)}
                            onChange={() => handlers.toggleComputerReportBrokenSelection(record.maMay, record.trangThai)}
                            disabled={record.trangThai === BROKEN_STATUS}
                            aria-label={`Báo hỏng máy ${record.tenMay || record.maMay}`}
                        />);
                    }
                }
            ]),
        ];
    }, [
        state.computerUpdateModal.attendanceKeys,
        state.computerUpdateModal.brokenReportKeys,
        state.computerUpdateModal.userRole,
        state.computerUpdateModal.roomStatusForUpdate,
        state.statusModal.computers,
        handlers
    ]);

    // Columns for Device Update Modal (Giữ nguyên)
    const deviceUpdateColumns = useMemo(() => {
        const role = localStorage.getItem("userRole");
        const isRole3 = role === '3';
        const roomStatusForUpdate = state.statusModal.roomStatus;

        return [
            { title: 'Tên Thiết Bị', dataIndex: 'tenThietBi', key: 'tenThietBi', render: (text, record) => text || `TB ${record.maThietBi}` },
            { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (status) => (<span style={{ fontWeight: 'bold', color: getDeviceStatusColor(status) }}>{status}</span>)},
            ...(isRole3 && roomStatusForUpdate === 'Trống' ? [
                { title: 'Sửa chữa (Hỏng -> Hoạt động)', key: 'fixBrokenDevice', align: 'center', width: '25%', render: (text, record) => {
                        if (record.trangThai !== BROKEN_STATUS) return <span style={{ fontStyle: 'italic', color: '#888' }}>-</span>;
                        return (<Checkbox
                            checked={state.deviceUpdateModal.selectedKeys.includes(record.maThietBi)}
                            onChange={() => handlers.toggleDeviceUpdateSelection(record.maThietBi, record.trangThai)}
                            aria-label={`Chọn sửa thiết bị ${record.tenThietBi || record.maThietBi}`}
                        />);
                    }}
            ] : [
                { title: 'Bật/Tắt (Hoạt động <-> Không)', key: 'toggleActiveDevice', align: 'center', width: '15%', render: (text, record) => {
                        if (record.trangThai === BROKEN_STATUS) return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Hỏng</span>;
                        return (<Checkbox
                            checked={state.deviceUpdateModal.selectedKeys.includes(record.maThietBi) ? record.trangThai !== ACTIVE_STATUS : record.trangThai === ACTIVE_STATUS}
                            onChange={() => handlers.toggleDeviceUpdateSelection(record.maThietBi, record.trangThai)}
                            disabled={record.trangThai === BROKEN_STATUS}
                            aria-label={`Bật/tắt thiết bị ${record.tenThietBi || record.maThietBi}`}
                        />);
                    }},
                {
                    title: 'Báo hỏng', key: 'reportBrokenDevice', align: 'center', width: '15%', render: (text, record) => {
                        if (record.trangThai === BROKEN_STATUS) return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Hỏng</span>;
                        return (<Checkbox
                            checked={state.deviceUpdateModal.brokenReportKeys.includes(record.maThietBi)}
                            onChange={() => handlers.toggleDeviceReportBrokenSelection(record.maThietBi, record.trangThai)}
                            disabled={record.trangThai === BROKEN_STATUS}
                            aria-label={`Báo hỏng thiết bị ${record.tenThietBi || record.maThietBi}`}
                        />);
                    }
                }
            ]),
        ];
    }, [
        state.deviceUpdateModal.selectedKeys,
        state.deviceUpdateModal.brokenReportKeys,
        state.statusModal.roomStatus,
        state.statusModal.currentDevices,
        handlers
    ]);


    // --- Create New Menu (Giữ nguyên) ---
    const menu = useMemo(() => (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addphongmay`)}>Tạo mới (form)</Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={() => navigate(`/importfile`)}>Tạo mới (file)</Menu.Item>
        </Menu>
    ), [navigate]);

    // --- Export Functions (Giữ nguyên) ---
    const exportToPDF = () => {
        if (!state.labRooms || state.labRooms.length === 0) { message.warning("Không có dữ liệu để xuất PDF."); return; }
        try {
            const doc = new jsPDF();
            doc.text("Danh sách phòng máy", 14, 15);
            const tableColumn = ["STT", "Tên phòng", "Mô tả", "Số máy", "Trạng thái"];
            const tableRows = state.labRooms.map((room, index) => [
                (state.pagination.current - 1) * state.pagination.pageSize + index + 1,
                room.tenPhong || '',
                room.moTa || '',
                room.soMay || 0,
                room.trangThai || '',
            ]);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 20,
                theme: 'grid',
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
            });
            doc.save("DanhSachPhongMay.pdf");
            message.success("Xuất PDF thành công!");
        } catch (error) {
            console.error("Lỗi xuất PDF:", error);
            message.error("Đã xảy ra lỗi khi xuất PDF.");
        }
    };

    const exportToExcel = () => {
        if (!state.labRooms || state.labRooms.length === 0) { message.warning("Không có dữ liệu để xuất Excel."); return; }
        try {
            const dataToExport = state.labRooms.map((room, index) => ({
                'STT': (state.pagination.current - 1) * state.pagination.pageSize + index + 1,
                'Tên phòng': room.tenPhong || '',
                'Mô tả': room.moTa || '',
                'Số máy': room.soMay || 0,
                'Trạng thái': room.trangThai || '',
            }));
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(dataToExport);
            ws['!cols'] = [ { wch: 5 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws, "DanhSachPhongMay.xlsx");
            message.success("Xuất Excel thành công!");
        } catch (error) {
            console.error("Lỗi xuất Excel:", error);
            message.error("Đã xảy ra lỗi khi xuất Excel.");
        }
    };

    // --- Context Menu Handlers (Giữ nguyên) ---
    const handleComputerIconRightClick = (event, computer) => {
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setContextMenuComputerId(computer.maMay);
        setContextMenuVisible(true);
        setDeviceContextMenuVisible(false);
    };

    const handleContextMenuViewDetail = () => {
        setContextMenuVisible(false);
        if (contextMenuComputerId) {
            handlers.fetchComputerDetail(contextMenuComputerId);
        }
    };

    const handleDeviceIconRightClick = (event, device) => {
        setDeviceContextMenuPosition({ x: event.clientX, y: event.clientY });
        setDeviceContextMenuDeviceId(device.maThietBi);
        setDeviceContextMenuVisible(true);
        setContextMenuVisible(false);
    };

    const handleContextMenuDeviceViewDetail = () => {
        setDeviceContextMenuVisible(false);
        if (deviceContextMenuDeviceId) {
            handlers.fetchDeviceDetail(deviceContextMenuDeviceId);
        }
    };


    // --- JSX Return (Giữ nguyên các cấu trúc hiện có) ---
    return (
        <Layout className="lab-management-layout" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <Header className="lab-management-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "0 24px", borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 10 }}>
                <div style={{ fontSize: "1.4rem", fontWeight: "bold", color: "#1890ff" }}>Quản Lý Phòng Máy</div>
                <div className="actions" style={{ display: "flex", alignItems: "center", gap: '10px' }}>
                    <Button
                        id="dark-mode-button"
                        icon={isDarkMode ? <SunOutlined style={{ color: "orange" }} /> : <MoonOutlined />}
                        onClick={toggleDarkMode}
                        type="text" shape="circle" style={{ fontSize: "20px" }}
                        aria-label={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
                    />
                    <Avatar id="user-avatar" size="large" icon={<UserOutlined />} src={avatarImage} onClick={handlers.checkUserAndShowModal} style={{ cursor: "pointer" }} />
                    <Button id="logout-button" icon={<LogoutOutlined />} type="text" onClick={handlers.handleLogout}>Đăng xuất</Button>
                    {/* Sử dụng startIntroTour trực tiếp */}
                    <Button icon={<QuestionCircleOutlined />} type="primary" ghost onClick={startIntroTour}>Hướng dẫn</Button>
                </div>
            </Header>

            {/* Content */}
            <Content className="lab-management-content" style={{ padding: "24px", background: isDarkMode ? '#141414' : '#f0f2f5' }}>
                {state.loadError && state.loadError.type !== 'auth' && (
                    <Result status="error" title="Lỗi Tải Dữ Liệu" subTitle={state.loadError.message || "Đã có lỗi xảy ra khi tải dữ liệu phòng máy."} />
                )}

                {!state.loadError && (
                    <div style={{ background: isDarkMode ? '#1f1f1f' : '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                        <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-gray-500 mb-6" style={{ color: isDarkMode ? '#aaa' : '#666' }}>
                            <Dropdown overlay={homeDropdownMenu} placement="bottomLeft" trigger={['hover']}>
                                <a
                                    onClick={(e) => e.preventDefault()} // Prevent default navigation of <a> tag
                                    className="flex items-center hover:text-primary"
                                    style={{ cursor: 'pointer' }} // Indicate it's clickable
                                >
                                    <HomeOutlined className="h-4 w-4" />
                                    <span className="ml-1">Trang chủ</span>
                                </a>
                            </Dropdown>
                            <span>/</span> <span className="font-medium" style={{ color: isDarkMode ? '#ddd' : '#333' }}>Quản lý phòng máy</span>
                        </nav>

                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Input
                                    id="search-input"
                                    placeholder="Tìm kiếm phòng..."
                                    value={state.search}
                                    onChange={(e) => handlers.handleSearchChange(e.target.value)}
                                    style={{ width: 200 }}
                                    onPressEnter={() => { if (state.search && state.selectedColumn) handlers.performSearch(state.search, state.selectedColumn); }}
                                    allowClear
                                />
                                {state.showColumnSelect && (
                                    <Select
                                        id="column-select"
                                        placeholder="Tìm theo"
                                        value={state.selectedColumn}
                                        style={{ width: 120 }}
                                        onChange={handlers.handleColumnSelect}
                                        aria-label="Chọn cột tìm kiếm"
                                    >
                                        <Option value="ten_phong">Tên phòng</Option>
                                        <Option value="so_may">Số máy</Option>
                                        <Option value="mo_ta">Mô tả</Option>
                                        <Option value="trang_thai">Trạng thái</Option>
                                    </Select>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button id="qr-code-button" icon={<QrcodeOutlined />} onClick={handlers.fetchLabRoomsForQrCode}>Mã QR</Button>
                                <Button id="export-pdf-button" onClick={exportToPDF} >Xuất PDF</Button>
                                <Button id="export-excel-button" onClick={exportToExcel} >Xuất Excel</Button>
                                {!isTeacherRole && (
                                    <Dropdown id="create-new-dropdown" overlay={menu} placement="bottomRight" arrow>
                                        <Button type="primary" icon={<PlusOutlined />}>Tạo mới</Button>
                                    </Dropdown>
                                )}
                            </div>
                        </div>

                        <h1 className="text-xl font-semibold mb-4" style={{ color: isDarkMode ? '#eee' : '#333' }}>Danh sách phòng học</h1>

                        <div className="border rounded-lg overflow-x-auto mb-4" style={{ borderColor: isDarkMode ? '#444' : '#f0f0f0' }}>
                            <Table
                                rowSelection={!isTeacherRole ? { type: "checkbox", selectedRowKeys: state.selectedRowKeys, onChange: handlers.onSelectChange } : undefined}
                                columns={columns}
                                dataSource={state.labRooms}
                                rowKey="maPhong"
                                loading={state.tableLoading}
                                pagination={{
                                    current: state.pagination.current,
                                    pageSize: state.pagination.pageSize,
                                    total: (state.filteredLabRooms !== null ? state.filteredLabRooms.length : state.initialLabRooms.length),
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    pageSizeOptions: ['10', '20', '50', '100'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} phòng`,
                                    position: ['bottomRight'],
                                }}
                                onChange={handlers.handleTableChange}
                                scroll={{ x: 1000 }}
                                sticky
                            />
                        </div>

                        {!isTeacherRole && state.hasSelected && (
                            <Button
                                id="delete-selected-button"
                                type="primary" danger
                                onClick={handlers.confirmDeleteMultiple}
                                disabled={state.tableLoading}
                                icon={<DeleteOutlined />}
                                style={{ marginTop: '10px' }}
                            >
                                Xóa ({state.selectedRowKeys.length}) phòng đã chọn
                            </Button>
                        )}
                    </div>
                )}

                {/* --- Modals (Giữ nguyên) --- */}

                {/* QR Code Modal */}
                <Modal
                    title="Mã QR Thống Kê Phòng Máy"
                    visible={state.qrModal.visible}
                    onCancel={handlers.handleCancelQrModal}
                    footer={[<Button key="back" onClick={handlers.handleCancelQrModal}>Đóng</Button>]}
                    centered
                >
                    <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                        {state.qrModal.loading ? <Spin size="large" /> :
                            state.qrModal.qrError ? <Result status="error" title="Lỗi tạo QR" subTitle={state.qrModal.qrError} /> :
                                <QRCode value={state.qrModal.value || 'Không có dữ liệu'} size={256} bgColor="#fff" />}
                    </div>
                </Modal>

                {/* Status Detail Modal (Computers & Devices) */}
                <Modal
                    title={`Trạng thái Phòng ${state.statusModal.roomName || '...'}`}
                    visible={state.statusModal.visible}
                    onCancel={handlers.handleStatusModalClose}
                    width={800}
                    bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
                    footer={[
                        <Button key="close" onClick={handlers.handleStatusModalClose}>Đóng</Button>,
                        state.statusModal.activeTab === 'computers' &&
                        !state.statusModal.loadingComputers &&
                        state.statusModal.computers?.length > 0 && (
                            <Button key="updateComp" type="primary" onClick={handlers.handleOpenUpdateModal}>Cập nhật máy tính</Button>
                        )
                    ]}
                >
                    <Tabs activeKey={state.statusModal.activeTab} onChange={handlers.handleTabChange} type="card">
                        <TabPane tab="Máy tính" key="computers">
                            {state.statusModal.loadingComputers ? (
                                <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Đang tải máy tính..." /></div>
                            ) : (
                                <RenderGroupedItemsComponent
                                    items={state.statusModal.computers}
                                    isComputerTab={true}
                                    onComputerIconRightClick={handleComputerIconRightClick}
                                    onDeviceIconRightClick={null}
                                />
                            )}
                        </TabPane>
                        {!state.statusModal.loadingDeviceTypes && state.statusModal.deviceTypes.map(loai => (
                            <TabPane tab={loai.tenLoai || `Loại ${loai.maLoai}`} key={String(loai.maLoai)}>
                                {state.statusModal.loadingDevices ? (
                                    <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={`Đang tải ${loai.tenLoai}...`} /></div>
                                ) : (
                                    state.statusModal.currentDevices && state.statusModal.currentDevices.length > 0 ? (
                                        <>
                                            <RenderGroupedItemsComponent
                                                items={state.statusModal.currentDevices}
                                                isComputerTab={false}
                                                onComputerIconRightClick={null}
                                                onDeviceIconRightClick={handleDeviceIconRightClick}
                                            />
                                            <div style={{ textAlign: 'right', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                                                <Button
                                                    key={`updateDev-${loai.maLoai}`}
                                                    type="primary"
                                                    onClick={() => handlers.handleOpenDeviceUpdateModal(loai.maLoai, loai.tenLoai)}
                                                >
                                                    Cập nhật {loai.tenLoai}
                                                </Button>
                                            </div>
                                        </>
                                    ) : (<p style={{ textAlign: 'center', padding: '30px 0', color: '#888' }}>Không có {loai.tenLoai} trong phòng này.</p>)
                                )}
                            </TabPane>
                        ))}
                        {state.statusModal.loadingDeviceTypes && <TabPane tab={<Spin size="small" />} key="loading_types" disabled />}
                    </Tabs>

                    {contextMenuVisible && (
                        <div
                            ref={contextMenuRef}
                            className="custom-context-menu"
                            style={{
                                position: 'fixed', top: contextMenuPosition.y, left: contextMenuPosition.x, zIndex: 1050,
                                background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px',
                                padding: '4px 0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <div
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                                className="hover:bg-gray-100"
                                onClick={handleContextMenuViewDetail}
                            >
                                <InfoCircleOutlined style={{ marginRight: '8px' }} /> Xem chi tiết
                            </div>
                        </div>
                    )}
                    {deviceContextMenuVisible && (
                        <div
                            ref={deviceContextMenuRef}
                            className="custom-context-menu"
                            style={{
                                position: 'fixed', top: deviceContextMenuPosition.y, left: deviceContextMenuPosition.x, zIndex: 1050,
                                background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px',
                                padding: '4px 0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <div
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                                className="hover:bg-gray-100"
                                onClick={handleContextMenuDeviceViewDetail}
                            >
                                <InfoCircleOutlined style={{ marginRight: '8px' }} /> Xem chi tiết
                            </div>
                        </div>
                    )}
                </Modal>


                {/* Computer Update Modal */}
                <Modal
                    title={`Cập nhật trạng thái Máy tính - Phòng ${state.statusModal.roomName || '...'}`}
                    visible={state.computerUpdateModal.visible}
                    onCancel={handlers.handleComputerUpdateModalClose}
                    width={700}
                    bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                    footer={[
                        <Button key="cancelCU" onClick={handlers.handleComputerUpdateModalClose} disabled={state.computerUpdateModal.updating}>Hủy</Button>,
                        !(isTeacherRole && state.computerUpdateModal.roomStatusForUpdate === 'Trống') && (
                            <Button
                                key="changeAllBroken"
                                onClick={handlers.handleChangeAllBroken}
                                type={state.computerUpdateModal.isChangeAllBrokenActive ? "default" : "primary"}
                                danger={state.computerUpdateModal.isChangeAllBrokenActive}
                                disabled={state.computerUpdateModal.updating}
                            >
                                {state.computerUpdateModal.isChangeAllBrokenActive ? "Bỏ chọn tất cả báo hỏng" : "Chọn tất cả báo hỏng"}
                            </Button>
                        ),
                        <Button
                            key="submitCU"
                            type="primary"
                            loading={state.computerUpdateModal.updating}
                            onClick={handlers.handleCompleteComputerUpdate}
                        >
                            Hoàn tất cập nhật
                        </Button>,
                    ]}
                    maskClosable={!state.computerUpdateModal.updating}
                    keyboard={!state.computerUpdateModal.updating}
                >
                    <Spin spinning={state.computerUpdateModal.updating} tip="Đang xử lý...">
                        {isTeacherRole && state.computerUpdateModal.roomStatusForUpdate === 'Trống' ? (
                            <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center', color: '#888' }}>Chỉ có thể chọn các máy đang ở trạng thái '{BROKEN_STATUS}' để chuyển thành '{ACTIVE_STATUS}'.</p>
                        ) : (
                            <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center', color: '#888' }}>Tick chọn để thay đổi trạng thái điểm danh hoặc báo hỏng. Máy '{BROKEN_STATUS}' không thể thay đổi.</p>
                        )}
                        <Table
                            columns={computerUpdateColumns}
                            dataSource={state.statusModal.computers}
                            rowKey="maMay"
                            pagination={false}
                            size="small"
                            scroll={{ y: 'calc(60vh - 180px)' }}
                        />
                    </Spin>
                </Modal>

                {/* Device Update Modal */}
                <Modal title={`Cập nhật trạng thái ${state.deviceUpdateModal.currentType.tenLoai || 'Thiết bị'} - Phòng ${state.statusModal.roomName}`} visible={state.deviceUpdateModal.visible} onCancel={handlers.handleDeviceUpdateModalClose} width={700} bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }} footer={[
                    <Button key="cancelDU" onClick={handlers.handleDeviceUpdateModalClose} disabled={state.deviceUpdateModal.updating}>Hủy</Button>,
                    <Button key="submitDU" type="primary" loading={state.deviceUpdateModal.updating} onClick={handlers.handleCompleteDeviceUpdate}>Hoàn tất cập nhật</Button>,
                ]} maskClosable={state.deviceUpdateModal.updating} keyboard={!state.deviceUpdateModal.updating}>
                    <Spin spinning={state.deviceUpdateModal.updating} tip="Đang cập nhật...">
                        <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center' }}>Tick/Untick để đổi trạng thái. Thiết bị 'Đã hỏng' không đổi được.</p>
                        <Table columns={deviceUpdateColumns} dataSource={state.statusModal.currentDevices} rowKey="maThietBi" pagination={false} size="small" scroll={{ y: 'calc(60vh - 160px)' }}/>
                    </Spin>
                </Modal>

                {/* Computer Detail Modal */}
                <Modal
                    title={`Chi tiết Máy tính - ${state.computerDetailModal.computerDetail?.tenMay || `Máy ${state.computerDetailModal.computerDetail?.maMay}` || '...'}`}
                    visible={state.computerDetailModal.visible}
                    onCancel={handlers.handleComputerDetailModalClose}
                    footer={[<Button key="back" onClick={handlers.handleComputerDetailModalClose}>Đóng</Button>]}
                    centered
                >
                    <Spin spinning={state.computerDetailModal.detailLoading} tip="Đang tải chi tiết...">
                        {state.computerDetailModal.detailError ? (
                            <Result status="error" title="Lỗi tải chi tiết" subTitle={state.computerDetailModal.detailError} />
                        ) : state.computerDetailModal.computerDetail ? (
                            <div>
                                <p><strong>Mã Máy:</strong> {state.computerDetailModal.computerDetail.maMay}</p>
                                <p><strong>Tên Máy:</strong> {state.computerDetailModal.computerDetail.tenMay || '(Chưa có tên)'}</p>
                                <p><strong>Trạng Thái:</strong> <span style={{ color: getDeviceStatusColor(state.computerDetailModal.computerDetail.trangThai), fontWeight: 'bold' }}>{state.computerDetailModal.computerDetail.trangThai}</span></p>
                                <p><strong>Mô Tả:</strong> {state.computerDetailModal.computerDetail.moTa || 'Không có'}</p>
                                <p><strong>Ngày Lắp Đặt:</strong> {state.computerDetailModal.computerDetail.ngayLapDat ? new Date(state.computerDetailModal.computerDetail.ngayLapDat).toLocaleDateString() : 'Không có'}</p>
                                <p><strong>Ngày Cập Nhật:</strong> {state.computerDetailModal.computerDetail.ngayCapNhat ? new Date(state.computerDetailModal.computerDetail.ngayCapNhat).toLocaleDateString() : 'Không có'}</p>
                            </div>
                        ) : (
                            <p>Không có dữ liệu chi tiết.</p>
                        )}
                    </Spin>
                </Modal>

                {/* Device Detail Modal */}
                <Modal
                    title={`Chi tiết Thiết bị - ${state.deviceDetailModal.deviceDetail?.tenThietBi || `TB ${state.deviceDetailModal.deviceDetail?.maThietBi}` || '...'}`}
                    visible={state.deviceDetailModal.visible}
                    onCancel={handlers.handleDeviceDetailModalClose}
                    footer={[<Button key="back" onClick={handlers.handleDeviceDetailModalClose}>Đóng</Button>]}
                    centered
                >
                    <Spin spinning={state.deviceDetailModal.detailLoading} tip="Đang tải chi tiết...">
                        {state.deviceDetailModal.detailError ? (
                            <Result status="error" title="Lỗi tải chi tiết" subTitle={state.deviceDetailModal.detailError} />
                        ) : state.deviceDetailModal.deviceDetail ? (
                            <div>
                                <p><strong>Mã Thiết Bị:</strong> {state.deviceDetailModal.deviceDetail.maThietBi}</p>
                                <p><strong>Tên Thiết Bị:</strong> {state.deviceDetailModal.deviceDetail.tenThietBi || '(Chưa có tên)'}</p>
                                <p><strong>Loại:</strong> {state.deviceDetailModal.deviceDetail.loaiThietBi?.tenLoai || 'Không rõ'}</p>
                                <p><strong>Trạng Thái:</strong> <span style={{ color: getDeviceStatusColor(state.deviceDetailModal.deviceDetail.trangThai), fontWeight: 'bold' }}>{state.deviceDetailModal.deviceDetail.trangThai}</span></p>
                                <p><strong>Mô Tả:</strong> {state.deviceDetailModal.deviceDetail.moTa || 'Không có'}</p>
                                <p><strong>Ngày Lắp Đặt:</strong> {state.deviceDetailModal.deviceDetail.ngayLapDat ? new Date(state.deviceDetailModal.deviceDetail.ngayLapDat).toLocaleDateString() : 'Không có'}</p>
                                <p><strong>Ngày Cập Nhật:</strong> {state.deviceDetailModal.deviceDetail.ngayCapNhat ? new Date(state.deviceDetailModal.deviceDetail.ngayCapNhat).toLocaleDateString() : 'Không có'}</p>
                            </div>
                        ) : (
                            <p>Không có dữ liệu chi tiết.</p>
                        )}
                    </Spin>
                </Modal>


                {/* User Profile Modal */}
                <Modal
                    title="Hồ sơ người dùng"
                    visible={state.userProfileModal.visible}
                    confirmLoading={state.userProfileModal.updating}
                    onOk={handlers.handleUserProfileUpdate}
                    onCancel={handlers.handleUserProfileModalCancel}
                    okText="Cập Nhật"
                    cancelText="Đóng"
                    maskClosable={!state.userProfileModal.updating}
                    keyboard={!state.userProfileModal.updating}
                >
                    <Spin spinning={state.userProfileModal.loading} tip="Đang tải hồ sơ...">
                        {!state.userProfileModal.loading && (
                            <Form form={form} layout="vertical">
                                <Form.Item label="Tên Đăng Nhập" name="tenDangNhap" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}><Input readOnly /></Form.Item>
                                <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}><Input /></Form.Item>
                                <Form.Item name="image" label="Ảnh đại diện" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                                    <Dragger
                                        name="file"
                                        multiple={false}
                                        beforeUpload={() => false}
                                        listType="picture"
                                        accept="image/*"
                                        maxCount={1}
                                    >
                                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                        <p className="ant-upload-text">Nhấn hoặc kéo file ảnh vào đây</p>
                                        <p className="ant-upload-hint">Chỉ hỗ trợ upload một file ảnh.</p>
                                    </Dragger>
                                </Form.Item>
                                <Form.Item label="Vai trò">
                                    <Input value={state.userProfileModal.profile?.quyen?.tenQuyen || state.userProfileModal.profile?.role} readOnly />
                                </Form.Item>
                            </Form>
                        )}
                    </Spin>
                </Modal>

            </Content>
        </Layout>
    );
}