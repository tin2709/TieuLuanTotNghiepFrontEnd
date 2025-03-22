// AddMayTinh.js
import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin, DatePicker } from "antd";
import Swal from "sweetalert2";
import "./style.css";
import moment from 'moment-timezone';

const { Option } = Select;
const { TextArea } = Input;

export default function AddMayTinh() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenMay: "",
        trangThai: "",
        moTa: "",
        ngayLapDat: null,
        maPhong: null,
    });
    const [phongMays, setPhongMays] = useState([]);

    useEffect(() => {
        fetchPhongMays();
    }, []);

    const fetchPhongMays = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSPhongMay?token=${token}`;
            console.log("Fetching rooms from:", url);

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
            console.log("Fetched rooms:", data);
            setPhongMays(data);

        } catch (error) {
            console.error("Error fetching rooms:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu phòng máy: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDateChange = (date) => {
        setFormData({ ...formData, ngayLapDat: date });
    };


    const handleSelectChange = (value) => {
        setFormData({ ...formData, maPhong: value });
    };

    const handleSelectChangeTrangThai = (value) => {
        setFormData({ ...formData, trangThai: value });
    };

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
            const formattedDate = moment(formData.ngayLapDat).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");

            // Removed URL encoding
            const url = `https://localhost:8080/LuuMayTinh?tenMay=${formData.tenMay}&trangThai=${formData.trangThai}&moTa=${formData.moTa}&ngayLapDat=${formattedDate}&maPhong=${formData.maPhong}&token=${token}`;

            console.log("Submitting to URL:", url);
            console.log("Form Data:", formData);
            console.log("Formatted Date:", formattedDate);

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            console.log("Response status:", response.status);
            console.log("Response headers:", response.headers);


            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.log("Error data:", errorData);
                    errorMessage += " - " + (errorData.message || JSON.stringify(errorData));
                } catch (parseError) {
                    console.error("Error parsing response as JSON:", parseError);
                }
                throw new Error(errorMessage);
            }


            if (response.status === 201) {
                Swal.fire("Success", "Tạo máy tính mới thành công!", "success");

                setFormData({
                    tenMay: "",
                    trangThai: "",
                    moTa: "",
                    ngayLapDat: null,
                    maPhong: null,
                });

                window.location.href = "/MayTinh";
            }
            else {
                Swal.fire("Error", `Unexpected response status: ${response.status}`, "error");
            }

        } catch (error) {
            console.error("Submission error:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tạo máy tính: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Quản Lý Máy Tính</h1>
                <p>Thông tin chi tiết về các máy tính trong phòng máy</p>
            </div>
            <div className="edit-form">
                <div className="form-title">
                    <h2>Thông Tin Máy Tính</h2>
                </div>
                <Form layout="vertical">
                    <Form.Item
                        label={
                            <span>
                                Tên máy tính <span className="required">*</span>
                            </span>
                        }
                    >
                        <Input
                            name="tenMay"
                            value={formData.tenMay}
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
                            value={formData.trangThai || undefined}
                            onChange={handleSelectChangeTrangThai}
                            placeholder="Chọn trạng thái"
                        >
                            <Option value="Đang hoạt động">Đang hoạt động</Option> {/* Corrected Value */}
                            <Option value="Đã hỏng">Đã hỏng</Option>     {/* Corrected Value */}
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
                            format="YYYY-MM-DD"  // Display format in the picker
                            placeholder="Chọn ngày"
                            showTime={false}  // Important:  Don't show time
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Chọn phòng máy <span className="required">*</span>
                            </span>
                        }
                    >
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <Select
                                value={formData.maPhong || undefined}
                                onChange={handleSelectChange}
                                placeholder="Chọn phòng máy"
                            >
                                {phongMays.length > 0 ? (
                                    phongMays.map((phong) => (
                                        <Option key={phong.maPhong} value={phong.maPhong}>
                                            {phong.tenPhong}
                                        </Option>
                                    ))
                                ) : (
                                    <Option value={null}>Không có phòng máy</Option>
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