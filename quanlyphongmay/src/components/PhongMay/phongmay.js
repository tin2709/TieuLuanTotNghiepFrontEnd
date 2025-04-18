import React, { useState, useEffect, useReducer, useMemo, useRef } from "react"; // Import useRef
import { useLoaderData, useNavigate } from "react-router-dom";
import {
    Layout, Button, Input, Select, Table, Checkbox, Dropdown, Menu,
    Modal, QRCode, Avatar, Form, Upload, Spin, Tabs, Result, message
} from "antd";
import {
    HomeOutlined, EditOutlined, DeleteOutlined, MessageOutlined, PlusOutlined,
    FileAddOutlined, LogoutOutlined, QrcodeOutlined, UserOutlined, InboxOutlined,
    DesktopOutlined, ToolOutlined, QuestionCircleOutlined,
    SunOutlined, MoonOutlined
} from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import * as DarkReader from "darkreader";
// Import Intro.js CSS
import 'intro.js/introjs.css'; // Make sure path is correct

// Internal Imports (adjust paths as needed)
import { labManagementReducer, initialState } from '../Reducer/labManagementReducer';
import { ACTIONS, BROKEN_STATUS, ACTIVE_STATUS, INACTIVE_STATUS } from './action';
import { createLabManagementHandlers } from './phongmayHandler';
import introJs from 'intro.js'; // Import intro.js library


const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;
const { Dragger } = Upload;

