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
    <MapLegend :title="factor.title" :subtitle="subtitle" :colors="colors" :ranges="ranges" :zoomed="zoomed" :type="type" />
  </svg>
  <SortedTable :data="paths" :label="factor.label" :type="type" :getFill="getFill" />
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
    title: 'Representation',
    label: 'Representation',
    domain: [0.001, 0.5, 1.5],
    colors: ['#650000', '#FF4D5B', '#eeeeee', '#03E592'],
    ranges: [
      'Ingen',
      'Låg (< 0,5 : 1)',
      'Jämn',
      'Hög (> 1,5 : 1)',
    ],
  },
  female_share: {
    title: 'Könsfördelning',
    label: 'Andel kvinnor',
    domain: [40, 45, 47.5, 52.5, 55, 60],
    colors: ['#009ba1', '#72b7ba', '#b2d2d4', '#eeeeee', '#fec2a4', '#ff975e', '#f96700'],
    ranges: [
      '> 60 % män',
      '> 55 % män',
      '> 52,5 % män',
      'Jämn fördelning',
      '> 52,5 % kvinnor',
      '> 55 % kvinnor',
      '> 60 % kvinnor',
    ],
  },
  mean_age: {
    title: 'Medelålder',
    label: 'Medelålder',
    domain: [45, 55],
    colors: ['#C8F2FA', '#00284E'],
    ranges: [45, 55],
  },
  swedish_share: {
    title: 'Andel svenskspråkiga',
    label: 'Andel svenskspråkiga',
    domain: [0, 10, 20, 50],
    colors: ['#eee', '#FFDB5E', '#EFB42C', '#DC9526', '#AE5D1F'],
    ranges: [
      'Inga',
      '< 10 %',
      '10 - 20 %',
      '20 - 50 %',
      '> 50 %',
    ],
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
      width: 440,
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
        return this.features.features.reduce((result, d) => {
          if (d.properties.hva_id) {
            let data;
            if (this.type === 'representation') {
              const muniData = this.muniData[d.properties.id];
              const hvaData = this.hvaData[d.properties.hva_id];

              data = {
                seats: muniData.seats,
                hvaSeats: hvaData.seats,
                representation: (muniData.seats / hvaData.seats) * (hvaData.population / d.properties.population),
                populationShare: d.properties.population / hvaData.population * 100,
              }
            }
            else {
              data = this.data.find(datum => datum.constituency_id === d.properties.hva_id) || {};
            }

            const name = this.type === 'representation' ? d.properties.name_sv : d.properties.short_name_sv;

            result.push({
              id: d.properties.id || d.properties.hva_id,
              d: this.path(d.geometry),
              data: Object.assign(data, { name }),
            });
          }
          return result;
        }, []);
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
      return this.colorScale(data[this.type]);
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
  margin: 0 15px 1em;
  font-family: 'Open Sans', Arial, sans-serif;
  text-align: center;

  @media screen and (min-width: 640px) {
    margin: 0 auto 1em;
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

.yddviz-button {
  border: none;
  position: relative;
  display: inline-flex;
  border: 0;
  font-weight: 700;
  letter-spacing: 0.01em;
  font-size: 14px;
  padding: 13px 22px 14px;
  line-height: 1.5;
  font-family: 'Open Sans', sans-serif;
  text-decoration: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  border-radius: 400px;
  font-size: 12px;
  padding: 7px 20px;
  min-height: 32px;
  min-width: 32px;
  cursor: pointer;
  color: #131415;
  background-color: transparent;
  box-shadow: 0 0 0 2px inset #131415;

  @media (prefers-color-scheme: dark) {
    color: #F8F9FA;
    box-shadow: 0 0 0 2px inset #F8F9FA;
  }

  &:hover, &:active {
    background: rgba(0, 0, 0, 0.09);

    @media (prefers-color-scheme: dark) {
      background: rgba(255, 255, 255, 0.17);
    }
  }

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: 666px;
    opacity: 0;
    box-shadow: 0 0 0 2px white, 0 0 0 4px black;
    pointer-events: none;
    box-sizing: border-box;
  }

  &:focus {
    outline: none;
  }

  &:focus-visible:before {
    opacity: 1;
  }
}
</style>
