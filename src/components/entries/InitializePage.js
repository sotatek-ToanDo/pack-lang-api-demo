import React, { useRef, useState } from 'react';
import ReactJson from 'react-json-view';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route, Link, Redirect, Switch } from 'react-router-dom';
import { toast } from 'react-toastify';
import Pact from 'pact-lang-api';

import { createWalletConfig, serverUrl } from '../../config';
import { showLoading, hideLoading } from '../../store/actions/actionCreartor';
import { encryptPassword } from '../../utils/security';
import * as types from '../../store/actions/actionTypes';
import { fetchCustomLocal } from '../../utils/chainweb';
import { mkReq } from '../../utils/tools';

export const InitializePage = (props) => {
  const addressRef = useRef();
  const publicKeyRef = useRef();
  const secretKeyRef = useRef();
  const passwordRef = useRef();
  const repeatedPasswordRef = useRef();
  const [data, setData] = useState({});

  const { showLoading, hideLoading, port } = props;
  const keyPairs = Pact.crypto.genKeyPair();

  const header = (
    <div className="flex items-center top-60">
      <span className="text-xl text-cb-pink font-bold">Tets API</span>
    </div>
  );

  const createWallet = async () => {
    const { address, publicKey, secretKey, password, repeatedPassword } =
      getRefValues();
    if (address.length < createWalletConfig.minAddressLength) {
      toast.warn('Address is too short');
      return;
    }
    if (address.length > createWalletConfig.maxAddressLength) {
      toast.warn('Address is too long');
      return;
    }
    if (!password) {
      toast.warn('Please enter your password');
      return;
    }
    if (password.length < createWalletConfig.minPasswordLength) {
      toast.warn('Password is too short');
      return;
    }
    if (password.length > createWalletConfig.maxPasswordLength) {
      toast.warn('Password is too long');
      return;
    }
    if (!repeatedPassword) {
      toast.warn('Please enter your password');
      return;
    }
    if (repeatedPassword !== password) {
      toast.warn('Password is not matched');
      return;
    }

    // check existance
    showLoading();

    const url = `${serverUrl}/colorful/create-wallet`;
    const postData = {
      address,
      public_key: publicKey,
    };
    const result = await fetch(url, mkReq(postData))
      .then((res) => res.json())
      .catch((error) => {
        console.log(error);
        toast.error(error.message);
      });
    hideLoading();

    if (result) {
      // encrypt keys with password
      const passwordHash = encryptPassword(password);
      const account = {
        passwordHash,
        wallets: [
          {
            address,
            publicKey,
            secretKey,
          },
        ],
      };

      port.postMessage({ action: types.CREATE_ACCOUNT, account });
    }
  };

  const importWallet = async () => {
    const secretKey = secretKeyRef.current.value;
    let publicKey;
    try {
      publicKey = Pact.crypto.restoreKeyPairFromSecretKey(secretKey).publicKey;
    } catch (e) {
      console.log(e);
      toast.warning(e.message);
      return;
    }
    publicKeyRef.current.value = publicKey;
    const address = addressRef.current.value;
    console.log(publicKey);
    console.log('now fetch ', publicKey);
    const code = `(coin.details "${address}")`;
    let promiseList = [];
    for (let i = 0; i < 20; i++) {
      promiseList.push(fetchCustomLocal(code, i));
    }
    Promise.all(promiseList).then((res) => {
      console.log('data', res);
      setData(res);
    });

    // const passwordHash = encryptPassword('123');
    // const account = {
    //   passwordHash,
    //   wallets: [
    //     {
    //       address,
    //       publicKey,
    //       secretKey,
    //     },
    //   ],
    // };
    // // updateBalance(account);
  };

  // const updateBalance = async (account) => {
  //   const fetchedWallets = account.wallets.map(async (wallet) => {
  //     console.log('now fetch ', wallet);
  //     const code = `(coin.get-balance "${wallet.address}")`;
  //     const request = fetchLocal(code);
  //     return await request.then((data) => {
  //       const result = data.result;
  //       console.log(result);
  //       wallet.balance = {
  //         coin: result.data,
  //       };
  //       return wallet;
  //     });
  //   });
  //   const wallets = await Promise.all(fetchedWallets);

  //   // update wallets
  //   console.log('wallets 111', wallets);
  //   account.wallets = wallets;
  // };

  const getRefValues = () => {
    return {
      address: addressRef.current.value,
      publicKey: publicKeyRef.current.value,
      secretKey: secretKeyRef.current.value,
      password: passwordRef.current.value,
      repeatedPassword: repeatedPasswordRef.current.value,
    };
  };

  const isShow = false;

  return (
    <div className="w-full">
      <Switch>
        <Route path="/welcome">
          <div
            data-role="app container"
            className="flex flex-col items-center pt-20 font-work w-120 mx-auto"
          >
            <div className="text-center my-5">
              <p>You will connect to Kadena network through Pact lang API.</p>
              <p>Glad to see you.</p>
            </div>
            <Link to="/select-action">
              <button className="px-8 py-2 bg-cb-pink text-white rounded mt-10">
                Start Using
              </button>
            </Link>
          </div>
        </Route>
        <Route path="/select-action">
          {header}
          <div>
            <p className="my-10 text-center text-xl font-semibold">
              Please select from the options below
            </p>
            <div className="flex h-80">
              <div className="w-1/2 h-full px-5">
                <div className="h-full border rounded flex flex-col items-center pt-10">
                  <img
                    src="/img/search.svg"
                    className="w-16 h-16"
                    alt="download"
                  />
                  <p className="text-lg mt-5">
                    Check balance of the wallet
                  </p>
                  <p className="text-xs my-2 text-gray-500">
                    Type private key and address
                  </p>
                  <Link to="/import-wallet">
                    <button className="px-8 py-2 bg-cb-pink text-white rounded mt-10">
                      Check Balance
                    </button>
                  </Link>
                </div>
              </div>
              <div className="w-1/2 h-full px-5">
                <div className="h-full border rounded flex flex-col items-center pt-10">
                  <img
                    src="/img/add.png"
                    className="w-16 h-16"
                    alt="download"
                  />
                  <p className="text-lg mt-5">First time, setup right now!</p>
                  <p className="text-xs my-2 text-gray-500">
                    Will create private key for your new wallet
                  </p>
                  <Link to="/create-wallet">
                    <button className="px-8 py-2 bg-cb-pink text-white rounded mt-10">
                      Create Wallet
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Route>
        <Route path="/create-wallet">
          {header}
          <div>
            <div data-role="register kda account" className="flex flex-col">
              <label className="mt-5 mb-2">Your public key</label>
              <input
                type="text"
                className="bg-gray-300"
                value={keyPairs.publicKey}
                ref={publicKeyRef}
                readOnly
              />
              <label className="mt-5 mb-2">
                Your private key{' '}
                <span className="text-xs text-red-500 ml-5">
                  You must store it in safe place.
                </span>
              </label>
              <input
                type="text"
                className="bg-gray-300"
                value={keyPairs.secretKey}
                ref={secretKeyRef}
                readOnly
              />
              {isShow && (
                <button
                  className="px-8 py-2 bg-cb-pink text-white rounded mt-20"
                  onClick={() => createWallet()}
                >
                  Generate
                </button>
              )}
              <Link to="/select-action" className="button-check">
                <button className="px-8 py-2 bg-cb-pink text-white rounded">
                  Done
                </button>
              </Link>
            </div>
          </div>
        </Route>
        <Route path="/import-wallet">
          {header}
          <div>
            <div data-role="register kda account" className="flex flex-col">
              <label className="mt-5 mb-2">Set Your address</label>
              <input type="text" ref={addressRef} className="input-text" />
              <div hidden>
                <input type="text" className="bg-gray-300" ref={publicKeyRef} />
              </div>
              <label className="mt-5 mb-2">Your private key</label>
              <input type="text" ref={secretKeyRef} className="input-text" />
              <button
                className="px-8 py-2 bg-cb-pink text-white rounded mt-20 button-check"
                onClick={() => importWallet()}
              >
                Check Balance
              </button>
            </div>
            {data && data.length > 0 && <ReactJson src={data} />}
          </div>
        </Route>
        <Route path="/finish">
          {header}
          <div className="mt-10 flex flex-col items-center">
            <p className="text-lg">Congratulations!</p>
            <p>You have finished wallet registration.</p>
            <button className="px-8 py-2 bg-cb-pink text-white rounded mt-10">
              <a href="/index.html">Done</a>
            </button>
          </div>
        </Route>
        <Redirect from="/" to="/welcome" />
      </Switch>
    </div>
  );
};

InitializePage.propTypes = {
  wallet: PropTypes.object.isRequired,
  loading: PropTypes.bool.isRequired,
  showLoading: PropTypes.func.isRequired,
  hideLoading: PropTypes.func.isRequired,
};

const mapStateToProps = (state) => ({
  loading: state.root.loading,
  port: state.root.port,
});

const mapDispatchToProps = (dispatch) => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading()),
});

export default connect(mapStateToProps, mapDispatchToProps)(InitializePage);
