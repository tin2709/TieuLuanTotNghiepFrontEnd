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
        // ... (rest of the checkUserAndShowModal function, but with image handling)
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
                setUserImage(data.data.image);
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
                        onClick={() =>
                            Swal.fire("Message", `Message to room ${record.tenPhong}`, "question")
                        }
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