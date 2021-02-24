import LayoutObserver from './layout-observer';
import { mapStates } from './store/helper';
import ElCheckbox from 'ttelem/packages/checkbox';
export default {
  name: 'ElTableFooter',
  inject: ['provideSelect'],
  components: {
    ElCheckbox
  },
  mixins: [LayoutObserver],

  render(h) {
    let sums = [];
    if (this.summaryMethod) {
      sums = this.summaryMethod({ columns: this.columns, data: this.store.states.data });
    } else {
      this.columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = this.sumText;
          return;
        }
        const values = this.store.states.data.map(item => Number(item[column.property]));
        const precisions = [];
        let notNumber = true;
        values.forEach(value => {
          if (!isNaN(value)) {
            notNumber = false;
            let decimal = ('' + value).split('.')[1];
            precisions.push(decimal ? decimal.length : 0);
          }
        });
        const precision = Math.max.apply(null, precisions);
        if (!notNumber) {
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr);
            if (!isNaN(value)) {
              return parseFloat((prev + curr).toFixed(Math.min(precision, 20)));
            } else {
              return prev;
            }
          }, 0);
        } else {
          sums[index] = '';
        }
      });
    }

    return (
      <table
        class="el-table__footer"
        cellspacing="0"
        cellpadding="0"
        border="0">
        <colgroup>
          {
            this.columns.map(column => <col name={ column.id } key={column.id} />)
          }
          {
            this.hasGutter ? <col name="gutter" /> : ''
          }
        </colgroup>
        <tbody class={ [{ 'has-gutter': this.hasGutter }] }>
          <tr>
            {
              this.columns.map((column, cellIndex) => <td
                key={cellIndex}
                colspan={ column.colSpan }
                rowspan={ column.rowSpan }
                class={ this.getRowClasses(column, cellIndex) }>
                <div class={ ['cell', column.labelClassName] }>
                  {
                    this.checkBoxFun(cellIndex, sums)
                  }
                </div>
              </td>)
            }
            {
              this.hasGutter ? <th class="gutter"></th> : ''
            }
          </tr>
        </tbody>
      </table>
    );
  },

  props: {
    fixed: String,
    store: {
      required: true
    },
    summaryMethod: Function,
    sumText: String,
    border: Boolean,
    defaultSort: {
      type: Object,
      default() {
        return {
          prop: '',
          order: ''
        };
      }
    }
  },
  data() {
    return {
      selectFullAll: false,
      selectAll: false
    };
  },
  computed: {
    table() {
      return this.$parent;
    },

    hasGutter() {
      return !this.fixed && this.tableLayout.gutterWidth;
    },

    ...mapStates({
      columns: 'columns',
      isAllSelected: 'isAllSelected',
      leftFixedLeafCount: 'fixedLeafColumnsLength',
      rightFixedLeafCount: 'rightFixedLeafColumnsLength',
      columnsCount: states => states.columns.length,
      leftFixedCount: states => states.fixedColumns.length,
      rightFixedCount: states => states.rightFixedColumns.length
    })
  },

  methods: {
    toggleAllSelection(event) {
      event.stopPropagation();
      this.selectFullAll = false;
      this.store.commit('toggleAllSelection');
    },
    toggleFullAllSelection(value) {
      this.selectFullAll = value;
      if (!value) this.store.commit('toggleAllSelectionEmitFalse');
      else this.store.commit('toggleAllSelectionEmitTrue');
      if (value) {
        if (!this.isAllSelected) this.store.commit('toggleAllSelection');
        setTimeout(()=>{
          this.store.commit('toggleFullSelect');
        }, 100);
      } else {
        this.store.commit('toggleAllSelection');
      }

    },
    checkBoxFun(cellIndex, sums) {
      let store = this.store;
      if (this.provideSelect.selectAll && this.provideSelect.selectCurrent && cellIndex === 0) {
        return <div class='SelectAll'><el-checkbox disabled={ store.states.data && store.states.data.length === 0 }
          indeterminate={ store.states.selection.length > 0 && !this.isAllSelected && !this.selectFullAll}
          nativeOn-click={ this.toggleAllSelection }
          value={ this.isAllSelected } >Select current</el-checkbox><el-checkbox value={this.selectFullAll} disabled={ store.states.data && store.states.data.length === 0 }
          onChange={ this.toggleFullAllSelection }
        >Select All</el-checkbox><span class='selectAllSpan'>{sums[cellIndex]}</span></div>;
      } else if (this.provideSelect.selectCurrent && cellIndex === 0) {
        return <div class='SelectAll'><el-checkbox disabled={ store.states.data && store.states.data.length === 0 }
          indeterminate={ store.states.selection.length > 0 && !this.isAllSelected }
          nativeOn-click={ this.toggleAllSelection }
          value={ this.isAllSelected } >Select current</el-checkbox><span class='selectAllSpan'>{sums[cellIndex]}</span></div>;
      } else if (this.provideSelect.selectAll && cellIndex === 0) {
        return <div class='SelectAll'><el-checkbox disabled={ store.states.data && store.states.data.length === 0 }
          onChange={ this.toggleFullAllSelection }
        >Select All</el-checkbox><span class='selectAllSpan'>{sums[cellIndex]}</span></div>;
      } else {
        return sums[cellIndex];
      }
    },
    isCellHidden(index, columns, column) {
      if (this.fixed === true || this.fixed === 'left') {
        return index >= this.leftFixedLeafCount;
      } else if (this.fixed === 'right') {
        let before = 0;
        for (let i = 0; i < index; i++) {
          before += columns[i].colSpan;
        }
        return before < this.columnsCount - this.rightFixedLeafCount;
      } else if (!this.fixed && column.fixed) { // hide cell when footer instance is not fixed and column is fixed
        return true;
      } else {
        return (index < this.leftFixedCount) || (index >= this.columnsCount - this.rightFixedCount);
      }
    },

    getRowClasses(column, cellIndex) {
      const classes = [column.id, column.align, column.labelClassName];
      if (column.className) {
        classes.push(column.className);
      }
      if (this.isCellHidden(cellIndex, this.columns, column)) {
        classes.push('is-hidden');
      }
      if (!column.children) {
        classes.push('is-leaf');
      }
      return classes;
    }
  }
};
