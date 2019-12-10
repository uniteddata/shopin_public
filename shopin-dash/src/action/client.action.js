import axios from 'axios';
import { ADD_CLIENT, ADD_TRANSACTION, ADD_TRANSACTION_LOG } from '../reducers/reducer.types';
import API from '../config';

// const addClient = string => ({
  	// type : ADD_CLIENT,
	// action_value: string
// });
const url = "http://3.17.14.97:4001";
export const AddClient = () => {
    return dispatch => {
        axios.get(`${url}/wallets`).then((res) => {
            return dispatch({type : ADD_CLIENT, action_value: res.data.data})
        })   
    }
}

export const AddTransation = (currentClient, selectedClient, balance, signature) => {
    return dispatch => {
        let obj = {from: currentClient.identity, to: selectedClient.identity, balance: parseInt(balance), signature};

        return axios.post(`${url}/feed/wallets`, obj).then((res) => {
            let transaction = {
                currentClient,
                selectedClient,
                balance,
                data: res.data
            }
            // dispatch({type : ADD_TRANSACTION, action_value: transaction})
            return res;
        })

    }
}

export const AddTransactionStore = (data) => {
    return dispatch => {
        dispatch({type : ADD_TRANSACTION, action_value: data})
    }
}

export const TransactionLog = (data) => {
    return dispatch => {
        console.log("data", data);
        // return dispatch({type : ADD_TRANSACTION_LOG, action_value: (!res.data.data[0] && res.data.data.value)?res.data.data.value:{}})
    }
}
