
import React, { useState, useEffect, useRef } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined,
    QrcodeOutlined,
    UserOutlined,
    DesktopOutlined,
    ToolOutlined
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
    Modal,
    QRCode,
    Avatar,
    Form,
    Upload,
    message,
    Spin,
    Tabs,
    Result
} from "antd";
import { InboxOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";

const { Option } = Select;
const { Header, Content } = Layout;
const { TabPane } = Tabs;

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        setIsDarkMode((prevIsDarkMode) => {
            if (prevIsDarkMode) {
                DarkReader.disable();
            } else {
                DarkReader.enable({
                    brightness: 100,
                    contrast: 90,
                    sepia: 10,
                });
            }
            return !prevIsDarkMode;
        });
    };

    useEffect(() => {
        DarkReader.auto({
            brightness: 100,
            contrast: 90,
            sepia: 10,
        });

        return () => {
            DarkReader.disable();
        };
    }, []);

    return (
        <Button
            icon={
                isDarkMode ? (
                    <SunOutlined style={{ color: isDarkMode ? "yellow" : "black" }} />
                ) : (
                    <MoonOutlined style={{ color: isDarkMode ? "white" : "black" }} />
                )
            }
            onClick={toggleDarkMode}
            style={{
                backgroundColor: "transparent",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
            }}
        />
    );
};

const validSearchColumns = [
    { label: "Tên phòng", value: "ten_phong" },
    { label: "Số máy", value: "so_may" },
    { label: "Mô tả", value: "mo_ta" },
    { label: "Trạng thái", value: "trang_thai" },
];

