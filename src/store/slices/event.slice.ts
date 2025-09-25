import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import eventApi, { type Event } from "../../apis/event.api";
import { setSnackbar } from "./snackbar.slice";

export interface EventsState {
  loading: boolean;
  rows: Event[];
  total: number;
  error: string | null;
}


const initialState: EventsState = {
    loading: false,
    rows: [],
    total: 0,
    error: null,
};

// Async thunk to fetch events
export const getEvents = createAsyncThunk(
    "events/fetch",
    async ({ page, pageSize }: { page: number; pageSize: number }, { dispatch, rejectWithValue }) => {
        try {
            const response = await eventApi.fetchEvents(page, pageSize);
            return response.data;
        } catch (err: any) {
            const message = err?.message || "Failed to fetch events";
            dispatch(setSnackbar({ message, severity: "error" }));
            return rejectWithValue(message);
        }
    }
);

const eventsSlice = createSlice({
    name: "events",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.rows = action.payload.data as Event[];
                state.total = action.payload.total;
            })
            .addCase(getEvents.rejected, (state, action: PayloadAction<any>) => {
                state.loading = false;
                state.error = action.payload || "Something went wrong";
            });
    },
});

export const { } = eventsSlice.actions;

export default eventsSlice.reducer;
