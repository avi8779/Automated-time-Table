import { configureStore } from '@reduxjs/toolkit';
import teacherReducer from './teacherSlice';


const store = configureStore({
    reducer:{
        teacher: teacherReducer
    }
})

export default store;
