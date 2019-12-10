import { combineReducers } from 'redux'
import User from './user.reducer';
import Client, {Transaction, TransactionLog} from './client-reducer';

import { Auth, Login_Authentication } from './auth.reducer';
import { LOGIN_Modal, FORGOT_Modal } from './modal.reducer';

export default combineReducers({
	Client,
	Transaction,
	TransactionLog,
	User,
	Auth,
	LOGIN_Modal,
	FORGOT_Modal,
	Login_Authentication
})