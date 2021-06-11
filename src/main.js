import { createApp } from 'vue'
import App from './App.vue'

const appName = '2021-06-kommunalval_kartor';

const eventHandlers = {
  onMount: (name, element, services = {}) => {
    if (name !== appName) return;
    if (!element.querySelector(`#app-${appName}`)) return;

    const parameters = services.getParameters() || {};
    const app = createApp(App, {
      type: parameters.type || 'maleShare',
    })

    app.mount(element.querySelector(`#app-${appName}`))
  }
};

const yddvizAppMethods = {
  embedYlePlayer: function(elem, id, options) {
    window.ylePlayer.render({
      element: elem,
      props: {
        id: id,
        playFullScreen: !!options.playFullScreen,
      },
    });
  },
  getParameters: function() {
    const parameters = {};
    const searchParameters = new URLSearchParams(window.location.search);
    for (const [key, value] of searchParameters) {
      parameters[key] = value;
    }
    return parameters;
  },
};

if (process.env.NODE_ENV === 'production' && window.yleVisualisation) {
  // SYND OR FYND
  window.yleVisualisationEmbeds = window.yleVisualisationEmbeds || {};
  window.yleVisualisationEmbeds[appName] = eventHandlers;
}
else {
  eventHandlers.onMount(appName, document.body, yddvizAppMethods);
}
