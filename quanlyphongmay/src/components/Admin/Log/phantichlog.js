/* global gapi, google */ // Keep these global hints

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Layout,
    Button as AntButton,
    Upload,
    message,
    Typography,
    Spin,
    Progress,
    Popover,
    Card,
    Divider,
    Skeleton // Import Skeleton
} from 'antd';
import {
    UploadOutlined,
    AreaChartOutlined,
    FileTextOutlined,
    CheckCircleOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    BugOutlined,
    AlertOutlined,
    LineChartOutlined,
    UserOutlined,
    ExclamationCircleOutlined,
    // GoogleOutlined, // Icon no longer needed for commented-out feature
    // CloudUploadOutlined // Icon no longer needed for commented-out feature
} from '@ant-design/icons';
import Swal from 'sweetalert2';
import { Header } from "antd/es/layout/layout";
import { useNavigate } from "react-router-dom";
import SidebarAdmin from '../Sidebar/SidebarAdmin';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;

// !! Ensure this is the correct URL !!
const API_BASE_URL = "https://localhost:8080";

// --- Google Cloud Credentials (COMMENTED OUT - Kept as in original) ---
// const GOOGLE_CLIENT_ID = "949742994648-e80qvh48sfqep0volluc8s3r59d5bb0u.apps.googleusercontent.com";
// const GOOGLE_API_KEY = "AIzaSyCzDvZQZ4e-W-Dul0ZpjMxFQWzGj4ZuYc"; // <-- API Key from the second image
// const GOOGLE_SCOPES = [
//     'https://www.googleapis.com/auth/drive.file',
//     'https://www.googleapis.com/auth/drive.readonly'
// ];
// --- END Google Cloud Credentials ---


// Helper functions remain the same
const formatActionPerformance = (perf) => {
    if (!perf) return "Không có dữ liệu hiệu suất.";
    const parts = [];
    if (perf.hasOwnProperty('Error')) parts.push(<><Text strong type="danger">Lỗi:</Text> {perf.Error}</>);
    if (perf.hasOwnProperty('Success')) parts.push(<>Thành công: {perf.Success}</>);
    if (perf.hasOwnProperty('false')) parts.push(<><Text strong type="warning">Không đăng nhập:</Text> {perf.false}</>);
    if (perf.hasOwnProperty('true')) parts.push(`Đăng nhập thành công: ${perf.true}`);
    if (perf.hasOwnProperty('unrecognized_status')) parts.push(`Trạng thái không rõ: ${perf.unrecognized_status}`);
    return parts.map((part, index) => (
        <React.Fragment key={index}>
            {part}{index < parts.length - 1 ? ', ' : ''}
        </React.Fragment>
    ));
};

const formatUserPeaks = (userPeaks) => {
    if (!userPeaks || userPeaks.length === 0) return "Không có chi tiết user.";
    return userPeaks.map(peak => {
        if (!peak || !peak.username || peak.peakCount === undefined) return null;
        const timestampText = peak.peakTimestamp ? ` (Khoảng ${peak.peakTimestamp})` : '';
        return `${peak.username}: tối đa ${peak.peakCount} lần${timestampText}`;
    }).filter(item => item !== null).join('; ');
};

