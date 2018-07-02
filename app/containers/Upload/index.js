/*
 *
 * Upload
 *
 */

import _ from 'lodash';
import React from 'react';
import PropTypes from 'prop-types';
import Script from 'react-load-script';
import { connect } from 'react-redux';
import { withStyles } from 'material-ui/styles';
import Paper from 'material-ui/Paper';
import Button from 'material-ui/Button';
import Grid from 'material-ui/Grid';
import { MdFileUpload, MdRefresh, MdThumbUp, MdChevronRight } from 'react-icons/lib/md';
import Modal from 'material-ui/Modal';
import IFrame from 'react-iframe';


import { createStructuredSelector } from 'reselect';
import FileDrop from 'react-file-drop';
import axios from 'axios';

import { apiRoot } from 'utils/constants';
import PublicationView from 'components/PublicationView';
import { prettyPrintReference } from 'utils/functions';

import makeSelectUpload from './selectors';

const backendRoot = `${apiRoot}/apps/upload`;
const url = `${backendRoot}/upload_dataset/`;
const userInfoUrl = `${backendRoot}/user_info`;
const logoutUrl = `${backendRoot}/logout`;

const uploadGraphqlRoot = 'http://localhost:5000/apps/upload/graphql';


const styles = (theme) => ({
  dataEntry: {
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
  },
  paper: {
    padding: theme.spacing.unit,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
    paddingLeft: theme.spacing.unit * 3,
  },
});

export class Upload extends React.Component { // eslint-disable-line react/prefer-stateless-function
  constructor(props) {
    super(props);
    this.state = {
      uploadError: '',
      loginModalOpen: false,
      loginUrl: '',
      userInfo: {},
      datasets: [],
      pubId: '',
      showHelp: true,
    };

    this.logout = this.logout.bind(this);
    this.fetchUserInfo = this.fetchUserInfo.bind(this);
    this.getDatasets = this.getDatasets.bind(this);
    this.handleFileDrop = this.handleFileDrop.bind(this);
    this.handleSocialLogin = this.handleSocialLogin.bind(this);
    this.handleSocialLoginFailure = this.handleSocialLoginFailure.bind(this);
    this.login = this.login.bind(this);
    this.setDataset = this.setDataset.bind(this);
    this.toggleHelp = this.toggleHelp.bind(this);
    this.windowLogin = this.windowLogin.bind(this);
  }

  componentDidMount() {
    if (_.get(this.props, 'location.query.login') === 'success') {
      this.fetchUserInfo();
    }
  }
  componentWillReceiveProps(nextProps) {
    if (_.get(nextProps, 'location.query.login') === 'success') {
      this.fetchUserInfo();
    }
  }

  getDatasets() {
    const datasetQuery = `{publications { totalCount edges { node {
    title authors doi pubId journal volume pages year
  } } }}`;
    axios.get(uploadGraphqlRoot, {
      params: {
        query: datasetQuery,
      },
      withCredentials: true,
    }).then((response) => {
      this.setState({
        datasets: response.data.data.publications.edges.map(
          (edge) => edge.node),
      });
    });
  }

  setDataset(dataset) {
    this.setState({
      pubId: dataset.pubId,
    });
  }

  handleSocialLogin() {
  }


  handleSocialLoginFailure() {
  }

  fetchUserInfo() {
    axios.get(userInfoUrl, {
      data: {},
      withCredentials: true,
    }).then((response) => {
      this.setState({
        userInfo: response.data,

      });
    });
  }


  login() {
    const uploadUrl = `${apiRoot}/apps/upload/submit`;
    axios.get(uploadUrl).then((response) => {
      this.setState({
        loginModalOpen: true,
        loginUrl: response.data.location,
      });
    });
  }

  logout() {
    axios(logoutUrl, {
      method: 'post',
      data: {},
      withCredentials: true,
    }).then(() => {
      this.setState({
        userInfo: {},
        datasets: [],
        pubId: '',
      });
    });
  }

  windowLogin() {
    const uploadUrl = `${apiRoot}/apps/upload/submit`;
    axios.get(uploadUrl).then((response) => {
      window.open(response.data.location);
      window.focus();
      window.close();
    });
  }

  handleClose() {
    this.setState({
      loginModalOpen: false,
    });
  }

  handleFileDrop(files) {
    const formData = new FormData();
    formData.append('file', files[0]);
    axios.post(url, formData, { headers: { 'content-type': 'multipart/form-data' } }).then((response) => response);
  }

  toggleHelp() {
    this.setState({
      showHelp: !this.state.showHelp,
    });
  }

