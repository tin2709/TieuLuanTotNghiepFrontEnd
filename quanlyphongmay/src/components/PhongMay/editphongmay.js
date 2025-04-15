import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin } from "antd";
import Swal from "sweetalert2";
import "./style.css";
import { useParams, useNavigate } from "react-router-dom";

const { Option } = Select;
const { TextArea } = Input;

export default function EditLabRoom() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        tenPhong: "",
        maTang: null,
        moTa: "",
        soMay: 0,
        trangThai: "Trống",
        version: 0, // Initialize version in formData
    });
    const [tangs, setTangs] = useState([]);
    const { maPhong } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLabRoomData();
        fetchTangs();
    }, [maPhong]);

    const fetchLabRoomData = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");

        if (!token) {
            Swal.fire("Error", "Bạn chưa đăng nhập", "error");
            setLoading(false);
            return;
        }

        try {
            const url = `https://localhost:8080/PhongMay?maPhong=${maPhong}&token=${token}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setFormData({
                tenPhong: data.tenPhong,
                maTang: data.tang.maTang,
                moTa: data.moTa,
                soMay: data.soMay,
                trangThai: data.trangThai,
                version: data.version, // Store version from API response
            });
        } catch (error) {
            console.error("Error fetching lab room:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi tải dữ liệu phòng máy: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

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
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setTangs(data);
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
        setFormData({ ...formData, maTang: value });
    };

    const handleStateChange = (value) => {
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

        try {
            const url = `https://localhost:8080/CapNhatPhongMay?maPhong=${maPhong}&tenPhong=${formData.tenPhong}&soMay=${formData.soMay}&moTa=${formData.moTa}&trangThai=${formData.trangThai}&maTang=${formData.maTang}&version=${formData.version}&token=${token}`; // Include version in URL
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.status === 409) { // Check for 409 Conflict status
                Swal.fire("Lỗi", "Đã phát hiện cập nhật đồng thời. Vui lòng làm mới và thử lại.", "error");
            }
            else if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            else {
                Swal.fire("Thành công!", "Đã cập nhật phòng máy thành công!", "success").then(() => {
                    navigate("/PhongMay");
                });
            }


        } catch (error) {
            console.error("Error updating lab room:", error);
            Swal.fire("Error", "Có lỗi xảy ra khi cập nhật phòng máy: " + error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Chỉnh Sửa Phòng Máy</h1>
                <p>Cập nhật thông tin chi tiết về phòng máy và cấu hình</p>
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
                                value={formData.maTang}
                                onChange={handleSelectChange}
                                suffixIcon={<span className="select-arrow">▼</span>}
                                placeholder="Chọn tầng"
                            >
                                {tangs.map((tang) => (
                                    <Option key={tang.maTang} value={tang.maTang}>
                                        {tang.tenTang}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>

                    <Form.Item
                        label="Trạng thái"
                    >
                        <Select
                            value={formData.trangThai}
                            onChange={handleStateChange}
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
                    >
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
                                Cập nhật
                            </Button>
                            <Button onClick={() => navigate("/PhongMay")}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}