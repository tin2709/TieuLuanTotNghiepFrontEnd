// src/pages/QuanLyGiaoVien.js
import React, { useState, useEffect } from 'react';
import { Table, Button as AntButton, Layout, Popover, Input, Select, Row, Col, Modal, Dropdown, Tooltip } from 'antd';
import {
    SettingOutlined,
    SearchOutlined,
    ClearOutlined,
    SaveOutlined,
    DownOutlined,
    DeleteOutlined,
    PlusOutlined, ReloadOutlined,
    SunOutlined, MoonOutlined
} from '@ant-design/icons';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import SidebarAdmin from '../Sidebar/SidebarAdmin';
import useQuanLyGiaoVienLogic from './useQuanLyGiaoVienLogic'; // Import the new hook

const { Content } = Layout;
const { Option } = Select;

// --- DarkModeToggle component (giữ nguyên) ---
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const toggleDarkMode = () => setIsDarkMode((prev) => !prev);
    useEffect(() => {
        if (isDarkMode) DarkReader.enable({ brightness: 100, contrast: 90, sepia: 10 });
        else DarkReader.disable();
    }, [isDarkMode]);
    return (
        <AntButton
            icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{ backgroundColor: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        />
    );
};

const QuanLyGiaoVien = () => {
    // Sử dụng hook để lấy tất cả logic và trạng thái
    const {
        giaoVienData,
        teachersStatus,
        conversionStatus,
        chucVuOptions,
        positionsStatus,
        currentSearchConfig,
        searchConfigList,
        LOAD_ALL_CONFIG_NAME, // Lấy hằng số từ hook
        collapsed,
        setCollapsed,
        isConversionModalVisible,
        selectedGiaoVienForConversion,
        selectedChucVu,
        setSelectedChucVu,
        searchFieldsOptions,
        searchOperatorsOptions,
        handleLoadAllTeachers,
        handleSearchInputChange,
        handleSearchFieldChange,
        handleSearchOperatorChange,
        handleClearSearch,
        handleSaveSearchConfig,
        handleLoadSearchConfig,
        handleRemoveSearchConfig,
        handleMenuClickSidebar,
        handleCancelConversionModal,
        handleConvertGiaoVien,
        showConversionModal, // Hàm này được dùng trong render của cột
    } = useQuanLyGiaoVienLogic();

    // Định nghĩa cột bảng (sử dụng showConversionModal từ hook)
    const giaoVienColumns = [
        { title: 'STT', dataIndex: 'stt', key: 'stt', sorter: (a, b) => a.stt - b.stt },
        { title: 'Mã Giáo Viên', dataIndex: 'maGiaoVien', key: 'maGiaoVien', sorter: (a, b) => a.maGiaoVien - b.maGiaoVien },
        { title: 'Họ Tên', dataIndex: 'hoTen', key: 'hoTen', sorter: (a, b) => (a.hoTen || '').localeCompare(b.hoTen || '') },
        { title: 'Số Điện Thoại', dataIndex: 'soDienThoai', key: 'soDienThoai', sorter: (a, b) => String(a.soDienThoai || '').localeCompare(String(b.soDienThoai || '')) },
        { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => (a.email || '').localeCompare(b.email || '') },
        {
            title: 'Học Vị',
            dataIndex: 'hocVi',
            key: 'hocVi',
            sorter: (a, b) => (a.hocVi || '').localeCompare(b.hocVi || ''),
            render: (text, record) => (
                <div
                    className="editable-cell"
                    // Chỉ cho phép chuyển đổi nếu giáo viên chưa phải là nhân viên
                    onContextMenu={(e) => {
                        e.preventDefault();
                        if (record.maNhanVien === null) { // Kiểm tra nếu giáo viên này chưa có mã nhân viên
                            showConversionModal(record);
                        } else {
                            // Optionally, inform the user that this teacher is already an employee
                            // message.info('Giáo viên này đã được chuyển đổi thành nhân viên.');
                        }
                    }}
                    style={{ cursor: record.maNhanVien === null ? 'context-menu' : 'default' }} // Change cursor if convertible
                >
                    {text || 'N/A'}
                </div>
            ),
        },
        { title: 'Tên Khoa', dataIndex: 'tenKhoa', key: 'tenKhoa', sorter: (a, b) => (a.tenKhoa || '').localeCompare(b.tenKhoa || '') },
    ];

    // Tạo menu Dropdown cho cấu hình tìm kiếm
    const dropdownMenuItems = [
        {
            key: 'load-all',
            label: 'Tải tất cả giáo viên',
            icon: <ReloadOutlined />,
            onClick: handleLoadAllTeachers,
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
                        <Popover content={<div>Quản lí giáo viên</div>} trigger="hover">
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Quản Lý Giáo Viên
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
                        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle">
                            <Col xs={24} sm={12} md={8} lg={6} >
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder="Nhập giá trị tìm kiếm"
                                    value={currentSearchConfig.keyword}
                                    onChange={handleSearchInputChange}
                                    style={{ width: '100%' }}
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
                            {currentSearchConfig.keyword && (
                                <>
                                    <Col xs={24} sm={12} md={6} lg={5}>
                                        <Select
                                            placeholder="Chọn thuộc tính"
                                            value={currentSearchConfig.field}
                                            onChange={handleSearchFieldChange}
                                            style={{ width: '100%' }}
                                        >
                                            {searchFieldsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col xs={24} sm={12} md={6} lg={5}>
                                        <Select
                                            placeholder="Chọn phép toán"
                                            value={currentSearchConfig.operator}
                                            onChange={handleSearchOperatorChange}
                                            style={{ width: '100%' }}
                                        >
                                            {searchOperatorsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                </>
                            )}
                            <Col xs={24} sm={12} md={4} lg={currentSearchConfig.keyword ? 4 : 18}>
                                <Dropdown menu={{ items: dropdownMenuItems }} trigger={['click']}>
                                    <AntButton>
                                        Cấu hình tìm kiếm <DownOutlined />
                                    </AntButton>
                                </Dropdown>
                            </Col>
                        </Row>

                        <Table
                            columns={giaoVienColumns}
                            dataSource={giaoVienData}
                            loading={teachersStatus === 'loading' || positionsStatus === 'loading' || conversionStatus === 'loading'}
                            pagination={{
                                pageSizeOptions: ['10', '20', '50'],
                                showSizeChanger: true,
                                showQuickJumper: true,
                                // current: 1, // Bỏ current cứng, để Ant Design tự quản lý nếu không có state phân trang riêng
                                total: giaoVienData.length // Hoặc total từ API nếu có phân trang server-side
                            }}
                            rowKey="key"
                            bordered // Thêm border cho bảng dễ nhìn
                            size="small" // Bảng nhỏ gọn hơn
                        />
                    </div>
                </Content>
            </Layout>
            <Modal
                title="Chuyển đổi giáo viên thành nhân viên"
                open={isConversionModalVisible}
                onOk={handleConvertGiaoVien}
                onCancel={handleCancelConversionModal}
                confirmLoading={conversionStatus === 'loading'}
            >
                {selectedGiaoVienForConversion && (
                    <div>
                        <p>Bạn đang chuyển đổi giáo viên: <b>{selectedGiaoVienForConversion.hoTen}</b></p>
                        <Row gutter={16}>
                            <Col span={24}>
                                <label htmlFor="chucVu">Chức vụ:</label>
                                <Select
                                    id="chucVu"
                                    placeholder="Chọn chức vụ"
                                    style={{ width: '100%' }}
                                    onChange={setSelectedChucVu}
                                    value={selectedChucVu}
                                    loading={positionsStatus === 'loading'}
                                >
                                    {chucVuOptions.map(chucVu => (
                                        <Option key={chucVu.value} value={chucVu.value}>{chucVu.label}</Option>
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

export default QuanLyGiaoVien;