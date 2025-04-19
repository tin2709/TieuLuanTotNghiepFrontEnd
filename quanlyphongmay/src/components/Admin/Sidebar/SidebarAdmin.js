// components/SidebarAdmin.js
import React from 'react';
import { Layout, Menu } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useLocation
import Swal from 'sweetalert2';

const { Sider } = Layout;

const SidebarAdmin = ({ collapsed, onCollapse }) => {
    const navigate = useNavigate();
    const location = useLocation(); // Get current location

    const handleMenuClick = (e) => {
        if (e.key === 'dashboard') {
            navigate('/admin');
        } else if (e.key === 'userManagement') {
            navigate('/quanlitaikhoan');
        } else if (e.key === 'teacherManagement') {
            navigate('/quanligiaovien');
        } else if (e.key === 'employeeManagement') {
            navigate('/quanlinhanvien');
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

    // Determine selected key based on current path
    const getSelectedKey = () => {
        const path = location.pathname;
        if (path.startsWith('/admin')) {
            return ['dashboard'];
        } else if (path.startsWith('/quanlitaikhoan')) {
            return ['userManagement'];
        } else if (path.startsWith('/quanligiaovien')) {
            return ['teacherManagement'];
        } else if (path.startsWith('/quanlinhanvien')) {
            return ['employeeManagement'];
        }
        return []; // Default to no selection
    };

    return (
        <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
            <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
            <Menu
                theme="dark"
                selectedKeys={getSelectedKey()} // Dynamically set selected keys
                mode="inline"
                onClick={handleMenuClick}
            >
                <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                    Thống kê
                </Menu.Item>
                <Menu.Item key="userManagement" icon={<UserOutlined />}>
                    Quản lý tài khoản
                </Menu.Item>
                <Menu.Item key="teacherManagement" icon={<UserOutlined />}>
                    Quản lý giáo viên
                </Menu.Item>
                <Menu.Item key="employeeManagement" icon={<UserOutlined />}>
                    Quản lý nhân viên
                </Menu.Item>
                <Menu.Item key="logout" icon={<LogoutOutlined />}>
                    Đăng xuất
                </Menu.Item>
            </Menu>
        </Sider>
    );
};

export default SidebarAdmin;