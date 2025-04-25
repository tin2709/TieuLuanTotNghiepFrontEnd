// src/PhongMay/ReportBrokenDeviceNotes.js

import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Layout, Button, Input, Form, Spin, Alert, message, Typography, Card,
    Modal, List
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, ToolOutlined, SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
import Swal from 'sweetalert2';

// --- Import common errors ---
// Assuming commonErrors.js exports allErrorCategories and specific error lists like below:
/*
// Example src/PhongMay/commonErrors.js structure needed:

export const computerHardwareErrors = [ ... ];
export const softwareErrors = [ ... ];
export const projectorErrors = [ ... ];
export const acErrors = [ ... ];
export const fanErrors = [ ... ];
// ... other specific error lists

export const computerErrorCategories = [
    { category: "Lỗi Phần Cứng Máy Tính", errors: computerHardwareErrors },
    { category: "Lỗi Phần Mềm", errors: softwareErrors }
];

// *** This is the main list used by the component by default ***
export const allErrorCategories = [
    ...computerErrorCategories,
    { category: "Lỗi Máy chiếu", errors: projectorErrors },
    { category: "Lỗi Máy lạnh", errors: acErrors },
    { category: "Lỗi Quạt", errors: fanErrors }, // Consistent naming like "Lỗi Quạt"
    // Add other device categories here if needed
    // { category: "Lỗi Chung", errors: [...] } // A category for truly generic errors?
];
*/
import { allErrorCategories, projectorErrors, acErrors, fanErrors } from './commonErrors'; // Adjust path if needed

// --- Define Status Constants ---
const BROKEN_STATUS = 'Đã hỏng';

const { Content, Header } = Layout;
const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;

// --- Reusable fetchApi (Generic - Unchanged) ---
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
        // Adjust Content-Type header if body is URLSearchParams
        const finalHeaders = { ...defaultHeaders, ...options.headers };
        if (options.body instanceof URLSearchParams) {
            finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        }

        const response = await fetch(urlWithToken, { ...options, headers: finalHeaders });

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
            if (errorData?.message) {
                Swal.fire("Lỗi Máy Chủ", errorData.message, "error");
            } else {
                Swal.fire("Lỗi", `Đã xảy ra lỗi phía máy chủ (HTTP ${response.status}).`, "error");
            }
            throw new Error(errorMsg);
        }
        return response.status === 204 ? null : response;
    } catch (networkError) {
        const isAuthError = networkError.message?.includes("Unauthorized");
        if (!isAuthError) {
            if (!(networkError instanceof Error && networkError.message?.startsWith('Lỗi HTTP'))) {
                Swal.fire("Lỗi Mạng", `Không thể kết nối hoặc xử lý yêu cầu: ${networkError.message}`, "error");
            }
        }
        throw networkError;
    }
};

// --- Reusable performDeviceStatusUpdate (Adapted for Devices - Unchanged) ---
const performDeviceStatusUpdate = async (
    originalItemsFullList,
    initialBrokenReportKeys,
    navigateHook
) => {
    if (!Array.isArray(originalItemsFullList) || !Array.isArray(initialBrokenReportKeys)) {
        console.error("Invalid input to performDeviceStatusUpdate");
        throw new Error("Lỗi nội bộ: Dữ liệu cập nhật trạng thái thiết bị không hợp lệ.");
    }

    const updates = originalItemsFullList
        .filter(dev => dev && initialBrokenReportKeys.includes(dev.maThietBi))
        .map(dev => ({
            maThietBi: dev.maThietBi,
            newStatus: BROKEN_STATUS
        }))
        .filter(upd => {
            const originalDev = originalItemsFullList.find(d => d && d.maThietBi === upd.maThietBi);
            return originalDev && originalDev.trangThai !== BROKEN_STATUS;
        });

    if (updates.length === 0) {
        console.log("Không có thiết bị nào cần cập nhật trạng thái thành 'Đã hỏng' (có thể chúng đã hỏng).");
        return { success: true, message: "Không có thiết bị nào cần cập nhật trạng thái thành 'Đã hỏng'." };
    }

    try {
        const params = new URLSearchParams();
        updates.forEach(upd => {
            if (upd.maThietBi !== undefined && upd.newStatus !== undefined) {
                params.append('maThietBiList', upd.maThietBi);
                params.append('trangThaiList', upd.newStatus);
            }
        });

        if (!params.toString()) {
            console.log("Không có dữ liệu cập nhật trạng thái thiết bị hợp lệ.");
            return { success: true, message: "Không có thay đổi trạng thái thiết bị hợp lệ." };
        }

        const url = `https://localhost:8080/CapNhatTrangThaiNhieuThietBi`;
        await fetchApi(`${url}?${params.toString()}`, { method: "PUT" }, false, navigateHook);
        return { success: true, count: updates.length };

    } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái thiết bị:", error);
        throw new Error(`Lỗi cập nhật trạng thái thiết bị: ${error.message}`);
    }
};

