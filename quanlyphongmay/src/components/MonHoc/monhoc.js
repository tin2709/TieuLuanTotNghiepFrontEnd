import React, { useState, useEffect } from "react";
import {
    HomeOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined,
    QuestionCircleOutlined
} from "@ant-design/icons";
import {
    Button,
    Input,
    Select,
    Table,
    // Checkbox, // Removed as it's no longer directly used for row selection
    Dropdown,
    Menu,
    Layout,
    Spin,
    Alert,
} from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import font from "../../font/font";
import { useLoaderData, useNavigate } from "react-router-dom";
import introJs from 'intro.js';
import 'intro.js/introjs.css';

const { Option } = Select;
const { Header, Content } = Layout;

// DarkModeToggle component remains the same...
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
        const dm = DarkReader.auto({ brightness: 100, contrast: 90, sepia: 10 });
        setIsDarkMode(DarkReader.isEnabled());
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


export default function MonHocManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    const [monHocs, setMonHocs] = useState([]);
    const [filteredMonHocs, setFilteredMonHocs] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState('all');
    const [initialMonHocs, setInitialMonHocs] = useState([]);
    const navigate = useNavigate();
    // const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Removed
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [sortInfo, setSortInfo] = useState({});
    // const [hasSelected, setHasSelected] = useState(false); // Removed
    const [notification, setNotification] = useState(null);

    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            { element: '#search-input-monhoc', intro: 'Nhập tên môn học, số buổi, ngày bắt đầu hoặc ngày kết thúc để tìm kiếm.', position: 'bottom-start' },
            { element: '#column-select-monhoc', intro: 'Chọn cột bạn muốn tìm kiếm (Tên môn học, Số buổi, Ngày bắt đầu, Ngày kết thúc).', position: 'bottom-start' },
            { element: '#export-pdf-button-monhoc', intro: 'Xuất danh sách môn học ra file PDF.', position: 'bottom-start' },
            { element: '#export-excel-button-monhoc', intro: 'Xuất danh sách môn học ra file Excel.', position: 'bottom-start' },
            { element: '#create-new-dropdown-monhoc', intro: 'Tạo môn học mới bằng form hoặc import từ file.', position: 'bottom-start' },
            { element: '.ant-table-thead > tr > th:nth-child(2)', intro: 'Click vào đây để sắp xếp danh sách môn học theo tên.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(3)', intro: 'Click vào đây để sắp xếp danh sách môn học theo số buổi.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(4)', intro: 'Click vào đây để sắp xếp danh sách môn học theo ngày bắt đầu.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(5)', intro: 'Click vào đây để sắp xếp danh sách môn học theo ngày kết thúc.', position: 'bottom' },
            // Removed: { element: '#delete-selected-button-monhoc', intro: 'Xóa các môn học đã được chọn (tick vào checkbox).', position: 'top-end' },
            { element: '#logout-button-monhoc', intro: 'Đăng xuất khỏi ứng dụng quản lý môn học.', position: 'bottom-end' },
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

    // --- Effects ---
    useEffect(() => {
        console.log("[Component MonHoc] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            console.error("Loader Error Handled in Component MonHoc:", loaderResult);
            setLoadError(loaderResult);
            setMonHocs([]); // Clear data on error
            setInitialMonHocs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));

            if (loaderResult.type === 'auth') {
                Swal.fire("Lỗi Xác thực", loaderResult.message || "Phiên đăng nhập hết hạn.", "error").then(() => {
                    navigate("/login", { replace: true });
                });
            } else {
                Swal.fire("Lỗi Tải Dữ Liệu", loaderResult.message || "Không thể tải danh sách môn học.", "error");
            }
        } else if (loaderResult?.data) {
            const data = loaderResult.data || [];
            console.log("[Component MonHoc] Setting initial DTO data:", data);
            if (data.length > 0) {
                console.log("[Component MonHoc] First DTO item:", data[0]); // Log chi tiết cấu trúc DTO
            }
            setInitialMonHocs(data);
            setMonHocs(data);
            setLoadError(null);
            setPagination(prev => ({ ...prev, current: 1, total: data.length }));
        } else {
            console.warn("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
            setMonHocs([]);
            setInitialMonHocs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
    }, [loaderResult, navigate]);

    useEffect(() => {
        const eventSource = new EventSource("https://localhost:8080/subscribe");
        eventSource.onopen = () => console.log("SSE connection opened for MonHoc");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                setNotification(messageText);

                if ((messageText.toLowerCase().includes("xóa") || messageText.toLowerCase().includes("thêm") || messageText.toLowerCase().includes("cập nhật"))
                    && messageText.toLowerCase().includes("môn học")) {
                    console.log("SSE indicates MonHoc change, preparing reload...");
                    Swal.fire({
                        title: "Thông báo",
                        text: "Dữ liệu môn học đã được cập nhật. Danh sách sẽ được tải lại.",
                        icon: "info",
                        timer: 2500,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        willClose: () => navigate(0) // Force reload
                    });
                }
            }
        };
        eventSource.onerror = (error) => { console.error("SSE error:", error); eventSource.close(); };
        return () => { eventSource.close(); };
    }, [navigate]);

    // Botpress useEffect remains the same
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
            if (document.body.contains(script2)) {
                document.body.removeChild(script2);
            }
        };
    }, []);

    // --- Handlers ---
    const showImportModal = () => setIsModalVisible(true);
    const hideImportModal = () => setIsModalVisible(false);
    const handleImport = async (file) => { console.log("File imported:", file); /* Implement import logic */ };

    // Client-side sorting function
    const sortData = (data, sortKey, sortOrder) => {
        if (!sortKey || !sortOrder) return data;

        const sortedData = [...data].sort((a, b) => {
            const valueA = a[sortKey] ?? (typeof a[sortKey] === 'number' ? 0 : '');
            const valueB = b[sortKey] ?? (typeof b[sortKey] === 'number' ? 0 : '');

            // Handle date sorting
            if (sortKey === 'ngayBatDau' || sortKey === 'ngayKetThuc') {
                const dateA = valueA ? new Date(valueA).getTime() : 0;
                const dateB = valueB ? new Date(valueB).getTime() : 0;
                return sortOrder === "ascend" ? dateA - dateB : dateB - dateA;
            }
            // Handle number sorting
            else if (typeof valueA === "number" && typeof valueB === "number") {
                return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
            }
            // Default to string comparison
            else if (typeof valueA === "string" && typeof valueB === "string") {
                return sortOrder === "ascend"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } else {
                const stringA = String(valueA);
                const stringB = String(valueB);
                return sortOrder === "ascend"
                    ? stringA.localeCompare(stringB)
                    : stringB.localeCompare(stringA);
            }
        });
        return sortedData;
    };

    // Client-side search/filter function
    const performClientSearch = (searchValue, searchColumn) => {
        setInternalLoading(true);
        let filteredData = initialMonHocs;

        if (searchValue) {
            filteredData = initialMonHocs.filter(item => {
                const lowerSearchValue = searchValue.toLowerCase();
                if (searchColumn === 'all') {
                    // Search across all relevant string/number fields
                    return (item.tenMon != null && typeof item.tenMon === 'string' && item.tenMon.toLowerCase().includes(lowerSearchValue)) ||
                        (item.soBuoi != null && String(item.soBuoi).includes(lowerSearchValue)) ||
                        (item.ngayBatDau != null && String(new Date(item.ngayBatDau).toLocaleDateString('vi-VN')).includes(lowerSearchValue)) ||
                        (item.ngayKetThuc != null && String(new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')).includes(lowerSearchValue));
                } else {
                    const itemValue = item[searchColumn];
                    if (itemValue == null) return false;

                    if (typeof itemValue === 'string') {
                        return itemValue.toLowerCase().includes(lowerSearchValue);
                    } else if (typeof itemValue === 'number') {
                        return String(itemValue).includes(lowerSearchValue);
                    } else if (itemValue instanceof Date) {
                        return itemValue.toLocaleDateString('vi-VN').includes(lowerSearchValue);
                    }
                    else if (typeof itemValue === 'string' && (searchColumn === 'ngayBatDau' || searchColumn === 'ngayKetThuc')) {
                        const formattedDate = new Date(itemValue).toLocaleDateString('vi-VN');
                        return formattedDate.includes(lowerSearchValue);
                    }
                    return false;
                }
            });
        }
        filteredData = sortData(filteredData, sortInfo.field, sortInfo.order);
        setFilteredMonHocs(filteredData);
        setMonHocs(filteredData);
        setPagination(prev => ({ ...prev, current: 1, total: filteredData.length }));
        setInternalLoading(false);
    };

    const handleSearch = (value) => {
        setSearch(value);
        performClientSearch(value, selectedColumn);
    };

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
        performClientSearch(search, column);
    };

    const handleTableChange = (newPagination, filters, sorter) => {
        const { current, pageSize } = newPagination;
        let currentData = filteredMonHocs ?? initialMonHocs;
        let sortField = sortInfo.field;
        let sortOrder = sorter.order; // Use sorter.order directly if available

        if (sorter.field && sorter.order) { // Check if sorting is applied
            sortField = sorter.field;
            sortOrder = sorter.order;
            setSortInfo({ field: sortField, order: sortOrder });
            currentData = sortData(currentData, sortField, sortOrder);
            setMonHocs(currentData);
        } else if (!sorter.order && sortInfo.field) { // If sorter is cleared (e.g., click third time)
            setSortInfo({}); // Clear sort info
            setMonHocs(filteredMonHocs ?? initialMonHocs); // Reset to original or filtered unsorted data
        }


        setPagination({ ...pagination, current, pageSize });
    };

    // Removed onSelectChange, rowSelection, confirmDeleteMultiple, deleteMultipleMonHocs

    // --- Export Functions ---
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.addFileToVFS("Arial.ttf", font);
        doc.setFont("Arial", "normal");

        const tableData = (filteredMonHocs ?? monHocs).map((monHoc, index) => [
            index + 1,
            monHoc.tenMon || '',
            monHoc.soBuoi || '',
            monHoc.ngayBatDau ? new Date(monHoc.ngayBatDau).toLocaleDateString('vi-VN') : '',
            monHoc.ngayKetThuc ? new Date(monHoc.ngayKetThuc).toLocaleDateString('vi-VN') : '',
        ]);

        doc.autoTable({
            head: [["STT", "Tên Môn Học", "Số Buổi", "Ngày Bắt Đầu", "Ngày Kết Thúc"]],
            body: tableData,
            styles: { font: "Arial", fontSize: 10 },
            headStyles: { fontStyle: "bold", fillColor: [22, 160, 133] },
            didDrawPage: function (data) {
                doc.setFontSize(18);
                doc.text("Danh Sách Môn Học", data.settings.margin.left, 15);
            },
        });

        doc.save("DanhSachMonHoc.pdf");
    };

    const exportToExcel = () => {
        const excelData = (filteredMonHocs ?? monHocs).map((item, index) => ({
            "STT": index + 1,
            "Tên Môn Học": item.tenMon,
            "Số Buổi": item.soBuoi,
            "Ngày Bắt Đầu": item.ngayBatDau ? new Date(item.ngayBatDau).toLocaleDateString('vi-VN') : '',
            "Ngày Kết Thúc": item.ngayKetThuc ? new Date(item.ngayKetThuc).toLocaleDateString('vi-VN') : '',
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachMonHoc");
        XLSX.writeFile(wb, "DanhSachMonHoc.xlsx");
    };

    // Removed confirmDeleteMultiple, deleteMultipleMonHocs

    const menu = (
        <Menu id="create-new-dropdown-monhoc">
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addMonHoc`)}>
                Tạo mới bằng form
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={showImportModal}>
                Tạo mới bằng file
            </Menu.Item>
        </Menu>
    );

    const handleLogout = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) { Swal.fire("Lỗi", "Bạn chưa đăng nhập.", "error"); return; }
        try {
            const url = `https://localhost:8080/logout?token=${token}`;
            const response = await fetch(url, { method: "POST" });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Lỗi HTTP: ${response.status}`);
            }
            localStorage.removeItem("authToken");
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
            localStorage.removeItem('maTK');
            Swal.fire("Thành công!", "Đăng xuất thành công!", "success").then(() => {
                navigate("/login", { replace: true });
            });
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            Swal.fire("Lỗi", `Đăng xuất thất bại: ${error.message}`, "error");
        }
    };

    // --- Define Table Columns ---
    const columns = [
        {
            title: "STT",
            key: "stt",
            width: "5%",
            render: (text, record, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
        },
        {
            title: "Tên môn học",
            dataIndex: "tenMon",
            key: "tenMon",
            width: "25%",
            sorter: (a, b) => (a.tenMon || '').localeCompare(b.tenMon || ''),
        },
        {
            title: "Số buổi",
            dataIndex: "soBuoi",
            key: "soBuoi",
            width: "15%",
            sorter: (a, b) => (a.soBuoi || 0) - (b.soBuoi || 0),
        },
        {
            title: "Ngày bắt đầu",
            dataIndex: "ngayBatDau",
            key: "ngayBatDau",
            width: "20%",
            sorter: (a, b) => (a.ngayBatDau ? new Date(a.ngayBatDau).getTime() : 0) - (b.ngayBatDau ? new Date(b.ngayBatDau).getTime() : 0),
            render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : 'N/A',
        },
        {
            title: "Ngày kết thúc",
            dataIndex: "ngayKetThuc",
            key: "ngayKetThuc",
            width: "20%",
            sorter: (a, b) => (a.ngayKetThuc ? new Date(a.ngayKetThuc).getTime() : 0) - (b.ngayKetThuc ? new Date(b.ngayKetThuc).getTime() : 0),
            render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : 'N/A',
        },
    ];

    // --- Render Component ---
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
                    borderBottom: "1px solid #f0f0f0"
                }}
            >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                    Danh sách môn học
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center", gap: '10px' }}>
                    <DarkModeToggle />
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour}>Hướng dẫn</Button>
                    <Button id="logout-button-monhoc" icon={<LogoutOutlined />} type="text" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <Content className="lab-management-content" style={{ padding: "24px", margin: "0 16px" }}>
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                    <a href="/" className="flex items-center hover:text-primary">
                        <HomeOutlined className="h-4 w-4" />
                        <span className="ml-1">Trang chủ</span>
                    </a>
                </nav>

                {loadError && (
                    <Alert
                        message={`Lỗi: ${loadError.message || 'Không thể tải dữ liệu.'}`}
                        type="error"
                        showIcon
                        closable
                        onClose={() => setLoadError(null)}
                        style={{ marginBottom: '16px' }}
                    />
                )}
                {notification && (
                    <Alert
                        message={notification}
                        type="info"
                        showIcon
                        closable
                        onClose={() => setNotification(null)}
                        style={{ marginBottom: '16px' }}
                    />
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select
                            id="column-select-monhoc"
                            value={selectedColumn}
                            style={{ width: 180 }}
                            onChange={handleColumnSelect}
                        >
                            <Option value="all">Tìm trong tất cả</Option>
                            <Option value="tenMon">Tên Môn Học</Option>
                            <Option value="soBuoi">Số Buổi</Option>
                            <Option value="ngayBatDau">Ngày Bắt Đầu</Option>
                            <Option value="ngayKetThuc">Ngày Kết Thúc</Option>
                        </Select>

                        <Input
                            id="search-input-monhoc"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 240 }}
                            allowClear
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button id="export-pdf-button-monhoc" onClick={exportToPDF} type="default">
                            Xuất PDF
                        </Button>
                        <Button id="export-excel-button-monhoc" onClick={exportToExcel} type="default">
                            Xuất Excel
                        </Button>
                        <Dropdown overlay={menu} placement="bottomRight" arrow>
                            <Button
                                id="create-new-dropdown-button-monhoc"
                                type="primary"
                                icon={<PlusOutlined />}
                            >
                                Tạo mới
                            </Button>
                        </Dropdown>
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                    <Table
                        // rowSelection={rowSelection} // Removed this prop
                        columns={columns}
                        dataSource={monHocs}
                        rowKey="maMon"
                        loading={internalLoading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
                {/* Removed: {hasSelected && (...) } block for "Xóa các mục đã chọn" button */}

            </Content>
        </Layout>
    );
}

// components/Loader/monhocLoader.js (Giữ nguyên như bạn cung cấp)
export async function monhocLoader({ request }) {
    console.log("⚡️ [Loader] Running monhocLoader...");
    const token = localStorage.getItem("authToken");

    const url = new URL(request.url);
    const pathName = url.pathname;

    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    let apiUrl = '';
    let errorMessage = '';

    if (pathName.includes("/quanlimonhocbyadmin")) {
        apiUrl = `https://localhost:8080/DSMonHoc?token=${token}`;
        errorMessage = 'Lỗi: Không thể tải danh sách môn học (Admin).';
        console.log("➡️ [Loader] Mode: Admin - Fetching all subjects.");
    } else if (pathName.includes("/quanlimonhoc")) {
        const maGiaoVien = localStorage.getItem("maTK");

        if (!maGiaoVien) {
            console.error("🔒 [Loader] No maGiaoVien found for teacher-specific module.");
            return {
                error: true,
                type: 'auth',
                message: 'Không tìm thấy thông tin giáo viên. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.'
            };
        }

        const parsedMaGiaoVien = parseInt(maGiaoVien, 10);
        if (isNaN(parsedMaGiaoVien)) {
            console.error("🔒 [Loader] Invalid maGiaoVien found in localStorage.");
            return {
                error: true,
                type: 'data',
                message: 'Thông tin giáo viên không hợp lệ. Vui lòng đăng nhập lại.'
            };
        }

        apiUrl = `https://localhost:8080/DSMonHocByTaiKhoan?maTaiKhoan=${parsedMaGiaoVien}&token=${token}`;
        errorMessage = 'Lỗi: Không thể tải danh sách môn học của giáo viên.';
        console.log(`➡️ [Loader] Mode: Teacher - Fetching subjects for maGiaoVien: ${parsedMaGiaoVien}`);
    } else {
        console.warn("❓ [Loader] monhocLoader called for an unexpected path:", pathName);
        return {
            error: true,
            type: 'route',
            message: 'Đường dẫn không hợp lệ cho loader môn học.'
        };
    }

    try {
        console.log(`📞 [Loader] Fetching: ${apiUrl}`);
        const response = await fetch(apiUrl);

        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText} for ${apiUrl}`);
            let apiErrorMsg = `${errorMessage} (Mã lỗi: ${response.status}).`;
            try {
                const apiError = await response.json();
                apiErrorMsg = apiError.message || apiErrorMsg;
            } catch (e) {
                console.warn("[Loader] Could not parse error response body as JSON.", e);
            }
            return {
                error: true,
                type: 'api',
                status: response.status,
                message: apiErrorMsg
            };
        }

        if (response.status === 204) {
            console.log("✅ [Loader] Received 204 No Content. Returning empty data.");
            return { data: [] };
        }

        const data = await response.json();
        console.log("✅ [Loader] Data fetched successfully.");
        return { data: data || [] };

    } catch (error) {
        console.error("💥 [Loader] Network or other fetch error:", error);
        return {
            error: true,
            type: 'network',
            message: "Lỗi mạng hoặc không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại."
        };
    }
}