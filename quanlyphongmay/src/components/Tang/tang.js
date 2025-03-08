import React, { useState, useEffect } from "react";
import {
    HomeOutlined,
    EditOutlined,
    DeleteOutlined,
    MessageOutlined,
    PlusOutlined,
    FileAddOutlined,
} from "@ant-design/icons";
import { Button, Input, Select, Table, Checkbox, Dropdown, Menu } from "antd";
import Swal from "sweetalert2";
import * as DarkReader from "darkreader";
import { SunOutlined, MoonOutlined } from "@ant-design/icons";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import font from '../../font/font';
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook

import ImportFileModal from './ImportFileModal'; // Import the ImportFileModal
const { Option } = Select;

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
            icon={isDarkMode ? <SunOutlined/> : <MoonOutlined/>}
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

// const validSearchColumns = [
//     {label: "Tên phòng", value: "ten_phong"},
//     {label: "Số máy", value: "so_may"},
//     {label: "Mô tả", value: "mo_ta"},
//     {label: "Trạng thái", value: "trang_thai"},
// ];

export default function LabManagement() {
    const [search, setSearch] = useState("");
    const [labRooms, setLabRooms] = useState([]);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [initialLabRooms, setInitialLabRooms] = useState([]);
    const navigate = useNavigate(); // Initialize navigate hook
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false); // State for import loading


    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const [sortInfo, setSortInfo] = useState({});
    const [hasSelected, setHasSelected] = useState(false);

    const showImportModal = () => {
        setIsModalVisible(true);
    };

    const hideImportModal = () => {
        setIsModalVisible(false);
    };

    const handleImport = async (file) => {
        // Logic for handling import can be placed here if needed
        console.log("File imported:", file);
        fetchLabRooms(); // Reload the list after import
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

    const fetchLabRooms = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSTang?token=${token}`;
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
            console.log("Error Message:", error.message);  // In ra error.message
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };
    // Handle delete action
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
                deleteLabRoom(record.maTang); // Delete the lab room
            }
        });
    };

    // Perform delete action
    const deleteLabRoom = async (maTang) => {
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

            Swal.fire("Thành công!", "Đã xóa tầng thành công!", "success");

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

            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return sortOrder === 'ascend' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
            } else if (typeof valueA === 'number' && typeof valueB === 'number') {
                return sortOrder === 'ascend' ? valueA - valueB : valueB - valueA;
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
            setLoading(true);
            try {
                const url = `https://localhost:8080/searchPhongMay?keyword=${searchColumn}:${searchValue}&token=${token}`;
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
            setLabRooms(initialLabRooms);
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
        const {current, pageSize} = newPagination;

        let sortField = null;
        let sortOrder = null;

        if (sorter && sorter.field && sorter.order) {
            sortField = sorter.field;
            sortOrder = sorter.order;
            setSortInfo({field: sortField, order: sortOrder});
        } else {
            setSortInfo({});
        }

        updateTableData(current, pageSize, sortField, sortOrder);
        setPagination(newPagination);
    };
    const onSelectChange = (newSelectedRowKeys) => {
        console.log('Selected Row Keys changed: ', newSelectedRowKeys);
        setSelectedRowKeys(newSelectedRowKeys);
        setHasSelected(newSelectedRowKeys.length > 0);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            // This function is essential for associating the checkbox with the right key.
            disabled: false, // You can set to true based on a certain logic
            name: record.maTang, // Must be unique to make the checkbox controllable
        }),
    };

    useEffect(() => {
        fetchLabRooms();
    }, []);
    const startIndex = (pagination.current - 1) * pagination.pageSize;

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Add Arial font (a font that supports Vietnamese characters)
        doc.addFileToVFS("Arial.ttf", font); // You need the base64 version of the font
        doc.setFont("Arial");

        // Create the table
        doc.autoTable({
            head: [["STT", "Tên Tầng", "Tên tòa nhà"]],
            body: labRooms.map((room, index) => [
                index + 1,  // STT
                room.tenTang, // Ensure Vietnamese characters are correctly rendered
                room.tenToaNha,

            ])
        });

        // Save the generated PDF
        doc.save("DanhSachTang.pdf");
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(labRooms);
        XLSX.utils.book_append_sheet(wb, ws, "DanhSachTang");
        XLSX.writeFile(wb, "DanhSachTang.xlsx");
    };
    const confirmDeleteMultiple = () => {
        Swal.fire({
            title: 'Bạn có chắc chắn muốn xóa các tầng đã chọn?',
            text: `Bạn đang cố gắng xóa ${selectedRowKeys.length} tầng.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
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
            const maTangListString = selectedRowKeys.join(',');
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

            Swal.fire("Thành công!", "Đã xóa các tầng thành công!", "success");
            setSelectedRowKeys([]);
            fetchLabRooms(); // Reload the list
        } catch (error) {
            console.error("Error deleting lab rooms:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi xóa phòng máy: " + error.message, "error");
        }
    };

    const menu = (
        <Menu>
            <Menu.Item key="1" icon={<PlusOutlined />} onClick={() => navigate(`/addtang`)}>
                Tạo mới bằng form
            </Menu.Item>
            <Menu.Item key="2" icon={<FileAddOutlined />} onClick={showImportModal}>
                Tạo mới bằng file
            </Menu.Item>
        </Menu>
    );


    const columns = [
        {
            title: (
                <Checkbox
                    onChange={(e) => {
                        const allKeys = labRooms.map(record => record.maTang);
                        setSelectedRowKeys(e.target.checked ? allKeys : []);
                        setHasSelected(e.target.checked);
                    }}
                    checked={labRooms.length > 0 && selectedRowKeys.length === labRooms.length}
                    indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < labRooms.length}
                />
            ),
            key: 'checkbox',
            width: '5%',
            fixed: 'left',
            render: (text, record) => null, // No individual checkbox needed here
        },
        {
            title: 'STT',
            key: 'stt',
            width: '20%',
            render: (text, record, index) => startIndex + index + 1,
        },
        {
            title: 'Tên tầng',
            dataIndex: 'tenTang',
            width: '20%',
            sorter: (a, b) => a.tenTang.localeCompare(b.tenTang),
        },

        {
            title: 'Tên tòa nhà',
            dataIndex: 'tenToaNha',
            align: 'center',
            sorter: (a, b) => a.soMay - b.soMay,
            width: '30%',
        },

        {
            title: 'Hành động',
            render: (text, record) => (
                <div className="flex justify-center gap-2">
                    <Button
                        icon={<EditOutlined/>}
                        size="small"
                        type="link"
                        onClick={() => navigate(`/edittang`)}
                    />
                    <Button
                        icon={<DeleteOutlined/>}
                        size="small"
                        type="link"
                        onClick={() => handleDelete(record)} // Trigger delete confirmation
                    />
                    <Button
                        icon={<MessageOutlined/>}
                        size="small"
                        type="link"
                        onClick={() => Swal.fire("Message", `Message to room ${record.tenPhong}`, "question")}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="p-6">
            <DarkModeToggle/>

            <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
                <a href="/" className="flex items-center hover:text-primary">
                    <HomeOutlined className="h-4 w-4"/>
                    <span className="ml-1">Trang chủ</span>
                </a>
            </nav>

            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Danh sách tầng</h1>
            </div>

            <div className="flex items-center gap-4 mb-6">
                <Select defaultValue="all" style={{width: 180}}>
                    <Option value="all">Tất cả</Option>
                </Select>

                <Select defaultValue="all" style={{width: 180}}>
                    <Option value="all">Tất cả</Option>
                </Select>

                <div className="flex items-center flex-1 gap-2">
                    <Input
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        style={{maxWidth: 200}}
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
                <h1 className="text-2xl font-semibold">Danh sách tầng</h1>
                <Dropdown overlay={menu} placement="bottomRight" arrow>
                    <Button
                        type="primary"
                        icon={<PlusOutlined/>}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Tạo mới
                    </Button>
                </Dropdown>
            </div>
            <div className="border rounded-lg">

                <Table
                    rowSelection={{
                        type: 'checkbox',
                        selectedRowKeys: selectedRowKeys, // Use the state here
                        onChange: onSelectChange, // Make sure this gets called to update the state.
                    }}
                    columns={columns}
                    dataSource={labRooms}
                    rowKey="maTang"
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
                    Xóa nhiều tầng
                </Button>
            )}
            <ImportFileModal
                visible={isModalVisible}
                onCancel={hideImportModal}
                onImport={handleImport}
                loading={importLoading}
            />
        </div>
    );

}
