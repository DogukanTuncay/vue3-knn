<script setup>
  import {
    reactive,
    ref,
    nextTick
  } from 'vue';
  let nextId = 1; // Benzersiz ID'ler için sayaç
  const table = reactive({
    columns: []
  });
  const knn = reactive({
    rows: [],
  });

  const newColumnName = ref('');
  const selectedColumn = ref('');
  const newValues = ref('');
  const calculated = ref(false); // Hesaplama yapıldığında true olacak
  const log = reactive([]); // Her adımı kaydetmek için
  const distanceType = ref('euclidean'); // Mesafe hesaplama yöntemi
  const kValue = ref(3); // k değeri

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

    return {
      distance,
      logStr
    };
  }

  function manhattanDistance(point1, point2, rowId) {
    let sumExpression = ""; // Summation ifadesi için boş bir string
    let sum = 0; // Uzaklık hesaplaması için başlangıç değeri

    point1.forEach((p1, i) => {
      const diff = Math.abs(p1 - point2[i]);
      sum += diff; // Manhattan uzaklığı hesaplaması
      sumExpression += `${i > 0 ? " + " : ""}|${p1}-${point2[i]}|`; // LaTeX formatında sum ifadesi
    });

    const distance = sum; // Manhattan uzaklığı
    const logStr = `Satır ${rowId}: \\(${sumExpression}\\) = ${distance.toFixed(2)}`; // LaTeX ve sonuç

    return {
      distance,
      logStr
    };
  }

  const calculateDistance = (point1, point2, rowId) => {
    if (distanceType.value === 'euclidean') {
      return euclideanDistance(point1, point2, rowId);
    } else if (distanceType.value === 'manhattan') {
      return manhattanDistance(point1, point2, rowId);
    }
    // Varsayılan olarak öklid mesafesini kullan
    return euclideanDistance(point1, point2, rowId);
  };

  const calculateKNN = () => {
    log.length = 0; // Log dizisini temizle
    const userInputValues = Object.values(knnInput).map(value => parseFloat(value));

    knn.rows.forEach(row => {
      const rowValues = row.values.map(value => parseFloat(value));
      const {
        distance,
        logStr
      } = calculateDistance(userInputValues, rowValues, row.id);
      row.distance = distance;
      log.push(logStr); // Hesaplama logunu ekle
    });

    // Mesafe sonuçlarını sıralama
    knn.rows.sort((a, b) => a.distance - b.distance);

    // En yakın k komşuyu bul
    const kNearest = knn.rows.slice(0, kValue.value);
    
    // Sonuçların görsel olarak belirtilmesi için ek bir mesaj ekle
    log.push(`En yakın ${kValue.value} komşu: ${kNearest.map(row => row.id).join(', ')}`);

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
        <input v-model="newValues" placeholder="Değerler (virgülle ayrılmış)"
          class="p-2 border rounded shadow-sm w-full" />
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
              <button @click="removeColumn(index)"
                class="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                <span> <i class="fas fa-trash-can"></i></span>
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
              <button @click="removeRow(index)"
                class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                <span> <i class="fas fa-trash-can"></i></span>
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
          <input v-model="knnInput[column]" :id="`input-${column}`" class="p-2 border rounded shadow-sm" type="text"
            placeholder="Değer" />
        </div>
        <div class="flex flex-col">
          <label for="k-value" class="mb-2">K Değeri</label>
          <input v-model.number="kValue" id="k-value" type="number" min="1" class="p-2 border rounded shadow-sm" />
        </div>
        <div class="flex flex-col">
          <label for="distance-type" class="mb-2">Mesafe Hesaplama Yöntemi</label>
          <select v-model="distanceType" id="distance-type" class="p-2 border rounded shadow-sm">
            <option value="euclidean">Öklid Mesafesi</option>
            <option value="manhattan">Manhattan Mesafesi</option>
          </select>
        </div>
        <button type="submit" class="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Hesapla
        </button>
      </form>
    </div>
    <div v-if="calculated" class=" m-10 overflow-x-auto">
      <h3 class="text-lg font-semibold mb-4">Sonuçlar (K = {{ kValue }}, Mesafe: {{ distanceType === 'euclidean' ? 'Öklid' : 'Manhattan' }})</h3>
      <table class="table-auto w-full text-left whitespace-no-wrap">
        <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
          <tr>
            <th class="px-6 py-3">ID</th>
            <th class="px-6 py-3">Distance</th>
            <th v-for="column,index in table.columns" :key="column" class="px-6 py-3">
              {{ column }}
            </th>
            <th class="px-6 py-3">K-NN Sonucu</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-gray-200">
          <tr v-for="(row, rowIndex) in knn.rows" :key="row.id" :class="{ 'bg-green-100': rowIndex < kValue }">
            <td class="px-6 py-4">{{ row.id }}</td>
            <td class="px-6 py-4">{{ row.distance.toFixed(2) }}</td>
            <td v-for="(value, valueIndex) in row.values" :key="valueIndex" class="px-6 py-4">
              {{ value }}
            </td>
            <td class="px-6 py-4">
              <span v-if="rowIndex < kValue" class="px-2 py-1 bg-green-500 text-white rounded">K-NN Komşusu</span>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="calculated" class="mt-6">
        <h4 class="text-md font-semibold mb-2">Hesaplama Adımları:</h4>
        <ul class="list-disc pl-5">
          <li v-for="(item, index) in log" :key="index" v-html="item"></li>
        </ul>
      </div>
    </div>
  </div>

</template>