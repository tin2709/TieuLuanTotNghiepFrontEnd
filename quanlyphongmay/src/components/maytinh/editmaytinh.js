// EditMayTinh.js
import React, { useState, useEffect } from "react";
import { Button, Input, Select, Form, Space, Spin, Alert } from "antd";
import Swal from "sweetalert2";
import "./style.css"; // Make sure this CSS file exists and is properly linked
import { useParams, useNavigate } from "react-router-dom";
import './style.css'

// --- Constants ---
const { Option } = Select;
const { TextArea } = Input;

// Roles (ensure these string values match exactly what's in localStorage)
const ROLE_ADMIN = '1';
const ROLE_STUDENT = '2';
const ROLE_TECHNICIAN = '3';

// API Base URL (replace with your actual API endpoint)
const API_BASE_URL = "https://localhost:8080"; // <<< Ensure this is correct for your backend

// --- Component ---
export default function EditMayTinh() {
    // --- State Variables ---
    const [loading, setLoading] = useState(true); // Start loading immediately
    const [fetchError, setFetchError] = useState(null);
    const [formData, setFormData] = useState({
        tenMay: "",
        trangThai: "",
        moTa: "",
        maPhong: null,
    });
    const [initialTrangThai, setInitialTrangThai] = useState("");
    const [ghiChuNoiDung, setGhiChuNoiDung] = useState("");
    const [initialGhiChu, setInitialGhiChu] = useState(""); // Store initial note content
    const [latestGhiChuData, setLatestGhiChuData] = useState(null); // Store latest fetched note data
    const [phongMays, setPhongMays] = useState([]);
    const { maMay } = useParams();
    const navigate = useNavigate();
    const userRole = localStorage.getItem("userRole");
    const currentUserMaTK = localStorage.getItem("maTK");
    const token = localStorage.getItem("authToken");

    // --- Effects ---
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setFetchError(null);

            if (!token || !currentUserMaTK || !userRole) {
                setFetchError("Thông tin đăng nhập không đầy đủ. Vui lòng đăng nhập lại.");
                setLoading(false);
                return;
            }

            try {
                // Fetch MayTinh Data
                await fetchMayTinhData();
                // Fetch PhongMay List
                await fetchPhongMays();
                // Fetch Latest GhiChu (needed regardless of status for potential updates)
                // This needs to run AFTER fetchMayTinhData so formData.tenMay is available for the fix message
                await fetchLatestGhiChu();

            } catch (error) {
                // fetchMayTinhData, fetchPhongMays, fetchLatestGhiChu already set specific errors
                // If multiple fail, the last one might overwrite, but it's better than not catching at all
                console.error("Initial data loading error:", error);
                // Check if a fetch error was already set by one of the fetch functions
                if (!fetchError) { // Only set if no specific fetch error occurred yet
                    setFetchError(`Lỗi tải dữ liệu ban đầu: ${error.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maMay, token, currentUserMaTK, userRole]); // Re-run if these key values change

    // --- Data Fetching Functions ---
    const fetchMayTinhData = async () => {
        console.log("Fetching MayTinh data for maMay:", maMay);
        try {
            const url = `${API_BASE_URL}/MayTinh?maMay=${maMay}&token=${token}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) throw new Error(`Không tìm thấy máy tính với mã ${maMay}.`);
                throw new Error(`Lỗi HTTP khi tải dữ liệu máy tính: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Fetched MayTinh DTO:", data);

            const currentTrangThai = data.trangThai || "";
            setFormData({
                tenMay: data.tenMay || "",
                trangThai: currentTrangThai,
                moTa: data.moTa || "",
                maPhong: data.maPhong || null,
            });
            setInitialTrangThai(currentTrangThai);

        } catch (error) {
            console.error("Error fetching MayTinh:", error);
            // Prepend error message if there was a previous one
            setFetchError(prev => prev ? `${prev}\nLỗi tải dữ liệu máy tính: ${error.message}` : `Lỗi tải dữ liệu máy tính: ${error.message}`);
            throw error; // Rethrow to be caught by the main loadData effect
        }
    };

    const fetchPhongMays = async () => {
        console.log("Fetching PhongMay list");
        try {
            const url = `${API_BASE_URL}/DSPhongMay?token=${token}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Lỗi HTTP khi tải phòng máy: ${response.status} ${response.statusText}`);
            const data = await response.json();
            setPhongMays(data || []);
            console.log("Fetched PhongMay list:", data);
        } catch (error) {
            console.error("Error fetching phongMays:", error);
            // Prepend error message if there was a previous one
            setFetchError(prev => prev ? `${prev}\nLỗi tải danh sách phòng máy: ${error.message}` : `Lỗi tải danh sách phòng máy: ${error.message}`);
            throw error; // Rethrow
        }
    };

    const fetchLatestGhiChu = async () => {
        console.log("Fetching latest GhiChu for maMay:", maMay);
        try {
            const url = `${API_BASE_URL}/GhiChuGanNhatTheoMayTinh?maMay=${maMay}&token=${token}`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched latest GhiChu:", data);
                setLatestGhiChuData(data);
                setGhiChuNoiDung(data.noiDung || ""); // Set initial note content from fetched data
                setInitialGhiChu(data.noiDung || ""); // Store initial note content
            } else if (response.status === 404) {
                console.log("No existing GhiChu found for this MayTinh (404).");
                setLatestGhiChuData(null); // Explicitly set to null if not found
                setGhiChuNoiDung("");
                setInitialGhiChu("");
            } else {
                // Handle other non-OK responses without stopping the main load flow
                const errorText = await response.text(); // Get error body for logging
                console.error(`Warning: Could not fetch latest GhiChu: ${response.status} ${response.statusText} - ${errorText}`);
                setLatestGhiChuData(null); // Treat as if no note exists if fetch failed
                setGhiChuNoiDung("");
                setInitialGhiChu("");
            }
        } catch (error) {
            console.error("Error fetching latest GhiChu:", error);
            // Don't set fetchError for this, as the main machine data is more critical unless ALL fetches fail.
            setLatestGhiChuData(null); // Treat as if no note exists on network error
            setGhiChuNoiDung("");
            setInitialGhiChu("");
            // Do NOT rethrow - fetching GhiChu is secondary to fetching MayTinh and Rooms
        }
    };


    // --- Input Handlers ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleGhiChuChange = (e) => setGhiChuNoiDung(e.target.value);
    const handleSelectChange = (value) => setFormData(prev => ({ ...prev, maPhong: value }));
    const handleSelectChangeTrangThai = (value) => {
        setFormData(prev => ({ ...prev, trangThai: value }));
        // Note: We don't clear ghiChuNoiDung here, the submit logic decides if it's used/updated.
    };

    // --- UI Logic Helper ---
    const isStatusDropdownDisabled = () => {
        // Disable while initial data is loading or error occurred
        if (loading || fetchError) return true;

        // Allow changing *from* "Đã hỏng" to something else ONLY for technicians
        if (initialTrangThai === "Đã hỏng" && userRole !== ROLE_TECHNICIAN) {
            // Student/Admin cannot change status away from broken state
            // Revert form state if they somehow managed to change it (shouldn't happen with disabled dropdown)
            if (formData.trangThai !== initialTrangThai) {
                setFormData(prev => ({ ...prev, trangThai: initialTrangThai }));
                // Consider showing a temporary message here?
            }
            return true; // Disable the dropdown
        }

        // Allow changing *to* "Đã hỏng" ONLY for Students or Admins (Technicians fix, don't report broken from working)
        if (initialTrangThai !== "Đã hỏng" && userRole === ROLE_TECHNICIAN) {
            // Technician cannot report a working machine as broken via this dropdown
            // Revert form state if they somehow managed to change it
            if (formData.trangThai === "Đã hỏng") {
                setFormData(prev => ({ ...prev, trangThai: initialTrangThai }));
                // Consider showing a temporary message here?
            }
            return true; // Disable the dropdown
        }

        // Otherwise, the dropdown is enabled (e.g., Student/Admin changing working/inactive,
        // Student/Admin reporting broken from working/inactive, Technician changing broken to working)
        return false;
    };

    // Determine if the GhiChu input should be editable
    const isGhiChuEditable = () => {
        // GhiChu is only relevant/editable if the CURRENT status is "Đã hỏng"
        // Also disabled if loading or error
        if (loading || fetchError || formData.trangThai !== "Đã hỏng") {
            return false;
        }

        // If the status IS "Đã hỏng", allow editing the note content.
        // This applies to Admin, Student (when reporting broken), Technician (if status is still broken)
        return true;
    };


    // --- Form Submission Handler ---
    const handleSubmit = async () => {
        setLoading(true);
        console.log("handleSubmit triggered. User Info:", { token: !!token, currentUserMaTK, userRole });
        console.log("Form Data:", formData);
        console.log("GhiChu Input:", ghiChuNoiDung);
        console.log("Initial Status:", initialTrangThai);
        console.log("Latest GhiChu Data (fetched):", latestGhiChuData); // Use the state variable

        if (!token || !currentUserMaTK || !userRole) {
            Swal.fire("Lỗi", "Phiên đăng nhập không hợp lệ hoặc thiếu thông tin người dùng. Vui lòng đăng nhập lại.", "error");
            setLoading(false);
            return;
        }

        // --- Form Validation ---
        // Trim whitespace from text fields for validation
        const tenMayTrimmed = formData.tenMay.trim();
        const moTaTrimmed = formData.moTa.trim();
        const ghiChuNoiDungTrimmed = ghiChuNoiDung.trim();


        if (!tenMayTrimmed || !formData.trangThai || !moTaTrimmed || formData.maPhong == null) {
            Swal.fire("Thiếu thông tin", "Vui lòng điền đầy đủ các trường bắt buộc (*).", "warning");
            setLoading(false);
            return;
        }

        const isNowBroken = formData.trangThai === "Đã hỏng";
        const wasInitiallyBroken = initialTrangThai === "Đã hỏng";

        // If current status is broken, the note content is required
        if (isNowBroken && !ghiChuNoiDungTrimmed) {
            Swal.fire("Thiếu thông tin", "Vui lòng nhập nội dung ghi chú (lý do hỏng) khi trạng thái là 'Đã hỏng'.", "warning");
            setLoading(false);
            return;
        }

        // --- End Validation ---


        try {
            // --- Prepare API Call Promises ---
            let updateGhiChuPromise = null;
            let createGhiChuPromise = null;
            // let deleteGhiChuPromise = null; // Option to delete note if fixing and no historical record is needed? (Not requested)

            // Prepare MayTinh update promise (always prepared if validation passes)
            const updateMayTinhParams = new URLSearchParams();
            // Only add fields that are potentially editable or required for update endpoint
            updateMayTinhParams.set('maMay', maMay);
            updateMayTinhParams.set('tenMay', tenMayTrimmed); // Use trimmed value
            updateMayTinhParams.set('trangThai', formData.trangThai);
            updateMayTinhParams.set('moTa', moTaTrimmed); // Use trimmed value
            if (formData.maPhong !== null && formData.maPhong !== undefined) {
                updateMayTinhParams.set('maPhong', formData.maPhong);
            } else {
                // This case should be caught by validation, but good defensive coding
                console.error("Attempting to update MayTinh with null maPhong after validation. This should not happen.");
                throw new Error("Lỗi nội bộ: Thiếu mã phòng máy.");
            }
            updateMayTinhParams.set('token', token);
            const updateMayTinhUrl = `${API_BASE_URL}/CapNhatMayTinh?${updateMayTinhParams.toString()}`;
            console.log("Preparing Update MayTinh:", updateMayTinhUrl);
            console.log("Update MayTinh Params:", Object.fromEntries(updateMayTinhParams));
            const updateMayTinhPromise = fetch(updateMayTinhUrl, { method: "PUT" });


            // --- Determine GhiChu action based on status change and role ---

            // SCENARIO 1: Status is currently "Đã hỏng"
            if (isNowBroken) {
                // If there was a previous note (whether initially broken or not), update it.
                // This covers cases where Admin/Student changes status TO broken when a historical note exists,
                // or any role updates note content while status is broken.
                if (latestGhiChuData) {
                    console.log("Scenario: Status is 'Đã hỏng'. Updating existing GhiChu.");
                    const updateGhiChuParams = new URLSearchParams();
                    updateGhiChuParams.set('maGhiChuMT', latestGhiChuData.maGhiChuMT);
                    updateGhiChuParams.set('noiDung', ghiChuNoiDungTrimmed); // Use current input content
                    updateGhiChuParams.set('maMay', maMay); // Use current maMay
                    updateGhiChuParams.set('maPhong', formData.maPhong); // Use current maPhong from form
                    updateGhiChuParams.set('maTaiKhoanBaoLoi', latestGhiChuData.maTaiKhoanBaoLoi); // Preserve original reporter
                    // Preserve original fixer if it exists. A new fixer is only set during a fix (status changes FROM broken).
                    if (latestGhiChuData.maTaiKhoanSuaLoi) {
                        updateGhiChuParams.set('maTaiKhoanSuaLoi', latestGhiChuData.maTaiKhoanSuaLoi);
                    }
                    updateGhiChuParams.set('token', token);

                    const updateGhiChuUrl = `${API_BASE_URL}/CapNhatGhiChuMayTinh?${updateGhiChuParams.toString()}`;
                    console.log("Preparing Update GhiChu (Status Đã hỏng):", updateGhiChuUrl);
                    console.log("PARAMS (Update Ghi chú Đã hỏng):", Object.fromEntries(updateGhiChuParams));
                    updateGhiChuPromise = fetch(updateGhiChuUrl, { method: "PUT" });

                } else {
                    // If no previous note and status is now broken, create a new one.
                    console.log("Scenario: Status is 'Đã hỏng'. Creating new Ghi chú.");
                    const createGhiChuParams = new URLSearchParams();
                    createGhiChuParams.set('noiDung', ghiChuNoiDungTrimmed); // Use current input content
                    createGhiChuParams.set('maMay', maMay);
                    createGhiChuParams.set('maPhong', formData.maPhong);
                    createGhiChuParams.set('maTaiKhoanBaoLoi', currentUserMaTK); // Current user is the reporter
                    // maTaiKhoanSuaLoi is initially null for a new report
                    createGhiChuParams.set('token', token);

                    const createGhiChuUrl = `${API_BASE_URL}/LuuGhiChuMayTinh?${createGhiChuParams.toString()}`;
                    console.log("Preparing Create Ghi chú:", createGhiChuUrl);
                    console.log("PARAMS (Create Ghi chú):", Object.fromEntries(createGhiChuParams));
                    createGhiChuPromise = fetch(createGhiChuUrl, { method: "POST" });
                }
            }

            // SCENARIO 2: Status is NOT currently "Đã hỏng" AND it WAS initially "Đã hỏng"
            else if (!isNowBroken && wasInitiallyBroken) {
                // This is the scenario where the machine status is changing away from broken.
                // This is primarily the "fixing" scenario.
                if (userRole === ROLE_TECHNICIAN && latestGhiChuData) {
                    console.log("Scenario: Technician fixing machine (status changing from Đã hỏng). Updating Ghi chú.");

                    // Note content for fixing scenario: "TenMay đã sửa xong"
                    const fixedNoteContent = `${formData.tenMay} đã sửa xong`; // Use current machine name

                    const updateGhiChuParams = new URLSearchParams();
                    updateGhiChuParams.set('maGhiChuMT', latestGhiChuData.maGhiChuMT);
                    updateGhiChuParams.set('noiDung', fixedNoteContent); // Programmatically set fix message
                    updateGhiChuParams.set('maMay', maMay); // Use current maMay
                    updateGhiChuParams.set('maPhong', formData.maPhong); // Use current maPhong from form
                    updateGhiChuParams.set('maTaiKhoanBaoLoi', latestGhiChuData.maTaiKhoanBaoLoi); // Preserve original reporter
                    updateGhiChuParams.set('maTaiKhoanSuaLoi', currentUserMaTK); // Set current user (Technician) as the fixer
                    updateGhiChuParams.set('token', token);

                    const updateGhiChuUrl = `${API_BASE_URL}/CapNhatGhiChuMayTinh?${updateGhiChuParams.toString()}`;
                    console.log("Preparing Update Ghi chú (Tech Fix):", updateGhiChuUrl);
                    console.log("PARAMS (Tech Fix):", Object.fromEntries(updateGhiChuParams));
                    updateGhiChuPromise = fetch(updateGhiChuUrl, { method: "PUT" });

                } else if (latestGhiChuData) {
                    // Machine was broken, status changed away, but not by a Technician fixing it.
                    // E.g., Admin changed status. We might not need a GhiChu update action here,
                    // as the fix note is specific to the technician workflow.
                    // The machine status update handles the primary state change.
                    console.log("Scenario: Status changed from Đã hỏng, but not a Technician fix. No specific Ghi chú update needed for the note content/fixer.");
                    // No GhiChu promise prepared in this specific sub-scenario
                } else {
                    // Machine was broken, status changed away, no GhiChu data found.
                    // This is unexpected if it was initially broken but possible with data inconsistencies.
                    console.warn("Scenario: Status changed from Đã hỏng, but no Ghi chú data found. Unexpected.");
                    // No GhiChu promise prepared.
                }
            }

            // SCENARIO 3: Status is NOT currently "Đã hỏng" AND it WAS NOT initially "Đã hỏng"
            // This means status is "Đang hoạt động" -> "Không hoạt động" or vice versa, or other fields changed.
            // In this case, no GhiChu action is needed related to breaking/fixing.
            // The MayTinh update handles the status/field changes.
            console.log("Scenario: Status was/is not 'Đã hỏng'. Only MayTinh update needed (unless GhiChu exists and user wants to update its content while status is broken, which is handled in SCENARIO 1).");
            // No GhiChu promise prepared in this scenario based on status change logic.
            // If the GhiChu input was visible and edited (meaning status *was* broken and user edited the note),
            // it falls under SCENARIO 1 (if status remains broken) or SCENARIO 2 (if status changes away).


            // --- Step 3: Execute API calls ---
            const promisesToRun = [updateMayTinhPromise, updateGhiChuPromise, createGhiChuPromise].filter(Boolean);
            console.log(`Executing ${promisesToRun.length} API call(s).`);
            if (promisesToRun.length === 0) {
                console.log("No relevant changes detected requiring API calls.");
                Swal.fire("Thông báo", "Không có thay đổi nào được thực hiện.", "info");
                setLoading(false);
                return; // Exit early if no changes needing API calls
            }

            const results = await Promise.allSettled(promisesToRun);
            console.log("API Call Results:", results);

            // --- Step 4: Process Results ---
            let errors = [];
            let mayTinhUpdateSuccess = false;


            // Helper function to get API identifier for logging/errors
            const getApiIdentifier = (promiseRef) => {
                if (promiseRef === updateMayTinhPromise) return "Cập nhật Máy Tính";
                if (promiseRef === updateGhiChuPromise) return "Cập nhật Ghi Chú";
                if (promiseRef === createGhiChuPromise) return "Tạo Ghi Chú";
                return "Unknown API";
            };

            // Process results using await within the loop for async error message parsing
            for (let i = 0; i < results.length; i++) {
                const currentResult = results[i];
                const promiseRef = promisesToRun[i];
                const apiIdentifier = getApiIdentifier(promiseRef);

                if (currentResult.status === 'fulfilled') {
                    const response = currentResult.value; // The Response object
                    if (response.ok) {
                        console.log(`API Call Success: ${apiIdentifier}`);
                        if (promiseRef === updateMayTinhPromise) mayTinhUpdateSuccess = true;
                    } else {
                        console.error(`API Call Failed (HTTP ${response.status}): ${apiIdentifier}`);
                        let message = `HTTP ${response.statusText || response.status}`;
                        try {
                            const errorBody = await response.json();
                            message = errorBody.message || JSON.stringify(errorBody);
                        } catch (parseError) {
                            console.error("Error parsing error response body:", parseError);
                            // Stick with status text if body parsing fails
                        }
                        errors.push(`Lỗi ${apiIdentifier} (${response.status}): ${message}`);
                    }
                } else {
                    // Promise was rejected (network error, etc.)
                    console.error(`API Call Rejected: ${apiIdentifier}`, currentResult.reason);
                    errors.push(`Lỗi ${apiIdentifier}: ${currentResult.reason?.message || 'Lỗi mạng hoặc hệ thống'}`);
                }
            }

            // --- Final User Feedback ---
            if (errors.length > 0) {
                const errorMsg = "Có lỗi xảy ra:\n" + errors.join("\n");
                if (mayTinhUpdateSuccess && errors.length < promisesToRun.length) {
                    // Partial success where MayTinh updated but others failed (e.g., GhiChu update failed)
                    // This is generally considered a success for the primary task (updating the machine)
                    Swal.fire("Cập nhật thành công (có cảnh báo)", `Thông tin máy tính đã được cập nhật. Tuy nhiên, có lỗi xảy ra với các thao tác khác (ví dụ: ghi chú):\n${errors.join("\n")}`, "warning");
                    // It's reasonable to navigate if the core item (MayTinh) was updated
                    navigate("/MayTinh");
                } else {
                    // All failed or only MayTinh failed
                    Swal.fire("Lỗi Cập Nhật", errorMsg, "error");
                    // Do not navigate, let the user see the error and potentially try again or fix input.
                }
            } else {
                // All succeeded
                Swal.fire("Thành công", "Cập nhật thông tin thành công!", "success");
                navigate("/MayTinh");
            }

        } catch (error) {
            console.error("General Submission Error:", error);
            Swal.fire("Lỗi Hệ Thống", `Có lỗi không mong muốn xảy ra trong quá trình xử lý: ${error.message}`, "error");
        } finally {
            setLoading(false);
        }
    };


    // --- Render ---
    // Remove the dynamic style injection code block. Rely on the CSS import.
    // const styleSheet = document.styleSheets[0];
    // if (styleSheet && !styleSheet.cssRules.some(rule => rule.selectorText === '.lab-management-container')) {
    // ... problematic code
    // }


    if (loading && !initialTrangThai && !fetchError) { // Show loading only initially, before any data is loaded
        return (
            <div className="loading-container">
                <Spin size="large" tip="Đang tải..." />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="lab-management-container">
                <Alert message="Lỗi Tải Dữ Liệu" description={fetchError} type="error" showIcon />
                <Button onClick={() => navigate("/MayTinh")} style={{ marginTop: '1rem' }}>
                    Quay lại danh sách
                </Button>
            </div>
        );
    }

    // Data is loaded, render the form
    return (
        <div className="lab-management-container">
            {/* Removed style jsx tag */}
            <div className="lab-header">
                <h1>Chỉnh Sửa Thông Tin Máy Tính</h1>
                <p>Cập nhật thông tin chi tiết và trạng thái lỗi (nếu có)</p>
            </div>
            <div className="edit-form">
                <div className="form-title">
                    <h2>Thông Tin Máy Tính (Mã: {maMay})</h2>
                </div>
                <Form layout="vertical">

                    {/* Tên máy tính Input */}
                    <Form.Item
                        label={<span>Tên máy tính <span className="required">*</span></span>}
                        required
                        validateStatus={!formData.tenMay.trim() ? 'error' : ''}
                        help={!formData.tenMay.trim() ? 'Vui lòng nhập tên máy tính!' : ''}
                    >
                        <Input
                            name="tenMay"
                            value={formData.tenMay}
                            onChange={handleInputChange}
                            placeholder="Nhập tên máy tính"
                            disabled={loading}
                        />
                    </Form.Item>

                    {/* Trạng thái Select Dropdown */}
                    <Form.Item
                        label={<span>Trạng thái <span className="required">*</span></span>}
                        required
                        validateStatus={!formData.trangThai ? 'error' : ''}
                        help={!formData.trangThai ? 'Vui lòng chọn trạng thái!' : ''}
                    >
                        <Select
                            value={formData.trangThai || undefined}
                            onChange={handleSelectChangeTrangThai}
                            placeholder="Chọn trạng thái"
                            disabled={isStatusDropdownDisabled() || loading}
                            style={{ width: '100%' }}
                        >
                            <Option value="Đang hoạt động">Đang hoạt động</Option>
                            <Option value="Đã hỏng">Đã hỏng</Option>
                            <Option value="Không hoạt động">Không hoạt động</Option>
                        </Select>
                        {/* Show disabled explanation text */}
                        {isStatusDropdownDisabled() && (
                            <p className="disabled-explanation-text">
                                {userRole === ROLE_STUDENT
                                    ? (initialTrangThai === "Đã hỏng" ? "Quyền của bạn không thể thay đổi trạng thái của máy đã được báo hỏng." : "Quyền của bạn không thể thay đổi trạng thái này.")
                                    : (initialTrangThai !== "Đã hỏng" ? "Quyền của bạn chỉ có thể thay đổi trạng thái của máy đã được báo hỏng." : "") // Tech can change FROM broken
                                }
                            </p>
                        )}
                    </Form.Item>

                    {/* Nội dung ghi chú (Lý do hỏng / Note) */}
                    {/* Show GhiChu input if status is currently broken OR if there was an initial note (for context) */}
                    {(formData.trangThai === "Đã hỏng" || initialGhiChu) && (
                        <Form.Item
                            label={<span>Nội dung ghi chú {formData.trangThai === "Đã hỏng" ? <span className="required">*</span> : '(Thông tin ghi chú gần nhất)'}</span>}
                            required={formData.trangThai === "Đã hỏng"}
                            validateStatus={formData.trangThai === "Đã hỏng" && !ghiChuNoiDung.trim() ? 'error' : ''}
                            help={formData.trangThai === "Đã hỏng" && !ghiChuNoiDung.trim() ? 'Vui lòng nhập lý do hỏng!' : ''}
                        >
                            <TextArea
                                name="ghiChuNoiDung"
                                value={ghiChuNoiDung}
                                onChange={handleGhiChuChange}
                                rows={3}
                                placeholder={formData.trangThai === "Đã hỏng" ? "Mô tả chi tiết lý do máy tính bị hỏng..." : "Ghi chú gần nhất..."}
                                disabled={!isGhiChuEditable()} // Control editability
                            />
                            {!isGhiChuEditable() && formData.trangThai === "Đã hỏng" && (
                                <p className="disabled-explanation-text">
                                    Ghi chú chỉ có thể chỉnh sửa khi trạng thái là "Đã hỏng".
                                </p>
                            )}
                        </Form.Item>
                    )}


                    {/* Mô tả TextArea */}
                    <Form.Item
                        label={<span>Mô tả <span className="required">*</span></span>}
                        required
                        validateStatus={!formData.moTa.trim() ? 'error' : ''}
                        help={!formData.moTa.trim() ? 'Vui lòng nhập mô tả!' : ''}
                    >
                        <TextArea
                            name="moTa"
                            value={formData.moTa}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Nhập mô tả chi tiết về máy tính (cấu hình, vị trí,...)"
                            disabled={loading}
                        />
                    </Form.Item>

                    {/* Chọn Phòng Máy Select Dropdown */}
                    <Form.Item
                        label={<span>Chọn Phòng Máy <span className="required">*</span></span>}
                        required
                        validateStatus={formData.maPhong === null || formData.maPhong === undefined ? 'error' : ''}
                        help={formData.maPhong === null || formData.maPhong === undefined ? 'Vui lòng chọn phòng máy!' : ''}
                    >
                        <Select
                            value={formData.maPhong || undefined}
                            onChange={handleSelectChange}
                            placeholder="Chọn Phòng Máy"
                            loading={loading && phongMays.length === 0}
                            showSearch
                            optionFilterProp="children"
                            filterOption={(input, option) =>
                                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            style={{ width: '100%' }}
                            disabled={loading} // Disable room select while loading
                        >
                            {phongMays.map((phongMay) => (
                                <Option key={phongMay.maPhong} value={phongMay.maPhong}>
                                    {phongMay.tenPhong || `Phòng ID: ${phongMay.maPhong}`}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* Action Buttons */}
                    <Form.Item className="action-buttons">
                        <Space>
                            <Button
                                type="primary"
                                className="save-button"
                                onClick={handleSubmit}
                                loading={loading}
                                htmlType="button" // Prevent form submission issues
                            >
                                {loading ? 'Đang xử lý...' : 'Cập nhật'}
                            </Button>
                            <Button onClick={() => navigate("/MayTinh")} disabled={loading}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}