export default function LabManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    const [labRooms, setLabRooms] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [initialLabRooms, setInitialLabRooms] = useState([]);
    const [filteredLabRooms, setFilteredLabRooms] = useState(null);
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);
    const [showColumnSelect, setShowColumnSelect] = useState(false);
    const inputRef = useRef(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [qrCodeValue, setQrCodeValue] = useState("");

    // User Profile Modal States and Functions
    const [userProfileModalVisible, setUserProfileModalVisible] = useState(false);
    const [userProfile, setUserProfile] = useState({});
    const [form] = Form.useForm();

    // Store th URL in a separate state
    const [userImage, setUserImage] = useState(null);
    const [isStatusModalVisible, setIsStatusModalVisible] = useState(false);
    const [statusModalLoadingComputers, setStatusModalLoadingComputers] = useState(false); // Specific loading
    // Bên trong component LabManagement, gần các state khác
    const [isComputerModalVisible, setIsComputerModalVisible] = useState(false);
    const [computerModalLoading, setComputerModalLoading] = useState(false);
    const [computersInRoom, setComputersInRoom] = useState([]);
    const [currentRoomName, setCurrentRoomName] = useState('');
    const [currentRoomMaPhong, setCurrentRoomMaPhong] = useState(null);
     // const [loading, setLoading] = useState(false); // Bỏ state này
    const [internalLoading, setInternalLoading] = useState(false); // Loading cho search, delete, modal...

    const [loadError, setLoadError] = useState(null); // Lưu lỗi từ loader

    // Modal 2: Cập nhật trạng thái
    const [isComputerUpdateModalVisible, setIsComputerUpdateModalVisible] = useState(false); // <-- State mới
    const [selectedComputerKeysForUpdate, setSelectedComputerKeysForUpdate] = useState([]);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [activeTabKey, setActiveTabKey] = useState('computers'); // Default tab
    const [deviceTypes, setDeviceTypes] = useState([]); // To store LoaiThietBi
    const [loadingDeviceTypes, setLoadingDeviceTypes] = useState(false);
    const [currentDevices, setCurrentDevices] = useState([]); // Devices for the selected type tab
    const [loadingDevices, setLoadingDevices] = useState(false);
    const [isDeviceUpdateModalVisible, setIsDeviceUpdateModalVisible] = useState(false);
    const [selectedDeviceKeysForUpdate, setSelectedDeviceKeysForUpdate] = useState([]);
    const [isUpdatingDeviceStatus, setIsUpdatingDeviceStatus] = useState(false);
    const [currentDeviceTypeForUpdate, setCurrentDeviceTypeForUpdate] = useState({ maLoai: null, tenLoai: '' });
    const BROKEN_STATUS = 'Đã hỏng';
    const ACTIVE_STATUS = 'Đang hoạt động';
    const INACTIVE_STATUS = 'Không hoạt động';
    useEffect(() => {
        console.log("[Component] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            console.error("Loader Error Handled in Component:", loaderResult);
            setLoadError(loaderResult); // Lưu lỗi vào state để render UI lỗi

            // Xử lý chuyển hướng nếu là lỗi auth
            if (loaderResult.type === 'auth') {
                Swal.fire({
                    title: "Lỗi Xác thực",
                    text: loaderResult.message || "Phiên đăng nhập hết hạn.",
                    icon: "error",
                    timer: 2500, // Tăng thời gian chờ một chút
                    showConfirmButton: false,
                    willClose: () => { // Đảm bảo navigate sau khi Swal đóng
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('username');
                        localStorage.removeItem('userRole');
                        navigate('/login', { replace: true }); // Dùng replace để không lưu trang lỗi vào history
                    }
                });
            } else {
                // Có thể hiển thị Swal cho các lỗi khác nếu muốn, nhưng Result là đủ
                // Swal.fire("Lỗi Tải Trang", loaderResult.message || "Không thể tải dữ liệu.", "error");
            }
        } else if (loaderResult?.data) {
            // Xử lý dữ liệu thành công
            const data = loaderResult.data || [];
            console.log("[Component] Setting initial data:", data);
            setInitialLabRooms(data);
            // Cập nhật luôn bảng hiển thị cho trang đầu tiên
            setLabRooms(data.slice(0, pagination.pageSize));
            setLoadError(null); // Đảm bảo không còn lỗi
            // Reset lại phân trang về trang 1 nếu cần (ví dụ sau khi reload)
            setPagination(prev => ({ ...prev, current: 1 }));
        } else {
            // Trường hợp loader trả về không mong muốn
            console.error("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
            // Swal.fire("Lỗi Hệ Thống", "Dữ liệu tải trang không hợp lệ.", "error");
        }
        // Chỉ chạy khi loaderResult thay đổi (thường là 1 lần khi vào trang)
        // Thêm navigate vào dependency array vì nó được sử dụng bên trong
    }, [loaderResult, navigate]);

    const fetchLabRoomsForQrCode = async () => {
        // ... (rest of the fetchLabRoomsForQrCode function remains the same)
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const url = `https://localhost:8080/phong-may-thong-ke?token=${token}`;
            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const transformedData = data.map((room) => ({
                tenPhong: room.tenPhong,
                soMayDangHoatDong: room.soMayDangHoatDong,
                soMayDaHong: room.soMayDaHong,
                mayDangHoatDong: room.mayDangHoatDong.map((may) => may.tenMay),
                mayDaHong: room.mayDaHong.map((may) => may.tenMay),
            }));

            return JSON.stringify(transformedData, null, 2);
        } catch (error) {
            console.error("Error fetching lab rooms for QR code:", error);
            Swal.fire(
                "Error",
                "Có lỗi xảy ra khi tải dữ liệu cho mã QR: " + error.message,
                "error"
            );
            return "";
        }
    };

    const showModal = async () => {
        // ... (rest of the showModal function remains the same)
        const qrData = await fetchLabRoomsForQrCode();
        if (qrData) {
            setQrCodeValue(qrData);
            setIsModalVisible(true);
        }
    };

    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };

    useEffect(() => {
        // ... (rest of the useEffect hook remains the same)
        const script1 = document.createElement("script");
        script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
        script1.async = true;
        document.body.appendChild(script1);

        const script2 = document.createElement("script");
        script2.src = "https://files.bpcontent.cloud/2025/03/03/16/20250303163810-YF2W2K0X.js";
        script2.async = true;
        document.body.appendChild(script2);

        return () => {
            document.body.removeChild(script1);
            document.body.removeChild(script2);
        };
    }, []);



    const handleDelete = (record) => {
        // ... (rest of the handleDelete function remains the same)
        Swal.fire({
            title: "Bạn có chắc chắn?",
            text: `Xóa phòng: ${record.tenPhong}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteLabRoom(record.maPhong);
            }
        });
    };

    const deleteLabRoom = async (maPhong) => {
        // ... (rest of the deleteLabRoom function remains the same)
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }
        setInternalLoading(true); // Bắt đầu loading nội bộ


        try {
            const url = `https://localhost:8080/XoaPhongMay?maPhong=${maPhong}&token=${token}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            Swal.fire("Thành công!", "Đã xóa!", "success");
        } catch (error) {
            console.error("Error deleting:", error);
            Swal.fire("Error", "Lỗi: " + error.message, "error");
        } finally {
            setInternalLoading(false); // Kết thúc loading nội bộ
        }
    };

    const sortData = (data, sortKey, sortOrder) => {
        // ... (rest of the sortData function remains the same)
        if (!sortKey || !data) return data; // Handle null/undefined data

        return [...data].sort((a, b) => {
            const valueA = a[sortKey];
            const valueB = b[sortKey];

            if (typeof valueA === "string" && typeof valueB === "string") {
                return sortOrder === "ascend"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } else if (typeof valueA === "number" && typeof valueB === "number") {
                return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
            }
            return 0;
        });
    };

    const handleSearch = (value) => {
        // ... (rest of the handleSearch function remains the same)
        setSearch(value);
        setShowColumnSelect(!!value);
        if (!value) {
            setFilteredLabRooms(null); // Clear filtered results
            setLabRooms(initialLabRooms.slice(0, pagination.pageSize));
            setSelectedColumn(null);
        }
    };
    const handleColumnSelect = (column) => {
        // ... (rest of the handleColumnSelect function remains the same)
        setSelectedColumn(column);
        if (search && column) {
            performSearch(search, column);
        }
    };

    const performSearch = async (searchValue, searchColumn) => {
        // ... (rest of the performSearch function remains the same)
        const token = localStorage.getItem("authToken");
        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        if (!searchValue || !searchColumn) {
            setFilteredLabRooms(null); // Clear filtered results
            setLabRooms(initialLabRooms.slice(0, pagination.pageSize)); // Show initial data
            return;
        }

        setInternalLoading(true); // Bật loading nội bộ

        try {
            const url = `https://localhost:8080/searchPhongMay?keyword=${searchColumn}:${searchValue}&token=${token}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                if (response.status === 204) {
                    setFilteredLabRooms([]); // Set filtered results to empty
                    setLabRooms([]); // Also clear what's displayed
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            } else {
                const data = await response.json();
                if (data && data.results && Array.isArray(data.results)) {
                    setFilteredLabRooms(data.results); // Store filtered results
                    setLabRooms(data.results.slice(0, pagination.pageSize)); // Display first page of filtered results
                } else {
                    console.error("Unexpected data format:", data);
                    Swal.fire("Error", "Unexpected data format from the server.", "error");
                    setFilteredLabRooms([]); // Clear data
                    setLabRooms([]);

                }
            }
        } catch (error) {
            console.error("Error during search:", error);
            Swal.fire("Error", `Search failed: ${error.message}`, "error");
        } finally {
            setInternalLoading(false);
        }
    };

    const updateTableData = (page, pageSize, sortField, sortOrder) => {
        // ... (rest of the updateTableData function remains the same)
        const dataToUse = filteredLabRooms !== null ? filteredLabRooms : initialLabRooms; // Use filtered data if available
        const sortedData = sortData(dataToUse, sortField, sortOrder);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = sortedData.slice(startIndex, endIndex);
        setLabRooms(paginatedData);
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        // ... (rest of the handleTableChange function remains the same)
        const { current, pageSize } = newPagination;
        const { field, order } = sorter;

        setSortInfo(field && order ? { field, order } : {});
        setPagination(newPagination);
        updateTableData(current, pageSize, field, order);
    };

    const onSelectChange = (newSelectedRowKeys) => {
        // ... (rest of the onSelectChange function remains the same)
        setSelectedRowKeys(newSelectedRowKeys);
        setHasSelected(newSelectedRowKeys.length > 0);
    };

    const rowSelection = {
        // ... (rest of the rowSelection object remains the same)
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: false,
            name: record.maPhong,
        }),
    };



    const startIndex = (pagination.current - 1) * pagination.pageSize;

    const exportToPDF = () => {
        // ... (rest of the exportToPDF function remains the same)
        const doc = new jsPDF();
        doc.setFont("Arial");
        doc.autoTable({
            head: [["STT", "Tên phòng", "Mô tả", "Số máy", "Trạng thái"]],
            body: labRooms.map((room, index) => [
                startIndex + index + 1,
                room.tenPhong,
                room.moTa,
                room.soMay,
                room.trangThai,
            ]),
        });
        doc.save("DanhSachPhongMay.pdf");
    };

    const exportToExcel = () => {
        // ... (rest of the exportToExcel function remains the same)
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(labRooms);
        XLSX.utils.book_append_sheet(wb, ws, "Rooms");
        XLSX.writeFile(wb, "DanhSachPhongMay.xlsx");
    };

    const confirmDeleteMultiple = () => {
        // ... (rest of the confirmDeleteMultiple function remains the same)
        Swal.fire({
            title: "Bạn có chắc chắn?",
            text: `Xóa ${selectedRowKeys.length} phòng?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMultipleLabRooms();
            }
        });
    };
