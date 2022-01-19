<template>
  <svg role="group" xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox" class="election-map">
    <g class="paths" v-if="paths">
      <path
        v-for="path in paths"
        :d="path.d"
        :fill="getFill(path.data)"
        :key="path.id"
        @click="onClick(path.id)"
      />
      <path
        :d="selectedPath.d"
        fill="none"
        class="active"
        v-if="selectedPath"
      />
    </g>
    <image
      v-else
      xlink:href="./assets/loading.svg"
      :width="width" :height="height"
    />
    <MapLegend :title="title" :subtitle="subtitle" :colors="colors" :ranges="ranges" :zoomed="zoomed" />
  </svg>
  <SortedTable :data="paths" :type="type" />
  <pre v-if="error">{{ error }}</pre>
</template>

<script>
const d3 = Object.assign(
  {},
  require('d3-geo'),
  require('d3-scale'),
  require('d3-array')
)

import * as topojson from 'topojson-client'

import data from './data/data.json'
import parties from './data/parties.json'
import partiesObjects from './data/partiesObjects.json'

import MapLegend from './components/MapLegend.vue'
import SortedTable from './components/SortedTable.vue'

export default {
  name: 'App',
  props: {
    type: String,
    zoomed: Boolean,
  },
  components: {
    MapLegend,
    SortedTable,
  },
  data() {
    return {
      width: 400,
      features: null,
      error: false,
      data,
      parties,
      partiesObjects,
      selected: null,
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
  },
  computed: {
    viewBox() {
      return `0 0 ${this.width} ${this.height}`;
    },
    height() {
      return this.zoomed ? 500 : 720;
    },
    domain() {
      switch(this.type) {
        case 'age':
          return [41.5, 59.4];
        case 'maleShare':
          return [0.4, 0.45, 0.55, 0.6];
        case 'shareNew':
          return [0.4, 0.5, 0.6];
        default:
          return [-15, 0, 15];
      }
    },
    title() {
      if (this.type === 'age') {
        return 'Medelålder';
      }
      return false;
    },
    subtitle() {
      return false;
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
          return ['#7333d5', '#b678ab', '#dfbb78', '#f9ff00'];
        default:
          return ['#e2f7ff', '#000a47'];
      }
    },
    ranges() {
      if (this.type === 'maleShare') {
        return [
          '> 60 % kvinnor',
          '> 55 % kvinnor',
          'Jämn fördelning',
          '> 55 % män',
          '> 60 % män',
        ];
      }
      else if (this.type === 'shareNew') {
        return [
          '< 40 %',
          '40 - 50 %',
          '50 - 60 %',
          '> 60 %',
        ];
      }
      else return null;
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
    projection() {
      const zoomPoint = this.features;
      const margin = 0;

      return d3.geoTransverseMercator()
        .rotate([-25,0])
        .fitExtent([[margin, margin], [this.width - margin, this.height - margin]], zoomPoint);
    },
    path() {
      return d3.geoPath().projection(this.projection);
    },
    paths() {
      if (this.features) {
        return this.features.features.map((d) => {
          const data = this.data[d.properties.id];

          return {
            id: d.properties.id,
            d: this.path(d.geometry),
            name: d.properties.name_sv,
            data,
          };
        });
      }
      return null;
    },
    selectedPath() {
      if (this.paths && this.selected) {
        return this.paths.find((d) => d.id === this.selected);
      }
      return null;
    },
  },
  mounted() {
    this.initMap();
  },
  methods: {
    initMap() {
      const url = `${process.env.BASE_URL}data/kommuner-omraden.json`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          //const featureType = this.type === 'representation' ? 'munis' : 'hva';
          const featureType = 'munis';
          this.features = topojson.feature(data, data.objects[featureType]);
        })
        .catch((error) => {
          this.error = error;
        });
    },
    getFill(data) {
      if (!data) return '#555';
      if (this.type === 'partiesChange') {
        return data[this.type] ? this.colorScale(data.partiesChange[this.selectedParty.pid]) : '#555';
      }
      if (this.type === 'biggestParty') {
        const pid = data[`biggestParty2021`];
        const party = this.partiesObjects[pid];
        return party ? party.color : '#9CACB5'; 
      }
      return data[this.type] ? this.colorScale(data[this.type]) : '#555';
    },
    onClick(id) {
      this.selected = id;
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
#app-2022-01-omradesval_kartor {
  max-width: 640px;
  margin: 0 15px;
  font-family: 'Open Sans', Arial, sans-serif;
  text-align: center;

  @media screen and (min-width: 640px) {
    margin: 0 auto;
  }

  .election-map {
    height: 600px;
    max-height: 78vh;
    margin-bottom: 10px;

    .paths {
      path {
        stroke-width: 1px;
        stroke: #555;
      }

      .active {
        stroke-width: 3px;
        stroke: #ffaa00;
      }
    }
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

  legend {
    margin-bottom: .5em;
  }
}

.checkbox-wrapper {
  margin: 0px 6px 12px 0px;

  &:last-child {
    margin-right: 0;
  }

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
