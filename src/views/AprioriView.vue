<script setup>
import { ref, reactive, onMounted } from 'vue';

// İşlemler
const transactions = ref([]);
const newTransaction = ref('');
const minSupport = ref(0.2); // Minimum destek değeri (0.0-1.0 arasında)
const frequentItemsets = ref([]);
const log = ref([]);

// Örnek veri seti
const sampleData = {
  transactions: [
    'ekmek, süt, peynir',
    'ekmek, yumurta',
    'süt, peynir',
    'ekmek, süt, yoğurt',
    'ekmek, peynir',
    'yumurta, süt, yoğurt',
    'ekmek, yumurta, süt, peynir',
    'yumurta, süt'
  ],
  minSupport: 0.25
};

// Sayfa yüklendiğinde örnek veri yükle
onMounted(() => {
  loadSampleData();
});

const loadSampleData = () => {
  transactions.value = [...sampleData.transactions];
  minSupport.value = sampleData.minSupport;
  calculateFrequentItemsets();
};

const clearData = () => {
  transactions.value = [];
  newTransaction.value = '';
  minSupport.value = 0.2;
  frequentItemsets.value = [];
  log.value = [];
};

// Yeni işlem ekleme
const addTransaction = () => {
  if (newTransaction.value.trim()) {
    transactions.value.push(newTransaction.value.trim());
    newTransaction.value = '';
  }
};

// İşlemi kaldırma
const removeTransaction = (index) => {
  transactions.value.splice(index, 1);
};

