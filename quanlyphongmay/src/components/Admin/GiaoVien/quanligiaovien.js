// components/QuanLyGiaoVien.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Table, Button as AntButton, Layout, Menu, Popover, Input, Select, Row, Col, Modal, Dropdown, Space, Tooltip } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    SettingOutlined,
    SearchOutlined,
    ClearOutlined,
    SaveOutlined,
    DownOutlined,
    DeleteOutlined,
    PlusOutlined, ReloadOutlined, // Thêm icon cho "Lưu tìm kiếm mới"
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin';

// Import actions và thunks từ Redux slices
import { fetchTeachers, convertTeacher } from '../../../redux/QuanLiGVRedux/teachersSlice';
import { fetchPositionOptions } from '../../../redux/QuanLiGVRedux/positionsSlice';
import {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch,
    LOAD_ALL_CONFIG_NAME
} from '../../../redux/QuanLiGVRedux/searchConfigsSlice';

const { Content } = Layout;
const { Option } = Select;

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

// Debounce function (giữ nguyên)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const QuanLyGiaoVien = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Lấy dữ liệu từ Redux store
    const { data: giaoVienData, status: teachersStatus, conversionStatus } = useSelector((state) => state.teachers);
    const { options: chucVuOptions, status: positionsStatus } = useSelector((state) => state.positions);
    const { currentSearchConfig, searchConfigList, savedSearchConfigs } = useSelector((state) => state.searchConfigs);

    const [collapsed, setCollapsed] = useState(false);
    const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
    const [selectedGiaoVienForConversion, setSelectedGiaoVienForConversion] = useState(null);
    const [selectedChucVu, setSelectedChucVu] = useState(null);

    // Giá trị searchKeyword được tạo ra từ currentSearchConfig
    const searchKeyword = useMemo(() => {
        if (currentSearchConfig.keyword && currentSearchConfig.field && currentSearchConfig.operator) {
            return `${currentSearchConfig.field}:${currentSearchConfig.operator}:${currentSearchConfig.keyword}`;
        }
        return '';
    }, [currentSearchConfig]);


    const searchFieldsOptions = [
        { value: 'hoTen', label: 'Họ Tên' },
        { value: 'soDienThoai', label: 'Số Điện Thoại' },
        { value: 'email', label: 'Email' },
        { value: 'hocVi', label: 'Học Vị' },
        { value: 'tenKhoa', label: 'Tên Khoa' },
    ];

    const searchOperatorsOptions = [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'LIKE', label: 'Like' },
        { value: 'STARTS_WITH', label: 'Starts With' },
        { value: 'ENDS_WITH', label: 'Ends With' },
        // Bỏ GT, LT, IN, NOT_IN vì ví dụ hiện tại chỉ tìm kiếm trên string
    ];

    // Debounced fetch
    const debouncedFetch = useCallback(
        debounce(() => {
            // Chỉ fetch nếu có từ khóa hoặc không có từ khóa (tải tất cả)
            // Logic này đảm bảo fetch khi searchKeyword thay đổi (kể cả khi rỗng)
            dispatch(fetchTeachers(searchKeyword));
        }, 1000),
        [dispatch, searchKeyword] // Phụ thuộc vào searchKeyword đã được tính toán
    );

    useEffect(() => {
        // Fetch dữ liệu giáo viên và chức vụ khi component mount hoặc searchKeyword thay đổi
        debouncedFetch();
    }, [searchKeyword, debouncedFetch]); // Thêm debouncedFetch vào dependencies

    useEffect(() => {
        dispatch(fetchPositionOptions());
    }, [dispatch]);

    const handleLoadAllTeachers = () => {
        dispatch(loadSearchConfig(LOAD_ALL_CONFIG_NAME));
    }
    const handleSearchInputChange = (e) => {
        dispatch(setCurrentSearch({ keyword: e.target.value }));
    };

    const handleSearchFieldChange = (value) => {
        dispatch(setCurrentSearch({ field: value }));
    };

    const handleSearchOperatorChange = (value) => {
        dispatch(setCurrentSearch({ operator: value }));
    };

    const handleClearSearch = () => {
        dispatch(clearCurrentSearch());
        // fetchTeachers sẽ được gọi lại do searchKeyword thay đổi thành rỗng
    };

    const handleSaveSearchConfig = async () => {
        if (!currentSearchConfig.field || !currentSearchConfig.operator || !currentSearchConfig.keyword) {
            Swal.fire('Thiếu thông tin!', 'Vui lòng nhập đầy đủ tiêu chí tìm kiếm trước khi lưu.', 'warning');
            return;
        }

        const { value: configName } = await Swal.fire({
            title: 'Đặt tên cho cấu hình tìm kiếm',
            input: 'text',
            inputValue: currentSearchConfig.name || `Tìm kiếm ${currentSearchConfig.field}`,
            showCancelButton: true,
            inputValidator: (value) => {
                if (!value) {
                    return 'Bạn cần nhập tên cho cấu hình!';
                }
                if (searchConfigList.includes(value) && value !== currentSearchConfig.name) {
                    return 'Tên cấu hình này đã tồn tại!';
                }
            }
        });

        if (configName) {
            dispatch(saveCurrentSearchConfig({ name: configName }));
        }
    };

    const handleLoadSearchConfig = (configName) => {
        dispatch(loadSearchConfig(configName));
        // fetchTeachers sẽ tự động được gọi lại do searchKeyword thay đổi
    };

    const handleRemoveSearchConfig = (configName) => {
        Swal.fire({
            title: `Bạn chắc chắn muốn xóa cấu hình "${configName}"?`,
            text: "Hành động này không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa!',
            cancelButtonText: 'Hủy'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(removeSearchConfig(configName));
            }
        });
    };


    const handleMenuClickSidebar = (e) => {
        if (e.key === 'dashboard') navigate('/admin');
        else if (e.key === 'userManagement') navigate('/quanlitaikhoan');
        else if (e.key === 'teacherManagement') navigate('/quanlygiaovien');
        else if (e.key === 'employeeManagement') navigate('/quanlinhanvien');
        else if (e.key === 'logout') handleLogout();
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        Swal.fire({
            icon: 'success',
            title: 'Logged Out',
            text: 'You have been successfully logged out.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => navigate('/login'));
    };

    const showConversionModal = (record) => {
        setSelectedGiaoVienForConversion(record);
        setIsConversionModalVisible(true);
    };

    const handleCancelConversionModal = () => {
        setIsConversionModalVisible(false);
        setSelectedChucVu(null);
        setSelectedGiaoVienForConversion(null);
    };

    const handleConvertGiaoVien = async () => {
        if (!selectedGiaoVienForConversion || !selectedChucVu) {
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Vui lòng chọn chức vụ.' });
            return;
        }

        const result = await Swal.fire({
            title: 'Bạn có chắc chắn muốn chuyển đổi giáo viên này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Có, chuyển đổi!',
            cancelButtonText: 'Không, hủy bỏ!'
        });

        if (result.isConfirmed) {
            dispatch(convertTeacher({
                maGiaoVienItem: selectedGiaoVienForConversion.maGiaoVienItem,
                hoTen: selectedGiaoVienForConversion.hoTen,
                email: selectedGiaoVienForConversion.email,
                soDienThoai: selectedGiaoVienForConversion.soDienThoai,
                maCV: selectedChucVu,
                taiKhoanMaTK: selectedGiaoVienForConversion.taiKhoanMaTK,
            })).then(() => {
                if (conversionStatus !== 'failed') { // Kiểm tra nếu không có lỗi từ slice
                    setIsConversionModalVisible(false);
                    setSelectedChucVu(null);
                    setSelectedGiaoVienForConversion(null);
                }
            });
        }
    };

    const giaoVienColumns = [
        { title: 'STT', dataIndex: 'stt', key: 'stt', sorter: (a, b) => a.stt - b.stt },
        { title: 'Mã Giáo Viên', dataIndex: 'maGiaoVien', key: 'maGiaoVien', sorter: (a, b) => a.maGiaoVien - b.maGiaoVien },
        { title: 'Họ Tên', dataIndex: 'hoTen', key: 'hoTen', sorter: (a, b) => a.hoTen.localeCompare(b.hoTen) },
        { title: 'Số Điện Thoại', dataIndex: 'soDienThoai', key: 'soDienThoai', sorter: (a, b) => String(a.soDienThoai).localeCompare(String(b.soDienThoai)) },
        { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => a.email.localeCompare(b.email) },
        {
            title: 'Học Vị', dataIndex: 'hocVi', key: 'hocVi', sorter: (a, b) => a.hocVi.localeCompare(b.hocVi),
            render: (text, record) => (
                <div
                    className="editable-cell"
                    onContextMenu={(e) => { e.preventDefault(); showConversionModal(record); }}
                    style={{ cursor: 'context-menu' }}
                >
                    {text}
                </div>
            ),
        },
        { title: 'Tên Khoa', dataIndex: 'tenKhoa', key: 'tenKhoa', sorter: (a, b) => a.tenKhoa.localeCompare(b.tenKhoa) },
    ];


    const items = [
        // Mục "Tải tất cả" được thêm vào đầu danh sách
        {
            key: 'load-all',
            label: 'Tải tất cả giáo viên',
            icon: <ReloadOutlined />,
            onClick: handleLoadAllTeachers, // Gọi hàm mới
        },
        { type: 'divider' }, // Thêm divider sau mục "Tải tất cả"

        ...(searchConfigList || []).map(name => ({
            key: `load-${name}`,
            label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span onClick={() => handleLoadSearchConfig(name)}>{name}</span>
                    <Tooltip title="Xóa cấu hình này">
                        <DeleteOutlined
                            style={{ color: 'red', cursor: 'pointer', marginLeft: 8 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveSearchConfig(name);
                            }}
                        />
                    </Tooltip>
                </div>
            ),
        })),
        (searchConfigList && searchConfigList.length > 0) && { type: 'divider' }, // Chỉ hiện divider này nếu có cấu hình đã lưu
        {
            key: 'save-new',
            label: 'Lưu tìm kiếm hiện tại...',
            icon: <SaveOutlined />,
            onClick: handleSaveSearchConfig,
        },
    ].filter(Boolean);

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
                                    // size="small" // Bỏ size small để nhất quán
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
                            {currentSearchConfig.keyword && ( // Chỉ hiện khi có keyword
                                <>
                                    <Col xs={24} sm={12} md={6} lg={5}>
                                        <Select
                                            placeholder="Chọn thuộc tính"
                                            value={currentSearchConfig.field}
                                            onChange={handleSearchFieldChange}
                                            style={{ width: '100%' }}
                                            // size="small"
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
                                            // size="small"
                                        >
                                            {searchOperatorsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                </>
                            )}
                            <Col xs={24} sm={12} md={4} lg={currentSearchConfig.keyword ? 4 : 18}>
                                <Dropdown menu={{ items }} trigger={['click']}>
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
                                current: 1, // Nên có state quản lý pagination nếu cần
                                total: giaoVienData.length // Hoặc total từ API nếu có phân trang server-side
                            }}
                            rowKey="key" // Đảm bảo mỗi row có key duy nhất
                        />
                    </div>
                </Content>
            </Layout>
            <Modal
                title="Chuyển đổi giáo viên"
                open={isConversionModalVisible} // 'visible' is deprecated, use 'open'
                onOk={handleConvertGiaoVien}
                onCancel={handleCancelConversionModal}
                confirmLoading={conversionStatus === 'loading'} // Sử dụng conversionStatus
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

// Bỏ giaovienAdminLoader vì việc fetch dữ liệu ban đầu sẽ được xử lý bởi Redux Thunk
// Nếu bạn vẫn muốn sử dụng loader của React Router, nó có thể dispatch một action để load dữ liệu vào store
// thay vì trả về data trực tiếp. Tuy nhiên, để đơn giản, chúng ta sẽ fetch trong useEffect.