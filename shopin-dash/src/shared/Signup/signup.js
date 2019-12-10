import { isEmpty, isEmail } from 'validator';
import lodash from 'lodash';

const validation = (data) => {
	let errors = {};

	const { username, email, password, confirmPassword } = data;

	if(isEmpty(username)) {
		errors.username = "Please Enter Username";
	}

	if(isEmpty(email)) {
		errors.email = "Please Enter Email";	
	}

	if(!isEmpty(email) && !isEmail(email)) {
		errors.email = "Please Enter Valid Email";
	}

	if(isEmpty(password)) {
		errors.password = "Please Enter Password";
	}

	if(!isEmpty(password) && password.length < 6) {
		errors.password = "Please Enter Min 6 Character";
	}

	if(isEmpty(confirmPassword)) {
		errors.confirmPassword = "Please Enter Confirm Password";
	}

	if(!isEmpty(password) && !isEmpty(confirmPassword) && (password != confirmPassword)) {
		errors.confirmPassword = "Please Enter Valid Password"
	}

	return {
		isValid: lodash.isEmpty(errors),
		errors
	}

}

export default validation;