import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardHeader, FormGroup, Label,  Col, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import AccountBalanceWalletIcon from '@material-ui/icons/AccountBalanceWallet';
import validateInput from '../shared/Dashboard/CreateTransactionModal';

class CreateTransactionModal extends React.Component {
  state = {
    open: false,
    balance: '',
    selectedClient: '',
    options: [],
    isValid: false,
    isSubmit: false,
    errors: {}
  };

  getClient = () => {
    const options = [];
    this.props.clientList.map(res => {
        options.push(res)
    })
    this.setState({options});
  }
  
  toggle = () => {
    this.setState({ 
        open: !this.state.open,
        balance: '',
        selectedClient: '',
        isValid: false,
        isSubmit: false,
        options: [],
        errors: {}
    }, () => {
        if(this.state.open) {this.getClient()}
    });
  };

  isValid = (data) => {
    let { isValid, errors } = validateInput(data);
    
    this.setState({isValid, errors});

    return isValid;
  }

  onClickToAdd = () => {      
      const {selectedClient, balance} = this.state;
      
      this.setState({isSubmit: true});      
      if(this.isValid(this.state)) {
        this.props.addTransaction(this.props.currentClient, selectedClient, balance);
        this.setState({open: !this.state.open})
      }
  }

  onChangeValue = (e) => {
    this.setState({[e.target.id] : e.target.value}, () => {
        if(this.state.isSubmit) {
            this.isValid(this.state)
        }
        
        if(this.state.balance > this.props.currentBalance) {
            this.setState({balance: '', errors: {...this.state.errors, balance: `Your balance is ${this.props.currentBalance}, You can't add more.`}})
        } else { 
            if(!this.state.isSubmit) {
                this.setState({errors: {...this.state.errors, balance: ''}})
            }
        }
        
    })
  }

  onRenderOption = () => {
    return this.state.options.filter(x => x.name!=this.props.currentClient).map(x => <option key={x.name} value={x.name}>{x.name}</option>)
  }

  render() {
    return (
      <>
        <IconButton onClick={this.toggle} title="Send Transaction">
            <AccountBalanceWalletIcon />
          </IconButton>
        <Modal isOpen={this.state.open} toggle={this.toggle} className={this.props.className}>
            <ModalHeader toggle={this.toggle}>Transaction</ModalHeader>
            <ModalBody>
                <Col xs="12">
                    <FormGroup>
                        <Label>Client</Label>
                        <Input type="select" name="selectedClient" value={this.state.selectedClient} id="selectedClient" onChange={this.onChangeValue.bind(this)}>
                            <option value="">Please Select Client</option>
                            {this.onRenderOption()}
                        </Input>
                        {this.state.errors.selectedClient && <em className="has-error">{this.state.errors.selectedClient}</em>}
                    </FormGroup>
                </Col>
                <Col xs="12">
                    <FormGroup>
                        <Input type="number" min="0" id="balance" value={this.state.balance} onChange={this.onChangeValue.bind(this)} placeholder="Enter Amount" required />
                        {this.state.errors.balance && <em className="has-error">{this.state.errors.balance}</em>}
                    </FormGroup>
                </Col>
            </ModalBody>
            <ModalFooter>
                <Button onClick={this.toggle}>Cancel</Button>
                <Button variant="contained" className="primaryButton" color="primary" onClick={this.onClickToAdd}>Save</Button>
            </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default CreateTransactionModal;