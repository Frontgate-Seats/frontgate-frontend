// src/store/persistedReducer.ts
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { persistReducer } from "redux-persist";
import rootReducer from "./root.reducer";

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"], // only auth will be persisted
  // blacklist: ["tempData"], // alternatively, exclude some reducers
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default persistedReducer;
