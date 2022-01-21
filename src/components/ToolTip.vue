<template>
  <div class="toolTip" :style="position">
    <p>
      <strong>{{ name }}</strong><br>
    </p>
    <p v-if="type === 'female_share'">
      Andel män: {{ parseNo((1 - item.data.female_share) * 100) }} %<br>
      Andel kvinnor: {{ parseNo(item.data.female_share * 100) }} %
    </p>
    <p v-if="type === 'representation'">
      {{ parseNo(item.data.representation) || 'Inga mandat' }}
    </p>
  </div>
</template>

<script>
export default {
  name: 'ToolTip',
  components: {
  },
  props: {
    item: Object,
    x: Number,
    y: Number,
    type: String,
    parseNo: Function,
  },
  data() {
    return {
      windowWidth: null,
    }
  },
  computed: {
    name() {
      return this.item.name;
    },
    rightAlign() {
      return 100;
    },
    position() {
      return {
        top: `${this.y + 10}px`,
        left: `${this.x - this.rightAlign}px`,
      }
    },
  },
  created() {
    this.windowWidth = window.innerWidth;
  },
  mounted() {
  },
  methods: {
  },
}
</script>

<style lang="scss">
.toolTip {
  position: fixed;
  background-color: #111;
  border-radius: 5px;
  padding: 8px 2px;
  pointer-events: none;
  width: 200px;
  color: #fff;
  box-sizing: border-box;
  font-size: 14px;
  opacity: 0.90;

  p {
    color: white;
    text-align: center;
    padding: 1px;
    margin: 1px 4px 1px 4px;
    line-height: 1.2;
  }

  &:before {
    content: "";
    position: absolute;
    width: 0;
    height: 0;
    border-width: 10px;
    border-style: solid;
    border-color: transparent transparent #111 transparent;
    top: -20px;
    left: 90px;
  }
}
</style>