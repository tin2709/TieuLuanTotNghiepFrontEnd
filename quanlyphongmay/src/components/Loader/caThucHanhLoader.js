// src/loaders/caThucHanhLoader.js

/**
 * Loader function for the /cathuchanh and /quanlicathuchanh routes.
 * Fetches the list of CaThucHanh data from the API,
 * differentiating based on the current route path and user role.
 */
export async function caThucHanhLoader({ request }) {
    console.log("⚡️ [Loader] Running caThucHanhLoader...");
    // Sử dụng 'authToken' để nhất quán với monhocLoader
    const token = localStorage.getItem("authToken");

    const url = new URL(request.url);
    const pathName = url.pathname;

    // 1. Kiểm tra Token
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }

    let apiUrl = '';
    let errorMessage = '';

    // Quyết định URL API dựa trên đường dẫn
    if (pathName.includes("/quanlicathuchanh")) {
        // Đây là trang Quản lý ca thực hành chung cho Admin (lấy tất cả)
        apiUrl = `https://localhost:8080/DSCaThucHanh?token=${token}`;
        errorMessage = 'Lỗi: Không thể tải danh sách ca thực hành (Admin).';
        console.log(`➡️ [Loader] Mode: Admin - Fetching all practice sessions.`);
    } else if (pathName.includes("/cathuchanh")) {
        // Đây là trang dành cho Giáo viên xem các ca thực hành của mình
        // Lấy tên giáo viên từ localStorage (như đã định nghĩa trong component trước)
        const hoTenGiaoVien = localStorage.getItem("username");

        if (!hoTenGiaoVien) {
            console.error("🔒 [Loader] No 'username' (hoTenGiaoVien) found for teacher-specific module.");
            return {
                error: true,
                type: 'data_missing', // Loại lỗi cụ thể hơn
                message: 'Không tìm thấy thông tin giáo viên để tải ca thực hành. Vui lòng đảm bảo bạn đã đăng nhập với tài khoản giáo viên.'
            };
        }
        // Xây dựng URL cho API lấy theo tên giáo viên
        apiUrl = `https://localhost:8080/DSCaThucHanhTheoGiaoVienTen?hoTenGiaoVien=${encodeURIComponent(hoTenGiaoVien)}&token=${token}`;
        errorMessage = 'Lỗi: Không thể tải danh sách ca thực hành của giáo viên.';
        console.log(`➡️ [Loader] Mode: Teacher - Fetching sessions for hoTenGiaoVien: ${hoTenGiaoVien}`);
    } else {
        // Xử lý trường hợp loader được gọi ở một đường dẫn không mong muốn
        console.warn(`❓ [Loader] caThucHanhLoader called on an unexpected path: ${pathName}`);
        return {
            error: true,
            type: 'route',
            message: 'Đường dẫn không hợp lệ cho loader ca thực hành.'
        };
    }

    // 2. Gọi API
    try {
        console.log(`📞 [Loader] Attempting to fetch from: ${apiUrl}`);
        const response = await fetch(apiUrl);

        // 3. Xử lý Response Lỗi API (!response.ok)
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText} for ${apiUrl}`);
            let apiErrorMsg = `${errorMessage} (Mã lỗi: ${response.status}).`;
            try {
                const apiError = await response.json();
                apiErrorMsg = apiError.message || apiErrorMsg;
            } catch (e) {
                console.warn("[Loader] Could not parse error response body as JSON.", e);
            }
            // Xử lý đặc biệt cho lỗi 401 Unauthorized từ backend
            if (response.status === 401) {
                return {
                    error: true,
                    type: 'auth',
                    message: 'Bạn không có quyền truy cập dữ liệu này hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
                };
            }
            return {
                error: true,
                type: 'api',
                status: response.status,
                message: apiErrorMsg
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
        return { data: data || [] }; // Đảm bảo luôn trả về một mảng
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