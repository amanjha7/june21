const FormData = require('form-data');
const qs = require('qs');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { ConnectionFilter } = require('../filters/connectionfilter');
const { WebhookDetailsFilter } = require('../filters/webhookdetailsfilter');
const { APP_URLS, REDIRECT_URI, TRIGGER_NAME } = require('../constants/appconstants')
const { getSavedConnection, deleteConnection } = require('../dbhelper/connectiondao')
const { updateWebhookDetails, getSavedWebhookDetails, deleteWebhookDetails } = require('../dbhelper/webhookdetailsdao');
const { fetchAccessToken, generateCryptoSignature } = require('../utils/apputils');
const {logger} = require('../config/logger');

const createPost = async (data) => {
  logger.info('Entering createPost(). Data : ', data);
  const context = data.context;
  const appInstanceId = context.app_instance_id;

  const { getValidAccessToken } = require('./oauthservice');
  const accessToken = await getValidAccessToken(appInstanceId);

  const postData = {
    text: data.text
  };

  const config = {
    method: 'POST',
    url: 'https://api.twitter.com/2/tweets',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    data: postData
  };

  const response = await axios.request(config);
  logger.info('Leaving createPost(). Response status: ', response.status);
  return response.data;
};

const processSubscription = async (data, type) => {
  logger.info('Entering processSubscription(). Data : ', data, ' and Type : ', type);
  //Get the connection id from request
  let appInstanceId = data.context.app_instance_id;
  //Fetch the data related to this connectionId in the database
  let filter = new ConnectionFilter();
  filter.appInstanceIdArray = appInstanceId;
    let result = await getSavedConnection(filter);
    if (result?.length) {
      for (let conn of result) {
        let inputObj = {};
        inputObj.automation_id = data.automation_id;
        inputObj.connection_id = conn._id;
        inputObj.pronnel_webhook_url = data.pronnel_webhook_url;
        inputObj.trigger_type = type;
        if (data?.context?.field_details) {
          inputObj.field_details = data?.context?.field_details;
        }

        let webhookDetailsFilter = new WebhookDetailsFilter();
        webhookDetailsFilter.automationIdArray = data.automation_id;
        webhookDetailsFilter.connectionIdArray = conn._id;
        webhookDetailsFilter.pronnelWebhookUrlArray = data.pronnel_webhook_url;

        await updateWebhookDetails(webhookDetailsFilter, inputObj);
      }
    }
    logger.info('Leaving processSubscription()');

};

const processUnsubscription = async (data, type) => {
  logger.info('Entering processUnsubscription(). Data : ', data, ' and Type : ', type);
  //Get the connection id from request
  let appInstanceId = data.context.app_instance_id;
  //Fetch the data related to this connectionId in the database
  let filter = new ConnectionFilter();
  filter.appInstanceIdArray = appInstanceId;

    let result = await getSavedConnection(filter);
    if (result?.length) {
      for (let conn of result) {
        let filter = new WebhookDetailsFilter();
        filter.automationIdArray = data?.automation_id;
        filter.connectionIdArray = conn?._id;
        filter.pronnelWebhookUrlArray = data?.pronnel_webhook_url;
        filter.triggerTypeArray = type;
        await deleteWebhookDetails(filter);
      }
    }
  logger.info('Leaving processUnsubscription()');
};

const processWebhookSample = async (type) => {
  logger.info('Entering processWebhookSample(). Type Received : ', type);
  let dataObj = {}
  switch (type) {
    case TRIGGER_NAME.BRANCH_CREATED: dataObj = JSON.parse(BRANCH_CREATED_SAMPLE);
      break;
    case TRIGGER_NAME.BRANCH_DELETED: dataObj = JSON.parse(BRANCH_DELETED_SAMPLE);
      break;
    case TRIGGER_NAME.COMMIT_CREATED: dataObj = JSON.parse(COMMIT_CREATED_SAMPLE);
      break;
    case TRIGGER_NAME.PULL_REQ_CREATED: dataObj = JSON.parse(PULL_REQ_CREATED_SAMPLE);
      break;
    case TRIGGER_NAME.PULL_REQ_MERGED: dataObj = JSON.parse(PULL_REQ_MERGED_SAMPLE);
      break;
    case TRIGGER_NAME.PULL_REQ_COMMENTED: dataObj = JSON.parse(PULL_REQ_COMMENTED_SAMPLE);
      break;

  }
  logger.info('Leaving processWebhookSample()');
  return dataObj;
};

