import { isEmpty, isEmail } from 'validator';
import lodash from 'lodash';

const validation = (data) => {
	
	let errors = {};
	
	let { userName, fullName, emailId, contactNumber } = data;

	if(isEmpty(emailId)) {
		errors.emailId = "Please enter email address";
	}
	
	if(!isEmpty(emailId) && !isEmail(emailId)) {
		errors.emailId = "Please enter valid email address";
	}
	
	if(isEmpty(userName)) {
		errors.userName = "Please Enter Username";
    }
    
    if(isEmpty(fullName)) {
		errors.fullName = "Please Enter Full Name";
    }
    
    if(isEmpty(contactNumber)) {
		errors.contactNumber = "Please Enter Contact Number";
	}

	return {
		isValid: lodash.isEmpty(errors),
		errors
	}

}

export default validation;