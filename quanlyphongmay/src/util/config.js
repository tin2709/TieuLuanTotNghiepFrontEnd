import axios from "axios";
import { history } from "..";

// luu data ra local storage
export const configs = {
    setStore: (name, value) => {
        localStorage.setItem(name, value);
    },
    getStore: (name) => {
        return localStorage.getItem(name);
    },
    /**
     * bien doi sang jSON truoc khi luu vao Storage
     */
    setStoreJSON: (name, value) => {
        // bien doi  thanh chuoi
        let value1 = JSON.stringify(value);

        // luu vao store
        localStorage.setItem(name, value1);
    },
    /**
     * lay data tu Storage
     */
    getStoreJSON: (name) => {
        if (localStorage.getItem(name)) {
            let content = JSON.parse(localStorage.getItem(name));

            return content;
        }
        return {};
    },
    /**
     * luu theo cookie
     * @param {*} value
     * @param {*} days
     * @param {*} name
     */
    setCookie: (value, days = 30, name) => {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/";
    },
    /**
     * lay data theo cookie
     * @param {*} name
     * @returns
     */
    getCookie: (name) => {
        var nameEQ = name + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === " ") c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    },
    clearCookie: (name) => {
        setCookie("", -1, name);
    },
    clearLocalStorage: (name) => {
        localStorage.removeItem(name);
    },
    /**
     * Format Date -> String
     * dd/mm/yyyy
     * @returns String
     */
    formatStringDate: (day = new Date()) => {
        var date = day.getDate();
        var month = day.getMonth() + 1;
        var year = day.getYear();
        return `${date < 10 ? "0" + date : date}/${
            month < 10 ? "0" + month : month
        }/${year + 1900}`;
    },
    /**
     * Format Date -> String
     * yyyy-mm-dd
     * @returns String
     */
    formatStringDate2: (day = new Date()) => {
        let dateYear = day.getYear() + 1900;
        let dateMonth = day.getMonth() + 1;
        let dateDay = day.getDate();
        let strMonth = dateMonth < 10 ? `0${dateMonth}` : dateMonth;
        let strDay = dateDay < 10 ? `0${dateDay}` : dateDay;

        let strDate = `${dateYear}-${strMonth}-${strDay}`;

        return strDate;
    },
    /**
     * Format Date -> String
     * Th DD/MM/YYYY
     * @returns String
     */
    formatStringDate3: (day = new Date()) => {
        var date = day.getDate();
        var month = day.getMonth() + 1;
        var year = day.getYear();

        var current_day = day.getDay();
        // Biến lưu tên của thứ
        var day_name = "";
        // Lấy tên thứ của ngày hiện tại
        switch (current_day) {
            case 0:
                day_name = "CN";
                break;
            case 1:
                day_name = "Th2";
                break;
            case 2:
                day_name = "Th3";
                break;
            case 3:
                day_name = "Th4";
                break;
            case 4:
                day_name = "Th5";
                break;
            case 5:
                day_name = "Th6";
                break;
            case 6:
                day_name = "Th7";
        }

        let strDate = `${day_name} ${date < 10 ? "0" + date : date}/${
            month < 10 ? "0" + month : month
        }/${year + 1900}`;
        return strDate;
    },
    /**
     * Format Date -> String
     * hh:mm Th DD/MM/YYYY
     * @returns String
     */
    formatStringDate4: (day = new Date()) => {
        var date = day.getDate();
        var month = day.getMonth() + 1;
        var year = day.getYear();

        var current_day = day.getDay();
        // Biến lưu tên của thứ
        var day_name = "";
        // Lấy tên thứ của ngày hiện tại
        switch (current_day) {
            case 0:
                day_name = "CN";
                break;
            case 1:
                day_name = "Th2";
                break;
            case 2:
                day_name = "Th3";
                break;
            case 3:
                day_name = "Th4";
                break;
            case 4:
                day_name = "Th5";
                break;
            case 5:
                day_name = "Th6";
                break;
            case 6:
                day_name = "Th7";
        }
        var time = day.getHours() + ":" + day.getMinutes() + ":" + day.getSeconds();
        let strDate = `${day_name} ${date < 10 ? "0" + date : date}/${
            month < 10 ? "0" + month : month
        }/${year + 1900} ${time}`;
        return strDate;
    },
    formatNameByHocVi: (giaoVien) => {
        let str = "";
        switch (giaoVien.hocVi) {
            case "Giáo sư":
                str += str + "GS. ";
                break;
            case "Tiến sĩ":
                str += str + "TS. ";
                break;

            default:
                str += str + "ThS. ";
                break;
        }
        return str + giaoVien.name;
    },
    ACCESS_TOKEN: "accessToken",
    USER_LOGIN: "userLogin",
    REGEX_PASSWORD: /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z_.\-@]{6,}$/,
};

export const {
    setCookie,
    setStore,
    setStoreJSON,
    getCookie,
    getStore,
    getStoreJSON,
    clearCookie,
    clearLocalStorage,
    formatStringDate,
    formatStringDate2,
    formatStringDate3,
    formatStringDate4,
    formatNameByHocVi,
    ACCESS_TOKEN,
    USER_LOGIN,
    REGEX_PASSWORD,
} = configs;

// cấu hình  interceptor (Cau hình cho các  request và response)
const TOKEN_CYBERSOFT = "270903";

export const http = axios.create({
    baseURL: `http://localhost:8080`,
    timeout: 20000, // thoi gian duy tri ???
});

// cấu hình request
http.interceptors.request.use(
    (configs) => {
        // cau hinh header  add them  thuoc tinh  Authorization
        configs.headers = {
            ...configs.headers,
            ["Authorization"]: `Bearer ${getStore(ACCESS_TOKEN)}`,
            ["TokenCybersoft"]: TOKEN_CYBERSOFT,
        };

        return configs;
    },
    (err) => {
        // cau hinh err
        return Promise.reject(err);
    }
);

/*
  statusCode: ma ket qua tra ve do backEnd quy dinh
  200(Success): thanh cong
  201(created) : tao gia tri thanh cong  tren server ( thuong dung 200)
  400(Bad Request): khong ton tai duong dan
  404(Not Found): khongo tim thay du lieu
  401(UnAuthorize): Khong co quyen truy cap
  403(ForBiden): token chua du quyen truy cap
  500(Error in server) : loi say ra tren server (Nguyen nhan do frontend hoac backEnd tuy tinh huong)
*/

http.interceptors.response.use(
    (response) => {
        // console.log("🚀 ~ file: config.js:120 ~ http.interceptors.response.use ~ response:", response)

        return response;
    },
    (err) => {
        let statusCode = err.response.status;
        console.log(statusCode);

        // console.log(err);
        if (statusCode === 400 || statusCode === 404) {
            history.push("/");
        }
        if (statusCode === 401 || statusCode === 403) {
            alert("Token không hợp lệ! Vui lòng đăng nhập lại!");
            history.push("/login");
        }

        return Promise.reject(err);
    }
);