import { AppRegistry } from 'react-native';
import App from './App.web';
import { name as appName } from './app.json';
import './web/styles.css';

AppRegistry.registerComponent(appName, () => App);

AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});

if (module.hot) {
  module.hot.accept();
}
