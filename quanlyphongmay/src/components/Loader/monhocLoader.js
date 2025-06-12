// components/Loader/monhocLoader.js

export async function monhocLoader({ request }) { // Thêm tham số 'request'
    console.log("⚡️ [Loader] Running monhocLoader...");
    const token = localStorage.getItem("authToken");

    // Lấy đường dẫn hiện tại từ request.url để phân biệt
    const url = new URL(request.url);
    const pathName = url.pathname; // Ví dụ: /quanlimonhocbyadmin hoặc /quanlimonhoc

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

    // Phân biệt API dựa trên đường dẫn
    if (pathName.includes("/quanlimonhocbyadmin")) {
        // Logic cho trang quản lý môn học của admin (lấy tất cả môn học)
        apiUrl = `https://localhost:8080/DSMonHoc?token=${token}`;
        errorMessage = 'Lỗi: Không thể tải danh sách môn học (Admin).';
        console.log("➡️ [Loader] Mode: Admin - Fetching all subjects.");
    } else if (pathName.includes("/quanlimonhoc")) {
        // Logic cho trang quản lý môn học của giáo viên (lấy môn học theo giáo viên)
        const maGiaoVien = localStorage.getItem("maTK"); // LẤY maGiaoVien TỪ LOCALSTORAGE

        if (!maGiaoVien) {
            console.error("🔒 [Loader] No maGiaoVien found for teacher-specific module.");
            return {
                error: true,
                type: 'auth', // Hoặc type lỗi cụ thể hơn nếu thiếu maGiaoVien
                message: 'Không tìm thấy thông tin giáo viên. Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.'
            };
        }

        // Đảm bảo maGiaoVien là kiểu số (Long ở backend)
        const parsedMaGiaoVien = parseInt(maGiaoVien, 10);
        if (isNaN(parsedMaGiaoVien)) {
            console.error("🔒 [Loader] Invalid maGiaoVien found in localStorage.");
            return {
                error: true,
                type: 'data',
                message: 'Thông tin giáo viên không hợp lệ. Vui lòng đăng nhập lại.'
            };
        }

        apiUrl = `https://localhost:8080/DSMonHocByTaiKhoan?maTaiKhoan=${parsedMaGiaoVien}&token=${token}`;
        errorMessage = 'Lỗi: Không thể tải danh sách môn học của giáo viên.';
        console.log(`➡️ [Loader] Mode: Teacher - Fetching subjects for maGiaoVien: ${parsedMaGiaoVien}`);
    } else {
        // Trường hợp không mong muốn nếu loader này được gọi ở path khác
        console.warn("❓ [Loader] monhocLoader called for an unexpected path:", pathName);
        return {
            error: true,
            type: 'route',
            message: 'Đường dẫn không hợp lệ cho loader môn học.'
        };
    }

    // 2. Gọi API
    try {
        console.log(`📞 [Loader] Fetching: ${apiUrl}`);
        const response = await fetch(apiUrl);

        // 3. Xử lý phản hồi lỗi từ API (!response.ok)
        if (!response.ok) {
            console.error(`❌ [Loader] API Error: ${response.status} ${response.statusText} for ${apiUrl}`);
            let apiErrorMsg = `${errorMessage} (Mã lỗi: ${response.status}).`;
            try {
                const apiError = await response.json();
                apiErrorMsg = apiError.message || apiErrorMsg;
            } catch (e) {
                console.warn("[Loader] Could not parse error response body as JSON.", e);
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
        return { data: data || [] }; // Trả về dữ liệu trực tiếp, giả định API trả về mảng

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