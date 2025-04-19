import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button as AntButton, Layout, Menu, Popover, Input, Select, Row, Col } from 'antd';
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
                        key: item.maNV,
                        stt: index + 1,
                        tenCV: item.tenCV || 'N/A',
                    }));
                } else if (Array.isArray(data)) {
                    processedData = data.map((item, index) => ({
                        ...item,
                        key: item.maNV,
                        stt: index + 1,
                        tenCV: item.chucVu ? item.chucVu.tenCV : 'N/A',
                        maNV: item.maNV
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
    }, [debouncedFetchNhanViens]);


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
        </Layout>
    );
};

export default QuanLyNhanVien;