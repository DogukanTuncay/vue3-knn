<script setup>
import { reactive, ref, nextTick, onMounted } from 'vue';

const table = reactive({
  columns: [],
  rows: []
});

// Dropdown ve yeni değer ekleme için değişkenler
const columnValues = reactive({}); // Her sütun için olası değerleri saklar
const newRowValues = reactive({}); // Yeni satır için seçilen değerleri saklar
const addingNewValues = reactive({}); // Yeni değer ekleme modunu takip eder
const newColumnValue = reactive({}); // Yeni eklenecek değeri saklar

// Örnek veri seti
const sampleData = {
  columns: ['Hava Durumu', 'Sıcaklık', 'Nem', 'Rüzgar', 'Oyun'],
  rows: [
    ['Güneşli', 'Sıcak', 'Yüksek', 'Zayıf', '0'],
    ['Güneşli', 'Sıcak', 'Yüksek', 'Güçlü', '0'],
    ['Bulutlu', 'Sıcak', 'Yüksek', 'Zayıf', '1'],
    ['Yağmurlu', 'Ilık', 'Yüksek', 'Zayıf', '1'],
    ['Yağmurlu', 'Soğuk', 'Normal', 'Zayıf', '1'],
    ['Yağmurlu', 'Soğuk', 'Normal', 'Güçlü', '0'],
    ['Bulutlu', 'Soğuk', 'Normal', 'Güçlü', '1'],
    ['Güneşli', 'Ilık', 'Yüksek', 'Zayıf', '0'],
    ['Güneşli', 'Soğuk', 'Normal', 'Zayıf', '1'],
    ['Yağmurlu', 'Ilık', 'Normal', 'Zayıf', '1'],
    ['Güneşli', 'Ilık', 'Normal', 'Güçlü', '1'],
    ['Bulutlu', 'Ilık', 'Yüksek', 'Güçlü', '1'],
    ['Bulutlu', 'Sıcak', 'Normal', 'Zayıf', '1'],
    ['Yağmurlu', 'Ilık', 'Yüksek', 'Güçlü', '0']
  ]
};

// Örnek veriyi sayfa yüklendiğinde ekle
onMounted(() => {
  loadSampleData();
});

const loadSampleData = () => {
  table.columns = [...sampleData.columns];
  table.rows = sampleData.rows.map(row => [...row]);
  
  // Örnek değerleri seçili yap
  selectedEntropyColumn.value = 'Hava Durumu';
  selectedPrimaryColumn.value = 'Oyun';
  
  // Her sütun için olası değerleri güncelle
  updateColumnValues();
  
  // Yeni değer ekleme modlarını sıfırla
  resetNewValueModes();
};

const clearData = () => {
  table.columns = [];
  table.rows = [];
  selectedEntropyColumn.value = '';
  selectedPrimaryColumn.value = '';
  entropyResult.value = null;
  informationGainResult.value = null;
  specificEntropies.value = {};
  log.value = [];
  calculationSteps.value = [];
  
  // Dropdown değerlerini temizle
  Object.keys(columnValues).forEach(key => {
    delete columnValues[key];
  });
  Object.keys(newRowValues).forEach(key => {
    delete newRowValues[key];
  });
  
  // Yeni değer ekleme modlarını sıfırla
  resetNewValueModes();
};

const newColumnName = ref('');
const selectedEntropyColumn = ref('');
const selectedPrimaryColumn = ref('');
const log = ref([]);
const calculationSteps = ref([]); // Hesaplama adımlarını kaydetmek için

// Her sütun için olası değerleri güncelle
const updateColumnValues = () => {
  table.columns.forEach(column => {
    if (!columnValues[column]) {
      columnValues[column] = new Set();
    }
  });
  
  // Her satırdaki değerleri ilgili sütunlara ekle
  table.rows.forEach(row => {
    table.columns.forEach((column, index) => {
      if (row[index]) {
        columnValues[column].add(row[index]);
      }
    });
  });
};

