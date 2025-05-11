// components/SidebarAdmin.js
import React from 'react';
import { Layout, Menu } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    AreaChartOutlined, // Added icon for analysis
    // Keep other icons if needed elsewhere in the menu
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const { Sider } = Layout;

const SidebarAdmin = ({ collapsed, onCollapse }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Internal handler for menu clicks.
    // Note: If parent components (like QuanLyTaiKhoan) have
    // their own logic (e.g., unsaved changes), they need to
    // manage navigation *before* calling `navigate`, typically
    // by wrapping the Sidebar or providing a custom `onMenuClick` prop.
    // The user's provided code uses this internal handler directly on the Menu's onClick.
    // The unsaved changes logic is handled in QuanLyTaiKhoan's *own* handler passed to Sidebar.
    // This internal handler just navigates.
    const handleMenuClick = (e) => {
        const keyRouteMap = {
            dashboard: '/admin',
            userManagement: '/quanlitaikhoan',
            teacherManagement: '/quanligiaovien',
            employeeManagement: '/quanlinhanvien',
            notemaytinhManagement: '/quanlighichumaytinh',
            notethietbiManagement: '/quanlighichuthietbi', // Assuming this is the route
            analyzeLog: '/phantichlog', // Assuming this is the route
            logout: '/login', // Logout is handled internally here
        };

        if (e.key === 'logout') {
            handleLogout();
        } else if (keyRouteMap[e.key]) {
            navigate(keyRouteMap[e.key]);
        }
    };


    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('maTK');
        localStorage.removeItem('username');
        localStorage.removeItem('userRole');
        localStorage.removeItem('loginSuccessTimestamp');
        localStorage.removeItem('expireAt');

        Swal.fire({
            icon: 'success',
            title: 'Đã đăng xuất',
            text: 'Bạn đã đăng xuất thành công.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => {
            navigate('/login');
        });
    };

    // Determine selected key based on current path
    const getSelectedKey = () => {
        const path = location.pathname;
        // Check paths against menu keys.
        // Use startsWith for paths that might have sub-routes,
        // or strict equality if the path is exact (like the dashboard root).
        if (path === '/admin') {
            return ['dashboard'];
        } else if (path.startsWith('/quanlitaikhoan')) {
            return ['userManagement'];
        } else if (path.startsWith('/quanligiaovien')) {
            return ['teacherManagement'];
        } else if (path.startsWith('/quanlinhanvien')) {
            return ['employeeManagement'];
        }
        else if (path.startsWith('/quanlighichumaytinh')) {
            return ['notemaytinhManagement'];
        }
        // FIX: Corrected the path check for 'Quản lý ghi chú thiết bị'
        else if (path.startsWith('/quanlighichuthietbi')) {
            return ['notethietbiManagement'];
        }
        // This condition was already correct in your original code
        else if (path.startsWith('/phantichlog')) {
            return ['analyzeLog'];
        }
        return []; // Default to no selection
    };

    return (
        <Sider collapsible collapsed={collapsed} onCollapse={onCollapse}>
            {/* Placeholder for logo or title */}
            <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)' }} />
            <Menu
                theme="dark"
                selectedKeys={getSelectedKey()} // Control selection using state derived from path
                mode="inline"
                onClick={handleMenuClick} // Use the internal handler defined above
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
                <Menu.Item key="notemaytinhManagement" icon={<UserOutlined />}>
                    Quản lý ghi chú máy tính
                </Menu.Item>
                <Menu.Item key="notethietbiManagement" icon={<UserOutlined />}>
                    Quản lý ghi chú thiết bị
                </Menu.Item>
                {/* Using AreaChartOutlined icon for Analyze Log */}
                <Menu.Item key="analyzeLog" icon={<AreaChartOutlined />}>
                    Phân tích Log
                </Menu.Item>
                <Menu.Item key="logout" icon={<LogoutOutlined />}>
                    Đăng xuất
                </Menu.Item>
            </Menu>
        </Sider>
    );
};

export default SidebarAdmin;