// src/PhongMay/LabManagement.js

import React, { useState, useEffect, useReducer, useMemo, useRef } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import {
    Layout, Button, Input, Select, Table, Checkbox, Dropdown, Menu,
    Modal, QRCode, Avatar, Form, Upload, Spin, Tabs, Result, message
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
import 'intro.js/introjs.css'; // Make sure path is correct
import introJs from 'intro.js'; // Import intro.js library

// Internal Imports (adjust paths as needed)
import { labManagementReducer, initialState } from '../Reducer/labManagementReducer'; // Adjust path
import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from './action'; // Adjust path
// *** Import the updated handler factory ***
import { createLabManagementHandlers } from './phongmayHandler'; // Adjust path

const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;
const { Dragger } = Upload;

// --- UI Helpers ---
const getDeviceStatusColor = (status) => {
    if (status === BROKEN_STATUS) return '#ff4d4f'; // Red for broken
    if (status === ACTIVE_STATUS) return '#52c41a'; // Green for active
    return '#bfbfbf'; // Gray for inactive/other
};
const getDeviceIcon = (deviceName) => {
    const lowerName = deviceName?.toLowerCase() || '';
    // Add more specific icons if needed
    if (lowerName.includes('máy lạnh') || lowerName.includes('điều hòa')) return <ToolOutlined />;
    if (lowerName.includes('máy chiếu')) return <DesktopOutlined />; // Or a projector icon if available
    if (lowerName.includes('quạt')) return <ToolOutlined />; // Or a fan icon
    return <ToolOutlined />; // Default tool icon
};

const RenderGroupedItemsComponent = ({ items, isComputerTab = false, onComputerIconRightClick, onDeviceIconRightClick }) => {
    if (!items || items.length === 0) return <p style={{ textAlign: 'center', padding: '20px 0', color: '#888' }}>Không có dữ liệu.</p>;

    const renderItem = (item) => (
        <div
            key={isComputerTab ? item.maMay : item.maThietBi}
            style={{ textAlign: 'center', width: '100px', padding: '10px', borderRadius: '4px', userSelect: 'none', cursor: 'context-menu' }} // Prevent selection, indicate context menu
            onContextMenu={(e) => {
                e.preventDefault(); // Prevent default context menu
                if (isComputerTab && onComputerIconRightClick) {
                    onComputerIconRightClick(e, item); // Pass event and item
                } else if (!isComputerTab && onDeviceIconRightClick) {
                    onDeviceIconRightClick(e, item); // Pass event and item
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
            {/* Display (GV) tag more prominently if needed */}
            {isComputerTab && (item.moTa?.toLowerCase().includes('gv') || item.moTa?.toLowerCase().includes('giáo viên')) && (
                <div style={{ fontSize: '0.7rem', fontStyle: 'italic', color: '#1890ff' }}>(GV)</div>
            )}
        </div>
    );

    // Group computers by Teacher (GV) and Others
    const renderComputerGroups = () => {
        const teacherComputers = items.filter(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
        const otherComputers = items.filter(m => !(m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')));

        // Check if grouping is necessary
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
            {/* Render grouped or single list */}
            {isComputerTab ? renderComputerGroups() : (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                    {items.map(renderItem)}
                </div>
            )}

            {/* Legend */}
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
    const navigate = useNavigate(); // Crucial for handlers
    const [form] = Form.useForm(); // For user profile modal
    const [state, dispatch] = useReducer(labManagementReducer, initialState);
    const [avatarImage, setAvatarImage] = useState(null); // For header avatar
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Context Menu State
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
    const [contextMenuComputerId, setContextMenuComputerId] = useState(null);
    const [deviceContextMenuVisible, setDeviceContextMenuVisible] = useState(false);
    const [deviceContextMenuPosition, setDeviceContextMenuPosition] = useState({ x: 0, y: 0 });
    const [deviceContextMenuDeviceId, setDeviceContextMenuDeviceId] = useState(null);

    const contextMenuRef = useRef(null);
    const deviceContextMenuRef = useRef(null);

    // *** Initialize Handlers using the factory, passing necessary dependencies ***
    const handlers = useMemo(() => createLabManagementHandlers({
        dispatch,
        state,
        navigate, // Pass navigate
        form,     // Pass form instance
        setAvatarImage // Pass avatar setter
    }), [dispatch, state, navigate, form, setAvatarImage]); // Add dependencies


    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            { element: '#search-input', intro: 'Nhập tên phòng hoặc thông tin liên quan để tìm kiếm.', position: 'bottom-start' },
            { element: '#column-select', intro: 'Chọn cột bạn muốn tìm kiếm (Tên phòng, Số máy, Mô tả, Trạng thái).', position: 'bottom-start' },
            { element: '#qr-code-button', intro: 'Tạo mã QR để thống kê nhanh thông tin phòng máy.', position: 'bottom-start' },
            { element: '#export-pdf-button', intro: 'Xuất danh sách phòng máy ra file PDF.', position: 'bottom-start' },
            { element: '#export-excel-button', intro: 'Xuất danh sách phòng máy ra file Excel.', position: 'bottom-start' },
            { element: '#create-new-dropdown', intro: 'Tạo phòng máy mới bằng form hoặc import từ file.', position: 'bottom-start' },
            { element: '.ant-table-thead > tr > th:nth-child(3)', intro: 'Click vào đây để sắp xếp danh sách phòng máy theo tên phòng.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(5)', intro: 'Click vào đây để sắp xếp danh sách phòng máy theo số lượng máy.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(6)', intro: 'Click vào đây để sắp xếp danh sách phòng máy theo trạng thái hoạt động.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:last-child', intro: 'Tại cột này, bạn có thể chỉnh sửa, xóa phòng máy hoặc xem trạng thái chi tiết.', position: 'left' },
            // Make sure #delete-selected-button exists or Intro.js might skip/error
            { element: '#delete-selected-button', intro: 'Xóa các phòng máy đã được chọn (tick vào checkbox).', position: 'top-end' },
            { element: '#dark-mode-button', intro: 'Bật/tắt chế độ Dark Mode.', position: 'bottom-end' },
            { element: '#user-avatar', intro: 'Xem và chỉnh sửa thông tin hồ sơ người dùng.', position: 'bottom-end' },
            { element: '#logout-button', intro: 'Đăng xuất khỏi ứng dụng.', position: 'bottom-end' },
        ];

        introJs().setOptions({
            steps: steps,
            nextLabel: 'Tiếp theo >',
            prevLabel: '< Quay lại',
            doneLabel: 'Hoàn tất',
            // scrollTo: 'element', // Default behavior, usually fine
            overlayOpacity: 0.6,
            exitOnOverlayClick: true,
            showProgress: true,
        }).start();
    };


    // --- Effects ---
    // Load initial data from loader
    useEffect(() => {
        console.log("[LabManagement] Loader Result:", loaderResult);
        if (loaderResult?.error) {
            // Handle specific auth error from loader if needed
            if (loaderResult.type === 'auth') {
                message.error('Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', 5);
                // Optional: Redirect immediately if loader detects auth issue
                // navigate('/login', { replace: true });
            }
            dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: loaderResult });
        } else if (loaderResult?.data) {
            dispatch({ type: ACTIONS.LOAD_DATA_SUCCESS, payload: loaderResult.data });
        } else {
            dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: { error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." } });
        }
    }, [loaderResult, dispatch]); // Removed navigate from here, handled by fetchApi/loader

    // Update displayed data based on pagination, sort, filters
    useEffect(() => {
        dispatch({ type: ACTIONS.UPDATE_DISPLAYED_DATA });
    }, [state.pagination, state.sortInfo, state.initialLabRooms, state.filteredLabRooms, dispatch]);

    // Dark Mode cleanup
    useEffect(() => {
        return () => { DarkReader.disable(); };
    }, []);

    // Handle clicks outside context menus
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

    // Periodic token check (silent refresh handled by fetchApi)
    useEffect(() => {
        const intervalId = setInterval(() => {
            if (handlers.isTokenExpired()) {
                console.log("Token check: Expired or nearing expiry. Next API call will attempt refresh.");
            }
        }, 60000); // Check every 60 seconds
        return () => clearInterval(intervalId);
    }, [handlers]); // Depend on handlers object


    // --- Dark Mode Handler ---
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

    // --- Columns Definitions ---
    const columns = useMemo(() => [
        {
            title: (<Checkbox
                // Check/indeterminate logic based on *currently displayed* page data vs selected keys
                checked={state.labRooms.length > 0 && state.labRooms.every(r => state.selectedRowKeys.includes(r.maPhong))}
                indeterminate={state.selectedRowKeys.length > 0 && state.labRooms.some(r => state.selectedRowKeys.includes(r.maPhong)) && !state.labRooms.every(r => state.selectedRowKeys.includes(r.maPhong))}
                onChange={(e) => {
                    const currentPageKeys = state.labRooms.map(r => r.maPhong);
                    const newSelectedKeys = e.target.checked
                        ? [...new Set([...state.selectedRowKeys, ...currentPageKeys])] // Add current page keys to selection
                        : state.selectedRowKeys.filter(k => !currentPageKeys.includes(k)); // Remove current page keys from selection
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
        },
        { title: "STT", key: "stt", width: 60, align: "center", render: (text, record, index) => (state.pagination.current - 1) * state.pagination.pageSize + index + 1 },
        { title: "Tên phòng", dataIndex: "tenPhong", key: "tenPhong", sorter: true, width: 150 },
        { title: "Mô tả", dataIndex: "moTa", key: "moTa", sorter: true, ellipsis: true },
        { title: "Số máy", dataIndex: "soMay", key: "soMay", align: "center", sorter: true, width: 100 },
        { title: "Trạng thái", dataIndex: "trangThai", key: "trangThai", sorter: true, width: 150 },
        {
            title: "Hành động", key: "action", align: "center", width: 120, fixed: 'right', render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button icon={<EditOutlined />} size="small" type="link" onClick={() => navigate(`/editphongmay/${record.maPhong}`)} aria-label={`Sửa phòng ${record.tenPhong}`} />
                    <Button icon={<DeleteOutlined />} size="small" type="link" danger onClick={() => handlers.handleDelete(record)} aria-label={`Xóa phòng ${record.tenPhong}`} />
                    <Button icon={<MessageOutlined />} size="small" type="link" onClick={() => handlers.showComputerStatusModal(record)} aria-label={`Xem trạng thái phòng ${record.tenPhong}`} />
                </div>
            )
        },
    ], [state.labRooms, state.selectedRowKeys, state.pagination, handlers, navigate]); // Include all dependencies

    // Columns for Computer Update Modal
    const computerUpdateColumns = useMemo(() => {
        const role = state.computerUpdateModal.userRole; // Get role from modal state
        const isRole3 = role === '3';
        const roomStatusForUpdate = state.computerUpdateModal.roomStatusForUpdate;

        return [
            { title: 'Tên máy', dataIndex: 'tenMay', key: 'tenMay', render: (text, record) => { const n = text || `Máy ${record.maMay}`; return (record.moTa?.toLowerCase().includes('gv')||record.moTa?.toLowerCase().includes('giáo viên'))?`${n} (GV)`:n; }},
            { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (status) => (<span style={{ fontWeight: 'bold', color: getDeviceStatusColor(status) }}>{status}</span>)},
            // Conditional columns based on role and room status
            ...(isRole3 && roomStatusForUpdate === 'Trống' ? [ // Columns for Role 3 in "Trống" room
                { title: 'Sửa chữa (Hỏng -> Hoạt động)', key: 'fixBroken', align: 'center', width: '25%', render: (text, record) => {
                        // Only show checkbox for BROKEN machines
                        if (record.trangThai !== BROKEN_STATUS) return <span style={{ fontStyle: 'italic', color: '#888' }}>-</span>;
                        return (<Checkbox
                            checked={state.computerUpdateModal.attendanceKeys.includes(record.maMay)} // Use attendanceKeys for this toggle
                            onChange={() => handlers.toggleComputerAttendanceSelection(record.maMay, record.trangThai)}
                            aria-label={`Chọn sửa máy ${record.tenMay || record.maMay}`}
                        />);
                    }}
            ] : [ // Columns for other roles or non-"Trống" rooms
                { title: 'Điểm danh (Hoạt động <-> Không)', key: 'attendance', align: 'center', width: '15%', render: (text, record) => {
                        if (record.trangThai === BROKEN_STATUS) return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Hỏng</span>;
                        // Checked logic represents the *target* state if toggled
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
        state.statusModal.computers, // Depend on computers list for rendering names/status
        handlers // Need handlers for onClick actions
    ]);

    // Columns for Device Update Modal
    const deviceUpdateColumns = useMemo(() => {
        const role = localStorage.getItem("userRole"); // Can get role directly or pass via state
        const isRole3 = role === '3';
        // Get room status from the *statusModal* state, as device update modal doesn't store it separately
        const roomStatusForUpdate = state.statusModal.roomStatus;

        return [
            { title: 'Tên Thiết Bị', dataIndex: 'tenThietBi', key: 'tenThietBi', render: (text, record) => text || `TB ${record.maThietBi}` },
            { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (status) => (<span style={{ fontWeight: 'bold', color: getDeviceStatusColor(status) }}>{status}</span>)},
            // Conditional columns
            ...(isRole3 && roomStatusForUpdate === 'Trống' ? [
                { title: 'Sửa chữa (Hỏng -> Hoạt động)', key: 'fixBrokenDevice', align: 'center', width: '25%', render: (text, record) => {
                        if (record.trangThai !== BROKEN_STATUS) return <span style={{ fontStyle: 'italic', color: '#888' }}>-</span>;
                        return (<Checkbox
                            checked={state.deviceUpdateModal.selectedKeys.includes(record.maThietBi)} // Use selectedKeys for this toggle
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
        state.statusModal.roomStatus, // Depend on actual room status
        state.statusModal.currentDevices, // Depend on device list
        handlers // Need handlers for onClick
    ]);


    // --- Create New Menu ---
    const menu = useMemo(() => (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addphongmay`)}>Tạo mới (form)</Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={() => navigate(`/importfile`)}>Tạo mới (file)</Menu.Item>
        </Menu>
    ), [navigate]);

    // --- Export Functions ---
    const exportToPDF = () => {
        if (!state.labRooms || state.labRooms.length === 0) { message.warning("Không có dữ liệu để xuất PDF."); return; }
        try {
            const doc = new jsPDF();
            // Add font supporting Vietnamese (ensure the font file is available)
            // Example using a built-in font that might have limited support:
            // doc.setFont('helvetica', 'normal'); // Or 'times'
            // For full support, embed a TTF font like Noto Sans:
            // doc.addFont('NotoSansVietnamese-Regular.ttf', 'NotoSansVietnamese', 'normal');
            // doc.setFont('NotoSansVietnamese');
            // Sticking to default for simplicity, may show ??? for Vietnamese chars without embedded font

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
                // Apply styles - use theme or define custom styles
                theme: 'grid', // or 'striped' or 'plain'
                headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
                // styles: { font: 'NotoSansVietnamese' }, // Use embedded font if added
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
            // Set column widths (optional)
            ws['!cols'] = [ { wch: 5 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws, "Danh sách phòng máy");
            XLSX.writeFile(wb, "DanhSachPhongMay.xlsx");
            message.success("Xuất Excel thành công!");
        } catch (error) {
            console.error("Lỗi xuất Excel:", error);
            message.error("Đã xảy ra lỗi khi xuất Excel.");
        }
    };

    // --- Context Menu Handlers ---
    const handleComputerIconRightClick = (event, computer) => {
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setContextMenuComputerId(computer.maMay);
        setContextMenuVisible(true);
        setDeviceContextMenuVisible(false); // Hide other menu
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
        setContextMenuVisible(false); // Hide other menu
    };

    const handleContextMenuDeviceViewDetail = () => {
        setDeviceContextMenuVisible(false);
        if (deviceContextMenuDeviceId) {
            handlers.fetchDeviceDetail(deviceContextMenuDeviceId);
        }
    };


    // --- JSX Return ---
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
                    {/* Pass avatarImage state to src */}
                    <Avatar id="user-avatar" size="large" icon={<UserOutlined />} src={avatarImage} onClick={handlers.checkUserAndShowModal} style={{ cursor: "pointer" }} />
                    <Button id="logout-button" icon={<LogoutOutlined />} type="text" onClick={handlers.handleLogout}>Đăng xuất</Button>
                    <Button icon={<QuestionCircleOutlined />} type="primary" ghost onClick={startIntroTour}>Hướng dẫn</Button>
                </div>
            </Header>

            {/* Content */}
            <Content className="lab-management-content" style={{ padding: "24px", background: isDarkMode ? '#141414' : '#f0f2f5' /* Adjust background based on mode */ }}>
                {/* Display loader error prominently */}
                {state.loadError && state.loadError.type !== 'auth' && (
                    <Result status="error" title="Lỗi Tải Dữ Liệu" subTitle={state.loadError.message || "Đã có lỗi xảy ra khi tải dữ liệu phòng máy."} />
                )}

                {/* Only render main content if no critical load error */}
                {!state.loadError && (
                    <div style={{ background: isDarkMode ? '#1f1f1f' : '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                        {/* Breadcrumb */}
                        <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-gray-500 mb-6" style={{ color: isDarkMode ? '#aaa' : '#666' }}>
                            <a href="/" className="flex items-center hover:text-blue-600">
                                <HomeOutlined className="h-4 w-4" /> <span className="ml-1">Trang chủ</span>
                            </a>
                            <span>/</span> <span className="font-medium" style={{ color: isDarkMode ? '#ddd' : '#333' }}>Quản lý phòng máy</span>
                        </nav>

                        {/* Search and Action Buttons Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            {/* Search Section */}
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
                                {/* Conditional Select */}
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
                            {/* Action Buttons Section */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button id="qr-code-button" icon={<QrcodeOutlined />} onClick={handlers.fetchLabRoomsForQrCode}>Mã QR</Button>
                                <Button id="export-pdf-button" onClick={exportToPDF} >Xuất PDF</Button>
                                <Button id="export-excel-button" onClick={exportToExcel} >Xuất Excel</Button>
                                <Dropdown id="create-new-dropdown" overlay={menu} placement="bottomRight" arrow>
                                    <Button type="primary" icon={<PlusOutlined />}>Tạo mới</Button>
                                </Dropdown>
                            </div>
                        </div>

                        <h1 className="text-xl font-semibold mb-4" style={{ color: isDarkMode ? '#eee' : '#333' }}>Danh sách phòng học</h1>

                        {/* Table Container */}
                        <div className="border rounded-lg overflow-x-auto mb-4" style={{ borderColor: isDarkMode ? '#444' : '#f0f0f0' }}>
                            <Table
                                rowSelection={{ type: "checkbox", selectedRowKeys: state.selectedRowKeys, onChange: handlers.onSelectChange }}
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
                                    position: ['bottomRight'], // Position pagination
                                }}
                                onChange={handlers.handleTableChange} // Handles pagination and sorting
                                scroll={{ x: 1000 }} // Enable horizontal scroll
                                sticky // Make header sticky (optional)
                            />
                        </div>

                        {/* Delete Selected Button - Conditionally Rendered */}
                        {state.hasSelected && (
                            <Button
                                id="delete-selected-button"
                                type="primary" danger
                                onClick={handlers.confirmDeleteMultiple}
                                disabled={state.tableLoading}
                                icon={<DeleteOutlined />}
                                style={{ marginTop: '10px' }} // Add some margin
                            >
                                Xóa ({state.selectedRowKeys.length}) phòng đã chọn
                            </Button>
                        )}
                    </div>
                )}

                {/* --- Modals --- */}

                {/* QR Code Modal */}
                <Modal
                    title="Mã QR Thống Kê Phòng Máy"
                    visible={state.qrModal.visible}
                    onCancel={handlers.handleCancelQrModal}
                    footer={[<Button key="back" onClick={handlers.handleCancelQrModal}>Đóng</Button>]}
                    centered // Center modal vertically
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
                    width={800} // Adjust width as needed
                    bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
                    footer={[
                        <Button key="close" onClick={handlers.handleStatusModalClose}>Đóng</Button>,
                        // Show update button only for Computers tab and if data exists
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
                                    onDeviceIconRightClick={null} // No device handler needed here
                                />
                            )}
                        </TabPane>
                        {/* Dynamically create tabs for Device Types */}
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
                                                onComputerIconRightClick={null} // No computer handler needed here
                                                onDeviceIconRightClick={handleDeviceIconRightClick}
                                            />
                                            {/* Button to open device update modal for this type */}
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
                        {/* Loading indicator for device types */}
                        {state.statusModal.loadingDeviceTypes && <TabPane tab={<Spin size="small" />} key="loading_types" disabled />}
                    </Tabs>

                    {/* Custom Context Menu for Computers */}
                    {contextMenuVisible && (
                        <div
                            ref={contextMenuRef}
                            className="custom-context-menu"
                            style={{
                                position: 'fixed', top: contextMenuPosition.y, left: contextMenuPosition.x, zIndex: 1050, // Higher z-index than modal
                                background: '#fff', border: '1px solid #d9d9d9', borderRadius: '4px',
                                padding: '4px 0', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <div
                                style={{ padding: '8px 16px', cursor: 'pointer' }}
                                className="hover:bg-gray-100" // Simple hover effect
                                onClick={handleContextMenuViewDetail}
                            >
                                <InfoCircleOutlined style={{ marginRight: '8px' }} /> Xem chi tiết
                            </div>
                            {/* Add other actions here if needed */}
                        </div>
                    )}
                    {/* Custom Context Menu for Devices */}
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
                            {/* Add other actions here if needed */}
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
                        // Conditionally render 'Change All Broken' button based on role/status
                        !(state.computerUpdateModal.userRole === '3' && state.computerUpdateModal.roomStatusForUpdate === 'Trống') && (
                            <Button
                                key="changeAllBroken"
                                onClick={handlers.handleChangeAllBroken}
                                type={state.computerUpdateModal.isChangeAllBrokenActive ? "default" : "primary"} // Style indicates active state
                                danger={state.computerUpdateModal.isChangeAllBrokenActive} // Use danger style when active
                                disabled={state.computerUpdateModal.updating}
                            >
                                {state.computerUpdateModal.isChangeAllBrokenActive ? "Bỏ chọn tất cả báo hỏng" : "Chọn tất cả báo hỏng"}
                            </Button>
                        ),
                        // *** This button now triggers the handler that might navigate ***
                        <Button
                            key="submitCU"
                            type="primary"
                            loading={state.computerUpdateModal.updating}
                            onClick={handlers.handleCompleteComputerUpdate} // Use the correct handler
                        >
                            Hoàn tất cập nhật
                        </Button>,
                    ]}
                    maskClosable={!state.computerUpdateModal.updating} // Prevent closing while updating
                    keyboard={!state.computerUpdateModal.updating}
                >
                    <Spin spinning={state.computerUpdateModal.updating} tip="Đang xử lý...">
                        {/* Informational text based on role and room status */}
                        {state.computerUpdateModal.userRole === '3' && state.computerUpdateModal.roomStatusForUpdate === 'Trống' ? (
                            <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center', color: '#888' }}>Chỉ có thể chọn các máy đang ở trạng thái '{BROKEN_STATUS}' để chuyển thành '{ACTIVE_STATUS}'.</p>
                        ) : (
                            <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center', color: '#888' }}>Tick chọn để thay đổi trạng thái điểm danh hoặc báo hỏng. Máy '{BROKEN_STATUS}' không thể thay đổi.</p>
                        )}
                        {/* Computer Update Table */}
                        <Table
                            columns={computerUpdateColumns}
                            dataSource={state.statusModal.computers} // Use data from status modal
                            rowKey="maMay"
                            pagination={false} // No pagination needed here
                            size="small"
                            scroll={{ y: 'calc(60vh - 180px)' }} // Adjust scroll height based on content
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
                                {/* Add more details if available */}
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
                                <p><strong>Loại:</strong> {state.deviceDetailModal.deviceDetail.loaiThietBi?.tenLoai || 'Không rõ'}</p> {/* Assuming loaiThietBi object */}
                                <p><strong>Trạng Thái:</strong> <span style={{ color: getDeviceStatusColor(state.deviceDetailModal.deviceDetail.trangThai), fontWeight: 'bold' }}>{state.deviceDetailModal.deviceDetail.trangThai}</span></p>
                                <p><strong>Mô Tả:</strong> {state.deviceDetailModal.deviceDetail.moTa || 'Không có'}</p>
                                <p><strong>Ngày Lắp Đặt:</strong> {state.deviceDetailModal.deviceDetail.ngayLapDat ? new Date(state.deviceDetailModal.deviceDetail.ngayLapDat).toLocaleDateString() : 'Không có'}</p>
                                <p><strong>Ngày Cập Nhật:</strong> {state.deviceDetailModal.deviceDetail.ngayCapNhat ? new Date(state.deviceDetailModal.deviceDetail.ngayCapNhat).toLocaleDateString() : 'Không có'}</p>
                                {/* Add more details */}
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
                    confirmLoading={state.userProfileModal.updating} // Only show loading on OK button during update
                    onOk={handlers.handleUserProfileUpdate}
                    onCancel={handlers.handleUserProfileModalCancel}
                    okText="Cập Nhật"
                    cancelText="Đóng"
                    maskClosable={!state.userProfileModal.updating} // Prevent close during update
                    keyboard={!state.userProfileModal.updating}
                >
                    {/* Show loading spinner covering the form while initially loading profile data */}
                    <Spin spinning={state.userProfileModal.loading} tip="Đang tải hồ sơ...">
                        {/* Show form only after loading is complete */}
                        {!state.userProfileModal.loading && (
                            <Form form={form} layout="vertical">
                                <Form.Item label="Tên Đăng Nhập" name="tenDangNhap" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}><Input readOnly /></Form.Item> {/* Usually read-only */}
                                <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}><Input /></Form.Item>
                                {/* Avatar Upload */}
                                <Form.Item name="image" label="Ảnh đại diện" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                                    <Dragger
                                        name="file"
                                        multiple={false}
                                        beforeUpload={() => false} // Prevent auto-upload, handle manually
                                        listType="picture"
                                        accept="image/*"
                                        maxCount={1} // Allow only one file
                                    >
                                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                        <p className="ant-upload-text">Nhấn hoặc kéo file ảnh vào đây</p>
                                        <p className="ant-upload-hint">Chỉ hỗ trợ upload một file ảnh.</p>
                                    </Dragger>
                                </Form.Item>
                                {/* Display Role (read-only) */}
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