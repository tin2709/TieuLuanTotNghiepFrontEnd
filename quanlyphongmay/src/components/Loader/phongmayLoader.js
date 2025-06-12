// src/loaders/phongMayLoader.js

/**
 * Loader function cho route /phongmay.
 * Fetch dữ liệu danh sách phòng máy từ API, có phân biệt quyền người dùng.
 * KHÔNG throw lỗi, thay vào đó trả về object:
 * - Thành công: { data: [...] } hoặc { data: [] } (cho 204 No Content)
 * - Thất bại: { error: true, type: 'auth' | 'api' | 'network', message: '...', status?: number }
 */
export async function labManagementLoader() {
    console.log("⚡️ [Loader] Running labManagementLoader from separate file (No Throw Mode)...");
    const token = localStorage.getItem("authToken");
    // Lấy thông tin quyền và username từ localStorage
    const userRole = localStorage.getItem("userRole"); // Giả định 'userRole' được lưu trong localStorage
    const username = localStorage.getItem("username"); // Giả định 'username' được lưu trong localStorage

    // 1. Kiểm tra Token
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        // Trả về object lỗi xác thực
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    let url;
    let data;

    // 2. Gọi API dựa trên quyền người dùng
    try {
        if (userRole === '2') { // Nếu userRole là 2 (Teacher)
            if (!username) {
                console.error("❌ [Loader] User role is 2 but username not found in localStorage.");
                return {
                    error: true,
                    type: 'auth',
                    message: 'Không tìm thấy tên đăng nhập. Vui lòng đăng nhập lại.'
                };
            }
            url = `https://localhost:8080/DSCaThucHanhTheoGiaoVienTen?hoTenGiaoVien=${encodeURIComponent(username)}&token=${token}`;
            console.log(`📞 [Loader] Fetching for Teacher (userRole 2): ${url}`);

            const response = await fetch(url);

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
                data = [];
            } else {
                const caThucHanhList = await response.json();
                console.log("✅ [Loader] CaThucHanh data fetched successfully for teacher.");

                // Trích xuất và loại bỏ trùng lặp các phòng máy
                const uniquePhongMayMap = new Map(); // Dùng Map để lưu trữ unique phongMay theo maPhong
                caThucHanhList.forEach(ca => {
                    if (ca.phongMay && !uniquePhongMayMap.has(ca.phongMay.maPhong)) {
                        uniquePhongMayMap.set(ca.phongMay.maPhong, ca.phongMay);
                    }
                });
                data = Array.from(uniquePhongMayMap.values()); // Chuyển các giá trị của Map thành mảng
            }

        } else { // Nếu userRole là 3 hoặc bất kỳ vai trò nào khác (Admin, Staff, etc.)
            url = `https://localhost:8080/DSPhongMay?token=${token}`;
            console.log(`📞 [Loader] Fetching for Admin/Other (userRole ${userRole}): ${url}`);

            const response = await fetch(url);

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
                data = [];
            } else {
                data = await response.json();
                console.log("✅ [Loader] Data fetched successfully for Admin/Other.");
            }
        }

        // 3. Trả về dữ liệu thành công
        return { data: data };

    } catch (error) {
        // 4. Xử lý lỗi mạng hoặc lỗi JavaScript khác trong quá trình fetch
        console.error("💥 [Loader] Network or other fetch error:", error);
        // Trả về object lỗi mạng/chung
        return {
            error: true,
            type: 'network',
            message: "Lỗi mạng hoặc không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại."
        };
    }
}

// export async function anotherLoader() { ... }