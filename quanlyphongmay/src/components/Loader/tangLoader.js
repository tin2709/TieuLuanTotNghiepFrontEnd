// src/components/Loader/tangLoader.js
// (Or src/loaders/tangLoader.js - choose a consistent location)

/**
 * Loader function cho route /tang.
 * Fetch dữ liệu danh sách tầng từ API.
 * KHÔNG throw lỗi, thay vào đó trả về object:
 * - Thành công: { data: [...] } hoặc { data: [] } (cho 204 No Content)
 * - Thất bại: { error: true, type: 'auth' | 'api' | 'network', message: '...', status?: number }
 */
export async function tangLoader() {
    console.log("⚡️ [Loader] Running tangLoader (No Throw Mode)...");
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

    // 2. Gọi API DSTang
    try {
        const url = `https://localhost:8080/DSTang?token=${token}`;
        console.log(`📞 [Loader] Fetching: ${url}`);
        const response = await fetch(url);

        // 3. Xử lý Response Lỗi API (!response.ok)
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText}`);
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách tầng.`;
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
        // Note: Check if your DSTang API actually returns 204 or just an empty array on 200 OK
        if (response.status === 204) {
            console.log("✅ [Loader] Received 204 No Content. Returning empty data.");
            return { data: [] };
        }

        // 5. Xử lý thành công có dữ liệu (200 OK)
        const data = await response.json();
        // API DSTang trả về mảng trực tiếp, không cần data.results
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