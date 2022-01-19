<template>
  <g class="map-legend" :transform="margin">
    <rect class="background" :height="colors.length * 20 + 60" width="140" />
    <text y="20" x="10" class="map-label" v-if="title">{{ title }}</text>
    <text y="35" x="10" v-if="subtitle">{{ subtitle }}</text>
    <g
      v-for="(color, index) in colors"
      :key="index"
      :transform="getTranslate(index)"
    >
      <rect :fill="color" width="15" height="20" />
      <text x="24" y="11" alignment-baseline="middle">
        {{ ranges[index] }}
      </text>
    </g>
  </g>
</template>

<script>
export default {
  name: 'MapLegend',
  components: {
  },
  props: ['title', 'subtitle', 'colors', 'ranges', 'zoomed'],
  data() {
    return {
    }
  },
  computed: {
    margin() {
      const vertical = this.zoomed ? 10 : 0;
      const horizontal = this.zoomed ? 10 : 180;
      return `translate(${vertical}, ${horizontal})`;
    },
  },
  methods: {
    getTranslate(index) {
      return `translate(10, ${50 + index * 20})`
    },
  },
  created() {
  },
}
</script>

<style lang="scss">
.map-legend {
  font-size: 14px;

  .map-label {
    font-weight: bold;
  }

  .background {
    fill: rgba(255,255,255,0.85);
  }

  .legend-tick {
    stroke: #000;
    stroke-width: 1;
  }
}
</style>
