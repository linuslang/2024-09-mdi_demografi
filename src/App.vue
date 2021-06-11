<template>
  <div :id="`map-${type}`" class="election-map"></div>
</template>

<script>
const d3 = Object.assign(
  {},
  require('d3-scale'),
)

import L from 'leaflet'
import mapData from './data/kommuner-2021.json'
import data from './data/data.json'

export default {
  name: 'App',
  props: {
    type: String,
  },
  components: {
  },
  data() {
    return {
      map: null,
      tileLayer: null,
      features: null,
      legend: null,
      mapData,
      data,
      selectedFeature: null,
      previousFeature: null,
    }
  },
  computed: {
    domain() {
      switch(this.type) {
        case 'age':
          return [41, 63];
        case 'maleShare':
          return [0.4, 0.45, 0.55, 0.6];
        default:
          return null;
      }
    },
    colors() {
      switch(this.type) {
        case 'age':
          return ['#e2f7ff', '#000a47'];
        case 'maleShare':
          return ['#f96700', '#ffad82', '#eeeeee', '#93c5c7', '#009ba1'];
        default:
          return ['#e2f7ff', '#000a47'];
      }
    },
    colorScale() {
      if (this.type === 'age') {
        return d3.scaleLinear()
          .domain(this.domain)
          .range(this.colors);
      }
      return d3.scaleThreshold()
        .domain(this.domain)
        .range(this.colors);
    },
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const mapBounds = new L.LatLngBounds(new L.LatLng(59.8, 16), new L.LatLng(70, 35));

      this.map = L.map(`map-${this.type}`, {
        // zoomControl: false,
        // scrollWheelZoom: false,
        // doubleClickZoom: false,
        // dragging: false,
        minZoom: 5,
        maxZoom: 10,
        maxBounds: mapBounds,
        maxBoundsViscosity: 0.5,
      }).setView([61.85, 25], 5);
      
      /*this.tileLayer = L.tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
          attribution: '&copy; <a href="https://www.mapbox.com">Mapbox</a> &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://www.mapbox.com/map-feedback/" target="_blank">Improve this map</a></strong>',
          id: 'mapbox/light-v10',
          tileSize: 512,
          zoomOffset: -1,
          accessToken: 'pk.eyJ1IjoieWxlaXNyYWRpbyIsImEiOiJjam95NDdtc2cwdjZxM3VwYzNtcjZpbXh4In0.lEaQ-uHBm9j-uS0Y5NfjBA',
          // noWrap: true,
      });

      this.tileLayer.addTo(this.map)*/

      this.features = L.geoJSON(this.mapData, {
        onEachFeature: this.onEachFeature,
        style: this.style,
      }).addTo(this.map);

      this.addLegend();
    },
    addLegend() {
      this.legend = L.control({position: 'topleft'});

      this.legend.onAdd = () => {
        const div = L.DomUtil.create('div', 'info');

        if (this.type === 'age') {
          div.innerHTML = `
            <h3>Medelålder</h3>
            <div class="legend">
              <div class="gradient" style="background-image: linear-gradient(${this.colors[0]}, ${this.colors[1]})"></div>
              <div class="labels">
                <span>${this.domain[0]} år</span>
                <span>${this.domain[1]} år</span>
              </div>
            </div>
          `
        }
        else if (this.type === 'maleShare') {
          const labels = [
            '> 60 % kvinnor',
            '> 55 % kvinnor',
            'Jämn fördelning',
            '> 55 % män',
            '> 60 % män',
          ];

          this.colors.forEach((c, index) => {
            div.innerHTML += `<i style="background: ${c}"></i>${labels[index]}<br>`;
          });
        }
        /* grades = [0, 10, 20, 50, 100, 200, 500, 1000],
        labels = [];

        // loop through our density intervals and generate a label with a colored square for each interval
        for (var i = 0; i < grades.length; i++) {
            div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
        }
        */
        return div;
      };

      this.legend.addTo(this.map);
    },
    select(layer) {
      if (this.selectedFeature !== null) {
        this.previousFeature = this.selectedFeature;
      }

      this.highlightFeature(layer);
      this.selectedFeature = layer;

      if (this.previousFeature) {
        this.dehighlight(this.previousFeature);
			}
		},
    highlightFeature(layer) {
      layer.setStyle({
        weight: 5,
        color: '#ffd539',
        dashArray: '',
        fillOpacity: 0.7
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    },
    dehighlight(layer) {
      if (this.selectedFeature === null || this.selectedFeature._leaflet_id !== layer._leaflet_id) {
        layer.setStyle({
          color: '#333',
          weight: 1,
        });
      }
		},
    onEachFeature(feature, layer) {
      if (feature.properties) {
        layer.bindPopup(this.getPopup(feature.properties));
      }
      layer.on({
        'click': (e) => {
          // console.log(e.target.feature);
          this.select(e.target);
        }
      });
    },
    style(feature) {
      return {
        fillColor: this.getColor(feature.properties.kunta),
        weight: 1,
        opacity: 1,
        color: '#333',
        fillOpacity: 0.8,
      };
    },
    getColor(id) {
      return data[id][this.type] ? this.colorScale(data[id][this.type]) : '#555';
    },
    getPopup(properties) {
      let str = '';
      str += `<strong>${properties.namn}</strong>`;
      str += `<br>Medelålder: ${this.parseNo(this.data[properties.kunta].age)} år`
      str += `<br>Andel kvinnor: ${this.parseNo((1 - this.data[properties.kunta].maleShare) * 100)} %`
      str += `<br>Andel män: ${this.parseNo(this.data[properties.kunta].maleShare * 100)} %`
      return str;
    },
    parseNo(value, digits = 1) {
      if (value) {
        return value.toLocaleString('sv-SE', {
          maximumFractionDigits: digits,
        });
      }
      return null;
    }
  }
}
</script>

<style lang="scss">
@import "~leaflet/dist/leaflet.css";

#app-2021-06-kommunalval_kartor {
  max-width: 980px;
  margin: 0 auto;
  font-family: 'Open Sans', Arial, sans-serif;

  .election-map {
    height: 600px;
    max-height: 85vh;
    margin-bottom: 10px;
  }

  .info {
    font-size: 14px;
    line-height: 18px;
    color: #555;
    padding: 6px 8px;
    background: white;
    background: rgba(255,255,255,0.95);
    box-shadow: 0 0 15px rgba(0,0,0,0.2);
    border-radius: 5px;
    white-space: nowrap;

    h3 {
      margin: 0 0 .5em;
      font-size: 16px;
    }

    i {
      width: 16px;
      height: 16px;
      float: left;
      margin-right: 8px;
      opacity: 0.7;
    }
  }

  .legend {
    display: flex;
    flex-direction: row;

    .gradient {
      height: 140px;
      width: 20px;
    }

    .labels {
      justify-content: space-between;
      flex-direction: column;
      display: flex;

      span {
        font-weight: bold;
        margin-left: 4px;
      }
    }
  }
}
</style>
