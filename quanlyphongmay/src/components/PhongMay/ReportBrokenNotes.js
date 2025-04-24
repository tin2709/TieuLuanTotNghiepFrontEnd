// src/PhongMay/ReportBrokenNotes.js

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Layout, Button, Input, Form, Spin, Alert, message, Typography, Card
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ToolOutlined } from '@ant-design/icons'; // Added ToolOutlined
import Swal from 'sweetalert2';

// Assuming action.js defines these correctly relative to this file's usage
// If not, define them directly or adjust import path
const BROKEN_STATUS = 'Đã hỏng';
const ACTIVE_STATUS = 'Đang hoạt động';
const INACTIVE_STATUS = 'Không hoạt động';

const { Content, Header } = Layout;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography; // Use Typography components

// --- Reusable fetchApi (Keep as is from previous version - handles auth) ---
const fetchApi = async (url, options = {}, isPublic = false, navigateHook) => {
    const getToken = () => localStorage.getItem("authToken");
    const getRefreshToken = () => localStorage.getItem("refreshToken");
    const getExpiresAtTimestamp = () => localStorage.getItem("expireAt");
    const getMaTK = () => localStorage.getItem("maTK");

    const isTokenExpired = () => {
        const expiresAtTimestamp = getExpiresAtTimestamp();
        if (!expiresAtTimestamp) return true;
        const expiresAt = Number(expiresAtTimestamp);
        if (isNaN(expiresAt)) return true;
        return expiresAt <= Date.now();
    };

    const refreshTokenApi = async () => {
        const refreshTokenValue = getRefreshToken();
        const maTK = localStorage.getItem("maTK");
        if (!refreshTokenValue || !maTK) return false;
        try {
            const response = await fetch('https://localhost:8080/refreshtoken?' + new URLSearchParams({ refreshTokenValue, maTK }), { method: 'POST' });
            if (!response.ok) return false;
            const data = await response.json();
            if (data.token && data.refreshToken && data.expiresAtTimestamp) {
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('expireAt', data.expiresAtTimestamp);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Refresh token error:", error);
            return false;
        }
    };

    let currentToken = getToken();
    let isRefreshed = false;

    if (!isPublic && currentToken && isTokenExpired()) {
        const refreshSuccessful = await refreshTokenApi();
        if (refreshSuccessful) {
            currentToken = getToken();
            isRefreshed = true;
        } else {
            localStorage.clear();
            if (navigateHook) navigateHook('/login', { replace: true });
            Swal.fire({ title: "Phiên đăng nhập hết hạn", text: "Vui lòng đăng nhập lại.", icon: "warning", timer: 3000, showConfirmButton: false });
            throw new Error("Unauthorized - Refresh Failed");
        }
    }

    if (!currentToken && !isPublic) {
        if (!isRefreshed) {
            localStorage.clear();
            if (navigateHook) navigateHook('/login', { replace: true });
            Swal.fire("Lỗi Xác thực", "Vui lòng đăng nhập.", "error");
        }
        throw new Error("Unauthorized");
    }

    const defaultHeaders = { ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) };
    let urlWithToken = url;
    if (currentToken && !isPublic) {
        const separator = url.includes('?') ? '&' : '?';
        urlWithToken = `${url}${separator}token=${currentToken}`;
    }

    try {
        const response = await fetch(urlWithToken, { ...options, headers: { ...defaultHeaders, ...options.headers } });

        if (response.status === 401 && !isPublic) {
            localStorage.clear();
            if (navigateHook) navigateHook('/login', { replace: true });
            Swal.fire({ title: "Lỗi Xác thực", text: "Phiên đăng nhập không hợp lệ.", icon: "error", timer: 3000, showConfirmButton: false });
            throw new Error("Unauthorized - Invalid Token");
        }

        if (!response.ok && response.status !== 204) {
            let errorMsg = `Lỗi HTTP ${response.status}`;
            let errorData = null;
            try {
                errorData = await response.json();
                errorMsg = errorData.message || errorData.error || errorMsg;
            } catch (e) { /* Ignore JSON parsing error */ }
            console.error(`API Error (${response.status}) on ${url}: ${errorMsg}`, errorData);
            if (errorData?.message) { // Show specific backend message if available
                Swal.fire("Lỗi Máy Chủ", errorData.message, "error");
            } else {
                Swal.fire("Lỗi", `Đã xảy ra lỗi phía máy chủ (HTTP ${response.status}).`, "error");
            }
            throw new Error(errorMsg);
        }
        return response.status === 204 ? null : response; // Return null for 204 No Content
    } catch (networkError) {
        const isAuthError = networkError.message?.includes("Unauthorized");
        if (!isAuthError) {
            // Avoid duplicate Swal if it was already thrown by the HTTP error check
            if (!(networkError instanceof Error && networkError.message?.startsWith('Lỗi HTTP'))) {
                Swal.fire("Lỗi Mạng", `Không thể kết nối hoặc xử lý yêu cầu: ${networkError.message}`, "error");
            }
        }
        throw networkError; // Re-throw original error
    }
};

