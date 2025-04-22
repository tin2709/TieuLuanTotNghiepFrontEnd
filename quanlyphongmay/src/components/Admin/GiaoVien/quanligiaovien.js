// components/QuanLyGiaoVien.js
import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button as AntButton, Layout, Menu, Popover, Input, Select, Row, Col, Modal } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    SettingOutlined,
    SearchOutlined,
    ClearOutlined,
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Import SidebarAdmin component

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

const QuanLyGiaoVien = () => {
    const [giaoVienData, setGiaoVienData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const [chucVuOptions, setChucVuOptions] = useState([]);
    const [isConversionModalVisible, setIsConversionModalVisible] = useState(false);
    const [selectedGiaoVienForConversion, setSelectedGiaoVienForConversion] = useState(null);
    const [selectedChucVu, setSelectedChucVu] = useState(null);


    // Search states
    const [searchFieldValue, setSearchFieldValue] = useState(null);
    const [searchOperatorValue, setSearchOperatorValue] = useState(null);
    const [searchInput, setSearchInput] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');


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
        { value: 'GT', label: 'Greater Than' },
        { value: 'LT', label: 'Less Than' },
        { value: 'IN', label: 'In' },
        { value: 'NOT_IN', label: 'Not In' },
    ];

    const fetchChucVuOptions = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`https://localhost:8080/DSChucVu?token=${token}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                console.error('Failed to fetch chuc vu options:', response);
                return;
            }
            const data = await response.json();
            setChucVuOptions(data.map(chucVu => ({ value: chucVu.maCV, label: chucVu.tenCV })));
        } catch (error) {
            console.error('Error fetching chuc vu options:', error);
        }
    }, []);



    const fetchGiaoViens = useCallback(async () => {
        if (!searchKeyword && searchInput) {
            return;
        }
        setLoading(true);
        const token = localStorage.getItem('authToken');
        let apiUrl = `https://localhost:8080/DSGiaoVien?token=${token}`;
        if (searchKeyword) {
            apiUrl = `https://localhost:8080/searchGiaoVienByAdmin?keyword=${searchKeyword}&token=${token}`;
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
                setGiaoVienData([]);
                return;
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const textData = await response.text();
                console.error('Invalid content type:', contentType, textData);
                setGiaoVienData([]);
                return;
            }


            try {
                const data = await response.json();
                if (data && Array.isArray(data.results)) {
                    const processedData = data.results.map((item, index) => {
                        let tenKhoaValue = 'N/A';

                        if (item.tenKhoa) { // Check if tenKhoa is directly available
                            tenKhoaValue = item.tenKhoa;
                        } else if (typeof item.khoa === 'object' && item.khoa.tenKhoa) {
                            tenKhoaValue = item.khoa.tenKhoa;
                        } else if (typeof item.khoa === 'string') {
                            tenKhoaValue = item.khoa;
                        }
                        else if (typeof item.khoa === 'number') {
                            if (item.khoa === 1) {
                                tenKhoaValue = 'Khoa Công Nghệ Thông Tin';
                            } else if (item.khoa === 2) {
                                tenKhoaValue = 'Khoa Công Nghệ Hóa Học';
                            }
                        }


                        return {
                            ...item,
                            key: item.maGiaoVien,
                            stt: index + 1,
                            tenKhoa: tenKhoaValue,
                            maKhoa: typeof item.khoa === 'object' ? item.khoa.maKhoa : item.khoa,
                            tenTaiKhoan: item.taiKhoan ? item.taiKhoan.tenDangNhap : 'N/A',
                            taiKhoanMaTK: item.taiKhoan ? item.taiKhoan.maTK : null,
                            email: item.email,
                            soDienThoai: item.soDienThoai,
                            hoTen: item.hoTen,
                            maGiaoVienItem: item.maGiaoVien,
                            hocViItem: item.hocVi
                        };
                    });
                    setGiaoVienData(processedData);
                } else if (Array.isArray(data)) {
                    const processedData = data.map((item, index) => {
                        let tenKhoaValue = 'N/A';
                        if (item.tenKhoa) { // Check if tenKhoa is directly available
                            tenKhoaValue = item.tenKhoa;
                        } else if (typeof item.khoa === 'object' && item.khoa.tenKhoa) {
                            tenKhoaValue = item.khoa.tenKhoa;
                        } else if (typeof item.khoa === 'string') {
                            tenKhoaValue = item.khoa;
                        }
                        else if (typeof item.khoa === 'number') {
                            if (item.khoa === 1) {
                                tenKhoaValue = 'Khoa Công Nghệ Thông Tin';
                            } else if (item.khoa === 2) {
                                tenKhoaValue = 'Khoa Công Nghệ Hóa Học';
                            }
                        }


                        return {
                            ...item,
                            key: item.maGiaoVien,
                            stt: index + 1,
                            tenKhoa: tenKhoaValue,
                            maKhoa: typeof item.khoa === 'object' ? item.khoa.maKhoa : item.khoa,
                            tenTaiKhoan: item.taiKhoan ? item.taiKhoan.tenDangNhap : 'N/A',
                            taiKhoanMaTK: item.taiKhoan ? item.taiKhoan.maTK : null,
                            email: item.email,
                            soDienThoai: item.soDienThoai,
                            hoTen: item.hoTen,
                            maGiaoVienItem: item.maGiaoVien,
                            hocViItem: item.hocVi
                        };
                    });
                    setGiaoVienData(processedData);
                }
                else {
                    console.error("Received data is not an array:", data);
                    setGiaoVienData([]);
                }
            } catch (jsonError) {
                console.error("Error parsing JSON:", jsonError);
                setGiaoVienData([]);
            }


        } catch (err) {
            console.error("Error fetching teachers:", err);
            setGiaoVienData([]);
        } finally {
            setLoading(false);
        }
    }, [searchKeyword]);


    const debouncedFetchGiaoViens = useCallback(
        debounce(() => {
            if (searchFieldValue && searchOperatorValue && searchInput !== '') {
                fetchGiaoViens();
            } else if (!searchInput) {
                fetchGiaoViens();
            }
        }, 1000),
        [fetchGiaoViens, searchFieldValue, searchOperatorValue, searchInput]
    );


    useEffect(() => {
        let keyword = '';
        if (searchInput && searchFieldValue && searchOperatorValue) {
            keyword = `${searchFieldValue}:${searchOperatorValue}:${searchInput}`;
        }
        setSearchKeyword(keyword);
    }, [searchInput, searchFieldValue, searchOperatorValue]);

    useEffect(() => {
        debouncedFetchGiaoViens();
        fetchChucVuOptions();
    }, [debouncedFetchGiaoViens, fetchChucVuOptions]);


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
            navigate('/quanlinhanvien');
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
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Vui lòng chọn chức vụ.',
            });
            return;
        }

        Swal.fire({
            title: 'Bạn có chắc chắn muốn chuyển đổi giáo viên này?',
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

                try {
                    const response = await fetch(`https://localhost:8080/chuyendoigiaovien?token=${token}&maGV=${selectedGiaoVienForConversion.maGiaoVienItem}&tenNV=${selectedGiaoVienForConversion.hoTen}&email=${selectedGiaoVienForConversion.email}&sDT=${selectedGiaoVienForConversion.soDienThoai}&maCV=${selectedChucVu}&taiKhoanMaTK=${selectedGiaoVienForConversion.taiKhoanMaTK}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    });



                    if (!response.ok) {
                        const errorData = await response.text();
                        console.error('Conversion error:', response.status, errorData);
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi chuyển đổi',
                            text: 'Chuyển đổi giáo viên thất bại.',
                        });
                    } else {
                        Swal.fire({
                            icon: 'success',
                            title: 'Thành công!',
                            text: 'Giáo viên đã được chuyển đổi thành công.',
                            timer: 1500,
                            showConfirmButton: false,
                        });
                        fetchGiaoViens(); // Refresh data after conversion
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
                    setSelectedChucVu(null);
                    setSelectedGiaoVienForConversion(null);
                }
            }
        });
    };


    const giaoVienColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            sorter: (a, b) => a.stt - b.stt,
        },
        {
            title: 'Mã Giáo Viên',
            dataIndex: 'maGiaoVien',
            key: 'maGiaoVien',
            sorter: (a, b) => a.maGiaoVien - b.maGiaoVien,
        },
        {
            title: 'Họ Tên',
            dataIndex: 'hoTen',
            key: 'hoTen',
            sorter: (a, b) => a.hoTen.localeCompare(b.hoTen),
        },
        {
            title: 'Số Điện Thoại',
            dataIndex: 'soDienThoai',
            key: 'soDienThoai',
            sorter: (a, b) => a.soDienThoai.localeCompare(b.soDienThoai),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Học Vị',
            dataIndex: 'hocVi',
            key: 'hocVi',
            sorter: (a, b) => a.hocVi.localeCompare(b.hocVi),
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
        {
            title: 'Tên Khoa',
            dataIndex: 'tenKhoa',
            key: 'tenKhoa',
            sorter: (a, b) => a.tenKhoa.localeCompare(b.tenKhoa),
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
                            columns={giaoVienColumns}
                            dataSource={giaoVienData}
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
                title="Chuyển đổi giáo viên"
                visible={isConversionModalVisible}
                onOk={handleConvertGiaoVien}
                onCancel={handleCancelConversionModal}
                loading={loading}
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