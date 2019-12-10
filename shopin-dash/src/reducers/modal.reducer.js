

export const LOGIN_Modal = (state = false, action) => {
  	switch (action.type) {
      	case 'LOGIN_MODAL':
          	return action.payload;
      	default:
          	return state;
	}
}


export const FORGOT_Modal = (state = false, action) => {
  	switch (action.type) {
      	case 'FORGOT_MODAL':
          	return action.payload;
      	default:
          	return state;
	}
}
