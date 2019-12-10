import { ADD_CLIENT, ADD_TRANSACTION, ADD_TRANSACTION_LOG } from './reducer.types';

const Client = (state = [], action) => {    
  	switch (action.type) {
        case 'ADD_CLIENT':
            return [
                ...state,
                ...action.action_value
            ];         
        // case 'ADD_TRANSACTION':
        //     const {currentClient, selectedClient, balance} = action.action_value
        //     let current = state.find(x => x.name === currentClient.name);
        //     let selected = state.find(x => x.name === selectedClient.name);
        //     return state.map(res => {
        //         if(res.name ===  current.name) {
        //             return {...res, balance: parseFloat(res.balance) - parseFloat(balance) }
        //         }

        //         if(res.name === selected.name) {
        //             return {...res, balance: parseFloat(res.balance) + parseFloat(balance) }
        //         }
        //         return res
        //     })
      	default:
          	return state;
    }    
}

export const Transaction = (state = [], action) => {    
    switch (action.type) {      
      case 'ADD_TRANSACTION':
            return [
                action.action_value, ...state]
        default:
            return state;
  }    
}

export const TransactionLog = (state = {}, action) => {    
    switch (action.type) {      
      case 'ADD_TRANSACTION_LOG':
            return action.action_value
        default:
            return state;
  }    
}

export default Client;