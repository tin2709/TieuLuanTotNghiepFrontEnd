// src/redux/QuanLiNVRedux/employeeSearchConfigsSlice.js
import { createSlice } from '@reduxjs/toolkit';

// A unique constant for loading all employees (clearing search)
export const LOAD_ALL_EMPLOYEES_CONFIG_NAME = 'LOAD_ALL_EMPLOYEES_CONFIG';

// Helper function to load state from localStorage
const loadState = () => {
    try {
        const serializedState = localStorage.getItem('employeeSearchConfigs');
        if (serializedState === null) {
            return undefined; // Let reducer initialize state
        }
        return JSON.parse(serializedState);
    } catch (e) {
        console.warn("Could not load employee search configs from localStorage", e);
        return undefined;
    }
};

// Helper function to save state to localStorage
const saveState = (state) => {
    try {
        const serializedState = JSON.stringify(state);
        localStorage.setItem('employeeSearchConfigs', serializedState);
    } catch (e) {
        console.warn("Could not save employee search configs to localStorage", e);
    }
};

const initialState = loadState() || {
    // Current search configuration being used by the UI
    currentSearchConfig: {
        keyword: '',
        field: 'tenNV', // Default search field
        operator: 'LIKE', // Default operator
        name: 'Mặc định' // Name for the current (unsaved/default) config
    },
    // List of names of saved search configurations (for dropdown display)
    searchConfigList: [],
    // Object mapping names to their actual search configurations
    savedSearchConfigs: {},
};

const employeeSearchConfigsSlice = createSlice({
    name: 'employeeSearchConfigs',
    initialState,
    reducers: {
        // Updates the current search parameters
        setCurrentSearch: (state, action) => {
            state.currentSearchConfig = {
                ...state.currentSearchConfig,
                ...action.payload
            };
            // If keyword is changed, it's no longer a saved config
            if (action.payload.keyword !== undefined || action.payload.field !== undefined || action.payload.operator !== undefined) {
                state.currentSearchConfig.name = 'Mặc định';
            }
            saveState(state);
        },
        // Saves the current search configuration with a given name
        saveCurrentSearchConfig: (state, action) => {
            const { name } = action.payload;
            const { keyword, field, operator } = state.currentSearchConfig;

            // Store the current config under the new name
            state.savedSearchConfigs[name] = { keyword, field, operator };

            // Add the name to the list if it's new
            if (!state.searchConfigList.includes(name)) {
                state.searchConfigList.push(name);
                state.searchConfigList.sort(); // Keep sorted
            }
            // Update the name of the current search config
            state.currentSearchConfig.name = name;
            saveState(state);
        },
        // Loads a saved search configuration into currentSearchConfig
        loadSearchConfig: (state, action) => {
            const configName = action.payload;

            if (configName === LOAD_ALL_EMPLOYEES_CONFIG_NAME) {
                // Special case: Load all (clear search)
                state.currentSearchConfig = {
                    keyword: '',
                    field: 'tenNV',
                    operator: 'LIKE',
                    name: LOAD_ALL_EMPLOYEES_CONFIG_NAME
                };
            } else if (state.savedSearchConfigs[configName]) {
                // Load a specific saved config
                state.currentSearchConfig = {
                    ...state.savedSearchConfigs[configName],
                    name: configName
                };
            }
            saveState(state);
        },
        // Removes a saved search configuration
        removeSearchConfig: (state, action) => {
            const configName = action.payload;
            delete state.savedSearchConfigs[configName];
            state.searchConfigList = state.searchConfigList.filter(name => name !== configName);
            // If the removed config was the currently loaded one, clear current search
            if (state.currentSearchConfig.name === configName) {
                state.currentSearchConfig = { keyword: '', field: 'tenNV', operator: 'LIKE', name: 'Mặc định' };
            }
            saveState(state);
        },
        // Clears the current search configuration
        clearCurrentSearch: (state) => {
            state.currentSearchConfig = { keyword: '', field: 'tenNV', operator: 'LIKE', name: 'Mặc định' };
            saveState(state);
        }
    },
});

export const {
    setCurrentSearch,
    saveCurrentSearchConfig,
    loadSearchConfig,
    removeSearchConfig,
    clearCurrentSearch
} = employeeSearchConfigsSlice.actions;

export default employeeSearchConfigsSlice.reducer;