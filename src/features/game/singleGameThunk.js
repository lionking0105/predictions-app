import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchSingleGameData = createAsyncThunk(
    "game/fetchSingleGameData",
    async (id, { rejectWithValue, getState }) => {
        const state = getState();
        const { isStateInitializedFromLocalStorage } = state.game;
        const localStorageKey = `singleGameData-${id}`;
        const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

        if (isStateInitializedFromLocalStorage) {
            // Step 2: Retrieve Data from Local Storage
            const savedData = JSON.parse(localStorage.getItem(localStorageKey));
            const currentTime = new Date().getTime();

            if (
                savedData &&
                savedData.timestamp &&
                currentTime - savedData.timestamp < ONE_DAY_IN_MS
            ) {
                // Data is fresh in local storage, return it directly
                return savedData.data;
            } else {
                // Step 3: API Call if Necessary
                try {
                    const res = await axios.get(
                        `https://v3.football.api-sports.io/predictions?fixture=${id}`,
                        {
                            headers: {
                                "x-rapidapi-key":
                                    process.env.REACT_APP_RAPID_KEY,
                                "x-rapidapi-host":
                                    process.env.REACT_APP_RAPID_HOST,
                            },
                        }
                    );

                    const data = res.data.response;

                    // Step 4: Save Data to Local Storage
                    localStorage.setItem(
                        localStorageKey,
                        JSON.stringify({ data, timestamp: currentTime })
                    );

                    return data;
                } catch (error) {
                    console.log(error);
                    return rejectWithValue(error);
                }
            }
        } else {
            // State is not yet initialized from local storage, skip this network request
            return;
        }
    }
);