// Yeni değer ekleme modlarını sıfırla
const resetNewValueModes = () => {
  table.columns.forEach(column => {
    addingNewValues[column] = false;
    newColumnValue[column] = '';
  });
};

const addNewColumn = () => {
  if (newColumnName.value && !table.columns.includes(newColumnName.value)) {
    table.columns.push(newColumnName.value);
    columnValues[newColumnName.value] = new Set();
    addingNewValues[newColumnName.value] = false;
    newColumnValue[newColumnName.value] = '';
    newColumnName.value = '';
  }
};

// Yeni değer ekleme modunu aç/kapat
const toggleNewValueMode = (column) => {
  addingNewValues[column] = !addingNewValues[column];
  newColumnValue[column] = '';
};

// Sütuna yeni değer ekle
const addNewColumnValue = (column) => {
  if (newColumnValue[column] && !columnValues[column].has(newColumnValue[column])) {
    columnValues[column].add(newColumnValue[column]);
    newRowValues[column] = newColumnValue[column];
    newColumnValue[column] = '';
    addingNewValues[column] = false;
  }
};

const addNewValues = () => {
  // Tüm sütunlar için değer seçilmiş mi kontrol et
  const missingColumns = table.columns.filter(column => !newRowValues[column]);
  
  if (missingColumns.length > 0) {
    alert(`Lütfen şu sütunlar için değer seçin: ${missingColumns.join(', ')}`);
    return;
  }
  
  // Seçilen değerlerden yeni bir satır oluştur
  const newRow = table.columns.map(column => newRowValues[column]);
  table.rows.push(newRow);
  
  // Değerleri sıfırlama (opsiyonel)
  // table.columns.forEach(column => {
  //   newRowValues[column] = '';
  // });
};

const removeRow = (index) => {
  table.rows.splice(index, 1);
  updateColumnValues();
};

const removeColumn = (column) => {
  const columnIndex = table.columns.indexOf(column);
  if (columnIndex > -1) {
    table.columns.splice(columnIndex, 1);
    table.rows.forEach(row => {
      row.splice(columnIndex, 1);
    });
    
    // Sütunla ilgili değerleri temizle
    delete columnValues[column];
    delete newRowValues[column];
    delete addingNewValues[column];
    delete newColumnValue[column];
  }
};

const entropyResult = ref(null);
const informationGainResult = ref(null);
const specificEntropies = ref({});
const normalizeString = (str) => {
  return str.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};

