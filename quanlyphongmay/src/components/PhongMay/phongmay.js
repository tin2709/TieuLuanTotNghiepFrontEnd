import React, { useState, useEffect, useRef } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined, // Import LogoutOutlined icon
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
} from "antd"; // Import Layout
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
// import font from '../../font/font';
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook

const { Option } = Select;
const { Header, Content } = Layout; // Destructure Header and Content from Layout

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            DarkReader.disable();
        } else {
            DarkReader.enable({
                brightness: 100,
                contrast: 90,
                sepia: 10,
            });
        }
        setIsDarkMode(!isDarkMode);
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
    const navigate = useNavigate(); // Initialize navigate hook
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);
    const [showColumnSelect, setShowColumnSelect] = useState(false);
    const inputRef = useRef(null);

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
            document.body.removeChild(script1);
            document.body.removeChild(script2);
        };
    }, []);

    const fetchLabRooms = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSPhongMay?token=${token}`;
            console.log("Fetching URL:", url);

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Response Status:", response.status);

            if (!response.ok) {
                console.error("Response Error:", response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Data:", data);

            setInitialLabRooms(data); // Lưu toàn bộ dữ liệu vào initialLabRooms
            setLabRooms(data.slice(0, pagination.pageSize)); // Hiển thị trang đầu tiên
        } catch (error) {
            console.error("Error fetching lab rooms:", error);
            console.log("Error Message:", error.message); // In ra error.message
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };
    // Handle delete action
    const handleDelete = (record) => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa phòng này?",
            text: `Phòng máy: ${record.tenPhong}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteLabRoom(record.maPhong); // Delete the lab room
            }
        });
    };

    // Perform delete action
    const deleteLabRoom = async (maPhong) => {
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

            Swal.fire("Thành công!", "Đã xóa phòng máy thành công!", "success");

            // Re-fetch the lab rooms after deletion
            fetchLabRooms();
        } catch (error) {
            console.error("Error deleting lab room:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa phòng máy: " + error.message, "error");
        }
    };
    const sortData = (data, sortKey, sortOrder) => {
        if (!sortKey) return data;

        const sortedData = [...data].sort((a, b) => {
            const valueA = a[sortKey];
            const valueB = b[sortKey];

            if (typeof valueA === "string" && typeof valueB === "string") {
                return sortOrder === "ascend"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } else if (typeof valueA === "number" && typeof valueB === "number") {
                return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
            } else {
                return 0;
            }
        });

        return sortedData;
    };

    const handleSearch = async (value) => {
        setSearch(value);
        if (value) {
            setShowColumnSelect(true);
        } else {
            setShowColumnSelect(false);
            setLabRooms(initialLabRooms.slice(0, pagination.pageSize));
        }
    };

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
        performSearch(search, column);
    };

    const performSearch = async (searchValue, searchColumn) => {
        if (searchValue && searchColumn) {
            const token = localStorage.getItem("authToken");
            if (!token) {
                Swal.fire("Error", "Bạn chưa đăng nhập", "error");
                return;
            }
            setLoading(true);
            try {
                const keyword = `${searchColumn}: ${searchValue}`; // Tạo keyword

                console.log("Keyword đang được gửi đi:", keyword); // In keyword

                const url = `https://localhost:8080/searchPhongMay?keyword=${keyword}&token=${token}`;

                console.log("URL đang được gọi:", url); // In URL

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    console.error("Search Error:", response.status, response.statusText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                if (response.status === 204) {
                    setLabRooms([]);
                    return;
                }

                try {
                    const text = await response.text();
                    console.log("Response Body:", text);
                    const data = JSON.parse(text);
                    setLabRooms(data.results);
                } catch (parseError) {
                    console.error("Error parsing JSON:", parseError);
                    Swal.fire("Error", "Lỗi xử lý dữ liệu từ máy chủ: " + parseError.message, "error");
                    setLabRooms([]);
                }
            } catch (error) {
                console.error("Error searching lab rooms:", error);
                Swal.fire("Error", "Có lỗi xảy ra khi tìm kiếm dữ liệu: " + error.message, "error");
            } finally {
                setLoading(false);
            }
        } else {
            setLabRooms(initialLabRooms.slice(0, pagination.pageSize));
        }
    };
    const updateTableData = (page, pageSize, sortField, sortOrder) => {
        let sortedData = sortData(initialLabRooms, sortField, sortOrder); // Sắp xếp dữ liệu
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = sortedData.slice(startIndex, endIndex);
        setLabRooms(paginatedData); // Cập nhật dữ liệu hiển thị trên trang
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        const { current, pageSize } = newPagination;

        let sortField = null;
        let sortOrder = null;

        if (sorter && sorter.field && sorter.order) {
            sortField = sorter.field;
            sortOrder = sorter.order;
            setSortInfo({ field: sortField, order: sortOrder });
        } else {
            setSortInfo({});
        }

        updateTableData(current, pageSize, sortField, sortOrder);
        setPagination(newPagination);
    };
    const onSelectChange = (newSelectedRowKeys) => {
        console.log("Selected Row Keys changed: ", newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
        setHasSelected(newSelectedRowKeys.length > 0);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            // This function is essential for associating the checkbox with the right key.
            disabled: false, // You can set to true based on a certain logic
            name: record.maPhong, // Must be unique to make the checkbox controllable
        }),
    };

    useEffect(() => {
        fetchLabRooms();
    }, []);
    const startIndex = (pagination.current - 1) * pagination.pageSize;

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add Arial font (a font that supports Vietnamese characters)
        doc.setFont("Arial");

        // Create the table
        doc.autoTable({
            head: [["STT", "Tên phòng", "Mô tả", "Số máy", "Trạng thái"]],
            body: labRooms.map((room, index) => [
                index + 1, // STT
                room.tenPhong, // Ensure Vietnamese characters are correctly rendered
                room.moTa,
                room.soMay,
                room.trangThai,
            ]),
        });

        // Save the generated PDF
        doc.save("DanhSachPhongMay.pdf");
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(labRooms);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachPhongMay");
        XLSX.writeFile(wb, "DanhSachPhongMay.xlsx");
    };
    const confirmDeleteMultiple = () => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa các phòng đã chọn?",
            text: `Bạn đang cố gắng xóa ${selectedRowKeys.length} phòng.`,
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
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            // Convert the array of room IDs to a comma-separated string
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

            Swal.fire("Thành công!", "Đã xóa các phòng máy thành công!", "success");
            setSelectedRowKeys([]);
            fetchLabRooms(); // Reload the list
        } catch (error) {
            console.error("Error deleting lab rooms:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa phòng máy: " + error.message, "error");
        }
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addphongmay`)}>
                Tạo mới bằng form
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={() => navigate(`/importfile`)}>
                Tạo mới bằng file
            </Menu.Item>
        </Menu>
    );

    const handleLogout = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const url = `https://localhost:8080/logout?token=${token}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json(); // Try to parse error message from response
                const errorMessage =
                    errorData?.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            localStorage.removeItem("authToken"); // Remove token from local storage

            Swal.fire("Thành công!", "Đăng xuất thành công!", "success").then(() => {
                navigate("/login"); // Redirect to login page
            });
        } catch (error) {
            console.error("Logout error:", error);
            Swal.fire("Error", "Đăng xuất thất bại: " + error.message, "error");
        }
    };

    const columns = [
        {
            title: (
                <Checkbox
                    onChange={(e) => {
                        const allKeys = labRooms.map((record) => record.maPhong);
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
            render: (text, record) => null, // No individual checkbox needed here
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
                        onClick={() => navigate(`/editphongmay/${record.maPhong}`)} // Chú ý dòng này
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        type="link"
                        onClick={() => handleDelete(record)} // Trigger delete confirmation
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
                    backgroundColor: "#fff", // Add background color
                    padding: "0 24px", // Add padding
                }}
            >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#000" }}>
                    Danh sách phòng học
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center" }}>
                    <DarkModeToggle />
                    <Button icon={<LogoutOutlined />} type="text" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <Content className="lab-management-content" style={{ padding: "24px" }}>
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
                    />

                    {showColumnSelect && (
                        <Select
                            placeholder="Chọn thuộc tính"
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

                <Button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700" type="primary">
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
                            selectedRowKeys: selectedRowKeys, // Use the state here
                            onChange: onSelectChange, // Make sure this gets called to update the state.
                        }}
                        columns={columns}
                        dataSource={labRooms}
                        rowKey="maPhong"
                        loading={loading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: initialLabRooms.length,
                            onChange: handleTableChange,
                            showSizeChanger: true, // Allows users to change page size
                            onShowSizeChange: (current, size) => {
                                setPagination({
                                    current: current,
                                    pageSize: size,
                                });
                            },
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
            </Content>
        </Layout>
    );
}