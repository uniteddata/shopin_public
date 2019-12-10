import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardBody, CardHeader, FormGroup, Label,  Col, Input, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import Button from '@material-ui/core/Button';

class CreateClientModal extends React.Component {
  state = {
    open: false,
    numberOfClient: '',
    isValid: false
  };


  toggle = () => {
    this.setState({ open: !this.state.open, numberOfClient: '', isValid: false});
  };

  onClickToAdd = () => {      
      if(this.state.numberOfClient!='') {
        this.props.addClient(this.state)
        this.setState({ open: !this.state.open });
      } else {
        this.setState({ isValid: true });
      }
      
  }
  
  onChangeValue = (e) => {
    this.setState({[e.target.id] : e.target.value}, () => {
       if(this.state.isValid && this.state.numberOfClient!='') {
          this.setState({isValid: false})
       }
    })
  }

  render() {
    return (
      <>
        <Button variant="contained" color="primary" onClick={this.toggle} className="primaryButton">
            Generate Client
        </Button>
        
        <Modal isOpen={this.state.open} toggle={this.toggle} className={this.props.className}>
            <ModalHeader toggle={this.toggle}>Generate Client</ModalHeader>
            <ModalBody>            
            <Col xs="12">
                <FormGroup>
                    <Input type="number" min="0" id="numberOfClient" value={this.state.numberOfClient} onChange={this.onChangeValue.bind(this)} placeholder="Enter Number Of Clients" required />
                    {this.state.isValid && <em className="has-error">Please Enter Number Of Clients</em>}
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

export default CreateClientModal;