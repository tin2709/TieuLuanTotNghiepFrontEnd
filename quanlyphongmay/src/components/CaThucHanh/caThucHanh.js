import React, { useState, useEffect, useCallback } from "react"; // Added useCallback
import {
    HomeOutlined,
    PlusOutlined,
    LogoutOutlined,
    QuestionCircleOutlined,
    SunOutlined,
    MoonOutlined
} from "@ant-design/icons";
import {
    Button,
    Input,
    Select,
    Table,
    Dropdown,
    Menu,
    Layout,
    Spin, // Added Spin (though your original code already has it, just ensuring it's here)
    Alert,
} from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import font from "../../font/font"; // Assuming this path is correct
import { useLoaderData, useNavigate } from "react-router-dom";
import introJs from 'intro.js';
import 'intro.js/introjs.css';

const { Option } = Select;
const { Header, Content } = Layout;

// DarkModeToggle component (remains the same)
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
        setIsDarkMode(DarkReader.isEnabled());
        return () => {
            // Consider if you really want to disable DarkReader on unmount
            // DarkReader.disable();
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


export default function CaThucHanhManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    const [caThucHanhs, setCaThucHanhs] = useState([]);
    const [filteredCaThucHanhs, setFilteredCaThucHanhs] = useState(null); // Used to store filtered data *before* sorting/pagination
    const [selectedColumn, setSelectedColumn] = useState('all');
    const [initialCaThucHanhs, setInitialCaThucHanhs] = useState([]); // Original, unfiltered data from loader
    const navigate = useNavigate();
    const [isModalVisible, setIsModalVisible] = useState(false); // Remains for potential import
    const [loadError, setLoadError] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false); // For client-side operations
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [sortInfo, setSortInfo] = useState({});
    const [notification, setNotification] = useState(null);

    // Helper function to get nested value safely
    const getNestedValue = useCallback((obj, path) => {
        if (!obj || !path) return undefined;
        // If path is a string like "parent.child", split it.
        // If path is already an array, use it directly.
        const pathParts = Array.isArray(path) ? path : path.split('.');
        return pathParts.reduce((current, part) => (current && current[part] !== undefined ? current[part] : undefined), obj);
    }, []);


    // --- Intro.js Tour ---
    const startIntroTour = useCallback(() => { // Wrap with useCallback
        const steps = [
            { element: '#search-input-cathuchanh', intro: 'Nhập ngày thực hành, tên ca, tiết bắt đầu, tiết kết thúc hoặc buổi số để tìm kiếm.', position: 'bottom-start' },
            { element: '#column-select-cathuchanh', intro: 'Chọn cột bạn muốn tìm kiếm (Ngày thực hành, Tên ca, Tiết bắt đầu, Tiết kết thúc, Buổi số, Tên Môn Học, Tên Phòng Máy).', position: 'bottom-start' },
            { element: '#export-pdf-button-cathuchanh', intro: 'Xuất danh sách ca thực hành ra file PDF.', position: 'bottom-start' },
            { element: '#export-excel-button-cathuchanh', intro: 'Xuất danh sách ca thực hành ra file Excel.', position: 'bottom-start' },
            { element: '#create-new-dropdown-cathuchanh', intro: 'Tạo ca thực hành mới bằng form hoặc import từ file (nếu có tính năng).', position: 'bottom-start' },
            { element: '.ant-table-thead > tr > th:nth-child(2)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Ngày thực hành.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(3)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Tên ca.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(4)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Tiết bắt đầu.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(5)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Tiết kết thúc.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(6)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Buổi số.', position: 'bottom' },
            // NEW INTRO STEPS FOR NEW COLUMNS
            { element: '.ant-table-thead > tr > th:nth-child(7)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Tên Môn Học.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(8)', intro: 'Click vào đây để sắp xếp danh sách ca thực hành theo Tên Phòng Máy.', position: 'bottom' },
            { element: '#logout-button-cathuchanh', intro: 'Đăng xuất khỏi ứng dụng quản lý ca thực hành.', position: 'bottom-end' },
        ];

        introJs().setOptions({
            steps: steps,
            nextLabel: 'Tiếp theo',
            prevLabel: 'Quay lại',
            doneLabel: 'Hoàn tất',
            scrollTo: 'element',
            overlayOpacity: 0.5,
        }).start();
    }, []); // Empty dependency array means this function is created once


    // Client-side sorting function
    const sortData = useCallback((data, sortKey, sortOrder) => {
        if (!sortKey || !sortOrder) return data;

        const sortedData = [...data].sort((a, b) => {
            const valueA = getNestedValue(a, sortKey);
            const valueB = getNestedValue(b, sortKey);

            // Handle null/undefined values for comparison consistently
            const comparableA = valueA === null || valueA === undefined ? '' : valueA;
            const comparableB = valueB === null || valueB === undefined ? '' : valueB;

            // Handle date sorting for 'ngayThucHanh'
            if (sortKey === 'ngayThucHanh') {
                const dateA = comparableA ? new Date(comparableA).getTime() : 0;
                const dateB = comparableB ? new Date(comparableB).getTime() : 0;
                return sortOrder === "ascend" ? dateA - dateB : dateB - dateA;
            }
            // Handle number sorting for 'tietBatDau', 'tietKetThuc', 'buoiSo'
            else if (typeof comparableA === "number" && typeof comparableB === "number") {
                return sortOrder === "ascend" ? comparableA - comparableB : comparableB - comparableA;
            }
            // Default to string comparison for all other fields (including new ones)
            else {
                const stringA = String(comparableA);
                const stringB = String(comparableB);
                return sortOrder === "ascend"
                    ? stringA.localeCompare(stringB)
                    : stringB.localeCompare(stringA);
            }
        });
        return sortedData;
    }, [getNestedValue]);


    // Client-side search/filter function
    const performClientSearch = useCallback((searchValue, searchColumn, currentData = initialCaThucHanhs) => {
        setInternalLoading(true);
        let filteredData = currentData;

        if (searchValue) {
            const lowerSearchValue = searchValue.toLowerCase();
            filteredData = currentData.filter(item => {
                if (searchColumn === 'all') {
                    return (item.tenCa != null && typeof item.tenCa === 'string' && item.tenCa.toLowerCase().includes(lowerSearchValue)) ||
                        (item.ngayThucHanh != null && String(new Date(item.ngayThucHanh).toLocaleDateString('vi-VN')).includes(lowerSearchValue)) ||
                        (item.tietBatDau != null && String(item.tietBatDau).includes(lowerSearchValue)) ||
                        (item.tietKetThuc != null && String(item.tietKetThuc).includes(lowerSearchValue)) ||
                        (item.buoiSo != null && String(item.buoiSo).includes(lowerSearchValue)) ||
                        // NEW SEARCH FIELDS
                        (item.monHoc?.tenMon != null && typeof item.monHoc.tenMon === 'string' && item.monHoc.tenMon.toLowerCase().includes(lowerSearchValue)) ||
                        (item.phongMay?.tenPhong != null && typeof item.phongMay.tenPhong === 'string' && item.phongMay.tenPhong.toLowerCase().includes(lowerSearchValue));
                } else {
                    let itemValue;
                    // Handle specific nested columns
                    if (searchColumn === 'tenMon') {
                        itemValue = item.monHoc?.tenMon;
                    } else if (searchColumn === 'tenPhong') {
                        itemValue = item.phongMay?.tenPhong;
                    } else {
                        // For non-nested columns, access directly
                        itemValue = item[searchColumn];
                    }

                    if (itemValue == null) return false;

                    if (typeof itemValue === 'string') {
                        if (searchColumn === 'ngayThucHanh') {
                            const formattedDate = new Date(itemValue).toLocaleDateString('vi-VN');
                            return formattedDate.includes(lowerSearchValue);
                        }
                        return itemValue.toLowerCase().includes(lowerSearchValue);
                    } else if (typeof itemValue === 'number') {
                        return String(itemValue).includes(lowerSearchValue);
                    }
                    return false;
                }
            });
        }
        // Apply sorting to the filtered data
        const sortedFilteredData = sortData(filteredData, sortInfo.field, sortInfo.order);
        setFilteredCaThucHanhs(sortedFilteredData); // Store the current filtered and sorted list
        setCaThucHanhs(sortedFilteredData); // Update table data source
        setPagination(prev => ({ ...prev, current: 1, total: sortedFilteredData.length }));
        setInternalLoading(false);
    }, [initialCaThucHanhs, sortInfo.field, sortInfo.order, sortData]);


    // --- Effects ---
    useEffect(() => {
        console.log("[Component CaThucHanh] Loader Result Received:", loaderResult);
        if (loaderResult?.error) {
            console.error("Loader Error Handled in Component CaThucHanh:", loaderResult);
            setLoadError(loaderResult);
            setCaThucHanhs([]); // Clear data on error
            setInitialCaThucHanhs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));

            if (loaderResult.type === 'auth') {
                Swal.fire("Lỗi Xác thực", loaderResult.message || "Phiên đăng nhập hết hạn.", "error").then(() => {
                    navigate("/login", { replace: true });
                });
            } else {
                Swal.fire("Lỗi Tải Dữ Liệu", loaderResult.message || "Không thể tải danh sách ca thực hành.", "error");
            }
        } else if (loaderResult?.data) {
            const data = loaderResult.data || [];
            console.log("[Component CaThucHanh] Setting initial DTO data:", data);
            if (data.length > 0) {
                console.log("[Component CaThucHanh] First DTO item:", data[0]);
            }
            setInitialCaThucHanhs(data);
            setFilteredCaThucHanhs(data); // Also initialize filtered data
            setCaThucHanhs(data);
            setLoadError(null);
            setPagination(prev => ({ ...prev, current: 1, total: data.length }));
        } else {
            console.warn("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
            setCaThucHanhs([]);
            setInitialCaThucHanhs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
    }, [loaderResult, navigate]);

    useEffect(() => {
        // After initial data is set, apply initial search/sort
        if (initialCaThucHanhs.length > 0 || search || selectedColumn !== 'all') {
            performClientSearch(search, selectedColumn, initialCaThucHanhs);
        }
    }, [initialCaThucHanhs, performClientSearch, search, selectedColumn]);


    useEffect(() => {
        const eventSource = new EventSource("https://localhost:8080/subscribe");
        eventSource.onopen = () => console.log("SSE connection opened for CaThucHanh");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                setNotification(messageText);

                if ((messageText.toLowerCase().includes("xóa") || messageText.toLowerCase().includes("thêm") || messageText.toLowerCase().includes("cập nhật"))
                    && messageText.toLowerCase().includes("ca thực hành")) {
                    console.log("SSE indicates CaThucHanh change, preparing reload...");
                    Swal.fire({
                        title: "Thông báo",
                        text: "Dữ liệu ca thực hành đã được cập nhật. Danh sách sẽ được tải lại.",
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
            // Check if script2 exists in body before trying to remove,
            // as it might be removed by browser or not fully loaded
            const existingScript2 = document.querySelector(`script[src="https://files.bpcontent.cloud/2025/03/03/16/20250303163810-YF2W2K0X.js"]`);
            if (existingScript2) {
                document.body.removeChild(existingScript2);
            }
        };
    }, []);

    // --- Handlers ---
    const showImportModal = () => setIsModalVisible(true);
    const hideImportModal = () => setIsModalVisible(false);
    const handleImport = async (file) => { console.log("File imported:", file); /* Implement import logic for CaThucHanh */ };


    const handleSearch = (value) => {
        setSearch(value);
        performClientSearch(value, selectedColumn);
    };

    const handleColumnSelect = (column) => {
        setSelectedColumn(column);
        performClientSearch(search, column);
    };

    const handleTableChange = (newPagination, filters, sorter, extra) => {
        const { current, pageSize } = newPagination;
        let sortedCurrentData = filteredCaThucHanhs ?? initialCaThucHanhs; // Start with the currently filtered (or all) data

        // Check if sorter is an array or object, and extract field/order correctly
        let currentSortField = sortInfo.field;
        let currentSortOrder = sortInfo.order;

        if (Array.isArray(sorter)) { // Handles multiple sorters (Ant Design default)
            // For simplicity, take the first sorter if multiple are active
            if (sorter.length > 0) {
                currentSortField = sorter[0].field;
                currentSortOrder = sorter[0].order;
            } else {
                currentSortField = null;
                currentSortOrder = null;
            }
        } else if (sorter.field && sorter.order) { // Single sorter
            currentSortField = sorter.field;
            currentSortOrder = sorter.order;
        } else if (!sorter.order && sortInfo.field) { // Clear sort
            currentSortField = null;
            currentSortOrder = null;
        }

        if (currentSortField && currentSortOrder) {
            sortedCurrentData = sortData(sortedCurrentData, currentSortField, currentSortOrder);
            setSortInfo({ field: currentSortField, order: currentSortOrder });
        } else if (!currentSortField && sortInfo.field) {
            // If sort is cleared, revert to the state *before* sorting was applied to filtered data
            setSortInfo({});
            sortedCurrentData = filteredCaThucHanhs ?? initialCaThucHanhs; // Revert to unsorted filtered data
        }

        setCaThucHanhs(sortedCurrentData); // Update the data source for the table
        setPagination({ ...pagination, current, pageSize });
    };

    // --- Export Functions ---
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.addFileToVFS("Arial.ttf", font); // Make sure font is correctly imported and available
        doc.setFont("Arial", "normal");

        const dataToExport = filteredCaThucHanhs ?? caThucHanhs; // Export filtered/displayed data

        const tableData = dataToExport.map((ca, index) => [
            index + 1,
            ca.ngayThucHanh ? new Date(ca.ngayThucHanh).toLocaleDateString('vi-VN') : 'N/A',
            ca.tenCa || 'N/A',
            ca.tietBatDau || 'N/A',
            ca.tietKetThuc || 'N/A',
            ca.buoiSo || 'N/A',
            ca.monHoc?.tenMon || 'N/A', // NEW
            ca.phongMay?.tenPhong || 'N/A' // NEW
        ]);

        doc.autoTable({
            head: [["STT", "Ngày Thực Hành", "Tên Ca", "Tiết Bắt Đầu", "Tiết Kết Thúc", "Buổi Số", "Tên Môn Học", "Tên Phòng Máy"]], // NEW HEADER
            body: tableData,
            styles: { font: "Arial", fontSize: 10 },
            headStyles: { fontStyle: "bold", fillColor: [22, 160, 133] },
            didDrawPage: function (data) {
                doc.setFontSize(18);
                doc.text("Danh Sách Ca Thực Hành", data.settings.margin.left, 15);
            },
        });

        doc.save("DanhSachCaThucHanh.pdf");
    };

    const exportToExcel = () => {
        const dataToExport = filteredCaThucHanhs ?? caThucHanhs; // Export filtered/displayed data

        const excelData = dataToExport.map((item, index) => ({
            "STT": index + 1,
            "Ngày Thực Hành": item.ngayThucHanh ? new Date(item.ngayThucHanh).toLocaleDateString('vi-VN') : 'N/A',
            "Tên Ca": item.tenCa || 'N/A',
            "Tiết Bắt Đầu": item.tietBatDau || 'N/A',
            "Tiết Kết Thúc": item.tietKetThuc || 'N/A',
            "Buổi Số": item.buoiSo || 'N/A',
            "Tên Môn Học": item.monHoc?.tenMon || 'N/A', // NEW
            "Tên Phòng Máy": item.phongMay?.tenPhong || 'N/A', // NEW
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachCaThucHanh");
        XLSX.writeFile(wb, "DanhSachCaThucHanh.xlsx");
    };

    // const menu = (
    //     <Menu id="create-new-dropdown-cathuchanh">
    //         <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addCaThucHanh`)}>
    //             Tạo mới bằng form
    //         </Menu.Item>
    //     </Menu>
    // );

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

    // Define the menu for the Home dropdown
    const homeDropdownMenu = (
        <Menu>
            <Menu.Item key="home" onClick={() => navigate('/')}>
                Trang chủ
            </Menu.Item>
            <Menu.Item key="quanliphongmay" onClick={() => navigate('/phongmay')}>
                Quản lí phòng máy
            </Menu.Item>
            <Menu.Item key="quanlicathuchanh" onClick={() => navigate('/cathuchanh')}>
                Quản lí ca thực hành
            </Menu.Item>
            <Menu.Item key="quanlimonhoc" onClick={() => navigate('/quanlimonhoc')}>
                Quản lí môn học
            </Menu.Item>
            <Menu.Item key="quanligiaovien" onClick={() => navigate('/giaovien')}>
                Quản lí giáo viên
            </Menu.Item>
        </Menu>
    );

    // --- Define Table Columns ---
    const columns = [
        {
            title: "STT",
            key: "stt",
            width: "5%",
            render: (text, record, index) => ((pagination.current - 1) * pagination.pageSize) + index + 1,
        },
        {
            title: "Ngày thực hành",
            dataIndex: "ngayThucHanh",
            key: "ngayThucHanh",
            width: "12%", // Adjusted width
            sorter: (a, b) => (a.ngayThucHanh ? new Date(a.ngayThucHanh).getTime() : 0) - (b.ngayThucHanh ? new Date(b.ngayThucHanh).getTime() : 0),
            render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : 'N/A',
        },
        {
            title: "Tên ca",
            dataIndex: "tenCa",
            key: "tenCa",
            width: "12%", // Adjusted width
            sorter: (a, b) => (a.tenCa || '').localeCompare(b.tenCa || ''),
        },
        {
            title: "Tiết bắt đầu",
            dataIndex: "tietBatDau",
            key: "tietBatDau",
            width: "10%", // Adjusted width
            sorter: (a, b) => (a.tietBatDau || 0) - (b.tietBatDau || 0),
        },
        {
            title: "Tiết kết thúc",
            dataIndex: "tietKetThuc",
            key: "tietKetThuc",
            width: "10%", // Adjusted width
            sorter: (a, b) => (a.tietKetThuc || 0) - (b.tietKetThuc || 0),
        },
        {
            title: "Buổi số",
            dataIndex: "buoiSo",
            key: "buoiSo",
            width: "8%", // Adjusted width
            sorter: (a, b) => (a.buoiSo || 0) - (b.buoiSo || 0),
        },
        // NEW COLUMNS
        {
            title: "Tên Môn Học",
            dataIndex: ["monHoc", "tenMon"], // Nested data access
            key: "tenMon",
            width: "15%",
            sorter: (a, b) => (a.monHoc?.tenMon || '').localeCompare(b.monHoc?.tenMon || ''),
            render: (text, record) => record.monHoc?.tenMon || 'N/A',
        },
        {
            title: "Tên Phòng Máy",
            dataIndex: ["phongMay", "tenPhong"], // Nested data access
            key: "tenPhong",
            width: "15%",
            sorter: (a, b) => (a.phongMay?.tenPhong || '').localeCompare(b.phongMay?.tenPhong || ''),
            render: (text, record) => record.phongMay?.tenPhong || 'N/A',
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
                    Danh sách ca thực hành
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center", gap: '10px' }}>
                    <DarkModeToggle />
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour}>Hướng dẫn</Button>
                    <Button id="logout-button-cathuchanh" icon={<LogoutOutlined />} type="text" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <Content className="lab-management-content" style={{ padding: "24px", margin: "0 16px" }}>
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                    <Dropdown overlay={homeDropdownMenu} placement="bottomLeft" trigger={['hover']}>
                        <a
                            onClick={(e) => e.preventDefault()}
                            className="flex items-center hover:text-primary"
                            style={{ cursor: 'pointer' }}
                        >
                            <HomeOutlined className="h-4 w-4" />
                            <span className="ml-1">Trang chủ</span>
                        </a>
                    </Dropdown>
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
                            id="column-select-cathuchanh"
                            value={selectedColumn}
                            style={{ width: 180 }}
                            onChange={handleColumnSelect}
                        >
                            <Option value="all">Tìm trong tất cả</Option>
                            <Option value="ngayThucHanh">Ngày Thực Hành</Option>
                            <Option value="tenCa">Tên Ca</Option>
                            <Option value="tietBatDau">Tiết Bắt Đầu</Option>
                            <Option value="tietKetThuc">Tiết Kết Thúc</Option>
                            <Option value="buoiSo">Buổi Số</Option>
                            <Option value="tenMon">Tên Môn Học</Option> {/* NEW OPTION */}
                            <Option value="tenPhong">Tên Phòng Máy</Option> {/* NEW OPTION */}
                        </Select>

                        <Input
                            id="search-input-cathuchanh"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 240 }}
                            allowClear
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button id="export-pdf-button-cathuchanh" onClick={exportToPDF} type="default">
                            Xuất PDF
                        </Button>
                        <Button id="export-excel-button-cathuchanh" onClick={exportToExcel} type="default">
                            Xuất Excel
                        </Button>
                        {/*<Dropdown overlay={menu} placement="bottomRight" arrow>*/}
                        {/*    <Button*/}
                        {/*        id="create-new-dropdown-button-cathuchanh"*/}
                        {/*        type="primary"*/}
                        {/*        icon={<PlusOutlined />}*/}
                        {/*    >*/}
                        {/*        Tạo mới*/}
                        {/*    </Button>*/}
                        {/*</Dropdown>*/}
                    </div>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                    <Table
                        columns={columns}
                        dataSource={caThucHanhs}
                        rowKey={(record) => record.maCa} // Use maCa for unique key as it's reliable
                        loading={internalLoading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
            </Content>
        </Layout>
    );
}