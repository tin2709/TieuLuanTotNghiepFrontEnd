export async function taikhoanAdminLoader() {
    console.log("⚡️ [Loader] Running taikhoanAdminLoader...");
    const token = localStorage.getItem("authToken");

    // 1. Check Token
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    // 2. Call API getAllUser
    try {
        const url = `https://localhost:8080/getAllUser`;
        console.log(`📞 [Loader] Fetching: ${url}`);
        const response = await fetch(url);

        // 3. Handle API errors
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText}`);
            let errorMsg = `Lỗi ${response.status}: Không thể tải danh sách tài khoản.`;
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

        // 4. Handle successful response
        const responseData = await response.json(); // Get the entire response object
        console.log("✅ [Loader] Data fetched successfully.");

        // **Corrected Part:** Extract the 'data' array from the response
        const usersArray = responseData.data || []; // Access responseData.data, default to empty array if not present

        return { data: usersArray }; // Return the extracted array of users

    } catch (error) {
        // 5. Handle network or other errors
        console.error("💥 [Loader] Network or other fetch error:", error);
        return {
            error: true,
            type: 'network',
            message: "Lỗi mạng hoặc không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối và thử lại."
        };
    }
}
