// src/loaders/phongMayLoader.js

/**
 * Loader function cho route /phongmay.
 * Fetch dữ liệu danh sách phòng máy từ API.
 * KHÔNG throw lỗi, thay vào đó trả về object:
 * - Thành công: { data: [...] } hoặc { data: [] } (cho 204 No Content)
 * - Thất bại: { error: true, type: 'auth' | 'api' | 'network', message: '...', status?: number }
 */
export async function labManagementLoader() {
    console.log("⚡️ [Loader] Running labManagementLoader from separate file (No Throw Mode)...");
    const token = localStorage.getItem("authToken");

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

    // 2. Gọi API
    try {
        const url = `https://localhost:8080/DSPhongMay?token=${token}`;
        console.log(`📞 [Loader] Fetching: ${url}`);
        const response = await fetch(url);

        // 3. Xử lý Response Lỗi API (!response.ok)
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText}`);
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách phòng máy.`;
            try {
                // Cố gắng lấy chi tiết lỗi từ API response
                const apiError = await response.json();
                errorMsg = apiError.message || errorMsg;
            } catch (e) {
                /* Bỏ qua nếu response body không phải JSON */
                console.warn("[Loader] Could not parse error response body as JSON.");
            }
            // Trả về object lỗi API
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
            // Trả về dữ liệu là mảng rỗng
            return { data: [] };
        }

        // 5. Xử lý thành công có dữ liệu (200 OK)
        const data = await response.json();
        console.log("✅ [Loader] Data fetched successfully.");
        // Trả về dữ liệu thành công
        return { data: data };

    } catch (error) {
        // 6. Xử lý lỗi mạng hoặc lỗi JavaScript khác trong quá trình fetch
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