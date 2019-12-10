
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { AddClient, AddTransation, TransactionLog, AddTransactionStore } from '../../action/client.action';
import io from 'socket.io-client';

import {  
  Card,
  CardBody,
  Col,
  Row,
  Table,
} from 'reactstrap';
import Axios from 'axios';
import moment from 'moment';

const styles = {
  firstHeader: {
    lineHeight: '6px',
    padding: '10px 15px 20px 0px',
    textAlign: 'right'
  },
  rowTd: {
    width: 300
  },
  notFound: {
    textAlign: 'center'
  }
};

class Token extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      walletLogList: [],
      socket: io(`ws://${process.env.REACT_APP_API_URL}`),
    }
    
    this.onRenderTransactionLogData = this.onRenderTransactionLogData.bind(this);
  }
  
  async componentDidMount() {
    let self = this;

    await Axios.get(`http://${process.env.REACT_APP_API_URL}/tokens`).then((res, err) => this.setState({ tokens: res.data.data }))
    // this.state.socket.on('transactionResponse', function (data) { // args are sent in order to acknowledgement function      
    //     // self.setState({ transactionList: [...self.state.transactionList, data], tokenSender: data.data.tokenInfo.from }, () => {
    //       self.props.AddTransactionStore(data);
    //     // })
    //   });

  }

  
  onRenderTransactionLogData = () => {
    const {tokens} = this.state
    
    if(tokens==undefined) {
      return (<tr className={this.props.classes.notFound}>
        <td colSpan="5">No Data Found</td>
      </tr>)
    }
     
    if(tokens.length == 0) {
        return (<tr className={this.props.classes.notFound}>
            <td colSpan="5">No Data Found</td>
        </tr>)
    }

    return tokens.map((res, index) => <tr key={index}>
        <td>{++index}</td>
        <td>{res.contractAddress}</td>
        <td>{res.from}</td>
        <td>{res.value}</td>
        <td>{res.blockNumber}</td>
        <td>{res.timeStamp ? moment(res.timeStamp).calendar() : ''}</td>
        <td>{res.status}</td>
    </tr>)
      
  }
  
  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>
  
  render() {
    
    const {classes} = this.props;

    return (
      <div className="animated fadeIn">   
        <Row>
          <Col>
            <Card>              
              <CardBody>
                {<h3>Received tokens</h3>}
                <Row>
                  <Col xs="12">
                    <Row>
                      <Col sm="12">
                        <Table responsive>
                          <thead>
                            <tr>
                                <th>Index</th>
                                <th>Contract Address</th>
                                <th>Sender Address</th>
                                <th>Token value</th>
                                <th>Block Number</th>
                                <th>Time</th>
                                <th>Status</th>

                            </tr>
                          </thead>
                          <tbody>
                              {this.onRenderTransactionLogData()}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    ); 
  }
}

const mapStateToProps = (state) => ({
  clientList: state.Client,
  TransactionList: state.Transaction,
  TransactionLogList: state.TransactionLog
})

export default connect(mapStateToProps, {AddClient, AddTransation,AddTransactionStore,  TransactionLog})(withStyles(styles)(Token));