// --- UI Helpers ---
const getDeviceStatusColor = (status) => {
    if (status === BROKEN_STATUS) return '#ff4d4f';
    if (status === ACTIVE_STATUS) return '#52c41a';
    return '#bfbfbf';
};
const getDeviceIcon = (deviceName) => {
    const lowerName = deviceName?.toLowerCase() || '';
    if (lowerName.includes('máy lạnh') || lowerName.includes('điều hòa')) return <ToolOutlined />;
    if (lowerName.includes('máy chiếu')) return <DesktopOutlined />;
    if (lowerName.includes('quạt')) return <ToolOutlined />;
    return <ToolOutlined />;
};
const RenderGroupedItemsComponent = ({ items, isComputerTab = false, onComputerIconRightClick }) => { // Add onComputerIconRightClick prop
    if (!items || items.length === 0) return null;
    const renderItem = (item) => (
        <div
            key={isComputerTab ? item.maMay : item.maThietBi}
            style={{ textAlign: 'center', width: '100px', padding: '10px', borderRadius: '4px', userSelect: 'none' }} // Prevent text selection on right-click
            onContextMenu={(e) => {
                e.preventDefault(); // Prevent default context menu
                if (isComputerTab && onComputerIconRightClick) {
                    onComputerIconRightClick(e, item); // Call the handler with event and item
                }
            }}
        >
            {React.cloneElement(
                isComputerTab ? <DesktopOutlined /> : getDeviceIcon(item.tenThietBi),
                { style: { fontSize: '3rem', color: getDeviceStatusColor(item.trangThai) } }
            )}
            <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word' }}>
                {isComputerTab ? (item.tenMay || `Máy ${item.maMay}`) : (item.tenThietBi || `TB ${item.maThietBi}`)}
            </div>
            {isComputerTab && (item.moTa?.toLowerCase().includes('gv') || item.moTa?.toLowerCase().includes('giáo viên')) && (
                <div style={{ fontSize: '0.7rem', fontStyle: 'italic' }}>(GV)</div>
            )}
        </div>
    );

    const renderComputerGroups = () => {
        const teacherComputers = items.filter(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
        const otherComputers = items.filter(m => !(m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')));
        return (
            <>
                {teacherComputers.length > 0 && (
                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                        <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>Máy Giáo Viên</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                            {teacherComputers.map(renderItem)}
                        </div>
                    </div>
                )}
                {otherComputers.length > 0 && (
                    <div>
                        {teacherComputers.length > 0 && <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>Máy Sinh Viên / Khác</h4>}
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
            {isComputerTab && items.some(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')) && items.some(m => !(m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')))
                ? renderComputerGroups()
                : (<div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>{items.map(renderItem)}</div>)
            }
            {/* Legend */}
            <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {React.cloneElement(isComputerTab ? <DesktopOutlined /> : <ToolOutlined />, { style: { color: getDeviceStatusColor(INACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' } })}: {INACTIVE_STATUS}
            </span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                 {React.cloneElement(isComputerTab ? <DesktopOutlined /> : <ToolOutlined />, { style: { color: getDeviceStatusColor(ACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' } })}: {ACTIVE_STATUS}
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
    const [contextMenuVisible, setContextMenuVisible] = useState(false); // Context menu visibility state
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 }); // Context menu position state
    const [contextMenuComputerId, setContextMenuComputerId] = useState(null); // Store computer ID for context menu
    const handlers = useMemo(() => createLabManagementHandlers({
        dispatch, state, navigate, form, setAvatarImage
    }), [dispatch, state, navigate, form, setAvatarImage]);
    const contextMenuRef = useRef(null); // Ref for context menu to handle clicks outside

    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            {
                element: '#search-input',
                intro: 'Nhập tên phòng hoặc thông tin liên quan để tìm kiếm.',
                position: 'bottom-start'
            },
            {
                element: '#column-select',
                intro: 'Chọn cột bạn muốn tìm kiếm (Tên phòng, Số máy, Mô tả, Trạng thái).',
                position: 'bottom-start',
                // Intro.js doesn't have direct conditional step display like Driver.js.
                // We can handle visibility in the component itself if needed, or always include and let it be skipped if not rendered.
                // For simplicity, we'll include it always, and if #column-select is not rendered, intro.js will likely skip it.
            },
            {
                element: '#qr-code-button',
                intro: 'Tạo mã QR để thống kê nhanh thông tin phòng máy.',
                position: 'bottom-start'
            },
            {
                element: '#export-pdf-button',
                intro: 'Xuất danh sách phòng máy ra file PDF.',
                position: 'bottom-start'
            },
            {
                element: '#export-excel-button',
                intro: 'Xuất danh sách phòng máy ra file Excel.',
                position: 'bottom-start'
            },
            {
                element: '#create-new-dropdown',
                intro: 'Tạo phòng máy mới bằng form hoặc import từ file.',
                position: 'bottom-start'
            },
            {
                element: '.ant-table-thead > tr > th:nth-child(3)',
                intro: 'Click vào đây để sắp xếp danh sách phòng máy theo tên phòng.',
                position: 'bottom' // Adjust position as needed for table headers
            },
            {
                element: '.ant-table-thead > tr > th:nth-child(5)',
                intro: 'Click vào đây để sắp xếp danh sách phòng máy theo số lượng máy.',
                position: 'bottom'
            },
            {
                element: '.ant-table-thead > tr > th:nth-child(6)',
                intro: 'Click vào đây để sắp xếp danh sách phòng máy theo trạng thái hoạt động.',
                position: 'bottom'
            },
            {
                element: '.ant-table-thead > tr > th:last-child',
                intro: 'Tại cột này, bạn có thể chỉnh sửa, xóa phòng máy hoặc xem trạng thái chi tiết.',
                position: 'left' // Or 'right' depending on layout
            },
            {
                element: '#delete-selected-button',
                intro: 'Xóa các phòng máy đã được chọn (tick vào checkbox).',
                position: 'top-end',
                // Conditional step handling would require checking state before starting intro.js or using callbacks.
                // For now, include it always and it will be skipped if #delete-selected-button is not rendered.
            },
            {
                element: '#dark-mode-button',
                intro: 'Bật/tắt chế độ Dark Mode để bảo vệ mắt khi sử dụng vào ban đêm hoặc trong điều kiện ánh sáng yếu.',
                position: 'bottom-end'
            },
            {
                element: '#user-avatar',
                intro: 'Xem và chỉnh sửa thông tin hồ sơ người dùng của bạn.',
                position: 'bottom-end'
            },
            {
                element: '#logout-button',
                intro: 'Đăng xuất khỏi ứng dụng quản lý phòng máy.',
                position: 'bottom-end'
            },
        ];

        introJs().setOptions({
            steps: steps,
            nextLabel: 'Tiếp theo',
            prevLabel: 'Quay lại',
            doneLabel: 'Hoàn tất',
            scrollTo: 'element',
            overlayOpacity: 0.5,
        }).start();
    };


    // --- Effects ---
    useEffect(() => {
        console.log("[Component] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: loaderResult });
        } else if (loaderResult?.data) {
            dispatch({ type: ACTIONS.LOAD_DATA_SUCCESS, payload: loaderResult.data });
        } else {
            dispatch({ type: ACTIONS.LOAD_DATA_ERROR, payload: { error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." } });
        }
    }, [loaderResult, dispatch]);

    useEffect(() => {
        dispatch({ type: ACTIONS.UPDATE_DISPLAYED_DATA });
    }, [state.pagination, state.sortInfo, state.initialLabRooms, state.filteredLabRooms, dispatch]);

    useEffect(() => {
        return () => {
            DarkReader.disable();
        };
    }, []);

    useEffect(() => {
        const handleClickOutsideContextMenu = (event) => {
            if (contextMenuVisible && contextMenuRef.current && !contextMenuRef.current.contains(event.target)) {
                setContextMenuVisible(false); // Hide context menu on outside click
            }
        };

        document.addEventListener('mousedown', handleClickOutsideContextMenu);
        return () => {
            document.removeEventListener('mousedown', handleClickOutsideContextMenu);
        };
    }, [contextMenuVisible]);

    // --- Dark Mode Handler ---
    const toggleDarkMode = () => {
        setIsDarkMode((prevIsDarkMode) => {
            const nextIsDarkMode = !prevIsDarkMode;
            if (nextIsDarkMode) {
                DarkReader.enable({
                    brightness: 100,
                    contrast: 90,
                    sepia: 10,
                });
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
                checked={state.labRooms.length > 0 && state.labRooms.every(r => state.selectedRowKeys.includes(r.maPhong))}
                indeterminate={state.selectedRowKeys.length > 0 && !state.labRooms.every(r => state.selectedRowKeys.includes(r.maPhong))}
                onChange={(e) => {
                    const currentPageKeys = state.labRooms.map(r => r.maPhong);
                    const newSelectedKeys = e.target.checked
                        ? [...new Set([...state.selectedRowKeys, ...currentPageKeys])]
                        : state.selectedRowKeys.filter(k => !currentPageKeys.includes(k));
                    handlers.onSelectChange(newSelectedKeys);
                }}
            />),
            key: "selection", width: 60, fixed: "left",
            render: (text, record) => <Checkbox checked={state.selectedRowKeys.includes(record.maPhong)} onChange={(e) => {
                const isChecked = e.target.checked;
                const newSelectedKeys = isChecked
                    ? [...state.selectedRowKeys, record.maPhong]
                    : state.selectedRowKeys.filter(key => key !== record.maPhong);
                handlers.onSelectChange(newSelectedKeys);
            }}/>
        },
        { title: "STT", key: "stt", width: 60, render: (text, record, index) => (state.pagination.current - 1) * state.pagination.pageSize + index + 1 },
        { title: "Tên phòng", dataIndex: "tenPhong", key: "tenPhong", sorter: true, width: 150 },
        { title: "Mô tả", dataIndex: "moTa", key: "moTa", sorter: true, ellipsis: true },
        { title: "Số máy", dataIndex: "soMay", key: "soMay", align: "center", sorter: true, width: 100 },
        { title: "Trạng thái", dataIndex: "trangThai", key: "trangThai", sorter: true, width: 150 },
        { title: "Hành động", key: "action", align: "center", width: 120, fixed: 'right', render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button icon={<EditOutlined />} size="small" type="link" onClick={() => navigate(`/editphongmay/${record.maPhong}`)} aria-label={`Sửa phòng ${record.tenPhong}`} />
                    <Button icon={<DeleteOutlined />} size="small" type="link" danger onClick={() => handlers.handleDelete(record)} aria-label={`Xóa phòng ${record.tenPhong}`} />
                    <Button icon={<MessageOutlined />} size="small" type="link" onClick={() => handlers.showComputerStatusModal(record.maPhong, record.tenPhong)} aria-label={`Xem trạng thái phòng ${record.tenPhong}`} />
                </div>
            )},
    ], [state.labRooms, state.selectedRowKeys, state.pagination, handlers, navigate]);

    const computerUpdateColumns = useMemo(() => [
        { title: 'Tên máy', dataIndex: 'tenMay', key: 'tenMay', render: (text, record) => { const n = text || `Máy ${record.maMay}`; return (record.moTa?.toLowerCase().includes('gv')||record.moTa?.toLowerCase().includes('giáo viên'))?`${n} (GV)`:n; }},
        { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (status) => (<span style={{ fontWeight: 'bold', color: getDeviceStatusColor(status) }}>{status}</span>)},
        { title: 'Điểm danh', key: 'action', align: 'center', render: (text, record) => {
                if (record.trangThai === BROKEN_STATUS) return <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>Hỏng</span>;
                const isToggled = state.computerUpdateModal.selectedKeys.includes(record.maMay);
                const currentChecked = (record.trangThai === ACTIVE_STATUS) !== isToggled;
                return (<Checkbox checked={currentChecked} onChange={() => handlers.toggleComputerUpdateSelection(record.maMay)} />);
            }},
    ], [state.computerUpdateModal.selectedKeys, handlers]);

    const deviceUpdateColumns = useMemo(() => [
        { title: 'Tên Thiết Bị', dataIndex: 'tenThietBi', key: 'tenThietBi', render: (text, record) => text || `TB ${record.maThietBi}` },
        { title: 'Trạng thái', dataIndex: 'trangThai', key: 'trangThai', render: (status) => (<span style={{ fontWeight: 'bold', color: getDeviceStatusColor(status) }}>{status}</span>)},
        { title: 'Thay đổi', key: 'action', align: 'center', width: '25%', render: (text, record) => {
                if (record.trangThai === BROKEN_STATUS) return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Hỏng</span>;
                const isToggled = state.deviceUpdateModal.selectedKeys.includes(record.maThietBi);
                const currentChecked = (record.trangThai === ACTIVE_STATUS) !== isToggled;
                return (<Checkbox checked={currentChecked} onChange={() => handlers.toggleDeviceUpdateSelection(record.maThietBi)} />);
            }},
    ], [state.deviceUpdateModal.selectedKeys, handlers]);

    // --- Create New Menu ---
    const menu = useMemo(() => (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addphongmay`)}>Tạo mới (form)</Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={() => navigate(`/importfile`)}>Tạo mới (file)</Menu.Item>
        </Menu>
    ), [navigate]);

    // --- Export Functions ---
    const exportToPDF = () => {
        if (!state.labRooms || state.labRooms.length === 0) { message.warning("Không có dữ liệu."); return; }
        const doc = new jsPDF();
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');
        doc.text("Danh sách phòng máy", 14, 10);
        doc.autoTable({
            head: [["STT", "Tên phòng", "Mô tả", "Số máy", "Trạng thái"]],
            body: state.labRooms.map((room, index) => [
                (state.pagination.current - 1) * state.pagination.pageSize + index + 1,
                room.tenPhong, room.moTa, room.soMay, room.trangThai,
            ]),
            styles: { font: "Roboto", fontStyle: 'normal' },
            headStyles: { fontStyle: 'bold', fillColor: [41, 128, 185], textColor: 255 },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });
        doc.save("DanhSachPhongMay.pdf");
    };

    const exportToExcel = () => {
        if (!state.labRooms || state.labRooms.length === 0) { message.warning("Không có dữ liệu."); return; }
        const dataToExport = state.labRooms.map((room, index) => ({
            'STT': (state.pagination.current - 1) * state.pagination.pageSize + index + 1,
            'Tên phòng': room.tenPhong,
            'Mô tả': room.moTa,
            'Số máy': room.soMay,
            'Trạng thái': room.trangThai,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        ws['!cols'] = [ { wch: 5 }, { wch: 25 }, { wch: 40 }, { wch: 10 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, "Danh sách phòng máy");
        XLSX.writeFile(wb, "DanhSachPhongMay.xlsx");
    };

    const handleComputerIconRightClick = (event, computer) => {
        setContextMenuPosition({ x: event.clientX, y: event.clientY });
        setContextMenuComputerId(computer.maMay);
        setContextMenuVisible(true);
    };

    const handleContextMenuViewDetail = () => {
        setContextMenuVisible(false); // Hide context menu
        handlers.fetchComputerDetail(contextMenuComputerId); // Fetch details for the clicked computer
    };


    // --- JSX Return ---
    return (
        <Layout className="lab-management-layout">
            {/* Header */}
            <Header className="lab-management-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: "0 24px", borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#1890ff" }}>Quản Lý Phòng Máy</div>
                <div className="actions" style={{ display: "flex", alignItems: "center" }}>
                    <Button
                        id="dark-mode-button"
                        icon={
                            isDarkMode ? <SunOutlined style={{ color: "yellow" }} /> : <MoonOutlined style={{ color: "black" }} />
                        }
                        onClick={toggleDarkMode}
                        type="text" shape="circle" style={{ fontSize: "20px", marginRight: "10px" }}
                        aria-label={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
                    />
                    <Avatar id="user-avatar" size="large" icon={<UserOutlined />} src={avatarImage} onClick={handlers.checkUserAndShowModal} style={{ cursor: "pointer", marginRight: '10px' }} />
                    <Button id="logout-button" icon={<LogoutOutlined />} type="text" onClick={handlers.handleLogout} style={{ marginLeft: '10px', marginRight: '10px' }}>Đăng xuất</Button>
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour}>Hướng dẫn</Button>
                </div>
            </Header>

            {/* Content */}
            <Content className="lab-management-content" style={{ padding: "24px", background: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
                {state.loadError && state.loadError.type !== 'auth' && (
                    <Result status="error" title="Lỗi Tải Dữ Liệu" subTitle={state.loadError.message || "Đã có lỗi xảy ra khi tải dữ liệu phòng máy."} />
                )}

                {!state.loadError && (
                    <div style={{ background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                        <nav aria-label="breadcrumb" className="flex items-center space-x-1 text-sm text-gray-500 mb-6">
                            <a href="/" className="flex items-center hover:text-blue-600">
                                <HomeOutlined className="h-4 w-4" /> <span className="ml-1">Trang chủ</span>
                            </a>
                            <span>/</span> <span className="font-medium text-gray-700">Quản lý phòng máy</span>
                        </nav>

                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Input id="search-input" placeholder="Tìm kiếm phòng..." value={state.search} onChange={(e) => handlers.handleSearchChange(e.target.value)} style={{ width: 200 }} onPressEnter={() => { if (state.search && state.selectedColumn) handlers.performSearch(state.search, state.selectedColumn); }} allowClear />
                                {state.showColumnSelect && (
                                    <Select id="column-select" placeholder="Theo" value={state.selectedColumn} style={{ width: 120 }} onChange={handlers.handleColumnSelect}>
                                        <Option value="ten_phong">Tên phòng</Option> <Option value="so_may">Số máy</Option> <Option value="mo_ta">Mô tả</Option> <Option value="trang_thai">Trạng thái</Option>
                                    </Select>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Button id="qr-code-button" icon={<QrcodeOutlined />} onClick={handlers.fetchLabRoomsForQrCode}>Mã QR</Button>
                                <Button id="export-pdf-button" onClick={exportToPDF} >Xuất PDF</Button>
                                <Button id="export-excel-button" onClick={exportToExcel} >Xuất Excel</Button>
                                <Dropdown id="create-new-dropdown" overlay={menu} placement="bottomRight" arrow>
                                    <Button type="primary" icon={<PlusOutlined />}>Tạo mới</Button>
                                </Dropdown>
                            </div>
                        </div>

                        <h1 className="text-xl font-semibold mb-4">Danh sách phòng học</h1>

                        <div className="border rounded-lg overflow-x-auto mb-4">
                            <Table
                                rowSelection={{ type: "checkbox", selectedRowKeys: state.selectedRowKeys, onChange: handlers.onSelectChange }}
                                columns={columns}
                                dataSource={state.labRooms}
                                rowKey="maPhong"
                                loading={state.tableLoading}
                                pagination={{
                                    current: state.pagination.current, pageSize: state.pagination.pageSize,
                                    total: (state.filteredLabRooms !== null ? state.filteredLabRooms.length : state.initialLabRooms.length),
                                    showSizeChanger: true, showQuickJumper: true, pageSizeOptions: ['10', '20', '50', '100'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} phòng`,
                                }}
                                onChange={handlers.handleTableChange}
                                scroll={{ x: 1000 }}
                            />
                        </div>

                        {state.hasSelected && (
                            <Button id="delete-selected-button" type="primary" danger onClick={handlers.confirmDeleteMultiple} disabled={state.tableLoading} icon={<DeleteOutlined />}>
                                Xóa ({state.selectedRowKeys.length}) phòng đã chọn
                            </Button>
                        )}
                    </div>
                )}

                {/* Modals */}
                <Modal title="Mã QR Thống Kê Phòng Máy" visible={state.qrModal.visible} onCancel={handlers.handleCancelQrModal} footer={[<Button key="back" onClick={handlers.handleCancelQrModal}>Đóng</Button>]}>
                    <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
                        {state.qrModal.loading ? <Spin size="large" /> : <QRCode value={state.qrModal.value || 'Không có dữ liệu'} size={256} bgColor="#fff" />}
                    </div>
                </Modal>

                <Modal title={`Trạng thái Phòng ${state.statusModal.roomName}`} visible={state.statusModal.visible} onCancel={handlers.handleStatusModalClose} width={800} bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }} footer={[
                    <Button key="close" onClick={handlers.handleStatusModalClose}>Đóng</Button>,
                    state.statusModal.activeTab === 'computers' && !state.statusModal.loadingComputers && state.statusModal.computers?.length > 0 && (
                        <Button key="updateComp" type="primary" onClick={handlers.handleOpenUpdateModal}>Cập nhật trạng thái máy tính</Button>
                    )
                ]}>
                    <Tabs activeKey={state.statusModal.activeTab} onChange={handlers.handleTabChange}>
                        <TabPane tab="Máy tính" key="computers">
                            {state.statusModal.loadingComputers ? (<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip="Đang tải máy tính..." /></div>) : (
                                state.statusModal.computers && state.statusModal.computers.length > 0
                                    ? <RenderGroupedItemsComponent items={state.statusModal.computers} isComputerTab={true} onComputerIconRightClick={handleComputerIconRightClick} /> // Pass right-click handler
                                    : <p style={{ textAlign: 'center', padding: '30px 0' }}>Không có máy tính hoặc không thể tải.</p>
                            )}
                        </TabPane>
                        {!state.statusModal.loadingDeviceTypes && state.statusModal.deviceTypes.map(loai => (
                            <TabPane tab={loai.tenLoai || `Loại ${loai.maLoai}`} key={String(loai.maLoai)}>
                                {state.statusModal.loadingDevices ? (<div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" tip={`Đang tải ${loai.tenLoai}...`} /></div>) : (
                                    state.statusModal.currentDevices && state.statusModal.currentDevices.length > 0 ? (
                                        <>
                                            <RenderGroupedItemsComponent items={state.statusModal.currentDevices} isComputerTab={false} />
                                            <div style={{ textAlign: 'right', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                                                <Button key={`updateDev-${loai.maLoai}`} type="primary" onClick={() => handlers.handleOpenDeviceUpdateModal(loai.maLoai, loai.tenLoai)}>Cập nhật trạng thái {loai.tenLoai}</Button>
                                            </div>
                                        </>
                                    ) : (<p style={{ textAlign: 'center', padding: '30px 0' }}>Không có thiết bị loại "{loai.tenLoai}" hoặc không thể tải.</p>)
                                )}
                            </TabPane>
                        ))}
                        {state.statusModal.loadingDeviceTypes && <TabPane tab={<Spin size="small" />} key="loading_types" disabled />}
                    </Tabs>
                    {/* Custom Context Menu */}
                    {contextMenuVisible && (
                        <div
                            ref={contextMenuRef}
                            className="custom-context-menu"
                            style={{
                                position: 'fixed',
                                top: contextMenuPosition.y,
                                left: contextMenuPosition.x,
                                zIndex: 1000,
                                background: '#fff',
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px',
                                padding: '4px 0',
                                boxShadow: '2px 2px 8px rgba(0, 0, 0, 0.15)',
                            }}
                        >
                            <div
                                style={{ padding: '8px 16px', cursor: 'pointer', hover: { background: '#e6f7ff' } }}
                                onClick={handleContextMenuViewDetail}
                            >
                                Xem chi tiết
                            </div>
                        </div>
                    )}
                </Modal>

                <Modal title={`Cập nhật trạng thái Máy tính - Phòng ${state.statusModal.roomName}`} visible={state.computerUpdateModal.visible} onCancel={handlers.handleComputerUpdateModalClose} width={700} bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }} footer={[
                    <Button key="cancelCU" onClick={handlers.handleComputerUpdateModalClose} disabled={state.computerUpdateModal.updating}>Hủy</Button>,
                    <Button key="submitCU" type="primary" loading={state.computerUpdateModal.updating} onClick={handlers.handleCompleteComputerUpdate}>Hoàn tất cập nhật</Button>,
                ]} maskClosable={!state.computerUpdateModal.updating} keyboard={!state.computerUpdateModal.updating}>
                    <Spin spinning={state.computerUpdateModal.updating} tip="Đang cập nhật...">
                        <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center' }}>Tick/Untick để đổi trạng thái. Máy 'Đã hỏng' không đổi được.</p>
                        <Table columns={computerUpdateColumns} dataSource={state.statusModal.computers} rowKey="maMay" pagination={false} size="small" scroll={{ y: 'calc(60vh - 160px)' }}/>
                    </Spin>
                </Modal>

                <Modal title={`Cập nhật trạng thái ${state.deviceUpdateModal.currentType.tenLoai || 'Thiết bị'} - Phòng ${state.statusModal.roomName}`} visible={state.deviceUpdateModal.visible} onCancel={handlers.handleDeviceUpdateModalClose} width={700} bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }} footer={[
                    <Button key="cancelDU" onClick={handlers.handleDeviceUpdateModalClose} disabled={state.deviceUpdateModal.updating}>Hủy</Button>,
                    <Button key="submitDU" type="primary" loading={state.deviceUpdateModal.updating} onClick={handlers.handleCompleteDeviceUpdate}>Hoàn tất cập nhật</Button>,
                ]} maskClosable={!state.deviceUpdateModal.updating} keyboard={!state.deviceUpdateModal.updating}>
                    <Spin spinning={state.deviceUpdateModal.updating} tip="Đang cập nhật...">
                        <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center' }}>Tick/Untick để đổi trạng thái. Thiết bị 'Đã hỏng' không đổi được.</p>
                        <Table columns={deviceUpdateColumns} dataSource={state.statusModal.currentDevices} rowKey="maThietBi" pagination={false} size="small" scroll={{ y: 'calc(60vh - 160px)' }}/>
                    </Spin>
                </Modal>

                <Modal
                    title={`Chi tiết Máy tính - ${state.computerDetailModal.computerDetail?.tenMay || `Máy ${state.computerDetailModal.computerDetail?.maMay}` || '...'}`}
                    visible={state.computerDetailModal.visible}
                    onCancel={handlers.handleComputerDetailModalClose}
                    footer={[<Button key="back" onClick={handlers.handleComputerDetailModalClose}>Đóng</Button>]}
                >
                    <Spin spinning={state.computerDetailModal.detailLoading} tip="Đang tải chi tiết máy...">
                        {state.computerDetailModal.computerDetail ? (
                            <div>
                                <p><strong>Mã Máy:</strong> {state.computerDetailModal.computerDetail.maMay}</p>
                                <p><strong>Tên Máy:</strong> {state.computerDetailModal.computerDetail.tenMay}</p>
                                <p><strong>Trạng Thái:</strong> {state.computerDetailModal.computerDetail.trangThai}</p>
                                <p><strong>Mô Tả:</strong> {state.computerDetailModal.computerDetail.moTa || 'Không có'}</p>
                                <p><strong>Ngày Lắp Đặt:</strong> {state.computerDetailModal.computerDetail.ngayLapDat ? new Date(state.computerDetailModal.computerDetail.ngayLapDat).toLocaleDateString() : 'Không có'}</p>
                                <p><strong>Ngày Cập Nhật:</strong> {state.computerDetailModal.computerDetail.ngayCapNhat ? new Date(state.computerDetailModal.computerDetail.ngayCapNhat).toLocaleDateString() : 'Không có'}</p>
                            </div>
                        ) : state.computerDetailModal.detailError ? (
                            <Result status="error" title="Lỗi tải chi tiết máy tính" subTitle={state.computerDetailModal.detailError} />
                        ) : (
                            <p>Không có dữ liệu chi tiết.</p>
                        )}
                    </Spin>
                </Modal>


                <Modal title="Hồ sơ người dùng" visible={state.userProfileModal.visible} confirmLoading={state.userProfileModal.updating || state.userProfileModal.loading} onOk={handlers.handleUserProfileUpdate} onCancel={handlers.handleUserProfileModalCancel} okText="Cập Nhật" cancelText="Đóng">
                    <Spin spinning={state.userProfileModal.loading} tip="Đang tải hồ sơ...">
                        <Form form={form} layout="vertical">
                            <Form.Item label="Tên Đăng Nhập" name="tenDangNhap" rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}><Input /></Form.Item>
                            <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}><Input /></Form.Item>
                            <Form.Item name="image" label="Ảnh đại diện" valuePropName="fileList" getValueFromEvent={(e) => Array.isArray(e) ? e : e?.fileList}>
                                <Dragger name="file" multiple={false} beforeUpload={() => false} listType="picture" accept="image/*">
                                    <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                                    <p className="ant-upload-text">Nhấn hoặc kéo file ảnh vào đây</p>
                                    <p className="ant-upload-hint">Chỉ hỗ trợ upload một file ảnh.</p>
                                </Dragger>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Modal>
            </Content>
        </Layout>
    );
}