import axios from 'axios';
import { ACTION_TYPE } from '../reducers/reducer.types';
import API from '../config';

const changeAction = string => ({
  	type : ACTION_TYPE,
	action_value: string
});

export const getAllUser = (page, pageSize, sorted, filtered) => {
    return dispatch => {
    	return axios.get(`${API.URL}/admin/getAllUser?page=${page}&size=${pageSize}`);
    }
}

export const deleteUser = (page, pageSize, sorted, filtered) => {
    return dispatch => {
    	return axios.get(`${API.URL}/admin/getAllUser?page=${page}&size=${pageSize}`);
    }
}