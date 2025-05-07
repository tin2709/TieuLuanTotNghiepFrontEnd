import React, { useState, useEffect, useCallback } from 'react';
import {
    Table,
    Button as AntButton,
    Layout,
    Menu,
    Popover,
    Tabs,
    Select,
    Checkbox,
    Spin // Import Spin for loading indicator
} from 'antd';
import {
    UserOutlined,
    DashboardOutlined,
    LogoutOutlined,
    LockOutlined,
    UnlockOutlined,
    SettingOutlined,
    SunOutlined,
    MoonOutlined,
    SaveOutlined // Icon for the save button
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header } from "antd/es/layout/layout";
import * as DarkReader from "darkreader";
import { useNavigate, useLoaderData } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin'; // Adjust path as needed

const { Content } = Layout;
const { TabPane } = Tabs;
const { Option } = Select;

const API_BASE_URL = "https://localhost:8080"; // Define API base URL

// Dark Mode Toggle Component (kept as is)
const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(DarkReader.isEnabled());

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
            title={isDarkMode ? "Tắt Chế độ Tối" : "Bật Chế độ Tối"}
        />
    );
};


// Main Component
const QuanLyTaiKhoan = () => {
    const loaderData = useLoaderData();
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(false); // Loading for user table
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();

    // State for Tabs and Permissions
    const [activeTab, setActiveTab] = useState('taiKhoan'); // 'taiKhoan' or 'quyen'
    const [selectedUserForPermissions, setSelectedUserForPermissions] = useState(null); // Store user object
    // Permissions state structure: { RESOURCE_NAME: { actionName: boolean, ... } }
    // This represents the *current* state reflecting checkbox changes.
    const [permissions, setPermissions] = useState({});
    // This stores the permissions *exactly as fetched from the backend*.
    // Used to determine if changes have been made.
    const [initialPermissions, setInitialPermissions] = useState({});
    const [permissionLoading, setPermissionLoading] = useState(false); // Loading for permissions tab/save
    const [isPermissionsChanged, setIsPermissionsChanged] = useState(false); // Flag to enable/disable save button


    // --- Define resources and actions (MUST match backend strings for API calls) ---
    // Use uppercase for backend API interaction, lowercase for internal state object keys
    const backendResources = ['COMPUTER', 'ROOM', 'FLOOR', 'BUILDING'];
    const backendActions = ['VIEW', 'CREATE', 'UPDATE', 'DELETE'];
    const internalActions = ['view', 'create', 'update', 'delete']; // Lowercase for object keys

    // --- Data Loading Effect (Initial User Data) ---
    useEffect(() => {
        setLoading(true);
        if (loaderData && !loaderData.error) {
            if (Array.isArray(loaderData.data)) {
                const processedData = loaderData.data.map((item, index) => ({
                    ...item,
                    key: item.maTK, // Use maTK as the unique key for rows
                    stt: index + 1,
                    tenQuyen: item.quyen ? item.quyen.tenQuyen : 'N/A', // Ensure tenQuyen is accessible
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
            if (loaderData.status === 401) {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi xác thực',
                    text: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
                    didClose: () => navigate('/login')
                });
            } else {
                Swal.fire('Lỗi', loaderData.message || 'Không thể tải dữ liệu người dùng.', 'error');
            }
            setUserData([]);
        }
        setLoading(false);
    }, [loaderData, navigate]);

    // --- Effect to track permission changes (without lodash) ---
    useEffect(() => {
        // Only compare if a user is selected AND both permission objects are initialized
        if (selectedUserForPermissions && permissions && initialPermissions) {
            // Use JSON.stringify for deep comparison
            const changed = JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
            setIsPermissionsChanged(changed);
            console.log("Permissions changed:", changed);
        } else {
            // If no user is selected, or states aren't initialized, there are no changes to save
            setIsPermissionsChanged(false);
        }
        // Add permissions and initialPermissions as dependencies
    }, [permissions, initialPermissions, selectedUserForPermissions]);


    // --- Navigation and Logout Handlers (Kept the prompt for unsaved changes) ---
    const handleMenuClickSidebar = (e) => {
        const keyRouteMap = {
            dashboard: '/admin',
            userManagement: '/quanlitaikhoan',
            teacherManagement: '/quanligiaovien',
            employeeManagement: '/quanlinhanvien',
            logout: '/login',
        };

        if (e.key === 'logout') {
            handleLogout();
        } else if (keyRouteMap[e.key]) {
            if (isPermissionsChanged) {
                Swal.fire({
                    title: 'Bạn có muốn lưu thay đổi?',
                    text: "Bạn có những thay đổi chưa lưu trong phần quản lý quyền.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Lưu',
                    cancelButtonText: 'Hủy bỏ',
                    reverseButtons: true,
                }).then(async (result) => {
                    if (result.isConfirmed) {
                        setPermissionLoading(true);
                        const saveSuccess = await handleSaveChanges(); // Attempt to save
                        setPermissionLoading(false);
                        if (saveSuccess) {
                            navigate(keyRouteMap[e.key]);
                        } else {
                            Swal.fire('Thông báo', 'Không thể đổi trang do lưu thất bại. Vui lòng thử lại.', 'info');
                        }
                    } else if (result.dismiss === Swal.DismissReason.cancel) {
                        navigate(keyRouteMap[e.key]);
                    }
                });
            } else {
                navigate(keyRouteMap[e.key]);
            }
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


    // --- Ban/Unban User Functions (Kept as is) ---
    const updateUserBanStatus = async (maTk, isBanning) => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại.', 'error');
            navigate('/login');
            return false;
        }

        const endpoint = isBanning ? `${API_BASE_URL}/banUser` : `${API_BASE_URL}/unbanUser`;
        const actionText = isBanning ? 'cấm' : 'bỏ cấm';

        try {
            setLoading(true);
            const response = await fetch(`${endpoint}?maTk=${maTk}&token=${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ từ máy chủ khi ${actionText}.` }));
                if (response.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi xác thực',
                        text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                        didClose: () => navigate('/login')
                    });
                    return false;
                }
                throw new Error(errorData.message || `Không thể ${actionText} người dùng.`);
            }

            setUserData(prev => prev.map(user => user.maTK === maTk ? { ...user, is_banned: isBanning } : user));

            Swal.fire('Thành công', `Người dùng đã được ${actionText}!`, 'success');
            return true;

        } catch (error) {
            console.error(`Error during ${actionText} user:`, error);
            Swal.fire('Lỗi', error.message, 'error');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handleBanUnban = (record) => {
        if (record.tenQuyen === 'Admin') {
            Swal.fire('Thông báo', 'Không thể cấm tài khoản Admin.', 'info');
            return;
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
            reverseButtons: true,
        }).then(async (result) => {
            if (result.isConfirmed) {
                await updateUserBanStatus(record.maTK, !record.is_banned);
            }
        });
    };


    // --- Permission Handling Functions ---

    // Fetches permissions for a selected user ID
    const fetchPermissions = useCallback(async (userId) => {
        console.log("Fetching permissions for user:", userId);
        setPermissionLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire('Lỗi', 'Không tìm thấy token xác thực. Vui lòng đăng nhập lại để tải quyền.', 'error');
            navigate('/login');
            setPermissionLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/getUserPermissionsByUserId?userId=${userId}&token=${token}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: "Phản hồi không hợp lệ từ máy chủ khi tải quyền." }));
                if (response.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi xác thực',
                        text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                        didClose: () => navigate('/login')
                    });
                } else {
                    Swal.fire('Lỗi', errorData.message || 'Không thể tải quyền cho người dùng này.', 'error');
                }
                setPermissions({});
                setInitialPermissions({});
                return;
            }

            const result = await response.json();
            console.log("Fetched permissions:", result.permissions);

            // --- Transform the flat list into the nested state structure ---
            const formattedPermissions = {};
            backendResources.forEach(res => {
                formattedPermissions[res] = {};
                internalActions.forEach(act => {
                    formattedPermissions[res][act] = false;
                });
            });

            if (Array.isArray(result.permissions)) {
                result.permissions.forEach(perm => {
                    const resource = perm.resource;
                    const action = perm.action.toLowerCase();

                    if (formattedPermissions[resource] && formattedPermissions[resource][action] !== undefined) {
                        formattedPermissions[resource][action] = true;
                    } else {
                        console.warn(`Ignoring unexpected permission: Resource "${perm.resource}", Action "${perm.action}"`);
                    }
                });
            }
            // --- End Transformation ---

            setPermissions(formattedPermissions);
            setInitialPermissions(formattedPermissions); // Store the fetched data as the initial state

        } catch (error) {
            console.error("Error fetching permissions:", error);
            Swal.fire('Lỗi', 'Đã có lỗi xảy ra khi tải quyền.', 'error');
            setPermissions({});
            setInitialPermissions({});
        } finally {
            setPermissionLoading(false);
        }
    }, [navigate, backendResources, internalActions]);


    // Helper function to handle the actual user selection logic
    // This function is called by handleUserSelectChange after checking for unsaved changes
    const proceedSelectUser = useCallback((value) => {
        const user = userData.find(u => u.maTK === value);
        setSelectedUserForPermissions(user);

        if (value !== undefined && value !== null) {
            if (user?.tenQuyen === 'Admin') {
                console.log("Admin selected, setting full permissions locally.");
                const adminPermissions = {};
                backendResources.forEach(res => {
                    adminPermissions[res] = {};
                    internalActions.forEach(act => {
                        adminPermissions[res][act] = true; // Admin has all permissions
                    });
                });
                setPermissions(adminPermissions);
                setInitialPermissions(adminPermissions); // Admin permissions are the "initial" state
                setPermissionLoading(false);
                // isPermissionsChanged will become false via useEffect because permissions === initialPermissions
            } else {
                // For non-admins, fetch their actual permissions
                fetchPermissions(value);
            }
        } else {
            // If selection is cleared
            setPermissions({});
            setInitialPermissions({});
            setSelectedUserForPermissions(null);
            // isPermissionsChanged will become false via useEffect
        }
    }, [userData, backendResources, internalActions, fetchPermissions]); // Add dependencies


    // Handler for the user selection dropdown change
    const handleUserSelectChange = (value) => {
        // If user is changing selection AND there are unsaved changes...
        if (selectedUserForPermissions && isPermissionsChanged) {
            Swal.fire({
                title: 'Bạn có muốn lưu thay đổi?',
                text: `Bạn có những thay đổi chưa lưu cho người dùng "${selectedUserForPermissions.tenDangNhap}". Lưu lại trước khi đổi người dùng khác?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Lưu',
                cancelButtonText: 'Hủy bỏ',
                reverseButtons: true,
            }).then(async (result) => {
                if (result.isConfirmed) {
                    setPermissionLoading(true);
                    const saveSuccess = await handleSaveChanges();
                    setPermissionLoading(false);
                    if (saveSuccess) {
                        // If saved successfully, proceed to select the new user
                        proceedSelectUser(value);
                    } else {
                        // If save failed, stay on the current user
                        Swal.fire('Thông báo', 'Không thể đổi người dùng do lưu thất bại. Vui lòng thử lại.', 'info');
                        // Revert the select dropdown back to the currently selected user
                        // This might require managing the Select's value state more explicitly if Ant Design doesn't handle it automatically after a failed change attempt
                    }
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    // User chose to discard changes and switch
                    proceedSelectUser(value);
                }
                // If user dismissed the dialog without choosing, do nothing (stay on current user)
            });
        } else {
            // No pending changes, proceed directly
            proceedSelectUser(value);
        }
    };

    // Handler for individual checkbox changes (local state update only)
    const handlePermissionChange = (resource, action, checked) => {
        const userId = selectedUserForPermissions?.maTK;
        if (!userId || selectedUserForPermissions?.tenQuyen === 'Admin') {
            console.warn("Cannot change permission: No user selected or user is Admin.");
            if (selectedUserForPermissions?.tenQuyen === 'Admin') {
                // Revert UI change if it happened anyway
                setPermissions(prev => ({
                    ...prev,
                    [resource]: {
                        ...(prev[resource] || {}),
                        [action]: true // Admins always have true
                    }
                }));
                Swal.fire('Thông báo', 'Không thể thay đổi quyền cho tài khoản Admin.', 'info');
            }
            return;
        }

        // Update local state immediately
        setPermissions(prevPermissions => ({
            ...prevPermissions,
            [resource]: {
                ...(prevPermissions[resource] || {}),
                [action]: checked,
            }
        }));
        // isPermissionsChanged will be updated by the useEffect hook
    };

    // Handler for the Save button click
    const handleSaveChanges = async () => {
        const userId = selectedUserForPermissions?.maTK;
        const token = localStorage.getItem('authToken');

        if (!userId || !token || !isPermissionsChanged || permissionLoading) {
            console.warn("Save button clicked but condition not met.");
            return false; // Cannot save
        }

        setPermissionLoading(true);
        const permissionsToAdd = [];
        const permissionsToDelete = [];

        // Determine which permissions need to be added or deleted
        // Iterate over backendResources and internalActions to cover all possibilities
        backendResources.forEach(resource => {
            internalActions.forEach(actionKey => { // actionKey is 'view', 'create', etc.
                const initialValue = initialPermissions[resource]?.[actionKey] ?? false;
                const currentValue = permissions[resource]?.[actionKey] ?? false;

                if (!initialValue && currentValue) {
                    // Permission was false, now true -> ADD
                    permissionsToAdd.push({ userId, resource, action: actionKey.toUpperCase() });
                } else if (initialValue && !currentValue) {
                    // Permission was true, now false -> DELETE
                    permissionsToDelete.push({ userId, resource, action: actionKey.toUpperCase() });
                }
            });
        });

        console.log("Permissions to Add:", permissionsToAdd);
        console.log("Permissions to Delete:", permissionsToDelete);

        let addSuccess = true;
        let deleteSuccess = true;
        const errorMessages = [];

        // --- API Call for Additions (only if there are items to add) ---
        if (permissionsToAdd.length > 0) {
            const addFormData = new FormData();
            addFormData.append('token', token);
            permissionsToAdd.forEach(p => {
                addFormData.append('userIds', p.userId);
                addFormData.append('resources', p.resource);
                addFormData.append('actions', p.action);
            });

            try {
                const response = await fetch(`${API_BASE_URL}/addMultipleUserPermission`, {
                    method: 'POST',
                    body: addFormData,
                });

                if (!response.ok) {
                    addSuccess = false;
                    const errorData = await response.json().catch(() => ({ message: "Phản hồi không hợp lệ từ máy chủ khi thêm quyền." }));
                    if (response.status === 401) {
                        errorMessages.push('Lỗi xác thực khi thêm quyền. Vui lòng đăng nhập lại.');
                        navigate('/login');
                    } else {
                        errorMessages.push(errorData.message || 'Không thể thêm các quyền đã chọn.');
                    }
                } else {
                    // const result = await response.json(); // Optionally log result
                    // console.log("Add permissions result:", result);
                }
            } catch (error) {
                addSuccess = false;
                console.error("Error adding permissions:", error);
                errorMessages.push(`Lỗi kết nối khi thêm quyền: ${error.message}`);
            }
        }

        // --- API Call for Deletions (only if there are items to delete) ---
        // Note: You might want to proceed with deletions even if additions failed,
        // depending on desired behavior. Current logic attempts deletions only if additions *succeeded*.
        // If you want to always attempt deletions, remove `&& addSuccess`
        if (permissionsToDelete.length > 0 && addSuccess) {
            const deleteFormData = new FormData();
            deleteFormData.append('token', token);
            permissionsToDelete.forEach(p => {
                deleteFormData.append('userIds', p.userId);
                deleteFormData.append('resources', p.resource);
                deleteFormData.append('actions', p.action);
            });

            try {
                // Note: Sending FormData with DELETE might not be universally supported by all servers/frameworks.
                // Using query parameters is the standard for DELETE requests if lists are manageable in URL length.
                const response = await fetch(`${API_BASE_URL}/deleteMultipleUserPermission`, {
                    method: 'DELETE',
                    body: deleteFormData, // Check if your backend specifically expects DELETE with FormData body
                });

                if (!response.ok) {
                    deleteSuccess = false;
                    const errorData = await response.json().catch(() => ({ message: "Phản hồi không hợp lệ từ máy chủ khi xóa quyền." }));
                    if (response.status === 401) {
                        errorMessages.push('Lỗi xác thực khi xóa quyền. Vui lòng đăng nhập lại.');
                        // navigate('/login'); // Already handled by first 401 check
                    } else {
                        errorMessages.push(errorData.message || 'Không thể xóa các quyền đã chọn.');
                    }
                } else {
                    // const result = await response.json(); // Optionally log result
                    // console.log("Delete permissions result:", result);
                }
            } catch (error) {
                deleteSuccess = false;
                console.error("Error deleting permissions:", error);
                errorMessages.push(`Lỗi kết nối khi xóa quyền: ${error.message}`);
            }
        }

        // --- Final Result Handling ---
        const overallSuccess = addSuccess && deleteSuccess;

        if (overallSuccess) {
            Swal.fire('Thành công', 'Đã cập nhật quyền người dùng!', 'success');
            // Re-fetch permissions to ensure UI is in sync with backend
            // This will update 'permissions' and 'initialPermissions' and setIsPermissionsChanged to false
            await fetchPermissions(userId);
        } else {
            const combinedErrorMessage = errorMessages.join('\n');
            Swal.fire('Lỗi Cập nhật', combinedErrorMessage || 'Đã xảy ra lỗi khi cập nhật quyền.', 'error');
            // Do NOT re-fetch permissions here. The UI still shows the *attempted* state,
            // and isPermissionsChanged remains true, indicating the save failed.
        }

        setPermissionLoading(false); // Hide loading regardless of success/failure
        return overallSuccess; // Return status for calling functions (like handleUserSelectChange)
    };


    // --- Table Column Definitions ---
    const userColumns = [
        { title: 'STT', dataIndex: 'stt', key: 'stt', width: 60, sorter: (a, b) => a.stt - b.stt },
        { title: 'Mã TK', dataIndex: 'maTK', key: 'maTK', width: 80, sorter: (a, b) => a.maTK - b.maTK },
        { title: 'Tên đăng nhập', dataIndex: 'tenDangNhap', key: 'tenDangNhap', sorter: (a, b) => a.tenDangNhap.localeCompare(b.tenDangNhap) },
        { title: 'Email', dataIndex: 'email', key: 'email', sorter: (a, b) => a.email.localeCompare(b.email) },
        { title: 'Tên Quyền', dataIndex: 'tenQuyen', key: 'tenQuyen', sorter: (a, b) => a.tenQuyen.localeCompare(b.tenQuyen) },
        {
            title: 'Trạng thái',
            dataIndex: 'is_banned',
            key: 'is_banned',
            render: (isBanned) => (isBanned ? <span style={{ color: 'red' }}>Bị cấm</span> : <span style={{ color: 'green' }}>Hoạt động</span>),
            sorter: (a, b) => (a.is_banned === b.is_banned ? 0 : a.is_banned ? 1 : -1),
            filters: [ { text: 'Hoạt động', value: false }, { text: 'Bị cấm', value: true } ],
            onFilter: (value, record) => record.is_banned === value,
        },
        {
            title: 'Hành động',
            key: 'action',
            align: 'center',
            width: 120,
            render: (_, record) => (
                record.tenQuyen !== 'Admin' && (
                    <AntButton
                        type="primary"
                        danger={!record.is_banned}
                        icon={record.is_banned ? <UnlockOutlined /> : <LockOutlined />}
                        onClick={() => handleBanUnban(record)}
                        size="small"
                        loading={loading}
                    >
                        {record.is_banned ? 'Bỏ cấm' : 'Cấm'}
                    </AntButton>
                )
            ),
        },
    ];

    // Mapping for displaying resource names in the table header
    const resourceDisplayNames = {
        COMPUTER: 'Máy tính',
        ROOM: 'Phòng máy',
        FLOOR: 'Tầng',
        BUILDING: 'Tòa nhà',
    };

    const permissionColumns = [
        {
            title: 'Tài nguyên',
            dataIndex: 'resource',
            key: 'resource',
            width: 150,
            fixed: 'left',
            render: (resourceKey) => resourceDisplayNames[resourceKey] || resourceKey,
        },
        ...internalActions.map(action => ({
            title: action.charAt(0).toUpperCase() + action.slice(1),
            dataIndex: action,
            key: action,
            align: 'center',
            width: 100,
            render: (hasPermission, record) => (
                <Checkbox
                    checked={!!hasPermission}
                    onChange={(e) => handlePermissionChange(record.resource, action, e.target.checked)}
                    // Disable if no user selected OR if the selected user is Admin OR while saving
                    disabled={!selectedUserForPermissions || selectedUserForPermissions?.tenQuyen === 'Admin' || permissionLoading}
                />
            ),
        })),
    ];

    // Prepare data for permission table from the 'permissions' state
    const permissionDataSource = backendResources.map(resource => ({
        key: resource,
        resource: resource,
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
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #f0f0f0'
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
                        {activeTab === 'taiKhoan' ? (
                            <Popover content={<div>Quản lí tài khoản</div>} trigger="hover">
                                <UserOutlined style={{ marginRight: 8 }} />
                            </Popover>
                        ) : (
                            <Popover content={<div>Quản lí quyền người dùng</div>} trigger="hover">
                                <LockOutlined style={{ marginRight: 8 }} />
                            </Popover>
                        )}
                        {activeTab === 'taiKhoan' ? 'Quản Lý Tài Khoản' : 'Quản Lý Quyền Người Dùng'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <DarkModeToggle />
                        {/* Add other header elements */}
                    </div>
                </Header>

                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280, overflow: 'initial' }}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab}>
                        <TabPane tab="Tài khoản" key="taiKhoan">
                            <Spin spinning={loading}>
                                <Table
                                    columns={userColumns}
                                    dataSource={userData}
                                    pagination={{
                                        pageSizeOptions: ['10', '20', '50'],
                                        showSizeChanger: true,
                                        showQuickJumper: true,
                                        position: ['bottomRight'],
                                        showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tài khoản`
                                    }}
                                    scroll={{ x: 'max-content' }}
                                    rowKey="key"
                                />
                            </Spin>
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
                                        option.children && typeof option.children === 'string' &&
                                        option.children.toLowerCase().includes(input.toLowerCase())
                                    }
                                    value={selectedUserForPermissions?.maTK}
                                    disabled={permissionLoading} // Disable select while loading/saving
                                >
                                    {userData.map(user => (
                                        <Option key={user.maTK} value={user.maTK}>
                                            {`${user.tenDangNhap} (${user.tenQuyen || 'N/A'})`}
                                        </Option>
                                    ))}
                                </Select>

                                {/* Save Button */}
                                <AntButton
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSaveChanges}
                                    disabled={!isPermissionsChanged || permissionLoading} // Disabled if no changes or currently loading/saving
                                    loading={permissionLoading}
                                >
                                    Lưu thay đổi quyền
                                </AntButton>
                            </div>

                            <Spin spinning={permissionLoading && !selectedUserForPermissions}> {/* Only show spinner if loading AND no user selected yet (avoids initial blink) */}
                                {selectedUserForPermissions ? (
                                    <>
                                        {selectedUserForPermissions.tenQuyen === 'Admin' && (
                                            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 4 }}>
                                                <p style={{ margin: 0, color: '#1890ff' }}>Tài khoản <strong>Admin</strong> có toàn quyền. Không thể thay đổi quyền của Admin.</p>
                                            </div>
                                        )}
                                        {selectedUserForPermissions.tenQuyen !== 'Admin' && (
                                            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 4 }}>
                                                <p style={{ margin: 0, color: '#faad14' }}>Hãy nhấn nút "Lưu thay đổi quyền" sau khi chỉnh sửa để áp dụng.</p>
                                            </div>
                                        )}
                                        <Table
                                            columns={permissionColumns}
                                            dataSource={permissionDataSource}
                                            pagination={false}
                                            bordered
                                            size="small"
                                            scroll={{ x: 'max-content' }}
                                            rowKey="key"
                                            // Optional: Add a class or style to indicate disabled interaction while saving
                                            // style={{ pointerEvents: permissionLoading ? 'none' : 'auto', opacity: permissionLoading ? 0.6 : 1 }}
                                        />
                                    </>
                                ) : (
                                    <p>Vui lòng chọn một người dùng từ danh sách thả xuống ở trên để xem hoặc chỉnh sửa quyền.</p>
                                )}
                            </Spin>
                        </TabPane>
                    </Tabs>
                </Content>
            </Layout>
        </Layout>
    );
};

export default QuanLyTaiKhoan;