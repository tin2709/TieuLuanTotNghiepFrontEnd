import { createSlice } from "@reduxjs/toolkit";
import { setStoreJSON } from "../../util/config";

const initialState = {
    userAccount: {},
};

const userAccountReducer = createSlice({
    name: "userAccountReducer",
    initialState,
    reducers: {
        setUserAccountAction: (state, action) => {
            state.userAccount = action.payload;
        },
    },
});

export const { setUserAccountAction } = userAccountReducer.actions;
export default userAccountReducer.reducer;

// Thực hiện lưu tài khoản người dùng
export const saveUserAccount = (accountData) => {
    return async (dispatch) => {
        try {
            const defaultRole = { quyen: "1", tenQuyen: "Quyền quản trị" }; // Mặc định quyền là 1 và tên quyền là Quyền quản trị
            const userAccount = {
                ...accountData,
                ...defaultRole,
            };

            // Lưu thông tin vào Redux
            dispatch(setUserAccountAction(userAccount));

            // Lưu vào localStorage
            setStoreJSON("USER_ACCOUNT", userAccount);
        } catch (error) {
            console.error("Lỗi khi lưu tài khoản:", error);
        }
    };
};
