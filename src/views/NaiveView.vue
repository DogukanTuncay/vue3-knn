<template>
  <div class="max-w-4xl mx-auto py-8 space-y-8">
    <!-- Başlık ve Açıklama -->
    <div>
      <h1 class="text-xl font-bold mb-2">Naive Bayes Sınıflandırıcı</h1>
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 class="text-md font-semibold mb-2">Naive Bayes Algoritması:</h4>
        <p class="mb-2">Naive Bayes, olasılık teorisine dayalı bir sınıflandırma algoritmasıdır. Bayes teoremini kullanarak, özelliklerin birbirinden bağımsız olduğu varsayımı altında sınıflandırma yapar.</p>
        <p class="mb-2"><strong>Bayes Teoremi:</strong> \(P(Y|X) = \frac{P(X|Y) \cdot P(Y)}{P(X)}\)</p>
        <p class="mb-2"><strong>Naive Bayes:</strong> \(P(Y|X_1,X_2,...,X_n) \propto P(Y) \cdot \prod_{i=1}^{n} P(X_i|Y)\)</p>
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

    <!-- Özellik Ekleme Formu -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Özellik Ekle</h2>
      <form @submit.prevent="insertFeature" class="flex gap-4 mb-4">
        <input id="newFeature" placeholder="Yeni özellik adı" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Özellik Ekle
        </button>
      </form>
    </div>

    <!-- Mevcut Özellikler -->
    <div v-if="features.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Özellikler</h2>
      <div class="flex flex-wrap gap-2">
        <div v-for="feature in features" :key="feature" class="bg-gray-100 rounded-lg p-2 flex items-center">
          <span class="mr-2">{{ feature }}</span>
          <button @click="removeFeature(feature)" class="text-red-500 hover:text-red-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Veri Ekleme Formu - Dropdown ve yeni değer ekleme seçeneği ile -->
    <div v-if="features.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Veri Ekle</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div v-for="feature in features" :key="feature" class="flex flex-col">
          <label :for="`select-${feature}`" class="mb-2">{{ feature }}:</label>
          <div class="space-y-2">
            <!-- Dropdown seçim alanı -->
            <div v-if="!addingNewValues[feature]">
              <select 
                v-model="newRowFeature[feature]" 
                :id="`select-${feature}`" 
                class="p-2 border rounded shadow-sm w-full"
              >
                <option value="">Seçiniz...</option>
                <option v-for="value in Array.from(featuresTypes[feature] || [])" :key="value" :value="value">
                  {{ value }}
                </option>
              </select>
              <button 
                @click="toggleNewValueMode(feature)" 
                type="button" 
                class="mt-1 text-blue-600 hover:text-blue-800 text-sm"
              >
                Yeni değer ekle
              </button>
            </div>
            
            <!-- Yeni değer ekleme alanı -->
            <div v-else class="flex gap-2">
              <input 
                v-model="newFeatureValue[feature]" 
                :placeholder="`Yeni ${feature} değeri`" 
                class="p-2 border rounded shadow-sm w-full"
              />
              <button 
                @click="addNewFeatureValue(feature)" 
                type="button" 
                class="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded"
              >
                Ekle
              </button>
              <button 
                @click="toggleNewValueMode(feature)" 
                type="button" 
                class="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-3 rounded"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      </div>
      <button @click="insertRow" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        Veri Satırı Ekle
      </button>
    </div>

    <!-- Veri Tablosu -->
    <div v-if="data.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Veri Tablosu</h2>
      <div class="overflow-x-auto">
        <table class="table-auto w-full text-left whitespace-no-wrap">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th class="px-4 py-2">#</th>
              <th v-for="feature in features" :key="feature" class="px-4 py-2">{{ feature }}</th>
              <th class="px-4 py-2">İşlemler</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="(row, index) in data" :key="index">
              <td class="px-4 py-2">{{ index + 1 }}</td>
              <td v-for="feature in features" :key="feature" class="px-4 py-2">
                {{ row[feature] }}
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

    <!-- Naive Bayes Hesaplama Bölümü - Dropdown ile tahmin değerleri -->
    <div v-if="features.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Naive Bayes Hesaplama</h2>
      
      <!-- Sınıf Seçimi -->
      <div class="mb-4">
        <label for="class-selection" class="block mb-2">Hedef Sınıf Seçin:</label>
        <select v-model="selectedClass" id="class-selection" class="p-2 border rounded shadow-sm w-full">
          <option value="">Seçiniz...</option>
          <option v-for="feature in features" :key="feature" :value="feature">{{ feature }}</option>
        </select>
      </div>
      
      <!-- Tahmin Edilecek Değerler - Dropdown seçimli -->
      <div class="mb-4">
        <h3 class="font-medium mb-2">Tahmin Edilecek Değerler:</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div v-for="feature in features.filter(f => f !== selectedClass)" :key="feature" class="flex flex-col">
            <label :for="`predict-${feature}`" class="mb-2">{{ feature }}:</label>
            <select 
              v-model="newRowFeature[feature]" 
              :id="`predict-${feature}`" 
              class="p-2 border rounded shadow-sm w-full"
            >
              <option value="">Seçiniz...</option>
              <option v-for="value in Array.from(featuresTypes[feature] || [])" :key="value" :value="value">
                {{ value }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
      <button @click="calculateRatios" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full md:w-auto" :disabled="!selectedClass">
        Naive Bayes ile Tahmin Yap
      </button>
    </div>

    <!-- Sonuçlar -->
    <div v-if="result" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-4">Hesaplama Sonuçları</h2>
      
      <!-- Tahmin Sonucu -->
      <div class="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
        <h3 class="font-medium text-green-700 mb-2">Tahmin Edilen Sınıf:</h3>
        <div class="text-2xl font-bold">{{ result.prediction }}</div>
        <p class="text-sm text-gray-600 mt-2">Olasılık: %{{ (result.posteriors[result.prediction] * 100).toFixed(2) }}</p>
      </div>
      
      <!-- Tüm Sınıf Olasılıkları -->
      <div v-if="result.posteriors" class="mb-4">
        <h3 class="font-medium mb-2">Sınıf Olasılıkları:</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="(prob, classValue) in result.posteriors" :key="classValue" class="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p class="font-medium">{{ classValue }}:</p>
            <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div class="bg-blue-600 h-2.5 rounded-full" :style="{ width: `${prob * 100}%` }"></div>
            </div>
            <p class="text-sm text-gray-600">%{{ (prob * 100).toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hesaplama Adımları -->
    <div v-if="log.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Hesaplama Adımları</h2>
      <div class="bg-gray-50 p-4 rounded-lg">
        <ul class="list-none space-y-2">
          <li v-for="(step, index) in log" :key="index" class="py-1" v-html="step"></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';

const data = reactive([]);
const features = ref([]);
const featuresTypes = ref({});
const newRowFeature = ref({});
const result = ref(null);
const selectedClass = ref('');
const log = ref([]);

// Yeni değer ekleme modunu takip etmek için değişken
const addingNewValues = reactive({});
const newFeatureValue = reactive({});

// Örnek veri seti
const sampleData = {
  features: ['Hava Durumu', 'Sıcaklık', 'Nem', 'Rüzgar', 'OyunOynama'],
  data: [
    { 'Hava Durumu': 'Güneşli', 'Sıcaklık': 'Sıcak', 'Nem': 'Yüksek', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Hayır' },
    { 'Hava Durumu': 'Güneşli', 'Sıcaklık': 'Sıcak', 'Nem': 'Yüksek', 'Rüzgar': 'Güçlü', 'OyunOynama': 'Hayır' },
    { 'Hava Durumu': 'Bulutlu', 'Sıcaklık': 'Sıcak', 'Nem': 'Yüksek', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Yağmurlu', 'Sıcaklık': 'Ilık', 'Nem': 'Yüksek', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Yağmurlu', 'Sıcaklık': 'Soğuk', 'Nem': 'Normal', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Yağmurlu', 'Sıcaklık': 'Soğuk', 'Nem': 'Normal', 'Rüzgar': 'Güçlü', 'OyunOynama': 'Hayır' },
    { 'Hava Durumu': 'Bulutlu', 'Sıcaklık': 'Soğuk', 'Nem': 'Normal', 'Rüzgar': 'Güçlü', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Güneşli', 'Sıcaklık': 'Ilık', 'Nem': 'Yüksek', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Hayır' },
    { 'Hava Durumu': 'Güneşli', 'Sıcaklık': 'Soğuk', 'Nem': 'Normal', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Yağmurlu', 'Sıcaklık': 'Ilık', 'Nem': 'Normal', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Güneşli', 'Sıcaklık': 'Ilık', 'Nem': 'Normal', 'Rüzgar': 'Güçlü', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Bulutlu', 'Sıcaklık': 'Ilık', 'Nem': 'Yüksek', 'Rüzgar': 'Güçlü', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Bulutlu', 'Sıcaklık': 'Sıcak', 'Nem': 'Normal', 'Rüzgar': 'Zayıf', 'OyunOynama': 'Evet' },
    { 'Hava Durumu': 'Yağmurlu', 'Sıcaklık': 'Ilık', 'Nem': 'Yüksek', 'Rüzgar': 'Güçlü', 'OyunOynama': 'Hayır' }
  ],
  targetFeature: 'OyunOynama'
};

// Sayfa yüklendiğinde örnek veriyi yükle
onMounted(() => {
  loadSampleData();
});

const loadSampleData = () => {
  // Özellikleri ayarla
  features.value = [...sampleData.features];
  
  // Hedef özelliği seç
  selectedClass.value = sampleData.targetFeature;
  
  // Veriyi ekle
  data.length = 0;
  sampleData.data.forEach(item => {
    data.push({...item});
  });
  
  // Özellik tiplerini belirle
  updateFeatureTypes();

  // Yeni değer ekleme modlarını sıfırla
  features.value.forEach(feature => {
    addingNewValues[feature] = false;
    newFeatureValue[feature] = '';
  });
};

const clearData = () => {
  features.value = [];
  data.length = 0;
  featuresTypes.value = {};
  newRowFeature.value = {};
  result.value = null;
  selectedClass.value = '';
  log.value = [];
  
  // Yeni değer ekleme modlarını sıfırla
  Object.keys(addingNewValues).forEach(key => {
    addingNewValues[key] = false;
    newFeatureValue[key] = '';
  });
};

// Kullanıcıdan özellikleri al ve ekle
const insertFeature = () => {
  const feature = document.getElementById("newFeature").value;
  if (feature && !features.value.includes(feature)) {
    features.value.push(feature);
    featuresTypes.value[feature] = new Set();
    addingNewValues[feature] = false;
    newFeatureValue[feature] = '';
    document.getElementById("newFeature").value = "";
  }
};

// Yeni özellik değeri ekleme modunu aç
const toggleNewValueMode = (feature) => {
  addingNewValues[feature] = !addingNewValues[feature];
  newFeatureValue[feature] = '';
};

// Özelliğe yeni değer ekle
const addNewFeatureValue = (feature) => {
  if (newFeatureValue[feature] && !featuresTypes.value[feature].has(newFeatureValue[feature])) {
    featuresTypes.value[feature].add(newFeatureValue[feature]);
    newRowFeature.value[feature] = newFeatureValue[feature];
    newFeatureValue[feature] = '';
    addingNewValues[feature] = false;
  }
};

// Kullanıcıdan yeni bir satır eklemesini iste
const insertRow = () => {
  // Tüm özellikler için değer girilmiş mi kontrol et
  if (!features.value.every(feature => newRowFeature.value[feature])) {
    alert("Lütfen tüm özellikleri doldurun");
    return;
  }
  
  data.push({...newRowFeature.value});
  // Yeni satırda kullanılan değerleri temizleme (opsiyonel)
  // newRowFeature.value = {};
};

// Özellik türlerini güncelle
const updateFeatureTypes = () => {
  features.value.forEach(feature => {
    if (!featuresTypes.value[feature]) {
      featuresTypes.value[feature] = new Set();
    }
  });
  
  // Her veri satırı için özelliklerin olası değerlerini belirle
  data.forEach(row => {
    features.value.forEach(feature => {
      if (row[feature]) {
        featuresTypes.value[feature].add(row[feature]);
      }
    });
  });
};

// Satır silme
const removeRow = (index) => {
  data.splice(index, 1);
  updateFeatureTypes();
};

// Özellik silme
const removeFeature = (feature) => {
  features.value = features.value.filter(f => f !== feature);
  delete featuresTypes.value[feature];
  delete addingNewValues[feature];
  delete newFeatureValue[feature];
  
  // Veri satırlarından da özelliği sil
  data.forEach(row => {
    delete row[feature];
  });
  
  // Eğer silinmiş özellik, sınıf özelliğiyse sınıf seçimini sıfırla
  if (selectedClass.value === feature) {
    selectedClass.value = '';
  }
};

// Naive Bayes algoritmasını uygula
const calculateRatios = () => {
  if (!selectedClass.value) {
    alert("Lütfen bir sınıf özelliği seçin");
    return;
  }
  
  result.value = null;
  log.value = [];
  
  // Sınıf değerlerini topla
  const classValues = Array.from(featuresTypes.value[selectedClass.value] || []);
  
  if (classValues.length === 0) {
    alert("Seçilen sınıf özelliği için değer bulunamadı");
    return;
  }
  
  log.value.push(`<b>Naive Bayes Algoritması Başlatılıyor</b>`);
  log.value.push(`Hedef Sınıf: ${selectedClass.value}`);
  log.value.push(`Olası Sınıf Değerleri: ${classValues.join(', ')}`);
  log.value.push(`<b>Adım 1:</b> Önsel olasılıkları (prior) hesaplama`);
  
  // Önsel olasılıkları hesapla - P(Class)
  const classCounts = {};
  const priors = {};
  
  // Sınıf değerlerinin sayılarını hesapla
  data.forEach(row => {
    const classValue = row[selectedClass.value];
    classCounts[classValue] = (classCounts[classValue] || 0) + 1;
  });
  
  // Önsel olasılıkları hesapla
  classValues.forEach(classValue => {
    priors[classValue] = classCounts[classValue] / data.length;
    log.value.push(`P(${selectedClass.value}=${classValue}) = ${classCounts[classValue]}/${data.length} = ${priors[classValue].toFixed(4)}`);
  });
  
  log.value.push(`<b>Adım 2:</b> Koşullu olasılıkları hesaplama`);
  
  // Koşullu olasılıkları hesapla - P(Feature|Class)
  const conditionalProbs = {};
  
  // Kullanıcı girdisine göre koşullu olasılıkları hesapla
  const userInput = {...newRowFeature.value};
  
  // Sınıf özelliği dışındaki özellikler için
  features.value.filter(feature => feature !== selectedClass.value).forEach(feature => {
    // Kullanıcının bu özellik için girdiği değer
    const featureValue = userInput[feature];
    
    if (!featureValue) {
      return; // Eğer bu özellik için değer girilmemişse atla
    }
    
    conditionalProbs[feature] = {};
    
    classValues.forEach(classValue => {
      // Bu sınıf değeri için toplam kayıt sayısı
      const totalForClass = classCounts[classValue];
      
      // Bu sınıf değeri ve özellik değeri için kayıt sayısı
      let countForFeatureAndClass = 0;
      
      data.forEach(row => {
        if (row[selectedClass.value] === classValue && row[feature] === featureValue) {
          countForFeatureAndClass++;
        }
      });
      
      // Laplace düzeltmesi (Laplace smoothing) uygula (0 olasılık sorununu önlemek için)
      const featureTypes = Array.from(featuresTypes.value[feature] || []);
      const laplaceSmoothingValue = 1; // Genellikle 1 kullanılır
      
      const condProb = (countForFeatureAndClass + laplaceSmoothingValue) / 
                       (totalForClass + laplaceSmoothingValue * featureTypes.length);
      
      conditionalProbs[feature][classValue] = condProb;
      
      log.value.push(`P(${feature}=${featureValue} | ${selectedClass.value}=${classValue}) = (${countForFeatureAndClass} + ${laplaceSmoothingValue})/(${totalForClass} + ${laplaceSmoothingValue * featureTypes.length}) = ${condProb.toFixed(4)}`);
    });
  });
  
  log.value.push(`<b>Adım 3:</b> Sonraki olasılıkları (posterior) hesaplanıyor`);
  
  // Sonuçları hesapla - P(Class|Features) ∝ P(Class) * ∏ P(Feature|Class)
  const posteriors = {};
  let normalizationFactor = 0;
  
  classValues.forEach(classValue => {
    // P(Class)
    let posterior = priors[classValue];
    let posteriorFormula = `P(${classValue}) = ${priors[classValue].toFixed(4)}`;
    
    // ∏ P(Feature|Class)
    features.value.filter(feature => feature !== selectedClass.value).forEach(feature => {
      const featureValue = userInput[feature];
      
      if (featureValue && conditionalProbs[feature] && conditionalProbs[feature][classValue]) {
        posterior *= conditionalProbs[feature][classValue];
        posteriorFormula += ` × P(${feature}=${featureValue}|${classValue}) = ${conditionalProbs[feature][classValue].toFixed(4)}`;
      }
    });
    
    posteriors[classValue] = posterior;
    normalizationFactor += posterior;
    
    log.value.push(`P(${selectedClass.value}=${classValue} | Girilen Özellikler) ∝ ${posteriorFormula} = ${posterior.toFixed(6)}`);
  });
  
  // Olasılıkları normalize et
  classValues.forEach(classValue => {
    posteriors[classValue] /= normalizationFactor;
  });
  
  log.value.push(`<b>Adım 4:</b> Olasılıkları normalize etme`);
  log.value.push(`Normalizasyon faktörü: ${normalizationFactor.toFixed(6)}`);
  
  classValues.forEach(classValue => {
    log.value.push(`P(${selectedClass.value}=${classValue} | Girilen Özellikler) = ${posteriors[classValue].toFixed(6)} = %${(posteriors[classValue] * 100).toFixed(2)}`);
  });
  
  // En yüksek olasılıklı sınıfı bul
  let highestProbClassValue = classValues[0];
  classValues.forEach(classValue => {
    if (posteriors[classValue] > posteriors[highestProbClassValue]) {
      highestProbClassValue = classValue;
    }
  });
  
  log.value.push(`<b>Sonuç:</b> Girilen özelliklere göre en olası sınıf değeri: <strong>${highestProbClassValue}</strong> (%${(posteriors[highestProbClassValue] * 100).toFixed(2)})`);
  
  // Sonuçları kaydet
  result.value = {
    priors,
    conditionalProbs,
    posteriors,
    prediction: highestProbClassValue
  };
};
</script>

<style scoped>
/* Styling kısmı için mevcut stillemeler otomatik uygulanır */
</style>
