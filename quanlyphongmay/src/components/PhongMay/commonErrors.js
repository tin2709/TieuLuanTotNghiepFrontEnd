// src/PhongMay/commonErrors.js (Updated)

// --- Computer Errors ---
export const computerHardwareErrors = [
    // Ổ Cứng (HDD/SSD)
    { id: "hw-hdd-mech", description: "Ổ cứng (HDD): Lỗi cơ (đầu đọc, motor)" },
    { id: "hw-hdd-badsector", description: "Ổ cứng (HDD): Bad sector" },
    { id: "hw-hdd-board", description: "Ổ cứng (HDD): Lỗi bo mạch điều khiển" },
    { id: "hw-ssd-endurance", description: "Ổ cứng (SSD): Hết giới hạn ghi/xóa (Endurance)" },
    { id: "hw-ssd-nand", description: "Ổ cứng (SSD): Lỗi chip nhớ NAND Flash" },
    { id: "hw-ssd-controller", description: "Ổ cứng (SSD): Lỗi bộ điều khiển (Controller)" },
    { id: "hw-ssd-firmware", description: "Ổ cứng (SSD): Firmware lỗi" },
    { id: "hw-disk-connection", description: "Ổ cứng (Chung): Lỗi kết nối (cáp SATA/NVMe lỏng, cổng hỏng)" },
    { id: "hw-disk-powerloss", description: "Ổ cứng (Chung): Hỏng do sốc điện/mất điện đột ngột" },
    // ... (rest of computer hardware errors: PSU, Mobo, RAM, VGA, CPU, Cooling, Laptop, Peripherals) ...
    { id: "hw-psu-capacitor", description: "Nguồn (PSU): Phồng tụ điện/nổ tụ" },
    { id: "hw-psu-fan", description: "Nguồn (PSU): Quạt nguồn hỏng/kẹt" },
    { id: "hw-psu-burn", description: "Nguồn (PSU): Chập cháy linh kiện" },
    { id: "hw-psu-power", description: "Nguồn (PSU): Không đủ công suất" },
    { id: "hw-psu-voltage", description: "Nguồn (PSU): Điện áp không ổn định (Sụt áp/Tăng áp)" },
    { id: "hw-mobo-chipset", description: "Mainboard: Lỗi Chipset (Cầu Nam/Bắc)" },
    { id: "hw-mobo-bios", description: "Mainboard: Lỗi BIOS/UEFI (Flash lỗi, chip hỏng)" },
    { id: "hw-mobo-cmos", description: "Mainboard: Hết pin CMOS (Mất cấu hình, sai giờ)" },
    { id: "hw-mobo-capacitor", description: "Mainboard: Phồng tụ, cháy nổ linh kiện" },
    { id: "hw-mobo-vrm", description: "Mainboard: Hỏng mạch VRM" },
    { id: "hw-mobo-ports", description: "Mainboard: Hỏng cổng kết nối (USB, LAN, Audio, RAM, VGA)" },
    { id: "hw-mobo-warp", description: "Mainboard: Cong vênh" },
    { id: "hw-mobo-circuit", description: "Mainboard: Lỗi mạch (đứt ngầm, chập)" },
    { id: "hw-ram-chip", description: "RAM: Lỗi chip nhớ (Gây BSOD, treo máy)" },
    { id: "hw-ram-contact", description: "RAM: Chân tiếp xúc bẩn/oxy hóa (Nhận thiếu RAM)" },
    { id: "hw-ram-incompatible", description: "RAM: Không tương thích (Sai bus, loại, xung đột)" },
    { id: "hw-ram-esd", description: "RAM: Hỏng do sốc tĩnh điện (ESD)" },
    { id: "hw-gpu-core", description: "VGA: Lỗi chip xử lý đồ họa (GPU Core)" },
    { id: "hw-gpu-vram", description: "VGA: Lỗi bộ nhớ VRAM (Sai màu, sọc, artifacts)" },
    { id: "hw-gpu-fan", description: "VGA: Quạt tản nhiệt hỏng/kẹt" },
    { id: "hw-gpu-power", description: "VGA: Lỗi nguồn trên card (Tụ phồng, VRM lỗi)" },
    { id: "hw-gpu-ports", description: "VGA: Lỗi cổng xuất hình (HDMI, DP)" },
    { id: "hw-gpu-bios", description: "VGA: Lỗi BIOS card màn hình" },
    { id: "hw-cpu-pins", description: "CPU: Cong/gãy chân socket" },
    { id: "hw-cpu-overheat", description: "CPU: Quá nhiệt nghiêm trọng kéo dài" },
    { id: "hw-cpu-oc", description: "CPU: Hỏng do ép xung quá đà (sai điện áp)" },
    { id: "hw-cpu-defect", description: "CPU: Lỗi sản xuất (hiếm)" },
    { id: "hw-cool-fan-stuck", description: "Tản nhiệt (Máy tính): Quạt kẹt trục, khô dầu, gãy cánh" },
    { id: "hw-cool-fan-motor", description: "Tản nhiệt (Máy tính): Motor quạt hỏng" },
    { id: "hw-cool-paste-dry", description: "Tản nhiệt (Máy tính): Keo tản nhiệt khô cứng" },
    { id: "hw-cool-water-pump", description: "Tản nhiệt nước (Máy tính): Hỏng bơm (pump)" },
    { id: "hw-cool-water-leak", description: "Tản nhiệt nước (Máy tính): Rò rỉ nước" },
    { id: "hw-cool-water-clog", description: "Tản nhiệt nước (Máy tính): Tắc nghẽn đường ống/radiator" },
    { id: "hw-nic-lan", description: "Card mạng LAN: Cháy chip, hỏng cổng" },
    { id: "hw-nic-wifi", description: "Card mạng Wifi: Lỗi kết nối, chip hỏng" },
    { id: "hw-soundcard", description: "Card âm thanh: Chip lỗi, cổng audio hỏng" },
    { id: "hw-odd", description: "Ổ đĩa quang (CD/DVD): Mắt đọc yếu/hỏng, kẹt cơ" },
    { id: "hw-laptop-battery-dead", description: "Laptop: Pin chai, không sạc được" },
    { id: "hw-laptop-battery-swell", description: "Laptop: Pin bị phồng (Nguy hiểm)" },
    { id: "hw-laptop-screen-lines", description: "Laptop: Màn hình bị sọc" },
    { id: "hw-laptop-screen-deadpixel", description: "Laptop: Màn hình có điểm chết" },
    { id: "hw-laptop-screen-bleed", description: "Laptop: Màn hình chảy mực / hở sáng" },
    { id: "hw-laptop-screen-cable", description: "Laptop: Hỏng cáp màn hình" },
    { id: "hw-laptop-screen-backlight", description: "Laptop: Hỏng bo cao áp / LED nền" },
    { id: "hw-laptop-keyboard", description: "Laptop: Bàn phím liệt/chập/kẹt phím" },
    { id: "hw-laptop-touchpad", description: "Laptop: Touchpad không hoạt động / nhảy loạn" },
    { id: "hw-monitor-general", description: "Màn hình ngoài: Không lên hình, chập chờn" },
    { id: "hw-mouse-general", description: "Chuột: Không nhận, liệt nút, nhảy loạn" },
    { id: "hw-keyboard-general", description: "Bàn phím rời: Không nhận, liệt/chập phím" },
];

