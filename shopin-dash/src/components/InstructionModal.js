import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardHeader, FormGroup, Label, Col, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import validateInput from '../shared/Dashboard/CreateTransactionModal';
import { withStyles } from '@material-ui/core/styles';

const styles = {
  container: {
    wordBreak: 'break-word'
  },
  firstLabel: {
    fontWeight: '700'
  },
  secondLabel: {

  }
};

class InstructionModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      open: true
    }
  }

  componentDidMount() {
    // this.toggle()
  }

  toggle = () => {
    this.setState({ open: !this.state.open });
    if(this.props.onClickToGetWallets) {
      this.props.onClickToGetWallets()
    }else {
      this.props.history.push('/dashboard');
    }
  };

  render() {
    return (
      <>
        {/* <IconButton onClick={this.toggle} title="Secure Key">
            <VpnKeyIcon />
        </IconButton> */}
        <Modal isOpen={this.state.open} toggle={this.toggle} className={this.props.className}>
          <ModalBody>
            <Col xs="12">
              {/* <span className={this.props.classes.firstLabel}>Publickey : </span>{this.props.clientData.publicKey}<span></span> */}
              <h4>Instructions To Run Simulations:</h4>
            </Col>
            <Col xs="12">
              {/* <span className={this.props.classes.firstLabel}>Privatekey : </span>{}<span></span> */}
              <p>-> To run simulations on the Shopin Testnet, please send SHOP tokens to either of these White Listed Wallets:
0xDA090994048AA4afFE37D7F5195e25662d465FB8
0xda078e19B3B5BBc03BA8b67B8326f95a52417f46 </p>
              <p>(1 SHOP token will trigger 1 simulated transaction on the testnet)</p>
              <p>-> Once our Shopin Account receives your token, we'll simulate a transaction on the Shopin Testnet.</p>
              <p>-> If there are simulations already running, your token will be added the queue and will run when its your turn.</p>
              <p>-> When you've successfully transferred SHOP token to our Account, you will see your Token Entry in the "Tokens" Tab.</p>
              
            </Col>
          </ModalBody>
          <ModalFooter>
            <Button variant="contained" className="primaryButton" color="primary" onClick={this.toggle}>Ok</Button>
          </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default withStyles(styles)(InstructionModal);