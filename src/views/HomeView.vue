<script setup>
  import {
    reactive,
    ref,
    nextTick,
    onMounted
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
  
  // Hedef sütun için değişken
  const targetColumn = ref('');

  // Örnek veri seti
  const sampleData = {
    columns: ['Boy', 'Kilo', 'Yaş', 'Cinsiyet'],
    rows: [
      { id: 1, values: ['170', '70', '25', 'Erkek'], distance: 0 },
      { id: 2, values: ['155', '55', '27', 'Kadın'], distance: 0 },
      { id: 3, values: ['180', '85', '32', 'Erkek'], distance: 0 },
      { id: 4, values: ['160', '60', '23', 'Kadın'], distance: 0 },
      { id: 5, values: ['175', '75', '29', 'Erkek'], distance: 0 },
      { id: 6, values: ['165', '63', '26', 'Kadın'], distance: 0 },
      { id: 7, values: ['185', '90', '35', 'Erkek'], distance: 0 },
      { id: 8, values: ['158', '58', '22', 'Kadın'], distance: 0 },
      { id: 9, values: ['178', '80', '30', 'Erkek'], distance: 0 }
    ],
    targetColumn: 'Cinsiyet'
  };

  // Veri noktaları
  const points = ref([]);
  const newPoint = ref({ x: 0, y: 0 });
  const k = ref(3);
  const mathLog = ref([]);
  const result = ref(null);

  // Örnek veriyi sayfa yüklendiğinde ekle
  onMounted(() => {
    loadSampleData();
  });

  const loadSampleData = () => {
    // Tabloyu temizle
    table.columns = [...sampleData.columns];
    
    // Satırları temizle ve örnek verileri ekle
    knn.rows = sampleData.rows.map(row => ({ 
      id: row.id,
      values: [...row.values], 
      distance: 0 
    }));
    
    // Hedef sütunu ayarla
    targetColumn.value = sampleData.targetColumn;
    
    // Hesaplama girdileri için varsayılan değerler - hedef sütun hariç
    const targetIndex = table.columns.indexOf(targetColumn.value);
    table.columns.forEach((column, index) => {
      if (index !== targetIndex) {
        knnInput[column] = sampleData.rows[0].values[index];
      }
    });
    
    kValue.value = 3;
    distanceType.value = 'euclidean';
    
    // Hesaplamaları sıfırla
    calculated.value = false;
    log.length = 0;
  };

  const clearData = () => {
    table.columns = [];
    knn.rows = [];
    Object.keys(knnInput).forEach(key => delete knnInput[key]);
    kValue.value = 3;
    distanceType.value = 'euclidean';
    targetColumn.value = '';
    calculated.value = false;
    log.length = 0;
  };

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
        const newRow = {
          id: nextId++, // Benzersiz ID ataması
          values: valuesArray,
          distance: 0
        };
        knn.rows.push(newRow);
        newValues.value = '';
      } else {
        alert(`Lütfen ${table.columns.length} değer giriniz (virgülle ayrılmış)`);
      }
    }
  };

  // Kullanıcıdan alınan KNN hesaplama değerleri için bir reactive obje
  const knnInput = reactive({});

  const removeRow = (index) => {
    knn.rows.splice(index, 1); // İndekse göre satırı sil
  };

  const removeColumn = (index) => {
    const columnName = table.columns[index];
    
    // Hedef sütun silindiyse hedef değerini sıfırla
    if (columnName === targetColumn.value) {
      targetColumn.value = '';
    }
    
    table.columns.splice(index, 1); // İndekse göre sütunu sil
    
    // Satırlardaki değerleri de güncelle
    knn.rows.forEach(row => {
      row.values.splice(index, 1);
    });
    
    // Hesaplama girdilerini güncelle
    if (knnInput[columnName]) {
      delete knnInput[columnName];
    }
  };

  function euclideanDistance(point1, point2, rowId, targetIndex) {
    let sumExpression = ""; // Summation ifadesi için boş bir string
    let sum = 0; // Uzaklık hesaplaması için başlangıç değeri
    const pointDescription = [];

    point1.forEach((p1, i) => {
      // Hedef sütunu hesaplama dışında tut
      if (i !== targetIndex) {
        const diff = p1 - point2[i];
        sum += diff * diff; // Uzaklık hesaplaması
        sumExpression += `${sumExpression ? " + " : ""}(${p1}-${point2[i]})^2`; // LaTeX formatında sum ifadesi
        pointDescription.push(`x_${i+1}=${p1}, y_${i+1}=${point2[i]}`);
      }
    });

    const distance = Math.sqrt(sum); // Öklid uzaklığını hesapla
    const logStr = `Satır ${rowId} [${pointDescription.join(', ')}]: \\(d_{\\text{Öklid}} = \\sqrt{${sumExpression}}\\) = ${distance.toFixed(2)}`; // LaTeX ve sonuç

    return {
      distance,
      logStr
    };
  }

  function manhattanDistance(point1, point2, rowId, targetIndex) {
    let sumExpression = ""; // Summation ifadesi için boş bir string
    let sum = 0; // Uzaklık hesaplaması için başlangıç değeri
    const pointDescription = [];

    point1.forEach((p1, i) => {
      // Hedef sütunu hesaplama dışında tut
      if (i !== targetIndex) {
        const diff = Math.abs(p1 - point2[i]);
        sum += diff; // Manhattan uzaklığı hesaplaması
        sumExpression += `${sumExpression ? " + " : ""}|${p1}-${point2[i]}|`; // LaTeX formatında sum ifadesi
        pointDescription.push(`x_${i+1}=${p1}, y_${i+1}=${point2[i]}`);
      }
    });

    const distance = sum; // Manhattan uzaklığı
    const logStr = `Satır ${rowId} [${pointDescription.join(', ')}]: \\(d_{\\text{Manhattan}} = ${sumExpression}\\) = ${distance.toFixed(2)}`; // LaTeX ve sonuç

    return {
      distance,
      logStr
    };
  }

  const calculateDistance = (point1, point2, rowId, targetIndex) => {
    if (distanceType.value === 'euclidean') {
      return euclideanDistance(point1, point2, rowId, targetIndex);
    } else if (distanceType.value === 'manhattan') {
      return manhattanDistance(point1, point2, rowId, targetIndex);
    }
    // Varsayılan olarak öklid mesafesini kullan
    return euclideanDistance(point1, point2, rowId, targetIndex);
  };

  const calculateKNN = () => {
    log.length = 0; // Log dizisini temizle
    
    if (table.columns.length === 0 || knn.rows.length === 0) {
      alert('Lütfen önce veri girişi yapınız.');
      return;
    }
    
    if (!targetColumn.value) {
      alert('Lütfen bir hedef sütun seçiniz.');
      return;
    }
    
    const targetIndex = table.columns.indexOf(targetColumn.value);
    
    // Hedef sütun dışındaki tüm sütunlar için değer girilmeli
    const missingInputs = table.columns.filter((column, index) => 
      index !== targetIndex && !knnInput[column]
    );
    
    if (missingInputs.length > 0) {
      alert(`Lütfen ${missingInputs.join(', ')} için değer giriniz.`);
      return;
    }
    
    // Sayısal değerleri alırken hedef sütun için boş değer kullan
    const userInputValues = table.columns.map((column, index) => {
      if (index === targetIndex) {
        return null; // Hedef sütun için boş değer - mesafe hesaplamasında kullanılmayacak
      }
      return parseFloat(knnInput[column]);
    });

    // KNN algoritması için adım açıklaması ekle
    log.push(`<b>KNN Algoritması:</b> K = ${kValue.value}, Mesafe Metriği: ${distanceType.value === 'euclidean' ? 'Öklid' : 'Manhattan'}, Hedef Sütun: ${targetColumn.value}`);
    log.push(`<b>Adım 1:</b> Tüm veri noktaları ile yeni nokta arasındaki uzaklıkları hesapla (${targetColumn.value} sütunu hesaplamaya dahil edilmeden):`);

    knn.rows.forEach(row => {
      const rowValues = row.values.map(value => parseFloat(value) || value);
      const {
        distance,
        logStr
      } = calculateDistance(userInputValues, rowValues, row.id, targetIndex);
      row.distance = distance;
      log.push(logStr); // Hesaplama logunu ekle
    });

    // Sıralama adımı açıklaması
    log.push(`<b>Adım 2:</b> Veri noktalarını uzaklıklarına göre sırala (artan sırada):`);
    
    // Mesafe sonuçlarını sıralama
    knn.rows.sort((a, b) => a.distance - b.distance);
    
    // Sıralama sonucunu logla
    knn.rows.slice(0, kValue.value + 3).forEach(row => {
      log.push(`Satır ${row.id}: Mesafe = ${row.distance.toFixed(2)}`);
    });

    // En yakın k komşuyu bul
    const kNearest = knn.rows.slice(0, kValue.value);
    
    // K en yakın komşu açıklaması
    log.push(`<b>Adım 3:</b> En yakın ${kValue.value} komşuyu seç:`);
    log.push(`En yakın ${kValue.value} komşu: ${kNearest.map(row => `Satır ${row.id} (Mesafe: ${row.distance.toFixed(2)})`).join(', ')}`);

    // Hedef sütun kararı
    if (targetColumn.value) {
      const targetColumnIndex = table.columns.indexOf(targetColumn.value);
      
      const targetValueCounts = {};
      kNearest.forEach(row => {
        const targetValue = row.values[targetColumnIndex];
        targetValueCounts[targetValue] = (targetValueCounts[targetValue] || 0) + 1;
      });
      
      // En çok tekrar eden hedef değerini bul
      let maxTargetValue = null;
      let maxCount = 0;
      
      log.push(`<b>Adım 4:</b> Hedef değerleri sayımı yapılıyor:`);
      for (const [targetValue, count] of Object.entries(targetValueCounts)) {
        log.push(`${targetValue}: ${count} adet`);
        if (count > maxCount) {
          maxCount = count;
          maxTargetValue = targetValue;
        }
      }
      
      log.push(`<b>Sonuç:</b> Girilen örnek için "${targetColumn.value}" değeri "${maxTargetValue}" olarak tahmin edilmiştir.`);
      
      // Sonuç değerini ayarla
      result.value = {
        targetColumn: targetColumn.value,
        predictedValue: maxTargetValue,
        counts: targetValueCounts
      };
    }

    calculated.value = true; // Hesaplama bayrağını ayarla
    
    // MathJax'ı tetikle
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
      <h1 class="text-xl font-bold mb-2">KNN (K-En Yakın Komşu) Sınıflandırıcı</h1>
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 class="text-md font-semibold mb-2">K-En Yakın Komşu Algoritması:</h4>
        <p class="mb-2">KNN, bir veri noktasının sınıfını, eğitim kümesindeki en yakın k komşusuna bakarak tahmin eden bir sınıflandırma algoritmasıdır.</p>
        <p><strong>Algoritma Adımları:</strong></p>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Yeni veri noktası ile tüm eğitim verisi arasındaki uzaklıkları hesapla</li>
          <li>En yakın K komşuyu bul</li>
          <li>Bu K komşu arasında en çok hangi sınıf varsa, yeni veri o sınıfa atanır</li>
        </ol>
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
      <h2 class="text-lg font-semibold mb-2">Veri Yapısı Oluştur</h2>
      <form @submit.prevent="addNewColumn" class="flex gap-4 mb-4">
        <input v-model="newColumnName" placeholder="Yeni sütun adı" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Sütun Ekle
        </button>
      </form>
    </div>
    
    <!-- Hedef Sütun Seçimi -->
    <div v-if="table.columns.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Hedef Sütun Seçimi</h2>
      <div class="flex flex-col space-y-2">
        <p class="text-sm text-gray-700">Tahmin etmek istediğiniz hedef sütunu seçin. Bu sütun mesafe hesaplamalarına dahil edilmeyecektir.</p>
        <div class="flex gap-4 items-center">
          <select v-model="targetColumn" class="p-2 border rounded shadow-sm w-full">
            <option value="">Hedef sütun seçin</option>
            <option v-for="column in table.columns" :key="column" :value="column">
              {{ column }}
            </option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Değer Ekleme Formu -->
    <div v-if="table.columns.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Veri Noktası Ekle</h2>
      <form @submit.prevent="addNewValues" class="flex gap-4 mb-4">
        <input v-model="newValues" placeholder="Değerler (virgülle ayrılmış, tüm sütunlar için)" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Değer Ekle
        </button>
      </form>
      <p class="text-xs text-gray-500">Örnek: {{ table.columns.join(', ') }} için değerleri virgülle ayırarak giriniz</p>
    </div>

    <!-- Dinamik Tablo -->
    <div v-if="table.columns.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Veri Tablosu</h2>
      <div class="overflow-x-auto">
        <table class="table-auto w-full text-left whitespace-no-wrap">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th class="px-4 py-2">ID</th>
              <th v-for="(column, index) in table.columns" :key="column" class="px-4 py-2"
                  :class="{'bg-yellow-100': column === targetColumn}">
                {{ column }}
                <span v-if="column === targetColumn" class="ml-1 text-yellow-600">(Hedef)</span>
                <button @click="removeColumn(index)" class="ml-2 bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                  <span><i class="fas fa-trash-can"></i></span>
                </button>
              </th>
              <th class="px-4 py-2">İşlem</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="(row, index) in knn.rows" :key="row.id">
              <td class="px-4 py-2">{{ row.id }}</td>
              <td v-for="(value, valueIndex) in row.values" :key="valueIndex" class="px-4 py-2"
                  :class="{'bg-yellow-50': table.columns[valueIndex] === targetColumn}">
                {{ value }}
              </td>
              <td class="px-4 py-2">
                <button @click="removeRow(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                  <span><i class="fas fa-trash-can"></i></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- KNN Hesaplama Bölümü -->
    <div v-if="table.columns.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">KNN Hesaplama</h2>
      <form @submit.prevent="calculateKNN">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div v-for="column in table.columns" :key="column" class="flex flex-col" 
               v-show="column !== targetColumn">
            <label :for="`input-${column}`" class="mb-2">{{ column }} değeri:</label>
            <input v-model="knnInput[column]" :id="`input-${column}`" type="text" class="p-2 border rounded shadow-sm" placeholder="Değer" />
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label for="k-value" class="block mb-2">K Değeri:</label>
            <input v-model.number="kValue" id="k-value" type="number" min="1" :max="knn.rows.length" class="p-2 border rounded shadow-sm w-full" />
            <p class="text-xs text-gray-500 mt-1">En yakın kaç komşuya bakılacak (1-{{ knn.rows.length }})</p>
          </div>
          <div>
            <label for="distance-type" class="block mb-2">Uzaklık Metriği:</label>
            <select v-model="distanceType" id="distance-type" class="p-2 border rounded shadow-sm w-full">
              <option value="euclidean">Öklid Uzaklığı</option>
              <option value="manhattan">Manhattan Uzaklığı</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Veri noktaları arasındaki uzaklık nasıl hesaplanacak</p>
          </div>
        </div>
        
        <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full md:w-auto" 
                :disabled="!targetColumn">
          KNN Hesapla
        </button>
        <p v-if="!targetColumn" class="text-xs text-red-500 mt-1">Lütfen önce bir hedef sütun seçin</p>
      </form>
    </div>

    <!-- Sonuçlar -->
    <div v-if="calculated" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-4">Hesaplama Sonuçları (K = {{ kValue }})</h2>
      
      <!-- Tahmin Sonucu -->
      <div v-if="result" class="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
        <h3 class="font-medium text-green-700 mb-2">Tahmin Sonucu:</h3>
        <div class="text-2xl font-bold">{{ result.predictedValue }}</div>
        <p class="text-sm text-gray-600 mt-2">{{ result.targetColumn }} için tahmini değer</p>
      </div>
      
      <!-- Matematiksel açıklama -->
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 class="text-md font-semibold mb-2">Kullanılan Uzaklık Metriği:</h4>
        <p v-if="distanceType === 'euclidean'" class="mb-2">
          <strong>Öklid Uzaklığı:</strong> \(d(x, y) = \sqrt{\sum_{i=1}^{n} (x_i - y_i)^2}\)
        </p>
        <p v-else class="mb-2">
          <strong>Manhattan Uzaklığı:</strong> \(d(x, y) = \sum_{i=1}^{n} |x_i - y_i|\)
        </p>
        <p class="text-sm text-gray-600 mt-2">Not: Hedef sütun ({{ targetColumn }}) uzaklık hesaplamasına dahil edilmemiştir.</p>
      </div>
      
      <!-- Uzaklık Tablosu -->
      <h3 class="font-medium mb-2">Hesaplanan Uzaklıklar (En Yakından En Uzağa):</h3>
      <div class="overflow-x-auto mb-4">
        <table class="table-auto w-full text-left whitespace-no-wrap">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th class="px-4 py-2">ID</th>
              <th class="px-4 py-2">Uzaklık</th>
              <th v-for="column in table.columns" :key="column" class="px-4 py-2"
                  :class="{'bg-yellow-100': column === targetColumn}">
                {{ column }}
                <span v-if="column === targetColumn" class="ml-1 text-yellow-600">(Hedef)</span>
              </th>
              <th class="px-4 py-2">K-NN Sonucu</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="(row, rowIndex) in knn.rows" :key="row.id" :class="{ 'bg-green-100': rowIndex < kValue }">
              <td class="px-4 py-2">{{ row.id }}</td>
              <td class="px-4 py-2">{{ row.distance.toFixed(2) }}</td>
              <td v-for="(value, valueIndex) in row.values" :key="valueIndex" class="px-4 py-2"
                  :class="{'bg-yellow-50': table.columns[valueIndex] === targetColumn}">
                {{ value }}
              </td>
              <td class="px-4 py-2">
                <span v-if="rowIndex < kValue" class="px-2 py-1 bg-green-500 text-white rounded text-xs">K-NN Komşusu</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Hesaplama Adımları -->
      <h3 class="font-medium mb-2">Hesaplama Adımları:</h3>
      <div class="bg-gray-50 p-4 rounded-lg">
        <ul class="list-decimal pl-5">
          <li v-for="(item, index) in log" :key="index" v-html="item" class="py-1"></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styling kısmı için mevcut stillemeler otomatik uygulanır */
</style>