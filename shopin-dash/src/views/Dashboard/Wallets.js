import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { AddClient, AddTransation, TransactionLog } from '../../action/client.action';
import io from 'socket.io-client';

import {
  Card,
  CardBody,
  Col,
  Row,
  Table,
} from 'reactstrap';
import Axios from 'axios';
import ClientSecureKeyModal from '../../components/ClientSecureKeyModal';

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

class Wallet extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataList: [],
      walletLogList: [],
      socket: io(process.env.REACT_APP_API_URL),
    }

  }

  async componentDidMount() {

    await Axios.get(`http://${process.env.REACT_APP_API_URL}/wallets`).then((res, err) => this.setState({ dataList: !res.data.data ? [] : res.data.data }))

  }
  onRenderTableData = () => {
    const { dataList } = this.state;

    return dataList.map((res) => <tr key={res.name}>
      <td>{res.name}</td>
      <td>{res.identity}</td>
      <td>{res.balance}</td>
      <td>
        {/* <CreateTransactionModal addTransaction={this.onClickToAddTransaction} currentBalance={res.balance} currentClient={res.name} clientList={dataList} /> */}
        <ClientSecureKeyModal clientData={res} />

      </td>
    </tr>)

  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  render() {

    const { classes } = this.props;

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
                              <th>Name</th>
                              <th>Address</th>
                              <th>Balance</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {this.onRenderTableData()}
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

export default connect(mapStateToProps, { AddClient, AddTransation, TransactionLog })(withStyles(styles)(Wallet));
