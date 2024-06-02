<template>
  <div class="max-w-4xl mx-auto py-8 space-y-8">
    <!-- Sütun Ekleme Formu -->
    <div>
      <form @submit.prevent="addNewColumn" class="flex gap-4 mb-4">
        <input v-model="newColumnName" placeholder="Yeni sütun adı" class="p-2 border rounded shadow-sm w-full" />
        <label class="flex items-center">
          <input type="checkbox" v-model="newColumnPrimary" class="mr-2" />
          Primary
        </label>
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Sütun Ekle
        </button>
      </form>
    </div>

    <!-- Sütuna Değer Ekleme Formu -->
    <div v-if="table.columns.length > 0">
      <form @submit.prevent="addValueToColumn" class="flex gap-4 mb-4">
        <select v-model="selectedColumn" class="p-2 border rounded shadow-sm">
          <option v-for="column in table.columns" :key="column.name" :value="column.name">{{ column.name }}</option>
        </select>
        <input v-model="newValue" placeholder="Yeni değer" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
          Değer Ekle
        </button>
      </form>
    </div>

    <!-- Primary Değer Seçme Formu -->
    <div v-if="table.columns.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">Primary Değer Seç:</h2>
      <form @submit.prevent="setPrimaryColumn" class="flex gap-4 mb-4">
        <select v-model="selectedPrimaryColumn" class="p-2 border rounded shadow-sm">
          <option v-for="column in table.columns" :key="column.name" :value="column.name">{{ column.name }}</option>
        </select>
        <button type="submit" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Primary Değer Atama
        </button>
      </form>
    </div>

    <!-- Dinamik Tablo -->
    <div class="overflow-x-auto">
      <table class="table-auto w-full text-left whitespace-no-wrap">
        <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
          <tr>
            <th v-for="(column, index) in table.columns" :key="column.name" class="px-6 py-3">
              {{ column.name }}
              <button @click="removeColumn(index)" class="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                <span><i class="fas fa-trash-can"></i></span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-gray-200">
          <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
            <td v-for="(value, colIndex) in row.values" :key="colIndex" class="px-6 py-4">
              <select v-model="rows[rowIndex].values[colIndex]" class="p-2 border rounded shadow-sm w-full">
                <option v-for="val in getColumnValues(table.columns[colIndex].name)" :key="val" :value="val">{{ val }}</option>
              </select>
            </td>
            <td class="px-6 py-4">
              <button @click="removeRow(rowIndex)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                <span><i class="fas fa-trash-can"></i></span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Değer Ekleme Formu -->
    <div v-if="table.columns.length > 0" class="mb-8">
      <form @submit.prevent="addNewRow" class="flex flex-wrap gap-4 mb-4">
        <div v-for="column in table.columns" :key="column.name" class="flex flex-col">
          <label :for="`select-${column.name}`" class="mb-2">{{ column.name }}</label>
          <select v-model="newRowValues[column.name]" :id="`select-${column.name}`" class="p-2 border rounded shadow-sm">
            <option v-for="value in getColumnValues(column.name)" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>
        <button type="submit" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Satır Ekle
        </button>
      </form>
    </div>

    <hr>

    <!-- Naive Bayes için Değer Girişi Formu -->
    <div v-if="table.columns.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">Naive Bayes Hesaplama İçin Değerler:</h2>
      <form class="flex flex-wrap gap-4 mb-4">
        <div v-for="column in table.columns" :key="column.name" class="flex flex-col">
          <label v-if="!column.primary" :for="`input-${column.name}`" class="mb-2">{{ column.name }}</label>
          <select v-if="!column.primary" v-model="nbInput[column.name]" :id="`input-${column.name}`" class="p-2 border rounded shadow-sm">
            <option v-for="value in getColumnValues(column.name)" :key="value" :value="value">{{ value }}</option>
          </select>
        </div>
        <button @click="calculateRatios" type="button" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Hesapla
        </button>
      </form>
    </div>

    <div v-if="result" class="m-10">
      <h2 class="text-lg font-semibold mb-4">Naive Bayes Sonucu:</h2>
      <p v-for="(prob, key) in result" :key="key">{{ key }}: {{ prob }}</p>
    </div>

<!-- Counts tablosu -->
<div v-if="Object.keys(counts).length > 0" class="overflow-x-auto">
  <h2 class="text-lg font-semibold mb-4">Counts Tablosu</h2>
  <table class="table-auto w-full text-left whitespace-no-wrap">
    <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
      <tr>
        <th class="px-6 py-3">Özellik</th>
        <th class="px-6 py-3">Değer</th>
        <th v-for="primaryValue in primaryValues" :key="primaryValue" class="px-6 py-3">{{ primaryValue }}</th>
      </tr>
    </thead>
    <tbody class="text-sm divide-y divide-gray-200">
      <template v-for="(values, key) in counts" :key="key">
        <tr v-for="(result, subkey, subkeyIndex) in values" :key="subkey">
          <td v-if="subkeyIndex === 0" :rowspan="Object.keys(values).length" class="px-6 py-4 font-medium">{{ key }}</td>
          <td class="px-6 py-4">{{ subkey }}</td>
          <td v-for="primaryValue in primaryValues" :key="primaryValue" class="px-6 py-4">
            <div>
             {{ calculateRatio(key, subkey)[primaryValue] }}
            </div>
          </td>
        </tr>
      </template>
    </tbody>
  </table>
