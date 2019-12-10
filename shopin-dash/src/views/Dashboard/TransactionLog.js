import React, { Component } from 'react';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import Modal from '@material-ui/core/Modal';

import { AddClient, AddTransation, AddTransactionStore, TransactionLog } from '../../action/client.action';
import CreateTransactionModal from '../../components/CreateTransactionModal';
import ClientSecureKeyModal from '../../components/ClientSecureKeyModal';
import EthCrypto from 'eth-crypto';
import { randomNR } from '../../components/common/common';
import io from 'socket.io-client';

import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
} from 'reactstrap';

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
  },
  paper: {

    // position: 'absolute',
    backgroundColor: 'white',
    border: '2px solid #000',
    margin: '50px'
  },
  modal: {
    display: 'flex',
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
};

class Transaction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      transactionList: [],
      transactionLogList: [],
      socket: io(process.env.REACT_APP_API_URL),
      openModal: false,
    }

    this.onRenderTableData = this.onRenderTableData.bind(this);
    this.onClickToAddTransaction = this.onClickToAddTransaction.bind(this);
    this.onRenderTransactionLogData = this.onRenderTransactionLogData.bind(this);
  }

  componentDidMount() {
    this.emitEvent(false);
    let self = this;
    const { TransactionList } = this.props;
    this.setState({ transactionLogList: TransactionList ? TransactionList : [] });

    // this.state.socket.on('transactionResponse', function (data) { // args are sent in order to acknowledgement function      
    //     self.setState({transactionList:[...self.state.transactionList, data]}, () => {
    //       self.props.AddTransactionStore(data);
    //     })     
    // });
    // this.state.socket.on('transactionList', (data) => {
    //   self.setState({transactionLogList: !data.data.value ? [] :data.data.value.transactions, walletLogList: !data.data.value ? [] :data.data.value.wallets});
    // });
  }

  componentWillReceiveProps(nextProps) {
    const { TransactionList } = nextProps;
    console.log("TransactionReceive", TransactionList)
    this.setState({ transactionLogList: TransactionList ? TransactionList : [] });

  }

  emitEvent = (isSecondTime) => {

    let self = this;

    if (!isSecondTime) {
      // TIP: you can avoid listening on `connect` and listen on events directly too!
      // this.state.socket.emit('getWallets');
    }

    // this.state.socket.emit('getTransactionLog', 'A6FB9B8456E081b9F7c45fE79D9F6b1961c8795d');

  }

  getClient = () => {
    const { clientList } = this.props;
    this.setState({ dataList: clientList })
  }

  onClickToAddTransaction = (currentClient, selectedClient, balance) => {
    const { clientList } = this.props;
    let currentC = clientList.find(x => x.name == currentClient)
    let selectedC = clientList.find(x => x.name == selectedClient)
    this.props.AddTransation(currentC, selectedC, balance);
  }

  modalDetails = (blockNumber) => {
    this.setState({ blockNumber, openModal: true })
  }

  onRenderTableData = () => {
    const { dataList } = this.state;

    return dataList.map((res) => <tr key={res.name}>
      <td>{res.name}</td>
      <td>{res.identity}</td>
      <td>{res.balance}</td>
      <td>
        <CreateTransactionModal addTransaction={this.onClickToAddTransaction} currentBalance={res.balance} currentClient={res.name} clientList={this.props.clientList} />
        <ClientSecureKeyModal clientData={res} />
      </td>
    </tr>)

  }

  onRenderTransactionLogData = () => {
    const { TransactionList } = this.props
    const { blockNumber } = this.state

    if (TransactionList && TransactionList.length == 0) {
      return (<tr className={this.props.classes.notFound}>
        <td colSpan="5">No Data Found</td>
      </tr>)
    }

    if (TransactionList && TransactionList.length > 0) {
      return TransactionList.map((res, index) => {
        if (res.data && res.data && res.data.tokenInfo && (res.data.tokenInfo.blockNumber == blockNumber)) {
          return (<tr key={index}>
            <td>{index++}</td>
            <td>{(res.data && res.data.transactionId) ? res.data.transactionId : ""}</td>
            <td>{res.data && res.data.from ? res.data.from : ""}</td>
            <td>{res.data && res.data.to ? res.data.to : ""}</td>
            <td>{res.data && res.data.value ? res.data.value : ""}</td>
            <td>{res.data && res.data.status ? res.data.status : ""}</td>
            <td>{res.data && res.data.tokenInfo ? res.data.tokenInfo.from : ""}</td>
            <td>{res.data && res.data.tokenInfo ? res.data.tokenInfo.blockNumber : ""}</td>
          </tr>)
        }
      })
    }
  }

  onRenderTransactionDetail = () => {
    const { TransactionList } = this.props

    if (TransactionList && TransactionList.length == 0) {
      return (<tr className={this.props.classes.notFound}>
        <td colSpan="5">No Data Found</td>
      </tr>)
    }

    if (TransactionList && TransactionList.length > 0) {
      return TransactionList.map((res, index) => {
        if (res.data && res.data.isLast) {
          return <tr key={index} onClick={() => this.modalDetails(res.data && res.data.tokenInfo && res.data.tokenInfo.blockNumber)}>
            <td>{index++}</td>
            {/* <td>{(res.data && res.data.transactionId) ? res.data.transactionId : ""}</td>
        <td>{res.data && res.data.from ? res.data.from : ""}</td>
        <td>{res.data && res.data.to ? res.data.to : ""}</td>
        <td>{res.data && res.data.value ? res.data.value : ""}</td>
        <td>{res.data && res.data.status ? res.data.status : ""}</td> */}
            <td><a href="/#/transaction">{res.data && res.data.tokenInfo ? res.data.tokenInfo.from : ""}</a></td>
            <td>{res.data && res.data.tokenInfo ? res.data.tokenInfo.blockNumber : ""}</td>
          </tr>
        }
      })
    }
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  render() {

    const { classes } = this.props;
    const { openModal } = this.state;

    console.log("this.state", this.state.TransactionLogList);

    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card>
              <CardBody>
                <Row>
                  <Col xs="12">
                    <Row>
                      <Col sm="12">
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>Range.</th>
                              {/* <th>TransactionId</th>
                              <th>From</th>
                              <th>To</th>
                              <th>Value</th>
                              <th>Status</th> */}
                              <th>Token Sender Address</th>
                              <th>Block Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {this.onRenderTransactionDetail()}
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
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={openModal}
          className={styles.modal}
          onClose={() => this.setState({ openModal: false })}
        >
          <div style={styles.paper}>
            <Table responsive>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>TransactionId</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Value</th>
                  <th>Status</th>
                  <th>Token Sender Address</th>
                  <th>Block Number</th>
                </tr>
              </thead>
              <tbody>
                {this.onRenderTransactionLogData()}
              </tbody>
            </Table>
          </div>
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  clientList: state.Client,
  TransactionList: state.Transaction,
  TransactionLogList: state.TransactionLog
})

export default connect(mapStateToProps, { AddClient, AddTransation, AddTransactionStore, TransactionLog })(withStyles(styles)(Transaction));
