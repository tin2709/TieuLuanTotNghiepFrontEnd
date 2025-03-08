import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin } from "antd";
import Swal from "sweetalert2";
import "./style.css";

const { Option } = Select;
const { TextArea } = Input;

export default function AddLabRoom() {
    const [editMode, setEditMode] = useState(true);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenTang: "",
        maToaNha: null,  // selected building id
    });
    const [tangs, setTangs] = useState([]); // List of floors and buildings fetched from API

    // Fetch the list of floors when component loads
    useEffect(() => {
        fetchTangs();
    }, []);

    // Fetch the floors from the backend
    const fetchTangs = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSTang?token=${token}`;
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
            setTangs(data); // Set fetched data

        } catch (error) {
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu tầng: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle form data changes
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handle the selection of building (maToaNha)
    const handleSelectChange = (value) => {
        setFormData({ ...formData, maToaNha: value });
    };

    // Submit the form data to the backend
    const handleSubmit = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/LuuTang?tenTang=${formData.tenTang}&maToaNha=${formData.maToaNha}&token=${token}`;

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData), // Send the form data
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            Swal.fire("Success", "Tạo tầng mới thành công!", "success");

            // Reset the form after submission
            setFormData({
                tenTang: "",
                maToaNha: null,
            });
            setEditMode(false);

            window.location.href = "/Tang";

        } catch (error) {
            Swal.fire("Error", "Có lỗi xảy ra khi tạo tầng: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Quản Lý Tầng</h1>
                <p>Thông tin chi tiết về các tầng trong tòa nhà</p>
            </div>
            <div className="edit-form">
                <div className="form-title">
                    <h2>Thông Tin Tầng</h2>
                </div>
                <Form layout="vertical">
                    <Form.Item
                        label={
                            <span>
                                Tên tầng <span className="required">*</span>
                            </span>
                        }
                    >
                        <Input
                            name="tenTang"
                            value={formData.tenTang}
                            onChange={handleInputChange}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Chọn tòa nhà <span className="required">*</span>
                            </span>
                        }
                    >
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <Select
                                value={formData.maToaNha || undefined}
                                onChange={handleSelectChange}
                                placeholder="Chọn tòa nhà"
                            >
                                {tangs.length > 0 ? (
                                    tangs.map((tang) => (
                                        <Option key={tang.maTang} value={tang.maTang}>
                                            {tang.toaNha.tenToaNha} {/* Display building name */}
                                        </Option>
                                    ))
                                ) : (
                                    <Option value={null}>Không có tầng</Option>
                                )}
                            </Select>
                        )}
                    </Form.Item>


                    <Form.Item className="action-buttons">
                        <Space>
                            <Button type="primary" className="save-button" onClick={handleSubmit} loading={loading}>
                                Tạo mới
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}
