// src/components/Loader/maytinhLoader.js
// (Or src/loaders/maytinhLoader.js - maintain consistency)

/**
 * Loader function cho route /maytinh.
 * Fetch dữ liệu danh sách máy tính từ API.
 * KHÔNG throw lỗi, thay vào đó trả về object:
 * - Thành công: { data: [...] } hoặc { data: [] } (cho 204 No Content)
 * - Thất bại: { error: true, type: 'auth' | 'api' | 'network', message: '...', status?: number }
 */
export async function maytinhLoader() {
    console.log("⚡️ [Loader] Running maytinhLoader (No Throw Mode)...");
    const token = localStorage.getItem("authToken");

    // 1. Kiểm tra Token
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    // 2. Gọi API DSMayTinh
    try {
        // --- Đảm bảo URL đúng với API endpoint của bạn ---
        const url = `https://localhost:8080/DSMayTinh?token=${token}`;
        console.log(`📞 [Loader] Fetching: ${url}`);
        const response = await fetch(url);

        // 3. Xử lý Response Lỗi API (!response.ok)
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText}`);
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách máy tính.`;
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
        // Kiểm tra xem API DSMayTinh có trả về 204 không, hay chỉ là mảng rỗng 200 OK
        if (response.status === 204) {
            console.log("✅ [Loader] Received 204 No Content. Returning empty data.");
            return { data: [] };
        }

        // 5. Xử lý thành công có dữ liệu (200 OK)
        const data = await response.json();
        // API DSMayTinh có thể trả về mảng trực tiếp
        console.log("✅ [Loader] Data fetched successfully.");
        return { data: data || [] }; // Đảm bảo data là mảng

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