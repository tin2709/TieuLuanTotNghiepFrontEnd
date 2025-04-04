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
    DesktopOutlined
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
    Tabs
} from "antd";
import { InboxOutlined } from '@ant-design/icons';
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

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
    const [search, setSearch] = useState("");
    const [labRooms, setLabRooms] = useState([]);
    const [loading, setLoading] = useState(false);
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
    // Bên trong component LabManagement, gần các state khác
    const [isComputerModalVisible, setIsComputerModalVisible] = useState(false);
    const [computerModalLoading, setComputerModalLoading] = useState(false);
    const [computersInRoom, setComputersInRoom] = useState([]);
    const [currentRoomName, setCurrentRoomName] = useState('');
    const [currentRoomMaPhong, setCurrentRoomMaPhong] = useState(null);

    // Modal 2: Cập nhật trạng thái
    const [isComputerUpdateModalVisible, setIsComputerUpdateModalVisible] = useState(false); // <-- State mới
    const [selectedComputerKeysForUpdate, setSelectedComputerKeysForUpdate] = useState([]);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const BROKEN_STATUS = 'Đã hỏng';
    const ACTIVE_STATUS = 'Đang hoạt động';
    const INACTIVE_STATUS = 'Không hoạt động';

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

    const fetchLabRooms = async () => {
        // ... (rest of the fetchLabRooms function remains the same)
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSPhongMay?token=${token}`;
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
            setInitialLabRooms(data);
            setLabRooms(data.slice(0, pagination.pageSize)); // Initial display
        } catch (error) {
            console.error("Error fetching lab rooms:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

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
            fetchLabRooms();
        } catch (error) {
            console.error("Error deleting:", error);
            Swal.fire("Error", "Lỗi: " + error.message, "error");
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

        setLoading(true);
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
            setLoading(false);
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

    useEffect(() => {
        // ... (rest of the useEffect hook remains the same)
        fetchLabRooms();
    }, []);

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

        // Lưu mã phòng và tên phòng
        setCurrentRoomMaPhong(maPhong);
        setCurrentRoomName(tenPhong);

        // Chỉ mở Modal Xem Trạng Thái và tải dữ liệu cho nó
        setIsComputerModalVisible(true); // <-- Mở modal xem
        setComputerModalLoading(true);
        setComputersInRoom([]); // Xóa dữ liệu cũ

        // Phần fetch API giữ nguyên
        try {
            const url = `https://localhost:8080/DSMayTinhTheoPhong?maPhong=${maPhong}&token=${token}`;
            const response = await fetch(url, { /* ... headers ... */ });
            // ... (xử lý response 200, 204, 401, 404, error như cũ) ...
            if (response.status === 204) { setComputersInRoom([]); }
            else if (response.ok) {
                const responseClone = response.clone();
                const responseText = await responseClone.text();
                if (!responseText) { setComputersInRoom([]); }
                else { try { const data = await response.json(); setComputersInRoom(data || []); } catch (e) { console.error("JSON parse error:", e); setComputersInRoom([]); Swal.fire("Lỗi", "Dữ liệu máy tính không hợp lệ.", "error");}}
            }
            else if (response.status === 401) { Swal.fire("Lỗi", "Phiên đăng nhập hết hạn.", "error").then(() => { setIsComputerModalVisible(false); navigate('/login'); }); }
            else if (response.status === 404) { Swal.fire("Lỗi", `Phòng ${tenPhong} không tồn tại.`, "error"); setIsComputerModalVisible(false); }
            else { let err = `HTTP ${response.status}`; try { err += await response.text(); } catch{} throw new Error(err); }
        } catch (error) {
            console.error("General error in showComputerStatusModal:", error);
            if (error.message && !error.message.includes("401") && !error.message.includes("404")) {
                Swal.fire("Lỗi", "Không thể tải trạng thái máy tính: " + error.message, "error");
            }
            setIsComputerModalVisible(false);
        } finally {
            setComputerModalLoading(false);
        }
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
    const deleteMultipleLabRooms = async () => {
        // ... (rest of the deleteMultipleLabRooms function remains the same)
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

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
            fetchLabRooms();
        } catch (error) {
            console.error("Error deleting:", error);
            Swal.fire("Error", "Lỗi: " + error.message, "error");
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
                        loading={loading}
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
                    title={`Trạng thái máy tính - Phòng ${currentRoomName}`}
                    visible={isComputerModalVisible} // <-- State modal xem
                    onCancel={handleComputerModalClose} // <-- Hàm đóng modal xem
                    width={800}
                    bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
                    footer={[ // <-- Footer modal xem
                        <Button key="close" onClick={handleComputerModalClose}>
                            Đóng
                        </Button>,
                        !computerModalLoading && computersInRoom && computersInRoom.length > 0 && (
                            <Button key="update" type="primary" onClick={handleOpenUpdateModal}>
                                Cập nhật trạng thái
                            </Button>
                        )
                    ]}
                >
                    {computerModalLoading ? (
                        <div style={{ textAlign: 'center', padding: '50px' }}>
                            <Spin size="large" tip="Đang tải..." />
                        </div>
                    ) : (
                        // --- SỬA TỪ ĐÂY ---
                        <>
                            {computersInRoom && computersInRoom.length > 0 ? (
                                // Phần hiển thị khi CÓ dữ liệu
                                <>
                                    {/* Phần render icon máy GV */}
                                    {(() => {
                                        const teacherComputers = computersInRoom.filter(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
                                        if (!teacherComputers.length) return null;
                                        return (
                                            <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                                                <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>Máy Giáo Viên</h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                                                    {teacherComputers.map((mayTinh) => (
                                                        <div key={mayTinh.maMay} style={{ textAlign: 'center', width: '100px', padding: '10px', borderRadius: '4px' }}>
                                                            <DesktopOutlined style={{ fontSize: '3rem', color: mayTinh.trangThai === BROKEN_STATUS ? '#ff4d4f' : mayTinh.trangThai === ACTIVE_STATUS ? '#52c41a' : '#bfbfbf' }} />
                                                            <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word' }}>{mayTinh.tenMay || `Máy ${mayTinh.maMay}`}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                    {/* Phần render icon máy SV */}
                                    {(() => {
                                        const otherComputers = computersInRoom.filter(m => !(m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên')));
                                        const hasTeachers = computersInRoom.some(m => m.moTa?.toLowerCase().includes('gv') || m.moTa?.toLowerCase().includes('giáo viên'));
                                        // Điều chỉnh logic hiển thị phù hợp khi không có máy SV
                                        if (!otherComputers.length) {
                                            // Nếu có GV nhưng 0 SV -> không hiển thị mục SV
                                            if(hasTeachers) return null;
                                            // Nếu không có GV và cũng không có SV -> không hiển thị (sẽ rơi vào message "Không có máy nào")
                                            // Thực tế trường hợp này sẽ không vào đây do check computersInRoom.length > 0 bên ngoài
                                        }
                                        return (
                                            <div>
                                                {hasTeachers && <h4 style={{ marginBottom: '15px', textAlign: 'center', fontWeight: 'bold' }}>Máy Sinh Viên / Khác</h4>}
                                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '20px' }}>
                                                    {otherComputers.map((mayTinh) => (
                                                        <div key={mayTinh.maMay} style={{ textAlign: 'center', width: '100px', padding: '10px' }}>
                                                            <DesktopOutlined style={{ fontSize: '3rem', color: mayTinh.trangThai === BROKEN_STATUS ? '#ff4d4f' : mayTinh.trangThai === ACTIVE_STATUS ? '#52c41a' : '#bfbfbf' }}/>
                                                            <div style={{ marginTop: '5px', fontSize: '0.8rem', wordWrap: 'break-word' }}>{mayTinh.tenMay || `Máy ${mayTinh.maMay}`}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Legend chỉ hiển thị khi có dữ liệu */}
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
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><DesktopOutlined style={{ color: '#bfbfbf', marginRight: '5px', fontSize: '1.2em' }} />: {INACTIVE_STATUS}</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><DesktopOutlined style={{ color: '#52c41a', marginRight: '5px', fontSize: '1.2em' }} />: {ACTIVE_STATUS}</span>
                                        <span style={{ display: 'inline-flex', alignItems: 'center' }}><DesktopOutlined style={{ color: '#ff4d4f', marginRight: '5px', fontSize: '1.2em' }} />: {BROKEN_STATUS}</span>
                                    </div>
                                </>
                            ) : (
                                // Phần hiển thị khi KHÔNG có dữ liệu
                                <p style={{ textAlign: 'center', padding: '30px 0' }}>
                                    Không có máy tính nào trong phòng này hoặc không thể tải dữ liệu.
                                </p>
                            )}
                        </>
                        // --- KẾT THÚC SỬA ---
                    )}
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