const AnalysisResultDisplay = ({ result }) => {
    const { summary, errors_by_type = {}, warningSummary, conclusion } = result || {};

    if (!summary && !errors_by_type && !warningSummary && !conclusion) {
        return <Paragraph type="warning">Không có dữ liệu phân tích chi tiết được trả về.</Paragraph>;
    }

    const {
        total_lines = 0, date_lines = 0, detail_lines = 0, summary_lines = 0, error_count = 0,
        users_active = [], actions_summary = {},
        access_denied_count = 0, optimistic_lock_count = 0, duplicate_entry_count = 0,
        null_or_transient_value_error_count = 0, tang_not_found_count = 0,
        multiple_bag_fetch_error_count = 0, jwt_error_count = 0, other_errors_count = 0,
        repeated_action_warnings = [],
    } = summary || {};


    const notableErrorList = [];
    if (access_denied_count > 0) notableErrorList.push(`Truy cập bị từ chối: ${access_denied_count} lần.`);
    if (jwt_error_count > 0) notableErrorList.push(`Lỗi JWT: ${jwt_error_count} lần.`);
    if (optimistic_lock_count > 0) notableErrorList.push(`Optimistic Lock: ${optimistic_lock_count} lần.`);
    if (null_or_transient_value_error_count > 0) notableErrorList.push(`Giá trị null/Transient: ${null_or_transient_value_error_count} lần.`);
    if (duplicate_entry_count > 0) notableErrorList.push(`Dữ liệu trùng lặp: ${duplicate_entry_count} lần.`);
    if (tang_not_found_count > 0) notableErrorList.push(`Tang không tìm thấy (maTang: 0): ${tang_not_found_count} lần.`);
    if (multiple_bag_fetch_error_count > 0) notableErrorList.push(`Multiple Bag Fetch: ${multiple_bag_fetch_error_count} lần.`);
    if (other_errors_count > 0) notableErrorList.push(`Lỗi không phân loại khác: ${other_errors_count} lần.`);

    const notableErrorString = notableErrorList.join(', ');


    return (
        <div>
            <Title level={4} style={{ color: 'green' }}><CheckCircleOutlined /> Kết Quả Phân Tích Log</Title>

            {/* 1. Tổng Quan Log (Enhanced) */}
            <Card size="small" title={<><InfoCircleOutlined /> Tổng Quan Log</>} style={{ marginBottom: 16 }}>
                {summary ? (
                    <Paragraph>
                        Log ghi nhận tổng cộng <Text strong>{total_lines}</Text> dòng.
                        {detail_lines > 0 && <> Trong đó có <Text strong>{detail_lines}</Text> dòng chi tiết được phân tích thành công.</>}
                        {date_lines > 0 && <> Gồm <Text strong>{date_lines}</Text> dòng chỉ chứa thông tin ngày.</>}
                        {summary_lines > 0 && <> Và <Text strong>{summary_lines}</Text> dòng tóm tắt.</>}
                    </Paragraph>
                ) : (
                    <Paragraph type="secondary">Không có dữ liệu tổng quan log.</Paragraph>
                )}
            </Card>


            {/* 2. Tóm Tắt Lỗi Chính (Formatted as per example) */}
            {(error_count > 0) || Object.keys(errors_by_type).length > 0 ? (
                <Card size="small" title={<><BugOutlined /> Tóm Tắt Lỗi Chính</>} style={{ marginBottom: 16 }} type="danger">
                    {error_count > 0 && (
                        <Paragraph>Tổng số lỗi được phát hiện: <Text strong type="danger">{error_count}</Text> lần.</Paragraph>
                    )}

                    {Object.keys(errors_by_type).length > 0 && (
                        <>
                            <Paragraph>Phân loại lỗi chi tiết:</Paragraph>
                            <ul>
                                {Object.entries(errors_by_type)
                                    .sort(([errorType, countA], [, countB]) => countB - countA)
                                    .map(([errorType, count]) => (
                                        count > 0 && (
                                            <li key={errorType}>
                                                <Text strong type={count > 10 ? 'danger' : count > 0 ? 'warning' : 'secondary'}>
                                                    {errorType}: {count} lần.
                                                </Text>
                                            </li>
                                        )
                                    ))}
                            </ul>
                        </>
                    )}

                    {notableErrorList.length > 0 && (
                        <Paragraph>
                            <Text strong>Lỗi đáng chú ý:</Text> {notableErrorString}
                        </Paragraph>
                    )}

                    {error_count > 0 && (
                        <Paragraph type="secondary">
                            <ExclamationCircleOutlined /> Nên xem xét các lỗi được liệt kê để xác định nguyên nhân và cải thiện độ ổn định của hệ thống.
                        </Paragraph>
                    )}
                </Card>
            ) : (
                summary && error_count === 0 && Object.keys(errors_by_type).length === 0 ? (
                    <Card size="small" title={<><BugOutlined /> Tóm Tắt Lỗi Chính</>} style={{ marginBottom: 16 }} type="success">
                        <Paragraph><CheckCircleOutlined /> Không tìm thấy lỗi đáng kể trong log được phân tích.</Paragraph>
                    </Card>
                ) : (
                    <Card size="small" title={<><BugOutlined /> Tóm Tắt Lỗi Chính</>} style={{ marginBottom: 16 }}>
                        <Paragraph type="secondary">Không có dữ liệu lỗi được phân tích.</Paragraph>
                    </Card>
                )
            )}


            {/* 3. Cảnh báo Hành Động Lặp Lại Nhanh (Detail from warningSummary or raw list from summary) */}
            {warningSummary && (warningSummary.totalWarnings || 0) > 0 ? (
                    <Card size="small" title={<><AlertOutlined /> Cảnh báo Hành Động Lặp Lại Nhanh (Chi Tiết)</>} style={{ marginBottom: 16 }} type={(warningSummary.totalWarnings || 0) > 50 ? 'danger' : 'warning'}>
                        <Paragraph>
                            Có <Text strong type={(warningSummary.totalWarnings || 0) > 50 ? 'danger' : 'warning'}>{(warningSummary.totalWarnings || 0)}</Text> cảnh báo về hành động lặp lại nhanh bất thường trong khoảng thời gian ngắn.
                        </Paragraph>
                        <Paragraph type="secondary">
                            <ExclamationCircleOutlined /> Hành vi này có thể chỉ ra sự cố giao diện người dùng, bot, hoặc các hoạt động đáng ngờ khác.
                        </Paragraph>

                        {warningSummary.actionSummaries?.length > 0 && (
                            <>
                                <Paragraph>Chi tiết các hành động có cảnh báo lặp lại:</Paragraph>
                                <ul>
                                    {warningSummary.actionSummaries.map((actionSum, index) => (
                                        actionSum && actionSum.action && (actionSum.totalForAction || 0) > 0 ? (
                                            <li key={actionSum.action || index} style={{ marginBottom: 8 }}>
                                                Hành động '<Text code>{actionSum.action}</Text>': Tổng cộng <Text strong>{actionSum.totalForAction}</Text> cảnh báo.
                                                {actionSum.userPeaks?.length > 0 && (
                                                    <Paragraph style={{ marginLeft: 15, fontStyle: 'italic', color: '#555' }}>
                                                        Users có tần suất lặp lại cao nhất: {formatUserPeaks(actionSum.userPeaks)}
                                                    </Paragraph>
                                                )}
                                            </li>
                                        ) : null
                                    ))}
                                </ul>
                            </>
                        )}

                        {warningSummary.usersWithWarnings?.length > 0 && (
                            <Paragraph>
                                <Text strong>Các user có cảnh báo lặp lại:</Text> <Text code>{warningSummary.usersWithWarnings.join(', ')}</Text>.
                            </Paragraph>
                        )}

                    </Card>
                )
                : repeated_action_warnings && repeated_action_warnings.length > 0 ? (
                        <Card size="small" title={<><AlertOutlined /> Cảnh báo Hành Động Lặp Lại Nhanh (Raw)</>} style={{ marginBottom: 16 }} type={repeated_action_warnings.length > 50 ? 'danger' : 'warning'}>
                            <Paragraph>
                                Phát hiện <Text strong type={repeated_action_warnings.length > 50 ? 'danger' : 'warning'}>{repeated_action_warnings.length}</Text> cảnh báo về hành động lặp lại nhanh bất thường trong khoảng thời gian ngắn.
                            </Paragraph>
                            <Paragraph type="secondary">
                                <ExclamationCircleOutlined /> Hành vi này có thể chỉ ra sự cố giao diện người dùng, bot, hoặc các hoạt động đáng ngờ khác.
                            </Paragraph>
                            <Paragraph style={{ fontStyle: 'italic', color: '#555' }}>
                                Chi tiết:
                                <ul>
                                    {repeated_action_warnings.slice(0, 10).map((warning, index) => (
                                        <li key={index}><Text type="secondary" code>{warning}</Text></li>
                                    ))}
                                    {repeated_action_warnings.length > 10 && <Text type="secondary">...và còn {repeated_action_warnings.length - 10} cảnh báo khác. Xem log gốc để biết thêm chi tiết.</Text>}
                                </ul>
                            </Paragraph>
                        </Card>
                    )
                    : (
                        <Card size="small" title={<><AlertOutlined /> Cảnh báo Hành Động Lặp Lại Nhanh</>} style={{ marginBottom: 16 }}>
                            <Paragraph>Không tìm thấy cảnh báo hành động lặp lại nhanh trong log.</Paragraph>
                        </Card>
                    )}


            {/* 4. Tóm Tắt Hiệu Suất của Các Hành Động Cụ Thể */}
            {actions_summary && Object.keys(actions_summary).length > 0 ? (
                <Card size="small" title={<><LineChartOutlined /> Tóm Tắt Hiệu Suất của Các Hành Động Cụ Thể</>} style={{ marginBottom: 16 }}>
                    <ul>
                        {Object.entries(actions_summary)
                            .sort(([nameA, perfA], [nameB, perfB]) => {
                                const totalA = (perfA?.Success || 0) + (perfA?.Error || 0) + (perfA?.true || 0) + (perfA?.false || 0) + (perfA?.unrecognized_status || 0);
                                const totalB = (perfB?.Success || 0) + (perfB?.Error || 0) + (perfB?.true || 0) + (perfB?.false || 0) + (perfB?.unrecognized_status || 0);
                                const errorA = perfA?.Error || 0;
                                const errorB = perfB?.Error || 0;
                                if (errorB !== errorA) return errorB - errorA;
                                if (totalB !== totalA) return totalB - totalA;
                                return nameA.localeCompare(nameB);
                            })
                            .map(([action, performance]) => (
                                <li key={action}><Text code>{action}</Text>: {formatActionPerformance(performance)}.</li>
                            ))}
                    </ul>
                </Card>
            ) : (
                <Card size="small" title={<><LineChartOutlined /> Tóm Tắt Hiệu Suất của Các Hành Động Cụ Thể</>} style={{ marginBottom: 16 }}>
                    <Paragraph>Không có dữ liệu hiệu suất chi tiết cho các hành động.</Paragraph>
                </Card>
            )}


            {/* 5. Hoạt Động Người Dùng */}
            {summary && users_active?.length > 0 ? (
                <Card size="small" title={<><UserOutlined /> Hoạt Động Người Dùng</>} style={{ marginBottom: 16 }}>
                    <Paragraph>
                        Có <Text strong>{users_active.length}</Text> người dùng khác nhau có hoạt động được ghi lại trong log.
                        Danh sách: <Text code>{users_active.join(', ')}</Text>.
                    </Paragraph>
                </Card>
            ) : (
                <Card size="small" title={<><UserOutlined /> Hoạt Động Người Dùng</>} style={{ marginBottom: 16 }}>
                    <Paragraph>Không tìm thấy hoạt động người dùng chi tiết.</Paragraph>
                </Card>
            )}


            {/* 6. Kết luận chi tiết (New Section) */}
            {conclusion && typeof conclusion === 'string' && conclusion.trim() !== '' ? (
                <Card size="small" title={<><InfoCircleOutlined /> Kết luận chi tiết</>} style={{ marginBottom: 16 }}>
                    <Paragraph>{conclusion}</Paragraph>
                </Card>
            ) : (
                <Card size="small" title={<><InfoCircleOutlined /> Kết luận chi tiết</>} style={{ marginBottom: 16 }}>
                    <Paragraph>Không có kết luận chi tiết được cung cấp.</Paragraph>
                </Card>
            )}

        </div>
    );
};


