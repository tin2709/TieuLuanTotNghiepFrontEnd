// src/components/Loader/phongmayLoader.js

// REMOVED: import { BROKEN_STATUS } from '../components/action'; // KHÔNG CẦN CÁI NÀY TRONG LOADER
// import { notification } from 'antd'; // Ant Design notification (will be used in component, not loader directly, but good to note)

/**
 * Loader function cho route /phongmay.
 * Fetch dữ liệu danh sách phòng máy từ API, có phân biệt quyền người dùng.
 * Thêm fetch dữ liệu ghi chú máy tính hỏng và thiết bị hỏng.
 * KHÔNG throw lỗi, thay vào đó trả về object:
 * - Thành công: { data: { labRooms: [...], computerNotes: [...], deviceNotes: [...] } }
 * - Thất bại: { error: true, type: 'auth' | 'api' | 'network', message: '...', status?: number }
 */
export async function labManagementLoader() {
    console.log("⚡️ [Loader] Running labManagementLoader (with broken notes fetch)...");
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");
    const username = localStorage.getItem("username");

    // 1. Kiểm tra Token
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    let labRoomsData = [];
    let computerNotes = []; // Khởi tạo mảng rỗng
    let deviceNotes = [];   // Khởi tạo mảng rỗng

    // --- Fetch Lab Rooms Data (Logic remains the same as before) ---
    try {
        let labRoomsUrl;
        if (userRole === '2') { // Nếu userRole là 2 (Teacher)
            if (!username) {
                console.error("❌ [Loader] User role is 2 but username not found in localStorage.");
                return {
                    error: true,
                    type: 'auth',
                    message: 'Không tìm thấy tên đăng nhập. Vui lòng đăng nhập lại.'
                };
            }
            labRoomsUrl = `https://localhost:8080/DSCaThucHanhTheoGiaoVienTen?hoTenGiaoVien=${encodeURIComponent(username)}&token=${token}`;
            console.log(`📞 [Loader] Fetching for Teacher (userRole 2): ${labRoomsUrl}`);

            const response = await fetch(labRoomsUrl);

            if (!response.ok) {
                console.error(`❌ [Loader] API Error for Teacher: ${response.status} ${response.statusText}`);
                let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách ca thực hành cho giáo viên.`;
                try {
                    const apiError = await response.json();
                    errorMsg = apiError.message || errorMsg;
                } catch (e) {
                    console.warn("[Loader] Could not parse error response body as JSON for teacher API.");
                }
                return {
                    error: true,
                    type: 'api',
                    status: response.status,
                    message: errorMsg
                };
            }

            if (response.status === 204) {
                console.log("✅ [Loader] Received 204 No Content for Teacher API. Returning empty data.");
                labRoomsData = [];
            } else {
                const caThucHanhList = await response.json();
                const uniquePhongMayMap = new Map();
                caThucHanhList.forEach(ca => {
                    if (ca.phongMay && !uniquePhongMayMap.has(ca.phongMay.maPhong)) {
                        uniquePhongMayMap.set(ca.phongMay.maPhong, ca.phongMay);
                    }
                });
                labRoomsData = Array.from(uniquePhongMayMap.values());
            }

        } else { // Nếu userRole là 3 hoặc bất kỳ vai trò nào khác (Admin, Staff, etc.)
            labRoomsUrl = `https://localhost:8080/DSPhongMay?token=${token}`;
            console.log(`📞 [Loader] Fetching for Admin/Other (userRole ${userRole}): ${labRoomsUrl}`);

            const response = await fetch(labRoomsUrl);

            if (!response.ok) {
                console.error(`❌ [Loader] API Error for Admin/Other: ${response.status} ${response.statusText}`);
                let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách phòng máy.`;
                try {
                    const apiError = await response.json();
                    errorMsg = apiError.message || errorMsg;
                } catch (e) {
                    console.warn("[Loader] Could not parse error response body as JSON for DSPhongMay API.");
                }
                return {
                    error: true,
                    type: 'api',
                    status: response.status,
                    message: errorMsg
                };
            }

            if (response.status === 204) {
                console.log("✅ [Loader] Received 204 No Content for DSPhongMay. Returning empty data.");
                labRoomsData = [];
            } else {
                labRoomsData = await response.json();
            }
        }
    } catch (error) {
        console.error("💥 [Loader] Network or other fetch error for main lab rooms data:", error);
        return {
            error: true,
            type: 'network',
            message: "Lỗi mạng hoặc không thể kết nối tới máy chủ khi tải danh sách phòng máy. Vui lòng kiểm tra kết nối và thử lại."
        };
    }

    // --- Fetch Broken Notes Data (Computer) ---
    // Endpoint: @GetMapping("/DSGhiChuMayTinh")
    try {
        const computerNotesUrl = `https://localhost:8080/DSGhiChuMayTinh?token=${token}`;
        console.log(`📞 [Loader] Fetching computer notes: ${computerNotesUrl}`);
        const response = await fetch(computerNotesUrl);
        if (response.ok && response.status !== 204) {
            computerNotes = await response.json();
            console.log("✅ [Loader] Computer notes fetched successfully.");
        } else {
            console.warn(`⚠️ [Loader] No computer notes or error (${response.status}) from API.`);
        }
    } catch (error) {
        console.error("💥 [Loader] Network or other fetch error for computer notes:", error);
        // Không block loader chính, chỉ log lỗi và trả về mảng rỗng cho computerNotes
    }

    // --- Fetch Broken Notes Data (Device) ---
    // Endpoint: @GetMapping("/DSGhiChuThietBi")
    try {
        const deviceNotesUrl = `https://localhost:8080/DSGhiChuThietBi?token=${token}`;
        console.log(`📞 [Loader] Fetching device notes: ${deviceNotesUrl}`);
        const response = await fetch(deviceNotesUrl);
        if (response.ok && response.status !== 204) {
            deviceNotes = await response.json();
            console.log("✅ [Loader] Device notes fetched successfully.");
        } else {
            console.warn(`⚠️ [Loader] No device notes or error (${response.status}) from API.`);
        }
    } catch (error) {
        console.error("💥 [Loader] Network or other fetch error for device notes:", error);
        // Không block loader chính, chỉ log lỗi và trả về mảng rỗng cho deviceNotes
    }

    // Return combined data
    return {
        data: {
            labRooms: labRoomsData,
            computerNotes: computerNotes,
            deviceNotes: deviceNotes
        }
    };
}