import React, { useState, useEffect, useCallback } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined,
    QuestionCircleOutlined,
    LoadingOutlined,
    LockOutlined // <<< ADDED LockOutlined import
} from "@ant-design/icons";
import {
    Button,
    Input,
    Select,
    Table,
    Checkbox,
    Dropdown,
    Menu,
    Layout,
    Spin,
    Typography,
    Space, // <<< ADDED Space import
    Row, // <<< ADDED Row import (used in Home, keep for consistency if shared)
    Col, // <<< ADDED Col import (used in Home, keep for consistency)
    Card, // <<< ADDED Card import (used in Home, keep for consistency)
    Form, // <<< ADDED Form import (used in Home, keep for consistency)
    Anchor, // <<< ADDED Anchor import (used in Home, keep for consistency)
    message // <<< ADDED message import (using Ant Design's message component)
} from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import font from "../../font/font"; // Assuming this is a local font file
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import ImportFileModal from "./ImportFileModal"; // Assuming this component exists
import introJs from 'intro.js';
import 'intro.js/introjs.css';

const { Option } = Select;
const { Header, Content } = Layout;
// <<< MODIFIED Typography destructuring to include Title
const { Text, Title } = Typography;


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

    useEffect(() => {
        setIsDarkMode(DarkReader.isEnabled());
        // Cleanup function is important
        return () => {
            // Consider the scope if other parts of your app use DarkReader
        };
    }, []);


    return (
        <Button
            icon={isDarkMode ? <SunOutlined style={{ color: 'yellow' }} /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{ fontSize: '20px', border: 'none', backgroundColor: 'transparent' }}
            title={isDarkMode ? "Tắt Chế độ Tối" : "Bật Chế độ Tối"}
        />
    );
};


