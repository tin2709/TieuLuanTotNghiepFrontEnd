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
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Content, Sider } = Layout;

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
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`https://localhost:8080/getAllUser`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch users');
            }

            const data = await response.json();
            if (Array.isArray(data.data)) {
                const processedData = data.data.map((item, index) => ({
                    ...item,
                    key: item.maTK,
                    stt: index + 1,
                    tenQuyen: item.quyen ? item.quyen.tenQuyen : 'N/A',
                    is_banned: item.banned,
                }));
                setUserData(processedData);
            } else {
                console.error("Received data is not an array:", data);
                Swal.fire('Error', 'Received data is not in the expected format.', 'error');
                setUserData([]);
            }

        } catch (err) {
            console.error("Error fetching users:", err);
            Swal.fire('Error', err.message, 'error');
            setUserData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = (e) => {
        if (e.key === 'dashboard') {
            navigate('/admin');
        } else if (e.key === 'logout') {
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


    useEffect(() => {
        fetchUsers();
    }, []);

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
            fetchUsers();
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
            fetchUsers();
        } catch (error) {
            Swal.fire('Error', error.message, 'error');
        }
    };
    const handleBanUnban = (record) => {
        if (record.tenQuyen === 'Admin') {  // Corrected case to 'Admin'
            return; // Do nothing if the user is an admin
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
                record.tenQuyen !== 'Admin' && ( // Added condition here
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
            <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
                <Menu theme="dark" defaultSelectedKeys={['userManagement']} mode="inline" onClick={handleMenuClick}>
                    <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                        Thống kê
                    </Menu.Item>
                    <Menu.Item key="userManagement" icon={<UserOutlined />}>
                        Quản lý tài khoản
                    </Menu.Item>
                    <Menu.Item key="teacherManagement" icon={<UserOutlined />}>
                        Quản lý giáo viên
                    </Menu.Item>
                    <Menu.Item key="logout" icon={<LogoutOutlined />}>
                        Đăng xuất
                    </Menu.Item>
                </Menu>
            </Sider>
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