// --- Helper Function to Infer Device Type from Name ---
// **NEW**: This function now returns the specific error list or null
const getSpecificErrorList = (deviceName) => {
    if (!deviceName) return null; // No specific errors if name is missing
    const lowerCaseName = deviceName.toLowerCase();
    if (lowerCaseName.includes('máy chiếu')) return [{ category: "Lỗi Máy chiếu", errors: projectorErrors }];
    if (lowerCaseName.includes('máy lạnh')) return [{ category: "Lỗi Máy lạnh", errors: acErrors }];
    if (lowerCaseName.includes('quạt')) return [{ category: "Lỗi Quạt", errors: fanErrors }]; // Ensure category name matches commonErrors.js
    // Add other specific types if needed
    // if (lowerCaseName.includes('chuột')) return [{ category: "Lỗi Chuột", errors: mouseErrors }];
    return null; // Return null if no specific type is matched
};


// --- Main Component ---
function ReportBrokenDeviceNotes() {
    const navigate = useNavigate();
    const location = useLocation();
    const { roomId } = useParams();
    const [form] = Form.useForm();

    // --- State Variables ---
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedItemForModal, setSelectedItemForModal] = useState(null); // Stores maThietBi
    const [searchTerm, setSearchTerm] = useState('');

    // --- Extract Data from Navigation State ---
    const passedState = location.state || {};
    const {
        reportType = 'unknown',
        itemsToReport = [],
        originalItemsFullList = [],
        roomName = 'Phòng không xác định',
        deviceTypeName = 'Thiết bị không xác định',
        deviceTypeId = null,
        initialSelectedKeys = [],
        initialBrokenReportKeys = [],
        userRole = null,
        roomStatusForUpdate = null,
    } = passedState;

    // --- Effect for Initialization and Validation (Unchanged) ---
    useEffect(() => {
        setError(null);
        if (reportType !== 'device') {
            setError("Loại báo cáo không hợp lệ. Dữ liệu bị thiếu hoặc sai.");
            console.error("Invalid reportType received:", reportType);
            return;
        }
        if (!roomId) {
            setError("Thiếu thông tin mã phòng. Không thể tiếp tục.");
            console.error("Missing roomId in params");
            return;
        }
        if (!Array.isArray(itemsToReport) || itemsToReport.length === 0) {
            setError("Không có thiết bị nào được chọn để báo hỏng.");
            console.error("itemsToReport is empty or invalid:", itemsToReport);
            return;
        }
        if (!Array.isArray(originalItemsFullList) || originalItemsFullList.length === 0) {
            setError("Thiếu danh sách thiết bị gốc, không thể cập nhật trạng thái.");
            console.error("originalItemsFullList is missing or empty");
            return;
        }
        if (!Array.isArray(initialBrokenReportKeys)) {
            setError("Thiếu thông tin về các thiết bị cần đánh dấu là hỏng.");
            console.error("initialBrokenReportKeys is missing or invalid");
            return;
        }

        const initialFormValues = {};
        itemsToReport.forEach(item => {
            if (item && item.maThietBi !== undefined && item.maThietBi !== null) {
                initialFormValues[String(item.maThietBi)] = '';
            }
        });
        form.setFieldsValue(initialFormValues);

    }, [reportType, itemsToReport, originalItemsFullList, initialBrokenReportKeys, form, roomId]);

    // Derived state: Check overall validity (Unchanged)
    const isValidInput = reportType === 'device' && roomId && Array.isArray(itemsToReport) && itemsToReport.length > 0 && Array.isArray(originalItemsFullList) && Array.isArray(initialBrokenReportKeys) && !error;

    // --- Memoized Calculation for Filtered Error Categories ---
    // **MODIFIED** to use getSpecificErrorList
    const filteredErrorCategories = useMemo(() => {
        let categoriesToShow = allErrorCategories; // Default to all categories

        // 1. Determine Base Categories Based on Selected Device Type
        if (selectedItemForModal !== null) {
            const selectedDevice = itemsToReport.find(item => item.maThietBi === selectedItemForModal);
            if (selectedDevice) {
                const specificList = getSpecificErrorList(selectedDevice.tenThietBi);
                if (specificList !== null) {
                    // If a specific list exists for this device type, use ONLY that list
                    console.log(`Device "${selectedDevice.tenThietBi}" matched specific type. Showing only its errors.`);
                    categoriesToShow = specificList;
                } else {
                    // If no specific list (generic device), keep using the full list
                    console.log(`Device "${selectedDevice.tenThietBi}" is generic. Showing all error categories.`);
                    categoriesToShow = allErrorCategories;
                }
            }
        } else {
            // If modal is not open, technically filtering isn't needed, but default is fine
            categoriesToShow = allErrorCategories;
        }


        // 2. Filter by Search Term (applied to the chosen category list)
        if (!searchTerm) {
            // If no search term, return the determined category list
            return categoriesToShow.map(category => ({
                ...category,
                errors: category.errors || [], // Ensure 'errors' array exists
            })).filter(category => category.errors.length > 0); // Ensure category has errors before showing
        }

        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        return categoriesToShow
            .map(category => ({
                ...category,
                // Filter errors within the category based on the search term
                errors: (category.errors || []).filter(err => // Safely access errors array
                    err.description.toLowerCase().includes(lowerCaseSearchTerm)
                ),
            }))
            .filter(category => category.errors.length > 0); // Only keep categories that have matching errors after search

    }, [searchTerm, selectedItemForModal, itemsToReport]); // Dependencies remain the same

    // --- Modal Handlers (Unchanged) ---
    const showModal = (maThietBi) => {
        console.log("Opening modal for device ID:", maThietBi);
        setSelectedItemForModal(maThietBi);
        setSearchTerm('');
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedItemForModal(null);
        setSearchTerm('');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleErrorSelect = (errorDescription) => {
        if (selectedItemForModal !== null) {
            form.setFieldsValue({
                [String(selectedItemForModal)]: errorDescription
            });
            message.success(`Đã chọn lỗi: "${errorDescription}"`, 1.5);
        } else {
            console.error("Error selection attempted without a selected item ID.");
        }
        handleCancel();
    };
    // --- End Modal Handlers ---

    // --- Early Return for Invalid Input or Errors (Unchanged) ---
    if (!isValidInput || error) {
        return (
            <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
                <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center' }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/phongmay')} style={{ marginRight: '16px' }} type="text" aria-label="Quay lại" />
                    <Title level={4} style={{ margin: 0 }}>Lỗi Dữ Liệu Báo Hỏng Thiết Bị</Title>
                </Header>
                <Content style={{ padding: '30px', margin: '24px' }}>
                    <Card>
                        <Alert
                            message="Không thể tiếp tục"
                            description={error || "Dữ liệu đầu vào không hợp lệ hoặc thiếu thông tin để báo hỏng thiết bị. Vui lòng quay lại trang quản lý và thử lại."}
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

    // --- Form Submission Handler (Unchanged) ---
    const handleSubmit = async (values) => {
        setError(null);
        setLoading(true);
        console.log("Form values submitted for devices:", values);
        console.log("Context: ", { originalItemsFullList, initialBrokenReportKeys });

        try {
            // --- Step 1: Save Device Notes ---
            const maTaiKhoanBaoLoi = localStorage.getItem("maTK");
            if (!maTaiKhoanBaoLoi) {
                throw new Error("Không thể xác định người dùng. Vui lòng đăng nhập lại.");
            }

            const maThietBiListCurrentPage = itemsToReport.map(item => item.maThietBi);
            const noiDungList = maThietBiListCurrentPage.map(maThietBi => values[String(maThietBi)] || '');

            const formattedNoiDung = noiDungList
                .map(note => `"${note.trim().replace(/"/g, '""')}"`)
                .join(',');
            const formattedMaThietBi = maThietBiListCurrentPage.join(',');

            if (!formattedNoiDung || !formattedMaThietBi) {
                throw new Error("Lỗi xử lý dữ liệu ghi chú hoặc mã thiết bị.");
            }

            const notesParams = new URLSearchParams();
            notesParams.append('noiDung', formattedNoiDung);
            notesParams.append('maThietBi', formattedMaThietBi);
            notesParams.append('maPhong', roomId);
            notesParams.append('maTaiKhoanBaoLoi', maTaiKhoanBaoLoi);

            const notesUrl = `https://localhost:8080/LuuNhieuGhiChuThietBi`;
            console.log("Attempting to save device notes with params:", notesParams.toString());

            await fetchApi(notesUrl, {
                method: 'POST',
                body: notesParams
            }, false, navigate);

            message.success(`Đã lưu ${itemsToReport.length} ghi chú báo hỏng thiết bị!`, 2.5);

            // --- Step 2: Update Device Statuses to 'Đã hỏng' ---
            console.log("Attempting to update device statuses based on initial report keys:", initialBrokenReportKeys);
            const statusUpdateResult = await performDeviceStatusUpdate(
                originalItemsFullList,
                initialBrokenReportKeys,
                navigate
            );

            if (statusUpdateResult.success && statusUpdateResult.count > 0) {
                message.success(`Đã cập nhật trạng thái ${statusUpdateResult.count} ${deviceTypeName || 'thiết bị'} thành '${BROKEN_STATUS}'.`, 2.5);
            } else if (statusUpdateResult.success) {
                message.info(statusUpdateResult.message || `Không có trạng thái ${deviceTypeName || 'thiết bị'} nào được thay đổi (có thể đã '${BROKEN_STATUS}' sẵn).`, 3);
            }

            // --- Step 3: Navigate Back on Full Success ---
            message.success("Hoàn tất báo hỏng thiết bị!", 3);
            message.loading("Đang điều hướng trở lại...", 1.5);
            setTimeout(() => navigate('/phongmay', { replace: true }), 1500);

        } catch (apiError) {
            console.error("Lỗi trong quá trình xử lý báo hỏng thiết bị:", apiError);
            setError(`Xử lý thất bại: ${apiError.message || 'Lỗi không xác định. Vui lòng thử lại.'}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Render Component (Layout Unchanged) ---
    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* Header (Unchanged) */}
            <Header style={{
                background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/phongmay')}
                        style={{ marginRight: '20px' }}
                        type="text"
                        aria-label="Quay lại Trang Quản Lý"
                        disabled={loading}
                    />
                    <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
                        <ToolOutlined style={{ marginRight: '10px' }} />
                        Nhập Ghi Chú Báo Hỏng Thiết Bị
                    </Title>
                </div>
                <Text type="secondary" style={{ fontSize: '1rem' }}>
                    Phòng: {roomName} - Loại: {deviceTypeName}
                </Text>
            </Header>

            {/* Content Area (Unchanged) */}
            <Content style={{ padding: '24px', margin: '24px auto', maxWidth: '800px', width: '100%' }}>
                <Card bordered={false} style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                    <Spin spinning={loading} tip="Đang lưu và cập nhật...">
                        {/* Error Alert (Unchanged) */}
                        {error && (
                            <Alert
                                message="Đã xảy ra lỗi"
                                description={error}
                                type="error"
                                showIcon
                                closable
                                style={{ marginBottom: '24px' }}
                                onClose={() => setError(null)}
                            />
                        )}

                        {/* Instructions Paragraph (Unchanged) */}
                        <Paragraph style={{ marginBottom: '24px', fontSize: '1rem', color: '#555', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            Cung cấp mô tả chi tiết về lỗi cho các thiết bị sau (hoặc chọn lỗi phổ biến):
                        </Paragraph>

                        {/* Form (Unchanged structure, uses updated showModal) */}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            autoComplete="off"
                        >
                            {itemsToReport.map(item => {
                                const displayName = item.tenThietBi || `${deviceTypeName || 'Thiết bị'} ${item.maThietBi}`;
                                return (
                                    <Form.Item
                                        key={item.maThietBi}
                                        label={
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                                <Text strong style={{ fontSize: '1.05rem', color: '#333' }}>
                                                    {displayName}
                                                </Text>
                                                <Button
                                                    type="dashed"
                                                    icon={<UnorderedListOutlined />}
                                                    onClick={() => showModal(item.maThietBi)} // Calls updated showModal
                                                    size="small"
                                                    disabled={loading}
                                                    aria-label={`Chọn lỗi phổ biến cho ${displayName}`}
                                                >
                                                    Chọn Lỗi
                                                </Button>
                                            </div>
                                        }
                                        name={String(item.maThietBi)}
                                        rules={[
                                            { required: true, message: `Vui lòng nhập ghi chú hoặc chọn lỗi cho ${displayName}!` },
                                            { max: 255, message: 'Ghi chú không được vượt quá 255 ký tự!' }
                                        ]}
                                        style={{ marginBottom: '20px' }}
                                    >
                                        <TextArea
                                            rows={3}
                                            placeholder={`Mô tả lỗi chi tiết (ví dụ: máy chiếu mờ, quạt kêu to, máy lạnh không lạnh...) hoặc nhấn nút 'Chọn Lỗi'`}
                                            disabled={loading}
                                            maxLength={255}
                                            showCount
                                        />
                                    </Form.Item>
                                );
                            })}

                            {/* Form Buttons (Unchanged) */}
                            <Form.Item style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                                <Button
                                    onClick={() => navigate('/phongmay')}
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
                                    disabled={loading || !isValidInput}
                                >
                                    Lưu Ghi Chú & Cập Nhật Trạng Thái
                                </Button>
                            </Form.Item>
                        </Form>
                    </Spin>
                </Card>
            </Content>

            {/* Modal (Unchanged structure, uses updated filteredErrorCategories) */}
            <Modal
                title={<><UnorderedListOutlined style={{ marginRight: 8 }} /> Chọn Lỗi Phổ Biến</>}
                visible={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                width={600}
                destroyOnClose
                bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }}
            >
                {/* Search Input (Unchanged) */}
                <Input
                    placeholder="Tìm kiếm lỗi..."
                    prefix={<SearchOutlined />}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{ marginBottom: '20px' }}
                    allowClear
                />

                {/* No Results Message (Uses updated logic) */}
                {filteredErrorCategories.length === 0 && (
                    <Text type="secondary">
                        {searchTerm
                            ? `Không tìm thấy lỗi phù hợp với "${searchTerm}".`
                            : `Không có lỗi phổ biến được định nghĩa cho loại thiết bị này hoặc không có lỗi nào được tìm thấy.`}
                    </Text>
                )}

                {/* Error List (Uses updated filteredErrorCategories) */}
                {filteredErrorCategories.map(category => (
                    <div key={category.category} style={{ marginBottom: '15px' }}>
                        <Title level={5} style={{ marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '5px' }}>
                            {category.category}
                        </Title>
                        <List
                            size="small"
                            dataSource={category.errors} // Uses filtered errors
                            renderItem={item => (
                                <List.Item
                                    key={item.id || item.description} // Use ID or description as key
                                    onClick={() => handleErrorSelect(item.description)}
                                    style={{ cursor: 'pointer', padding: '8px 12px' }}
                                    className="error-list-item"
                                >
                                    {item.description}
                                </List.Item>
                            )}
                        />
                    </div>
                ))}
            </Modal>
            {/* --- End Modal --- */}

            {/* Hover Style (Unchanged) */}
            <style jsx global>{`
                .error-list-item:hover {
                    background-color: #f0f8ff; /* Light blue hover */
                }
            `}</style>
        </Layout>
    );
}

// Export Component (Unchanged)
export default ReportBrokenDeviceNotes;