// Thêm hàm này vào bên trong component LabManagement
    const showComputerStatusModal = async (maPhong, tenPhong) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập hoặc phiên đã hết hạn.", "error").then(() => navigate('/login'));
            return;
        }

        // Set current room info
        setCurrentRoomMaPhong(maPhong);
        setCurrentRoomName(tenPhong);

        // Reset states for the modal
        setActiveTabKey('computers'); // Default to computer tab
        setComputersInRoom([]);
        setCurrentDevices([]);
        setDeviceTypes([]); // Reset device types

        // Set loading states
        setStatusModalLoadingComputers(true);
        setLoadingDeviceTypes(true);
        setLoadingDevices(false); // Not loading devices initially

        setIsStatusModalVisible(true); // Open the modal

        // --- Fetch Computer Data (Existing Logic) ---
        try {
            const urlComputers = `https://localhost:8080/DSMayTinhTheoPhong?maPhong=${maPhong}&token=${token}`;
            const responseComputers = await fetch(urlComputers); // Assuming headers if needed

            if (responseComputers.status === 204) { setComputersInRoom([]); }
            else if (responseComputers.ok) {
                // Handle potential empty response body for OK status
                const responseClone = responseComputers.clone();
                const responseText = await responseClone.text();
                if (!responseText) {
                    setComputersInRoom([]);
                } else {
                    try {
                        const data = await responseComputers.json();
                        setComputersInRoom(data || []);
                    } catch (e) {
                        console.error("JSON parse error (Computers):", e);
                        setComputersInRoom([]);
                        // Optionally show an error message to the user
                        // message.error("Dữ liệu máy tính nhận được không hợp lệ.");
                    }
                }
            }
            else if (responseComputers.status === 401) {
                Swal.fire("Lỗi", "Phiên đăng nhập hết hạn.", "error").then(() => { setIsStatusModalVisible(false); navigate('/login'); });
                // Close modal early on auth error
                setStatusModalLoadingComputers(false);
                setLoadingDeviceTypes(false); // Also stop device type loading
                return; // Exit function
            } else if (responseComputers.status === 404) {
                Swal.fire("Lỗi", `Phòng ${tenPhong} không tồn tại.`, "error");
                setIsStatusModalVisible(false); // Close modal if room not found
                setStatusModalLoadingComputers(false);
                setLoadingDeviceTypes(false);
                return; // Exit function
            } else {
                let err = `Lỗi HTTP ${responseComputers.status} khi tải máy tính.`;
                try { err += await responseComputers.text(); } catch{}
                throw new Error(err);
            }
        } catch (error) {
            console.error("Error fetching computers:", error);
            if (error.message && !error.message.includes("401") && !error.message.includes("404")) {
                Swal.fire("Lỗi", "Không thể tải trạng thái máy tính: " + error.message, "error");
            }
            // Don't close modal here, allow device types to potentially load
        } finally {
            setStatusModalLoadingComputers(false);
        }

        // --- Fetch Device Types ---
        try {
            const urlDeviceTypes = `https://localhost:8080/DSLoaiThietBi?token=${token}`;
            const responseDeviceTypes = await fetch(urlDeviceTypes);

            if (responseDeviceTypes.ok) {
                const data = await responseDeviceTypes.json();
                setDeviceTypes(data || []); // Store the list of device types
            } else if (responseDeviceTypes.status === 401) {
                // Handle auth error specifically if needed, maybe already handled above
                console.error("Auth error fetching device types");
                // Optionally navigate to login if not already handled by computer fetch error
            } else {
                let err = `Lỗi HTTP ${responseDeviceTypes.status} khi tải loại thiết bị.`;
                try { err += await responseDeviceTypes.text(); } catch{}
                throw new Error(err);
            }
        } catch (error) {
            console.error("Error fetching device types:", error);
            // Don't necessarily show a Swal error here, maybe just log it
            // The modal will still work for computers if types fail to load
            setDeviceTypes([]); // Ensure it's an empty array on error
        } finally {
            setLoadingDeviceTypes(false);
        }

    };
    const fetchDevicesByType = async (maLoai) => {
        const token = localStorage.getItem("authToken");
        if (!token || !currentRoomMaPhong) return; // Need token and room context

        setCurrentDevices([]); // Clear previous devices
        setLoadingDevices(true);

        try {
            // Construct URL with maPhong and maLoai
            const url = `https://localhost:8080/DSThietBiTheoPhong?maPhong=${currentRoomMaPhong}&maLoai=${maLoai}&token=${token}`;
            const response = await fetch(url);

            if (response.ok) {
                // Handle potential empty response body for OK status
                const responseClone = response.clone();
                const responseText = await responseClone.text();
                if (!responseText) {
                    setCurrentDevices([]);
                } else {
                    try {
                        const data = await response.json();
                        setCurrentDevices(data || []); // Store fetched devices
                    } catch (e) {
                        console.error(`JSON parse error (Devices maLoai=${maLoai}):`, e);
                        setCurrentDevices([]);
                        message.error("Dữ liệu thiết bị nhận được không hợp lệ.");
                    }
                }
            } else if (response.status === 204) {
                setCurrentDevices([]); // No content means empty list
            } else if (response.status === 401) {
                Swal.fire("Lỗi", "Phiên đăng nhập hết hạn.", "error").then(() => { setIsStatusModalVisible(false); navigate('/login'); });
                // Close modal on auth error during device fetch
                setLoadingDevices(false); // Ensure loading stops
                return; // Exit
            }
            else {
                let err = `Lỗi HTTP ${response.status} khi tải thiết bị (Loại: ${maLoai}).`;
                try { err += await response.text(); } catch{}
                throw new Error(err);
            }
        } catch (error) {
            console.error("Error fetching devices by type:", error);
            if (error.message && !error.message.includes("401")) {
                Swal.fire("Lỗi", "Không thể tải danh sách thiết bị: " + error.message, "error");
            }
            setCurrentDevices([]); // Clear devices on error
        } finally {
            setLoadingDevices(false);
        }
    };
    const handleTabChange = (key) => {
        setActiveTabKey(key);
        if (key !== 'computers') {
            // Key should be the maLoai, convert it to number if needed (depends on API)
            const maLoai = parseInt(key, 10); // Or just key if it's passed as string map key
            if (!isNaN(maLoai)) {
                fetchDevicesByType(maLoai);
            } else {
                console.error("Invalid tab key for device type:", key);
                setCurrentDevices([]); // Clear devices if key is invalid
            }
        } else {
            // Switched back to computers tab, data should already be there or loading
            setCurrentDevices([]); // Clear device data when switching away
            setLoadingDevices(false); // Ensure device loading stops
        }
    };
    const handleStatusModalClose = () => {
        setIsStatusModalVisible(false);
        // Reset states related to the status modal content
        setComputersInRoom([]);
        setCurrentDevices([]);
        setDeviceTypes([]);
        setCurrentRoomName('');
        setCurrentRoomMaPhong(null);
        setStatusModalLoadingComputers(false);
        setLoadingDeviceTypes(false);
        setLoadingDevices(false);
        setActiveTabKey('computers'); // Reset active tab
    };
