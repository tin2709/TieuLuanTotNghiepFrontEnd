import { configureStore } from "@reduxjs/toolkit";


export const store = configureStore({
    reducer: {

    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        immutableCheck: { warnAfter: 128 },
        serializableCheck: { warnAfter: 128 },
    })
});