// --- Reusable performComputerStatusUpdate (Keep as is from previous version - logic is correct for this context) ---
const performComputerStatusUpdate = async (
    computersToUpdateFrom,
    attendanceKeys, // These are less relevant here but passed for consistency
    brokenReportKeys, // This is the key list driving the update on this page
    userRole,
    roomStatusForUpdate,
    navigateHook
) => {
    if (!Array.isArray(computersToUpdateFrom) || !Array.isArray(brokenReportKeys)) {
        console.error("Invalid input to performComputerStatusUpdate");
        throw new Error("Lỗi nội bộ: Dữ liệu cập nhật trạng thái không hợp lệ.");
    }

    // Filter based *only* on brokenReportKeys for this page's context
    const updates = computersToUpdateFrom
        .filter(comp => comp && brokenReportKeys.includes(comp.maMay))
        .map(comp => ({
            maMay: comp.maMay,
            newStatus: BROKEN_STATUS // Ensure status is set to BROKEN
        }))
        .filter(upd => {
            // Only include if the original status wasn't already BROKEN
            const originalComp = computersToUpdateFrom.find(c => c && c.maMay === upd.maMay);
            return originalComp && originalComp.trangThai !== BROKEN_STATUS;
        });

    if (updates.length === 0) {
        console.log("Không có máy tính nào cần cập nhật trạng thái thành 'Đã hỏng' (có thể chúng đã hỏng).");
        return { success: true, message: "Không có máy tính nào cần cập nhật trạng thái thành 'Đã hỏng'." };
    }

    try {
        const params = new URLSearchParams();
        updates.forEach(upd => {
            // Ensure values are valid before appending
            if (upd.maMay !== undefined && upd.newStatus !== undefined) {
                params.append('maMayTinhList', upd.maMay);
                params.append('trangThaiList', upd.newStatus);
            }
        });

        if (!params.toString()) {
            console.log("Không có dữ liệu cập nhật trạng thái hợp lệ.");
            return { success: true, message: "Không có thay đổi trạng thái hợp lệ." };
        }

        const url = `https://localhost:8080/CapNhatTrangThaiNhieuMay`;
        await fetchApi(`${url}?${params.toString()}`, { method: "PUT" }, false, navigateHook);
        return { success: true, count: updates.length };

    } catch (error) {
        // fetchApi shows Swal
        console.error("Lỗi khi cập nhật trạng thái máy tính:", error);
        throw new Error(`Lỗi cập nhật trạng thái: ${error.message}`); // Re-throw
    }
};


