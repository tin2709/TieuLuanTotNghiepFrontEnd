// EditMayTinh.js
import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin, DatePicker, Alert } from "antd"; // Added Alert
import Swal from "sweetalert2";
import "./style.css";
import { useParams, useNavigate } from "react-router-dom";
import moment from 'moment-timezone'; // Keep moment-timezone

const { Option } = Select;
const { TextArea } = Input;

export default function EditMayTinh() {
    const [loading, setLoading] = useState(false);
    const [fetchError, setFetchError] = useState(null); // State for fetch errors
    const [formData, setFormData] = useState({
        tenMay: "",
        trangThai: "",
        moTa: "",
        // ngayLapDat: null, // Removed ngayLapDat as it's likely not editable
        maPhong: null,
        // Store the original fetched data to compare status later if needed
        originalTrangThai: "",
    });
    // State for the GhiChu content
    const [ghiChuNoiDung, setGhiChuNoiDung] = useState("");
    const [phongMays, setPhongMays] = useState([]);
    const { maMay } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchMayTinhData();
        fetchPhongMays();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maMay]);

    const fetchMayTinhData = async () => {
        setLoading(true);
        setFetchError(null); // Reset error on new fetch
        const token = localStorage.getItem("authToken");

        if (!token) {
            setFetchError("Bạn chưa đăng nhập.");
            setLoading(false);
            return;
        }

        try {
            // Using the API that returns MayTinhDTO
            const url = `https://localhost:8080/MayTinh?maMay=${maMay}&token=${token}`; // Use correct API path
            console.log("Fetching MayTinh data from:", url);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Không tìm thấy máy tính với mã ${maMay}.`);
                }
                throw new Error(`Lỗi HTTP: ${response.status}`);
            }

            const data = await response.json(); // Expecting MayTinhDTO
            console.log("Fetched MayTinh DTO:", data);

            setFormData({
                tenMay: data.tenMay || "", // Fallback for null
                trangThai: data.trangThai || "",
                moTa: data.moTa || "",
                maPhong: data.maPhong || null, // Use maPhong from DTO
                // Store original status if needed: originalTrangThai: data.trangThai || ""
            });
            // Clear note content initially
            setGhiChuNoiDung("");

        } catch (error) {
            console.error("Error fetching MayTinh:", error);
            setFetchError(`Có lỗi xảy ra khi tải dữ liệu máy tính: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchPhongMays = async () => {
        // setLoading(true); // Already handled by fetchMayTinhData's loading
        const token = localStorage.getItem("authToken");
        if (!token) return; // Error already handled

        try {
            // Assuming DTO is returned here too, adjust if needed
            const url = `https://localhost:8080/DSPhongMay?token=${token}`; // Use correct API path
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);
            const data = await response.json();
            setPhongMays(data || []); // Ensure it's an array
        } catch (error) {
            console.error("Error fetching phongMays:", error);
            // Optionally set a specific error for rooms or add to fetchError
            setFetchError(prev => prev ? `${prev}\nLỗi tải phòng máy: ${error.message}` : `Lỗi tải phòng máy: ${error.message}`);
        }
        // finally { setLoading(false); } // Handled by fetchMayTinhData
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handler for the new GhiChu input
    const handleGhiChuChange = (e) => {
        setGhiChuNoiDung(e.target.value);
    };

    const handleSelectChange = (value) => {
        setFormData({ ...formData, maPhong: value });
    };

    const handleSelectChangeTrangThai = (value) => {
        setFormData({ ...formData, trangThai: value });
        // Clear note content if status changes away from "Đã hỏng"
        if (value !== "Đã hỏng") {
            setGhiChuNoiDung("");
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        // Get maTK (for maTaiKhoanBaoLoi) from localStorage
        const maTKBaoLoi = localStorage.getItem("maTK"); // USE YOUR ACTUAL KEY

        if (!token) {
            Swal.fire("Lỗi", "Bạn chưa đăng nhập.", "error");
            setLoading(false);
            return;
        }

        if (!maTKBaoLoi) {
            Swal.fire("Lỗi", "Không tìm thấy mã người dùng (maTK) trong bộ nhớ cục bộ.", "error");
            setLoading(false);
            return;
        }


        // Basic validation
        if (!formData.tenMay || !formData.trangThai || !formData.moTa || !formData.maPhong) {
            Swal.fire("Lỗi", "Vui lòng điền đầy đủ thông tin bắt buộc (*).", "error");
            setLoading(false);
            return;
        }

        // --- Conditional Logic ---
        const isBroken = formData.trangThai === "Đã hỏng";

        if (isBroken && !ghiChuNoiDung.trim()) {
            Swal.fire("Lỗi", "Vui lòng nhập nội dung ghi chú khi trạng thái là 'Đã hỏng'.", "error");
            setLoading(false);
            return;
        }

        // --- API Call(s) ---
        try {
            // **Step 1: Update May Tinh (Always happens)**
            // Construct update URL - assuming CapNhatMayTinh only needs editable fields
            // NOTE: ngayLapDat should generally NOT be updated. Send only necessary fields.
            // Let's assume the backend @PutMapping for CapNhatMayTinh expects these params:
            const updateUrlParams = new URLSearchParams({
                maMay: maMay,
                tenMay: formData.tenMay,
                trangThai: formData.trangThai,
                moTa: formData.moTa,
                maPhong: formData.maPhong,
                token: token
            }).toString();
            const updateUrl = `https://localhost:8080/CapNhatMayTinh?${updateUrlParams}`;

            console.log("Submitting Update to URL:", updateUrl);
            const updateResponse = await fetch(updateUrl, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
            });

            console.log("Update Response status:", updateResponse.status);
            if (!updateResponse.ok) {
                let errorMessage = `Lỗi cập nhật máy tính: ${updateResponse.status}`;
                try { const errorData = await updateResponse.json(); errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`; } catch { /* ignore parsing error */ }
                throw new Error(errorMessage);
            }
            console.log("Máy tính cập nhật thành công.");

            // **Step 2: Create Ghi Chu (Only if status is 'Đã hỏng')**
            if (isBroken) {
                const ghiChuUrlParams = new URLSearchParams({
                    noiDung: ghiChuNoiDung,
                    maMay: maMay,
                    maPhong: formData.maPhong, // maPhong from the current form data
                    maTaiKhoanBaoLoi: maTKBaoLoi, // maTK from localStorage
                    token: token
                    // Do NOT include maTaiKhoanSuaLoi
                }).toString();
                const ghiChuUrl = `https://localhost:8080/LuuGhiChuMayTinh?${ghiChuUrlParams}`;

                console.log("Submitting Ghi Chu to URL:", ghiChuUrl);
                const ghiChuResponse = await fetch(ghiChuUrl, {
                    method: "POST", // Use POST for creating
                    headers: { "Content-Type": "application/json" }, // Adjust if backend expects form-data
                });

                console.log("Ghi Chu Response status:", ghiChuResponse.status);
                if (!ghiChuResponse.ok) {
                    let errorMessage = `Lỗi tạo ghi chú: ${ghiChuResponse.status}`;
                    try { const errorData = await ghiChuResponse.json(); errorMessage += ` - ${errorData.message || JSON.stringify(errorData)}`; } catch { /* ignore */ }
                    // Even if GhiChu fails, the computer update might have succeeded. Inform user.
                    Swal.fire("Cảnh báo", `Cập nhật máy tính thành công, nhưng không thể tạo ghi chú lỗi: ${errorMessage}`, "warning");
                    // Still navigate back as the main update succeeded
                    navigate("/MayTinh");
                    return; // Exit after warning
                }
                console.log("Ghi chú tạo thành công.");
            }

            // If all necessary steps completed successfully
            Swal.fire("Thành công", "Cập nhật máy tính thành công!", "success");
            navigate("/MayTinh");

        } catch (error) {
            console.error("Submission error:", error);
            Swal.fire("Lỗi", `Có lỗi xảy ra: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---
    if (fetchError) {
        return (
            <div className="lab-management-container">
                <Alert message="Lỗi Tải Dữ Liệu" description={fetchError} type="error" showIcon />
                <Button onClick={() => navigate("/MayTinh")} style={{ marginTop: '1rem' }}>Quay lại danh sách</Button>
            </div>
        );
    }

    if (loading && !formData.tenMay) { // Show spinner only during initial load
        return <div className="loading-container"><Spin size="large" /></div>;
    }


    return (
        <div className="lab-management-container">
            <div className="lab-header">
                <h1>Chỉnh Sửa Thông Tin Máy Tính</h1>
                <p>Cập nhật thông tin chi tiết về máy tính</p>
            </div>
            <div className="edit-form">
                <div className="form-title">
                    <h2>Thông Tin Máy Tính (Mã: {maMay})</h2>
                </div>
                <Form layout="vertical" onFinish={handleSubmit}> {/* Use onFinish if using Form methods */}
                    <Form.Item
                        label={<span>Tên máy tính <span className="required">*</span></span>}
                        required // Add Antd validation rule
                        rules={[{ required: true, message: 'Vui lòng nhập tên máy tính!' }]}
                    >
                        <Input
                            name="tenMay"
                            value={formData.tenMay}
                            onChange={handleInputChange}
                            placeholder="Nhập tên máy tính"
                        />
                    </Form.Item>

                    <Form.Item
                        label={<span>Trạng thái <span className="required">*</span></span>}
                        required
                        rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
                    >
                        <Select
                            value={formData.trangThai || undefined}
                            onChange={handleSelectChangeTrangThai}
                            placeholder="Chọn trạng thái"
                        >
                            {/* Make sure values match exactly what backend expects */}
                            <Option value="Đang hoạt động">Đang hoạt động</Option>
                            <Option value="Đã hỏng">Đã hỏng</Option>
                            <Option value="Không hoạt động">Không hoạt động</Option>
                            {/* Add other valid statuses if available */}
                        </Select>
                    </Form.Item>

                    {/* Conditionally render GhiChu input */}
                    {formData.trangThai === "Đã hỏng" && (
                        <Form.Item
                            label={<span>Nội dung ghi chú (Lý do hỏng) <span className="required">*</span></span>}
                            required={formData.trangThai === "Đã hỏng"} // Required only when shown
                            rules={[{ required: formData.trangThai === "Đã hỏng", message: 'Vui lòng nhập lý do hỏng!' }]}
                        >
                            <TextArea
                                name="ghiChuNoiDung" // Use separate state
                                value={ghiChuNoiDung}
                                onChange={handleGhiChuChange} // Use separate handler
                                rows={3}
                                placeholder="Mô tả lý do máy tính bị hỏng..."
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        label={<span>Mô tả <span className="required">*</span></span>}
                        required
                        rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
                    >
                        <TextArea
                            name="moTa"
                            value={formData.moTa}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Nhập mô tả chi tiết về máy tính"
                        />
                    </Form.Item>

                    {/* ngayLapDat is usually not editable after creation */}
                    {/* If it IS editable, add it back:
                     <Form.Item label="Ngày Lắp Đặt">
                         <DatePicker
                             value={formData.ngayLapDat}
                             onChange={handleDateChange}
                             format="DD/MM/YYYY" // Display format
                             style={{ width: '100%' }}
                             placeholder="Chọn ngày lắp đặt"
                             disabled // Typically disabled for edits
                         />
                     </Form.Item>
                     */}


                    <Form.Item
                        label={<span>Chọn Phòng Máy <span className="required">*</span></span>}
                        required
                        rules={[{ required: true, message: 'Vui lòng chọn phòng máy!' }]}
                    >
                        <Select
                            value={formData.maPhong || undefined}
                            onChange={handleSelectChange}
                            placeholder="Chọn Phòng Máy"
                            loading={loading && phongMays.length === 0} // Show loading only if rooms aren't loaded yet
                            showSearch // Optional: Allow searching rooms
                            optionFilterProp="children" // Search by displayed text
                            filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {/* Add a placeholder option if needed */}
                            {/* <Option value={null} disabled>Chọn Phòng Máy</Option> */}
                            {phongMays.map((phongMay) => (
                                // Ensure phongMay has maPhong and tenPhong
                                <Option key={phongMay.maPhong} value={phongMay.maPhong}>
                                    {phongMay.tenPhong || `Phòng ID: ${phongMay.maPhong}`} {/* Fallback display */}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item className="action-buttons">
                        <Space>
                            {/* Changed onClick to trigger form submission if using Form methods */}
                            <Button type="primary" className="save-button" onClick={handleSubmit} loading={loading} htmlType="button">
                                Cập nhật
                            </Button>
                            <Button onClick={() => navigate("/MayTinh")} disabled={loading}>Hủy</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}