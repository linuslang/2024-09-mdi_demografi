<template>
  <ToolTip
    v-if="selected"
    :item="selected"
    :x="toolTipX"
    :y="toolTipY"
    :type="type"
    :parseNo="parseNo"
  />
  <svg role="group" xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox" class="election-map">
    <g class="paths" v-if="paths">
      <MapPath v-for="path in paths" :path="path"
        :d="path.d" :key="path.id"
        :fill="getFill(path.data)"
        @hover-start="showToolTip"
        @hover-end="hideToolTip" />
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
  <SortedTable :data="paths" :label="factor.label" :type="type" />
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
import muniData from './data/munidata.json'
import hvaData from './data/hvadata.json'
import parties from './data/parties.json'
import partiesObjects from './data/partiesObjects.json'

import MapLegend from './components/MapLegend.vue'
import MapPath from './components/MapPath.vue'
import SortedTable from './components/SortedTable.vue'
import ToolTip from './components/ToolTip.vue'

const factors = {
  representation: {
    title: null,
    domain: [0, 0.75, 1.5],
    colors: ['#f96700', '#ffad82', '#eeeeee', '#009ba1'],
    ranges: [
      'Inga mandat',
      'Låg representation',
      'Jämn fördelning',
      'Hög representation',
    ],
  },
  female_share: {
    title: null,
    label: 'Andel kvinnor',
    domain: [0.4, 0.45, 0.55, 0.6],
    colors: ['#f96700', '#ffad82', '#eeeeee', '#93c5c7', '#009ba1'],
    ranges: [
      '> 60 % män',
      '> 55 % män',
      'Jämn fördelning',
      '> 55 % kvinnor',
      '> 60 % kvinnor',
    ],
  },
  age: {
    title: 'Medelålder',
    label: 'Medelålder',
    domain: [41.5, 59.4],
    colors: ['#e2f7ff', '#000a47'],
  },
}

export default {
  name: 'App',
  props: {
    type: String,
    zoomed: Boolean,
  },
  components: {
    MapLegend,
    MapPath,
    SortedTable,
    ToolTip,
  },
  data() {
    return {
      width: 420,
      features: null,
      error: false,
      data,
      muniData,
      hvaData,
      parties,
      partiesObjects,
      selected: null,
      toolTipX: null,
      toolTipY: null,
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
    factor() {
      return factors[this.type];
    },
    title() {
      return factors[this.type].title;
    },
    subtitle() {
      return false;
    },
    colors() {
      return factors[this.type].colors;
    },
    ranges() {
      return factors[this.type].ranges || null;
    },
    colorScale() {
      if (this.type === 'female_share' || this.type === 'representation') {
        return d3.scaleThreshold()
          .domain(this.factor.domain)
          .range(this.colors);
      }
      return d3.scaleLinear()
        .domain(this.factor.domain)
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
          let data;
          if (this.type === 'representation') {
            const muniData = this.muniData[d.properties.id];
            const hvaData = this.hvaData[d.properties.hva_id];
            data = {
              representation: muniData ? ((muniData.seats / hvaData.seats) * (hvaData.population / d.properties.population)) : -1,
            }
          }
          else {
            data = this.data.find(datum => datum.constituency_id = d.properties.hva_id) || {};
          }

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
        return this.paths.find((d) => d.id === this.selected.id);
      }
      return null;
    },
  },
  mounted() {
    this.initMap();
    window.addEventListener('scroll', this.hideToolTip);
  },
  unmounted() {
    window.removeEventListener('scroll', this.hideToolTip);
  },
  methods: {
    showToolTip(data) {
      this.selected = data.item;
      this.toolTipX = data.mouseX;
      this.toolTipY = data.mouseY;
    },
    hideToolTip() {
      this.selected = null;
    },
    initMap() {
      const url = `${process.env.BASE_URL}data/kommuner-omraden.json`;

      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          const featureType = this.type === 'representation' ? 'munis' : 'hva';
          this.features = topojson.feature(data, data.objects[featureType]);
        })
        .catch((error) => {
          this.error = error;
        });
    },
    getFill(data) {
      if (!data) return 'transparent';
      return data[this.type] ? this.colorScale(data[this.type]) : 'transparent';
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
    },
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
        pointer-events: none;
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
