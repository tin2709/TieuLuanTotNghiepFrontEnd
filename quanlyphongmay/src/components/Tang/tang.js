import React, { useState, useEffect } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined,
    QuestionCircleOutlined // Import QuestionCircleOutlined
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
} from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import font from "../../font/font";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import ImportFileModal from "./ImportFileModal";
import introJs from 'intro.js'; // Import intro.js library
import 'intro.js/introjs.css'; // Import intro.js CSS


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

export default function TangManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    const [tangs, setTangs] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [initialTangs, setInitialTangs] = useState([]);
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [filteredTangs, setFilteredTangs] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);
    const [notification, setNotification] = useState(null);

    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            {
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
                element: '#create-new-dropdown-tang',
                intro: 'Tạo tầng mới bằng form hoặc import từ file.',
                position: 'bottom-start'
            },
            {
                element: '.ant-table-thead > tr > th:nth-child(3)', // Tên tầng column
                intro: 'Click vào đây để sắp xếp danh sách tầng theo tên.',
                position: 'bottom'
            },
            {
                element: '.ant-table-thead > tr > th:nth-child(4)', // Tên tòa nhà column
                intro: 'Click vào đây để sắp xếp danh sách tầng theo tên tòa nhà.',
                position: 'bottom'
            },
            {
                element: '.ant-table-thead > tr > th:last-child', // Hành động column
                intro: 'Tại cột này, bạn có thể chỉnh sửa hoặc xóa tầng.',
                position: 'left'
            },
            {
                element: '#delete-selected-button-tang',
                intro: 'Xóa các tầng đã được chọn (tick vào checkbox).',
                position: 'top-end',
            },
            {
                element: '#logout-button-tang',
                intro: 'Đăng xuất khỏi ứng dụng quản lý tầng.',
                position: 'bottom-end'
            },
        ];

        introJs().setOptions({
            steps: steps,
            nextLabel: 'Tiếp theo',
            prevLabel: 'Quay lại',
            doneLabel: 'Hoàn tất',
            scrollTo: 'element',
            overlayOpacity: 0.5,
        }).start();
    };


    useEffect(() => {
        console.log("[Component Tang] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            console.error("Loader Error Handled in Component Tang:", loaderResult);
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
            console.log("[Component Tang] Setting initial data:", data);
            setInitialTangs(data);
            setTangs(data.slice(0, pagination.pageSize));
            setLoadError(null);
            setPagination(prev => ({ ...prev, current: 1 }));
            setFilteredTangs(null);
        } else {
            console.error("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
        }
    }, [loaderResult, navigate]);

    useEffect(() => {
        const eventSource = new EventSource("https://localhost:8080/subscribe");
        eventSource.onopen = () => console.log("SSE connection opened for Tang");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                setNotification(messageText);

                if ((messageText.toLowerCase().includes("xóa") || messageText.toLowerCase().includes("thêm"))
                    && messageText.toLowerCase().includes("tầng")) {
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
                } else {
                    // Swal.fire({}); // Removed for brevity, add back if needed
                }
            }
        };
        eventSource.onerror = (error) => {
            console.error("SSE error:", error);
            eventSource.close();
        };
        return () => { eventSource.close(); };
    }, [navigate]);


    const showImportModal = () => {
        setIsModalVisible(true);
    };

    const hideImportModal = () => {
        setIsModalVisible(false);
    };

    const handleImport = async (file) => {
        console.log("File imported:", file);
    };
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

    const handleDelete = (record) => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa tầng này?",
            text: `Tầng: ${record.tenTang}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteTang(record.maTang);
            }
        });
    };

    const deleteTang = async (maTang) => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const url = `https://localhost:8080/XoaTang?maTang=${maTang}&token=${token}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error("Error deleting tang:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa tầng: " + error.message, "error");
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
        if (searchValue && searchColumn) {
            const token = localStorage.getItem("authToken");
            if (!token) {
                Swal.fire("Error", "Bạn chưa đăng nhập", "error");
                return;
            }
            setInternalLoading(true);
            try {
                const url = `https://localhost:8080/searchTang?keyword=${searchColumn}:${searchValue}&token=${token}`;
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
                    setTangs([]);
                    return;
                }

                try {
                    const text = await response.text();
                    console.log("Response Body:", text);
                    const data = JSON.parse(text);
                    setTangs(data.results);
                } catch (parseError) {
                    console.error("Error parsing JSON:", parseError);
                    Swal.fire("Error", "Lỗi xử lý dữ liệu từ máy chủ: " + parseError.message, "error");
                    setTangs([]);
                }
            } catch (error) {
                console.error("Error searching tangs:", error);
                Swal.fire("Error", "Có lỗi xảy ra khi tìm kiếm dữ liệu: " + error.message, "error");
            } finally {
                setInternalLoading(false);
            }
        } else {
            setTangs(initialTangs);
        }
    };
    const updateTableData = (page, pageSize, sortField, sortOrder) => {
        let sortedData = sortData(initialTangs, sortField, sortOrder);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedData = sortedData.slice(startIndex, endIndex);
        setTangs(paginatedData);
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
            name: record.maTang,
        }),
    };

    const startIndex = (pagination.current - 1) * pagination.pageSize;

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.addFileToVFS("Arial.ttf", font);
        doc.setFont("Arial");

        doc.autoTable({
            head: [["STT", "Tên Tầng", "Tên tòa nhà"]],
            body: tangs.map((tang, index) => [
                index + 1,
                tang.tenTang,
                tang.toaNha.tenToaNha,
            ]),
        });

        doc.save("DanhSachTang.pdf");
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(tangs);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachTang");
        XLSX.writeFile(wb, "DanhSachTang.xlsx");
    };
    const confirmDeleteMultiple = () => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa các tầng đã chọn?",
            text: `Bạn đang cố gắng xóa ${selectedRowKeys.length} tầng.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMultipleTangs();
            }
        });
    };

    const deleteMultipleTangs = async () => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            return;
        }

        try {
            const maTangListString = selectedRowKeys.join(",");
            const url = `https://localhost:8080/XoaNhieuTang?maTangList=${maTangListString}&token=${token}`;

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
        } catch (error) {
            console.error("Error deleting tangs:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa phòng máy: " + error.message, "error");
        }
    };

    const menu = (
        <Menu id="create-new-dropdown-tang"> {/* Added ID for intro.js */}
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addtang`)}>
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

    const columns = [
        {
            title: (
                <Checkbox
                    onChange={(e) => {
                        const allKeys = tangs.map((record) => record.maTang);
                        setSelectedRowKeys(e.target.checked ? allKeys : []);
                        setHasSelected(e.target.checked);
                    }}
                    checked={tangs.length > 0 && selectedRowKeys.length === tangs.length}
                    indeterminate={
                        selectedRowKeys.length > 0 && selectedRowKeys.length < tangs.length
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
            title: "Tên tầng",
            dataIndex: "tenTang",
            width: "20%",
            sorter: (a, b) => a.tenTang.localeCompare(b.tenTang),
        },

        {
            title: "Tên tòa nhà",
            dataIndex: ["toaNha", "tenToaNha"],
            width: "30%",
            render: (text, record) => record.toaNha.tenToaNha,
            sorter: (a, b) => a.toaNha.tenToaNha.localeCompare(b.toaNha.tenToaNha),
        },

        {
            title: "Hành động",
            render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        type="link"
                        onClick={() => navigate(`/edittang/${record.maTang}`)}
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
                    Danh sách tầng
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center" }}>
                    <DarkModeToggle />
                    <Button id="logout-button-tang" icon={<LogoutOutlined />} type="text" onClick={handleLogout}> {/* Added ID for intro.js */}
                        Đăng xuất
                    </Button>
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour}>Hướng dẫn</Button> {/* Add Hướng dẫn button */}
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
                    <h1 className="text-2xl font-semibold">Danh sách tầng</h1>
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <Select id="column-select-tang" defaultValue="all" style={{ width: 180 }}> {/* Added ID for intro.js */}
                        <Option value="all">Tất cả cột</Option>
                        <Option value="tenTang">Tên Tầng</Option>
                        <Option value="toaNha">Tên Tòa Nhà</Option>
                    </Select>

                    <div className="flex items-center flex-1 gap-2">
                        <Input
                            id="search-input-tang" // Added ID for intro.js
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ maxWidth: 200 }}
                        />
                    </div>
                </div>

                <Button id="export-pdf-button-tang" onClick={exportToPDF} className="bg-blue-600 hover:bg-blue-700" type="primary"> {/* Added ID for intro.js */}
                    Xuất PDF
                </Button>
                <Button id="export-excel-button-tang" onClick={exportToExcel} className="bg-green-600 hover:bg-green-700" type="primary"> {/* Added ID for intro.js */}
                    Xuất Excel
                </Button>
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-semibold">Danh sách tầng</h1>
                    <Dropdown overlay={menu} placement="bottomRight" arrow>
                        <Button
                            id="create-new-dropdown-button-tang" // Redundant ID, menu has id already
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
                        dataSource={tangs}
                        rowKey="maTang"
                        loading={internalLoading}
                        pagination={{
                            current: pagination.current,
                            pageSize: pagination.pageSize,
                            total: initialTangs.length,
                            onChange: handleTableChange,
                            showSizeChanger: true,
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
                        id="delete-selected-button-tang" // Added ID for intro.js
                        type="primary"
                        danger
                        onClick={confirmDeleteMultiple}
                        className="mt-4"
                        disabled={internalLoading}
                    >
                        Xóa nhiều tầng
                    </Button>
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