const axios = require('axios');
const { getAccessToken } = require('../services/oauthservice');
const { getSavedConnection } = require('../dbhelper/connectiondao');
const { ConnectionFilter } = require('../filters/connectionfilter');
const { APP_URLS } = require('../constants/appconstants');
const { logger } = require('../config/logger');

const createZohoClient = (context) => {
    const instance = axios.create({
        baseURL: APP_URLS.BASE_URL,
    });

    instance.interceptors.request.use(async (config) => {
        let filter = new ConnectionFilter();
        filter.appInstanceIdArray = context.app_instance_id;
        filter.pronnelUserIdArray = context.user_id;
        filter.workfolderIdArray = context.workfolder_id;
        filter.orgIdArray = context.org_id;

        const result = await getSavedConnection(filter);
        if (result && result.length > 0) {
            config.headers['Authorization'] = `Zoho-oauthtoken ${result[0].access_token}`;
        }
        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    instance.interceptors.response.use((response) => {
        return response;
    }, async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            logger.info('401 Unauthorized received from Zoho. Attempting to refresh token.');

            let filter = new ConnectionFilter();
            filter.appInstanceIdArray = context.app_instance_id;
            filter.pronnelUserIdArray = context.user_id;
            filter.workfolderIdArray = context.workfolder_id;
            filter.orgIdArray = context.org_id;

            const result = await getSavedConnection(filter);
            if (result && result.length > 0) {
                const refreshToken = result[0].refresh_token;
                try {
                    await getAccessToken(refreshToken, context, true);
                    logger.info('Token refreshed successfully. Retrying original request.');

                    // Get updated token
                    const updatedResult = await getSavedConnection(filter);
                    originalRequest.headers['Authorization'] = `Zoho-oauthtoken ${updatedResult[0].access_token}`;
                    return instance(originalRequest);
                } catch (refreshError) {
                    logger.error('Failed to refresh Zoho token:', refreshError);
                    return Promise.reject(refreshError);
                }
            }
        }
        return Promise.reject(error);
    });

    return instance;
};

module.exports = { createZohoClient };
