import axios from "axios";
import { createAsyncThunk } from "@reduxjs/toolkit";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase-config";

export const fetchSingleGameData = createAsyncThunk(
    "game/fetchSingleGameData",
    async (id, { rejectWithValue, getState }) => {
        const state = getState();
        const { isStateInitializedFromLocalStorage } = state.game;
        const firestoreKey = `singleGameData-${id}`;
        const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const currentTime = new Date().getTime();

        if (isStateInitializedFromLocalStorage) {
            try {
                const docRef = doc(db, "singleGames", firestoreKey);
                const docSnap = await getDoc(docRef);

                if (
                    docSnap.exists() &&
                    docSnap.data().timestamp &&
                    currentTime - docSnap.data().timestamp < ONE_DAY_IN_MS
                ) {
                    return docSnap.data().data;
                } else {
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

                        // Save the data to Firestore along with a timestamp
                        await setDoc(docRef, { data, timestamp: currentTime });
                        return data;
                    } catch (error) {
                        console.log(error);
                        return rejectWithValue(error);
                    }
                }
            } catch (error) {
                console.log("Error fetching data from Firestore: ", error);
                return rejectWithValue(error);
            }
        } else {
            // State is not yet initialized from local storage, skip this network request
            return;
        }
    }
);
