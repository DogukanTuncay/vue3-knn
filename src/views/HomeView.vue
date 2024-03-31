<template>
  <div class="max-w-4xl mx-auto py-8 space-y-8">
    <!-- Sütun Ekleme Formu -->
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
            <th v-for="column,index in table.columns" :key="column" class="px-6 py-3">
              {{ column }}
              <button @click="removeColumn(index)" class="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                <span>  <i class="fas fa-trash-can"></i></span>
            </button> <!-- Sütun Silme Butonu -->
            </th>
           
          </tr>
        </thead>
  <tbody class="text-sm divide-y divide-gray-200">
    <tr v-for="(row, index) in knn.rows" :key="index">
      <td v-for="(value, valueIndex) in row.values" :key="valueIndex" class="px-6 py-4">
        {{ value }}
      </td>
      <!-- <td class="px-6 py-4">
      <input v-model="row.result" type="text" placeholder="Sonuç" class="p-2 border rounded shadow-sm">
    </td> -->
      <td class="px-6 py-4">
        <button @click="removeRow(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          <span>  <i class="fas fa-trash-can"></i></span>
        </button> <!-- Silme butonu -->
      </td>
    </tr>
  </tbody>
      </table>
    </div>
    <hr>
    <!-- KNN için Değer Girişi Formu -->
    <div v-if="table.columns.length > 0" class="mb-8">
      <h2 class="text-lg font-semibold mb-4">KNN Hesaplama İçin Değerler:</h2>
      <form @submit.prevent="calculateKNN" class="flex flex-wrap gap-4 mb-4">
        <div v-for="column in table.columns" :key="column" class="flex flex-col">
          <label :for="`input-${column}`" class="mb-2">{{ column }}</label>
          <input v-model="knnInput[column]" :id="`input-${column}`" type="text" placeholder="Değer"  />
        </div>
        <button type="submit" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Hesapla
        </button>
      </form>
    </div>
    <div v-if="calculated" class="mt-8 overflow-x-auto">
    <table class="table-auto w-full text-left whitespace-no-wrap">
      <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
        <tr>
          <th class="px-6 py-3">ID</th>
          <th class="px-6 py-3">Distance</th>
          <th v-for="column,index in table.columns" :key="column" class="px-6 py-3">
              {{ column }}
              <button @click="removeColumn(index)" class="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                <span>  <i class="fas fa-trash-can"></i></span>
            </button> <!-- Sütun Silme Butonu -->
            </th>
        </tr>
      </thead>
      <tbody class="text-sm divide-y divide-gray-200">
        <tr v-for="row in knn.rows" :key="row.id">
          <td class="px-6 py-4">{{ row.id }}</td>
          <td class="px-6 py-4">{{ row.distance }}</td>
          <td v-for="(value, valueIndex) in row.values" :key="valueIndex" class="px-6 py-4">
             {{ value }}
          </td>
      <!-- <td class="px-6 py-4">
      <input v-model="row.result" type="text" placeholder="Sonuç" class="p-2 border rounded shadow-sm">
    </td> -->
      <td class="px-6 py-4">
        <button @click="removeRow(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
          <span>  <i class="fas fa-trash-can"></i></span>
        </button> <!-- Silme butonu -->
      </td>
        </tr>
      </tbody>
    </table>
    <div v-if="calculated">
  <ul>
    <li v-for="(item, index) in log" :key="index" v-html="item"></li>
  </ul>
</div>

  </div>
  </div>



  

<footer class="fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow md:flex md:items-center md:justify-center md:p-6 dark:bg-gray-800 dark:border-gray-600">
    <span class="text-sm text-gray-500 sm:text-center dark:text-gray-400">&copy; Bu site <a href="https://www.linkedin.com/in/do%C4%9Fukan-tun%C3%A7ay-b58a8a225/" target="_blank" class="underline">Doğukan TUNÇAY</a> tarafından <strong>Antalya Belek Üniversitesi Yapay Zeka dersi  KNN Algoritması çözümü</strong>  için örnek olarak yapılmıştır. </span>
    <div>

    </div>
</footer>
</template>

<script setup>
import { reactive, ref,nextTick } from 'vue';
let nextId = 1; // Benzersiz ID'ler için sayaç
const table = reactive({
  columns: ['Yaş','Nabız','Solunum Hızı','Ateş']
});
const knn = reactive({
  rows: [],
});

const newColumnName = ref('');
const selectedColumn = ref('');
const newValues = ref('');
const calculated = ref(false); // Hesaplama yapıldığında true olacak
const log = reactive([]); // Her adımı kaydetmek için

const addNewColumn = () => {
  if (newColumnName.value && !table.columns.includes(newColumnName.value)) {
    table.columns.push(newColumnName.value);
    newColumnName.value = '';
  }
};

const addNewValues = (values) => {
  // Yeni satırı knn.rows'a ekle
  // Örneğin, values: { Sütun1: 'değer1', Sütun2: 'değer2' }
  if (newValues.value) {
    const valuesArray = newValues.value.split(/[\s,]+/);
    const newRow = {
    id: nextId++, // Benzersiz ID ataması
    values: valuesArray, // values bir dizi varsayılarak birleştiriliyor
    distance: 0, // Varsayılan distance değeri
    // result: '' // Başlangıçta boş bir result değeri
  };
  knn.rows.push(newRow);

    newValues.value = '';
    selectedColumn.value = '';
  }
  
};
// Kullanıcıdan alınan KNN hesaplama değerleri için bir reactive obje
const knnInput = reactive({});
function euclideanDistance(point1, point2, rowId) {
  let sumExpression = ""; // Summation ifadesi için boş bir string
  let sum = 0; // Uzaklık hesaplaması için başlangıç değeri

  point1.forEach((p1, i) => {
    const diff = p1 - point2[i];
    sum += diff * diff; // Uzaklık hesaplaması
    sumExpression += `${i > 0 ? " + " : ""}(${p1}-${point2[i]})^2`; // LaTeX formatında sum ifadesi
  });

  const distance = Math.sqrt(sum); // Öklid uzaklığını hesapla
  const logStr = `Satır ${rowId}: \\(\\sqrt{${sumExpression}}\\) = ${distance.toFixed(2)}`; // LaTeX ve sonuç

  return { distance, logStr };
}

const calculateKNN = () => {
  log.length = 0; // Log dizisini temizle
  const userInputValues = Object.values(knnInput).map(value => parseFloat(value));

  knn.rows.forEach(row => {
    const rowValues = row.values.map(value => parseFloat(value));
    const { distance, logStr } = euclideanDistance(userInputValues, rowValues, row.id);
    row.distance = distance;
    log.push(logStr); // Hesaplama logunu ekle
  });

  calculated.value = true; // Hesaplama bayrağını ayarla
  // MathJax'ı tetikle
  nextTick(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  });
};
const removeRow = (index) => {
  knn.rows.splice(index, 1); // İndekse göre satırı sil
};
const removeColumn = (index) => {
  table.columns.splice(index, 1); // İndekse göre sütunu sil
  // Sütun silindiğinde, knn.rows'daki ilgili değerleri de güncellemeniz gerekir
  // Bu, mevcut veri yapınızda doğrudan mümkün olmayabilir
};
</script>
