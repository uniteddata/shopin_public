import axios from 'axios';
import Config from '../config';
import { AUTHENTICATION_TYPE } from '../reducers/reducer.types';
import requireAuthToken from './requireAuthToken';
require('promise/polyfill-done');

export const setCurrentUser = user => ({
  	type : AUTHENTICATION_TYPE,
	user
});

export const LoginApi = data => {	
	return dispatch => {
		
		return axios.post(`${Config.URL}/user/login`, data).then(res => {			
			if(res.data.resp!=undefined) {
				const {token, userObj} = res.data.resp;
				localStorage.setItem("token", token);
				localStorage.setItem("user", JSON.stringify(userObj));
				requireAuthToken(token)
				dispatch(setCurrentUser(userObj));
			}
			return res;
    	}, err => {
    		console.log("err", err);
    	});		
	}
}

export const forgotPassword = (data) => {	
	return dispatch => {
		return axios.post(`${Config.URL}/user/forgotPassword`, data);
	}
}

export const logout = () => {	
	return dispatch => {
		delete axios.defaults.headers.common['Authorization'];
		localStorage.clear();
		dispatch(setCurrentUser());	
	}
}
