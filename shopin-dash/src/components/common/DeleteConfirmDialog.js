import React from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardBody, CardHeader, Col, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

class DeleteConfirmDialog extends React.Component {
  state = {
    open: false,
  };

  toggle = () => {
    this.setState({ open: !this.state.open });
  };

  onClickToDelete = () => {
      const {onClick, deleteId} = this.props;
      
      onClick(deleteId)
      this.setState({ open: !this.state.open });
  }
  
  render() {
    return (
      <>
        <IconButton aria-label="Delete" onClick={this.toggle}>
          <DeleteIcon fontSize="small" />
        </IconButton>
        <Modal isOpen={this.state.open} toggle={this.toggle} className={this.props.className}>
            <ModalHeader toggle={this.toggle}>Delete User</ModalHeader>
            <ModalBody>
                Are you sure you want to delete this user?
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={this.toggle}>Cancel</Button>
                <Button color="danger" onClick={this.onClickToDelete}>Delete</Button>
            </ModalFooter>
        </Modal>
      </>
    );
  }
}

export default DeleteConfirmDialog;