import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin } from "antd";
import Swal from "sweetalert2";
import "./style.css";
import { useParams, useNavigate } from "react-router-dom"; // Import useParams and useNavigate

const { Option } = Select;

export default function EditTang() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenTang: "",
        maToaNha: null,
    });
    const [toanha, setToaNha] = useState([]);
    const { maTang } = useParams(); // Get the 'maTang' parameter from the URL
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        // Fetch the tang data when the component mounts
        fetchTangData();
        fetchToaNha()
    }, [maTang]);

    const fetchTangData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/Tang?maTang=${maTang}&token=${token}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setFormData({
                tenTang: data.tenTang,
                maToaNha: data.toaNha.maToaNha,
            });
        } catch (error) {
            console.error("Error fetching tang:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu tầng: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };
    const fetchToaNha = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSToaNha?token=${token}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setToaNha(data);
        } catch (error) {
            console.error("Error fetching tangs:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu tầng: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };


    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value) => {
        setFormData({ ...formData, maToaNha: value });
    };

    const handleSubmit = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/CapNhatTang?maTang=${maTang}&tenTang=${formData.tenTang}&maToaNha=${formData.maToaNha}&token=${token}`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            Swal.fire("Thành công!", "Đã cập nhật tầng thành công!", "success").then(() => {
                navigate("/Tang"); // Navigate back to the tangs list
            });
        } catch (error) {
            console.error("Error updating tang:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi cập nhật tầng: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Chỉnh Sửa Thông Tin Tầng</h1>
                <p>Cập nhật thông tin chi tiết về tầng</p>
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
                                Chọn Tòa Nhà <span className="required">*</span>
                            </span>
                        }
                    >
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <Select
                                value={formData.maToaNha}
                                onChange={handleSelectChange}
                                placeholder="Chọn Tòa Nhà"
                            >
                                {toanha.map((toaNha) => (
                                    <Option key={toaNha.maToaNha} value={toaNha.maToaNha}>
                                        {toaNha.tenToaNha}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>

                    <Form.Item className="action-buttons">
                        <Space>
                            <Button type="primary" className="save-button" onClick={handleSubmit} loading={loading}>
                                Cập nhật
                            </Button>
                            <Button onClick={() => navigate("/Tang")}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}