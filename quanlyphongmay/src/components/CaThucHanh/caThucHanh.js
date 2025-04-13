// src/features/CaThucHanh/caThucHanhManagement.js
import React, { useState, useEffect, useMemo } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined,
    SunOutlined,
    MoonOutlined,
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
    Result,
} from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import font from "../../font/font"; // Make sure this path is correct
import { useLoaderData, useNavigate } from "react-router-dom";

const { Option } = Select;
const { Header, Content } = Layout;

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

// Placeholder for ImportFileModal - Implement this component if you need file import
const ImportFileModal = ({ visible, onCancel, onImport, loading }) => {
    if (!visible) return null; // Or return null if you want to conditionally render

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onImport(file);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
                <h2>Import Ca Thực Hành từ File</h2>
                <input type="file" onChange={handleFileChange} disabled={loading} />
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onCancel} disabled={loading} style={{ marginRight: '10px' }}>
                        Hủy
                    </Button>
                    <Button type="primary" loading={loading} onClick={() => { /* Trigger import logic if needed */ }} >
                        Import
                    </Button>
                </div>
            </div>
        </div>
    );
};


export default function CaThucHanhManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    const [caThucHanhs, setCaThucHanhs] = useState([]);
    const [filteredCaThucHanhs, setFilteredCaThucHanhs] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [initialCaThucHanhs, setInitialCaThucHanhs] = useState([]);
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);
    const [notification, setNotification] = useState(null);
    const userRole = localStorage.getItem('userRole');
    const username = localStorage.getItem('username');

    useEffect(() => {
        console.log("[Component CaThucHanh] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            console.error("Loader Error Handled in Component CaThucHanh:", loaderResult);
            setLoadError(loaderResult);

            if (loaderResult.type === 'auth') {
                Swal.fire({
                    title: "Lỗi Xác thực",
                    text: loaderResult.message || "Phiên đăng nhập hết hạn.",
                    icon: "error",
                    timer: 2500,
                    showConfirmButton: false,
                    willClose: () => {
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('username');
                        localStorage.removeItem('userRole');
                        navigate('/login', { replace: true });
                    }
                });
            }
        } else if (loaderResult?.data) {
            const data = loaderResult.data || [];
            console.log("[Component CaThucHanh] Setting initial data:", data);
            setInitialCaThucHanhs(data);
            setCaThucHanhs(data.slice(0, pagination.pageSize));
            setLoadError(null);
            setPagination(prev => ({ ...prev, current: 1 }));
            setFilteredCaThucHanhs(null);
        } else {
            console.error("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
        }
    }, [loaderResult, navigate]);

    useEffect(() => {
        const eventSource = new EventSource("https://localhost:8080/subscribe");
        eventSource.onopen = () => console.log("SSE connection opened for CaThucHanh");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                setNotification(messageText);

                if ((messageText.toLowerCase().includes("xóa") || messageText.toLowerCase().includes("thêm"))
                    && messageText.toLowerCase().includes("ca thực hành")) {
                    console.log("SSE indicates CaThucHanh change, reloading...");
                    Swal.fire({
                        title: "Thông báo",
                        text: "Dữ liệu ca thực hành đã được cập nhật. Trang sẽ được tải lại.",
                        icon: "info",
                        timer: 3000,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        willClose: () => navigate(0)
                    });
                } else {
                    Swal.fire({}); // You might want to handle other notifications if needed
                }
            }
        };
        eventSource.onerror = (error) => { console.error("SSE error:", error); eventSource.close(); };
        return () => { eventSource.close(); };
    }, [navigate]);

    useEffect(() => {
        const fetchDataBasedOnRole = async () => {
            const token = localStorage.getItem("authToken");
            if (!token) {
                Swal.fire("Error", "Bạn chưa đăng nhập", "error");
                return;
            }
            setInternalLoading(true);
            try {
                let url = `https://localhost:8080/DSCaThucHanh?token=${token}`;
                if (userRole === '2') {
                    url = `https://localhost:8080/DSCaThucHanhTheoGiaoVienTen?hoTenGiaoVien=${username}&token=${token}`;
                }

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    console.error("Fetch Error:", response.status, response.statusText);
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                if (response.status === 204) {
                    setCaThucHanhs([]);
                    return;
                }

                const data = await response.json();
                setInitialCaThucHanhs(data);
                setCaThucHanhs(data.slice(0, pagination.pageSize));
                setPagination(prev => ({ ...prev, current: 1 }));
                setFilteredCaThucHanhs(null);

            } catch (error) {
                console.error("Error fetching CaThucHanhs:", error);
                Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu: " + error.message, "error");
            } finally {
                setInternalLoading(false);
            }
        };

        fetchDataBasedOnRole();
    }, [userRole, username, pagination.pageSize]);


    const showImportModal = () => {
        setIsModalVisible(true);
    };

    const hideImportModal = () => {
        setIsModalVisible(false);
    };

    const handleImport = async (file) => {
        console.log("File imported:", file);
        // Implement your file import logic here, e.g., parsing XLSX or CSV
        // and sending data to the backend.
        // For now, just close the modal
        hideImportModal();
        Swal.fire("Thành công!", "Chức năng import file đang được phát triển.", "info");
    };

    const handleDelete = (record) => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa ca thực hành này?",
            text: `Ca thực hành: ${record.tenCa}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteCaThucHanh(record.maCa);
            }
        });
    };

    const deleteCaThucHanh = async (maCa) => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const url = `https://localhost:8080/XoaCaThucHanh?maCa=${maCa}&token=${token}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setSelectedRowKeys([]);
            // Refresh data after delete. Consider a more efficient approach if dataset is large.
            navigate(0); // Quick reload page to refresh data.
        } catch (error) {
            console.error("Error deleting CaThucHanh:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa ca thực hành: " + error.message, "error");
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
        performSearch(value, selectedColumn);
    };

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
        performSearch(search, column);
    };

    const performSearch = async (searchValue, searchColumn) => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }
        setInternalLoading(true);

        try {
            let url = `https://localhost:8080/DSCaThucHanh?token=${token}`;
            if (userRole === '2') {
                url = `https://localhost:8080/DSCaThucHanhTheoGiaoVienTen?hoTenGiaoVien=${username}&token=${token}`;
            }

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
                setCaThucHanhs([]);
                return;
            }

            try {
                const text = await response.text();
                console.log("Response Body:", text);
                const data = JSON.parse(text);
                let filteredData = data;
                if (searchValue && searchColumn && searchColumn !== 'all') {
                    filteredData = data.filter(item =>
                        String(item[searchColumn])?.toLowerCase().includes(searchValue.toLowerCase()) // Ensure item[searchColumn] is converted to string
                    );
                }
                setCaThucHanhs(filteredData);
            } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                Swal.fire("Error", "Lỗi xử lý dữ liệu từ máy chủ: " + parseError.message, "error");
                setCaThucHanhs([]);
            }
        } catch (error) {
            console.error("Error searching CaThucHanhs:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tìm kiếm dữ liệu: " + error.message, "error");
        } finally {
            setInternalLoading(false);
        }
    };
    const updateTableData = (page, pageSize, sortField, sortOrder) => {
        let sortedData = sortData(initialCaThucHanhs, sortField, sortOrder);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = sortedData.slice(startIndex, endIndex);
        setCaThucHanhs(paginatedData);
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
            disabled: false,
            name: record.maCa,
        }),
    };

    const startIndex = (pagination.current - 1) * pagination.pageSize;

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.addFileToVFS("Arial.ttf", font);
        doc.setFont("Arial");

        doc.autoTable({
            head: [["STT", "Tên ca", "Ngày thực hành", "Tiết BĐ", "Tiết KT", "Buổi", "Giáo viên", "Phòng máy", "Môn học"]],
            body: caThucHanhs.map((caThucHanh, index) => [
                index + 1,
                caThucHanh.tenCa,
                caThucHanh.ngayThucHanh ? new Date(caThucHanh.ngayThucHanh).toLocaleDateString() : '',
                caThucHanh.tietBatDau,
                caThucHanh.tietKetThuc,
                caThucHanh.buoiSo,
                caThucHanh.giaoVien ? caThucHanh.giaoVien.hoTen : '',
                caThucHanh.phongMay ? caThucHanh.phongMay.tenPhong : '',
                caThucHanh.monHoc ? caThucHanh.monHoc.tenMon : '',
            ]),
        });

        doc.save("DanhSachCaThucHanh.pdf");
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(caThucHanhs.map(item => { // Prepare data for excel export
            return {
                "Tên ca": item.tenCa,
                "Ngày thực hành": item.ngayThucHanh ? new Date(item.ngayThucHanh).toLocaleDateString() : '',
                "Tiết BĐ": item.tietBatDau,
                "Tiết KT": item.tietKetThuc,
                "Buổi": item.buoiSo,
                "Giáo viên": item.giaoVien?.hoTen,
                "Phòng máy": item.phongMay?.tenPhong,
                "Môn học": item.monHoc?.tenMon,
            };
        }), { header: ["Tên ca", "Ngày thực hành", "Tiết BĐ", "Tiết KT", "Buổi", "Giáo viên", "Phòng máy", "Môn học"] });
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachCaThucHanh");
        XLSX.writeFile(wb, "DanhSachCaThucHanh.xlsx");
    };
    const confirmDeleteMultiple = () => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa các ca thực hành đã chọn?",
            text: `Bạn đang cố gắng xóa ${selectedRowKeys.length} ca thực hành.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMultipleCaThucHanhs();
            }
        });
    };

    const deleteMultipleCaThucHanhs = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const maCaListString = selectedRowKeys.join(",");
            const url = `https://localhost:8080/XoaNhieuCaThucHanh?maCaList=${maCaListString}&token=${token}`;

            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setSelectedRowKeys([]);
            navigate(0); // Quick reload page to refresh data.
        } catch (error) {
            console.error("Error deleting multiple CaThucHanhs:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa ca thực hành: " + error.message, "error");
        }
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addCaThucHanh`)}>
                Tạo mới bằng form
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={showImportModal}>
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
                const errorData = await response.json();
                const errorMessage =
                    errorData?.message || `HTTP error! status: ${response.status}`;
                throw new Error(errorMessage);
            }

            localStorage.removeItem("authToken");

            Swal.fire("Thành công!", "Đăng xuất thành công!", "success").then(() => {
                navigate("/login");
            });
        } catch (error) {
            console.error("Logout error:", error);
            Swal.fire("Error", "Đăng xuất thất bại: " + error.message, "error");
        }
    };

    const columns = useMemo(() => [
        {
            title: (
                <Checkbox
                    onChange={(e) => {
                        const allKeys = caThucHanhs.map((record) => record.maCa);
                        setSelectedRowKeys(e.target.checked ? allKeys : []);
                        setHasSelected(e.target.checked);
                    }}
                    checked={caThucHanhs.length > 0 && selectedRowKeys.length === caThucHanhs.length}
                    indeterminate={
                        selectedRowKeys.length > 0 && selectedRowKeys.length < caThucHanhs.length
                    }
                />
            ),
            key: "checkbox",
            width: "5%",
            fixed: "left",
            render: () => null,
        },
        {
            title: "STT",
            key: "stt",
            width: "5%",
            render: (text, record, index) => startIndex + index + 1,
        },
        {
            title: "Tên ca",
            dataIndex: "tenCa",
            width: "10%",
            sorter: (a, b) => a.tenCa.localeCompare(b.tenCa),
        },
        {
            title: "Ngày thực hành",
            dataIndex: "ngayThucHanh",
            width: "10%",
            render: (date) => date ? new Date(date).toLocaleDateString() : '',
            sorter: (a, b) => new Date(a.ngayThucHanh) - new Date(b.ngayThucHanh),
        },
        {
            title: "Tiết bắt đầu",
            dataIndex: "tietBatDau",
            width: "5%",
            align: 'center',
            sorter: (a, b) => a.tietBatDau - b.tietBatDau,
        },
        {
            title: "Tiết kết thúc",
            dataIndex: "tietKetThuc",
            width: "5%",
            align: 'center',
            sorter: (a, b) => a.tietKetThuc - b.tietKetThuc,
        },
        {
            title: "Buổi số",
            dataIndex: "buoiSo",
            width: "10%",
            align: 'center',
            sorter: (a, b) => a.buoiSo - b.buoiSo,
        },
        {
            title: "Giáo viên",
            dataIndex: ["giaoVien", "hoTen"],
            width: "15%",
            render: (text, record) => record.giaoVien?.hoTen,
            sorter: (a, b) => (a.giaoVien?.hoTen || '').localeCompare(b.giaoVien?.hoTen || ''),
        },
        {
            title: "Phòng máy",
            dataIndex: ["phongMay", "tenPhong"],
            width: "15%",
            render: (text, record) => record.phongMay?.tenPhong,
            sorter: (a, b) => (a.phongMay?.tenPhong || '').localeCompare(b.phongMay?.tenPhong || ''),
        },
        {
            title: "Môn học",
            dataIndex: ["monHoc", "tenMon"],
            width: "10%",
            render: (text, record) => record.monHoc?.tenMon,
            sorter: (a, b) => (a.monHoc?.tenMon || '').localeCompare(b.monHoc?.tenMon || ''),
        },
        {
            title: "Hành động",
            render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        type="link"
                        onClick={() => navigate(`/editCaThucHanh/${record.maCa}`)}
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
                            Swal.fire("Message", `Message to CaThucHanh ${record.tenCa}`, "question")
                        }
                    />
                </div>
            ),
        },
    ], [startIndex, navigate, handleDelete, caThucHanhs, selectedRowKeys]);


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
                    Danh sách ca thực hành
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
                {loadError && loadError.type !== 'auth' && (
                    <Result status="error" title="Lỗi Tải Dữ Liệu" subTitle={loadError.message || "Đã có lỗi xảy ra khi tải dữ liệu ca thực hành."} />
                )}

                {!loadError && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold">Danh sách ca thực hành</h1>
                        </div>

                        <div className="flex items-center gap-4 mb-6">


                            <Select
                                defaultValue="all"
                                style={{ width: 180 }}
                                onChange={(value) => handleColumnSelect(value)}
                            >
                                <Option value="all">Tất cả cột</Option>
                                <Option value="tenCa">Tên ca</Option>
                                <Option value="ngayThucHanh">Ngày thực hành</Option>
                                <Option value="tietBatDau">Tiết bắt đầu</Option>
                                <Option value="tietKetThuc">Tiết kết thúc</Option>
                                <Option value="buoiSo">Buổi số</Option>
                                <Option value="giaoVien.hoTen">Giáo viên</Option> {/* Search by nested field */}
                                <Option value="phongMay.tenPhong">Phòng máy</Option> {/* Search by nested field */}
                                <Option value="monHoc.tenMon">Môn học</Option>    {/* Search by nested field */}
                            </Select>

                            <div className="flex items-center flex-1 gap-2">
                                <Input
                                    placeholder="Tìm kiếm..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    style={{ maxWidth: 200 }}
                                />
                            </div>
                        </div>

                        <Button onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700" type="primary">
                            Xuất PDF
                        </Button>
                        <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700" type="primary">
                            Xuất Excel
                        </Button>
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-semibold">Danh sách ca thực hành</h1>
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
                                rowSelection={rowSelection}
                                columns={columns}
                                dataSource={caThucHanhs}
                                rowKey="maCa"
                                loading={internalLoading}
                                pagination={pagination}
                                onChange={handleTableChange}
                            />
                        </div>
                        {hasSelected && (
                            <Button
                                type="primary"
                                danger
                                onClick={confirmDeleteMultiple}
                                className="mt-4"
                                disabled={internalLoading}
                            >
                                Xóa nhiều ca thực hành
                            </Button>
                        )}
                        <ImportFileModal // Re-include ImportFileModal Component
                            visible={isModalVisible}
                            onCancel={hideImportModal}
                            onImport={handleImport}
                            loading={importLoading}
                        />
                    </>
                )}
            </Content>
        </Layout>
    );
}