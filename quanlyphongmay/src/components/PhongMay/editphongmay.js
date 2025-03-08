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
        tenPhong: "",
        maTang: null,
        moTa: "",
        soMay: 0,
        trangThai: "Trống",  // default state
    });
    const [phongMays, setPhongMays] = useState([]); // Changed from Tangs to PhongMays

    useEffect(() => {
        fetchPhongMays();
    }, []);

    const fetchPhongMays = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSPhongMay?token=${token}`;
            console.log("Fetching Tangs URL:", url);

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
            console.log("PhongMays Data:", data);

            // Log the tenTang values from each PhongMay to the console
            const tenTangs = data.map(phongMay => phongMay.tang.tenTang);
            console.log("Ten Tangs:", tenTangs);
            setPhongMays(data); // Store the PhongMay data
        } catch (error) {
            console.error("Error fetching PhongMays:", error);
            console.log("Error Message:", error.message);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu tầng: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (value) => {
        setFormData({ ...formData, maTang: value });
    };

    const handleStateChange = (value) => {
        setFormData({ ...formData, trangThai: value }); // Update trangThai when state changes
    };

    const handleSubmit = async () => {
        setLoading(true);
        const token = sessionStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/LuuPhongMay?tenPhong=${formData.tenPhong}&soMay=${formData.soMay}&moTa=${formData.moTa}&trangThai=${formData.trangThai}&maTang=${formData.maTang}&token=${token}`;

            console.log("Submitting URL:", url);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json", // Adjust content type if needed
                },
                body: JSON.stringify(formData), // Remove this line if you are using URL parameters
            });

            console.log("Submit Response Status:", response.status);

            if (!response.ok) {
                console.error("Submit Error:", response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Submit Data:", data);

            Swal.fire("Success", "Tạo phòng máy thành công!", "success");

            // Reset form and return to previous page (adjust as necessary)
            setFormData({
                tenPhong: "",
                maTang: null,
                moTa: "",
                soMay: 0,
                trangThai: "Trống",  // default state after submission
            });
            setEditMode(false);
            window.location.href = "/PhongMay";

        } catch (error) {
            console.error("Error creating lab room:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tạo phòng máy: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Quản Lý Phòng Máy</h1>
                <p>Thông tin chi tiết về phòng máy và cấu hình</p>
            </div>
            <div className="edit-form">
                <div className="form-title">
                    <h2>Thông Tin Phòng Máy</h2>
                </div>
                <Form layout="vertical">
                    <Form.Item
                        label={
                            <span>
                                Tên phòng <span className="required">*</span>
                            </span>
                        }
                    >
                        <Input
                            name="tenPhong"
                            value={formData.tenPhong}
                            onChange={handleInputChange}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Chọn tầng <span className="required">*</span>
                            </span>
                        }
                    >
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <Select
                                value={formData.maTang || undefined}  // Ensure maTang value is set correctly
                                onChange={handleSelectChange}
                                suffixIcon={<span className="select-arrow">▼</span>}
                                placeholder="Chọn tầng"
                            >
                                {phongMays.length > 0 ? (
                                    phongMays.map((phongMay) => (
                                        <Option key={phongMay.tang.maTang} value={phongMay.tang.maTang}>
                                            {phongMay.tang.tenTang} {/* Access the tenTang property */}
                                        </Option>
                                    ))
                                ) : (
                                    <Option value={null}>Không có tầng</Option>
                                )}
                            </Select>
                        )}
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                    >
                        <Select
                            value={formData.trangThai}  // bind trangThai
                            onChange={handleStateChange}  // Update trangThai when state changes
                        >
                            <Option value="Trống">Trống</Option>
                            <Option value="Đang có tiết">Đang có tiết</Option>
                            <Option value="Không thể dùng">Không thể dùng</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Mô tả"
                    >
                        <TextArea
                            name="moTa"
                            value={formData.moTa}
                            onChange={handleInputChange}
                            rows={4}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Số máy"
                        name="soMay"
                        rules={[{ required: true, message: 'Vui lòng nhập số máy!' }]}>
                        <Input
                            type="number"
                            name="soMay"
                            value={formData.soMay}
                            onChange={handleInputChange}
                        />
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