async function invokeWebhook(catchookUrl, data) {
  logger.info('Entering invokeWebhook(). Catchhook url = ', catchookUrl, ' and data = ', data);
  let hexSignature = generateCryptoSignature(data, process.env.APP_SIGNING_SECRET);
  let config = {
    method: 'POST',
    url: process.env.PRONNEL_HOST_URL + catchookUrl,
    headers: {
      'Accept': 'application/json',
      "x-signature-sha256": `sha256=${hexSignature}`
    },
    data: data
  }
  try {
    const response = await axios.request(config);
    if (response?.status == 200) {
      logger.info('Leaving invokeWebhook() with HTTP status 200. Webhook successfully invoked');
    }
    else {
      logger.info('Leaving invokeWebhook() with HTTP status != 200 . Webhook could not be successfully invoked');
    }
  }
  catch (err) {
    logger.error('Error encountered in invokeWebhook(). Error is : ', err);
    logger.info('Leaving invokeWebhook() from catch block.')
    throw err;
  }
}

const processWebhook = async (payload, event) => {
  logger.info('Entering processWebhook(). Payload : ', payload, ' and event : ', event);
  try {
    let triggerType = determineTriggerType(event, payload);
    let filter = new WebhookDetailsFilter();
    filter.triggerTypeArray = triggerType;
    let result = await getSavedWebhookDetails(filter);
    switch (triggerType) {
      case TRIGGER_NAME.BRANCH_CREATED:
      case TRIGGER_NAME.BRANCH_DELETED:
        await handleBranchWebhook(payload, result);
        break;
      default:
        logger.info('Inside process webhook switch. Encountered unhandled triggerType case!');
    }
    logger.info('Leaving processWebhook()');
  }
  catch (err) {
    logger.error('Error encountered in processWebhook(). Error is : ', err);
    throw err;
  }
};

async function handleBranchWebhook(payload, dbResult) {
  let sourceRepoId = payload?.repository?.id;
  if (dbResult?.length) {
    for (let res of dbResult) {
      let catchHookUrl = res.pronnel_webhook_url;
      let field_details = res?.field_details;
      let fixed_fields = field_details?.fixed_fields;
      if (fixed_fields) {
        let repoId = fixed_fields?.repository?.field_value?.value;
        if (sourceRepoId === repoId) {
          await invokeWebhook(catchHookUrl, payload);
        }
      }
    }
  }
}

function determineTriggerType(event, payload) {
  let triggerType;
  switch (event) {
    case 'create':
      if (payload.ref_type === 'branch') {
        triggerType = TRIGGER_NAME.BRANCH_CREATED
      }
      break;
    case 'delete':
      if (payload.ref_type === 'branch') {
        triggerType = TRIGGER_NAME.BRANCH_DELETED
      }
      break;
    case 'pull_request':
      if (payload.action === 'opened') {
        triggerType = TRIGGER_NAME.PULL_REQ_CREATED
      }
      else if (payload.action === 'closed' && payload?.pull_request?.merged) {
        triggerType = TRIGGER_NAME.PULL_REQ_MERGED
      }
      break;
    case 'pull_request_review_comment':
      if (payload.action === 'created') {
        triggerType = TRIGGER_NAME.PULL_REQ_COMMENTED
      }
    case 'push':
      if (payload.commits && payload.commits?.length > 0) {
        triggerType = TRIGGER_NAME.COMMIT_CREATED;
      }
    default:
      logger.info(`Unhandled event: ${event}`);
  }
  return triggerType;
}

module.exports = {
  processSubscription,
  processUnsubscription,
  processWebhookSample,
  processWebhook,
  createPost
}
