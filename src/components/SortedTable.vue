<template>
  <table class="sorted-table">
    <caption v-if="caption">{{ caption }}</caption>
    <thead>
      <tr :class="{ ascending: sortAsc }">
        <th @click="handleSort('name')" class="sort" :class="[ sortBy === 'namn' ? 'active' : '']">Kommun</th>
        <th @click="handleSort(type)" class="sort" :class="[ sortBy === type ? 'active' : '']">{{ label }}</th>
      </tr>
    </thead>
    <tbody v-if="sortedData">
      <tr v-for="muni in sortedData" :key="muni.id">
        <td :class="[ sortBy === 'namn' ? 'active' : '']">{{ muni.name }}</td>
        <td :class="[ sortBy === type ? 'active' : '']">{{ formatRelValue(muni.data[type], 'Inga uppgifter') }}</td>
      </tr>
    </tbody>
    <tbody v-else>
      <tr v-for="n in limit" :key="n">
        <td>…</td>
        <td>…</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
const d3 = Object.assign(
  {},
  require('d3-array')
)

export default {
  name: 'MuniTable',
  components: {
  },
  props: {
    data: Array,
    type: String,
    label: String,
    caption: String,
  },
  data() {
    return {
      sortBy: 'female_share',
      sortAsc: false,
      limit: 5,
    }
  },
  computed: {
    sortedData() {
      if (this.data) {
        let sortedMunis;

        if (this.sortAsc) {
          sortedMunis = this.data.slice().sort((a, b) => d3.ascending(a.data[this.sortBy], b.data[this.sortBy]))
        }
        else sortedMunis = this.data.slice().sort((a, b) => d3.descending(a.data[this.sortBy], b.data[this.sortBy]))

        return sortedMunis.slice(0, this.limit);
      }
      return null;
    },
  },
  methods: {
    handleSort(event) {
      if (event === this.sortBy) {
        this.sortAsc = !this.sortAsc;
      }
      this.sortBy = event;
    },
    formatValue(value, fallback) {
      if (value === null) {
        return fallback;
      }
      return value.toLocaleString('sv');
    },
    formatRelValue(value) {
      if (value === null) {
        return 'Inga uppgifter';
      }
      const relValue = (value * 100).toLocaleString('sv', {maximumFractionDigits: 1, minimumFractionDigits: 1})
      return `${relValue} %`;
    },
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">
.sorted-table {
  border-collapse: collapse;
  font-size: 14px !important;
  width: 100% !important;
  margin-bottom: 1em !important;
  margin-top: 1em;
  word-break: initial;

  th, td {
    padding: 6px !important;
    border: none;
  }

  tr td {
    text-align: right;
    background: #fff !important;

    &:first-child {
      text-align: left;
    }

    &.active {
      background: #daebeb !important;
    }
  }

  caption {
    font-size: 16px;
    font-family: 'Open Sans', Arial, sans-serif;
    font-weight: bold;
    text-align: center;
    margin-bottom: 1em;
    padding: 0 !important;
    color: #000;
  }

  thead {
    tr th {
      background-color: #fff !important;
      color: #000 !important;
      font-weight: bold;
      text-align: right;
      vertical-align: top;
      border-bottom: 1px solid #999;
      text-transform: none !important;

      &.sort {
        cursor: pointer;

        &.active:after {
          content: ' \25BC';
        }
      }

      &:first-child {
        text-align: left;
      }

      &.active {
        background: #daebeb !important;
      }
    }

    tr.ascending th.active:after {
      content: ' \25B2';
    }
  }
}
</style>