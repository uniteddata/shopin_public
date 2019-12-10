import React, { Component } from 'react';  
import { connect } from 'react-redux';

export default function(ComposedComponent) {  
  class Authentication extends Component {
    componentWillMount() {
      if(!this.props.Auth.isAuthenticate) {        
        this.props.history.push('/login');
      }
    }

    componentWillUpdate(nextProps) {
      if(!nextProps.Auth.isAuthenticate) {
        this.props.history.push('/login');
      }
    }

    render() {
      return <ComposedComponent {...this.props} />
    }
  }

  function mapStateToProps(state) { 
    return { Auth: state.Auth};
  }

  return connect(mapStateToProps)(Authentication);
}