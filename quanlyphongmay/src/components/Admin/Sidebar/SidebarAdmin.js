// components/SidebarAdmin.js
import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import { Layout, Menu } from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    AreaChartOutlined,
    SnippetsOutlined, // Added icon for "Ghi chú" SubMenu
    // Keep other icons if needed elsewhere in the menu
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';

const { Sider } = Layout;
const { SubMenu } = Menu; // Import SubMenu

const SidebarAdmin = ({ collapsed, onCollapse }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Function to determine which submenus should be open based on the current path
    const getOpenKeysForPath = (path) => {
        const open = [];
        // Check if the current path belongs to any item under "Tài khoản"
        if (path.startsWith('/quanlitaikhoan') || path.startsWith('/quanligiaovien') || path.startsWith('/quanlinhanvien')) {
            open.push('accountSubMenu'); // Key for "Tài khoản" submenu
        }
        // Check if the current path belongs to any item under "Ghi chú"
        if (path.startsWith('/quanlighichumaytinh') || path.startsWith('/quanlighichuthietbi')) {
            open.push('notesSubMenu'); // Key for "Ghi chú" submenu
        }
        return open;
    };

    // State for managing currently open submenus
    const [currentOpenKeys, setCurrentOpenKeys] = useState(getOpenKeysForPath(location.pathname));

    // Effect to update open submenus when the route changes
    useEffect(() => {
        setCurrentOpenKeys(getOpenKeysForPath(location.pathname));
    }, [location.pathname]);

    // Handler for when submenus are opened or closed by the user
    const onSubMenuOpenChange = (keys) => {
        setCurrentOpenKeys(keys);
    };

    const handleMenuClick = (e) => {
        const keyRouteMap = {
            dashboard: '/admin',
            userManagement: '/quanlitaikhoan',
            teacherManagement: '/quanligiaovien',
            employeeManagement: '/quanlinhanvien',
            notemaytinhManagement: '/quanlighichumaytinh',
            notethietbiManagement: '/quanlighichuthietbi',
            monhocmanagement: '/quanlimonhocbyadmin',
            cathuchanhmanagement: '/quanlicathuchanh',
            analyzeLog: '/phantichlog',
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
        if (path === '/admin') {
            return ['dashboard'];
        } else if (path.startsWith('/quanlitaikhoan')) {
            return ['userManagement'];
        } else if (path.startsWith('/quanligiaovien')) {
            return ['teacherManagement'];
        } else if (path.startsWith('/quanlinhanvien')) {
            return ['employeeManagement'];
        } else if (path.startsWith('/quanlighichumaytinh')) {
            return ['notemaytinhManagement'];
        } else if (path.startsWith('/quanlighichuthietbi')) {
            return ['notethietbiManagement'];
        } else if (path.startsWith('/quanlimonhocbyadmin')) {
            return ['monhocmanagement'];
        }else if (path.startsWith('/quanlicathuchanh')) {
                return ['cathuchanhmanagement'];



        } else if (path.startsWith('/phantichlog')) {
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
                selectedKeys={getSelectedKey()}
                openKeys={currentOpenKeys} // Control which submenus are open
                onOpenChange={onSubMenuOpenChange} // Handle user interaction for opening/closing submenus
                mode="inline"
                onClick={handleMenuClick}
            >
                <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
                    Thống kê
                </Menu.Item>

                <SubMenu key="accountSubMenu" icon={<UserOutlined />} title="Tài khoản">
                    <Menu.Item key="userManagement" icon={<UserOutlined />}>
                        Quản lý tài khoản
                    </Menu.Item>
                    <Menu.Item key="teacherManagement" icon={<UserOutlined />}>
                        Quản lý giáo viên
                    </Menu.Item>
                    <Menu.Item key="employeeManagement" icon={<UserOutlined />}>
                        Quản lý nhân viên
                    </Menu.Item>
                </SubMenu>

                <SubMenu key="notesSubMenu" icon={<SnippetsOutlined />} title="Ghi chú">
                    <Menu.Item key="notemaytinhManagement" icon={<UserOutlined />}>
                        Quản lý ghi chú máy tính
                    </Menu.Item>
                    <Menu.Item key="notethietbiManagement" icon={<UserOutlined />}>
                        Quản lý ghi chú thiết bị
                    </Menu.Item>
                </SubMenu>
                <Menu.Item key="monhocmanagement" icon={<AreaChartOutlined />}>
                    Quản lí môn học
                </Menu.Item>
                <Menu.Item key="cathuchanhmanagement" icon={<AreaChartOutlined />}>
                    Quản lí ca thực hành
                </Menu.Item>
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