const calculateEntropy = () => {
  log.value = []; // Logları temizle
  calculationSteps.value = []; // Hesaplama adımlarını temizle
  entropyResult.value = null;
  informationGainResult.value = null;
  specificEntropies.value = {};
  
  const columnToCalculate = selectedEntropyColumn.value;
  const primaryColumn = selectedPrimaryColumn.value;

  if (!columnToCalculate || !primaryColumn) {
    alert('Lütfen entropi hesaplamak ve primary alan için sütun seçin.');
    return;
  }

  calculationSteps.value.push(`<b>Entropi ve Bilgi Kazanımı Hesaplaması:</b> ${columnToCalculate} özelliği için`);
  calculationSteps.value.push(`<b>Adım 1:</b> Veri setini analiz et ve sınıf dağılımını hesapla.`);

  const columnIndex = table.columns.indexOf(columnToCalculate);
  const primaryIndex = table.columns.indexOf(primaryColumn);

  const valuesArray = table.rows.map(row => normalizeString(row[columnIndex])); // Değerleri normalize et
  const primaryValues = table.rows.map(row => row[primaryIndex]);

  // Genel entropiyi hesapla
  calculationSteps.value.push(`<b>Adım 2:</b> Genel entropi H(S) hesaplaması.`);
  
  const totalPositive = primaryValues.filter(value => value == 1).length;
  const totalNegative = primaryValues.filter(value => value == 0).length;
  const total = totalPositive + totalNegative;

  const p_total_positive = totalPositive / total;
  const p_total_negative = totalNegative / total;

  calculationSteps.value.push(`Toplam örneklem: ${total} (${totalPositive} pozitif, ${totalNegative} negatif)`);
  calculationSteps.value.push(`P(Sınıf=1) = ${totalPositive}/${total} = ${p_total_positive.toFixed(4)}`);
  calculationSteps.value.push(`P(Sınıf=0) = ${totalNegative}/${total} = ${p_total_negative.toFixed(4)}`);

  let generalEntropy = 0;
  let generalEntropyFormula = `H(S) = -`;

  if (p_total_positive > 0) {
    const term = p_total_positive * Math.log2(p_total_positive);
    generalEntropy -= term;
    generalEntropyFormula += `(${p_total_positive.toFixed(4)} \\times \\log_2(${p_total_positive.toFixed(4)}))`;
  }
  if (p_total_negative > 0) {
    const term = p_total_negative * Math.log2(p_total_negative);
    generalEntropy -= term;
    generalEntropyFormula += ` - (${p_total_negative.toFixed(4)} \\times \\log_2(${p_total_negative.toFixed(4)}))`;
  }

  generalEntropyFormula += ` = ${generalEntropy.toFixed(4)}`;
  entropyResult.value = `\\(${generalEntropyFormula}\\)`;
  calculationSteps.value.push(`<b>Genel Entropi Sonucu:</b> \\(${generalEntropyFormula}\\)`);
  
  log.value.push(`Genel Entropi: ${generalEntropy.toFixed(4)}`);
  log.value.push(`Genel Entropi Matematiksel Gösterim: \\(${generalEntropyFormula}\\)`);

  // MathJax güncellemesi
  nextTick(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  });

  // Özellik için Bilgi Kazanımını Hesapla
  calculationSteps.value.push(`<b>Adım 3:</b> "${columnToCalculate}" özelliğinin her değeri için entropi hesaplaması.`);
  
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
      calculationSteps.value.push(`'${uniqueValue}' değeri için geçerli veri yok.`);
      log.value.push(`'${uniqueValue}' değeri için geçerli veri yok.`);
      return;
    }

    calculationSteps.value.push(`<b>"${uniqueValue}" değeri için:</b> ${subsetTotal} örnek (${positiveCount} pozitif, ${negativeCount} negatif)`);
    
    const p_positive = positiveCount / subsetTotal;
    const p_negative = negativeCount / subsetTotal;

    calculationSteps.value.push(`P(Sınıf=1 | ${columnToCalculate}=${uniqueValue}) = ${positiveCount}/${subsetTotal} = ${p_positive.toFixed(4)}`);
    calculationSteps.value.push(`P(Sınıf=0 | ${columnToCalculate}=${uniqueValue}) = ${negativeCount}/${subsetTotal} = ${p_negative.toFixed(4)}`);

    let entropy = 0;
    let entropyFormula = `H(${uniqueValue}) = -`;

    if (p_positive > 0) {
      const term = p_positive * Math.log2(p_positive);
      entropy -= term;
      entropyFormula += `(${p_positive.toFixed(4)} \\times \\log_2(${p_positive.toFixed(4)}))`;
    }
    if (p_negative > 0) {
      const term = p_negative * Math.log2(p_negative);
      entropy -= term;
      entropyFormula += ` - (${p_negative.toFixed(4)} \\times \\log_2(${p_negative.toFixed(4)}))`;
    }

    entropyFormula += ` = ${entropy.toFixed(4)}`;
    
    calculationSteps.value.push(`<b>"${uniqueValue}" için Entropi:</b> \\(${entropyFormula}\\)`);
    
    log.value.push(`  - '${uniqueValue}' için Entropi: ${entropy.toFixed(4)}`);
    log.value.push(`  - Matematiksel Gösterim: \\(${entropyFormula}\\)`);
    specificEntropies.value[uniqueValue] = `\\(${entropyFormula}\\)`;

    // Ağırlıklı entropiyi hesapla
    const weightedEntropy = (subsetTotal / total) * entropy;
    weightedEntropySum += weightedEntropy;
    weightedEntropyFormula += `\\frac{${subsetTotal}}{${total}} \\times H(${uniqueValue}) + `;
    
    calculationSteps.value.push(`<b>Ağırlıklı Entropi:</b> \\(\\frac{${subsetTotal}}{${total}} \\times ${entropy.toFixed(4)} = ${weightedEntropy.toFixed(4)}\\)`);
  });

  // Bilgi Kazanımı Hesaplama
  calculationSteps.value.push(`<b>Adım 4:</b> Ağırlıklı entropileri toplayarak bilgi kazanımını hesapla.`);
  
  weightedEntropyFormula = weightedEntropyFormula.slice(0, -3); // Sonundaki ' + 'yı kaldır
  const informationGain = generalEntropy - weightedEntropySum;
  const informationGainFormula = `IG(S, ${columnToCalculate}) = H(S) - (${weightedEntropyFormula}) = ${generalEntropy.toFixed(4)} - ${weightedEntropySum.toFixed(4)} = ${informationGain.toFixed(4)}`;

  calculationSteps.value.push(`<b>Ağırlıklı Entropi Toplamı:</b> \\(${weightedEntropySum.toFixed(4)}\\)`);
  calculationSteps.value.push(`<b>Bilgi Kazanımı:</b> \\(${informationGainFormula}\\)`);
  
  informationGainResult.value = `\\(${informationGainFormula}\\)`;
  
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

