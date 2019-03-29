const apollo = require('apollo-client');

apollo.init({
    basePath: process.env.APOLLO_BASE_PATH,
    appId: process.env.APOLLO_APP_ID,
});
console.log('apollo init');