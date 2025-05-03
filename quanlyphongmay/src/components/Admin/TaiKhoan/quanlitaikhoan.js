import React, { useState, useEffect } from 'react';
import {
    Table,
    Button as AntButton,
    Layout,
    Menu, // Keep if SidebarAdmin needs it passed, otherwise can remove if Sidebar manages its own Menu
    Popover,
    Tabs,
    Select,
    Checkbox
} from 'antd';
import {
    UserOutlined, // Keep if used in SidebarAdmin props
    DashboardOutlined, // Keep if used in SidebarAdmin props
    LogoutOutlined, // Keep if used in SidebarAdmin props
    LockOutlined,
    UnlockOutlined,
    SettingOutlined,
    SunOutlined,
    MoonOutlined,
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { useNavigate, useLoaderData } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Adjust path as needed

const { Content } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;

// Dark Mode Toggle Component
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(DarkReader.isEnabled);

    const toggleDarkMode = () => {
        const newState = !isDarkMode;
        setIsDarkMode(newState);
        if (newState) {
            DarkReader.enable({
                brightness: 100,
                contrast: 90,
                sepia: 10,
            });
        } else {
            DarkReader.disable();
        }
    };

    return (
        <AntButton
            type="text"
            icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{ fontSize: '20px', border: 'none' }}
        />
    );
};


