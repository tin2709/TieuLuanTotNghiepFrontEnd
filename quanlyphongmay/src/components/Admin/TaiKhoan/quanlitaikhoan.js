import React, { useState, useEffect } from 'react';
import { Table, Button as AntButton, Layout, Menu, Popover } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    LockOutlined,
    UnlockOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header, Sider } from "antd/es/layout/layout"; // Import Sider from ant design layout
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useNavigate, useLoaderData } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Import SidebarAdmin

const { Content } = Layout;

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

const QuanLyTaiKhoan = () => {
    const loaderData = useLoaderData();
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false); // State for sidebar collapse
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        if (loaderData && !loaderData.error) {
            if (Array.isArray(loaderData.data)) {
                const processedData = loaderData.data.map((item, index) => ({
                    ...item,
                    key: item.maTK,
                    stt: index + 1,
                    tenQuyen: item.quyen ? item.quyen.tenQuyen : 'N/A',
                    is_banned: item.banned,
                }));
                setUserData(processedData);
            } else {
                console.error("Loader Data Error: loaderData.data is not an array", loaderData.data);
                Swal.fire('Error', 'Dữ liệu tài khoản không đúng định dạng. Vui lòng kiểm tra lại API.', 'error');
                setUserData([]);
            }
        } else if (loaderData && loaderData.error) {
            console.error("Loader Error:", loaderData);
            Swal.fire('Error', loaderData.message || 'Failed to load user data.', 'error');
            setUserData([]);
        }
        setLoading(false);
    }, [loaderData]);


    const handleMenuClickSidebar = (e) => {
        if (e.key === 'dashboard') {
            navigate('/admin');
        } else if (e.key === 'userManagement') {
            navigate('/quanlitaikhoan');
        } else if (e.key === 'teacherManagement') {
            navigate('/quanligiaovien');
        } else if (e.key === 'employeeManagement') {
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


    const banUser = async (maTk) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`https://localhost:8080/banUser?maTk=${maTk}&token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to ban user");
            }
            Swal.fire('Success', 'User banned successfully!', 'success');
            window.location.reload();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };

    const unbanUser = async (maTk) => {
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`https://localhost:8080/unbanUser?maTk=${maTk}&token=${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to unban user");
            }
            Swal.fire('Success', 'User unbanned successfully!', 'success');
            window.location.reload();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };
    const handleBanUnban = (record) => {
        if (record.tenQuyen === 'Admin') {
            return;
        }


        if (record.is_banned) {
            Swal.fire({
                title: 'Unban User',
                text: `Are you sure you want to unban ${record.tenDangNhap}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, unban them!',
            }).then((result) => {
                if (result.isConfirmed) {
                    unbanUser(record.maTK);
                }
            });
        } else {
            Swal.fire({
                title: 'Ban User',
                text: `Are you sure you want to ban ${record.tenDangNhap}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, ban them!',
            }).then((result) => {
                if (result.isConfirmed) {
                    banUser(record.maTK);
                }
            });
        }
    };

    const userColumns = [
        {
            title: 'STT',
            dataIndex: 'stt',
            key: 'stt',
            sorter: (a, b) => a.stt - b.stt,
        },
        {
            title: 'Tên đăng nhập',
            dataIndex: 'tenDangNhap',
            key: 'tenDangNhap',
            sorter: (a, b) => a.tenDangNhap.localeCompare(b.tenDangNhap),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            sorter: (a, b) => a.email.localeCompare(b.email),
        },
        {
            title: 'Tên Quyền',
            dataIndex: 'tenQuyen',
            key: 'tenQuyen',
            sorter: (a, b) => a.tenQuyen.localeCompare(b.tenQuyen),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_banned',
            key: 'is_banned',
            render: (isBanned) => (isBanned ? 'Bị cấm' : 'Hoạt động'),
            sorter: (a, b) => a.is_banned - b.is_banned,
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record) => (
                record.tenQuyen !== 'Admin' && (
                    <AntButton
                        type="primary"
                        icon={record.is_banned ? <UnlockOutlined /> : <LockOutlined />}
                        onClick={() => handleBanUnban(record)}
                    >
                        {record.is_banned ? 'Bỏ cấm' : 'Cấm'}
                    </AntButton>
                )
            ),
        },
    ];

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
                        <Popover content={<div>Quản lí tài khoản</div>} trigger="hover">
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Quản Lý Tài Khoản
                    </div>
                    <div className="actions" style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                    </div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, background: '#fff', minHeight: 360 }}>
                        <Table
                            columns={userColumns}
                            dataSource={userData}
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

export default QuanLyTaiKhoan;