</div>

    

    <!-- İşlem Adımlarının Gösterilmesi -->
    
    <footer class="bottom-0 left-0 z-20 w-full mt-20 p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-center md:p-6 dark:bg-gray-800 dark:border-gray-600">
      <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">&copy; Bu site <a href="https://www.linkedin.com/in/do%C4%9Fukan-tun%C3%A7ay-b58a8a225/" target="_blank" class="underline">Doğukan TUNÇAY</a> tarafından <strong>Antalya Belek Üniversitesi Yapay Zeka dersi Naive Bayes Algoritması çözümü</strong> için örnek olarak yapılmıştır. </span>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';

const table = reactive({
  columns: []
});
const rows = reactive([]);
const newColumnName = ref('');
const newColumnPrimary = ref(false);
const selectedPrimaryColumn = ref('');
const selectedColumn = ref('');
const newValue = ref('');
const newRowValues = reactive({});
const result = ref(null);
const nbInput = reactive({});
const ratios = reactive({});
const primaryValues = ref([]);
const primaryColumn = ref('');
const counts = reactive({});

const addNewColumn = () => {
  if (newColumnName.value && !table.columns.some(column => column.name === newColumnName.value)) {
    table.columns.push({ name: newColumnName.value, primary: newColumnPrimary.value, values: [] });
    newRowValues[newColumnName.value] = '';
    newColumnName.value = '';
    newColumnPrimary.value = false;
  }
};

const addValueToColumn = () => {
  if (selectedColumn.value && newValue.value) {
    const column = table.columns.find(col => col.name === selectedColumn.value);
    if (column && !column.values.includes(newValue.value)) {
      column.values.push(newValue.value);
      newValue.value = '';
    }
  }
};

const removeColumn = (index) => {
  const columnName = table.columns[index].name;
  table.columns.splice(index, 1);
  delete newRowValues[columnName];
  rows.forEach(row => {
    row.values.splice(index, 1);
  });
};

const removeRow = (index) => {
  rows.splice(index, 1);
};

const addNewRow = () => {
  const valuesArray = table.columns.map(column => newRowValues[column.name] || '');
  if (valuesArray.includes('')) {
    alert('Tüm sütunlar için bir değer seçmelisiniz.');
    return;
  }
  rows.push({ values: valuesArray });
  Object.keys(newRowValues).forEach(key => {
    newRowValues[key] = '';
  });
};

const setPrimaryColumn = () => {
  table.columns.forEach(column => {
    column.primary = (column.name === selectedPrimaryColumn.value);
  });
  primaryColumn.value = selectedPrimaryColumn.value;
};

const getColumnValues = (columnName) => {
  const column = table.columns.find(col => col.name === columnName);
  return column ? column.values : [];
};


const calculateRatios = () => {
  const totals = {};
  ratios.value = {}; // Oranları sıfırla
  Object.keys(counts).forEach(key => {
    counts[key] = {};
  }); // Counts'u sıfırla

  // Primary column değerlerini ayarla
  primaryValues.value = getColumnValues(primaryColumn.value);

  // Initialize counts and totals for each unique value in the primary column
  primaryValues.value.forEach(value => {
    totals[value] = 0;
  });

  // Diğer sütunları dolaşarak her bir değer için primary sütundaki her bir değere göre sayıları topla
  table.columns.forEach(column => {
    if (column.name !== primaryColumn.value) {
      counts[column.name] = {};
      ratios[column.name] = {};
      getColumnValues(column.name).forEach(value => {
        counts[column.name][value] = {};
        primaryValues.value.forEach(primaryValue => {
          counts[column.name][value][primaryValue] = 0;
        });
      });
    }
  });

  // Satırları dolaşarak sayıları güncelle
  rows.forEach(row => {
    const primaryValue = row.values[table.columns.findIndex(col => col.name === primaryColumn.value)];
    totals[primaryValue]++;
    table.columns.forEach((column, colIndex) => {
      if (column.name !== primaryColumn.value) {
        const value = row.values[colIndex];
        if (!counts[column.name][value]) {
          counts[column.name][value] = {};
        }
        if (!counts[column.name][value][primaryValue]) {
          counts[column.name][value][primaryValue] = 0;
        }
        counts[column.name][value][primaryValue]++;
      }
    });
  });

  // Oranları hesapla
  table.columns.forEach(column => {
    if (column.name !== primaryColumn.value) {
      getColumnValues(column.name).forEach(value => {
        ratios[column.name][value] = {};
        primaryValues.value.forEach(primaryValue => {
          const total = totals[primaryValue] || 1; // Bölme hatasını önlemek için 0 yerine 1 kullanın
          const ratio = counts[column.name][value][primaryValue] / total;
          ratios[column.name][value][primaryValue] = ratio;
        });
      });
    }
  });
};
const calculateRatio = (key, subkey) => {
  const primaryColumnValues = table.columns.find(col => col.primary).values;
  const ratioResults = {};

  primaryColumnValues.forEach(primaryValue => {
    const specificCount = counts[key][subkey] && counts[key][subkey][primaryValue] !== undefined ? counts[key][subkey][primaryValue] : 0;
    const totalPrimaryValue = Object.values(counts[key]).reduce((acc, val) => acc + (val[primaryValue] !== undefined ? val[primaryValue] : 0), 0);

    if (totalPrimaryValue === 0) {
      ratioResults[primaryValue] = 'N/A'; // Bölme hatasını önlemek için
    } else {
      ratioResults[primaryValue] = `${specificCount} / ${totalPrimaryValue}`;
    }
  });

  return ratioResults;
};

</script>