// Sık öğe kümelerini hesaplama
const calculateFrequentItemsets = () => {
  frequentItemsets.value = [];
  log.value = [];
  
  if (transactions.value.length === 0) {
    alert('Lütfen önce işlem ekleyin.');
    return;
  }

  const parsedTransactions = transactions.value.map(transaction => 
    transaction.split(/,\s*/).map(item => item.trim().toLowerCase())
  );
  
  log.value.push(`<b>Apriori Algoritması Başlatılıyor</b>`);
  log.value.push(`Minimum Destek (Support): ${minSupport.value * 100}%`);
  log.value.push(`Toplam İşlem Sayısı: ${parsedTransactions.length}`);
  
  // Adım 1: Tekil öğelerin destek değerlerini hesapla
  log.value.push(`<b>Adım 1:</b> Tekil öğelerin destek değerlerini hesaplama`);
  
  const itemCounts = {};
  parsedTransactions.forEach(transaction => {
    transaction.forEach(item => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
  });
  
  const totalTransactions = parsedTransactions.length;
  
  // Destek hesaplama fonksiyonu
  const calculateSupport = (count) => {
    return count / totalTransactions;
  };
  
  // Tekil öğelerin destek değerleri
  const singleItemsWithSupport = {};
  Object.keys(itemCounts).forEach(item => {
    const support = calculateSupport(itemCounts[item]);
    singleItemsWithSupport[item] = support;
    log.value.push(`Öğe: "${item}" - Frekans: ${itemCounts[item]} - Destek: ${(support * 100).toFixed(2)}%`);
  });
  
  // Minimum destek değerini karşılayan tekil öğeler
  const frequentSingleItems = Object.keys(singleItemsWithSupport).filter(item => 
    singleItemsWithSupport[item] >= minSupport.value
  ).sort();
  
  log.value.push(`<b>Sonuç:</b> Sık Tekil Öğeler (L1): [${frequentSingleItems.join(', ')}]`);
  
  if (frequentSingleItems.length === 0) {
    log.value.push(`Minimum destek değerini karşılayan tekil öğe bulunamadı.`);
    return;
  }
  
  // Adım 2: İkili kombinasyonları oluştur ve destek değerlerini hesapla
  log.value.push(`<b>Adım 2:</b> İkili kombinasyonları oluşturma ve destek değerlerini hesaplama`);
  
  const pairs = [];
  for (let i = 0; i < frequentSingleItems.length; i++) {
    for (let j = i + 1; j < frequentSingleItems.length; j++) {
      pairs.push([frequentSingleItems[i], frequentSingleItems[j]]);
    }
  }
  
  const pairCounts = {};
  pairs.forEach(pair => {
    const pairKey = pair.join(',');
    pairCounts[pairKey] = 0;
    
    parsedTransactions.forEach(transaction => {
      if (pair.every(item => transaction.includes(item))) {
        pairCounts[pairKey]++;
      }
    });
  });
  
  const pairsWithSupport = {};
  Object.keys(pairCounts).forEach(pairKey => {
    const support = calculateSupport(pairCounts[pairKey]);
    pairsWithSupport[pairKey] = support;
    const pair = pairKey.split(',');
    log.value.push(`İkili: {${pair.join(', ')}} - Frekans: ${pairCounts[pairKey]} - Destek: ${(support * 100).toFixed(2)}%`);
  });
  
  // Minimum destek değerini karşılayan ikili öğeler
  const frequentPairs = Object.keys(pairsWithSupport).filter(pairKey => 
    pairsWithSupport[pairKey] >= minSupport.value
  );
  
  if (frequentPairs.length === 0) {
    log.value.push(`Minimum destek değerini karşılayan ikili öğe bulunamadı.`);
    
    // Tekil öğeleri ekle
    frequentSingleItems.forEach(item => {
      frequentItemsets.value.push({
        items: [item],
        support: singleItemsWithSupport[item],
        supportPercent: (singleItemsWithSupport[item] * 100).toFixed(2)
      });
    });
    
    return;
  }
  
  log.value.push(`<b>Sonuç:</b> Sık İkili Öğeler (L2):`);
  frequentPairs.forEach(pairKey => {
    const pair = pairKey.split(',');
    log.value.push(`{${pair.join(', ')}} - Destek: ${(pairsWithSupport[pairKey] * 100).toFixed(2)}%`);
  });
  
  // Sonuçları kaydet
  // Tekil öğeleri ekle
  frequentSingleItems.forEach(item => {
    frequentItemsets.value.push({
      items: [item],
      support: singleItemsWithSupport[item],
      supportPercent: (singleItemsWithSupport[item] * 100).toFixed(2)
    });
  });
  
  // İkili öğeleri ekle
  frequentPairs.forEach(pairKey => {
    const pair = pairKey.split(',');
    frequentItemsets.value.push({
      items: pair,
      support: pairsWithSupport[pairKey],
      supportPercent: (pairsWithSupport[pairKey] * 100).toFixed(2)
    });
  });
  
  // Büyükten küçüğe sırala
  frequentItemsets.value.sort((a, b) => b.support - a.support);
  
  // Adım 3: Birliktelik kurallarını oluştur (opsiyonel)
  log.value.push(`<b>Adım 3:</b> Birliktelik kurallarını oluşturma`);
  
  const associationRules = [];
  
  // Sadece ikili öğe kümeleri için kuralları oluştur
  frequentPairs.forEach(pairKey => {
    const pair = pairKey.split(',');
    const pairSupport = pairsWithSupport[pairKey];
    
    // A -> B kuralı
    const confidenceAB = pairSupport / singleItemsWithSupport[pair[0]];
    associationRules.push({
      antecedent: [pair[0]],
      consequent: [pair[1]],
      support: pairSupport,
      confidence: confidenceAB
    });
    
    // B -> A kuralı
    const confidenceBA = pairSupport / singleItemsWithSupport[pair[1]];
    associationRules.push({
      antecedent: [pair[1]],
      consequent: [pair[0]],
      support: pairSupport,
      confidence: confidenceBA
    });
  });
  
  // Güven değeri yüksekten düşüğe sırala
  associationRules.sort((a, b) => b.confidence - a.confidence);
  
  // En yüksek güvenli 5 kuralı göster
  const topRules = associationRules.slice(0, 5);
  
  log.value.push(`<b>Sonuç:</b> En Yüksek Güvenli Birliktelik Kuralları:`);
  topRules.forEach(rule => {
    log.value.push(`${rule.antecedent.join(', ')} -> ${rule.consequent.join(', ')} (Destek: ${(rule.support * 100).toFixed(2)}%, Güven: ${(rule.confidence * 100).toFixed(2)}%)`);
  });
};
</script>

<template>
  <div class="max-w-4xl mx-auto py-8 space-y-8">
    <!-- Başlık ve Açıklama -->
    <div>
      <h1 class="text-xl font-bold mb-2">Apriori Algoritması</h1>
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 class="text-md font-semibold mb-2">Birliktelik Kuralları Analizi:</h4>
        <p class="mb-2">Apriori, alışveriş sepeti analizi gibi işlemlerde sık öğe kümelerini ve bunlar arasındaki birliktelik kurallarını bulan bir veri madenciliği algoritmasıdır.</p>
        <p class="mb-2"><strong>Destek (Support):</strong> Bir öğe kümesinin tüm işlemlerde görülme oranı. \(support(X) = \frac{X \text{ içeren işlem sayısı}}{\text{Toplam işlem sayısı}}\)</p>
        <p class="mb-2"><strong>Güven (Confidence):</strong> X öğe kümesi alındığında Y öğe kümesinin de alınma olasılığı. \(confidence(X \Rightarrow Y) = \frac{support(X \cup Y)}{support(X)}\)</p>
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
    
    <!-- İşlem Ekleme Formu -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">İşlem Ekle</h2>
      <form @submit.prevent="addTransaction" class="flex gap-4 mb-4">
        <input v-model="newTransaction" placeholder="Öğeler (virgülle ayrılmış)" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          İşlem Ekle
        </button>
      </form>
      <p class="text-xs text-gray-500">Örnek: ekmek, süt, peynir</p>
    </div>

    <!-- İşlemler Tablosu -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">İşlemler</h2>
      <div class="overflow-x-auto">
        <table class="table-auto w-full text-left whitespace-no-wrap">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th class="px-4 py-2">ID</th>
              <th class="px-4 py-2">İşlem Öğeleri</th>
              <th class="px-4 py-2">İşlemler</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="(transaction, index) in transactions" :key="index">
              <td class="px-4 py-2">{{ index + 1 }}</td>
              <td class="px-4 py-2">{{ transaction }}</td>
              <td class="px-4 py-2">
                <button @click="removeTransaction(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">
                  <span><i class="fas fa-trash-can"></i></span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Apriori Parametreleri -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Hesaplama Parametreleri</h2>
      <div class="flex flex-col mb-4">
        <label for="min-support" class="mb-2">Minimum Destek Değeri:</label>
        <div class="flex items-center gap-4">
          <input v-model.number="minSupport" id="min-support" type="range" min="0" max="1" step="0.05" class="w-full" />
          <span class="text-lg">{{ (minSupport * 100).toFixed(0) }}%</span>
        </div>
        <p class="text-xs text-gray-500 mt-1">Sık öğe kümeleri için gereken minimum destek eşiği</p>
      </div>
      
      <button @click="calculateFrequentItemsets" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded w-full md:w-auto">
        Apriori Algoritmasını Çalıştır
      </button>
    </div>

    <!-- Sonuçlar -->
    <div v-if="frequentItemsets.length > 0" class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-4">Hesaplama Sonuçları</h2>
      
      <!-- Sık Öğe Kümeleri -->
      <h3 class="font-medium mb-2">Sık Öğe Kümeleri (Destek Değerine Göre):</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div v-for="(itemset, index) in frequentItemsets" :key="index" class="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p class="font-medium">{{ itemset.items.length > 1 ? '{' + itemset.items.join(', ') + '}' : itemset.items[0] }}</p>
          <p class="text-sm text-gray-600">Destek: {{ itemset.supportPercent }}%</p>
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

<style scoped>
/* Styling kısmı için mevcut stillemeler otomatik uygulanır */
</style>
  

  