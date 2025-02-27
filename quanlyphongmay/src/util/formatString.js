export const formatString = {
    formatNameByQuyen: (user) => {
        let str = "";
        switch (user.tenQuyen) {
            case "Giáo viên":
                str += str + "GV. ";
                break;

            default:
                str += str + "NV. ";
                break;
        }
        return str + user.name;
    },
    /**
     * thang MM - YYYY
     * @param {*} valdate
     * @returns
     */
    formatDate_MM_YYYY: (valdate) => {
        let tgian = new Date(valdate);
        let strThang = ''

        if(tgian.getMonth() < 9) {
            strThang = `0${tgian.getMonth() + 1}`;
        }else {
            strThang = tgian.getMonth() + 1
        }

        return `tháng ${strThang} - ${tgian.getFullYear()}`;
    },
    formatNumber: () => {
        return Math.floor(Math.random() * 100000) + 1000;
    },
    formatToaNhaAndTang: (objTang) => {
        return objTang.tenTang + " - " + objTang.toaNha.tenToaNha;
    },
};

export const { formatNameByQuyen, formatToaNhaAndTang, formatDate_MM_YYYY, formatNumber } =
    formatString;