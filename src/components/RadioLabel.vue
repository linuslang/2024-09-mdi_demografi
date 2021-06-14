<template>
  <label :for="`filter-${party.pid}`" class="checkbox-label">
    <span class="checkbox-label-text">{{ name }}</span>
  </label>
</template>

<script>
import { ref, reactive } from 'vue'

export default {
  name: 'RadioLabel',
  props: {
    party: Object,
  },
  setup(props) {
    const party = ref(props.party)
    const name = party.value.short_name_sv;
    const color = party.value.color;

    return { ...reactive({ party, name, color }) };
  },
}
</script>

<style lang="scss">
.party-checkboxes {
  input:focus + label {
    border-color: #000 !important;
  }

  input:checked + label {
    background-color: v-bind('color');
    background-color: var(--0851552e-color);
    color: #fff;

    &.year-label {
      background-color: #f28a3b;
      border-color: #975829;
      color: #000;
    }
  }

  .checkbox-label {
    background-color: rgb(255, 255, 255);
    border-radius: 15px;
    border-style: solid;
    border-color: v-bind('color');
    border-color: var(--0851552e-color);
    line-height: 1;
    font-size: 16px;
    font-weight: bold;

    &.year-label {
      background: #fff;
      border-color: #eee;
      color: #999;
    }
  }

  .checkbox-label-text {
    color: inherit;
    letter-spacing: 0.05em;
    padding: 0px 9px;
    text-align: center;
    cursor: pointer;
    user-select: none;
  }
}
</style>