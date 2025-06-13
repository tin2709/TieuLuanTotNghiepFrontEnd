// src/pages/QuanLyNhanVien.js
import React, { useState, useEffect } from 'react'; // Removed useCallback, useRef as they are mostly in hook now
import { Table, Button as AntButton, Layout, Popover, Input, Select, Row, Col, Modal, Dropdown, Tooltip, message } from 'antd'; // Added message and Tooltip, Dropdown
import {
    SettingOutlined,
    SearchOutlined,
    ClearOutlined,
    DownOutlined,
    SaveOutlined, // New import for save icon
    ReloadOutlined, // New import for reload icon
    DeleteOutlined, // New import for delete icon
    SunOutlined, MoonOutlined // Existing
} from '@ant-design/icons';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import SidebarAdmin from '../Sidebar/SidebarAdmin';
import useQuanLyNhanVienLogic from './useQuanLyNhanVienLogic'; // Import the new hook

const { Content } = Layout;
const { Option } = Select;

// --- DarkModeToggle component (giữ nguyên) ---
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode((prev) => !prev);
    };

    useEffect(() => {
        if (isDarkMode) {
            DarkReader.enable({
                brightness: 100,
                contrast: 90,
                sepia: 10,
            });
        } else {
            DarkReader.disable();
        }
    }, [isDarkMode]);

    return (
        <AntButton
            icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        />
    );
};

