<template>
  <path @mousemove="move($event)" @mouseout="cancelMove" />
</template>

<script>
export default {
  name: 'CountryPath',
  components: {
  },
  props: {
    path: Object,
  },
  data() {
    return {
      active: false,
    }
  },
  mounted() {
  },
  methods: {
    move(event) {
      this.active = true;
      this.$emit('hover-start', {
        mouseX: event.pageX,
        mouseY: event.clientY,
        item: this.path,
      });
    },
    cancelMove() {
      this.active = false;
      this.$emit('hover-end');
    },
  },
}
</script>