// src/pages/QuanLyGhiChuMayTinh.js
import React from 'react';
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
    Select,
    Input,
    Row,
    Col,
    Dropdown // Import Dropdown
} from 'antd';
import {
    ToolOutlined,
    SunOutlined,
    MoonOutlined,
    SettingOutlined,
    SearchOutlined,
    ClearOutlined,
    SaveOutlined, // Import for Save Search Config
    DeleteOutlined, // Import for Delete Search Config
    ReloadOutlined, // Import for Load All Search Config
    DownOutlined // Import for Dropdown arrow
} from '@ant-design/icons';
import { Header, Content } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import SidebarAdmin from '../Sidebar/SidebarAdmin';
import useGhiChuMayTinhLogic from './useGhiChuMayTinhLogic'; // Import the logic hook

// --- Ant Design Components ---
const { Option } = Select;
const { RangePicker } = DatePicker;

// --- DarkModeToggle component (giữ nguyên) ---
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = React.useState(false);

    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

    React.useEffect(() => {
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

const QuanLyGhiChuMayTinh = () => {
    // Use the custom hook to get all logic and state
    const {
        ghiChuData,
        loading,
        collapsed,
        isModalVisible,
        selectedRecord,
        modalLoading,
        nhanVienList,
        nhanVienLoading,

        // Search states from Redux via hook
        searchFieldValue,
        searchOperatorValue,
        searchInput, // Derived string value for text input
        searchDateValue, // Derived Day.js object for DatePicker
        searchDateRangeValue, // Derived Day.js array for RangePicker

        searchFieldsOptions,
        searchOperatorsOptions,
        selectedFieldType,
        isDateFieldSelected,
        isOperatorRequiringValue,
        isDateRangeOperatorSelected,
        isSingleDateOperatorSelected,

        // Redux Search Config states
        currentSearchConfig,
        searchConfigList,
        LOAD_ALL_GHI_CHU_MAY_TINH_CONFIG_NAME,

        // Handlers from hook
        setCollapsed,
        setSearchFieldValue, // Now dispatches Redux action
        setSearchOperatorValue, // Now dispatches Redux action
        setSearchInput, // Now dispatches Redux action for text keyword
        setSearchDateValue, // Now dispatches Redux action for date keyword
        setSearchDateRangeValue, // Now dispatches Redux action for range keyword

        form,
        getFilteredOperators,
        parseScheduledInfo,
        formatDateDisplay,
        handleCancel,
        handleUpdateSchedule,
        handleContextMenu,
        handleClearSearch,
        handleAttributeChange, // Still needed for Select's onChange
        handleOperatorChange, // Still needed for Select's onChange
        handleMenuClickSidebar,

        // New handlers for search config management
        handleLoadAllGhiChuMayTinh,
        handleSaveSearchConfig,
        handleLoadSearchConfig,
        handleRemoveSearchConfig,
    } = useGhiChuMayTinhLogic();

    // Determine which input component to render based on selected field and operator
    const InputComponent = (() => {
        if (isDateRangeOperatorSelected) return RangePicker;
        if (isSingleDateOperatorSelected) return DatePicker;
        return Input;
    })();

    // Table Column Definitions (giữ nguyên)
    const ghiChuColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            width: 60,
            fixed: 'left',
            sorter: (a, b) => a.stt - b.stt,
            align: 'center',
        },
        {
            title: 'Nội dung',
            dataIndex: 'noiDung',
            key: 'noiDung',
            ellipsis: true,
            width: 200,
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
            width: 150,
            sorter: (a, b) => (a.tenMay || '').localeCompare(b.tenMay || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Tên Phòng',
            dataIndex: 'tenPhong',
            key: 'tenPhong',
            width: 150,
            sorter: (a, b) => (a.tenPhong || '').localeCompare(b.tenPhong || ''),
            render: (text) => text || 'N/A'
        },
        {
            title: 'Ngày Báo Lỗi',
            dataIndex: 'ngayBaoLoi',
            key: 'ngayBaoLoi',
            width: 150,
            sorter: (a, b) => new Date(a.ngayBaoLoi).valueOf() - new Date(b.ngayBaoLoi).valueOf(),
            render: (text) => formatDateDisplay(text) || 'N/A'
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
            sorter: (a, b) => (a.tenTaiKhoanSuaLoi || '').localeCompare(b.tenTaiKhoanSuaLoi || ''),
            render: (text) => text ? text : <i>(Chưa có)</i>
        },
        {
            title: 'Trạng thái Sửa',
            dataIndex: 'ngaySua',
            key: 'ngaySuaStatus',
            width: 120,
            fixed: 'right',
            sorter: (a, b) => {
                const scheduledA = parseScheduledInfo(a.noiDung) ? 1 : 0;
                const scheduledB = parseScheduledInfo(b.noiDung) ? 1 : 0;
                const fixedA = a.ngaySua ? 1 : 0;
                const fixedB = b.ngaySua ? 1 : 0;
                const statusA = fixedA ? 2 : (scheduledA ? 1 : 0);
                const statusB = fixedB ? 2 : (scheduledB ? 1 : 0);
                if (statusA !== statusB) return statusA - statusB;
                if (fixedA && fixedB) return new Date(a.ngaySua).valueOf() - new Date(b.ngaySua).valueOf();
                return 0;
            },
            render: (_, record) => {
                const scheduledInfo = parseScheduledInfo(record.noiDung);
                const formattedOriginalNgaySua = record.ngaySua ? formatDateDisplay(record.ngaySua) : null;
                const fixerName = record.tenTaiKhoanSuaLoi ? ` (Sửa bởi: ${record.tenTaiKhoanSuaLoi})` : '';

                let content;
                if (record.ngaySua && formattedOriginalNgaySua && formattedOriginalNgaySua !== 'Ngày không hợp lệ') {
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

    // Menu items cho Dropdown
    const dropdownMenuItems = [
        {
            key: 'load-all',
            label: 'Tải tất cả ghi chú',
            icon: <ReloadOutlined />,
            onClick: handleLoadAllGhiChuMayTinh,
        },
        { type: 'divider' },

        ...(searchConfigList || []).map(name => ({
            key: `load-${name}`,
            label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span onClick={() => handleLoadSearchConfig(name)} style={{ flexGrow: 1, cursor: 'pointer' }}>{name}</span>
                    <Tooltip title="Xóa cấu hình này">
                        <DeleteOutlined
                            style={{ color: 'red', cursor: 'pointer', marginLeft: 8 }}
                            onClick={(e) => {
                                e.stopPropagation(); // Ngăn sự kiện click của span bên trong
                                handleRemoveSearchConfig(name);
                            }}
                        />
                    </Tooltip>
                </div>
            ),
        })),
        (searchConfigList && searchConfigList.length > 0) && { type: 'divider' },
        {
            key: 'save-new',
            label: 'Lưu tìm kiếm hiện tại...',
            icon: <SaveOutlined />,
            onClick: handleSaveSearchConfig,
        },
    ].filter(Boolean); // Lọc bỏ các giá trị null/false (nếu có)


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
                            <Col xs={24} sm={12} md={10} lg={8} xl={7}>
                                <Form.Item label="Giá trị tìm kiếm" style={{ marginBottom: 0 }}>
                                    {InputComponent === Input && (
                                        <Input
                                            prefix={<SearchOutlined />}
                                            placeholder="Nhập giá trị..."
                                            value={searchInput} // Bind to searchInput from hook
                                            onChange={(e) => setSearchInput(e.target.value)} // Use setSearchInput from hook
                                            disabled={!isOperatorRequiringValue && !!searchOperatorValue}
                                            allowClear={{ clearIcon: <ClearOutlined onClick={() => setSearchInput('')} />}}
                                        />
                                    )}
                                    {InputComponent === DatePicker && (
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Chọn ngày"
                                            value={searchDateValue} // Bind to searchDateValue from hook
                                            onChange={setSearchDateValue} // Use setSearchDateValue from hook
                                            format="DD/MM/YYYY"
                                            allowClear
                                            disabled={!isOperatorRequiringValue && !!searchOperatorValue}
                                        />
                                    )}
                                    {InputComponent === RangePicker && (
                                        <RangePicker
                                            style={{ width: '100%' }}
                                            value={searchDateRangeValue} // Bind to searchDateRangeValue from hook
                                            onChange={setSearchDateRangeValue} // Use setSearchDateRangeValue from hook
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
                                        value={searchFieldValue} // Bind to searchFieldValue from hook
                                        onChange={setSearchFieldValue} // Use setSearchFieldValue from hook
                                        style={{ width: '100%' }}
                                        allowClear
                                        onClear={() => setSearchFieldValue(null)} // Call setter from hook
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
                                        value={searchOperatorValue} // Bind to searchOperatorValue from hook
                                        onChange={setSearchOperatorValue} // Use setSearchOperatorValue from hook
                                        style={{ width: '100%' }}
                                        disabled={!searchFieldValue}
                                        allowClear
                                        onClear={() => setSearchOperatorValue(null)} // Call setter from hook
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
                                    onClick={handleClearSearch} // Use handleClearSearch from hook
                                    style={{ width: '100%' }}
                                    danger
                                >
                                    Xóa lọc
                                </AntButton>
                            </Col>
                            {/* New Dropdown for Search Configs */}
                            <Col xs={24} sm={12} md={4} lg={4} xl={4}>
                                <Dropdown menu={{ items: dropdownMenuItems }} trigger={['click']}>
                                    <AntButton>
                                        Cấu hình tìm kiếm <DownOutlined />
                                    </AntButton>
                                </Dropdown>
                            </Col>
                        </Row>

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
                            scroll={{ x: 1500 }}
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
                                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase()) ||
                                    (option?.value?.toString() ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                style={{ width: '100%' }}
                            >
                                {nhanVienList.map(nv => (
                                    <Option key={nv.maNhanVien} value={nv.maNhanVien}>
                                        {`${nv.tenNV} (ID: ${nv.maNhanVien})`}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>

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
                            dependencies={['thoiGianBatDau']}
                            rules={[
                                { required: true, message: 'Vui lòng chọn thời gian kết thúc!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        const startTime = getFieldValue('thoiGianBatDau');
                                        if (!value || !startTime) {
                                            return Promise.resolve();
                                        }
                                        if (value.isAfter(startTime)) {
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