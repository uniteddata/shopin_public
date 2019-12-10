import { AUTHENTICATION_TYPE } from './reducer.types';
import lodash from 'lodash';

let initialState = {
  isAuthenticate: false,
  user: {}
}

export const Auth = (state = initialState, action) => {
  	switch (action.type) {
        case 'AUTHENTICATION_TYPE':        
          return {
      			isAuthenticate: !lodash.isEmpty(action.user),
  			   	user: action.user
      		}
      	default:
          	return state;
	  }
}

export const Login_Authentication = (state = {}, action) => {
    switch (action.type) {
        case 'LOGIN_SUCCESSED':
          return {
            status: true,
            message: action.message
          }
        case 'LOGIN_FAILED':
          return {
            status: false,
            message: action.message
          }
        default:
            return state;
    }
}