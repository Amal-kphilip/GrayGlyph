import { useReducer, useMemo, useCallback } from "react";
import { DEFAULT_EDITOR_STATE } from "./processor";

// Action Types
const SET_IMAGE = "SET_IMAGE";
const UPDATE_PARAM = "UPDATE_PARAM";
const RESET_SECTION = "RESET_SECTION";
const RESET_ALL = "RESET_ALL";
const SET_HISTORY_INDEX = "SET_HISTORY_INDEX";
const PUSH_HISTORY = "PUSH_HISTORY";

// Reducer
function editorReducer(state, action) {
    switch (action.type) {
        case SET_IMAGE:
            return {
                ...state,
                originalImage: action.payload.image,
                imageName: action.payload.name,
                previewImage: action.payload.preview, // Optimized preview object
                isLoaded: true,
                // Reset edits on new image load
                params: { ...DEFAULT_EDITOR_STATE }
            };

        case UPDATE_PARAM:
            return {
                ...state,
                params: {
                    ...state.params,
                    [action.payload.key]: action.payload.value
                }
            };

        case RESET_SECTION:
            // Reset only specific keys belonging to a section
            // This requires knowledge of which keys belong to which section
            // For now, naive merge usually works if we pass the subset
            return {
                ...state,
                params: {
                    ...state.params,
                    ...action.payload // Payload contains default values for that section
                }
            };

        case RESET_ALL:
            return {
                ...state,
                params: { ...DEFAULT_EDITOR_STATE }
            };

        default:
            return state;
    }
}

// Initial State
const INITIAL_STATE = {
    isLoaded: false,
    originalImage: null, // HTMLImageElement or ImageBitmap
    previewImage: null,
    imageName: "untitled.png",
    params: { ...DEFAULT_EDITOR_STATE },
    // History could be implemented here as past/future arrays
};

export function useEditorState() {
    const [state, dispatch] = useReducer(editorReducer, INITIAL_STATE);

    const setImage = useCallback((image, name, preview) => {
        dispatch({ type: SET_IMAGE, payload: { image, name, preview } });
    }, []);

    const updateParam = useCallback((key, value) => {
        dispatch({ type: UPDATE_PARAM, payload: { key, value } });
    }, []);

    const resetAll = useCallback(() => {
        dispatch({ type: RESET_ALL });
    }, []);

    const setParams = useCallback((newParams) => {
        dispatch({ type: RESET_SECTION, payload: newParams });
    }, []);

    return {
        state,
        setImage,
        updateParam,
        setParams, // Bulk update
        resetAll
    };
}
