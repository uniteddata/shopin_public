import { isEmpty, isEmail } from 'validator';
import lodash from 'lodash';

const validation = (data) => {
	
	let errors = {};
	
	let { emailId, password } = data;

	if(isEmpty(emailId)) {
		errors.emailId = "Please enter email address";
	}
	
	if(!isEmpty(emailId) && !isEmail(emailId)) {
		errors.emailId = "Please enter valid email address";
	}
	
	if(isEmpty(password)) {
		errors.password = "Please Enter Password";
	}

	return {
		isValid: lodash.isEmpty(errors),
		errors
	}

}

export default validation;