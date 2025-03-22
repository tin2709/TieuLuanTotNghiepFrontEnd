// EditMayTinh.js
import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin, DatePicker } from "antd";
import Swal from "sweetalert2";
import "./style.css";
import { useParams, useNavigate } from "react-router-dom"; // Import useParams and useNavigate
import moment from 'moment-timezone';

const { Option } = Select;
const { TextArea } = Input;

export default function EditMayTinh() {  // Changed component name
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenMay: "",
        trangThai: "",
        moTa: "",
        ngayLapDat: null,
        maPhong: null,
    });
    const [phongMays, setPhongMays] = useState([]);
    const { maMay } = useParams(); // Get maMay from URL
    const navigate = useNavigate();

    useEffect(() => {
        fetchMayTinhData(); // Fetch computer data on component mount
        fetchPhongMays();
    }, [maMay]); // Dependency array includes maMay

    const fetchMayTinhData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/MayTinh?maMay=${maMay}&token=${token}`;
            console.log("Fetching MayTinh data from:", url);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Fetched MayTinh data:", data);

            // Set form data, handling date correctly
            setFormData({
                tenMay: data.tenMay,
                trangThai: data.trangThai,
                moTa: data.moTa,
                ngayLapDat: data.ngayLapDat ? moment(data.ngayLapDat) : null, // Use moment()
                maPhong: data.phongMay ? data.phongMay.maPhong : null, // Handle potential null
            });
        } catch (error) {
            console.error("Error fetching MayTinh:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu máy tính: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    const fetchPhongMays = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/DSPhongMay?token=${token}`; // Replace with your rooms endpoint
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPhongMays(data);
        } catch (error) {
            console.error("Error fetching phongMays:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu phòng máy: " + error.message, "error"); // Changed message
        } finally {
            setLoading(false);
        }
    };


    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    const handleDateChange = (date) => {
        //date is already a moment object, no need new Date
        setFormData({ ...formData, ngayLapDat: date });
    };
    const handleSelectChange = (value) => {
        setFormData({ ...formData, maPhong: value });
    };
    const handleSelectChangeTrangThai = (value) => {
        setFormData({ ...formData, trangThai: value });
    };

    // EditMayTinh.js (handleSubmit function)

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
            // Use moment-timezone for formatting, ensures correct timezone handling
            const formattedDate = moment(formData.ngayLapDat).tz("Asia/Ho_Chi_Minh").format("YYYY-MM-DD");

            // Construct URL *with* maMay for update
            const url = `https://localhost:8080/CapNhatMayTinh?maMay=${maMay}&tenMay=${formData.tenMay}&trangThai=${formData.trangThai}&moTa=${formData.moTa}&ngayLapDat=${formattedDate}&maPhong=${formData.maPhong}&token=${token}`;

            console.log("Submitting to URL:", url);

            const response = await fetch(url, {
                method: "PUT", // Use PUT for updates
                headers: {
                    "Content-Type": "application/json",
                },
                // No body needed; all data is in URL parameters
            });

            console.log("Response status:", response.status);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.log("Error data:", errorData);
                    errorMessage += " - " + (errorData.message || JSON.stringify(errorData));
                } catch (parseError) {
                    console.error("Error parsing as JSON:", parseError);
                }
                throw new Error(errorMessage);
            }
            // Check for 200 OK status for successful update
            if (response.status === 200) {
                const updatedMayTinh = await response.json(); // Get updated object
                console.log("Updated MayTinh:", updatedMayTinh); // Log updated object

                Swal.fire("Success", "Cập nhật máy tính thành công!", "success");
                navigate("/MayTinh"); // Navigate back to list
            } else {
                // Handle other status codes if necessary
                Swal.fire("Error", `Unexpected response status: ${response.status}`, "error");
            }

        } catch (error) {
            console.error("Submission error:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi cập nhật máy tính: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Chỉnh Sửa Thông Tin Máy Tính</h1>
                <p>Cập nhật thông tin chi tiết về máy tính</p>
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
                            value={formData.trangThai || undefined} // Handle potentially null value
                            onChange={handleSelectChangeTrangThai}
                            placeholder="Chọn trạng thái"
                        >
                            <Option value="Đang hoạt động">Đang hoạt động</Option>
                            <Option value="Đã hỏng">Đã hỏng</Option>
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
                            value={formData.ngayLapDat} // Keep as moment object
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"  // Display format
                            placeholder="Chọn ngày"
                            showTime={false}
                        />
                    </Form.Item>

                    <Form.Item
                        label={
                            <span>
                                Chọn Phòng Máy <span className="required">*</span>
                            </span>
                        }
                    >
                        {loading ? (
                            <Spin size="small" />
                        ) : (
                            <Select
                                value={formData.maPhong || undefined} // Handle potentially null value
                                onChange={handleSelectChange}
                                placeholder="Chọn Phòng Máy"
                            >
                                {phongMays.map((phongMay) => (
                                    <Option key={phongMay.maPhong} value={phongMay.maPhong}>
                                        {phongMay.tenPhong}
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
                            <Button onClick={() => navigate("/MayTinh")}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}