const QuanLyNhanVien = () => {
    // Sử dụng hook để lấy tất cả logic và trạng thái
    const {
        nhanVienData,
        employeesStatus,
        conversionStatus,
        khoaOptions,
        khoaOptionsStatus,
        currentSearchConfig,
        searchConfigList,
        LOAD_ALL_EMPLOYEES_CONFIG_NAME, // Lấy hằng số từ hook
        collapsed,
        setCollapsed,
        isConversionModalVisible,
        selectedNhanVienForConversion,
        hocVi,
        setHocVi,
        selectedKhoaMaKhoa,
        setSelectedKhoaMaKhoa,
        searchFieldsOptions,
        searchOperatorsOptions,
        handleLoadAllEmployees,
        handleSearchInputChange,
        handleSearchFieldChange,
        handleSearchOperatorChange,
        handleClearSearch,
        handleSaveSearchConfig,
        handleLoadSearchConfig,
        handleRemoveSearchConfig,
        handleMenuClickSidebar,
        handleLogout,
        showConversionModal,
        handleCancelConversionModal,
        handleConvertNhanVien,
        employeesWithRepairTasks, // NEW: Nhận state từ hook
        repairTasksStatus,       // NEW: Nhận state từ hook
    } = useQuanLyNhanVienLogic();

    const nhanVienColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            sorter: (a, b) => a.stt - b.stt,
        },
        {
            title: 'Mã Nhân Viên',
            dataIndex: 'maNhanVien',
            key: 'maNhanVien',
            sorter: (a, b) => a.maNhanVien - b.maNhanVien,
        },
        {
            title: 'Tên Nhân Viên',
            dataIndex: 'tenNV',
            key: 'tenNV',
            sorter: (a, b) => (a.tenNV || '').localeCompare(b.tenNV || ''),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
        },
        {
            title: 'Số Điện Thoại',
            dataIndex: 'sDT',
            key: 'sDT',
            sorter: (a, b) => String(a.sDT || '').localeCompare(String(b.sDT || '')),
        },
        {
            title: 'Chức Vụ',
            dataIndex: 'tenCV',
            key: 'tenCV',
            sorter: (a, b) => (a.tenCV || '').localeCompare(b.tenCV || ''),
            render: (text, record) => {
                const hasAssignedRepairTask = record.maNhanVien && employeesWithRepairTasks.has(record.maNhanVien);
                const canConvert = !hasAssignedRepairTask;

                return (
                    <div
                        className="editable-cell"
                        onContextMenu={(e) => {
                            e.preventDefault(); // Ngăn menu ngữ cảnh mặc định của trình duyệt

                            if (hasAssignedRepairTask) {
                                message.warning('Không thể chuyển đổi vai trò. Nhân viên này đã có lịch sửa chữa được phân công.');
                            } else {
                                showConversionModal(record);
                            }
                        }}
                        style={{ cursor: canConvert ? 'context-menu' : 'default' }}
                    >
                        {text || 'N/A'}
                    </div>
                );
            },
        },
    ];

    const loadingStatus = employeesStatus === 'loading' || khoaOptionsStatus === 'loading' || conversionStatus === 'loading' || repairTasksStatus === 'loading';

    // Tạo menu Dropdown cho cấu hình tìm kiếm
    const dropdownMenuItems = [
        {
            key: 'load-all',
            label: 'Tải tất cả nhân viên',
            icon: <ReloadOutlined />,
            onClick: handleLoadAllEmployees,
        },
        { type: 'divider' },

        // Iterate through saved configurations to create menu items
        ...(searchConfigList || []).map(name => ({
            key: `load-${name}`,
            label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span onClick={() => handleLoadSearchConfig(name)} style={{ flexGrow: 1, cursor: 'pointer' }}>{name}</span>
                    <Tooltip title="Xóa cấu hình này">
                        <DeleteOutlined
                            style={{ color: 'red', cursor: 'pointer', marginLeft: 8 }}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent the parent span's onClick from firing
                                handleRemoveSearchConfig(name);
                            }}
                        />
                    </Tooltip>
                </div>
            ),
        })),
        (searchConfigList && searchConfigList.length > 0) && { type: 'divider' }, // Only show divider if there are saved configs
        {
            key: 'save-new',
            label: 'Lưu tìm kiếm hiện tại...',
            icon: <SaveOutlined />,
            onClick: handleSaveSearchConfig,
        },
    ].filter(Boolean); // Filter out any false/null values (e.g., if searchConfigList is empty)


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
                        <Popover content={<div>Quản lí nhân viên</div>} trigger="hover">
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Quản Lý Nhân Viên
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
                            <Col xs={24} sm={12} md={8} lg={6} > {/* Adjusted column sizes for responsiveness */}
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder="Nhập giá trị tìm kiếm"
                                    value={currentSearchConfig.keyword}
                                    onChange={handleSearchInputChange}
                                    style={{ width: '100%' }}
                                    // Removed size="small" to be consistent with QuanLyGiaoVien
                                    suffix={
                                        currentSearchConfig.keyword && (
                                            <AntButton
                                                style={{ border: 'none', boxShadow: 'none', padding: 0 }}
                                                type="text"
                                                icon={<ClearOutlined />}
                                                onClick={handleClearSearch}
                                            />
                                        )
                                    }
                                />
                            </Col>
                            {/* Conditionally render field and operator selects */}
                            {currentSearchConfig.keyword && ( // Show only if keyword is present
                                <>
                                    <Col xs={24} sm={12} md={6} lg={5}> {/* Adjusted column sizes */}
                                        <Select
                                            placeholder="Chọn thuộc tính"
                                            value={currentSearchConfig.field}
                                            onChange={handleSearchFieldChange}
                                            style={{ width: '100%' }}
                                            // Removed size="small"
                                        >
                                            {searchFieldsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={5}> {/* Adjusted column sizes */}
                                        <Select
                                            placeholder="Chọn phép toán"
                                            value={currentSearchConfig.operator}
                                            onChange={handleSearchOperatorChange}
                                            style={{ width: '100%' }}
                                            // Removed size="small"
                                        >
                                            {searchOperatorsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                </>
                            )}
                            <Col xs={24} sm={12} md={4} lg={currentSearchConfig.keyword ? 8 : 18}> {/* Adjusted column sizes */}
                                <Dropdown menu={{ items: dropdownMenuItems }} trigger={['click']}>
                                    <AntButton>
                                        Cấu hình tìm kiếm <DownOutlined />
                                    </AntButton>
                                </Dropdown>
                            </Col>
                        </Row>

                        <Table
                            columns={nhanVienColumns}
                            dataSource={nhanVienData}
                            loading={loadingStatus}
                            pagination={{
                                pageSizeOptions: ['10', '20', '50'],
                                showSizeChanger: true,
                                showQuickJumper: true,
                            }}
                            rowKey="maNhanVien"
                            bordered
                            size="small"
                        />
                    </div>
                </Content>
            </Layout>
            <Modal
                title="Chuyển đổi nhân viên thành giáo viên"
                open={isConversionModalVisible}
                onOk={handleConvertNhanVien}
                onCancel={handleCancelConversionModal}
                confirmLoading={conversionStatus === 'loading'}
            >
                {selectedNhanVienForConversion && (
                    <div>
                        <p>Bạn đang chuyển đổi nhân viên: <b>{selectedNhanVienForConversion.tenNV}</b></p>
                        <Row gutter={16}>
                            <Col span={12}>
                                <label htmlFor="hocVi">Học vị:</label>
                                <Select
                                    id="hocVi"
                                    placeholder="Chọn học vị"
                                    style={{ width: '100%' }}
                                    onChange={setHocVi}
                                    value={hocVi}
                                >
                                    <Option value="Thạc sĩ">Thạc sĩ</Option>
                                    <Option value="Tiến sĩ">Tiến sĩ</Option>
                                </Select>
                            </Col>
                            <Col span={12}>
                                <label htmlFor="khoa">Khoa:</label>
                                <Select
                                    id="khoa"
                                    placeholder="Chọn khoa"
                                    style={{ width: '100%' }}
                                    onChange={setSelectedKhoaMaKhoa}
                                    value={selectedKhoaMaKhoa}
                                    loading={khoaOptionsStatus === 'loading'}
                                >
                                    {khoaOptions.map(khoa => (
                                        <Option key={khoa.value} value={khoa.value}>{khoa.label}</Option>
                                    ))}
                                </Select>
                            </Col>
                        </Row>
                    </div>
                )}
            </Modal>
        </Layout>
    );
};

export default QuanLyNhanVien;