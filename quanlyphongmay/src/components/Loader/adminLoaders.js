// src/loaders/adminLoaders.js

/**
 * Fetches data for a specific dashboard piece.
 * NEVER throws, always returns an object:
 * - Success: { data: [...] | any }
 * - Failure: { error: true, type: 'api' | 'network', message: '...', status?: number }
 */
const fetchDashboardPiece = async (endpoint, token) => {
    // Không cần kiểm tra token ở đây vì loader chính đã làm
    console.log(`🧩 [fetchDashboardPiece] Fetching: ${endpoint}`);
    const url = `https://localhost:8080/${endpoint}?token=${token}`;

    try {
        const response = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

        // Xử lý lỗi API (!response.ok)
        if (!response.ok) {
            let statusText = response.statusText;
            let responseBodyError = null;
            try {
                // Cố gắng đọc body lỗi để lấy message chi tiết hơn
                responseBodyError = await response.text(); // Đọc text trước
                const apiError = JSON.parse(responseBodyError); // Rồi thử parse JSON
                statusText = apiError.message || statusText; // Ưu tiên message từ API
            } catch (e) {
                // Không parse được JSON, sử dụng text nếu có, hoặc statusText mặc định
                statusText = responseBodyError || statusText;
                console.warn(`[fetchDashboardPiece] Could not parse error JSON for ${endpoint}. Raw body: ${responseBodyError}`);
            }
            const errorMsg = `Lỗi ${response.status} (${endpoint}): ${statusText}`;
            console.error(`❌ [fetchDashboardPiece] API Error (${endpoint}): ${response.status} ${statusText}`);
            return {
                error: true,
                type: 'api',
                status: response.status,
                message: errorMsg
            };
        }

        // Xử lý 204 No Content (nếu có)
        if (response.status === 204) {
            console.log(`✅ [fetchDashboardPiece] Received 204 No Content for ${endpoint}. Returning empty array.`);
            // Trả về mảng rỗng vì thường các endpoint này trả về danh sách
            return { data: [] };
        }

        // Xử lý thành công (200 OK)
        const data = await response.json();
        console.log(`✅ [fetchDashboardPiece] Data fetched successfully for ${endpoint}.`);

        // Đảm bảo kiểu dữ liệu trả về là mảng cho các endpoint danh sách
        if (endpoint.startsWith('DS') && !Array.isArray(data)) {
            console.warn(`[fetchDashboardPiece] Expected array for ${endpoint} but got other type. Returning empty array.`);
            return { data: [] };
        }
        // Các endpoint thống kê có thể trả về object hoặc mảng, giữ nguyên data
        return { data: data };

    } catch (error) {
        // Xử lý lỗi mạng hoặc lỗi JS khác
        console.error(`💥 [fetchDashboardPiece] Network/Fetch error for ${endpoint}:`, error);
        let errorType = 'network';
        let errorMessage = `Lỗi mạng (${endpoint}): ${error.message || 'Không thể kết nối.'}`;

        // Kiểm tra cụ thể lỗi "Failed to fetch"
        if (error.message.toLowerCase().includes('failed to fetch')) {
            errorMessage = `Lỗi mạng hoặc CORS (${endpoint}). Kiểm tra kết nối, server backend, CORS/HTTPS.`;
        } else if (error instanceof SyntaxError) {
            // Lỗi nếu JSON trả về không hợp lệ (dù response.ok là true)
            errorType = 'api'; // Coi như lỗi API
            errorMessage = `Lỗi phân tích dữ liệu JSON (${endpoint}): Dữ liệu trả về không hợp lệ.`;
            console.error(`💥 [fetchDashboardPiece] JSON Syntax error for ${endpoint}:`, error);
        }

        return {
            error: true,
            type: errorType,
            message: errorMessage
        };
    }
}; // <-- KẾT THÚC ĐỊNH NGHĨA fetchDashboardPiece


// --- Hàm Loader chính ---
export async function adminDashboardLoader() {
    console.log("⚡️ [Loader] Running adminDashboardLoader (No Throw Mode)...");
    const token = localStorage.getItem("authToken");

    // 1. Check Token (Giống maytinhLoader)
    if (!token) {
        console.warn("🔒 [Loader] No token found. Returning auth error signal.");
        return {
            error: true,
            type: 'auth',
            message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
        };
    }
    console.log("🔑 [Loader] Token found. Proceeding to fetch data.");

    // 2. Định nghĩa các "mảnh" dữ liệu cần fetch
    const dataPieces = {
        roomStats: 'phong-may-thong-ke',
        timeSeriesData: 'thong-ke-may-tinh-theo-thoi-gian',
        buildings: 'DSToaNha',
        floors: 'DSTang',
        rooms: 'DSPhongMay'
    };

    // 3. Gọi API song song cho từng mảnh sử dụng helper "không ném lỗi"
    try {
        const promises = Object.entries(dataPieces).map(([key, endpoint]) =>
            // Gọi helper đã được định nghĩa ở trên
            fetchDashboardPiece(endpoint, token).then(result => ({ key, result }))
        );

        // Chờ tất cả các promise hoàn thành (mỗi promise sẽ resolve thành { key, result })
        const resultsArray = await Promise.all(promises);

        console.log("📡 [Loader] All data pieces processed. Results:", resultsArray);

        // 4. Xử lý kết quả tổng hợp
        const finalLoaderData = {};
        const collectedErrors = [];
        let overallSuccess = true; // Giả định thành công ban đầu

        resultsArray.forEach(({ key, result }) => {
            if (result.error) {
                console.error(`❌ [Loader] Error fetching piece "${key}":`, result.message);
                // Tạo thông điệp lỗi rõ ràng hơn
                collectedErrors.push(`[${key}]: ${result.message}`);
                // Gán giá trị mặc định (mảng rỗng) cho phần bị lỗi
                // Component sẽ cần kiểm tra và hiển thị thông báo phù hợp nếu data là mảng rỗng do lỗi
                finalLoaderData[key] = [];
                overallSuccess = false; // Đánh dấu có lỗi xảy ra
            } else {
                // Gán dữ liệu thành công
                finalLoaderData[key] = result.data;
            }
        });

        // 5. Trả về kết quả cuối cùng
        if (!overallSuccess) {
            console.warn("⚠️ [Loader] Finished with one or more errors.");
            return {
                error: true,
                type: 'partial_api_network', // Lỗi một phần
                // Gom các lỗi lại thành 1 message
                message: `Gặp lỗi khi tải dữ liệu dashboard: ${collectedErrors.join('; ')}`,
                // Luôn trả về cấu trúc data, chứa cả phần thành công và phần lỗi (đã được gán default)
                data: finalLoaderData
            };
        }

        console.log("✅ [Loader] All dashboard data fetched successfully.");
        // Trả về cấu trúc { data: { ... } } nhất quán với maytinhLoader
        return { data: finalLoaderData };

    } catch (error) {
        // Lỗi này chỉ xảy ra nếu có vấn đề nghiêm trọng trong logic của chính loader
        // (ví dụ: lỗi cú pháp trong map, lỗi không mong muốn từ Promise.all)
        console.error("💥 [Loader] Unexpected error during Promise.all or processing:", error);
        return {
            error: true,
            type: 'loader_unexpected',
            message: `Lỗi không mong muốn trong loader: ${error.message || 'Unknown loader error'}`
        };
    }
}