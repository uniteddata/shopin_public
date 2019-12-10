import React, { Component, lazy, Suspense } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { AddClient, AddTransation, AddTransactionStore, TransactionLog } from '../../action/client.action';
import CreateClientModal from '../../components/CreateClientModal';
import CreateTransactionModal from '../../components/CreateTransactionModal';
import ClientSecureKeyModal from '../../components/ClientSecureKeyModal';
import EthCrypto from 'eth-crypto';
import { randomNR } from '../../components/common/common';
import Button from '@material-ui/core/Button';
import io from 'socket.io-client';

import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
} from 'reactstrap';
import InstructionModal from '../../components/InstructionModal';

const styles = {
  firstHeader: {
    lineHeight: '6px',
    padding: '10px 15px 20px 0px',
    textAlign: 'right',
    // display: 'flex',
    // flexDirection: 'row',
    // flex: 1,
    // justifyContent: 'around'
  },
  rowTd: {
    width: 300
  },
  notFound: {
    textAlign: 'center'
  }
};

class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      transactionList: [],
      walletLogList: [],
      transactionLogList: [],
      wallet: false,
      transaction: true,
      getWallet: false,
      socket: io(`ws://${process.env.REACT_APP_API_URL}`),
    }

    this.onRenderTableData = this.onRenderTableData.bind(this);
    this.onClickToAddTransaction = this.onClickToAddTransaction.bind(this);
    this.onClickToGetWalets = this.onClickToGetWalets.bind(this);
    this.onRenderTransactionData = this.onRenderTransactionData.bind(this);

  }

  componentDidMount() {

    this.emitEvent(false);

    const { TransactionList } = this.props;

    this.setState({ transactionList: TransactionList ? TransactionList : [] })

    let self = this;

    this.state.socket.on('transactionList', (data) => {
      self.props.TransactionLog(data);
      // self.setState({transactionLogList: !data.data.value ? [] :data.data.value.transactions, walletLogList: !data.data.value ? [] :data.data.value.wallets});
    });

  }

  componentWillUnmount() {
    console.log('CALLED')
  }

  componentWillReceiveProps(nextprops) {

    const { clientList, TransactionList, TransactionLogList } = nextprops;

    const { transactions, wallets } = TransactionLogList;
    this.setState({ transactionList: TransactionList }, () => {
    })
  }

  emitEvent = (isSecondTime) => {

    let self = this;

    if (!isSecondTime) {
      // TIP: you can avoid listening on `connect` and listen on events directly too!
      this.state.socket.emit('getWallets', function (data) { // args are sent in order to acknowledgement function
      });

    }
    // this.state.socket.emit('getTransactionLog', function (data) { // args are sent in order to acknowledgement function
    // });

  }


  onClickToGetWalets = () => {
    // this.props.AddClient();
    this.setState({ instructionModal: !this.state.instructionModal });
  }

  getClient = () => {
    const { clientList } = this.props;
    this.setState({ dataList: clientList })
  }

  onClickToAddTransaction = (currentClient, selectedClient, balance) => {
    const { dataList } = this.state;
    let currentC = dataList.find(x => x.name == currentClient)
    let selectedC = dataList.find(x => x.name == selectedClient)
    const message = balance
    const messageHash = EthCrypto.hash.keccak256(message);

    let signature = EthCrypto.sign(
      currentC.privateKey, // privateKey
      messageHash // hash of message
    );
    let obj = { from: currentC.identity, to: selectedC.identity, balance: parseInt(balance), signature };
    this.state.socket.emit('transaction', obj, function (data) { // args are sent in order to acknowledgement function
    });
    //  this.props.AddTransation(currentC, selectedC, balance, signature)
    //  this.emitEvent(false);
  }

  onRenderTableData = () => {
    const { dataList } = this.state;

    return dataList.map((res) => <tr key={res.name}>
      <td>{res.name}</td>
      <td>{res.identity}</td>
      <td>{res.balance}</td>
      <td>
        <CreateTransactionModal addTransaction={this.onClickToAddTransaction} currentBalance={res.balance} currentClient={res.name} clientList={dataList} />
        <ClientSecureKeyModal clientData={res} />

      </td>
    </tr>)

  }

  onRenderTransactionData = () => {
    const { TransactionList } = this.props;

    // if (TransactionList.length == 49) {
    //   this.setState({ tokenSender: 'complete' })
    // }
    console.log(this.props)
    return TransactionList && TransactionList.map((res, index) => (
      <tr key={index}>
        <td>{res.data && res.data.number}</td>
        <td>{res.message}</td>
        <td>{res.status}</td>
        <td>{res.data && res.data.tokenInfo && res.data.tokenInfo.from}</td>
        <td>{res.data && res.data.tokenInfo && res.data.tokenInfo.blockNumber}</td>
      </tr>))
  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  render() {

    const { classes, tokenSender, TransactionList } = this.props;
    console.log(TransactionList)
    const { instructionModal } = this.state;

    let arrayCount
    if (TransactionList && TransactionList.length) {
      // console.log((TransactionList.length % 50 === 0 ? TransactionList.length/50 : TransactionList.length % 50))
      arrayCount = new Array((parseInt(TransactionList.length / 50) + 1))
      console.log(arrayCount.length)
    }

    return (
      <div className="animated fadeIn">
        <Row>
          <Col>
            <Card>
              <CardBody>
                {!tokenSender && <Button variant="contained" color="primary" onClick={this.onClickToGetWalets} className="primaryButton">
                  Instructions To Run Simulations
                        </Button>}
                <Row>
                  <Col xs="12">
                    <Row>
                      <Col sm="12" className={classes.firstHeader}>
                        <div style={{ justifyContent: 'center', display: 'flex' }}>
                          {tokenSender && tokenSender !== 'complete' ? <h3>Running simulation with {tokenSender}'s token</h3> : (tokenSender ? <h3>Finished</h3> : <></>)}
                        </div>
                      </Col>
                    </Row>
                    {this.state.transactionList.length <= 0 && <Row>
                      <Col sm="12">
                        <Table responsive>
                          {/* <thead>
                            <tr>
                              <th>Name</th>
                              <th>Address</th>
                              <th>Balance</th>
                              <th>Action</th>
                            </tr>
                          </thead> */}
                          <tbody>
                            <tr className={this.props.classes.notFound}>
                              <td colSpan="5">No Running Simulation</td>
                            </tr>
                          </tbody>
                        </Table>
                      </Col>
                    </Row>}
                    {this.state.transactionList.length > 0 && <Row>
                      <Col sm="12">
                        <Table responsive>
                          <thead>
                            <tr>
                              <th>N0.</th>
                              <th>Message</th>
                              <th>Status</th>
                              <th>Token Sender Address</th>
                              <th>Block Number</th>
                            </tr>
                          </thead>
                          <tbody>
                            {this.onRenderTransactionData()}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>}
                  </Col>
                </Row>
              </CardBody>

            </Card>
          </Col>
        </Row>
        {instructionModal && <InstructionModal onClickToGetWallets={this.onClickToGetWalets} />}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  clientList: state.Client,
  TransactionList: state.Transaction,
  TransactionLogList: state.TransactionLog
})

export default connect(mapStateToProps, { AddClient, AddTransation, AddTransactionStore, TransactionLog })(withStyles(styles)(Dashboard));
