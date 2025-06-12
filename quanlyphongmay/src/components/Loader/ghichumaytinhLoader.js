export async function ghichumaytinhLoader() {
    console.log("⚡️ [Loader] Running ghichumaytinhLoader...");
    const token = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole"); // Lấy vai trò người dùng

    // 1. Check Token and Role (only admin should access this page directly)
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    if (userRole !== '1') { // Assuming '1' is the admin role
        console.warn("🚫 [Loader] User is not admin. Access denied.");
        return {
            error: true,
            type: 'permission',
            message: 'Bạn không có quyền truy cập trang này.'
        };
    }

    // 2. Call API DSGhiChuMayTinh
    try {
        const url = `https://localhost:8080/DSGhiChuMayTinh?token=${token}`; // Updated API URL
        console.log(`📞 [Loader] Fetching: ${url}`);
        const response = await fetch(url);

        // 3. Xử lý Response Lỗi API (!response.ok)
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText}`);
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách ghi chú máy tính.`; // Updated message
            try {
                const apiError = await response.json();
                errorMsg = apiError.message || errorMsg;
            } catch (e) {
                console.warn("[Loader] Could not parse error response body as JSON.");
            }
            return {
                error: true,
                type: 'api',
                status: response.status,
                message: errorMsg
            };
        }

        // 4. Xử lý thành công nhưng không có dữ liệu (204 No Content)
        if (response.status === 204) {
            console.log("✅ [Loader] Received 204 No Content. Returning empty data.");
            return { data: [] };
        }

        // 5. Xử lý thành công có dữ liệu (200 OK)
        const data = await response.json();
        console.log("✅ [Loader] Data fetched successfully.");
        return { data: data || [] }; // Return data directly, assuming API returns array

    } catch (error) {
        // 6. Xử lý lỗi mạng hoặc lỗi JavaScript khác
        console.error("💥 [Loader] Network or other fetch error:", error);
        return {
            error: true,
            type: 'network',
            message: "Lỗi mạng hoặc không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại."
        };
    }
}
