import React, { Component, Suspense } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { Container } from 'reactstrap';
import io from 'socket.io-client';


import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';

import { AddTransactionStore } from '../../action/client.action';


import {
  AppAside,
  AppBreadcrumb,
  AppFooter,
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav,
} from '@coreui/react';
// sidebar nav config
import navigation from '../../_nav';
// routes config
import routes from '../../routes';
import { styles } from 'ansi-colors';

const DefaultAside = React.lazy(() => import('./DefaultAside'));
const DefaultFooter = React.lazy(() => import('./DefaultFooter'));
const DefaultHeader = React.lazy(() => import('./DefaultHeader'));

class DefaultLayout extends Component {

  constructor(props) {
    super(props);
    this.state = {
      socket: io(`ws://${process.env.REACT_APP_API_URL}`),
    }
  }

  componentDidMount() {

    let self = this;
    console.log(this.state.socket)
    this.state.socket.on('transactionResponse', function (data) { // args are sent in order to acknowledgement function      
      self.setState({ tokenSender: data.data.tokenInfo.from }, () => {
        self.props.AddTransactionStore(data);
      })
      if (data.data.isLast) {
        self.setState({ tokenSender: 'complete' })
      }
    });
    this.state.socket.on('newTokenReceived', function (data) { // args are sent in order to acknowledgement function      
        console.log(data, "________________________________________'")
    });

  }

  loading = () => <div className="animated fadeIn pt-1 text-center">Loading...</div>

  signOut(e) {
    e.preventDefault()
    this.props.history.push('/login')
  }

  render() {
    return (
      <div className="app">
         <AppHeader style={{justifyContent:'center'}}  fixed>
           <img src="https://3wo7q92bc4bd45x09g3xh3vu-wpengine.netdna-ssl.com/wp-content/uploads/2019/09/logo.png" />
          {/* <Suspense  fallback={this.loading()}>
            <DefaultHeader onLogout={e=>this.signOut(e)}/>
          </Suspense> */}
        </AppHeader>
        <div className="app-body">
          <AppSidebar fixed display="lg" minimized>
            <AppSidebarHeader />
            <AppSidebarForm />
            <Suspense>
              <AppSidebarNav navConfig={navigation} {...this.props} />
            </Suspense>
            <AppSidebarFooter />
            <AppSidebarMinimizer />
          </AppSidebar>
          <main className="main">
            <AppBreadcrumb appRoutes={routes}/>
            <Container fluid>
              <Suspense fallback={this.loading()}>
                <Switch>
                  {routes.map((route, idx) => {                    
                    return route.component ? (
                      <Route
                        key={idx}
                        path={route.path}
                        exact={route.exact}
                        name={route.name}
                        render={props => (
                          <route.component {...props} tokenSender={this.state.tokenSender}/>
                        )} />
                    ) : (null);
                  })}
                  <Redirect from="/" to="/dashboard" />
                </Switch>
              </Suspense>
            </Container>
          </main>          
          <AppAside fixed>
            <Suspense fallback={this.loading()}>
              <DefaultAside />
            </Suspense>
          </AppAside>
        </div> 
         <AppFooter>
           <Suspense fallback={this.loading()}>
             <DefaultFooter />
           </Suspense>
         </AppFooter>
      </div>
    );
  }
}

// export default DefaultLayout;
export default connect(null, { AddTransactionStore })(withStyles(styles)(DefaultLayout));
