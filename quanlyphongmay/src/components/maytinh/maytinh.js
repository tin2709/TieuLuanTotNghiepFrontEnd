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
    Spin, // Added for loading state
    Alert, // Added for error display
} from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import font from "../../font/font";
import { useLoaderData, useNavigate } from "react-router-dom"; // Removed useNavigation as it wasn't used
import introJs from 'intro.js'; // Import intro.js library
import 'intro.js/introjs.css'; // Import intro.js CSS

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
        // Auto applies dark mode based on system preference or previous state
        // You might want to use localStorage to persist the user's choice
        const dm = DarkReader.auto({ brightness: 100, contrast: 90, sepia: 10 });
        // Update state if DarkReader is enabled initially
        setIsDarkMode(DarkReader.isEnabled());

        return () => {
            DarkReader.disable(); // Clean up on component unmount
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


export default function MayTinhManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    // State now holds MayTinhDTO objects
    const [mayTinhs, setMayTinhs] = useState([]);
    const [filteredMayTinhs, setFilteredMayTinhs] = useState(null); // Keep this logic if needed for client-side filtering
    const [selectedColumn, setSelectedColumn] = useState('all'); // Default to all columns
    // State now holds MayTinhDTO objects
    const [initialMayTinhs, setInitialMayTinhs] = useState([]);
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    // const [importLoading, setImportLoading] = useState(false); // If using import feature
    const [loadError, setLoadError] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false); // Loading state for table/search
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0 // Initialize total count
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);
    const [notification, setNotification] = useState(null); // For SSE messages

    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            { element: '#search-input-maytinh', intro: 'Nhập tên máy tính hoặc thông tin liên quan để tìm kiếm.', position: 'bottom-start' },
            { element: '#column-select-maytinh', intro: 'Chọn cột bạn muốn tìm kiếm (Tên máy tính, Trạng thái, Mô tả, Tên Phòng).', position: 'bottom-start' }, // Updated intro text
            { element: '#status-select-maytinh', intro: 'Lọc danh sách máy tính theo trạng thái hoạt động.', position: 'bottom-start' },
            { element: '#export-pdf-button-maytinh', intro: 'Xuất danh sách máy tính ra file PDF.', position: 'bottom-start' },
            { element: '#export-excel-button-maytinh', intro: 'Xuất danh sách máy tính ra file Excel.', position: 'bottom-start' },
            { element: '#create-new-dropdown-maytinh', intro: 'Tạo máy tính mới bằng form hoặc import từ file.', position: 'bottom-start' },
            { element: '.ant-table-thead > tr > th:nth-child(3)', intro: 'Click vào đây để sắp xếp danh sách máy tính theo tên.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(6)', intro: 'Click vào đây để sắp xếp danh sách máy tính theo trạng thái.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(7)', intro: 'Click vào đây để sắp xếp danh sách máy tính theo tên phòng.', position: 'bottom' }, // Added step for Room sorting
            { element: '.ant-table-thead > tr > th:last-child', intro: 'Tại cột này, bạn có thể chỉnh sửa, xóa máy tính hoặc gửi tin nhắn.', position: 'left' },
            { element: '#delete-selected-button-maytinh', intro: 'Xóa các máy tính đã được chọn (tick vào checkbox).', position: 'top-end' },
            { element: '#logout-button-maytinh', intro: 'Đăng xuất khỏi ứng dụng quản lý máy tính.', position: 'bottom-end' },
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
        console.log("[Component MayTinh] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            console.error("Loader Error Handled in Component MayTinh:", loaderResult);
            setLoadError(loaderResult);
            setMayTinhs([]); // Clear data on error
            setInitialMayTinhs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));

            if (loaderResult.type === 'auth') {
                // Handle auth error (redirect handled by loader now, maybe show message)
                Swal.fire("Lỗi Xác thực", loaderResult.message || "Phiên đăng nhập hết hạn.", "error");
            } else {
                // Handle other types of load errors
                Swal.fire("Lỗi Tải Dữ Liệu", loaderResult.message || "Không thể tải danh sách máy tính.", "error");
            }
        } else if (loaderResult?.data) {
            // Data is now List<MayTinhDTO>
            const data = loaderResult.data || [];
            console.log("[Component MayTinh] Setting initial DTO data:", data);
            setInitialMayTinhs(data); // Store the full list of DTOs
            // Apply initial pagination - No need to slice here, Table handles it
            setMayTinhs(data); // Set the full data, Table component will paginate
            setLoadError(null);
            setPagination(prev => ({ ...prev, current: 1, total: data.length })); // Update total count
            // setFilteredMayTinhs(null); // Reset filter state if needed
        } else {
            console.warn("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
            setMayTinhs([]);
            setInitialMayTinhs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
    }, [loaderResult]); // Removed navigate dependency here

    useEffect(() => {
        // SSE Effect remains the same...
        const eventSource = new EventSource("https://localhost:8080/subscribe"); // Use your actual backend URL
        eventSource.onopen = () => console.log("SSE connection opened for MayTinh");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                setNotification(messageText);

                // Reload if the message indicates a relevant change
                if ((messageText.toLowerCase().includes("xóa") || messageText.toLowerCase().includes("thêm") || messageText.toLowerCase().includes("cập nhật"))
                    && messageText.toLowerCase().includes("máy tính")) {
                    console.log("SSE indicates MayTinh change, preparing reload...");
                    Swal.fire({
                        title: "Thông báo",
                        text: "Dữ liệu máy tính đã được cập nhật. Danh sách sẽ được tải lại.",
                        icon: "info",
                        timer: 2500, // Shorter timer maybe
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

    // Botpress useEffect remains the same...
    useEffect(() => {
        const script1 = document.createElement("script");
        script1.src = "https://cdn.botpress.cloud/webchat/v2.2/inject.js";
        script1.async = true;
        document.body.appendChild(script1);

        const script2 = document.createElement("script");
        script2.src = "https://files.bpcontent.cloud/2025/03/03/16/20250303163810-YF2W2K0X.js"; // Check if this URL is still valid/needed
        script2.async = true;
        document.body.appendChild(script2);

        return () => {
            document.body.removeChild(script1);
            if (document.body.contains(script2)) { // Check if script2 exists before removing
                document.body.removeChild(script2);
            }
        };
    }, []);

    // --- Handlers ---

    const showImportModal = () => setIsModalVisible(true);
    const hideImportModal = () => setIsModalVisible(false);
    const handleImport = async (file) => { console.log("File imported:", file); /* Implement import logic */};

    const handleDelete = (record) => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa?",
            text: `Máy tính: ${record.tenMay} (Phòng: ${record.tenPhong || 'N/A'})`, // Use DTO fields
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMayTinh(record.maMay);
            }
        });
    };

    const deleteMayTinh = async (maMay) => {
        // Delete logic remains mostly the same, adjust URL if needed
        const token = localStorage.getItem("authToken");
        if (!token) { Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error"); return; }
        setInternalLoading(true); // Indicate loading during delete
        try {
            const url = `https://localhost:8080/api/maytinh/XoaMayTinh?maMay=${maMay}&token=${token}`; // Use correct API path
            const response = await fetch(url, { method: "DELETE" });
            if (!response.ok) { throw new Error(`Lỗi HTTP: ${response.status}`); }
            // No need to reload via navigate(0) if SSE handles it
            // Swal.fire("Đã xóa!", "Máy tính đã được xóa thành công.", "success");
            // Optionally remove from local state immediately for faster UI update
            // setInitialMayTinhs(prev => prev.filter(m => m.maMay !== maMay));
            // setMayTinhs(prev => prev.filter(m => m.maMay !== maMay));
        } catch (error) {
            console.error("Lỗi xóa máy tính:", error);
            Swal.fire("Lỗi", `Có lỗi xảy ra khi xóa máy tính: ${error.message}`, "error");
        } finally {
            setInternalLoading(false);
        }
    };

    // Client-side sorting function (for when Table's sorter is used)
    const sortData = (data, sortKey, sortOrder) => {
        // ... (sortData function remains the same, it works on the DTO properties) ...
        if (!sortKey || !sortOrder) return data;

        const sortedData = [...data].sort((a, b) => {
            // Handle potential null or undefined values gracefully
            const valueA = a[sortKey] ?? (typeof a[sortKey] === 'number' ? 0 : '');
            const valueB = b[sortKey] ?? (typeof b[sortKey] === 'number' ? 0 : '');

            if (sortKey === 'ngayLapDat' || sortKey === 'ngayCapNhat') {
                // Date comparison
                const dateA = valueA ? new Date(valueA).getTime() : 0;
                const dateB = valueB ? new Date(valueB).getTime() : 0;
                return sortOrder === "ascend" ? dateA - dateB : dateB - dateA;
            } else if (typeof valueA === "string" && typeof valueB === "string") {
                // String comparison
                return sortOrder === "ascend"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } else if (typeof valueA === "number" && typeof valueB === "number") {
                // Number comparison
                return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
            } else {
                // Fallback for mixed types or other types
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
        let filteredData = initialMayTinhs; // Start with the full initial list

        if (searchValue && searchColumn !== 'all') {
            filteredData = initialMayTinhs.filter(item => {
                const itemValue = item[searchColumn];
                // Handle cases where the value might be null or not a string
                return itemValue != null &&
                    typeof itemValue === 'string' &&
                    itemValue.toLowerCase().includes(searchValue.toLowerCase());
            });
        } else if (searchValue && searchColumn === 'all') {
            // Search across multiple relevant columns if 'all' is selected
            filteredData = initialMayTinhs.filter(item =>
                Object.values(item).some(val =>
                    val != null && typeof val === 'string' && val.toLowerCase().includes(searchValue.toLowerCase())
                )
            );
        }
        // Apply sorting after filtering
        filteredData = sortData(filteredData, sortInfo.field, sortInfo.order);
        setFilteredMayTinhs(filteredData); // Store filtered result if needed separately
        // Update displayed data (Table component will handle pagination)
        setMayTinhs(filteredData);
        setPagination(prev => ({ ...prev, current: 1, total: filteredData.length })); // Reset to page 1, update total
        setInternalLoading(false);
    };


    const handleSearch = (value) => {
        setSearch(value);
        performClientSearch(value, selectedColumn); // Use client-side search
    };

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
        performClientSearch(search, column); // Use client-side search
    };

    const handleStatusFilter = (value) => {
        setInternalLoading(true);
        let filteredData;
        if (value === "all") {
            filteredData = initialMayTinhs;
        } else {
            filteredData = initialMayTinhs.filter(item => item.trangThai === value);
        }
        // Apply search and sorting on top of status filter
        if (search && selectedColumn !== 'all') {
            filteredData = filteredData.filter(item => {
                const itemValue = item[selectedColumn];
                return itemValue != null && typeof itemValue === 'string' && itemValue.toLowerCase().includes(search.toLowerCase());
            });
        } else if (search && selectedColumn === 'all') {
            filteredData = filteredData.filter(item =>
                Object.values(item).some(val =>
                    val != null && typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
                )
            );
        }
        filteredData = sortData(filteredData, sortInfo.field, sortInfo.order);
        setMayTinhs(filteredData);
        setPagination(prev => ({ ...prev, current: 1, total: filteredData.length }));
        setInternalLoading(false);
    };


    // Update to handle client-side sorting if backend doesn't support it directly
    const handleTableChange = (newPagination, filters, sorter) => {
        const { current, pageSize } = newPagination;
        let currentData = filteredMayTinhs ?? initialMayTinhs; // Use filtered data if available, otherwise initial
        let sortField = sortInfo.field;
        let sortOrder = sortInfo.order;

        if (sorter && sorter.field !== sortInfo.field || sorter.order !== sortInfo.order) {
            sortField = sorter.field;
            sortOrder = sorter.order;
            setSortInfo({ field: sortField, order: sortOrder });
            currentData = sortData(currentData, sortField, sortOrder); // Sort the current dataset
            setMayTinhs(currentData); // Update the displayed data
        }

        // Update pagination state - Table handles actual display slicing
        setPagination({ ...pagination, current, pageSize });
    };

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
        setHasSelected(newSelectedRowKeys.length > 0);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    };

    // No need for startIndex calculation if Table handles pagination internally

    // --- Export Functions ---
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.addFileToVFS("Arial.ttf", font); // Ensure font is loaded correctly
        doc.setFont("Arial", "normal"); // Set font to normal

        const tableData = (filteredMayTinhs ?? mayTinhs).map((mayTinh, index) => [ // Use filtered or current data
            index + 1,
            mayTinh.tenMay || '',         // Use DTO fields, provide fallback for null
            mayTinh.trangThai || '',
            mayTinh.moTa || '',
            mayTinh.ngayLapDat ? new Date(mayTinh.ngayLapDat).toLocaleDateString() : '', // Format date
            mayTinh.tenPhong || ''          // Use DTO field tenPhong directly
        ]);

        doc.autoTable({
            head: [["STT", "Tên Máy Tính", "Trạng Thái", "Mô Tả", "Ngày Lắp Đặt", "Phòng"]],
            body: tableData,
            styles: { font: "Arial", fontSize: 10 }, // Apply font style
            headStyles: { fontStyle: "bold", fillColor: [22, 160, 133] }, // Example header style
            didDrawPage: function (data) {
                // Optional: Add header/footer
                doc.setFontSize(18);
                doc.text("Danh Sách Máy Tính", data.settings.margin.left, 15);
            },
        });

        doc.save("DanhSachMayTinh.pdf");
    };


    const exportToExcel = () => {
        // Map data to ensure correct headers and format if needed
        const excelData = (filteredMayTinhs ?? mayTinhs).map((item, index) => ({
            "STT": index + 1,
            "Tên Máy Tính": item.tenMay,
            "Trạng Thái": item.trangThai,
            "Mô Tả": item.moTa,
            "Ngày Lắp Đặt": item.ngayLapDat ? new Date(item.ngayLapDat).toLocaleDateString() : '', // Format date
            "Phòng": item.tenPhong, // Use DTO field
            // Add 'Ngày Cập Nhật' if needed: new Date(item.ngayCapNhat).toLocaleDateString()
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachMayTinh");
        XLSX.writeFile(wb, "DanhSachMayTinh.xlsx");
    };

    const confirmDeleteMultiple = () => {
        // Confirmation logic remains the same
        Swal.fire({
            title: `Xóa ${selectedRowKeys.length} máy tính?`,
            text: "Hành động này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        }).then((result) => {
            if (result.isConfirmed) {
                deleteMultipleMayTinhs();
            }
        });
    };

    const deleteMultipleMayTinhs = async () => {
        // Delete multiple logic remains mostly the same, adjust URL if needed
        const token = localStorage.getItem("authToken");
        if (!token) { Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error"); return; }
        setInternalLoading(true);
        try {
            const maMayListString = selectedRowKeys.join(",");
            const url = `https://localhost:8080/api/maytinh/XoaNhieuMayTinh?maMayTinhList=${maMayListString}&token=${token}`; // Use correct API path

            const response = await fetch(url, { method: "DELETE" });
            if (!response.ok) { throw new Error(`Lỗi HTTP: ${response.status}`); }

            // Swal.fire("Đã xóa!", "Các máy tính đã chọn đã được xóa.", "success");
            setSelectedRowKeys([]); // Clear selection
            setHasSelected(false);
            // Reload data or wait for SSE to trigger reload
            // navigate(0); // Or remove items from local state

        } catch (error) {
            console.error("Lỗi xóa nhiều máy tính:", error);
            Swal.fire("Lỗi", `Có lỗi xảy ra khi xóa máy tính: ${error.message}`, "error");
        } finally {
            setInternalLoading(false);
        }
    };


    const menu = (
        <Menu id="create-new-dropdown-maytinh"> {/* Keep ID for intro.js */}
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addMayTinh`)}>
                Tạo mới bằng form
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={showImportModal}>
                Tạo mới bằng file
            </Menu.Item>
        </Menu>
    );

    const handleLogout = async () => {
        // Logout logic remains the same
        const token = localStorage.getItem("authToken");
        if (!token) { Swal.fire("Lỗi", "Bạn chưa đăng nhập.", "error"); return; }
        try {
            const url = `https://localhost:8080/logout?token=${token}`; // Check API path
            const response = await fetch(url, { method: "POST" });
            if (!response.ok) {
                const errorText = await response.text(); // Try to get error text
                throw new Error(errorText || `Lỗi HTTP: ${response.status}`);
            }
            localStorage.removeItem("authToken");
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
            Swal.fire("Thành công!", "Đăng xuất thành công!", "success").then(() => {
                navigate("/login", { replace: true }); // Use replace to prevent going back
            });
        } catch (error) {
            console.error("Lỗi đăng xuất:", error);
            Swal.fire("Lỗi", `Đăng xuất thất bại: ${error.message}`, "error");
        }
    };

    // --- Define Table Columns ---
    const columns = [
        // Checkbox column removed as rowSelection prop handles it
        {
            title: "STT",
            key: "stt",
            width: "5%",
            render: (text, record, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1, // Correct STT based on pagination
        },
        {
            title: "Tên máy tính",
            dataIndex: "tenMay",
            key: "tenMay", // Add key for sorter/filter
            width: "15%", // Adjust width as needed
            sorter: (a, b) => (a.tenMay || '').localeCompare(b.tenMay || ''),
        },
        {
            title: "Mô tả",
            dataIndex: "moTa",
            key: "moTa",
            width: "20%",
            sorter: (a, b) => (a.moTa || '').localeCompare(b.moTa || ''),
        },
        {
            title: "Ngày lắp đặt",
            dataIndex: "ngayLapDat", // Correct dataIndex for DTO
            key: "ngayLapDat",
            width: "15%",
            sorter: (a, b) => (a.ngayLapDat ? new Date(a.ngayLapDat).getTime() : 0) - (b.ngayLapDat ? new Date(b.ngayLapDat).getTime() : 0),
            render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : 'N/A', // Format date display
        },
        {
            title: "Trạng thái",
            dataIndex: "trangThai",
            key: "trangThai",
            width: "15%",
            sorter: (a, b) => (a.trangThai || '').localeCompare(b.trangThai || ''),
        },
        {
            title: "Phòng",
            dataIndex: "tenPhong", // *** CHANGED: Use the direct tenPhong field from DTO ***
            key: "tenPhong", // Add key
            width: "15%",
            sorter: (a, b) => (a.tenPhong || '').localeCompare(b.tenPhong || ''), // Sort by tenPhong directly
        },
        {
            title: "Hành động",
            key: "action", // Add key
            render: (text, record) => ( // record is now MayTinhDTO
                <div className="flex justify-center gap-2">
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        type="link"
                        onClick={() => navigate(`/editMayTinh/${record.maMay}`)} // Use maMay from DTO
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        type="link"
                        danger // Make delete button red
                        onClick={() => handleDelete(record)} // Pass the DTO record
                    />
                    <Button
                        icon={<MessageOutlined />}
                        size="small"
                        type="link"
                        onClick={() =>
                            Swal.fire("Thông báo", `Gửi tin nhắn đến máy ${record.tenMay}?`, "question") // Use tenMay from DTO
                        }
                    />
                </div>
            ),
        },
    ];

    // --- Render Component ---
    return (
        <Layout className="lab-management-layout">
            <Header /* Header remains the same */
                className="lab-management-header"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#fff", // Example background
                    padding: "0 24px",
                    borderBottom: "1px solid #f0f0f0" // Example border
                }}
            >
                <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}> {/* Removed color #000 for theme compatibility */}
                    Danh sách máy tính
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center", gap: '10px' }}> {/* Added gap */}
                    <DarkModeToggle />
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour}>Hướng dẫn</Button>
                    <Button id="logout-button-maytinh" icon={<LogoutOutlined />} type="text" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <Content className="lab-management-content" style={{ padding: "24px", margin: "0 16px" }}> {/* Added margin */}
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4"> {/* Adjusted margin */}
                    <a href="/" className="flex items-center hover:text-primary">
                        <HomeOutlined className="h-4 w-4" />
                        <span className="ml-1">Trang chủ</span>
                    </a>
                    {/* Add breadcrumbs if needed */}
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

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4"> {/* Adjusted margin, wrap items */}
                    <div className="flex flex-wrap items-center gap-4"> {/* Wrap filters */}
                        {/* Status Select */}
                        <Select
                            id="status-select-maytinh"
                            defaultValue="all"
                            style={{ width: 180 }}
                            onChange={handleStatusFilter} // Changed handler
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="Đang hoạt động">Đang hoạt động</Option>
                            <Option value="Đã hỏng">Đã hỏng</Option>
                            <Option value="Không hoạt động">Không hoạt động</Option>
                            {/* Add other relevant statuses */}
                        </Select>

                        {/* Column Select */}
                        <Select
                            id="column-select-maytinh"
                            value={selectedColumn} // Control the selected value
                            style={{ width: 180 }}
                            onChange={handleColumnSelect}
                        >
                            <Option value="all">Tìm trong tất cả</Option>
                            <Option value="tenMay">Tên Máy Tính</Option>
                            <Option value="trangThai">Trạng Thái</Option>
                            <Option value="moTa">Mô Tả</Option>
                            <Option value="tenPhong">Phòng</Option> {/* Added option to search by Room Name */}
                        </Select>

                        {/* Search Input */}
                        <Input
                            id="search-input-maytinh"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 240 }} // Increased width slightly
                            allowClear // Allow clearing search
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2"> {/* Wrap buttons */}
                        <Button id="export-pdf-button-maytinh" onClick={exportToPDF} type="default"> {/* Default style */}
                            Xuất PDF
                        </Button>
                        <Button id="export-excel-button-maytinh" onClick={exportToExcel} type="default"> {/* Default style */}
                            Xuất Excel
                        </Button>
                        <Dropdown overlay={menu} placement="bottomRight" arrow>
                            <Button
                                id="create-new-dropdown-button-maytinh"
                                type="primary"
                                icon={<PlusOutlined />}
                            >
                                Tạo mới
                            </Button>
                        </Dropdown>
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto"> {/* Added overflow */}
                    <Table
                        rowSelection={rowSelection} // Use the defined rowSelection object
                        columns={columns}
                        dataSource={mayTinhs} // Use the state holding DTOs
                        rowKey="maMay" // Use the unique key from DTO
                        loading={internalLoading} // Show loading indicator
                        pagination={pagination} // Pass pagination state
                        onChange={handleTableChange} // Handle table changes (pagination, sorting)
                        scroll={{ x: 'max-content' }} // Allow horizontal scroll on small screens
                    />
                </div>
                {hasSelected && (
                    <Button
                        id="delete-selected-button-maytinh"
                        type="primary"
                        danger
                        onClick={confirmDeleteMultiple}
                        className="mt-4" // Margin top
                        disabled={internalLoading || selectedRowKeys.length === 0} // Disable if loading or no selection
                        style={{ float: 'right' }} // Align button
                    >
                        Xóa ({selectedRowKeys.length}) mục đã chọn
                    </Button>
                )}

            </Content>
            {/* Modal for import if needed */}
            {/* <Modal title="Import File" visible={isModalVisible} onCancel={hideImportModal} footer={null}> ... </Modal> */}
        </Layout>
    );
}