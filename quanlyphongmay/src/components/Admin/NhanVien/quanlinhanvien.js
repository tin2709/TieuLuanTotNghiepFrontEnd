import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Table, Button as AntButton, Layout, Menu, Popover, Input, Select, Row, Col, Modal } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    SettingOutlined,
    SearchOutlined,
    ClearOutlined,
    DownOutlined
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Import SidebarAdmin

const { Content } = Layout;
const { Option } = Select;

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
    const [nhanVienData, setNhanVienData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false); // State for sidebar collapse
    const navigate = useNavigate();
    const [khoaOptions, setKhoaOptions] = useState([]);
    const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
    const [selectedNhanVienForConversion, setSelectedNhanVienForConversion] = useState(null);
    const [hocVi, setHocVi] = useState('');
    const [selectedKhoaMaKhoa, setSelectedKhoaMaKhoa] = useState(null);

    // Search states
    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');


    const searchFieldsOptions = [
        { value: 'tenNV', label: 'Tên Nhân Viên' },
        { value: 'email', label: 'Email' },
        { value: 'sDT', label: 'Số Điện Thoại' },
        { value: 'tenCV', label: 'Tên Chức Vụ' },
    ];

    const searchOperatorsOptions = [
        { value: 'EQUALS', label: 'Equals' },
        { value: 'NOT_EQUALS', label: 'Not Equals' },
        { value: 'LIKE', label: 'Like' },
        { value: 'STARTS_WITH', label: 'Starts With' },
        { value: 'ENDS_WITH', label: 'Ends With' },
        { value: 'GT', label: 'Greater Than' },
        { value: 'LT', label: 'Less Than' },
        { value: 'IN', label: 'In' },
        { value: 'NOT_IN', label: 'Not In' },
    ];

    const fetchKhoaOptions = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`https://localhost:8080/DSKhoa?token=${token}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                console.error('Failed to fetch khoa options:', response);
                return;
            }
            const data = await response.json();
            setKhoaOptions(data.map(khoa => ({ value: khoa.maKhoa, label: khoa.tenKhoa })));
        } catch (error) {
            console.error('Error fetching khoa options:', error);
        }
    }, []);


    const fetchNhanViens = useCallback(async () => {
        if (!searchKeyword && searchInput) {
            return;
        }
        setLoading(true);
        const token = localStorage.getItem('authToken');
        let apiUrl = `https://localhost:8080/DSNhanVien?token=${token}`;
        if (searchKeyword) {
            apiUrl = `https://localhost:8080/searchNhanVienByAdmin?keyword=${searchKeyword}&token=${token}`;
        }

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Fetch error:', response.status, errorData);
                setNhanVienData([]);
                return;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textData = await response.text();
                console.error('Invalid content type:', contentType, textData);
                setNhanVienData([]);
                return;
            }


            try {
                const data = await response.json();
                let processedData = [];
                if (data && Array.isArray(data.results)) {
                    processedData = data.results.map((item, index) => ({
                        ...item,
                        key: item.maNhanVien,
                        stt: index + 1,
                        tenCV: item.tenCV || 'N/A',
                        maNV: item.maNhanVien, // Changed to maNhanVien
                        taiKhoanMaTK: item.taiKhoan ? item.taiKhoan.maTK : null,
                        email: item.email,
                        hoTen: item.tenNV,
                        soDienThoai: item.sDT
                    }));
                } else if (Array.isArray(data)) {
                    processedData = data.map((item, index) => ({
                        ...item,
                        key: item.maNhanVien,
                        stt: index + 1,
                        tenCV: item.chucVu ? item.chucVu.tenCV : 'N/A',
                        maNV: item.maNhanVien, // Changed to maNhanVien
                        taiKhoanMaTK: item.taiKhoan ? item.taiKhoan.maTK : null,
                        email: item.email,
                        hoTen: item.tenNV,
                        soDienThoai: item.sDT
                    }));
                }
                else {
                    console.error("Received data is not an array:", data);
                    setNhanVienData([]);
                    return;
                }
                setNhanVienData(processedData);


            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                setNhanVienData([]);
            }


        } catch (err) {
            console.error("Error fetching teachers:", err);
            setNhanVienData([]);
        } finally {
            setLoading(false);
        }
    }, [searchKeyword]);


    const debouncedFetchNhanViens = useCallback(
        debounce(() => {
            if (searchFieldValue && searchOperatorValue && searchInput !== '') {
                fetchNhanViens();
            } else if (!searchInput) {
                fetchNhanViens();
            }
        }, 1000),
        [fetchNhanViens, searchFieldValue, searchOperatorValue, searchInput]
    );


    useEffect(() => {
        let keyword = '';
        if (searchInput && searchFieldValue && searchOperatorValue) {
            keyword = `${searchFieldValue}:${searchOperatorValue}:${searchInput}`;
        }
        setSearchKeyword(keyword);
    }, [searchInput, searchFieldValue, searchOperatorValue]);

    useEffect(() => {
        debouncedFetchNhanViens();
        fetchKhoaOptions();
    }, [debouncedFetchNhanViens, fetchKhoaOptions]);


    const handleClearSearch = () => {
        setSearchFieldValue(null);
        setSearchOperatorValue(null);
        setSearchInput('');
        setSearchKeyword('');
    };


    const handleMenuClickSidebar = (e) => {
        if (e.key === 'dashboard') {
            navigate('/admin');
        } else if (e.key === 'userManagement') {
            navigate('/quanlitaikhoan');
        } else if (e.key === 'teacherManagement') {
            navigate('/quanlygiaovien');
        }
        else if (e.key === 'employeeManagement') {
            navigate('/quanlynhanvien');
        }
        else if (e.key === 'logout') {
            handleLogout();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        Swal.fire({
            icon: 'success',
            title: 'Logged Out',
            text: 'You have been successfully logged out.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => {
            navigate('/login');
        });
    };

    const showConversionModal = (record) => {
        setSelectedNhanVienForConversion(record);
        setIsConversionModalVisible(true);
    };

    const handleCancelConversionModal = () => {
        setIsConversionModalVisible(false);
        setHocVi('');
        setSelectedKhoaMaKhoa(null);
        setSelectedNhanVienForConversion(null);
    };

    const handleConvertNhanVien = async () => {
        if (!hocVi || !selectedKhoaMaKhoa || !selectedNhanVienForConversion) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Vui lòng nhập đầy đủ thông tin học vị và khoa.',
            });
            return;
        }

        Swal.fire({
            title: 'Bạn có chắc chắn muốn chuyển đổi nhân viên này thành giáo viên?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Có, chuyển đổi!',
            cancelButtonText: 'Không, hủy bỏ!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setLoading(true);
                const token = localStorage.getItem('authToken');

                const params = {
                    token: token,
                    maNV: selectedNhanVienForConversion.maNV.toString(),
                    hoTen: selectedNhanVienForConversion.hoTen,
                    soDienThoai: selectedNhanVienForConversion.soDienThoai,
                    email: selectedNhanVienForConversion.email,
                    hocVi: hocVi,
                    taiKhoanMaTK: selectedNhanVienForConversion.taiKhoanMaTK,
                    khoaMaKhoa: selectedKhoaMaKhoa,
                };

                // Construct URL with parameters
                let url = new URL('https://localhost:8080/chuyendoinhanvien');
                Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));


                console.log("URL being sent to /chuyendoinhanvien API:", url.toString()); // Log URL

                try {
                    const response = await fetch(url.toString(), {
                        method: 'POST', // Keep POST method as in AddLabRoom example
                        headers: {
                            'Content-Type': 'application/json', // Keep Content-Type header
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify(params), // Keep body as in AddLabRoom example, might be needed by backend
                    });

                    if (!response.ok) {
                        const errorData = await response.text();
                        console.error('Conversion error:', response.status, errorData);
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi chuyển đổi',
                            text: 'Chuyển đổi nhân viên thành giáo viên thất bại.',
                        });
                    } else {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công!',
                            text: 'Nhân viên đã được chuyển đổi thành giáo viên.',
                            timer: 1500,
                            showConfirmButton: false,
                        });
                        fetchNhanViens(); // Refresh data after conversion
                    }
                } catch (error) {
                    console.error('Error during conversion:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi',
                        text: 'Đã có lỗi xảy ra trong quá trình chuyển đổi.',
                    });
                } finally {
                    setLoading(false);
                    setIsConversionModalVisible(false);
                    setHocVi('');
                    setSelectedKhoaMaKhoa(null);
                    setSelectedNhanVienForConversion(null);
                }
            }
        });
    };


    const nhanVienColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            sorter: (a, b) => a.stt - b.stt,
        },
        {
            title: 'Mã Nhân Viên',
            dataIndex: 'maNV',
            key: 'maNV',
            sorter: (a, b) => a.maNV - b.maNV,
        },
        {
            title: 'Tên Nhân Viên',
            dataIndex: 'tenNV',
            key: 'tenNV',
            sorter: (a, b) => a.tenNV.localeCompare(b.tenNV),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Số Điện Thoại',
            dataIndex: 'sDT',
            key: 'sDT',
            sorter: (a, b) => a.sDT.localeCompare(b.sDT),
        },
        {
            title: 'Chức Vụ',
            dataIndex: 'tenCV',
            key: 'tenCV',
            sorter: (a, b) => a.tenCV.localeCompare(b.tenCV),
            render: (text, record) => (
                <div
                    className="editable-cell"
                    onContextMenu={(e) => {
                        e.preventDefault();
                        showConversionModal(record);
                    }}
                    style={{ cursor: 'context-menu' }}
                >
                    {text}
                </div>
            ),
        },
    ];

    // Debounce function
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
                            <Col span={8} >
                                <Input
                                    prefix={<SearchOutlined />}
                                    placeholder="Nhập giá trị tìm kiếm"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    style={{ width: '100%' }}
                                    size="small"
                                    suffix={
                                        <AntButton
                                            style={{ border: 'none', boxShadow: 'none', padding: 0 }}
                                            type="text"
                                            icon={<ClearOutlined />}
                                            onClick={handleClearSearch}
                                        />
                                    }
                                />
                            </Col>
                            {searchInput && (
                                <>
                                    <Col span={4}>
                                        <Select
                                            placeholder="Chọn thuộc tính"
                                            value={searchFieldValue}
                                            onChange={setSearchFieldValue}
                                            style={{ width: '100%' }}
                                            size="small"
                                        >
                                            {searchFieldsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                    <Col span={4}>
                                        <Select
                                            placeholder="Chọn phép toán"
                                            value={searchOperatorValue}
                                            onChange={setSearchOperatorValue}
                                            style={{ width: '100%' }}
                                            size="small"
                                        >
                                            {searchOperatorsOptions.map(item => (
                                                <Option key={item.value} value={item.value}>{item.label}</Option>
                                            ))}
                                        </Select>
                                    </Col>
                                </>
                            )}
                            <Col span={searchInput ? 8 : 16} />
                        </Row>

                        <Table
                            columns={nhanVienColumns}
                            dataSource={nhanVienData}
                            loading={loading}
                            pagination={{
                                pageSizeOptions: ['10', '20', '50'],
                                showSizeChanger: true,
                                showQuickJumper: true,
                            }}
                        />
                    </div>
                </Content>
            </Layout>
            <Modal
                title="Chuyển đổi nhân viên thành giáo viên"
                visible={isConversionModalVisible}
                onOk={handleConvertNhanVien}
                onCancel={handleCancelConversionModal}
                loading={loading}
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