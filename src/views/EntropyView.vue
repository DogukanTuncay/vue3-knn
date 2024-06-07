
<script setup>
import { reactive, ref,nextTick } from 'vue';

const table = reactive({
  columns: [],
  rows: []
});

const newColumnName = ref('');
const newValues = ref('');
const selectedEntropyColumn = ref('');
const selectedPrimaryColumn = ref('');
const log = ref([]);

const addNewColumn = () => {
  if (newColumnName.value && !table.columns.includes(newColumnName.value)) {
    table.columns.push(newColumnName.value);
    newColumnName.value = '';
  }
};

const addNewValues = () => {
  if (newValues.value) {
    const valuesArray = newValues.value.split(/[\s,]+/);
    if (valuesArray.length === table.columns.length) {
      table.rows.push(valuesArray);
    }
    newValues.value = '';
  }
};

const removeRow = (index) => {
  table.rows.splice(index, 1);
};

const removeColumn = (column) => {
  const columnIndex = table.columns.indexOf(column);
  if (columnIndex > -1) {
    table.columns.splice(columnIndex, 1);
    table.rows.forEach(row => {
      row.splice(columnIndex, 1);
    });
  }
};

const entropyResult = ref(null);
const specificEntropies = ref({});
const normalizeString = (str) => {
  return str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};

const calculateEntropy = () => {
  log.value = []; // Logları temizle
  const columnToCalculate = selectedEntropyColumn.value;
  const primaryColumn = selectedPrimaryColumn.value;

  if (!columnToCalculate || !primaryColumn) {
    alert('Lütfen entropi hesaplamak ve primary alan için sütun seçin.');
    return;
  }

  const columnIndex = table.columns.indexOf(columnToCalculate);
  const primaryIndex = table.columns.indexOf(primaryColumn);

  const valuesArray = table.rows.map(row => normalizeString(row[columnIndex])); // Değerleri normalize et
  const primaryValues = table.rows.map(row => row[primaryIndex]);

  // Genel entropiyi hesapla
  const totalPositive = primaryValues.filter(value => value == 1).length;
  const totalNegative = primaryValues.filter(value => value == 0).length;
  const total = totalPositive + totalNegative;

  const p_total_positive = totalPositive / total;
  const p_total_negative = totalNegative / total;

  let generalEntropy = 0;
  let generalEntropyFormula = `H(S) = - (`;

  if (p_total_positive > 0) {
    const term = p_total_positive * Math.log2(p_total_positive);
    generalEntropy -= term;
    generalEntropyFormula += `${p_total_positive.toFixed(4)} \\times \\log_2(${p_total_positive.toFixed(4)})`;
  }
  if (p_total_negative > 0) {
    const term = p_total_negative * Math.log2(p_total_negative);
    generalEntropy -= term;
    generalEntropyFormula += ` + ${p_total_negative.toFixed(4)} \\times \\log_2(${p_total_negative.toFixed(4)})`;
  }

  generalEntropyFormula += `) = ${generalEntropy.toFixed(4)}`;
  entropyResult.value = `\\(${generalEntropyFormula}\\)`;
  log.value.push(`Genel Entropi: ${generalEntropy.toFixed(4)}`);
  log.value.push(`Genel Entropi Matematiksel Gösterim: \\(${generalEntropyFormula}\\)`);

  // MathJax güncellemesi
  nextTick(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  });

  // Özellik için Bilgi Kazanımını Hesapla
  const uniqueValues = [...new Set(valuesArray)];
  let weightedEntropySum = 0;
  let weightedEntropyFormula = '';

  uniqueValues.forEach(uniqueValue => {
    const filteredIndices = valuesArray.map((value, index) => value === uniqueValue ? index : -1).filter(index => index !== -1);
    const filteredPrimaryValues = filteredIndices.map(index => primaryValues[index]);

    const positiveCount = filteredPrimaryValues.filter(value => value == 1).length;
    const negativeCount = filteredPrimaryValues.filter(value => value == 0).length;
    const subsetTotal = positiveCount + negativeCount;

    if (subsetTotal === 0) {
      log.value.push(`'${uniqueValue}' değeri için geçerli veri yok.`);
      return;
    }

    const p_positive = positiveCount / subsetTotal;
    const p_negative = negativeCount / subsetTotal;

    let entropy = 0;
    let entropyFormula = `H(${uniqueValue}) = - (`;

    if (p_positive > 0) {
      const term = p_positive * Math.log2(p_positive);
      entropy -= term;
      entropyFormula += `${p_positive.toFixed(4)} \\times \\log_2(${p_positive.toFixed(4)})`;
    }
    if (p_negative > 0) {
      const term = p_negative * Math.log2(p_negative);
      entropy -= term;
      entropyFormula += ` + ${p_negative.toFixed(4)} \\times \\log_2(${p_negative.toFixed(4)})`;
    }

    entropyFormula += `) = ${entropy.toFixed(4)}`;
    log.value.push(`  - '${uniqueValue}' için Entropi: ${entropy.toFixed(4)}`);
    log.value.push(`  - Matematiksel Gösterim: \\(${entropyFormula}\\)`);
    specificEntropies.value[uniqueValue] = `\\(${entropyFormula}\\)`;

    // Ağırlıklı entropiyi hesapla
    const weightedEntropy = (subsetTotal / total) * entropy;
    weightedEntropySum += weightedEntropy;
    weightedEntropyFormula += `${(subsetTotal / total).toFixed(4)} \\times H(${uniqueValue}) + `;
  });

  weightedEntropyFormula = weightedEntropyFormula.slice(0, -3); // Sonundaki ' + 'yı kaldır
  const informationGain = generalEntropy - weightedEntropySum;
  const informationGainFormula = `IG(S, ${columnToCalculate}) = H(S) - (${weightedEntropyFormula}) = ${informationGain.toFixed(4)}`;

  log.value.push(`Bilgi Kazanımı: ${informationGain.toFixed(4)}`);
  log.value.push(`Bilgi Kazanımı Matematiksel Gösterim: \\(${informationGainFormula}\\)`);

  // MathJax güncellemesi
  nextTick(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  });
};