// Thêm hàm đóng modal
    const handleComputerModalClose = () => {
        setIsComputerModalVisible(false); // <-- Chỉ đóng modal xem
        // Reset state của modal xem
        // KHÔNG reset computersInRoom, currentRoomName, currentRoomMaPhong ở đây
        // vì chúng cần được giữ lại để Modal cập nhật sử dụng
        setComputerModalLoading(false); // Chỉ reset loading
    };
    const handleOpenUpdateModal = () => {
        // Dữ liệu computersInRoom, currentRoomName đã có sẵn từ Modal 1
        if (!computersInRoom || computersInRoom.length === 0) {
            message.warning("Không có dữ liệu máy tính để cập nhật.");
            return;
        }
        setSelectedComputerKeysForUpdate([]); // Reset lựa chọn
        setIsComputerModalVisible(false);      // Đóng modal xem
        setIsComputerUpdateModalVisible(true); // Mở modal cập nhật
    };

    const handleComputerUpdateModalClose = () => {
        setIsComputerUpdateModalVisible(false); // Đóng modal cập nhật
        // Reset state của modal cập nhật
        setSelectedComputerKeysForUpdate([]);
        setIsUpdatingStatus(false);
        // Reset luôn data phòng để lần sau mở modal xem sẽ fetch mới
        setComputersInRoom([]);
        setCurrentRoomName('');
        setCurrentRoomMaPhong(null);
    };
    const handleCompleteUpdate = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) { /* ... */ return; }

        const maMayTinhListToUpdate = [];
        const trangThaiListToUpdate = [];

        computersInRoom.forEach(computer => {
            // Kiểm tra xem máy này có bị người dùng tick/untick không
            const wasToggled = selectedComputerKeysForUpdate.includes(computer.maMay);

            // Chỉ xử lý những máy không bị hỏng VÀ đã bị người dùng toggle
            if (computer.trangThai !== BROKEN_STATUS && wasToggled) {
                maMayTinhListToUpdate.push(computer.maMay);

                // Xác định trạng thái mới dựa trên trạng thái hiện tại
                const newStatus = computer.trangThai === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
                trangThaiListToUpdate.push(newStatus);
            }
            // Bỏ qua máy hỏng hoặc máy không được người dùng tương tác
        });

        if (maMayTinhListToUpdate.length === 0) {
            Swal.fire("Thông báo", "Không có thay đổi trạng thái nào được thực hiện.", "info");
            // Có thể đóng modal luôn hoặc để người dùng xem lại
            // handleComputerUpdateModalClose();
            return;
        }

        setIsUpdatingStatus(true);
        try {
            // Phần gọi API giữ nguyên (gửi maMayTinhListToUpdate và trangThaiListToUpdate)
            const params = new URLSearchParams();
            maMayTinhListToUpdate.forEach(id => params.append('maMayTinhList', id));
            trangThaiListToUpdate.forEach(status => params.append('trangThaiList', status));
            params.append('token', token);
            const url = `https://localhost:8080/CapNhatTrangThaiNhieuMay?${params.toString()}`;

            const response = await fetch(url, { method: "PUT" });

            if (!response.ok) {
                let errorMsg = `Lỗi ${response.status}`;
                try { errorMsg = (await response.json()).message || errorMsg } catch {}
                throw new Error(errorMsg);
            }

            const resultData = await response.json();
            Swal.fire("Thành công", resultData.message || "Đã cập nhật trạng thái!", "success");

            handleComputerUpdateModalClose(); // Đóng modal cập nhật thành công

        } catch (error) {
            console.error("Error updating computer status:", error);
            Swal.fire("Lỗi", `Không thể cập nhật: ${error.message}`, "error");
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    const handleOpenDeviceUpdateModal = (maLoai, tenLoai) => {
        // We already have currentDevices loaded for this type from the main status modal
        if (!currentDevices || currentDevices.length === 0) {
            message.warning(`Không có dữ liệu thiết bị loại "${tenLoai}" để cập nhật.`);
            return;
        }
        setCurrentDeviceTypeForUpdate({ maLoai, tenLoai }); // Store current type info
        setSelectedDeviceKeysForUpdate([]); // Reset selections
        setIsUpdatingDeviceStatus(false); // Reset loading state
        setIsDeviceUpdateModalVisible(true); // Open the device update modal
        // Note: We keep the main status modal open underneath
    };

    const handleDeviceUpdateModalClose = () => {
        setIsDeviceUpdateModalVisible(false);
        setSelectedDeviceKeysForUpdate([]);
        setIsUpdatingDeviceStatus(false);
        setCurrentDeviceTypeForUpdate({ maLoai: null, tenLoai: '' }); // Clear current type info
    };

    const handleCompleteDeviceUpdate = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập hoặc phiên đã hết hạn.", "error").then(() => navigate('/login'));
            return;
        }

        const maThietBiListToUpdate = [];
        const trangThaiListToUpdate = [];

        // Iterate through devices currently displayed in the update modal (which are `currentDevices`)
        currentDevices.forEach(device => {
            const wasToggled = selectedDeviceKeysForUpdate.includes(device.maThietBi);

            // Only process devices that are NOT broken AND were toggled by the user
            if (device.trangThai !== BROKEN_STATUS && wasToggled) {
                maThietBiListToUpdate.push(device.maThietBi);
                // Determine the new status based on the current status
                const newStatus = device.trangThai === ACTIVE_STATUS ? INACTIVE_STATUS : ACTIVE_STATUS;
                trangThaiListToUpdate.push(newStatus);
            }
        });

        if (maThietBiListToUpdate.length === 0) {
            Swal.fire("Thông báo", "Không có thay đổi trạng thái thiết bị nào được thực hiện.", "info");
            // Optionally close the modal here or let the user close it manually
            // handleDeviceUpdateModalClose();
            return;
        }

        setIsUpdatingDeviceStatus(true); // Start loading indicator

        try {
            const params = new URLSearchParams();
            maThietBiListToUpdate.forEach(id => params.append('maThietBiList', id));
            trangThaiListToUpdate.forEach(status => params.append('trangThaiList', status));
            params.append('token', token);

            // Call the new API endpoint
            const url = `https://localhost:8080/CapNhatTrangThaiNhieuThietBi?${params.toString()}`;
            const response = await fetch(url, { method: "PUT" });

            if (!response.ok) {
                let errorMsg = `Lỗi ${response.status}`;
                try { errorMsg = (await response.json()).message || errorMsg } catch {}
                throw new Error(errorMsg);
            }

            const resultData = await response.json();
            Swal.fire("Thành công", resultData.message || "Đã cập nhật trạng thái thiết bị!", "success");

            handleDeviceUpdateModalClose(); // Close the update modal on success

            // --- Crucial: Refresh the device list in the main status modal ---
            // Use the stored maLoai to refetch devices for the current tab
            if (currentDeviceTypeForUpdate.maLoai) {
                fetchDevicesByType(currentDeviceTypeForUpdate.maLoai);
            }
            // --- End Refresh ---

        } catch (error) {
            console.error("Error updating device status:", error);
            Swal.fire("Lỗi", `Không thể cập nhật trạng thái thiết bị: ${error.message}`, "error");
        } finally {
            setIsUpdatingDeviceStatus(false); // Stop loading indicator
        }
    };
    const deleteMultipleLabRooms = async () => {
        // ... (rest of the deleteMultipleLabRooms function remains the same)
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }
        setInternalLoading(true);

        try {
            const maPhongListString = selectedRowKeys.join(",");
            const url = `https://localhost:8080/XoaNhieuPhongMay?maPhongList=${maPhongListString}&token=${token}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            Swal.fire("Thành công!", "Đã xóa!", "success");
            setSelectedRowKeys([]);
        } catch (error) {
            console.error("Error deleting:", error);
            Swal.fire("Error", "Lỗi: " + error.message, "error");
        }finally {
            setInternalLoading(false);
        }
    };
    const computerUpdateColumns = [
        {
            title: 'Tên máy',
            dataIndex: 'tenMay',
            key: 'tenMay',
            // --- SỬA PHẦN RENDER NÀY ---
            render: (text, record) => {
                const baseName = text || `Máy ${record.maMay}`; // Lấy tên cơ bản
                // Kiểm tra mô tả có chứa 'gv' hoặc 'giáo viên' (không phân biệt hoa thường)
                const isTeacherMachine = record.moTa?.toLowerCase().includes('gv') || record.moTa?.toLowerCase().includes('giáo viên');

                // Nếu là máy giáo viên, thêm ghi chú
                if (isTeacherMachine) {
                    return `${baseName} (Máy của giáo viên)`;
                }
                // Ngược lại, trả về tên cơ bản
                return baseName;
            },
        },
        {
            title: 'Trạng thái hiện tại',
            dataIndex: 'trangThai',
            key: 'trangThai',
            render: (status) => (
                <span style={{
                    fontWeight: 'bold',
                    color: status === BROKEN_STATUS ? '#ff4d4f' : status === ACTIVE_STATUS ? '#52c41a' : '#bfbfbf'
                }}>
                      {status}
                  </span>
            )
        },
        {
            title: 'Điểm danh (Tick/Untick để đổi trạng thái)', // Đổi tên cột
            key: 'action',
            align: 'center',
            render: (text, record) => {
                // Nếu máy hỏng, hiển thị text và không render checkbox
                if (record.trangThai === BROKEN_STATUS) {
                    return <span style={{ color: '#ff4d4f', fontStyle: 'italic' }}>Đã hỏng</span>;
                }

                // Xác định trạng thái checked ban đầu của checkbox
                // Nếu ban đầu là ACTIVE, checkbox được check. Nếu là INACTIVE, không check.
                const initialChecked = record.trangThai === ACTIVE_STATUS;

                // Xác định trạng thái checked hiện tại dựa trên việc người dùng đã toggle hay chưa
                // Nếu người dùng đã toggle (có trong selectedKeys), đảo ngược trạng thái ban đầu.
                // Nếu chưa toggle, giữ nguyên trạng thái ban đầu.
                const isToggled = selectedComputerKeysForUpdate.includes(record.maMay);
                const currentChecked = isToggled ? !initialChecked : initialChecked;

                return (
                    <Checkbox
                        // checked phản ánh trạng thái hiển thị hiện tại sau khi toggle (nếu có)
                        checked={currentChecked}
                        // Không cần disabled nữa vì máy hỏng đã được xử lý ở trên
                        // disabled={record.trangThai === BROKEN_STATUS}
                        onChange={(e) => {
                            // Khi người dùng click, ta chỉ cần thêm/bớt maMay vào danh sách đã toggle
                            // Logic xác định trạng thái mới sẽ nằm trong handleCompleteUpdate
                            const maMay = record.maMay;
                            setSelectedComputerKeysForUpdate(prevKeys => {
                                const keyExists = prevKeys.includes(maMay);
                                if (keyExists) {
                                    // Nếu đã có -> người dùng click lần nữa -> xóa khỏi danh sách toggle
                                    return prevKeys.filter(key => key !== maMay);
                                } else {
                                    // Nếu chưa có -> người dùng click lần đầu -> thêm vào danh sách toggle
                                    return [...prevKeys, maMay];
                                }
                            });
                        }}
                    />
                );
            },
        },
    ];
    const deviceUpdateColumns = [
        {
            title: 'Tên Thiết Bị',
            dataIndex: 'tenThietBi',
            key: 'tenThietBi',
            render: (text, record) => text || `Thiết bị ${record.maThietBi}`, // Fallback name
        },
        {
            title: 'Trạng thái hiện tại',
            dataIndex: 'trangThai',
            key: 'trangThai',
            render: (status) => (
                <span style={{
                    fontWeight: 'bold',
                    // Use the existing helper function for color
                    color: getDeviceStatusColor(status)
                }}>
                    {status}
                </span>
            )
        },
        {
            title: 'Thay đổi (Tick/Untick)', // Column name
            key: 'action',
            align: 'center',
            width: '25%', // Adjust width as needed
            render: (text, record) => {
                // Disable checkbox for broken devices
                if (record.trangThai === BROKEN_STATUS) {
                    return <span style={{ color: getDeviceStatusColor(BROKEN_STATUS), fontStyle: 'italic' }}>Đã hỏng</span>;
                }

                // Determine initial checked state (Active = checked)
                const initialChecked = record.trangThai === ACTIVE_STATUS;

                // Determine if this specific device was toggled
                const isToggled = selectedDeviceKeysForUpdate.includes(record.maThietBi);

                // Calculate the current visual state of the checkbox
                const currentChecked = isToggled ? !initialChecked : initialChecked;

                return (
                    <Checkbox
                        checked={currentChecked}
                        onChange={(e) => {
                            const maThietBi = record.maThietBi;
                            // Update the list of toggled keys
                            setSelectedDeviceKeysForUpdate(prevKeys => {
                                const keyExists = prevKeys.includes(maThietBi);
                                if (keyExists) {
                                    // Remove key if it exists (toggled back)
                                    return prevKeys.filter(key => key !== maThietBi);
                                } else {
                                    // Add key if it doesn't exist (toggled for the first time)
                                    return [...prevKeys, maThietBi];
                                }
                            });
                        }}
                    />
                );
            },
        },
    ];
    const menu = (
        // ... (rest of the menu constant remains the same)
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addphongmay`)}>
                Tạo mới (form)
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={() => navigate(`/importfile`)}>
                Tạo mới (file)
            </Menu.Item>
        </Menu>
    );


    const handleLogout = async () => {
        // ... (rest of the handleLogout function remains the same)
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const url = `https://localhost:8080/logout?token=${token}`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                const errorData = await response.json();
                const errorMessage =
                    errorData?.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            localStorage.removeItem("authToken");
            Swal.fire("Thành công!", "Đăng xuất!", "success").then(() => {
                navigate("/login");
            });
        } catch (error) {
            console.error("Logout error:", error);
            Swal.fire("Error", "Lỗi: " + error.message, "error");
        }
    };

    const checkUserAndShowModal = async () => {
        const username = localStorage.getItem("username");
        const password = localStorage.getItem("password");
        const token = localStorage.getItem("authToken");

        if (!username || !password || !token) {
            Swal.fire("Error", "Missing user credentials", "error");
            return;
        }

        try {
            const url = `https://localhost:8080/checkUser?username=${username}&password=${password}`;
            const response = await fetch(url, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log("checkUser API response:", data);
            console.log("Image URL from API:", data.data.image);

            if (data.status === "success") {
                setUserProfile(data.data);
                // Store the image URL separately
                // FIX: Split and get the last valid URL
                const imageUrl = data.data.image;
                if (imageUrl) {
                    const urls = imageUrl.split(' ').filter(url => url.startsWith('http'));
                    if (urls.length > 0) {
                        setUserImage(urls[urls.length - 1]); // Get the LAST valid URL
                    } else {
                        console.warn("No valid image URL found in:", imageUrl);
                        setUserImage(null); // Set to null or a default image
                    }
                } else {
                    console.warn("Image URL is null or undefined.");
                    setUserImage(null); // Set to null or a default image
                }


                form.setFieldsValue({
                    tenDangNhap: data.data.tenDangNhap,
                    email: data.data.email,
                });
                setUserProfileModalVisible(true);
            } else {
                Swal.fire("Error", data.message || "Failed to fetch user data", "error");
            }
        } catch (error) {
            console.error("Error checking user:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    const handleUserProfileUpdate = async () => {
        // ... (rest of the handleUserProfileUpdate function remains the same)
        try {
            const values = await form.validateFields();
            const token = localStorage.getItem("authToken");
            const matKhau = localStorage.getItem("password");
            if (!token) {
                Swal.fire("Error", "Authentication token not found", "error");
                return;
            }

            const formData = new FormData();
            formData.append("maTK", userProfile.maTK);
            formData.append("tenDangNhap", values.tenDangNhap);
            formData.append("email", values.email);
            formData.append("matKhau", matKhau)
            if (values.image && values.image.length > 0) {
                formData.append("imageFile", values.image[0]);
            }
            formData.append("maQuyen", userProfile.quyen);
            formData.append("token", token);

            console.log("formData before API call:", formData);
            for (let pair of formData.entries()) {
                console.log(pair[0] + ', ' + pair[1]);
            }

            const response = await fetch("https://localhost:8080/CapNhatTaiKhoan", {
                method: "PUT",
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const updatedUser = await response.json();
            console.log("Updated user data:", updatedUser);

            // Update both userProfile and userImage
            setUserProfile(updatedUser);
            if (updatedUser.image) {
                setUserImage(updatedUser.image);
            }
            Swal.fire("Success", "User profile updated successfully!", "success");
            setUserProfileModalVisible(false);
            checkUserAndShowModal(); // Refresh
        } catch (error) {
            console.error("Error updating profile:", error);
            Swal.fire("Error", error.message, "error");
        }
    };

    const columns = [
        // ... (rest of the columns array remains the same)
        {
            title: (
                <Checkbox
                    onChange={(e) => {
                        const allKeys = (filteredLabRooms || initialLabRooms).map((record) => record.maPhong); // Use filtered data if available
                        setSelectedRowKeys(e.target.checked ? allKeys : []);
                        setHasSelected(e.target.checked);
                    }}
                    checked={
                        labRooms.length > 0 && selectedRowKeys.length === labRooms.length
                    }
                    indeterminate={
                        selectedRowKeys.length > 0 &&
                        selectedRowKeys.length < labRooms.length
                    }
                />
            ),
            key: "checkbox",
            width: "5%",
            fixed: "left",
            render: (text, record) => null,
        },
        {
            title: "STT",
            key: "stt",
            width: "5%",
            render: (text, record, index) => startIndex + index + 1,
        },
        {
            title: "Tên phòng",
            dataIndex: "tenPhong",
            sorter: (a, b) => a.tenPhong.localeCompare(b.tenPhong),
        },
        {
            title: "Mô tả",
            dataIndex: "moTa",
            sorter: (a, b) => a.moTa.localeCompare(b.moTa),
        },
        {
            title: "Số máy",
            dataIndex: "soMay",
            align: "center",
            sorter: (a, b) => a.soMay - b.soMay,
            width: "10%",
        },
        {
            title: "Trạng thái",
            dataIndex: "trangThai",
            sorter: (a, b) => a.trangThai.localeCompare(b.trangThai),
        },
        {
            title: "Hành động",
            render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        type="link"
                        onClick={() => navigate(`/editphongmay/${record.maPhong}`)}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        type="link"
                        onClick={() => handleDelete(record)}
                    />
                    <Button
                        icon={<MessageOutlined />}
                        size="small"
                        type="link"
                        onClick={() => showComputerStatusModal(record.maPhong, record.tenPhong)}
                    />
                </div>
            ),
        },
    ];
    const getDeviceStatusColor = (status) => {
        if (status === BROKEN_STATUS) return '#ff4d4f'; // Red for broken
        if (status === ACTIVE_STATUS) return '#52c41a'; // Green for active
        return '#bfbfbf'; // Grey for inactive or other statuses
    };

    // --- Helper function to get device icon (Placeholder Logic) ---
    const getDeviceIcon = (deviceName) => {
        const lowerName = deviceName?.toLowerCase() || '';
        // Simple keyword check - adjust keywords as needed
        if (lowerName.includes('máy lạnh') || lowerName.includes('điều hòa')) {
            // Consider using a generic icon or finding a specific one
            return <ToolOutlined style={{ fontSize: '3rem' }} />; // Placeholder
        }
        if (lowerName.includes('máy chiếu')) {
            return <DesktopOutlined style={{ fontSize: '3rem' }} />; // Reuse desktop or find Projector icon
        }
        if (lowerName.includes('quạt')) {
            return <ToolOutlined style={{ fontSize: '3rem' }} />; // Placeholder
        }
        // Default icon for other devices
        return <ToolOutlined style={{ fontSize: '3rem' }} />;
    };
    const renderGroupedDevices = (devices) => {
        const grouped = {
            airConditioners: [],
            projectors: [],
            fans: [],
            others: []
        };

        devices.forEach(device => {
            const lowerName = device.tenThietBi?.toLowerCase() || '';
            if (lowerName.includes('máy lạnh') || lowerName.includes('điều hòa')) {
                grouped.airConditioners.push(device);
            } else if (lowerName.includes('máy chiếu')) {
                grouped.projectors.push(device);
            } else if (lowerName.includes('quạt')) {
                grouped.fans.push(device);
            } else {
                grouped.others.push(device);
            }
        });

        const renderSection = (title, items) => {
            if (items.length === 0) return null;
            return (
                <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                    <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>{title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                        {items.map((item) => (
                            <div key={item.maThietBi} style={{ textAlign: 'center', width: '100px', padding: '10px', borderRadius: '4px' }}>
                                {/* Get icon based on name */}
                                {React.cloneElement(getDeviceIcon(item.tenThietBi), { style: { fontSize: '3rem', color: getDeviceStatusColor(item.trangThai) } })}
                                <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word' }}>{item.tenThietBi || `TB ${item.maThietBi}`}</div>
                                {/* Optionally display status text explicitly */}
                                {/* <div style={{ fontSize: '0.75rem', color: getDeviceStatusColor(item.trangThai) }}>({item.trangThai})</div> */}
                            </div>
                        ))}
                    </div>
                </div>
            );
        };

        return (
            <>
                {renderSection('Máy Lạnh / Điều Hòa', grouped.airConditioners)}
                {renderSection('Máy Chiếu', grouped.projectors)}
                {renderSection('Quạt', grouped.fans)}
                {renderSection('Thiết Bị Khác', grouped.others)}

                {/* Legend for Devices */}
                { devices.length > 0 && (
                    <div style={{
                        marginTop: '30px',
                        paddingTop: '15px',
                        borderTop: '1px solid #f0f0f0',
                        textAlign: 'center',
                        fontSize: '0.9rem',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '15px',
                        flexWrap: 'wrap'
                    }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><ToolOutlined style={{ color: getDeviceStatusColor(INACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' }} />: {INACTIVE_STATUS}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><ToolOutlined style={{ color: getDeviceStatusColor(ACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' }} />: {ACTIVE_STATUS}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><ToolOutlined style={{ color: getDeviceStatusColor(BROKEN_STATUS), marginRight: '5px', fontSize: '1.2em' }} />: {BROKEN_STATUS}</span>
                    </div>
                )}
            </>
        );
    };

    return (
        <Layout className="lab-management-layout">
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
                    Danh sách phòng học
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center" }}>
                    <DarkModeToggle />
                    {/* Use the userImage state for the Avatar */}
                    <Avatar
                        size="large"
                        icon={<UserOutlined />}
                        src={userImage}  // Use the separate userImage state
                        onClick={checkUserAndShowModal}
                        style={{ cursor: "pointer", marginLeft: "10px" }}
                    />
                    <Button icon={<LogoutOutlined />} type="text" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <Content className="lab-management-content" style={{ padding: "24px" }}>
                {/* ... (rest of your content remains the same) */}
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
                    <a href="/" className="flex items-center hover:text-primary">
                        <HomeOutlined className="h-4 w-4" />
                        <span className="ml-1">Trang chủ</span>
                    </a>
                </nav>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Danh sách phòng học</h1>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <Input
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{ maxWidth: 200 }}
                        onPressEnter={() => {
                            if (search && selectedColumn) {
                                performSearch(search, selectedColumn);
                            }
                        }}
                    />

                    {showColumnSelect && (
                        <Select
                            placeholder="Chọn thuộc tính"
                            value={selectedColumn}
                            style={{ width: 150 }}
                            onChange={handleColumnSelect}
                        >
                            {validSearchColumns.map((column) => (
                                <Option key={column.value} value={column.value}>
                                    {column.label}
                                </Option>
                            ))}
                        </Select>
                    )}
                </div>

                <Button
                    icon={<QrcodeOutlined />}
                    type="primary"
                    onClick={showModal}
                    className="bg-blue-600 hover:bg-blue-700 mr-2"
                >
                    Tạo mã QR
                </Button>
                <Button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700 mr-2" type="primary">
                    Xuất PDF
                </Button>
                <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700" type="primary">
                    Xuất Excel
                </Button>

                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Danh sách phòng học</h1>
                    <Dropdown overlay={menu} placement="bottomRight" arrow>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Tạo mới
                        </Button>
                    </Dropdown>
                </div>

                <div className="border rounded-lg">
                    <Table
                        rowSelection={{
                            type: "checkbox",
                            selectedRowKeys: selectedRowKeys,
                            onChange: onSelectChange,
                        }}
                        columns={columns}
                        dataSource={labRooms}  // Use labRooms to display
                        rowKey="maPhong"
                        loading={internalLoading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: (filteredLabRooms || initialLabRooms).length, // Use filtered data's length if available
                            showSizeChanger: true,
                            showQuickJumper: true,
                            pageSizeOptions: ['10', '20', '50', '100'],
                        }}
                        onChange={handleTableChange}
                    />
                </div>
                {hasSelected && (
                    <Button
                        type="primary"
                        danger
                        onClick={confirmDeleteMultiple}
                        className="mt-4"
                        disabled={internalLoading} // Disable khi đang xử lý
                    >
                        Xóa nhiều phòng
                    </Button>
                )}

                <Modal
                    title="QR Code"
                    visible={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                    footer={[
                        <Button key="back" onClick={handleCancel}>
                            Đóng
                        </Button>,
                    ]}
                >
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <QRCode value={qrCodeValue} size={256} />
                    </div>
                </Modal>
                <Modal
                    // Title is now more generic
                    title={`Trạng thái Phòng ${currentRoomName}`}
                    // Use the renamed state variable
                    visible={isStatusModalVisible}
                    // Use the renamed close handler
                    onCancel={handleStatusModalClose}
                    width={800} // Keep width or adjust as needed
                    bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }} // Adjust height if needed
                    footer={[
                        <Button key="close" onClick={handleStatusModalClose}>
                            Đóng
                        </Button>,
                        // Show "Update Status" button ONLY if the 'computers' tab is active
                        // and there are computers loaded without error
                        activeTabKey === 'computers' && !statusModalLoadingComputers && computersInRoom && computersInRoom.length > 0 && (
                            <Button key="update" type="primary" onClick={handleOpenUpdateModal}>
                                Cập nhật trạng thái máy tính
                            </Button>
                        )
                    ]}
                >
                    {/* Use Tabs component */}
                    <Tabs activeKey={activeTabKey} onChange={handleTabChange}>
                        {/* Tab 1: Computers */}
                        <TabPane tab="Máy tính" key="computers">
                            {statusModalLoadingComputers ? (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <Spin size="large" tip="Đang tải máy tính..." />
                                </div>
                            ) : (
                                // --- Existing Computer Display Logic ---
                                <>
                                    {computersInRoom && computersInRoom.length > 0 ? (
                                        <>
                                            {/* Máy GV */}
                                            {(() => {
                                                const teacherComputers = computersInRoom.filter(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
                                                if (!teacherComputers.length) return null;
                                                return (
                                                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                                                        <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>Máy Giáo Viên</h4>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                                                            {teacherComputers.map((mayTinh) => (
                                                                <div key={mayTinh.maMay} style={{ textAlign: 'center', width: '100px', padding: '10px', borderRadius: '4px' }}>
                                                                    <DesktopOutlined style={{ fontSize: '3rem', color: getDeviceStatusColor(mayTinh.trangThai) }} />
                                                                    <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word' }}>{mayTinh.tenMay || `Máy ${mayTinh.maMay}`}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {/* Máy SV / Khác */}
                                            {(() => {
                                                const otherComputers = computersInRoom.filter(m => !(m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')));
                                                const hasTeachers = computersInRoom.some(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
                                                if (!otherComputers.length && hasTeachers) return null; // Hide section if only teachers exist
                                                // If no computers at all, the outer check handles it.

                                                if (otherComputers.length === 0) return null; // Don't render section if no other computers

                                                return (
                                                    <div>
                                                        {hasTeachers && <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>Máy Sinh Viên / Khác</h4>}
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                                                            {otherComputers.map((mayTinh) => (
                                                                <div key={mayTinh.maMay} style={{ textAlign: 'center', width: '100px', padding: '10px' }}>
                                                                    <DesktopOutlined style={{ fontSize: '3rem', color: getDeviceStatusColor(mayTinh.trangThai) }} />
                                                                    <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word' }}>{mayTinh.tenMay || `Máy ${mayTinh.maMay}`}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                            {/* Legend */}
                                            <div style={{
                                                marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #f0f0f0', textAlign: 'center', fontSize: '0.9rem',
                                                display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap'
                                            }}>
                                                <span style={{ display: 'inline-flex', alignItems: 'center' }}><DesktopOutlined style={{ color: getDeviceStatusColor(INACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' }} />: {INACTIVE_STATUS}</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center' }}><DesktopOutlined style={{ color: getDeviceStatusColor(ACTIVE_STATUS), marginRight: '5px', fontSize: '1.2em' }} />: {ACTIVE_STATUS}</span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center' }}><DesktopOutlined style={{ color: getDeviceStatusColor(BROKEN_STATUS), marginRight: '5px', fontSize: '1.2em' }} />: {BROKEN_STATUS}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <p style={{ textAlign: 'center', padding: '30px 0' }}>
                                            Không có máy tính nào trong phòng này hoặc không thể tải dữ liệu.
                                        </p>
                                    )}
                                </>
                                // --- End Existing Computer Display Logic ---
                            )}
                        </TabPane>

                        {/* Tab 2 onwards: Devices (Dynamically generated) */}
                        {/* Show device tabs only if types are loaded and not empty */}
                        {!loadingDeviceTypes && deviceTypes.map(loai => (
                            <TabPane tab={loai.tenLoai || `Loại ${loai.maLoai}`} key={String(loai.maLoai)}>
                                {loadingDevices ? (
                                    <div style={{ textAlign: 'center', padding: '50px' }}>
                                        <Spin size="large" tip={`Đang tải ${loai.tenLoai}...`} />
                                    </div>
                                ) : (
                                    <>
                                        {currentDevices && currentDevices.length > 0 ? (
                                            <>
                                                {/* Render the grouped devices */}
                                                {renderGroupedDevices(currentDevices)}

                                                {/* --- ADD DEVICE UPDATE BUTTON HERE --- */}
                                                <div style={{ textAlign: 'right', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #f0f0f0' }}>
                                                    <Button
                                                        key={`updateDevices-${loai.maLoai}`}
                                                        type="primary"
                                                        // Pass maLoai and tenLoai to the handler
                                                        onClick={() => handleOpenDeviceUpdateModal(loai.maLoai, loai.tenLoai)}
                                                    >
                                                        Cập nhật trạng thái {loai.tenLoai}
                                                    </Button>
                                                </div>
                                                {/* --- END DEVICE UPDATE BUTTON --- */}
                                            </>
                                        ) : (
                                            <p style={{ textAlign: 'center', padding: '30px 0' }}>
                                                Không có thiết bị loại "{loai.tenLoai}" nào trong phòng này hoặc không thể tải dữ liệu.
                                            </p>
                                        )}
                                    </>
                                )}
                            </TabPane>
                        ))}
                        {/* Optional: Show loading indicator while device types are loading */}
                        {loadingDeviceTypes && (
                            <TabPane tab={<Spin size="small"/>} key="loading_types" disabled />
                        )}

                    </Tabs>
                </Modal>
                <Modal
                    title={`Cập nhật trạng thái - Phòng ${currentRoomName}`}
                    visible={isComputerUpdateModalVisible} // <-- State modal cập nhật
                    onCancel={handleComputerUpdateModalClose} // <-- Hàm đóng modal cập nhật
                    width={700}
                    bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                    footer={[ // <-- Footer modal cập nhật
                        <Button key="cancel" onClick={handleComputerUpdateModalClose} disabled={isUpdatingStatus}>
                            Hủy
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            loading={isUpdatingStatus}
                            onClick={handleCompleteUpdate} // Gọi hàm xử lý API
                        >
                            Hoàn tất cập nhật
                        </Button>,
                    ]}
                >
                    <Spin spinning={isUpdatingStatus} tip="Đang cập nhật...">
                        {/* Sửa text hướng dẫn */}
                        <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center' }}>
                            Tick/Untick vào ô bên cạnh máy để chuyển đổi trạng thái giữa '{ACTIVE_STATUS}' và '{INACTIVE_STATUS}'.<br/>
                            Máy có trạng thái '{BROKEN_STATUS}' không thể thay đổi.
                        </p>
                        <Table
                            columns={computerUpdateColumns} // Columns bảng cập nhật
                            dataSource={computersInRoom}    // Dùng lại data đã fetch
                            rowKey="maMay"
                            pagination={false}
                            size="small"
                        />
                    </Spin>
                </Modal>
                <Modal
                    // Dynamic title based on the current device type being updated
                    title={`Cập nhật trạng thái - ${currentDeviceTypeForUpdate.tenLoai || 'Thiết bị'} - Phòng ${currentRoomName}`}
                    visible={isDeviceUpdateModalVisible}
                    onCancel={handleDeviceUpdateModalClose}
                    width={700} // Adjust width as needed
                    bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                    footer={[
                        <Button key="cancelDeviceUpdate" onClick={handleDeviceUpdateModalClose} disabled={isUpdatingDeviceStatus}>
                            Hủy
                        </Button>,
                        <Button
                            key="submitDeviceUpdate"
                            type="primary"
                            loading={isUpdatingDeviceStatus}
                            onClick={handleCompleteDeviceUpdate} // Call the device update handler
                        >
                            Hoàn tất cập nhật
                        </Button>,
                    ]}
                    // Ensure it closes when clicking outside or pressing Esc
                    maskClosable={!isUpdatingDeviceStatus}
                    keyboard={!isUpdatingDeviceStatus}
                >
                    <Spin spinning={isUpdatingDeviceStatus} tip="Đang cập nhật trạng thái thiết bị...">
                        <p style={{ marginBottom: '15px', fontStyle: 'italic', textAlign: 'center' }}>
                            Tick/Untick vào ô bên cạnh thiết bị để chuyển đổi trạng thái giữa '{ACTIVE_STATUS}' và '{INACTIVE_STATUS}'.<br/>
                            Thiết bị có trạng thái '{BROKEN_STATUS}' không thể thay đổi.
                        </p>
                        <Table
                            columns={deviceUpdateColumns} // Use the new columns for devices
                            // Use currentDevices which holds the devices for the selected tab
                            dataSource={currentDevices}
                            rowKey="maThietBi" // Key is maThietBi
                            pagination={false} // No pagination needed for this modal usually
                            size="small"
                        />
                    </Spin>
                </Modal>
                <Modal
                    title="User Profile"
                    visible={userProfileModalVisible}
                    onOk={handleUserProfileUpdate}
                    onCancel={() => setUserProfileModalVisible(false)}
                    okText="Cập Nhật"
                    cancelText="Đóng"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            label="Tên Đăng Nhập"
                            name="tenDangNhap"
                            rules={[{ required: true, message: 'Please input your username!' }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="image"
                            label="Upload Image"
                            valuePropName="fileList"
                            getValueFromEvent={(e) => {
                                if (Array.isArray(e)) {
                                    return e;
                                }
                                return e?.fileList;
                            }}
                        >
                            <Upload.Dragger
                                name="file"
                                multiple={false}
                                beforeUpload={() => false}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <p className="ant-upload-text">Click or drag file to this area to upload</p>
                                <p className="ant-upload-hint">Support for a single upload.</p>
                            </Upload.Dragger>
                        </Form.Item>
                    </Form>
                </Modal>
            </Content>
        </Layout>
    );
}