function ReportBrokenNotes() {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams(); // Room ID from URL
    const [form] = Form.useForm();

    // --- Safely access state passed from LabManagement ---
    const passedState = location.state || {};
    const {
        computersToReport = [], // Should contain ONLY computers marked for broken report
        roomName = 'Phòng không xác định',
        // Full context needed for the final status update API call
        originalComputerList = [],
        attendanceKeys = [],
        brokenReportKeys = [],
        userRole = null,
        roomStatusForUpdate = null,
    } = passedState;

    // --- Component State ---
    // No need for separate 'notes' state if using Form's state management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // For displaying API/process errors

    // --- Effects ---
    useEffect(() => {
        // Initialize form fields with empty strings when component loads
        if (Array.isArray(computersToReport) && computersToReport.length > 0) {
            const initialFormValues = {};
            computersToReport.forEach(comp => {
                if (comp && comp.maMay !== undefined && comp.maMay !== null) {
                    initialFormValues[String(comp.maMay)] = ''; // Ensure key is string for form
                }
            });
            form.setFieldsValue(initialFormValues);
        } else if (!location.state) {
            setError("Không tìm thấy dữ liệu cần thiết. Vui lòng quay lại trang quản lý.");
            console.error("location.state is missing!");
        } else if (!Array.isArray(computersToReport) || computersToReport.length === 0) {
            setError("Không có máy tính nào được chọn để báo hỏng.");
            console.error("computersToReport is empty or invalid:", computersToReport);
        }
    }, [computersToReport, form, location.state]); // Rerun if computersToReport changes

    // --- Input Validation Check ---
    const isValidInput = roomId && Array.isArray(computersToReport) && computersToReport.length > 0;

    // --- Early Return for Invalid State ---
    if (!isValidInput || error) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
                <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/phongmay')} style={{ marginRight: '16px' }} type="text" aria-label="Quay lại" />
                    <Title level={4} style={{ margin: 0 }}>Lỗi Dữ Liệu</Title>
                </Header>
                <Content style={{ padding: '30px', margin: '24px' }}>
                    <Card>
                        <Alert
                            message="Không thể tiếp tục"
                            description={error || "Dữ liệu đầu vào không hợp lệ hoặc thiếu thông tin. Vui lòng quay lại trang quản lý và thử lại."}
                            type="error"
                            showIcon
                        />
                        <Button onClick={() => navigate('/phongmay')} style={{ marginTop: '20px' }} icon={<ArrowLeftOutlined />}>
                            Quay lại Trang Quản Lý
                        </Button>
                    </Card>
                </Content>
            </Layout>
        );
    }

    // --- Form Submission Handler ---
    const handleSubmit = async (values) => { // 'values' object contains { 'maMay': 'note_text' }
        setError(null); // Clear previous errors
        setLoading(true);
        console.log("Form values submitted:", values);
        console.log("Context for status update:", { originalComputerList, attendanceKeys, brokenReportKeys, userRole, roomStatusForUpdate });

        try {
            // --- 1. Prepare and Save Notes ---
            const maTaiKhoanBaoLoi = localStorage.getItem("maTK"); // Use helper from fetchApi scope
            if (!maTaiKhoanBaoLoi) {
                // This should ideally be caught by fetchApi, but double-check
                throw new Error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
            }

            const maMayList = computersToReport.map(comp => comp.maMay);
            // Get notes from the validated 'values' object
            const noiDungList = maMayList.map(maMay => values[String(maMay)] || ''); // Ensure key is string

            // **Format for API based on backend requirements**
            // noiDung: "\"Note 1\",\"Note 2\"" (Escape inner quotes, wrap each, join with comma)
            const formattedNoiDung = noiDungList
                .map(note => `"${note.trim().replace(/"/g, '""')}"`) // Trim, escape quotes, wrap in quotes
                .join(','); // Join with comma
            // maMay: "1,2,3"
            const formattedMaMay = maMayList.join(',');

            // Basic check (though form validation should handle empty notes)
            if (!formattedNoiDung || !formattedMaMay) {
                throw new Error("Lỗi xử lý dữ liệu ghi chú hoặc mã máy.");
            }

            const notesParams = new URLSearchParams();
            notesParams.append('noiDung', formattedNoiDung);
            notesParams.append('maMay', formattedMaMay);
            notesParams.append('maPhong', roomId);
            notesParams.append('maTaiKhoanBaoLoi', maTaiKhoanBaoLoi);
            // maTaiKhoanSuaLoi is omitted (optional in backend)

            const notesUrl = `https://localhost:8080/LuuNhieuGhiChuMayTinh`;
            console.log("Attempting to save notes with params:", notesParams.toString());
            await fetchApi(notesUrl, { method: 'POST', body: notesParams, headers: {'Content-Type': 'application/x-www-form-urlencoded'} }, false, navigate); // Send as form data
            message.success(`Đã lưu ${computersToReport.length} ghi chú báo hỏng!`, 2.5);

            // --- 2. Update Computer Statuses ---
            console.log("Attempting to update computer statuses...");
            const statusUpdateResult = await performComputerStatusUpdate(
                originalComputerList,   // The full original list
                attendanceKeys,         // Original selection (less relevant here)
                brokenReportKeys,       // CRITICAL: List of machines to mark broken
                userRole,
                roomStatusForUpdate,
                navigate                // Pass navigate hook
            );

            if (statusUpdateResult.success && statusUpdateResult.count > 0) {
                message.success(`Đã cập nhật trạng thái ${statusUpdateResult.count} máy tính thành '${BROKEN_STATUS}'.`, 2.5);
            } else if (statusUpdateResult.success) {
                message.info(statusUpdateResult.message || `Không có trạng thái máy tính nào được thay đổi (có thể đã '${BROKEN_STATUS}' sẵn).`, 3);
            }
            // Errors from performComputerStatusUpdate are caught below

            // --- 3. Navigate Back on Full Success ---
            message.success("Hoàn tất báo hỏng!", 3);
            message.loading("Đang điều hướng trở lại...", 1.5); // Use loading indicator
            setTimeout(() => navigate('/phongmay', { replace: true }), 1500); // Navigate back to main list

        } catch (apiError) {
            console.error("Lỗi trong quá trình xử lý báo hỏng:", apiError);
            // Set error state to display in the Alert component
            setError(`Xử lý thất bại: ${apiError.message || 'Lỗi không xác định'}`);
            // Swal is likely shown by fetchApi already for API/network errors
        } finally {
            setLoading(false); // Ensure loading indicator stops
        }
    };

    // --- Render Component ---
    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* Improved Header */}
            <Header style={{
                background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', // Align items
                position: 'sticky', top: 0, zIndex: 10 // Sticky header
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/')}
                        style={{ marginRight: '20px' }} // Increased margin
                        type="text"
                        aria-label="Quay lại Trang Quản Lý"
                        disabled={loading}
                    />
                    {/* Prominent Title */}
                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                        <ToolOutlined style={{ marginRight: '10px' }} /> {/* Icon */}
                        Nhập Ghi Chú Báo Hỏng
                    </Title>
                </div>
                {/* Room Name Display (Subtle) */}
                <Text type="secondary" style={{ fontSize: '1rem' }}>Phòng: {roomName}</Text>
            </Header>

            {/* Content Area */}
            <Content style={{ padding: '24px', margin: '24px auto', maxWidth: '800px', width: '100%' }}>
                {/* Use Card for better grouping */}
                <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                    <Spin spinning={loading} tip="Đang lưu và cập nhật...">
                        {/* Display errors prominently */}
                        {error && (
                            <Alert
                                message="Đã xảy ra lỗi"
                                description={error}
                                type="error"
                                showIcon
                                closable
                                className="mb-6" // Margin bottom
                                onClose={() => setError(null)}
                            />
                        )}

                        <Paragraph style={{ marginBottom: '24px', fontSize: '1rem', color: '#555', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            Cung cấp mô tả chi tiết về lỗi cho các máy tính sau đã được chọn để báo hỏng:
                        </Paragraph>

                        {/* Form Section */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            autoComplete="off"
                        >
                            {computersToReport.map(computer => {
                                const isGV = (computer.moTa?.toLowerCase().includes('gv') || computer.moTa?.toLowerCase().includes('giáo viên'));
                                const displayName = (computer.tenMay || `Máy ${computer.maMay}`) + (isGV ? ' (GV)' : '');

                                return (
                                    <Form.Item
                                        key={computer.maMay}
                                        // Label with computer name
                                        label={<Text strong style={{ fontSize: '1.05rem', color: '#333' }}>{displayName}</Text>}
                                        // Name MUST match the key in 'values' object from onFinish
                                        name={String(computer.maMay)} // Use string key
                                        rules={[
                                            { required: true, message: `Vui lòng nhập ghi chú cho ${displayName}!` },
                                            { max: 255, message: 'Ghi chú không được vượt quá 255 ký tự!' }
                                        ]}
                                        style={{ marginBottom: '20px' }} // Spacing between items
                                    >
                                        <TextArea
                                            rows={3} // Slightly larger text area
                                            placeholder={`Mô tả lỗi chi tiết (ví dụ: màn hình xanh liên tục, không nhận bàn phím, chuột bị đơ...)`}
                                            disabled={loading}
                                            maxLength={255}
                                            showCount // Show character count
                                        />
                                    </Form.Item>
                                );
                            })}

                            {/* Action Buttons */}
                            <Form.Item style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                                <Button
                                    onClick={() => navigate('/')}
                                    style={{ marginRight: '12px' }}
                                    disabled={loading}
                                    icon={<ArrowLeftOutlined />}
                                >
                                    Hủy bỏ
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={loading}
                                    disabled={loading} // Disable only when loading
                                >
                                    Lưu Ghi Chú & Cập Nhật Trạng Thái
                                </Button>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Card>
            </Content>
        </Layout>
    );
}

export default ReportBrokenNotes;