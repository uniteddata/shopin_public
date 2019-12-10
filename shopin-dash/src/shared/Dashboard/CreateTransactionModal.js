import { isEmpty, isEmail } from 'validator';
import lodash from 'lodash';

const validation = (data) => {
	
	let errors = {};
	
    let { selectedClient, balance } = data;
        
	if(isEmpty(selectedClient)) {
		errors.selectedClient = "Please select client";
    }
    
    if(isEmpty(balance)) {
		errors.balance = "Please enter amount";
	}

	return {
		isValid: lodash.isEmpty(errors),
		errors
	}

}

export default validation;