// Main Component
const QuanLyTaiKhoan = () => {
    const loaderData = useLoaderData();
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    // State for Tabs and Permissions
    const [activeTab, setActiveTab] = useState('taiKhoan'); // 'taiKhoan' or 'quyen'
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null); // Store user object or maTK
    const [permissions, setPermissions] = useState({}); // Structure: { resource: { view: bool, create: bool, ... } }
    const [permissionLoading, setPermissionLoading] = useState(false);

    // Define resources and actions for the permission grid
    const resources = ['Thiết bị', 'Máy tính', 'Phòng máy', 'Tầng', 'Tòa nhà'];
    const actions = ['view', 'create', 'update', 'delete'];

    // --- Data Loading Effect ---
    useEffect(() => {
        setLoading(true);
        if (loaderData && !loaderData.error) {
            if (Array.isArray(loaderData.data)) {
                const processedData = loaderData.data.map((item, index) => ({
                    ...item,
                    key: item.maTK, // Use maTK as the unique key for rows
                    stt: index + 1,
                    tenQuyen: item.quyen ? item.quyen.tenQuyen : 'N/A',
                    is_banned: item.banned,
                }));
                setUserData(processedData);
            } else {
                console.error("Loader Data Error: loaderData.data is not an array", loaderData.data);
                Swal.fire('Lỗi', 'Dữ liệu tài khoản không đúng định dạng. Vui lòng kiểm tra lại API.', 'error');
                setUserData([]);
            }
        } else if (loaderData && loaderData.error) {
            console.error("Loader Error:", loaderData);
            Swal.fire('Lỗi', loaderData.message || 'Không thể tải dữ liệu người dùng.', 'error');
            setUserData([]);
        }
        setLoading(false);
    }, [loaderData]);

    // --- Navigation and Logout Handlers ---
    const handleMenuClickSidebar = (e) => {
        // Map keys to routes - adjust keys/paths as needed in your SidebarAdmin
        const keyRouteMap = {
            dashboard: '/admin',
            userManagement: '/quanlitaikhoan',
            teacherManagement: '/quanligiaovien',
            employeeManagement: '/quanlinhanvien',
            // Add other mappings
        };
        if (keyRouteMap[e.key]) {
            navigate(keyRouteMap[e.key]);
        } else if (e.key === 'logout') {
            handleLogout();
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Clear token
        Swal.fire({
            icon: 'success',
            title: 'Đã đăng xuất',
            text: 'Bạn đã đăng xuất thành công.',
            showConfirmButton: false,
            timer: 1500,
        }).then(() => {
            navigate('/login'); // Redirect to login page
        });
    };

    // --- Ban/Unban User Functions ---
    const banUser = async (maTk) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        try {
            setLoading(true); // Indicate loading state
            const response = await fetch(`https://localhost:8080/banUser?maTk=${maTk}&token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Phản hồi không hợp lệ từ máy chủ." })); // Graceful handling of non-JSON response
                throw new Error(errorData.message || "Không thể cấm người dùng");
            }
            Swal.fire('Thành công', 'Người dùng đã bị cấm!', 'success');
            // Refresh data locally instead of full reload for better UX
            setUserData(prev => prev.map(user => user.maTK === maTk ? { ...user, is_banned: true } : user));
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const unbanUser = async (maTk) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.', 'error');
            return;
        }
        try {
            setLoading(true);
            const response = await fetch(`https://localhost:8080/unbanUser?maTk=${maTk}&token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Phản hồi không hợp lệ từ máy chủ." }));
                throw new Error(errorData.message || "Không thể bỏ cấm người dùng");
            }
            Swal.fire('Thành công', 'Người dùng đã được bỏ cấm!', 'success');
            // Refresh data locally
            setUserData(prev => prev.map(user => user.maTK === maTk ? { ...user, is_banned: false } : user));
        } catch (error) {
            Swal.fire('Lỗi', error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleBanUnban = (record) => {
        if (record.tenQuyen === 'Admin') {
            Swal.fire('Thông báo', 'Không thể cấm tài khoản Admin.', 'info');
            return; // Prevent banning admins
        }

        const actionText = record.is_banned ? 'bỏ cấm' : 'cấm';
        const confirmButtonColor = record.is_banned ? '#3085d6' : '#d33';
        const cancelButtonColor = record.is_banned ? '#d33' : '#3085d6';

        Swal.fire({
            title: `${record.is_banned ? 'Bỏ cấm' : 'Cấm'} người dùng?`,
            text: `Bạn có chắc muốn ${actionText} người dùng ${record.tenDangNhap}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmButtonColor,
            cancelButtonColor: cancelButtonColor,
            confirmButtonText: `Đồng ý, ${actionText}!`,
            cancelButtonText: 'Hủy bỏ',
        }).then((result) => {
            if (result.isConfirmed) {
                if (record.is_banned) {
                    unbanUser(record.maTK);
                } else {
                    banUser(record.maTK);
                }
            }
        });
    };

    // --- Permission Handling Functions ---
    const fetchPermissions = async (userId) => {
        console.log("Fetching permissions for user:", userId);
        setPermissionLoading(true);
        try {
            // **TODO: Replace with your actual API call**
            // Example: const response = await fetch(`/api/users/${userId}/permissions`);
            // const data = await response.json();
            // setPermissions(data);

            // --- SIMULATED DATA ---
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            const fetchedPermissions = {};
            const selectedUser = userData.find(u => u.maTK === userId);
            const isAdmin = selectedUser?.tenQuyen === 'Admin';

            resources.forEach(resource => {
                fetchedPermissions[resource] = {
                    view: isAdmin || Math.random() > 0.3, // Admins can view everything
                    create: isAdmin || Math.random() > 0.7,
                    update: isAdmin || Math.random() > 0.8,
                    delete: isAdmin || Math.random() > 0.9,
                };
            });
            // Example Override: Admins always have full control over 'Tòa nhà'
            if(isAdmin && fetchedPermissions['Tòa nhà']) {
                fetchedPermissions['Tòa nhà'] = { view: true, create: true, update: true, delete: true };
            }
            setPermissions(fetchedPermissions);
            // --- END SIMULATED DATA ---

        } catch (error) {
            console.error("Failed to fetch permissions:", error);
            Swal.fire('Lỗi', 'Không thể tải quyền cho người dùng này.', 'error');
            setPermissions({}); // Reset permissions on error
        } finally {
            setPermissionLoading(false);
        }
    };

    const handleUserSelectChange = (value) => {
        const user = userData.find(u => u.maTK === value);
        setSelectedUserForPermissions(user); // Store the selected user object
        if (value) {
            fetchPermissions(value);
        } else {
            setPermissions({}); // Clear permissions if selection is cleared
        }
    };

    const handlePermissionChange = (resource, action, checked) => {
        // Update local state immediately for responsive UI
        setPermissions(prevPermissions => ({
            ...prevPermissions,
            [resource]: {
                ...(prevPermissions[resource] || {}), // Ensure resource object exists
                [action]: checked,
            }
        }));

        // **TODO: Implement API call to save the permission change**
        // You might want to add a "Save" button or debounce these calls
        console.log(`TODO: Send update to backend: User ${selectedUserForPermissions?.maTK}, Resource ${resource}, Action ${action}, Value ${checked}`);
        // Example API call (needs proper endpoint and error handling):
        /*
        const token = localStorage.getItem('authToken');
        fetch(`/api/permissions/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                userId: selectedUserForPermissions?.maTK,
                resource: resource,
                action: action,
                value: checked
            })
        }).then(res => {
            if (!res.ok) console.error("Failed to save permission");
        }).catch(err => console.error("Error saving permission:", err));
        */
    };

    // --- Table Column Definitions ---
    const userColumns = [
        { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, sorter: (a, b) => a.stt - b.stt },
        { title: 'Tên đăng nhập', dataIndex: 'tenDangNhap', key: 'tenDangNhap', sorter: (a, b) => a.tenDangNhap.localeCompare(b.tenDangNhap) },
        { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => a.email.localeCompare(b.email) },
        { title: 'Tên Quyền', dataIndex: 'tenQuyen', key: 'tenQuyen', sorter: (a, b) => a.tenQuyen.localeCompare(b.tenQuyen) },
        {
            title: 'Trạng thái',
            dataIndex: 'is_banned',
            key: 'is_banned',
            render: (isBanned) => (isBanned ? <span style={{ color: 'red' }}>Bị cấm</span> : <span style={{ color: 'green' }}>Hoạt động</span>),
            sorter: (a, b) => a.is_banned - b.is_banned,
            filters: [ { text: 'Hoạt động', value: false }, { text: 'Bị cấm', value: true } ],
            onFilter: (value, record) => record.is_banned === value,
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            render: (_, record) => (
                record.tenQuyen !== 'Admin' && ( // Only show actions for non-admins
                    <AntButton
                        type="primary"
                        danger={!record.is_banned} // Red button for banning
                        icon={record.is_banned ? <UnlockOutlined /> : <LockOutlined />}
                        onClick={() => handleBanUnban(record)}
                        size="small"
                    >
                        {record.is_banned ? 'Bỏ cấm' : 'Cấm'}
                    </AntButton>
                )
            ),
        },
    ];

    const permissionColumns = [
        {
            title: 'Tài nguyên',
            dataIndex: 'resource',
            key: 'resource',
            width: 150,
            fixed: 'left', // Fix resource column if table scrolls horizontally
        },
        ...actions.map(action => ({
            title: action.charAt(0).toUpperCase() + action.slice(1),
            dataIndex: action,
            key: action,
            align: 'center',
            width: 100,
            render: (hasPermission, record) => (
                <Checkbox
                    checked={!!hasPermission}
                    onChange={(e) => handlePermissionChange(record.resource, action, e.target.checked)}
                    // Disable if no user selected or if it's an Admin (optional: admins might be editable too)
                    disabled={!selectedUserForPermissions /* || selectedUserForPermissions?.tenQuyen === 'Admin' */}
                />
            ),
        })),
    ];

    // Prepare data for permission table
    const permissionDataSource = resources.map(resource => ({
        key: resource,
        resource: resource,
        // Safely access permissions, provide default false if resource/action doesn't exist
        view: permissions[resource]?.view ?? false,
        create: permissions[resource]?.create ?? false,
        update: permissions[resource]?.update ?? false,
        delete: permissions[resource]?.delete ?? false,
    }));


    // --- Render JSX ---
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <SidebarAdmin collapsed={collapsed} onCollapse={setCollapsed} onMenuClick={handleMenuClickSidebar} />
            <Layout className="site-layout">
                <Header
                    className="site-layout-background"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 24px',
                        backgroundColor: '#fff', // Use theme variable later if needed
                        borderBottom: '1px solid #f0f0f0'
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
                        <Popover content={<div>Quản lí tài khoản & phân quyền</div>} trigger="hover">
                            <SettingOutlined style={{ marginRight: 8, cursor: 'pointer' }} />
                        </Popover>
                        Quản Lý Tài Khoản & Quyền
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                        {/* Add other header elements like user profile dropdown here */}
                    </div>
                </Header>

                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280, overflow: 'initial' }}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        <TabPane tab="Tài khoản" key="taiKhoan">
                            <Table
                                columns={userColumns}
                                dataSource={userData}
                                loading={loading}
                                pagination={{
                                    pageSizeOptions: ['10', '20', '50'],
                                    showSizeChanger: true,
                                    showQuickJumper: true,
                                    position: ['bottomRight'],
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tài khoản`
                                }}
                                scroll={{ x: 'max-content' }} // Enable horizontal scroll if needed
                                rowKey="key" // Explicitly set rowKey
                            />
                        </TabPane>

                        <TabPane tab="Quyền" key="quyen">
                            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Select
                                    showSearch
                                    placeholder="Chọn người dùng để xem/sửa quyền"
                                    style={{ width: 300 }}
                                    onChange={handleUserSelectChange}
                                    allowClear
                                    filterOption={(input, option) =>
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={selectedUserForPermissions?.maTK} // Controlled component
                                >
                                    {userData.map(user => (
                                        <Option key={user.maTK} value={user.maTK}>
                                            {`${user.tenDangNhap} (${user.tenQuyen || 'N/A'})`}
                                        </Option>
                                    ))}
                                </Select>
                                {/* Add Save Button Here If Needed */}
                                {/* <AntButton
                                    type="primary"
                                    onClick={handleSaveChanges} // Implement handleSaveChanges function
                                    disabled={!selectedUserForPermissions || permissionLoading} // Disable when no user or loading
                                >
                                    Lưu thay đổi quyền
                                </AntButton> */}
                            </div>

                            {selectedUserForPermissions ? (
                                <Table
                                    columns={permissionColumns}
                                    dataSource={permissionDataSource}
                                    loading={permissionLoading}
                                    pagination={false}
                                    bordered
                                    size="small"
                                    scroll={{ x: 'max-content' }} // Ensure horizontal scroll for permissions too
                                    rowKey="key"
                                />
                            ) : (
                                <p>Vui lòng chọn một người dùng từ danh sách thả xuống ở trên để xem hoặc chỉnh sửa quyền.</p>
                            )}
                        </TabPane>
                    </Tabs>
                </Content>
            </Layout>
        </Layout>
    );
};

export default QuanLyTaiKhoan;