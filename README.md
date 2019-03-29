配置中心 Apollo 的 Node.js 版本 SDK


### 使用说明
1. npm install
```js
npm install apollo-client-node --save
```

2. require && init
```js
const apollo = require('apollo-client-node');
apollo.init({
    basePath: '[配置获取接口链接前缀部分]', //必填，形如：https://apollo-config-dev.example.com
    appId: '[项目AppId]', //必填
    clusterName: '[集群名称]', //选填，默认为：default
    namespaces: '[命名空间数组]', //选填，默认为：['application']
    cachePath: '[配置缓存文件的路径]', //选填，默认为：os.tmpdir() + '/apollo_cache'
});
```

3. watch
```js
const apollo = require('apollo-client-node');

//设置配置，与 init() 保持一致，若 watch() 的 apollo 是已经初始化过了，则可跳过设置配置
apollo.setOptions({
    basePath: '[配置获取接口链接前缀部分]', //必填，形如：https://apollo-config-dev.example.com
    appId: '[项目AppId]', //必填
    clusterName: '[集群名称]', //选填，默认为：default
    namespaces: '[命名空间数组]', //选填，默认为：['application']
    cachePath: '[配置缓存文件的路径]', //选填，默认为：os.tmpdir() + '/apollo_cache'
});

apollo.watch();
```

4. use config
```js
const apollo = require('apollo-client-node');

console.log(apollo.get('config-key'));
console.log(apollo.getAll());
```

### 集成到 eggjs 框架
1. npm install
```js
npm install apollo-client-node --save
```

2. create init script
```js
// scripts/init-apollo.js

const apollo = require('apollo-client');

apollo.init({
    basePath: process.env.APOLLO_BASE_PATH,
    appId: process.env.APOLLO_APP_ID,
});
```

3. run init-apollo.js before eggjs cluster (package.json)
```json
//package.json

{
    ...
    "scripts": {
        "start": "npm stop && APOLLO_BASE_PATH=https://apollo-config.example.com APOLLO_APP_ID=app-id-xxx node scripts/init-apollo.js && eggctl start --daemon --title=egg-server-example",
        "start:release": "npm stop && APOLLO_BASE_PATH=https://apollo-config.example.com APOLLO_APP_ID=app-id-xxx node scripts/init-apollo.js && eggctl start --daemon --title=egg-server-example-release",
        "stop": "egg-scripts stop --title=egg-server-example",
        "stop:release": "egg-scripts stop --title=egg-server-example-release",
        "dev": "APOLLO_BASE_PATH=https://apollo-config-dev.example.com APOLLO_APP_ID=app-id-xxx node scripts/init-apollo.js && egg-bin dev",
        ...
    }
    ...
}
```

4. load & use config
```js
// config/config.default.js

const apollo = require('apollo-client');
const cachePath = ''; //选填，默认为：os.tmpdir() + '/apollo_cache'
apollo.loadLocalConfig(cachePath);

module.exports = {
  logger: {
    dir: apollo.get('LOGGER_DIR'),
  },
};
```
