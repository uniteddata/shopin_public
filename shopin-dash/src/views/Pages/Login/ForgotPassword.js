import React, { Component } from 'react';
import { connect } from 'react-redux';
import { forgotPassword } from '../../../action/auth.action';
import { Alert, Button, Card, CardBody, CardGroup, Col, Container, Form, Input, InputGroup, InputGroupAddon, InputGroupText, Row } from 'reactstrap';
import validateInput from '../../../shared/Login/ForgotPassword';
import { withStyles } from '@material-ui/styles';

const styles = {
    successIcon: {
        fontSize: '64px !important',
        color: 'green'
    },
    successCard: {
        textAlign: 'center'
    },
    successTitle: {
        lineHeight: '60px'
    }
};

class ForgotPassword extends Component {
  constructor(props) {
    super(props)

    this.state = {
      emailId: "",
      errors: {},
      isValid: false, 
      isSubmit: false,
      isSendMail: false
    }
    
    this.onChangeValue = this.onChangeValue.bind(this);
    this.onClickLogin = this.onClickLogin.bind(this);
  }
  
  onChangeValue = (e) => {
    this.setState({ [e.target.name] : e.target.value }, () => {
      if(this.state.isSubmit) {
        this.isValid(this.state);
      }    
    });      
  }
    
  isValid = (data) => {
    let { isValid, errors } = validateInput(data);
    
    this.setState({isValid, errors});
    
    return isValid;
  }

  onClickLogin = (e) => {
    e.preventDefault();
    // this.props.LoginApi(this.state);
    this.setState({isSubmit: true});
    
    if(this.isValid(this.state)) {
      this.props.forgotPassword(this.state).then((res) => {
          if(res.data.code == 400) {
            this.setState({errors: {...this.state.errors, header: res.data.message}})
            setTimeout(() => {
                this.setState({errors: {...this.state.errors, header: ""}})
            }, 4000)
          } else {
            this.setState({isValid: false, isSendMail: true});
          }
      });
    }
  }

  render() {
    
    const {errors} = this.state;
    const {classes} = this.props;
    
    return (
        <Card className="p-4">
            <CardBody>
            {!this.state.isSendMail && <Form onSubmit={this.onClickLogin}>
                <h1>Forgot Your Password?</h1>
                <p className="text-muted">Enter your email to receive recovery information</p>
                {this.state.errors.header && <Alert color="danger">
                    {this.state.errors.header}
                </Alert>}
                <InputGroup className="mb-3">
                <InputGroupAddon addonType="prepend">
                    <InputGroupText>
                        <i className="icon-envelope"></i>
                    </InputGroupText>
                </InputGroupAddon>
                <Input type="text" placeholder="Email" name="emailId" value={this.state.username} onChange={this.onChangeValue} autoComplete="username" />
                {errors.emailId && <em className="has-error">{errors.emailId}</em>}
                </InputGroup>
                <Row>
                <Col xs="6">
                    <Button color="primary" className="px-4" onClick={this.onClickLogin}>Send</Button>
                </Col>
                <Col xs="6" className="text-right">
                    <Button color="link" className="px-0" onClick={(e) =>   this.props.onChange(true)}>Back to login</Button>
                </Col>
                </Row>
            </Form>}
            {this.state.isSendMail && <div className={classes.successCard}>                
                <i className={`icons font-2xl d-block cui-circle-check ${classes.successIcon}`}></i>
                <h3 className={classes.successTitle}>Password Reset Email Sent</h3>
                <p className="text-muted">An email has been sent to your email address, {this.state.emailId}. Follow to direction  in the email to get your password.</p>
                <Button color="primary" className="px-4" onClick={(e) =>   this.props.onChange(true)}>Done</Button>
            </div>}
            </CardBody>
        </Card>
    );
  }
}

export default connect(null, {forgotPassword})(withStyles(styles)(ForgotPassword));