export default function TangManagement() {
    const loaderResult = useLoaderData();
    const navigate = useNavigate();
    const navigation = useNavigation();

    const maTK = localStorage.getItem("maTK");
    const authToken = localStorage.getItem("authToken");
    const rawUserRole = localStorage.getItem("userRole");

    const [search, setSearch] = useState("");
    const [tangs, setTangs] = useState([]);
    const [initialTangs, setInitialTangs] = useState([]);

    const [selectedColumn, setSelectedColumn] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);

    // <<< ADDED filteredTangs state (Fixes `filteredTangs is not defined`)
    const [filteredTangs, setFilteredTangs] = useState(null);

    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
    const [sortInfo, setSortInfo] = useState({});

    const [hasSelected, setHasSelected] = useState(false);

    // --- State for Permissions ---
    const [userPermissions, setUserPermissions] = useState({}); // { RESOURCE: { ACTION: true/false } }
    const [permissionsLoading, setPermissionsLoading] = useState(true); // Loading permissions

    // Derived state to easily check specific permissions
    const canViewFloor = rawUserRole === "1" || userPermissions?.FLOOR?.VIEW === true;
    const canCreateFloor = rawUserRole === "1" || userPermissions?.FLOOR?.CREATE === true;
    const canUpdateFloor = rawUserRole === "1" || userPermissions?.FLOOR?.UPDATE === true;
    const canDeleteFloor = rawUserRole === "1" || userPermissions?.FLOOR?.DELETE === true;
    // --- End State for Permissions ---

    // <<< MOVED overallLoading declaration BEFORE its usage in JSX
    // Overall loading state combining navigation, internal actions, and permission loading
    const overallLoading = navigation.state !== 'idle' || internalLoading || permissionsLoading;


    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            ...(canCreateFloor ? [{
                element: '#create-new-dropdown-button-tang', // Use the button ID
                intro: 'Tạo tầng mới bằng form hoặc import từ file.',
                position: 'bottom-start'
            }] : []),
            ...(canDeleteFloor ? [{
                element: '#delete-selected-button-tang',
                intro: 'Xóa các tầng đã được chọn (tick vào checkbox).',
                position: 'top-end',
            }] : []),
            { // Add other steps that are always visible
                element: '#search-input-tang',
                intro: 'Nhập tên tầng hoặc thông tin liên quan để tìm kiếm.',
                position: 'bottom-start'
            },
            {
                element: '#column-select-tang',
                intro: 'Chọn cột bạn muốn tìm kiếm (Tên tầng, Tên tòa nhà).',
                position: 'bottom-start',
            },
            {
                element: '#export-pdf-button-tang',
                intro: 'Xuất danh sách tầng ra file PDF.',
                position: 'bottom-start'
            },
            {
                element: '#export-excel-button-tang',
                intro: 'Xuất danh sách tầng ra file Excel.',
                position: 'bottom-start'
            },
            {
                element: '.ant-table-thead > tr > th[data-column-key="tenTang"]', // Use data-column-key for better targeting
                intro: 'Click vào đây để sắp xếp danh sách tầng theo tên.',
                position: 'bottom'
            },
            {
                element: '.ant-table-thead > tr > th[data-column-key="tenToaNha"]', // Use data-column-key
                intro: 'Click vào đây để sắp xếp danh sách tầng theo tên tòa nhà.',
                position: 'bottom'
            },
            // Target action buttons if they exist in the first row before adding this step
            // Check if the action column is even rendered before trying to find buttons within it
            ...(canUpdateFloor || canDeleteFloor) && document.querySelector('.ant-table-tbody > tr:first-child .ant-table-cell:last-child .ant-btn') ? [{
                element: '.ant-table-tbody > tr:first-child .ant-table-cell:last-child',
                intro: 'Tại cột này, bạn có thể chỉnh sửa hoặc xóa tầng (nếu có quyền).',
                position: 'left'
            }] : [],
            {
                element: '#logout-button-tang',
                intro: 'Đăng xuất khỏi ứng dụng quản lý tầng.',
                position: 'bottom-end'
            },
        ].filter(step => document.querySelector(step.element));

        if (steps.length > 0) {
            introJs().setOptions({
                steps: steps,
                nextLabel: 'Tiếp theo',
                prevLabel: 'Quay lại',
                doneLabel: 'Hoàn tất',
                scrollTo: 'element',
                overlayOpacity: 0.5,
                disableInteraction: true,
            }).start();
        } else {
            Swal.fire('Thông báo', 'Không tìm thấy các thành phần hướng dẫn trên trang. Vui lòng đảm bảo bạn có quyền xem danh sách tầng.', 'info');
        }
    };


    // --- Effect to fetch user permissions on component mount ---
    useEffect(() => {
        console.log("[Component Tang] Checking User Info for Permissions");
        if (!maTK || !authToken) {
            console.error("[Component Tang] Missing maTK or authToken in localStorage. Redirecting to login.");
            setTimeout(() => {
                Swal.fire({
                    title: "Lỗi Xác thực",
                    text: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
                    icon: "error",
                    timer: 2500,
                    showConfirmButton: false,
                    willClose: () => navigate('/login', { replace: true })
                });
            }, 0);
            return;
        }

        if (rawUserRole === "1") {
            console.log("[Component Tang] Admin user detected, assuming full permissions for UI.");
            const adminPerms = {
                FLOOR: { VIEW: true, CREATE: true, UPDATE: true, DELETE: true }
            };
            setUserPermissions(adminPerms);
            setPermissionsLoading(false);
            return;
        }

        const fetchUserPermissions = async () => {
            setPermissionsLoading(true);
            try {
                console.log(`[Component Tang] Fetching permissions for user ID: ${maTK}`);
                const response = await fetch(`${API_BASE_URL}/getUserPermissionsByUserId?userId=${maTK}&token=${authToken}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ từ máy chủ khi tải quyền (Status: ${response.status}).` }));
                    console.error("[Component Tang] Failed to fetch user permissions:", response.status, errorData);
                    if (response.status === 401) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi xác thực',
                            text: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
                            didClose: () => navigate('/login', { replace: true })
                        });
                    } else {
                        Swal.fire('Lỗi', errorData.message || 'Không thể tải quyền người dùng.', 'error');
                    }
                    setUserPermissions({});
                    return;
                }

                const result = await response.json();
                console.log("[Component Tang] Fetched user permissions:", result.permissions);

                const formattedPermissions = {};
                if (Array.isArray(result.permissions)) {
                    result.permissions.forEach(perm => {
                        const resource = perm.resource;
                        const action = perm.action;

                        if (!formattedPermissions[resource]) {
                            formattedPermissions[resource] = {};
                        }
                        formattedPermissions[resource][action] = true;
                    });
                }
                setUserPermissions(formattedPermissions);

            } catch (error) {
                console.error("[Component Tang] Error during fetch for user permissions:", error);
                Swal.fire('Lỗi', 'Đã có lỗi xảy ra khi tải quyền.', 'error');
                setUserPermissions({});
            } finally {
                setPermissionsLoading(false);
            }
        };

        fetchUserPermissions();

    }, [maTK, authToken, rawUserRole, navigate]);


    // --- Effect to handle loader data ---
    useEffect(() => {
        if (!permissionsLoading) { // Wait until permissions are loaded
            console.log("[Component Tang] Permissions loaded, processing loader data.");
            // Only attempt to process loader data if user has VIEW permission
            if (canViewFloor) {
                if (loaderResult?.error) {
                    console.error("Loader Error Handled in Component Tang:", loaderResult);
                    setLoadError(loaderResult);
                    setTangs([]);
                    setInitialTangs([]);
                    setFilteredTangs(null); // Also clear filtered state
                } else if (loaderResult?.data) {
                    const data = loaderResult.data || [];
                    console.log("[Component Tang] Setting initial tangs data:", data);
                    setInitialTangs(data);
                    setFilteredTangs(null); // Ensure filtered state is null on initial data load
                    updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, data);
                    setLoadError(null);
                } else {
                    console.warn("[Component Tang] Loader result has no data or error, setting empty initial data.");
                    setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
                    setTangs([]);
                    setInitialTangs([]);
                    setFilteredTangs(null);
                }
            } else {
                // If permissions loaded but user cannot view, ensure table is empty
                console.log("[Component Tang] User does not have VIEW permission, clearing tangs data.");
                setTangs([]);
                setInitialTangs([]);
                setFilteredTangs(null);
                setLoadError(null); // Clear any potential previous loader error if permission check takes over
            }
        }
    }, [loaderResult, permissionsLoading, canViewFloor, pagination.pageSize, sortInfo.field, sortInfo.order]);


    // --- SSE Effect (Kept as is) ---
    useEffect(() => {
        const eventSource = new EventSource("https://localhost:8080/subscribe");
        eventSource.onopen = () => console.log("SSE connection opened for Tang");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                if (messageText.toLowerCase().includes("tầng")) {
                    console.log("SSE indicates Tang change, reloading...");
                    Swal.fire({
                        title: "Thông báo",
                        text: "Dữ liệu tầng đã được cập nhật. Trang sẽ được tải lại.",
                        icon: "info",
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        willClose: () => {
                            navigate(0);
                        }
                    });
                }
            }
        };
        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            if (eventSource.readyState === EventSource.CLOSED) {
                console.log("SSE connection closed.");
            }
            eventSource.close();
        };
        return () => { eventSource.close(); };
    }, [navigate]);

    // --- Chatbot Script Effect (Kept as is) ---
    useEffect(() => {
        const script1 = document.createElement("script");
        script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
        script1.async = true;
        document.body.appendChild(script1);

        const script2 = document.createElement("script");
        script2.src = "https://files.bpcontent.cloud/2025/03/03/16/20250303163810-YF2W2K0X.js";
        script2.async = true;
        document.body.appendChild(script2);

        return () => {
            const existingScript1 = document.querySelector(`script[src="${script1.src}"]`);
            const existingScript2 = document.querySelector(`script[src="${script2.src}"]`);
            if (existingScript1) document.body.removeChild(existingScript1);
            if (existingScript2) document.body.removeChild(existingScript2);
        };
    }, []);


    // --- CRUD Operations (Modified to check permissions) ---

    const handleDelete = (record) => {
        if (!canDeleteFloor) {
            Swal.fire('Thông báo', 'Bạn không có quyền xóa tầng.', 'warning');
            return;
        }

        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa tầng này?",
            text: `Tầng: ${record.tenTang}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                deleteTang(record.maTang);
            }
        });
    };

    const deleteTang = async (maTang) => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error");
            navigate('/login');
            return;
        }

        setInternalLoading(true);
        try {
            const url = `${API_BASE_URL}/XoaTang?maTang=${maTang}&token=${token}`;
            const response = await fetch(url, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ từ máy chủ (Status: ${response.status}).` }));
                if (response.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi xác thực',
                        text: 'Phiên đăng nhập đã hết hạn khi xóa. Vui lòng đăng nhập lại.',
                        didClose: () => navigate('/login', { replace: true })
                    });
                } else {
                    throw new Error(errorData.message || `Không thể xóa tầng (Status: ${response.status})`);
                }
            } else {
                // Local state update for responsiveness
                const updatedInitialTangs = initialTangs.filter(tang => tang.maTang !== maTang);
                setInitialTangs(updatedInitialTangs);
                setSelectedRowKeys(prev => prev.filter(key => key !== maTang));
                Swal.fire("Thành công", "Đã xóa tầng thành công.", "success");

                // Re-apply filter/sort/pagination to the updated initialTangs
                const sourceDataAfterDelete = filteredTangs ? filteredTangs.filter(tang => tang.maTang !== maTang) : updatedInitialTangs; // Filter the correct source
                setFilteredTangs(filteredTangs ? sourceDataAfterDelete : null); // Update filtered state if applicable
                updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, sourceDataAfterDelete);
            }
        } catch (error) {
            console.error("Error deleting tang:", error);
            Swal.fire("Lỗi", "Có lỗi xảy ra khi xóa tầng: " + error.message, "error");
        } finally {
            setInternalLoading(false);
        }
    };

    const confirmDeleteMultiple = () => {
        if (!canDeleteFloor) {
            Swal.fire('Thông báo', 'Bạn không có quyền xóa nhiều tầng.', 'warning');
            return;
        }
        if (selectedRowKeys.length === 0) {
            Swal.fire("Thông báo", "Vui lòng chọn ít nhất một tầng để xóa.", "info");
            return;
        }

        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa các tầng đã chọn?",
            text: `Bạn đang cố gắng xóa ${selectedRowKeys.length} tầng.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMultipleTangs();
            }
        });
    };

    const deleteMultipleTangs = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error");
            navigate('/login');
            return;
        }
        if (selectedRowKeys.length === 0) return;

        setInternalLoading(true);
        try {
            const maTangListString = selectedRowKeys.join(",");
            const url = `${API_BASE_URL}/XoaNhieuTang?maTangList=${maTangListString}&token=${token}`;

            const response = await fetch(url, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ từ máy chủ (Status: ${response.status}).` }));
                if (response.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi xác thực',
                        text: 'Phiên đăng nhập đã hết hết hạn khi xóa nhiều. Vui lòng đăng nhập lại.',
                        didClose: () => navigate('/login', { replace: true })
                    });
                } else {
                    throw new Error(errorData.message || `Không thể xóa nhiều tầng (Status: ${response.status})`);
                }
            } else {
                // Local state update for responsiveness
                const updatedInitialTangs = initialTangs.filter(tang => !selectedRowKeys.includes(tang.maTang));
                setInitialTangs(updatedInitialTangs);
                Swal.fire("Thành công", `Đã xóa ${selectedRowKeys.length} tầng thành công.`, "success");
                setSelectedRowKeys([]);

                // Re-apply filter/sort/pagination to the updated initialTangs
                const sourceDataAfterDelete = filteredTangs ? filteredTangs.filter(tang => !selectedRowKeys.includes(tang.maTang)) : updatedInitialTangs; // Filter the correct source
                setFilteredTangs(filteredTangs ? sourceDataAfterDelete : null); // Update filtered state if applicable
                updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, sourceDataAfterDelete);
            }

        } catch (error) {
            console.error("Error deleting multiple tangs:", error);
            Swal.fire("Lỗi", "Có lỗi xảy ra khi xóa nhiều tầng: " + error.message, "error");
        } finally {
            setInternalLoading(false);
        }
    };


    // --- Search/Filter/Sort Logic ---
    const sortData = (data, sortKey, sortOrder) => {
        if (!sortKey || !sortOrder) return data;

        const sortedData = [...data].sort((a, b) => {
            let valueA, valueB;
            if (sortKey === 'toaNha.tenToaNha') {
                valueA = a.toaNha?.tenToaNha || '';
                valueB = b.toaNha?.tenToaNha || '';
            } else {
                valueA = a[sortKey];
                valueB = b[sortKey];
            }

            if (typeof valueA === "string" && typeof valueB === "string") {
                return sortOrder === "ascend"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } else if (typeof valueA === "number" && typeof valueB === "number") {
                return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
            } else {
                if (valueA == null && valueB == null) return 0;
                if (valueA == null) return 1;
                if (valueB == null) return -1;
                return 0;
            }
        });

        return sortedData;
    };

    // Use useCallback for updateTableData if it's a dependency in other effects
    const updateTableData = useCallback((page, pageSize, sortField, sortOrder, sourceData) => {
        const dataToPaginateAndSort = sourceData || initialTangs;

        let sortedData = sortData(dataToPaginateAndSort, sortField, sortOrder);

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = sortedData.slice(startIndex, endIndex);
        setTangs(paginatedData);
    }, [initialTangs, filteredTangs]); // Add dependencies


    const handleSearch = (e) => {
        const searchValue = e.target.value;
        setSearch(searchValue);

        if (selectedColumn && selectedColumn !== 'all' && searchValue) {
            performSearch(searchValue, selectedColumn);
        } else if (!searchValue && selectedColumn && selectedColumn !== 'all') {
            setFilteredTangs(null);
            updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, initialTangs);
        } else if (searchValue && selectedColumn === 'all') {
            const lowerSearch = searchValue.toLowerCase();
            const locallyFiltered = initialTangs.filter(tang => {
                const matchesTenTang = tang.tenTang?.toLowerCase().includes(lowerSearch);
                const matchesTenToaNha = tang.toaNha?.tenToaNha?.toLowerCase().includes(lowerSearch);
                return matchesTenTang || matchesTenToaNha;
            });
            setFilteredTangs(locallyFiltered);
            updateTableData(1, pagination.pageSize, sortInfo.field, sortInfo.order, locallyFiltered);
            setPagination(prev => ({ ...prev, current: 1 }));
        } else {
            setFilteredTangs(null);
            updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, initialTangs);
        }
    };

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
        if (search) {
            if (column && column !== 'all') {
                performSearch(search, column);
            } else if (column === 'all') {
                const lowerSearch = search.toLowerCase();
                const locallyFiltered = initialTangs.filter(tang => {
                    const matchesTenTang = tang.tenTang?.toLowerCase().includes(lowerSearch);
                    const matchesTenToaNha = tang.toaNha?.tenToaNha?.toLowerCase().includes(lowerSearch);
                    return matchesTenTang || matchesTenToaNha;
                });
                setFilteredTangs(locallyFiltered);
                updateTableData(1, pagination.pageSize, sortInfo.field, sortInfo.order, locallyFiltered);
                setPagination(prev => ({ ...prev, current: 1 }));
            } else {
                setFilteredTangs(null);
                updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, initialTangs);
            }
        } else {
            setFilteredTangs(null);
            updateTableData(pagination.current, pagination.pageSize, sortInfo.field, sortInfo.order, initialTangs);
        }
    };


    // API search logic (only used when specific column selected)
    const performSearch = async (searchValue, searchColumn) => {
        if (!searchValue || !searchColumn || searchColumn === 'all') {
            return;
        }

        const token = localStorage.getItem("authToken");
        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error");
            navigate('/login');
            return;
        }
        setInternalLoading(true);
        try {
            const keywordParam = `${searchColumn}:${searchValue}`;
            const url = `${API_BASE_URL}/searchTang?keyword=${encodeURIComponent(keywordParam)}&token=${encodeURIComponent(token)}`;

            const response = await fetch(url);

            if (!response.ok) {
                console.error("Search API Error:", response.status, response.statusText);
                const errorData = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ khi tìm kiếm (Status: ${response.status}).` }));
                if (response.status === 401) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi xác thực',
                        text: 'Phiên đăng nhập hết hạn khi tìm kiếm. Vui lòng đăng nhập lại.',
                        didClose: () => navigate('/login', { replace: true })
                    });
                } else if (response.status === 204) {
                    setFilteredTangs([]);
                    updateTableData(1, pagination.pageSize, sortInfo.field, sortInfo.order, []);
                    setPagination(prev => ({ ...prev, current: 1 }));
                    console.log("Search returned no results (204).");
                } else {
                    throw new Error(errorData.message || `Lỗi tìm kiếm (Status: ${response.status})`);
                }
                setTangs([]);
                setFilteredTangs([]);
                return;
            }

            const data = await response.json();
            console.log("Search results:", data);

            const searchResults = data.results || [];
            setFilteredTangs(searchResults);
            updateTableData(1, pagination.pageSize, sortInfo.field, sortInfo.order, searchResults);
            setPagination(prev => ({ ...prev, current: 1 }));

        } catch (error) {
            console.error("Error during search fetch:", error);
            Swal.fire("Lỗi", "Có lỗi xảy ra khi tìm kiếm dữ liệu: " + error.message, "error");
            setTangs([]);
            setFilteredTangs([]);
        } finally {
            setInternalLoading(false);
        }
    };


    // Handle table change (pagination, sort, filter) - filters from Ant Design columns are handled separately
    const handleTableChange = (newPagination, antdFilters, sorter) => {
        const { current, pageSize } = newPagination;

        let sortField = sorter?.field;
        let sortOrder = sorter?.order;

        setSortInfo({ field: sortField, order: sortOrder });

        setPagination(newPagination);

        const sourceData = filteredTangs || initialTangs;
        updateTableData(current, pageSize, sortField, sortOrder, sourceData);
    };


    // Checkbox selection handler (Kept as is)
    const onSelectChange = (newSelectedRowKeys) => {
        console.log("Selected Row Keys changed: ", newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
        setHasSelected(newSelectedRowKeys.length > 0);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: overallLoading || !canDeleteFloor, // Disable checkboxes while loading or if user cannot delete
            name: record.maTang,
        }),
    };


    // --- Export Functions (Kept as is, assuming always allowed if viewing data) ---
    const exportToPDF = () => {
        if (!canViewFloor) {
            Swal.fire('Thông báo', 'Bạn không có quyền xem dữ liệu để xuất PDF.', 'warning');
            return;
        }
        if (initialTangs.length === 0) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất.', 'info');
            return;
        }
        const doc = new jsPDF();
        doc.addFileToVFS("Arial.ttf", font);
        doc.setFont("Arial");

        doc.autoTable({
            head: [["STT", "Mã Tầng", "Tên Tầng", "Tên Tòa nhà"]],
            body: initialTangs.map((tang, index) => [
                index + 1,
                tang.maTang,
                tang.tenTang,
                tang.toaNha?.tenToaNha || '',
            ]),
            startY: 20,
            headStyles: { fillColor: [41, 128, 185], textColor: 255, font: "Arial" },
            bodyStyles: { font: "Arial" },
            alternateRowStyles: { fillColor: 245 },
            styles: { cellPadding: 3, fontSize: 10, overflow: 'linebreak' },
            columnStyles: { 1: { cellWidth: 20 } }
        });

        doc.save("DanhSachTang.pdf");
    };

    const exportToExcel = () => {
        if (!canViewFloor) {
            Swal.fire('Thông báo', 'Bạn không có quyền xem dữ liệu để xuất Excel.', 'warning');
            return;
        }
        if (initialTangs.length === 0) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất.', 'info');
            return;
        }
        const wb = XLSX.utils.book_new();
        const dataToExport = initialTangs.map(tang => ({
            "Mã Tầng": tang.maTang,
            "Tên Tầng": tang.tenTang,
            "Tên Tòa Nhà": tang.toaNha?.tenToaNha || '',
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachTang");
        XLSX.writeFile(wb, "DanhSachTang.xlsx");
    };


    // --- Menu and Import Modal (Controlled by CREATE permission) ---
    const showImportModal = () => {
        if (!canCreateFloor) {
            Swal.fire('Thông báo', 'Bạn không có quyền import tầng.', 'warning');
            return;
        }
        setIsModalVisible(true);
    };

    const hideImportModal = () => {
        setIsModalVisible(false);
    };

    const handleImport = async (file) => {
        console.log("File imported:", file);
        Swal.fire('Thông báo', 'Chức năng import đang được phát triển.', 'info');
        hideImportModal();
    };

    const createNewMenu = (
        <Menu id="create-new-dropdown-tang">
            {/* Only show 'Tạo mới bằng form' if user can create */}
            {canCreateFloor && (
                <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addtang`)}>
                    Tạo mới bằng form
                </Menu.Item>
            )}
            {/* Only show 'Tạo mới bằng file' (Import) if user can create */}
            {canCreateFloor && ( // Assuming import requires CREATE permission
                <Menu.Item key="2" icon={<FileAddOutlined />} onClick={showImportModal}>
                    Tạo mới bằng file
                </Menu.Item>
            )}
        </Menu>
    );


    // --- Logout Handler (Kept as is) ---
    const handleLogout = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error");
            navigate('/login');
            return;
        }

        try {
            const url = `${API_BASE_URL}/logout?token=${token}`;
            const response = await fetch(url, {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Phản hồi không hợp lệ khi đăng xuất (Status: ${response.status}).` }));
                const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
                if (response.status === 401) {
                    console.warn("Logout API returned 401, but proceeding with local logout.");
                } else {
                    throw new Error(errorMessage);
                }
            }

            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("maTK");
            localStorage.removeItem("username");
            localStorage.removeItem("userRole");
            localStorage.removeItem("loginSuccessTimestamp");
            localStorage.removeItem("expireAt");

            Swal.fire("Thành công!", "Đăng xuất thành công!", "success").then(() => {
                navigate("/login", { replace: true });
            });
        } catch (error) {
            console.error("Logout error:", error);
            Swal.fire("Lỗi", "Đăng xuất thất bại: " + error.message, "error");
        }
    };

    // --- Table Columns Definition (Modified based on permissions) ---
    const columns = [
        {
            // Checkbox column always visible (though disabled while loading)
            // Only include checkbox column if user has permission to delete (since it's for bulk delete)
            ...(canDeleteFloor ? {
                title: (
                    <Checkbox
                        onChange={(e) => {
                            const sourceDataKeys = (filteredTangs || initialTangs).map(record => record.maTang);
                            setSelectedRowKeys(e.target.checked ? sourceDataKeys : []);
                            setHasSelected(e.target.checked);
                        }}
                        checked={(filteredTangs || initialTangs).length > 0 && selectedRowKeys.length === (filteredTangs || initialTangs).length}
                        indeterminate={
                            selectedRowKeys.length > 0 && selectedRowKeys.length < (filteredTangs || initialTangs).length
                        }
                        disabled={overallLoading || !canDeleteFloor}
                    />
                ),
                key: "checkbox",
                width: 50,
                fixed: "left",
            } : {}), // If cannot delete, render an empty object for this column entry
        },
        {
            title: "STT",
            key: "stt",
            width: 60,
            render: (text, record, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: "Mã Tầng",
            dataIndex: "maTang",
            key: "maTang",
            width: 100,
            sorter: (a, b) => a.maTang - b.maTang,
        },
        {
            title: "Tên Tầng",
            dataIndex: "tenTang",
            key: "tenTang",
            width: 200,
            sorter: (a, b) => a.tenTang.localeCompare(b.tenTang),
        },
        {
            title: "Tên Tòa Nhà",
            dataIndex: ["toaNha", "tenToaNha"],
            key: "tenToaNha",
            width: 200,
            render: (text, record) => record.toaNha?.tenToaNha || '',
            sorter: (a, b) => (a.toaNha?.tenToaNha || '').localeCompare(b.toaNha?.tenToaNha || ''),
        },

        // Only include the 'Hành động' column if the user has UPDATE or DELETE permission
        (canUpdateFloor || canDeleteFloor) ? {
            title: "Hành động",
            key: "action",
            width: 120,
            fixed: 'right',
            render: (text, record) => (
                <div className="flex justify-center gap-2">
                    {/* Only show Edit button if user has UPDATE permission */}
                    {canUpdateFloor && (
                        <Button
                            icon={<EditOutlined />}
                            size="small"
                            type="link"
                            onClick={() => navigate(`/edittang/${record.maTang}`)}
                            title="Chỉnh sửa tầng"
                            disabled={overallLoading}
                        />
                    )}
                    {/* Only show Delete button if user has DELETE permission */}
                    {canDeleteFloor && (
                        <Button
                            icon={<DeleteOutlined />}
                            size="small"
                            type="link"
                            danger
                            onClick={() => handleDelete(record)}
                            title="Xóa tầng"
                            disabled={overallLoading}
                        />
                    )}
                    {/* Message button (kept as is) */}
                    <Button
                        icon={<MessageOutlined />}
                        size="small"
                        type="link"
                        onClick={() => console.log("Message to tang:", record.tenTang)}
                        title="Gửi tin nhắn (Chức năng chưa hoàn thiện)"
                        disabled={overallLoading}
                    />
                </div>
            ),
        } : {}, // If no update or delete permission, render an empty object for this column entry

    ].filter(column => Object.keys(column).length > 0); // Filter out any empty objects resulting from conditional rendering

    // Handle checkbox column conditionally for rowSelection
    const rowSelectionConfig = canDeleteFloor ? {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: overallLoading || !canDeleteFloor,
            name: record.maTang,
        }),
    } : undefined; // Set to undefined if user cannot delete

    // Overall loading state combining navigation, internal actions, and permission loading
    // <<< The original position was here. Moved it up.
    // const overallLoading = navigation.state !== 'idle' || internalLoading || permissionsLoading;


    return (
        <Layout className="lab-management-layout">
            <style>{`body { font-display: swap !important; }`}</style>

            {/* --- Header --- */}
            <Header
                className="lab-management-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#fff",
                    padding: "0 24px",
                }}
            >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                    {overallLoading && !canViewFloor ? ( // Use overallLoading here
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
                    ) : (
                        "Danh sách tầng"
                    )}
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center", gap: '16px' }}>
                    <DarkModeToggle />
                    <Button id="logout-button-tang" icon={<LogoutOutlined />} type="text" onClick={handleLogout} title="Đăng xuất">
                        <Text>Đăng xuất</Text>
                    </Button>
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour} title="Hướng dẫn sử dụng trang quản lý tầng">Hướng dẫn</Button>
                </div>
            </Header>

            {/* --- Content --- */}
            <Content className="lab-management-content" style={{ padding: "24px" }}>
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
                    <a href="/" className="flex items-center hover:text-primary">
                        <HomeOutlined className="h-4 w-4" />
                        <span className="ml-1">Trang chủ</span>
                    </a>
                    <span className="mx-1">/</span>
                    <Text disabled>Quản lý Tầng</Text>
                </nav>

                {/* Show loading message for overall loading before permissions are known */}
                {overallLoading && !canViewFloor && ( // Only show this specific message if overall loading AND cannot view yet
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin indicator={<LoadingOutlined style={{ fontSize: 50 }} spin />} />
                        <Title level={4} style={{ color: '#bfbfbf', marginTop: '20px' }}>Đang tải thông tin quyền...</Title>
                    </div>
                )}

                {/* Render controls and table only if user has VIEW permission OR if loading/permissions are not yet determined for non-VIEW users */}
                {/* This ensures controls don't flash before the "no permission" message appears */}
                {canViewFloor || permissionsLoading || navigation.state !== 'idle' /* Add other initial loading indicators if needed */}
                {(!overallLoading && !canViewFloor) ? ( // Explicitly show 'no permission' message when loading is done and cannot view
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <LockOutlined style={{ fontSize: '50px', color: '#f0f0f0' }} />
                        <Title level={4} style={{ color: '#bfbfbf', marginTop: '20px' }}>Bạn không có quyền xem danh sách tầng.</Title>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold">Danh sách tầng</h1>
                            {/* Only render Create button/dropdown if user has CREATE permission */}
                            {canCreateFloor && (
                                <Dropdown overlay={createNewMenu} placement="bottomRight" arrow>
                                    <Button
                                        id="create-new-dropdown-button-tang"
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={overallLoading}
                                    >
                                        Tạo mới
                                    </Button>
                                </Dropdown>
                            )}
                        </div>

                        {/* Search, Filter, Export are visible if user can VIEW */}
                        {/* The buttons themselves are disabled during loading, but not hidden by VIEW permission check here */}
                        {canViewFloor && ( // Only show search/filter if VIEW is allowed
                            <div className="flex items-center gap-4 mb-6">
                                <Select
                                    id="column-select-tang"
                                    defaultValue="all"
                                    style={{ width: 180 }}
                                    onChange={handleColumnSelect}
                                    disabled={overallLoading}
                                >
                                    <Option value="all">Tất cả cột</Option>
                                    <Option value="tenTang">Tên Tầng</Option>
                                    <Option value="toaNha">Tên Tòa Nhà</Option>
                                </Select>

                                <div className="flex items-center flex-1 gap-2">
                                    <Input
                                        id="search-input-tang"
                                        placeholder="Tìm kiếm..."
                                        value={search}
                                        onChange={handleSearch}
                                        style={{ maxWidth: 200 }}
                                        disabled={overallLoading}
                                    />
                                </div>
                            </div>
                        )}


                        {/* Export and Bulk Delete buttons are visible if user can VIEW and DELETE respectively */}
                        {(canViewFloor || canDeleteFloor) && ( // Show Space if either VIEW (for exports) or DELETE (for bulk delete) is needed
                            <Space style={{ marginBottom: 16 }}>
                                {canViewFloor && ( // Show PDF only if VIEW
                                    <Button
                                        id="export-pdf-button-tang"
                                        onClick={exportToPDF}
                                        type="primary"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        disabled={overallLoading || initialTangs.length === 0}
                                    >
                                        Xuất PDF
                                    </Button>
                                )}
                                {canViewFloor && ( // Show Excel only if VIEW
                                    <Button
                                        id="export-excel-button-tang"
                                        onClick={exportToExcel}
                                        type="primary"
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={overallLoading || initialTangs.length === 0}
                                    >
                                        Xuất Excel
                                    </Button>
                                )}
                                {/* Only show Delete Selected button if user has DELETE permission */}
                                {canDeleteFloor && (
                                    <Button
                                        id="delete-selected-button-tang"
                                        type="primary"
                                        danger
                                        onClick={confirmDeleteMultiple}
                                        disabled={overallLoading || !hasSelected || selectedRowKeys.length === 0}
                                    >
                                        Xóa các tầng đã chọn
                                    </Button>
                                )}
                            </Space>
                        )}


                        <Spin spinning={overallLoading}>
                            <div className="border rounded-lg overflow-hidden">
                                {/* The table itself is only rendered if canViewFloor is true */}
                                {canViewFloor ? (
                                    <Table
                                        rowSelection={rowSelectionConfig} // Use the defined rowSelection object or undefined
                                        columns={columns}
                                        dataSource={tangs}
                                        rowKey="maTang"
                                        pagination={{
                                            ...pagination,
                                            total: filteredTangs !== null ? filteredTangs.length : initialTangs.length,
                                            showSizeChanger: true,
                                            showQuickJumper: true,
                                            position: ['bottomRight'],
                                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tầng`,
                                        }}
                                        onChange={handleTableChange}
                                        scroll={{ x: 'max-content' }}
                                        style={{ pointerEvents: overallLoading ? 'none' : 'auto', opacity: overallLoading ? 0.6 : 1 }}
                                    />
                                ) : (
                                    // This block is now only reached if overallLoading is false and canViewFloor is false
                                    // The loading message is shown above this block
                                    // We still need a placeholder if permissions haven't loaded yet, but overallLoading handles the spin
                                    null // Render nothing here if !canViewFloor after loading, the outer check handles the message
                                )}
                            </div>
                        </Spin>
                    </>
                )}


                <ImportFileModal
                    visible={isModalVisible}
                    onCancel={hideImportModal}
                    onImport={handleImport}
                    loading={importLoading}
                />

            </Content>

        </Layout>
    );
}