<template>
    <div class="max-w-4xl mx-auto py-8 space-y-8">
      <!-- Başlık ve Açıklama -->
      <div>
        <h1 class="text-xl font-bold mb-2">Entropi ve Bilgi Kazanımı Hesaplayıcı</h1>
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 class="text-md font-semibold mb-2">Entropi ve Bilgi Kazanımı:</h4>
          <p class="mb-2">Entropi, bir veri kümesinin ne kadar karışık veya belirsiz olduğunu ölçer. Bilgi kazanımı ise bir özelliğin, veri kümesindeki belirsizliği ne kadar azalttığını gösterir.</p>
          <p class="mb-2"><strong>Entropi Formülü:</strong> \(H(S) = -\sum_{x \in X} p(x) \log_2 p(x)\)</p>
          <p class="mb-2"><strong>Bilgi Kazanımı:</strong> \(IG(S, A) = H(S) - \sum_{t \in T} \frac{|S_t|}{|S|} H(S_t)\)</p>
          <p class="mb-2 text-red-600 font-medium">HAYIR-EVET YERİNE 0-1 GİRMEYİ UNUTMA !!</p>
        </div>
      </div>
      
      <!-- Veri Yönetimi Butonları -->
      <div class="bg-white p-4 rounded-lg shadow flex gap-4">
        <button @click="loadSampleData" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Örnek Veriyi Yükle
        </button>
        <button @click="clearData" class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          Verileri Temizle
        </button>
      </div>
      
      <!-- Sütun Ekleme Formu -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Veri Girişi</h2>
        <form @submit.prevent="addNewColumn" class="flex gap-4 mb-4">
          <input v-model="newColumnName" placeholder="Yeni sütun adı" class="p-2 border rounded shadow-sm w-full" />
          <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Sütun Ekle
          </button>
        </form>
      
        <!-- Değer Ekleme Formu - Dropdown ile -->
        <div v-if="table.columns.length > 0" class="mb-4">
          <h3 class="text-md font-semibold mb-2">Veri Satırı Ekle</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div v-for="column in table.columns" :key="column" class="flex flex-col">
              <label :for="`select-${column}`" class="mb-2">{{ column }}:</label>
              <div class="space-y-2">
                <!-- Dropdown seçim alanı -->
                <div v-if="!addingNewValues[column]">
                  <select 
                    v-model="newRowValues[column]" 
                    :id="`select-${column}`" 
                    class="p-2 border rounded shadow-sm w-full"
                  >
                    <option value="">Seçiniz...</option>
                    <option v-for="value in Array.from(columnValues[column] || [])" :key="value" :value="value">
                      {{ value }}
                    </option>
                  </select>
                  <button 
                    @click="toggleNewValueMode(column)" 
                    type="button" 
                    class="mt-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Yeni değer ekle
                  </button>
                </div>
                
                <!-- Yeni değer ekleme alanı -->
                <div v-else class="flex gap-2">
                  <input 
                    v-model="newColumnValue[column]" 
                    :placeholder="`Yeni ${column} değeri`" 
                    class="p-2 border rounded shadow-sm w-full"
                  />
                  <button 
                    @click="addNewColumnValue(column)" 
                    type="button" 
                    class="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded"
                  >
                    Ekle
                  </button>
                  <button 
                    @click="toggleNewValueMode(column)" 
                    type="button" 
                    class="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-3 rounded"
                  >
                    İptal
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button @click="addNewValues" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Veri Satırı Ekle
          </button>
        </div>
      </div>
  
      <!-- Dinamik Tablo -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Veri Tablosu</h2>
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
                <th class="px-6 py-3">İşlemler</th>
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
      </div>
  
      <!-- Sütun ve Primary Alan Seçimi -->
      <div class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Entropi Hesaplama Ayarları</h2>
        <div class="flex flex-wrap gap-4">
          <div class="flex-1">
            <label for="entropyColumn" class="block mb-2 font-medium">Entropi İçin Özellik Seç:</label>
            <select v-model="selectedEntropyColumn" id="entropyColumn" class="p-2 border rounded shadow-sm w-full">
              <option value="">Seçiniz...</option>
              <option v-for="column in table.columns" :key="column" :value="column">{{ column }}</option>
            </select>
          </div>
          <div class="flex-1">
            <label for="primaryColumn" class="block mb-2 font-medium">Hedef Sınıf Seç:</label>
            <select v-model="selectedPrimaryColumn" id="primaryColumn" class="p-2 border rounded shadow-sm w-full">
              <option value="">Seçiniz...</option>
              <option v-for="column in table.columns" :key="column" :value="column">{{ column }}</option>
            </select>
            <div class="text-xs text-gray-500 mt-1">Sınıf değerleri 0 ve 1 olmalıdır (Hayır/Evet, Negatif/Pozitif vs. için)</div>
          </div>
        </div>
        
        <div class="mt-4">
          <button @click="calculateEntropy" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-300" :disabled="!selectedEntropyColumn || !selectedPrimaryColumn">
            Entropi ve Bilgi Kazanımını Hesapla
          </button>
        </div>
      </div>
  
      <!-- Sonuçlar -->
      <div v-if="entropyResult !== null" class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Hesaplama Sonuçları</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 class="font-medium text-green-700 mb-2">Genel Entropi:</h3>
            <div v-html="entropyResult" class="text-xl"></div>
          </div>
          
          <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 class="font-medium text-blue-700 mb-2">Bilgi Kazanımı:</h3>
            <div v-html="informationGainResult" class="text-xl"></div>
          </div>
        </div>
        
        <div v-if="Object.keys(specificEntropies).length > 0" class="mt-4">
          <h3 class="font-medium mb-2">Her Değer İçin Entropi:</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="(value, key) in specificEntropies" :key="key" class="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <h4 class="font-medium mb-1">{{ key }}:</h4>
              <div v-html="value"></div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Adım Adım Hesaplama -->
      <div v-if="calculationSteps.length > 0" class="bg-white p-4 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-2">Hesaplama Adımları</h2>
        <div class="bg-gray-50 p-4 rounded-lg">
          <ul class="list-decimal pl-5">
            <li v-for="(step, index) in calculationSteps" :key="index" v-html="step" class="py-1"></li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <style scoped>
  /* Styling kısmı için mevcut stillemeler otomatik uygulanır */
  </style>
  