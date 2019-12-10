import axios from 'axios';
import API from '../config';

export const LoginModalAction = (status) => {	
	return dispatch => {
		dispatch({type: 'LOGIN_MODAL', payload: status})
	}
}

export const ForgotModalAction = (status) => {	
	return dispatch => {
		dispatch({type: 'FORGOT_MODAL', payload: status})
	}
}