</script>

<style scoped>
/* Styling kısmı ihtiyaca göre eklenebilir */
</style>


<template>
    <div class="max-w-4xl mx-auto py-8 space-y-8">
      <!-- Sütun Ekleme Formu -->
      <div class="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
  <span class="font-medium">HAYIR-EVET YERİNE 0-1 GİRMEYİ UNUTMA !! </span>
</div>
      <div>
        <form @submit.prevent="addNewColumn" class="flex gap-4 mb-4">
          <input v-model="newColumnName" placeholder="Yeni sütun adı" class="p-2 border rounded shadow-sm w-full" />
          <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sütun Ekle
          </button>
        </form>
      </div>
      
      <!-- Değer Ekleme Formu -->
      <div>
        <form @submit.prevent="addNewValues" class="flex gap-4 mb-4">
          <input v-model="newValues" placeholder="Değerler (virgülle ayrılmış)" class="p-2 border rounded shadow-sm w-full" />
          <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Değer Ekle
          </button>
        </form>
      </div>
  
      <!-- Dinamik Tablo -->
      <div class="overflow-x-auto">
        <table class="table-auto w-full text-left whitespace-no-wrap">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th v-for="column in table.columns" :key="column" class="px-6 py-3">
                {{ column }}
                <button @click="removeColumn(column)" class="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                  <span> <i class="fas fa-trash-can"></i> </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="(row, index) in table.rows" :key="index">
              <td v-for="(value, valueIndex) in row" :key="valueIndex" class="px-6 py-4">
                {{ value }}
              </td>
              <td class="px-6 py-4">
                <button @click="removeRow(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  <span> <i class="fas fa-trash-can"></i> </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Sütun ve Primary Alan Seçimi -->
      <div class="mt-4 flex gap-4">
        <div>
          <label for="entropyColumn">Entropi İçin Sütun Seç:</label>
          <select v-model="selectedEntropyColumn" id="entropyColumn" class="p-2 border rounded shadow-sm">
            <option v-for="column in table.columns" :key="column" :value="column">{{ column }}</option>
          </select>
        </div>
        <div>
          <label for="primaryColumn">Primary Alan Seç:</label>
          <select v-model="selectedPrimaryColumn" id="primaryColumn" class="p-2 border rounded shadow-sm">
            <option v-for="column in table.columns" :key="column" :value="column">{{ column }}</option>
          </select>
        </div>
      </div>
  
      <!-- Entropi Hesaplama -->
      <div class="mt-8">
        <button @click="calculateEntropy" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          Entropi Hesapla
        </button>
        <div v-if="entropyResult !== null" class="mt-4">
          <p>Genel Entropi: {{ entropyResult }}</p>
          <p v-for="(value, key) in specificEntropies" :key="key">Entropi({{ key }}): {{ value }}</p>
        </div>
      </div>
  
      <!-- Loglama -->
      <div v-if="log.length > 0" class="mt-8">
        <h2 class="text-lg font-semibold mb-4">İşlem Adımları:</h2>
        <ul class="list-disc list-inside">
          <li v-for="(item, index) in log" :key="index">{{ item }}</li>
        </ul>
      </div>
    </div>
  </template>
  