import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin, DatePicker } from "antd";
import Swal from "sweetalert2";
import "./style.css";
import { useParams, useNavigate } from "react-router-dom"; // Import useParams and useNavigate

const { Option } = Select;
const { TextArea } = Input;

export default function EditMayTinh() {  // Changed component name
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenMay: "",  // Changed to tenMay
        trangThai: "",
        moTa: "",
        ngayLapDat: null,
        maPhong: null, // Changed to maPhong
    });
    const [phongMays, setPhongMays] = useState([]); // Changed variable name
    const { maMay } = useParams(); // Get the 'maMay' parameter from the URL.  Changed to maMay
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        // Fetch the mayTinh data when the component mounts
        fetchMayTinhData();
        fetchPhongMays(); // Fetch the list of rooms
    }, [maMay]); //  Dependency on maMay

    const fetchMayTinhData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/MayTinh?maMay=${maMay}&token=${token}`; // Corrected URL
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            // Update formData with fetched mayTinh data
            setFormData({
                tenMay: data.tenMay,          // Changed to tenMay
                trangThai: data.trangThai,
                moTa: data.moTa,
                ngayLapDat: data.ngayLapDat ? new Date(data.ngayLapDat) : null, // Handle null dates
                maPhong: data.phongMay.maPhong, // Access maPhong through phongMay
            });
        } catch (error) {
            console.error("Error fetching mayTinh:", error); // Changed error message
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu máy tính: " + error.message, "error"); // Changed message
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
        setFormData({ ...formData, ngayLapDat: date });
    };
    const handleSelectChange = (value) => {
        setFormData({ ...formData, maPhong: value });  // Changed to maPhong
    };
    const handleSelectChangeTrangThai = (value) => {
        setFormData({ ...formData, trangThai: value });  // Correctly update trangThai
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
            // Format the date to yyyy-MM-dd
            const formattedDate = formData.ngayLapDat.format("YYYY-MM-DD");

            const url = `https://localhost:8080/CapNhatMayTinh?maMay=${maMay}&tenMay=${formData.tenMay}&trangThai=${formData.trangThai}&moTa=${formData.moTa}&ngayLapDat=${formattedDate}&maPhong=${formData.maPhong}&token=${token}`; // Updated URL

            const response = await fetch(url, {
                method: "POST", // Use POST for updates
                headers: {
                    "Content-Type": "application/json",
                },
                // No body needed; all data is in the URL parameters
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            Swal.fire("Thành công!", "Đã cập nhật máy tính thành công!", "success").then(() => { // Changed message
                navigate("/MayTinh"); // Navigate back to the mayTinhs list.  Changed to /MayTinh
            });
        } catch (error) {
            console.error("Error updating mayTinh:", error); // Changed error message
            Swal.fire("Error", "Có lỗi xảy ra khi cập nhật máy tính: " + error.message, "error");  // Changed message
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Chỉnh Sửa Thông Tin Máy Tính</h1> {/* Changed to "Máy Tính" */}
                <p>Cập nhật thông tin chi tiết về máy tính</p> {/* Changed to "máy tính" */}
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
                            name="tenMay"  // Changed to tenMay
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
                            rows={4}  // Set the number of rows
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
                            value={formData.ngayLapDat ? new Date(formData.ngayLapDat) :null}
                            onChange={handleDateChange}
                            format="YYYY-MM-DD"
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
                                value={formData.maPhong} // Changed to maPhong
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
                            <Button onClick={() => navigate("/MayTinh")}>Hủy</Button> {/* Changed to /MayTinh */}
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}