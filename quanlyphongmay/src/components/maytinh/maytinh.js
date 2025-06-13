import React, { useState, useEffect } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
    LogoutOutlined,
    QuestionCircleOutlined,
    InfoCircleOutlined
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
    Alert,
    message,
    Popover,
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


export default function MayTinhManagement() {
    const loaderResult = useLoaderData();
    const [search, setSearch] = useState("");
    const [mayTinhs, setMayTinhs] = useState([]);
    const [filteredMayTinhs, setFilteredMayTinhs] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState('all');
    const [initialMayTinhs, setInitialMayTinhs] = useState([]);
    const navigate = useNavigate();
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [internalLoading, setInternalLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);
    const [notificationSSE, setNotificationSSE] = useState(null);

    // THÊM STATE ĐỂ LƯU THÔNG TIN GHI CHÚ MÁY HỎNG (đã đổi tên và sẽ lưu tất cả ghi chú)
    // Đổi tên thành `computerNotesMap` để phản ánh rằng nó lưu mọi ghi chú, không chỉ "broken"
    const [computerNotesMap, setComputerNotesMap] = useState(new Map());

    const homeDropdownMenu = (
        <Menu>
            <Menu.Item key="home" onClick={() => navigate('/')}>
                Trang chủ
            </Menu.Item>
            {/* Assuming these are your paths, adjust if different */}
            <Menu.Item key="quanliphongmay" onClick={() => navigate('/phongmay')}>
                Quản lí phòng máy
            </Menu.Item>
            <Menu.Item key="quanlimonhoc" onClick={() => navigate('/quanlimonhoc')}>
                Quản lí môn học
            </Menu.Item>
        </Menu>
    );
    // --- Intro.js Tour ---
    const startIntroTour = () => {
        const steps = [
            { element: '#search-input-maytinh', intro: 'Nhập tên máy tính hoặc thông tin liên quan để tìm kiếm.', position: 'bottom-start' },
            { element: '#column-select-maytinh', intro: 'Chọn cột bạn muốn tìm kiếm (Tên máy tính, Trạng thái, Mô tả, Tên Phòng).', position: 'bottom-start' },
            { element: '#status-select-maytinh', intro: 'Lọc danh sách máy tính theo trạng thái hoạt động.', position: 'bottom-start' },
            { element: '#export-pdf-button-maytinh', intro: 'Xuất danh sách máy tính ra file PDF.', position: 'bottom-start' },
            { element: '#export-excel-button-maytinh', intro: 'Xuất danh sách máy tính ra file Excel.', position: 'bottom-start' },
            { element: '#create-new-dropdown-maytinh', intro: 'Tạo máy tính mới bằng form hoặc import từ file.', position: 'bottom-start' },
            { element: '.ant-table-thead > tr > th:nth-child(3)', intro: 'Click vào đây để sắp xếp danh sách máy tính theo tên.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(6)', intro: 'Click vào đây để sắp xếp danh sách máy tính theo trạng thái.', position: 'bottom' },
            { element: '.ant-table-thead > tr > th:nth-child(7)', intro: 'Click vào đây để sắp xếp danh sách máy tính theo tên phòng.', position: 'bottom' },
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
            setMayTinhs([]);
            setInitialMayTinhs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));

            if (loaderResult.type === 'auth') {
                Swal.fire("Lỗi Xác thực", loaderResult.message || "Phiên đăng nhập hết hạn.", "error");
            } else {
                Swal.fire("Lỗi Tải Dữ Liệu", loaderResult.message || "Không thể tải danh sách máy tính.", "error");
            }
        } else if (loaderResult?.data) {
            const { mayTinhs: fetchedMayTinhs, ghiChuMayTinhs: fetchedGhiChuMayTinhs } = loaderResult.data;

            // 1. Cập nhật dữ liệu máy tính
            const data = fetchedMayTinhs || [];
            console.log("[Component MayTinh] Setting initial DTO data:", data);
            setInitialMayTinhs(data);
            setMayTinhs(data);
            setLoadError(null);
            setPagination(prev => ({ ...prev, current: 1, total: data.length }));

            // 2. Xử lý dữ liệu ghi chú máy (không cần lọc theo trạng thái "chưa sửa" hay "chưa có lịch hẹn")
            const notesMap = new Map();
            if (fetchedGhiChuMayTinhs && Array.isArray(fetchedGhiChuMayTinhs)) {
                fetchedGhiChuMayTinhs.forEach(note => {
                    // YÊU CẦU MỚI: Luôn lưu noiDung nếu có maMay, bất kể ngaySua hay noiDung có cụm "Sẽ được sửa"
                    if (note.maMay) {
                        // Nếu có nhiều ghi chú cho cùng một máy, bạn cần quyết định ghi chú nào sẽ được hiển thị.
                        // Hiện tại, nó sẽ ghi đè, nghĩa là ghi chú cuối cùng trong mảng sẽ được lưu.
                        // Nếu muốn ghi chú báo lỗi mới nhất, bạn có thể sort fetchedGhiChuMayTinhs theo ngayBaoLoi trước.
                        notesMap.set(note.maMay, note.noiDung);
                    }
                });
            }
            setComputerNotesMap(notesMap); // Cập nhật state với map mới
            console.log("[Component MayTinh] Processed all computer notes map:", notesMap);

        } else {
            console.warn("Unexpected loader result:", loaderResult);
            setLoadError({ error: true, type: 'unknown', message: "Dữ liệu tải trang không hợp lệ." });
            setMayTinhs([]);
            setInitialMayTinhs([]);
            setPagination(prev => ({ ...prev, current: 1, total: 0 }));
        }
    }, [loaderResult]);

    useEffect(() => {
        const eventSource = new EventSource("https://localhost:8080/subscribe");
        eventSource.onopen = () => console.log("SSE connection opened for MayTinh");
        eventSource.onmessage = (event) => {
            const messageText = event.data;
            console.log("Received SSE message:", messageText);

            if (messageText !== "subscribed") {
                setNotificationSSE(messageText);

                if ((messageText.toLowerCase().includes("xóa") || messageText.toLowerCase().includes("thêm") || messageText.toLowerCase().includes("cập nhật"))
                    && messageText.toLowerCase().includes("máy tính")) {
                    console.log("SSE indicates MayTinh change, preparing reload...");
                    Swal.fire({
                        title: "Thông báo",
                        text: "Dữ liệu máy tính đã được cập nhật. Danh sách sẽ được tải lại.",
                        icon: "info",
                        timer: 2500,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        willClose: () => navigate(0)
                    });
                }
            }
        };
        eventSource.onerror = (error) => { console.error("SSE error:", error); eventSource.close(); };
        return () => { eventSource.close(); };
    }, [navigate]);

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
    const handleImport = async (file) => { console.log("File imported:", file); /* Implement import logic */};

    const handleDelete = (record) => {
        Swal.fire({
            title: "Bạn có chắc chắn muốn xóa?",
            text: `Máy tính: ${record.tenMay} (Phòng: ${record.tenPhong || 'N/A'})`,
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
        const token = localStorage.getItem("authToken");
        if (!token) { Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error"); return; }
        setInternalLoading(true);
        try {
            const url = `https://localhost:8080/api/maytinh/XoaMayTinh?maMay=${maMay}&token=${token}`;
            const response = await fetch(url, { method: "DELETE" });
            if (!response.ok) { throw new Error(`Lỗi HTTP: ${response.status}`); }
            message.success("Đã xóa máy tính thành công!");
        } catch (error) {
            console.error("Lỗi xóa máy tính:", error);
            Swal.fire("Lỗi", `Có lỗi xảy ra khi xóa máy tính: ${error.message}`, "error");
        } finally {
            setInternalLoading(false);
        }
    };

    const sortData = (data, sortKey, sortOrder) => {
        if (!sortKey || !sortOrder) return data;

        const sortedData = [...data].sort((a, b) => {
            const valueA = a[sortKey] ?? (typeof a[sortKey] === 'number' ? 0 : '');
            const valueB = b[sortKey] ?? (typeof b[sortKey] === 'number' ? 0 : '');

            if (sortKey === 'ngayLapDat' || sortKey === 'ngayCapNhat') {
                const dateA = valueA ? new Date(valueA).getTime() : 0;
                const dateB = valueB ? new Date(valueB).getTime() : 0;
                return sortOrder === "ascend" ? dateA - dateB : dateB - dateA;
            } else if (typeof valueA === "string" && typeof valueB === "string") {
                return sortOrder === "ascend"
                    ? valueA.localeCompare(valueB)
                    : valueB.localeCompare(valueA);
            } else if (typeof valueA === "number" && typeof valueB === "number") {
                return sortOrder === "ascend" ? valueA - valueB : valueB - valueA;
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

    const performClientSearch = (searchValue, searchColumn) => {
        setInternalLoading(true);
        let filteredData = initialMayTinhs;

        if (searchValue) {
            filteredData = initialMayTinhs.filter(item => {
                let match = false;
                if (searchColumn === 'all') {
                    match = [
                        item.tenMay,
                        item.moTa,
                        item.trangThai,
                        item.tenPhong
                    ].some(val => val != null && typeof val === 'string' && val.toLowerCase().includes(searchValue.toLowerCase()));
                } else {
                    const itemValue = item[searchColumn];
                    match = itemValue != null && typeof itemValue === 'string' && itemValue.toLowerCase().includes(searchValue.toLowerCase());
                }
                return match;
            });
        }

        filteredData = sortData(filteredData, sortInfo.field, sortInfo.order);
        setFilteredMayTinhs(filteredData);
        setMayTinhs(filteredData);
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

    const handleStatusFilter = (value) => {
        setInternalLoading(true);
        let filteredData;
        if (value === "all") {
            filteredData = initialMayTinhs;
        } else {
            filteredData = initialMayTinhs.filter(item => item.trangThai === value);
        }

        if (search) {
            if (selectedColumn === 'all') {
                filteredData = filteredData.filter(item =>
                    [item.tenMay, item.moTa, item.trangThai, item.tenPhong].some(val =>
                        val != null && typeof val === 'string' && val.toLowerCase().includes(search.toLowerCase())
                    )
                );
            } else {
                filteredData = filteredData.filter(item => {
                    const itemValue = item[selectedColumn];
                    return itemValue != null && typeof itemValue === 'string' && itemValue.toLowerCase().includes(search.toLowerCase());
                });
            }
        }

        filteredData = sortData(filteredData, sortInfo.field, sortInfo.order);
        setMayTinhs(filteredData);
        setPagination(prev => ({ ...prev, current: 1, total: filteredData.length }));
        setInternalLoading(false);
    };


    const handleTableChange = (newPagination, filters, sorter) => {
        const { current, pageSize } = newPagination;
        let currentData = filteredMayTinhs ?? initialMayTinhs;
        let sortField = sorter.field;
        let sortOrder = sorter.order;

        if (sorter.field !== sortInfo.field || sorter.order !== sortInfo.order) {
            setSortInfo({ field: sortField, order: sortOrder });
            currentData = sortData(currentData, sortField, sortOrder);
            setMayTinhs(currentData);
        }

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

    // --- Export Functions ---
    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.addFileToVFS("Arial.ttf", font);
        doc.setFont("Arial", "normal");

        const tableData = (filteredMayTinhs ?? mayTinhs).map((mayTinh, index) => [
            index + 1,
            mayTinh.tenMay || '',
            mayTinh.trangThai || '',
            mayTinh.moTa || '',
            mayTinh.ngayLapDat ? new Date(mayTinh.ngayLapDat).toLocaleDateString() : '',
            mayTinh.tenPhong || ''
        ]);

        doc.autoTable({
            head: [["STT", "Tên Máy Tính", "Trạng Thái", "Mô Tả", "Ngày Lắp Đặt", "Phòng"]],
            body: tableData,
            styles: { font: "Arial", fontSize: 10 },
            headStyles: { fontStyle: "bold", fillColor: [22, 160, 133] },
            didDrawPage: function (data) {
                doc.setFontSize(18);
                doc.text("Danh Sách Máy Tính", data.settings.margin.left, 15);
            },
        });

        doc.save("DanhSachMayTinh.pdf");
        message.success("Xuất PDF thành công!");
    };


    const exportToExcel = () => {
        const excelData = (filteredMayTinhs ?? mayTinhs).map((item, index) => ({
            "STT": index + 1,
            "Tên Máy Tính": item.tenMay,
            "Trạng Thái": item.trangThai,
            "Mô Tả": item.moTa,
            "Ngày Lắp Đặt": item.ngayLapDat ? new Date(item.ngayLapDat).toLocaleDateString() : '',
            "Phòng": item.tenPhong,
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachMayTinh");
        XLSX.writeFile(wb, "DanhSachMayTinh.xlsx");
        message.success("Xuất Excel thành công!");
    };

    const confirmDeleteMultiple = () => {
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
        const token = localStorage.getItem("authToken");
        if (!token) { Swal.fire("Lỗi", "Bạn chưa đăng nhập", "error"); return; }
        setInternalLoading(true);
        try {
            const maMayListString = selectedRowKeys.join(",");
            const url = `https://localhost:8080/api/maytinh/XoaNhieuMayTinh?maMayTinhList=${maMayListString}&token=${token}`;

            const response = await fetch(url, { method: "DELETE" });
            if (!response.ok) { throw new Error(`Lỗi HTTP: ${response.status}`); }

            message.success(`Đã xóa ${selectedRowKeys.length} máy tính đã chọn!`);
            setSelectedRowKeys([]);
            setHasSelected(false);

        } catch (error) {
            console.error("Lỗi xóa nhiều máy tính:", error);
            Swal.fire("Lỗi", `Có lỗi xảy ra khi xóa máy tính: ${error.message}`, "error");
        } finally {
            setInternalLoading(false);
        }
    };


    const menu = (
        <Menu id="create-new-dropdown-maytinh">
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addMayTinh`)}>
                Tạo mới bằng form
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={showImportModal}>
                Tạo mới bằng file
            </Menu.Item>
        </Menu>
    );

    const handleLogout = async () => {
        const token = localStorage.getItem("authToken");
        if (!token) { message.error("Bạn chưa đăng nhập."); return; }
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
            message.success("Đăng xuất thành công!", 2);
            navigate("/login", { replace: true });
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
            title: "Tên máy tính",
            dataIndex: "tenMay",
            key: "tenMay",
            width: "15%",
            sorter: (a, b) => (a.tenMay || '').localeCompare(b.tenMay || ''),
            render: (text, record) => {
                // Kiểm tra nếu máy có trạng thái "Đã hỏng"
                if (record.trangThai === 'Đã hỏng') {
                    // Lấy lý do hỏng từ map (nay chứa tất cả ghi chú)
                    const reason = computerNotesMap.get(record.maMay);
                    if (reason) {
                        return (
                            <Popover content={reason} title="Lý do hỏng" trigger="hover">
                                <span style={{ color: 'red', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {text || `Máy ${record.maMay}`} <InfoCircleOutlined style={{ marginLeft: '4px' }} />
                                </span>
                            </Popover>
                        );
                    }
                }
                // Hiển thị bình thường cho các trạng thái khác hoặc không có lý do hỏng
                return <span>{text || `Máy ${record.maMay}`}</span>;
            },
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
            dataIndex: "ngayLapDat",
            key: "ngayLapDat",
            width: "15%",
            sorter: (a, b) => (a.ngayLapDat ? new Date(a.ngayLapDat).getTime() : 0) - (b.ngayLapDat ? new Date(b.ngayLapDat).getTime() : 0),
            render: (text) => text ? new Date(text).toLocaleDateString('vi-VN') : 'N/A',
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
            dataIndex: "tenPhong",
            key: "tenPhong",
            width: "15%",
            sorter: (a, b) => (a.tenPhong || '').localeCompare(b.tenPhong || ''),
        },
        {
            title: "Hành động",
            key: "action",
            render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        type="link"
                        onClick={() => navigate(`/editMayTinh/${record.maMay}`)}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        size="small"
                        type="link"
                        danger
                        onClick={() => handleDelete(record)}
                    />
                    <Button
                        icon={<MessageOutlined />}
                        size="small"
                        type="link"
                        onClick={() =>
                            Swal.fire("Thông báo", `Gửi tin nhắn đến máy ${record.tenMay}?`, "question")
                        }
                    />
                </div>
            ),
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
                    Danh sách máy tính
                </div>
                <div className="actions" style={{ display: "flex", alignItems: "center", gap: '10px' }}>
                    <DarkModeToggle />
                    <Button icon={<QuestionCircleOutlined />} type="primary" onClick={startIntroTour}>Hướng dẫn</Button>
                    <Button id="logout-button-maytinh" icon={<LogoutOutlined />} type="text" onClick={handleLogout}>
                        Đăng xuất
                    </Button>
                </div>
            </Header>
            <Content className="lab-management-content" style={{ padding: "24px", margin: "0 16px" }}>
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
                    <Dropdown overlay={homeDropdownMenu} placement="bottomLeft" trigger={['hover']}>
                        <a
                            onClick={(e) => e.preventDefault()} // Prevent default navigation of <a> tag
                            className="flex items-center hover:text-primary"
                            style={{ cursor: 'pointer' }} // Indicate it's clickable
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
                {notificationSSE && (
                    <Alert
                        message={notificationSSE}
                        type="info"
                        showIcon
                        closable
                        onClose={() => setNotificationSSE(null)}
                        style={{ marginBottom: '16px' }}
                    />
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <Select
                            id="status-select-maytinh"
                            defaultValue="all"
                            style={{ width: 180 }}
                            onChange={handleStatusFilter}
                        >
                            <Option value="all">Tất cả trạng thái</Option>
                            <Option value="Đang hoạt động">Đang hoạt động</Option>
                            <Option value="Đã hỏng">Đã hỏng</Option>
                            <Option value="Không hoạt động">Không hoạt động</Option>
                        </Select>

                        <Select
                            id="column-select-maytinh"
                            value={selectedColumn}
                            style={{ width: 180 }}
                            onChange={handleColumnSelect}
                        >
                            <Option value="all">Tìm trong tất cả</Option>
                            <Option value="tenMay">Tên Máy Tính</Option>
                            <Option value="trangThai">Trạng Thái</Option>
                            <Option value="moTa">Mô Tả</Option>
                            <Option value="tenPhong">Phòng</Option>
                        </Select>

                        <Input
                            id="search-input-maytinh"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => handleSearch(e.target.value)}
                            style={{ width: 240 }}
                            allowClear
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button id="export-pdf-button-maytinh" onClick={exportToPDF} type="default">
                            Xuất PDF
                        </Button>
                        <Button id="export-excel-button-maytinh" onClick={exportToExcel} type="default">
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

                <div className="border rounded-lg overflow-x-auto">
                    <Table
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={mayTinhs}
                        rowKey="maMay"
                        loading={internalLoading}
                        pagination={pagination}
                        onChange={handleTableChange}
                        scroll={{ x: 'max-content' }}
                    />
                </div>
                {hasSelected && (
                    <Button
                        id="delete-selected-button-maytinh"
                        type="primary"
                        danger
                        onClick={confirmDeleteMultiple}
                        className="mt-4"
                        disabled={internalLoading || selectedRowKeys.length === 0}
                        style={{ float: 'right' }}
                    >
                        Xóa ({selectedRowKeys.length}) mục đã chọn
                    </Button>
                )}

            </Content>
        </Layout>
    );
}