const PhanTichLog = () => {
    // State variables
    const [selectedFile, setSelectedFile] = useState(null);
    // --- Google Drive State (COMMENTED OUT) ---
    // const [selectedDriveFile, setSelectedDriveFile] = useState(null);
    // const [isGoogleServicesReady, setIsGoogleServicesReady] = useState(false);
    // const [googleAccessToken, setGoogleAccessToken] = useState(null);
    // --- END Google Drive State ---

    // States related to analysis process
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false); // Covers upload and analysis time
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    const [collapsed, setCollapsed] = useState(false);

    const navigate = useNavigate();

    // --- Google Drive Refs (COMMENTED OUT) ---
    // const tokenClientRef = useRef(null);
    // const gsiScriptLoadedRef = useRef(false);
    // const gapiScriptLoadedRef = useRef(false);
    // const gapiClientPickerReadyRef = useRef(false);
    // const tokenClientInitializedRef = useRef(false);
    // --- END Google Drive Refs ---


    // Ref to hold the latest state setters/values/functions needed by global callbacks (modified)
    const componentRefs = useRef({
        // setIsGoogleServicesReady: setIsGoogleServicesReady, // Commented out Google
        // setGoogleAccessToken: setGoogleAccessToken,       // Commented out Google
        setIsProcessing: setIsProcessing,
        // setSelectedDriveFile: setSelectedDriveFile,       // Commented out Google
        setAnalysisResult: setAnalysisResult,
        setError: setError,
        setUploadProgress: setUploadProgress,
        message: message, // AntD message instance
        Swal: Swal,     // SweetAlert2 instance
        // handleOpenPicker: null, // Commented out Google
        // pickerCallback: null,   // Commented out Google
        // gsiScriptLoadedRef: gsiScriptLoadedRef, // Commented out Google
        // gapiScriptLoadedRef: gapiScriptLoadedRef, // Commented out Google
        // gapiClientPickerReadyRef: gapiClientPickerReadyRef, // Commented out Google
        // tokenClientInitializedRef: tokenClientInitializedRef, // Commented out Google
    });


    // --- Google Drive Callbacks (COMMENTED OUT - Kept as in original) ---
    // const pickerCallback = useCallback((data) => { ... }, []);
    // const handleOpenPicker = useCallback((accessTokenToUse) => { ... }, []);
    // --- END Google Drive Callbacks ---


    // Define other handlers
    const handleFileChange = (info) => {
        // --- Google Drive Logic (COMMENTED OUT) ---
        // setSelectedDriveFile(null); // Clear Drive file selection when a local file is selected
        // --- END Google Drive Logic ---
        setAnalysisResult(null);
        setError(null);
        setUploadProgress(0);

        let newFileList = [...info.fileList];
        newFileList = newFileList.slice(-1);

        const file = newFileList[0]?.originFileObj;

        if (file) {
            const isLogOrText = file.type === 'text/plain' || file.name.toLowerCase().endsWith('.log') || file.name.toLowerCase().endsWith('.txt');
            if (!isLogOrText) {
                Swal.fire('Lỗi định dạng', 'Vui lòng chọn file có định dạng .log hoặc .txt.', 'error');
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleAnalyze = async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi xác thực',
                text: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
                didClose: () => navigate('/login')
            });
            return;
        }

        // Modified check to only require a local file (as Drive is commented out)
        if (!selectedFile) {
            Swal.fire('Thông báo', 'Vui lòng chọn một file để phân tích.', 'info');
            return;
        }

        setIsProcessing(true); // Start processing (includes upload and analysis)
        setUploadProgress(0);
        setAnalysisResult(null); // Clear previous results
        setError(null); // Clear previous errors

        let fileToSend = null;

        try {
            // Only local file logic remains
            fileToSend = selectedFile;
            console.log("Preparing local file for analysis:", selectedFile.name);


            const formData = new FormData();
            formData.append('file', fileToSend, fileToSend.name);
            formData.append('token', token);

            const xhr = new XMLHttpRequest();

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent); // Update upload progress
                }
            };

            xhr.onload = () => {
                setUploadProgress(100); // Ensure progress is 100% on load
                const response = { status: xhr.status, statusText: xhr.statusText, body: null };
                try {
                    if (xhr.responseText) {
                        response.body = JSON.parse(xhr.responseText);
                    }
                } catch (e) {
                    console.error("Failed to parse response body as JSON:", e);
                    response.body = xhr.responseText || "Không có phản hồi từ máy chủ.";
                } finally {
                    // setIsProcessing(false); // DON'T set false here, analysis might still be ongoing after upload
                    // setIsProcessing is set to false after the result is processed below
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    if (response.body && typeof response.body === 'object' && (response.body.summary || response.body.errors_by_type || response.body.warningSummary || response.body.conclusion)) {
                        setAnalysisResult(response.body);
                        Swal.fire('Thành công', 'Phân tích log hoàn tất!', 'success');
                    } else {
                        const warningMsg = "Phân tích hoàn tất nhưng dữ liệu kết quả không hợp lệ hoặc trống.";
                        setError(warningMsg);
                        setAnalysisResult(null);
                        Swal.fire('Thông báo/Cảnh báo', warningMsg, 'warning');
                    }
                } else if (xhr.status === 401) {
                    Swal.fire({ icon: 'error', title: 'Lỗi xác thực', text: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.', didClose: () => navigate('/login') });
                    setError("Lỗi xác thực với máy chủ backend. Vui lòng đăng nhập lại.");
                    setAnalysisResult(null);
                } else {
                    let errorMessage = `Lỗi ${xhr.status}: ${xhr.statusText}`;
                    if (response.body && typeof response.body === 'object' && response.body.message) { errorMessage = response.body.message; }
                    else if (typeof response.body === 'string' && response.body.length > 0) { errorMessage += ` - ${response.body}`; }
                    else if (response.body && typeof response.body === 'object') { errorMessage += ` - ${JSON.stringify(response.body)}`; }
                    else if (!response.body && xhr.status >= 400) { errorMessage = `Máy chủ trả về lỗi ${xhr.status}: ${xhr.statusText} nhưng không cung cấp thông tin chi tiết lỗi.`; }

                    setError(errorMessage);
                    setAnalysisResult(null);
                    console.error("Backend Error:", errorMessage);
                    Swal.fire('Lỗi Phân tích', errorMessage, 'error');
                }
                setIsProcessing(false); // End processing after response is fully handled
            };

            xhr.onerror = () => {
                setIsProcessing(false); setUploadProgress(0);
                const networkErrorMsg = 'Lỗi kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra địa chỉ máy chủ và kết nối mạng.';
                setError(networkErrorMsg); setAnalysisResult(null);
                console.error("XHR Network Error:", xhr.statusText || 'Unknown network error');
                Swal.fire('Lỗi Kết nối', networkErrorMsg, 'error');
            };
            xhr.onabort = () => {
                setIsProcessing(false); setUploadProgress(0);
                const abortMsg = 'Yêu cầu đã bị hủy.'; setError(abortMsg); setAnalysisResult(null);
                console.warn("XHR Aborted."); Swal.fire('Thông báo', abortMsg, 'info');
            };


            xhr.open('POST', `${API_BASE_URL}/analyze-log`);
            xhr.send(formData);

        } catch (e) {
            console.error("Analysis preparation failed:", e);
            setIsProcessing(false); setUploadProgress(0);
            const preparationError = `Không thể chuẩn bị file để phân tích: ${e.message || 'Lỗi không xác định'}`;
            setError(preparationError); setAnalysisResult(null);
            Swal.fire('Lỗi Chuẩn bị File', preparationError, 'error');
        }
    };

    // --- Google Drive Connection Handler (COMMENTED OUT - Kept as in original) ---
    // const handleConnectGoogleDrive = () => { ... };
    // --- END Google Drive Connection Handler ---


    // --- Effect to update componentRefs (COMMENTED OUT Google Drive parts) ---
    useEffect(() => {
        // Update the ref whenever any of these dependencies change
        // componentRefs.current.setIsGoogleServicesReady = setIsGoogleServicesReady; // Commented out Google
        // componentRefs.current.setGoogleAccessToken = setGoogleAccessToken;       // Commented out Google
        componentRefs.current.setIsProcessing = setIsProcessing;
        // componentRefs.current.setSelectedDriveFile = setSelectedDriveFile;       // Commented out Google
        componentRefs.current.setAnalysisResult = setAnalysisResult;
        componentRefs.current.setError = setError;
        componentRefs.current.setUploadProgress = setUploadProgress;
        componentRefs.current.message = message; // AntD message is generally stable
        componentRefs.current.Swal = Swal;     // SweetAlert2 is generally stable
        // componentRefs.current.handleOpenPicker = handleOpenPicker; // Commented out Google
        // componentRefs.current.pickerCallback = pickerCallback;   // Commented out Google
        // // Pass refs for tracking status (Commented out Google)
        // componentRefs.current.gsiScriptLoadedRef = gsiScriptLoadedRef;
        // componentRefs.current.gapiScriptLoadedRef = gapiScriptLoadedRef;
        // componentRefs.current.gapiClientPickerReadyRef = gapiClientPickerReadyRef;
        // componentRefs.current.tokenClientInitializedRef = tokenClientInitializedRef;
    }, [
        // Dependencies for componentRefs - Keep only non-Google related dependencies
        setIsProcessing,
        setAnalysisResult, setError, setUploadProgress,
    ]);
    // --- END Effect to update componentRefs ---


    // --- Load Google API Scripts and Initialize (COMMENTED OUT - Kept as in original) ---
    // useEffect(() => { ... }, []);
    // --- END Load Google API Scripts and Initialize ---


    // --- Initialize Google Identity Services Token Client (COMMENTED OUT - Kept as in original) ---
    // useEffect(() => { ... }, [isGoogleServicesReady, GOOGLE_CLIENT_ID, GOOGLE_API_KEY]);
    // --- END Initialize Google Identity Services Token Client ---


    // --- Authentication Check (Existing, kept separate) ---
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi xác thực',
                text: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
                didClose: () => navigate('/login')
            });
        }
    }, [navigate]);
    // --- END Authentication Check ---


    // Upload props - modified to disable when processing (Google Drive removed from this check)
    const uploadProps = {
        multiple: false,
        showUploadList: { showRemoveIcon: true, },
        fileList: selectedFile ? [{ uid: 'local-file', name: selectedFile.name, status: 'done', size: selectedFile.size, originFileObj: selectedFile }] : [],
        beforeUpload: (file) => { return false; }, // Prevent default upload behavior
        onChange: handleFileChange,
        accept: ".log,.txt",
        disabled: isProcessing, // Modified: only disable if processing
    };


    // --- Render JSX ---
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* SidebarAdmin does not need an onMenuClick prop here because it handles navigation internally */}
            {/* If you needed QuanLyTaiKhoan's unsaved changes logic *before* navigating FROM PhanTichLog,
                you would pass QuanLyTaiKhoan's handleMenuClickSidebar to SidebarAdmin here.
                But since this is PhanTichLog, it doesn't have that state.
                Let's keep the SidebarAdmin simple and let it navigate directly as it was before QuanLyTaiKhoan logic was added.
            */}
            {/* Removed onMenuClick={handleMenuClickSidebar} prop */}
            <SidebarAdmin collapsed={collapsed} onCollapse={setCollapsed} />
            <Layout className="site-layout">
                <Header
                    className="site-layout-background"
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0 24px',
                        backgroundColor: '#fff',
                        borderBottom: '1px solid #f0f0f0'
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", fontSize: "1.5rem", fontWeight: "bold" }}>
                        <Popover content={<div>Phân tích file Log</div>} trigger="hover">
                            <AreaChartOutlined style={{ marginRight: 8 }} />
                        </Popover>
                        Phân Tích Log
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* Other header elements */}
                    </div>
                </Header>

                <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280, overflow: 'initial' }}>
                    <Title level={4}>Công cụ Phân tích Log Hệ Thống</Title>
                    <Paragraph>
                        Chọn hoặc tải lên file log hệ thống (.txt hoặc .log) để nhận báo cáo phân tích chi tiết về hoạt động, lỗi, cảnh báo, và hiệu suất.
                    </Paragraph>

                    {/* File Selection Options */}
                    <div style={{ marginBottom: 24 }}>
                        <Title level={5}>Chọn nguồn file:</Title>

                        {/* Option 1: Upload Local File */}
                        <Card size="small" style={{ marginBottom: 16 }}>
                            <Title level={5} style={{ marginTop: 0 }}><UploadOutlined /> Tải lên từ máy tính</Title>
                            <Upload.Dragger {...uploadProps}>
                                <p className="ant-upload-drag-icon"><FileTextOutlined /></p>
                                <p className="ant-upload-text">Kéo thả file log (.txt, .log) vào đây hoặc click để chọn</p>
                                <p className="ant-upload-hint">Chỉ hỗ trợ tải lên một file duy nhất.</p>
                            </Upload.Dragger>
                            {selectedFile && (
                                <div style={{ marginTop: 16, fontWeight: 'bold' }}>
                                    File đã chọn: <Text code>{selectedFile.name}</Text> (<Text type="secondary">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</Text>)
                                </div>
                            )}
                        </Card>

                        {/* --- Google Drive Option (COMMENTED OUT - Kept as in original) --- */}
                        {/* <Divider plain>HOẶC</Divider> */}
                        {/* <Card size="small" > ... </Card> */}
                        {/* --- END Google Drive Option --- */}

                    </div>


                    {/* Analyze Button */}
                    <div style={{ marginBottom: 24 }}>
                        <AntButton
                            type="primary"
                            icon={<AreaChartOutlined />}
                            onClick={handleAnalyze}
                            // Modified for only local file
                            disabled={!selectedFile || isProcessing}
                            loading={isProcessing}
                        >
                            {isProcessing ? 'Đang phân tích...' : 'Phân tích File'}
                        </AntButton>
                    </div>


                    {/* Progress Bar and Skeleton during Processing / Results or Error after Processing */}
                    {isProcessing ? (
                        // --- Show Progress and Skeleton while processing ---
                        <div style={{ marginBottom: 24 }}>
                            <Title level={5}>Tiến trình xử lý:</Title>
                            {/* Progress bar */}
                            <Progress
                                percent={uploadProgress > 0 ? uploadProgress : undefined}
                                status={error ? 'exception' : (uploadProgress >= 100 ? 'success' : 'active')}
                                format={(percent) => {
                                    if (error) return 'Lỗi';
                                    // Show spin while upload starts or analysis happens after 100% upload
                                    if (uploadProgress === 0 && isProcessing && selectedFile) return <Spin size="small" />;
                                    if (uploadProgress > 0 && uploadProgress < 100) return `${percent}% Tải lên máy chủ`;
                                    if (uploadProgress === 100 && isProcessing && !analysisResult && !error) return <Spin size="small" />; // Spin while server analyzes
                                    if (uploadProgress === 100 && (analysisResult || error)) return 'Hoàn tất'; // Completed processing
                                    return ''; // Should not happen
                                }}
                            />
                            {isProcessing && !error && (
                                uploadProgress === 0 ?
                                    selectedFile ? <Text type="secondary">Đang tải lên file local...</Text> :
                                        <Text type="secondary">Đang chờ xử lý...</Text> // Fallback
                                    :
                                    uploadProgress === 100 && !analysisResult ? <Text type="secondary">Đã tải lên 100%, máy chủ đang phân tích...</Text> :
                                        null // Text handled by progress format for 100% success state
                            )}
                            {error && <Text type="danger">Đã xảy ra lỗi trong quá trình xử lý.</Text>}

                            {/* Skeleton displayed below progress while processing */}
                            <div style={{ marginTop: 24 }}>
                                <Skeleton active paragraph={{ rows: 15 }} /> {/* Show skeleton rows during analysis */}
                            </div>
                        </div>
                    ) : (
                        // --- Show Results or Error when NOT processing ---
                        <>
                            {error && (
                                <div style={{ marginBottom: 24 }}>
                                    <Title level={5} type="danger"><WarningOutlined /> Lỗi:</Title>
                                    <Paragraph>{error}</Paragraph>
                                </div>
                            )}

                            {analysisResult && !error && (
                                typeof analysisResult === 'object' && analysisResult !== null ? (
                                    <div style={{ marginBottom: 24 }}>
                                        <AnalysisResultDisplay result={analysisResult} />
                                    </div>
                                ) : (
                                    <div style={{ marginBottom: 24 }}>
                                        <Card size="small" type="warning" title={<><InfoCircleOutlined /> Không có kết quả chi tiết</>} >
                                            <Paragraph>
                                                Máy chủ đã xử lý yêu cầu nhưng không trả về dữ liệu phân tích chi tiết ở định dạng mong đợi...
                                            </Paragraph>
                                        </Card>
                                    </div>
                                )
                            )}

                            {/* Show this if processing finished, no error, no analysis result, but a file was selected and upload was 100% */}
                            {/* This handles the case where analysis finishes but returns empty/invalid data */}
                            {!analysisResult && !error && selectedFile && uploadProgress === 100 && (
                                <div style={{ marginBottom: 24 }}>
                                    <Card size="small" type="warning" title={<><InfoCircleOutlined /> Không có kết quả chi tiết</>} >
                                        <Paragraph>
                                            Máy chủ đã xử lý yêu cầu nhưng không trả về dữ liệu phân tích chi tiết hoặc định dạng không đúng...
                                        </Paragraph>
                                    </Card>
                                </div>
                            )}
                        </>
                    )}


                </Content>
            </Layout>
        </Layout>
    );
};

export default PhanTichLog;