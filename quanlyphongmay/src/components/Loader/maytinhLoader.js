// src/components/Loader/maytinhLoader.js

/**
 * Loader function cho route /maytinh.
 * Fetch dữ liệu danh sách máy tính và ghi chú máy tính từ API.
 * KHÔNG throw lỗi, thay vào đó trả về object:
 * - Thành công: { data: { mayTinhs: [...], ghiChuMayTinhs: [...] } }
 * - Thất bại: { error: true, type: 'auth' | 'api' | 'network', message: '...', status?: number }
 */
export async function maytinhLoader() {
    console.log("⚡️ [Loader] Running maytinhLoader (with ghiChuMayTinh fetch)...");
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

    let mayTinhData = [];
    let ghiChuMayTinhData = []; // Biến mới để lưu dữ liệu ghi chú

    // 2. Gọi API DSMayTinh
    try {
        const urlMayTinh = `https://localhost:8080/DSMayTinh?token=${token}`;
        console.log(`📞 [Loader] Fetching DSMayTinh: ${urlMayTinh}`);
        const responseMayTinh = await fetch(urlMayTinh);

        if (!responseMayTinh.ok) {
            console.error(`❌ [Loader] API Error DSMayTinh: ${responseMayTinh.status} ${responseMayTinh.statusText}`);
            let errorMsg = `Lỗi ${responseMayTinh.status}: Không thể tải danh sách máy tính.`;
            try {
                const apiError = await responseMayTinh.json();
                errorMsg = apiError.message || errorMsg;
            } catch (e) {
                console.warn("[Loader] Could not parse error response body as JSON for DSMayTinh.");
            }
            return {
                error: true,
                type: 'api',
                status: responseMayTinh.status,
                message: errorMsg
            };
        }

        if (responseMayTinh.status === 204) {
            console.log("✅ [Loader] Received 204 No Content for DSMayTinh. Returning empty data.");
            mayTinhData = [];
        } else {
            mayTinhData = await responseMayTinh.json();
            console.log("✅ [Loader] DSMayTinh data fetched successfully.");
        }

    } catch (error) {
        console.error("💥 [Loader] Network or other fetch error for DSMayTinh data:", error);
        return {
            error: true,
            type: 'network',
            message: "Lỗi mạng hoặc không thể kết nối tới máy chủ khi tải danh sách máy tính."
        };
    }

    // 3. Gọi API DSGhiChuMayTinh (bổ sung)
    try {
        const urlGhiChu = `https://localhost:8080/DSGhiChuMayTinh?token=${token}`;
        console.log(`📞 [Loader] Fetching DSGhiChuMayTinh: ${urlGhiChu}`);
        const responseGhiChu = await fetch(urlGhiChu);

        if (responseGhiChu.ok && responseGhiChu.status !== 204) {
            ghiChuMayTinhData = await responseGhiChu.json();
            console.log("✅ [Loader] DSGhiChuMayTinh data fetched successfully.");
        } else {
            console.warn(`⚠️ [Loader] No DSGhiChuMayTinh data or error (${responseGhiChu.status}) from API.`);
        }
    } catch (error) {
        console.error("💥 [Loader] Network or other fetch error for DSGhiChuMayTinh data:", error);
        // Không chặn loader chính, chỉ log lỗi và trả về mảng rỗng cho ghi chú
    }

    // 4. Trả về cả hai loại dữ liệu
    return {
        data: {
            mayTinhs: mayTinhData || [],
            ghiChuMayTinhs: ghiChuMayTinhData || []
        }
    };
}