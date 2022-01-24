<template>
  <table class="sorted-table">
    <caption v-if="caption">{{ caption }}</caption>
    <thead>
      <tr :class="{ ascending: sortAsc }">
        <th @click="handleSort('name')" class="sort" :class="[ sortBy === 'name' ? 'active' : '']">
          <template v-if="type === 'representation'">Kommun</template><template v-else>Välfärdsområde</template>
        </th>
        <th @click="handleSort(type)" class="sort" :class="[ sortBy === type ? 'active' : '']">{{ label }}</th>
        <th v-if="type === 'representation'" @click="handleSort('seats')" class="sort" :class="[ sortBy === 'seats' ? 'active' : '']">Mandat</th>
      </tr>
    </thead>
    <tbody v-if="sortedData">
      <tr v-for="muni in sortedData" :key="muni.id">
        <td :class="[ sortBy === 'name' ? 'active' : '']">{{ muni.data.name }}</td>
        <td :class="[ sortBy === type ? 'active' : '']">
          {{ formatValue(muni.data[type], 'Inga uppgifter') }}<template v-if="suffix">&nbsp;{{ suffix }}</template>
          <span class="table-rect" :style="`background: ${getFill(muni.data)}`"></span>
        </td>
        <td v-if="type === 'representation'" :class="[ sortBy === 'seats' ? 'active' : '']">{{ muni.data.seats }}</td>
      </tr>
    </tbody>
    <tbody v-else>
      <tr v-for="n in limit" :key="n">
        <td>…</td>
        <td>…</td>
      </tr>
    </tbody>
  </table>
  <button class="yddviz-button" v-if="data && limit < data.length" @click="limit += 10">Visa fler</button>
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
    getFill: Function,
    suffix: String,
  },
  data() {
    return {
      sortBy: null,
      sortAsc: false,
      limit: 5,
    }
  },
  created() {
    this.sortBy = this.type;
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
      return value.toLocaleString('sv', {maximumFractionDigits: 1, minimumFractionDigits: 1});
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
  color: #000;

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
      background: #F8F9FA !important;
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
        background: #F8F9FA !important;
      }
    }

    tr.ascending th.active:after {
      content: ' \25B2';
    }
  }

  .table-rect {
    width: 18px;
    height: 18px;
    float: left;
    margin-right: 8px;
    clear: left;
  }
}
</style>