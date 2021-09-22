import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Pact from 'pact-lang-api';
import { Route } from 'react-router-dom';
import { toast } from 'react-toastify';

import { networkId, apiHost, modules, heartbeatValidity, gasPrice, gasLimit, ttl } from '../../config';
import { decryptKey, verifyPassword } from '../../utils/security';
import Transfer from '../common/Transfer';
import AssetRows from '../common/AssetRows';
import ActivityRows from '../common/ActivityRows';
import { hideLoading, showLoading } from '../../store/actions/actionCreartor';
import SendPage from '../pages/SendPage';

/* global chrome */

export const HomePage = (props) => {

  const [loaded, setLoaded] = useState(false);
  const [account, setAccount] = useState({});
  const [tabType, setTabType] = useState('assets');

  const passwordRef = useRef();

  const { port } = props;
  const { unlocked, wallets } = account;
  const wallet = wallets && wallets.length > 0 ? wallets[0] : {};
  console.log('account: ', account);

  const { showLoading, hideLoading } = props;

  const authAccount = () => {
    console.log(passwordRef);
    const password = passwordRef.current.value;
    const valid = verifyPassword(password, account.passwordHash);
    if (valid) {
      // decrypt key and store in state
      const newWallets = account.wallets.map(wallet => ({
        ...wallet,
        real: {
          publicKey: decryptKey(wallet.encrypted.publicKey, password),
          secretKey: decryptKey(wallet.encrypted.secretKey, password)
        }
      }));
      port.postMessage({ 'status': 'open' });
      toast.success('welcome back!');
      setAccount({
        ...account,
        wallets: newWallets,
        unlocked: true
      });
    } else {
      toast.error('Please enter correct password');
    }
  };

  const lockAccount = () => {
    port.postMessage({ 'status': 'closed' });
    setAccount({
      ...account,
      unlocked: false
    });
  };


  return loaded === false ? <></> : (
    <div data-role='homepage container' className='w-full'>
      <div data-role='header' className='w-full flex items-center justify-between'>
        <div className='flex items-center'>
          <img src='/img/colorful_logo.svg' className='w-16 my-5' alt='colorful logo' />
          <span className='text-xl text-cb-pink font-bold'>Colorful</span>
        </div>
        <button onClick={ () => lockAccount() }>Lock</button>
      </div>
      {
        account.unlocked ? (
          account.sync ? (
            <div data-role='homepage body' className='w-full h-11/12 border rounded flex flex-col items-center'>
              <Route path='/' exact>
                <Transfer wallet={wallet} />
                <div data-role='asset and tx tabs' className='w-full flex text-lg'>
                  <div 
                    className={`w-1/2 py-2 text-center border-b-2 ${tabType === 'assets' ? 'border-pink-500' : 'border-white'}`}
                    onClick={ () => setTabType('assets') }
                  >
                    Assets</div>
                  <div 
                    className={`w-1/2 py-2 text-center border-b-2 ${tabType === 'activities' ? 'border-pink-500' : 'border-white'}`}
                    onClick={ () => setTabType('activities') }
                  >
                    Activities
                  </div>
                </div>
                { tabType === 'assets' ?
                  <AssetRows wallet={wallet} /> :
                  <ActivityRows wallet={wallet} />
                }
              </Route>
              <Route path='/send'>
                <SendPage wallet={wallet} />
              </Route>
            </div>
          ) : <></>
        ) : (
          <div data-role='homepage body' className='w-full h-11/12 border rounded flex flex-col items-center'>
            <img src='/img/colorful_logo.svg' className='w-32 my-5' alt='colorful logo' />
            <p>Welcore Back!</p>
            <label>Password</label>
            <input type='password' ref={passwordRef} />
            <button onClick={ () => authAccount() }>Unlock</button>
          </div>
        )
      }
    </div>
  );
};

HomePage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  port: state.root.port
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(HomePage);