  render() {
    return (
      <div>
        <Script url="https://code.jquery.com/jquery-3.2.1.min.js" />
        <Script url="/static/ChemDoodleWeb.js" />
        <Modal
          aria-labelledby="simple-modal-title"
          aria-describedby="simple-modal-description"
          open={this.state.loginModalOpen}
          onClose={() => { this.handleClose(); }}
          style={{
            backgroundColor: 'white',
          }}
        >
          <IFrame
            url={this.state.loginUrl}
            width="95vw"
            height="95vh"
            position="relative"
            top="50px"
            display="initial"
          />
        </Modal>
        <h2>Upload Datasets
          {!_.isEmpty(this.state.userInfo) ?
              `\u00A0\u00A0(${this.state.userInfo.email})`

              : null}
        </h2>
        <Paper className={this.props.classes.paper}>
          {!_.isEmpty(this.state.userInfo) ? null :
          <Grid container direction="row" justify="flex-end">
            <Grid item>
              <Button
                raised
                color="primary"
                onClick={() => {
                  this.windowLogin();
                }}
              >
                Login
              </Button>
            </Grid>
          </Grid>
              }
          {_.isEmpty(this.state.userInfo) ? null :
          <Grid container direction="row-reverse" justify="space-between">
            <Grid item>
              <Button
                onClick={() => this.logout()}
              >
                Logout
              </Button>
            </Grid>
            <Grid item>
              <MdFileUpload />{'\u00A0\u00A0'}Drag directory as zip file or gzipped tar archive here.
              <FileDrop
                frame={document}
                onDrop={this.handleFileDrop}
                dropEffect="move"

              >
                <div
                  className={this.props.classes.fileDropActive}
                >
                  Drop File Here.
                </div>
              </FileDrop>
            </Grid>
          </Grid>
              }
          {_.isEmpty(this.state.uploadError) ? null :
          <div className={this.props.classes.error}>{this.state.uploadError}</div>
              }
        </Paper>
        <Paper className={this.props.classes.paper}>
          <Grid container direction="row" justify="space-between">
            <Grid item>
              <h3>How to Submit Reactions from Terminal</h3>
            </Grid>
            <Grid item>
              <Button
                onClick={() => { this.toggleHelp(); }}
              >
                {this.state.showHelp ? 'Got it' : 'Show help' }
              </Button>

            </Grid>
          </Grid>
          {!this.state.showHelp ? null :
          <ol>
            <li>Install catkit: <pre>pip install git+https://github.com/SUNCAT-Center/CatKit.git#egg=catkit</pre></li>
            <li>Organize converged calculations, run <pre>cathub organize {'<foldername>'}</pre></li>
            <li>Turn organized folder into sqlite database, run <pre>cathub folder2db {'<foldername>'}.organized --userhandle {this.state.userInfo.email}</pre></li>
            <li>Upload database, run <pre>cathub db2server {'<NameTitlewordYear>'}.db</pre></li>
            <li>Reload this page, or click on {'"Fetch Data Sets"'} to see your uploaded dataset.</li>
          </ol>
              }
        </Paper>
        {/*
        <Paper className={this.props.classes.paper}>
          <h3>Method 2: using terminal + git (WIP).</h3>
          <ol>
            <li>Install catkit: pip install git+https://github.com/SUNCAT-Center/CatKit.git#egg=catkit</li>
            <li>Run catkit organize foldername</li>
            <li>Push your organized folder as one directory to e.g. github.</li>
            <li>Get a DOI for your repository: https://guides.github.com/activities/citable-code/</li>
            <li>Enter the respository URL below.</li>
          </ol>
        </Paper>
        <Paper className={this.props.classes.paper}>
          <h3>Method 3: drag and drop (WIP).</h3>
          <ol>
            <li>Go to your results folder using e.g. Finder on Mac, Nautilus on Linux, etc.</li>
            <li>Drag and drop your folder (up to 10 MB)<Button>HERE</Button>.</li>
          </ol>
        </Paper>
        */}
        <Paper className={this.props.classes.paper}>
          <Grid container justify="space-between" direction="row">
            <Grid item>
              <h1>Data sets</h1>
            </Grid>
            <Grid item>
              <Button
                raised
                onClick={() => { this.getDatasets(); }}
              >
                <MdRefresh /> Fetch Data Sets
              </Button>
            </Grid>
          </Grid>
          {_.isEmpty(this.state.datasets) ? null :
              this.state.datasets.map((dataset, i) => (
                <Paper key={`ds_${i}`} className={this.props.classes.paper}>
                  {prettyPrintReference(dataset)}
                  <Button
                    raised
                    onClick={() => {
                    }}
                  >
                    Endorse {'\u00A0\u00A0'} <MdThumbUp />

                  </Button> {'\u00A0\u00A0'}<Button
                    raised
                    onClick={() => { this.setDataset(dataset); }}
                  > Details <MdChevronRight /> </Button>
                </Paper>
              ))
          }
        </Paper>
        {_.isEmpty(this.state.pubId) ? null :
        <Paper>
          <PublicationView
            preview
            pubId={this.state.pubId}
            graphqlRoot={uploadGraphqlRoot}
            privilegedAccess
          />
        </Paper>
        }
      </div>
    );
  }
}

Upload.propTypes = {
  classes: PropTypes.object,
};

const mapStateToProps = createStructuredSelector({
  Upload: makeSelectUpload(),
});

const mapDispatchToProps = () => ({
});

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles, { withTheme: true })(Upload));
