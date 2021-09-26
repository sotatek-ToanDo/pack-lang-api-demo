import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Pact from 'pact-lang-api';

import { chainsCount, gasPrice, gasLimit, ttl, networkId, apiHost } from '../../config';
import { getTimestamp } from '../../utils/tools';
import { hideLoading, showLoading } from '../../store/actions/actionCreartor';
import { toast } from 'react-toastify';

const getApiHost = (chainId) => {
  return `https://api.chainweb.com/chainweb/0.0/${networkId}/chain/${chainId}/pact`;
}

export const SendPage = (props) => {

  const { showLoading, hideLoading } = props;
  const [txData, setTxData] = useState({
    sender: '',
    senderChainId: '0',
    receiverChainId: '0',
    privateKey: '',
    receiver: '',
  });

  const chainIds = Array(chainsCount).fill(0).map((_, i) => `${i}`);

  const changeReceiver = async (receiver) => {
    const cmd = {
      pactCode: `(coin.get-balance "${receiver}")`,
      envData: {},
      meta: Pact.lang.mkMeta('', '', gasPrice, gasLimit, 0, ttl),
      networkId
    };
    await Pact.fetch.local(cmd, getApiHost(txData.receiverChainId)).then(data => {
      const result = data.result;
      if (result.status !== 'success') {
        toast.warning('Receiver is not existing');
      }
    });
    setTxData({...txData, receiver});
  };

  const changeSender = async (sender) => {
    const cmd = {
      pactCode: `(coin.get-balance "${sender}")`,
      envData: {},
      meta: Pact.lang.mkMeta('', '', gasPrice, gasLimit, 0, ttl),
      networkId
    };
    await Pact.fetch.local(cmd, getApiHost(txData.senderChainId)).then(data => {
      const result = data.result;
      if (result.status !== 'success') {
        toast.warning('Sender is not existing');
      }
    });
    setTxData({...txData, sender});
  };

  const clickTransfer = () => {
    const publicKey = Pact.crypto.restoreKeyPairFromSecretKey(txData.privateKey).publicKey;
    const { sender, receiver, senderChainId, amount, privateKey } = txData;
    const cmd = {
      keyPairs: {
        publicKey,
        secretKey: privateKey,
        clist: [
          Pact.lang.mkCap('gas', 'pay gas', 'coin.GAS')['cap'],
          Pact.lang.mkCap('transfer', 'transfer coin', 'coin.TRANSFER', [sender, receiver, amount])['cap']
        ]
      },
      pactCode: `(coin.transfer "${sender}" "${receiver}" (read-decimal "amount"))`,
      envData: {
        amount
      },
      meta: Pact.lang.mkMeta(sender, senderChainId, gasPrice, gasLimit, getTimestamp(), ttl),
      networkId
    };
    console.log('cmd', cmd);
    showLoading();
    Pact.fetch.send(cmd, apiHost).then(data => {
      console.log(data);
      const requestKey = data.requestKeys[0];
      const listenCmd = {
        'listen': requestKey
      };
      Pact.fetch.listen(listenCmd, apiHost).then((data) => {
        console.log(data);
        hideLoading();
      });
    });
  };

  return (
    <div className='w-full flex flex-col items-center'>
      <label className='text-lg font-bold mt-10 mb-2'>Sender</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-1/2 h-full border px-2' onChange={ (e) => changeSender(e.target.value) } />
        <select className='w-1/4 h-full border' onChange={ (e) => setTxData({...txData, senderChainId: chainIds[e.target.selectedIndex]}) }>
          { chainIds.map(chainId => (
              <option>
                { `Chain ${chainId}` }
              </option>
            ))
          }
        </select>
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Receiver</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-1/2 h-full border' onChange={ (e) => changeReceiver(e.target.value) } />
        <select className='w-1/4 h-full border' onChange={ (e) => setTxData({...txData, receiverChainId: chainIds[e.target.selectedIndex]}) }>
          { chainIds.map(chainId => (
              <option>
                { `Chain ${chainId}` }
              </option>
            ))
          }
        </select>
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Amount</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='number' className='w-3/4 h-full border' onChange={ (e) => setTxData({...txData, amount: parseFloat(e.target.value)}) } />
      </div>
      <label className='text-lg font-bold mt-10 mb-2'>Private Key</label>
      <div className='w-full flex items-center justify-center h-12'>
        <input type='text' className='w-3/4 h-full border' onChange={ (e) => setTxData({...txData, privateKey: e.target.value}) } />
      </div>
      <button className='px-8 py-2 bg-cb-pink text-white rounded mt-10' onClick={ () => clickTransfer() }>
        Make Transfer
      </button>
    </div>
  );
};

SendPage.propTypes = {
  props: PropTypes
};

const mapStateToProps = (state) => ({
  
});

const mapDispatchToProps = dispatch => ({
  showLoading: () => dispatch(showLoading()),
  hideLoading: () => dispatch(hideLoading())
});

export default connect(mapStateToProps, mapDispatchToProps)(SendPage);
