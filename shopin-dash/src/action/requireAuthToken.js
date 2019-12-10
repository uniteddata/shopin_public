import axios from 'axios';

const authToken = (token) => {
     if (token) {
         axios.defaults.headers.common['Authorization'] = `${token}`;
     } else {
         axios.defaults.headers.common['Authorization'] = null;
         /*if setting null does not remove `Authorization` header then try     
           delete axios.defaults.headers.common['Authorization'];
         */
     }
}

export default authToken