export const softwareErrors = [
    // Hệ Điều Hành (Windows, macOS, Linux)
    { id: "sw-os-filesystem", description: "Hệ điều hành: Lỗi file hệ thống (cần check disk)" },
    { id: "sw-os-registry", description: "Hệ điều hành (Windows): Lỗi Registry" },
    { id: "sw-os-bootloader", description: "Hệ điều hành: Lỗi Bootloader (Không vào được OS)" },
    { id: "sw-os-update", description: "Hệ điều hành: Lỗi sau khi cập nhật" },
    { id: "sw-os-bsod", description: "Hệ điều hành: Màn hình xanh (BSOD)" },
    { id: "sw-os-slow", description: "Hệ điều hành: Chạy chậm, treo, lag" },
    { id: "sw-os-corrupt", description: "Hệ điều hành: Bị lỗi nặng, cần cài lại" },
    // Trình Điều Khiển (Drivers)
    { id: "sw-driver-wrong", description: "Driver: Cài sai driver" },
    { id: "sw-driver-conflict", description: "Driver: Xung đột driver" },
    { id: "sw-driver-outdated", description: "Driver: Lỗi thời, cần cập nhật" },
    { id: "sw-driver-missing", description: "Driver: Thiếu driver thiết bị" },
    // Phần Mềm Độc Hại (Malware/Virus)
    { id: "sw-malware-virus", description: "Phần mềm độc hại: Nhiễm virus/malware" },
    { id: "sw-malware-ransomware", description: "Phần mềm độc hại: Nhiễm ransomware (mã hóa dữ liệu)" },
    { id: "sw-malware-spyware", description: "Phần mềm độc hại: Nghi ngờ bị theo dõi (spyware)" },
    // Ứng Dụng Lỗi/Xung Đột
    { id: "sw-app-crash", description: "Ứng dụng: Bị crash (văng ra) thường xuyên" },
    { id: "sw-app-conflict", description: "Ứng dụng: Xung đột phần mềm" },
    { id: "sw-app-slow", description: "Ứng dụng: Chạy chậm, không phản hồi" },
    { id: "sw-app-install-fail", description: "Ứng dụng: Không cài đặt được" },
    { id: "sw-app-license", description: "Ứng dụng: Lỗi bản quyền/kích hoạt" },
];

