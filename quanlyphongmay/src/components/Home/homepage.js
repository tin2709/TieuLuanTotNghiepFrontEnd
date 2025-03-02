import React, { useState, useEffect } from "react";
import { HomeOutlined, EditOutlined, DeleteOutlined, MessageOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, Select, Table } from 'antd';
import Swal from "sweetalert2";
import * as DarkReader from 'darkreader';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';

const { Option } = Select;

// Mock data for the table
const labRooms = [
    { id: "01", name: "Lab 101", description: "Phòng máy 1", computers: 0, software: 0, status: "Trống" },
    { id: "02", name: "Lab H2.0.1", description: "Phòng máy H2.0.1", computers: 2, software: 3, status: "Trống" },
    { id: "03", name: "Lab H1.0.1", description: "Phòng máy H1.0.1", computers: 20, software: 2, status: "Trống" },
    { id: "04", name: "Lab H1.0.2", description: "Phòng máy H1.0.2", computers: 24, software: 3, status: "Trống" },
    { id: "05", name: "Lab B1.0.1", description: "Phòng máy B1.0.1", computers: 1, software: 3, status: "Trống" },
    { id: "06", name: "Lab B1.0.2", description: "Phòng máy B1.0.2", computers: 10, software: 3, status: "Trống" },
    { id: "07", name: "Lab B1.0.1", description: "Phòng máy B1.0.1", computers: 15, software: 3, status: "Trống" },
    { id: "08", name: "Lab E1.0.1", description: "Phòng máy E1.0.1", computers: 10, software: 3, status: "Trống" },
    { id: "09", name: "Lab E1.0.2", description: "Phòng máy E1.0.2", computers: 10, software: 3, status: "Trống" },
    { id: "10", name: "Lab E1.0.3", description: "Phòng máy E1.0.3", computers: 10, software: 3, status: "Trống" },
];

const DarkModeToggle = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    // Toggle Dark Mode
    const toggleDarkMode = () => {
        if (isDarkMode) {
            DarkReader.disable();  // Disable Dark mode
        } else {
            DarkReader.enable({     // Enable Dark mode with default settings
                brightness: 100,
                contrast: 90,
                sepia: 10,
            });
        }
        setIsDarkMode(!isDarkMode); // Toggle state
    };

    // Effect to initialize DarkReader based on system color scheme on mount
    useEffect(() => {
        DarkReader.auto({
            brightness: 100,
            contrast: 90,
            sepia: 10,
        });

        return () => {
            DarkReader.disable(); // Cleanup when component unmounts
        };
    }, []);

    return (
        <Button
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleDarkMode}
            style={{
                backgroundColor: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer'
            }}>
        </Button>
    );
};

export default function LabManagement() {
    const [search, setSearch] = useState("");

    return (
        <div className="p-6">
            {/* Dark Mode Toggle */}
            <DarkModeToggle />

            {/* Breadcrumb */}
            <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
                <a href="/" className="flex items-center hover:text-primary">
                    <HomeOutlined className="h-4 w-4" />
                    <span className="ml-1">Trang chủ</span>
                </a>
                {/* Other breadcrumb steps */}
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Danh sách phòng học</h1>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6">
                <Select defaultValue="all" style={{ width: 180 }}>
                    <Option value="all">Tất cả</Option>
                </Select>

                <Select defaultValue="all" style={{ width: 180 }}>
                    <Option value="all">Tất cả</Option>
                </Select>

                <div className="flex-1">
                    <Input
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ maxWidth: 200 }}
                    />
                </div>

                <Button className="bg-green-600 hover:bg-green-700" icon={<PlusOutlined />} type="primary">
                    Tạo mới
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg">
                <Table dataSource={labRooms} rowKey="id">
                    <Table.Column title="STT" dataIndex="id" />
                    <Table.Column title="Tên phòng" dataIndex="name" />
                    <Table.Column title="Mô tả" dataIndex="description" />
                    <Table.Column title="Số máy" dataIndex="computers" align="center" />
                    <Table.Column title="Số ứng dụng PM" dataIndex="software" align="center" />
                    <Table.Column title="Trạng thái" dataIndex="status" />
                    <Table.Column
                        title="Hành động"
                        render={(text, record) => (
                            <div className="flex justify-center gap-2">
                                <Button
                                    icon={<EditOutlined />}
                                    size="small"
                                    type="link"
                                    onClick={() => Swal.fire("Edit", `Edit room ${record.name}`, "info")}
                                />
                                <Button
                                    icon={<DeleteOutlined />}
                                    size="small"
                                    type="link"
                                    onClick={() => Swal.fire("Delete", `Delete room ${record.name}`, "warning")}
                                />
                                <Button
                                    icon={<MessageOutlined />}
                                    size="small"
                                    type="link"
                                    onClick={() => Swal.fire("Message", `Message to room ${record.name}`, "question")}
                                />
                            </div>
                        )}
                    />
                </Table>
            </div>

            {/* Footer */}

        </div>
    );
}
