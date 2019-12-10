import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardHeader, FormGroup, Label,  Col, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
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

class ClientSecureKeyModal extends React.Component {
  state = {
    open: false
  };
  
  toggle = () => {
    this.setState({ open: !this.state.open});
  };

  render() {    
    return (
      <>
        <IconButton onClick={this.toggle} title="Secure Key">
            <VpnKeyIcon />
        </IconButton>
        <Modal isOpen={this.state.open} toggle={this.toggle} className={this.props.className}>  
            <ModalBody>
                <Col xs="12" className={this.props.classes.container}>
                    <span className={this.props.classes.firstLabel}>Publickey : </span>{this.props.clientData.publicKey}<span></span>
                </Col>
                <Col xs="12" className={this.props.classes.container}>
                    <span className={this.props.classes.firstLabel}>Privatekey : </span>{this.props.clientData.privateKey}<span></span>
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

export default withStyles(styles)(ClientSecureKeyModal);