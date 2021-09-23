import React, { useEffect } from 'react';
import { HashRouter as Router, Route, Redirect } from 'react-router-dom';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactLoading from 'react-loading';

import InitializePage from './entries/InitializePage';
import HomePage from './entries/HomePage';
import { savePort } from '../store/actions/actionCreartor';

/* global chrome */
export const App = (props) => {

  const { loading } = props;

  useEffect(() => {
  }, []);

  return (
    <div data-role='app-container' className='w-2/3 mx-auto relative'>
      <Router>
        <ToastContainer position='top-center' />
        { loading && 
          <div 
            className='absolute top-40 w-full'
          >
            <div className='w-80 mx-auto h-80 border rounded-lg flex flex-col items-center justify-center bg-white z-50'>
              <ReactLoading type='cubes' color='rgb(254, 94, 174)' height='100px' width='100px' />
              <p className='mt-10'>Please wait 30~60 seconds</p>
            </div>
          </div>
        }
        <Route path='/popup'>
          <Router basename='/popup'>
            <button onClick={ () => chrome.tabs.create({ url: '/index.html#/initialize' }) }>Hello</button>
          </Router>
        </Route>
        <Route path='/initialize'>
          <Router basename='/initialize'>
            <InitializePage />
          </Router>
        </Route>
        <Route path='/home'>
          <Router basename='/home'>
            <HomePage />
          </Router>
        </Route>
        <Redirect from='/' to='/initialize' />
      </Router>
    </div>
  );
};


App.propTypes = {
  loading: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  loading: state.root.loading
});

const mapDispatchToProps = dispatch => ({
  savePort: (port) => dispatch(savePort(port))
});

export default connect(mapStateToProps, mapDispatchToProps)(App);