// --- Structure specifically for Computer Errors (Hardware + Software) ---
export const computerErrorCategories = [
    {
        category: "Lỗi Phần Cứng Máy Tính",
        errors: computerHardwareErrors,
    },
    {
        category: "Lỗi Phần Mềm",
        errors: softwareErrors,
    }
];

// --- Other Device Specific Errors ---
export const projectorErrors = [
    { id: "proj-lamp-eol", description: "Máy chiếu: Bóng đèn hết tuổi thọ / nổ" },
    { id: "proj-overheat", description: "Máy chiếu: Quá nhiệt (tắc lọc bụi, quạt hỏng, môi trường nóng)" },
    { id: "proj-dust-optics", description: "Máy chiếu: Bụi bẩn hệ thống quang học (mờ, đốm, sai màu)" },
    { id: "proj-power-ballast", description: "Máy chiếu: Hỏng nguồn / Ballast (chấn lưu)" },
    { id: "proj-chip-lcd", description: "Máy chiếu: Hỏng chip DLP / tấm LCD (đốm trắng/đen, sọc, sai màu)" },
    { id: "proj-colorwheel", description: "Máy chiếu (DLP): Hỏng Color Wheel (sai màu, nhấp nháy, kêu)" },
    { id: "proj-remote", description: "Máy chiếu: Remote hỏng / hết pin" },
    { id: "proj-port", description: "Máy chiếu: Hỏng cổng tín hiệu (HDMI/VGA)" },
    { id: "proj-focus", description: "Máy chiếu: Lỗi lấy nét (Focus)" },
    { id: "proj-zoom", description: "Máy chiếu: Lỗi Zoom" },
];

export const acErrors = [
    { id: "ac-gas-leak", description: "Máy lạnh: Thiếu gas / Hết gas (rò rỉ)" },
    { id: "ac-coil-dirty", description: "Máy lạnh: Dàn nóng/lạnh quá bẩn (làm lạnh kém, chảy nước, đóng tuyết)" },
    { id: "ac-capacitor", description: "Máy lạnh: Hỏng tụ điện (block/quạt không chạy)" },
    { id: "ac-compressor", description: "Máy lạnh: Hỏng block (máy nén)" },
    { id: "ac-fan-outdoor", description: "Máy lạnh: Hỏng quạt dàn nóng (motor, tụ, cánh)" },
    { id: "ac-fan-indoor", description: "Máy lạnh: Hỏng quạt dàn lạnh (motor, tụ, cánh)" },
    { id: "ac-board", description: "Máy lạnh: Lỗi bo mạch điều khiển (ẩm, côn trùng, sốc điện)" },
    { id: "ac-drain-clog", description: "Máy lạnh: Tắc đường ống thoát nước (chảy nước trong phòng)" },
    { id: "ac-remote", description: "Máy lạnh: Remote hỏng / lỗi / hết pin" },
    { id: "ac-noise", description: "Máy lạnh: Kêu to bất thường" },
    { id: "ac-sensor", description: "Máy lạnh: Lỗi cảm biến nhiệt độ" },
];

export const fanErrors = [
    { id: "fan-stuck-motor", description: "Quạt điện: Khô dầu, kẹt trục quay (quay chậm, kêu, nóng, cháy motor)" },
    { id: "fan-motor-burn", description: "Quạt điện: Cháy motor (do kẹt, quá nóng)" },
    { id: "fan-wire-switch", description: "Quạt điện: Đứt dây ngầm / Hỏng công tắc, bộ điều tốc" },
    { id: "fan-capacitor", description: "Quạt điện: Hỏng tụ khởi động (quay yếu, không tự quay)" },
    { id: "fan-blade-broken", description: "Quạt điện: Gãy cánh quạt (rung lắc)" },
    { id: "fan-neck", description: "Quạt điện: Hỏng cổ quạt / không quay đảo chiều" },
    { id: "fan-remote", description: "Quạt điện: Remote hỏng / hết pin (nếu có)" },
    { id: "fan-base", description: "Quạt điện: Chân đế không vững" },
];

// --- Lookup for NON-COMPUTER device errors based on type name ---
// Use keywords expected in `loaiThietBi.tenLoai`
export const deviceSpecificErrors = {
    'máy chiếu': projectorErrors,
    'projector': projectorErrors,
    'máy lạnh': acErrors,
    'điều hòa': acErrors,
    'air conditioner': acErrors,
    'quạt': fanErrors,
    'fan': fanErrors,
    // Add other NON-COMPUTER device types here if they have specific error lists
    // Example: 'loa': speakerErrors,
};

// --- Combined list for general reference if needed (optional) ---
export const allErrorCategories = [
    ...computerErrorCategories, // Spread computer categories
    { category: "Lỗi Máy chiếu", errors: projectorErrors },
    { category: "Lỗi Máy lạnh", errors: acErrors },
    { category: "Lỗi máy quạt", errors: fanErrors },
    // Add other device categories here
];