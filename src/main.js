import { createApp } from 'vue'
import App from './App.vue'

const appName = '2022-01-omradesval_kartor';
const ROOT_SELECTOR = `#app-${appName}`;

const eventHandlers = {
  onMount: (name, element, services = {}) => {
    if (name !== appName) return;
    if (!element.querySelector(ROOT_SELECTOR)) return;

    const parameters = services.getParameters() || {};
    const app = createApp(App, {
      type: parameters.type || 'representation',
      zoomed: parameters.zoom ? true : false,
    })

    app.mount(element.querySelector(ROOT_SELECTOR))
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
else if (process.env.NODE_ENV === 'production' && !window.yleVisualisation) {
  // ARTICLE RENDERER OR STATIC HOSTING
  document.querySelectorAll(`${ROOT_SELECTOR}:not([data-yle-vis-processed])`).forEach(element => {
    element.setAttribute('data-yle-vis-processed', appName);
    const services = Object.assign({}, yddvizAppMethods);

    const parent = element.closest('[data-yle-external-content-parameters]') || element.parentElement || document.body;
    if (parent.hasAttribute('data-yle-external-content-parameters')) {
      const parameters = JSON.parse(parent.getAttribute('data-yle-external-content-parameters'));

      if (typeof parameters === 'object' && parameters !== null && !Array.isArray(parameters)) {
        services.getParameters = function () {
          return parameters;
        };
      }
    }

    eventHandlers.onMount(appName, parent, services);
  });
}
else {
  eventHandlers.onMount(appName, document.body, yddvizAppMethods);
}
