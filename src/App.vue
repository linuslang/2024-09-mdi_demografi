<template>
  <div class="party-checkboxes" v-if="type === 'partiesChange'">
    <div class="checkbox-wrapper" v-for="party in parties" :key="party">
      <input :id="`filter-${party.pid}`" name="parties" type="radio" class="styled-checkbox" :value="party" v-model="selectedParty">
      <RadioLabel :party="party" />
    </div>
  </div>
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
import parties from './data/parties.json'

import RadioLabel from './components/RadioLabel'

export default {
  name: 'App',
  props: {
    type: String,
  },
  components: {
    RadioLabel,
  },
  data() {
    return {
      map: null,
      tileLayer: null,
      features: null,
      legend: null,
      mapData,
      data,
      parties,
      selectedFeature: null,
      previousFeature: null,
      selectedParty: {
        "name_fi": "SDP",
        "name_sv": "Socialdemokraterna",
        "short_name_fi": "SDP",
        "short_name_sv": "SDP",
        "color": "#FF3333",
        "pid": "1"
      },
    }
  },
  watch: {
    selectedParty() {
      this.features.eachLayer((layer) => {
        layer.setStyle({
          fillColor: this.getColor(layer.feature.properties.kunta)
        });
      });
    }
  },
  computed: {
    domain() {
      switch(this.type) {
        case 'age':
          return [41, 63];
        case 'maleShare':
          return [0.4, 0.45, 0.55, 0.6];
        case 'shareNew':
          return [0.1, 0.25, 0.5];
        default:
          return [-10, 0, 10];
      }
    },
    colors() {
      switch(this.type) {
        case 'age':
          return ['#e2f7ff', '#000a47'];
        case 'maleShare':
          return ['#f96700', '#ffad82', '#eeeeee', '#93c5c7', '#009ba1'];
        case 'partiesChange':
          return ['#ea4d5e', '#eeeeee', '#85b074'];
        case 'shareNew':
          return ['#b291d6', '#d4b5b1', '#ecd988', '#ffff51'];
        default:
          return ['#e2f7ff', '#000a47'];
      }
    },
    colorScale() {
      if (this.type === 'maleShare' || this.type === 'shareNew') {
        return d3.scaleThreshold()
          .domain(this.domain)
          .range(this.colors);
      }
      return d3.scaleLinear()
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
        else if (this.type === 'partiesChange') {
          div.innerHTML = `
            <h3>Förändring</h3>
            <strong>2017-2021</strong>
            <div class="legend">
              <div class="gradient" style="background-image: linear-gradient(${this.colors[0]}, ${this.colors[1]}, ${this.colors[2]})"></div>
              <div class="labels">
                <span>${this.parseNo(this.domain[0], 0, true)} %-enh.</span>
                <span>${this.parseNo(this.domain[1], 0, true)} %-enh.</span>
                <span>${this.parseNo(this.domain[2], 0, true)} %-enh.</span>
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
        else if (this.type === 'shareNew') {
          const labels = [
            '< 10 %',
            '10 - 25 %',
            '25 - 50 %',
            '> 50 %',
          ];

          div.innerHTML += '<h3>Andel nyinvalda</h3>';

          this.colors.forEach((c, index) => {
            div.innerHTML += `<i style="background: ${c}"></i>${labels[index]}<br>`;
          });
        }
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
        fillOpacity: 0.7
      });

      if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
      }
    },
    dehighlight(layer) {
      if (this.selectedFeature === null || this.selectedFeature._leaflet_id !== layer._leaflet_id) {
        layer.setStyle({
          color: '#555',
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
        color: '#555',
        fillOpacity: 0.8,
      };
    },
    getColor(id) {
      if (this.type === 'partiesChange') {
        return data[id][this.type] ? this.colorScale(data[id].partiesChange[this.selectedParty.pid]) : '#555';
      }
      return data[id][this.type] ? this.colorScale(data[id][this.type]) : '#555';
    },
    getPopup(properties) {
      let str = '';
      str += `<strong>${properties.namn}</strong>`;
      str += `<br>Medelålder: ${this.parseNo(this.data[properties.kunta].age)} år`
      str += `<br>Andel kvinnor: ${this.parseNo((1 - this.data[properties.kunta].maleShare) * 100)} %`
      str += `<br>Andel män: ${this.parseNo(this.data[properties.kunta].maleShare * 100)} %`
      str += `<br>Andel nyinvalda: ${this.parseNo(this.data[properties.kunta].shareNew * 100)} %`
      return str;
    },
    parseNo(value, decimals = 1, isChange = false) {
      if (typeof value === 'undefined') {
        return null;
      }
      let prefix = '';
      if (isChange) {
        if (value === 0) {
          prefix = '±';
        }
        else if (value > 0) {
          prefix = '+';
        }
      }
      return `${prefix}${value.toLocaleString('sv', { maximumFractionDigits: decimals })}`;
    }
  }
}
</script>

<style lang="scss">
@import "~leaflet/dist/leaflet.css";

#app-2021-06-kommunalval_kartor {
  max-width: 600px;
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
      margin: 0;
      font-size: 15px;
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
      height: 120px;
      width: 20px;
    }

    .labels {
      justify-content: space-between;
      flex-direction: column;
      display: flex;

      span {
        font-weight: normal;
        margin-left: 4px;
      }
    }
  }
}

.party-checkboxes {
  align-items: center;
  border: none;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  padding: 0px;
  margin-bottom: 1em;
}

.checkbox-wrapper {
  margin: 0px 6px 12px 0px;

  input {
    position: absolute;
    opacity: 0;
    height: 0px;
    width: 0px;
    pointer-events: none;
    margin: 0px !important;
    padding: 0px !important;
  }
}
</style>
