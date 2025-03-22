import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin, DatePicker } from "antd";
import Swal from "sweetalert2";
import "./style.css";

const { Option } = Select;
const { TextArea } = Input;

export default function AddMayTinh() { // Changed component name
    const [editMode, setEditMode] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenMay: "",  // Changed to tenMay
        trangThai: "",
        moTa: "",
        ngayLapDat: null,
        maPhong: null, // Changed to maPhong, storing selected room id
    });
    const [phongMays, setPhongMays] = useState([]); // List of rooms fetched from the API

    // Fetch the list of rooms when the component loads
    useEffect(() => {
        fetchPhongMays();
    }, []);

    // Fetch rooms from the backend
    const fetchPhongMays = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            // Assuming you have an endpoint to get rooms, adjust if needed
            const url = `https://localhost:8080/DSPhongMay?token=${token}`;  //  Replace with YOUR endpoint for getting rooms
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
            setPhongMays(data); // Set fetched rooms

        } catch (error) {
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu phòng máy: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Handle form data changes
    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, ngayLapDat: date });
    };

    // Handle room selection (maPhong)
    const handleSelectChange = (value) => {
        setFormData({ ...formData, maPhong: value });
    };

    const handleSelectChangeTrangThai = (value) => {
        setFormData({ ...formData, trangThai: value });  // Correctly update trangThai
    };

    // Submit form data to backend
    const handleSubmit = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }
        if (!formData.tenMay || !formData.trangThai || !formData.moTa || !formData.ngayLapDat || !formData.maPhong) {
            Swal.fire("Error", "Vui lòng điền đầy đủ thông tin", "error");
            setLoading(false);
            return;
        }

        try {
            // Format the date to yyyy-MM-dd
            const formattedDate = formData.ngayLapDat.format("YYYY-MM-DD");

            const url = `https://localhost:8080/LuuMayTinh?tenMay=${formData.tenMay}&trangThai=${formData.trangThai}&moTa=${formData.moTa}&ngayLapDat=${formattedDate}&maPhong=${formData.maPhong}&token=${token}`;


            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                // No need to send body, all data is in the URL parameters
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();  // You might not need this if the response is just a status
            Swal.fire("Success", "Tạo máy tính mới thành công!", "success"); // Changed message

            // Reset form after submission
            setFormData({
                tenMay: "",      // Changed to tenMay
                trangThai: "",
                moTa: "",
                ngayLapDat: null,
                maPhong: null, // Changed to maPhong
            });
            setEditMode(false);

            window.location.href = "/MayTinh"; // Redirect to computer list page, adjust if needed

        } catch (error) {
            Swal.fire("Error", "Có lỗi xảy ra khi tạo máy tính: " + error.message, "error"); // Changed message
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Quản Lý Máy Tính</h1> {/* Changed to "Máy Tính" */}
                <p>Thông tin chi tiết về các máy tính trong phòng máy</p> {/* Changed to "máy tính" */}
            </div>
            <div className="edit-form">
                <div className="form-title">
                    <h2>Thông Tin Máy Tính</h2> {/* Changed to "Máy Tính" */}
                </div>
                <Form layout="vertical">
                    <Form.Item
                        label={
                            <span>
                                Tên máy tính <span className="required">*</span> {/* Changed to "máy tính" */}
                            </span>
                        }
                    >
                        <Input
                            name="tenMay" // Changed to tenMay
                            value={formData.tenMay} // Changed to tenMay
                            onChange={handleInputChange}
                        />
                    </Form.Item>
                    <Form.Item
                        label={
                            <span>
                                Trạng thái <span className="required">*</span>
                            </span>
                        }
                    >
                        <Select
                            value={formData.trangThai || undefined} // Bind value correctly
                            onChange={handleSelectChangeTrangThai} // Use the correct handler
                            placeholder="Chọn trạng thái"
                        >
                            <Option value="Hoạt động">Hoạt động</Option>
                            <Option value="Hỏng">Hỏng</Option>
                            <Option value="Bảo trì">Bảo trì</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label={
                            <span>
                                Mô tả <span className="required">*</span>
                            </span>
                        }
                    >
                        <TextArea
                            name="moTa"
                            value={formData.moTa}
                            onChange={handleInputChange}
                            rows={4}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Ngày lắp đặt <span className="required">*</span>
                            </span>
                        }
                    >
                        <DatePicker
                            value={formData.ngayLapDat}
                            onChange={handleDateChange}
                            format="YYYY-MM-DD" // Set the display format
                            placeholder="Chọn ngày" // Add a placeholder
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Chọn phòng máy <span className="required">*</span> {/* Changed to "phòng máy" */}
                            </span>
                        }
                    >
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <Select
                                value={formData.maPhong || undefined} // Changed to maPhong
                                onChange={handleSelectChange}
                                placeholder="Chọn phòng máy" // Changed to "phòng máy"
                            >
                                {phongMays.length > 0 ? (
                                    phongMays.map((phong) => ( // Changed variable name
                                        <Option key={phong.maPhong} value={phong.maPhong}>
                                            {phong.tenPhong} {/* Display room name */}
                                        </Option>
                                    ))
                                ) : (
                                    <Option value={null}>Không có phòng máy</Option> // Changed message
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