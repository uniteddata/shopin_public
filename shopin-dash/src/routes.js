import React from 'react';
import DefaultLayout from './containers/DefaultLayout';
import InstructionModal from './components/InstructionModal';


const Dashboard = React.lazy(() => import('./views/Dashboard'));
const TransactionLog = React.lazy(() => import('./views/Dashboard/TransactionLog'));
const Wallets = React.lazy(() => import('./views/Dashboard/Wallets'));
const Token = React.lazy(() => import('./views/Dashboard/token'));

// /home/adminpc/shopin-stuff/shopin-dash/src/components/ClientSecureKeyModal.js


const routes = [
  { path: '/', exact: true, name: 'Home', component: DefaultLayout },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/transaction', name: 'Transaction', component: TransactionLog },
  { path: '/wallet', name: 'Wallet', component: Wallets },
  { path: '/token', name: 'Tokens', component: Token },
  { path: '/instructions', name: 'Instructions', component: InstructionModal },
];

export default routes;
