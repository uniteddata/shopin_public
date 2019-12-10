import { isEmpty, isEmail } from 'validator';
import lodash from 'lodash';

const validation = (data) => {
	
	let errors = {};
	
	let { emailId } = data;

	if(isEmpty(emailId)) {
		errors.emailId = "Please enter email address";
	}
	
	if(!isEmpty(emailId) && !isEmail(emailId)) {
		errors.emailId = "Please enter valid email address";
	}

	return {
		isValid: lodash.isEmpty(errors),
		errors
	}

}

export default validation;