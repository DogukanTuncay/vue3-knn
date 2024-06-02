<script setup>
import { ref } from 'vue';

const newTransaction = ref('');
const transactions = ref([]);
const frequentItemSets = ref([]);
const minSupport = ref(0.5);
function addTransaction() {
  // Kullanıcının girdiğini boşluk veya virgülle ayırarak diziye dönüştür
  // Öğeleri küçük harfe çevir ve her öğenin ilk harfini büyüt
  const items = newTransaction.value.split(/[\s,]+/)
                .filter(Boolean)
                .map(item => item.toLowerCase())
                .map(item => item.charAt(0).toUpperCase() + item.slice(1));
  
  if (items.length) {
    transactions.value.push(items);
    newTransaction.value = ''; // İnput alanını temizle
  }
}
function calculateCombinations() {
  const itemCounts = {}; // Her öğenin kaç işlemde geçtiğini tutacak
  const itemPairs = {}; // İki öğenin birlikte kaç işlemde geçtiğini tutacak
  const totalTransactions = transactions.value.length;
  const minSupportThreshold = minSupport.value;

  // Her işlemde geçen öğeleri say
  transactions.value.forEach(transaction => {
    transaction.forEach((item, _, array) => {
      itemCounts[item] = (itemCounts[item] || 0) + 1;

      // İki öğenin birlikte geçme sayısını hesapla
      array.forEach(subItem => {
        if (item !== subItem) {
          const pair = [item, subItem].sort().join(', ');
          itemPairs[pair] = (itemPairs[pair] || 0) + 1;
        }
      });
    });
  });

  // Minimum destek eşiği üstündeki öğeleri ve öğe çiftlerini filtrele
  const frequentItems = Object.entries(itemCounts).filter(([_, count]) => count / totalTransactions >= minSupportThreshold).map(([item]) => item);
  const frequentPairs = Object.entries(itemPairs).filter(([_, count]) => count / totalTransactions >= minSupportThreshold).map(([pair]) => pair.split(', '));

  // Sonuçları birleştir ve göster
  frequentItemSets.value = [...frequentItems.map(item => [item]), ...frequentPairs];
}

</script>

<template>
    <div class="max-w-4xl mx-auto p-6 space-y-4">
      <h1 class="text-xl font-bold">İşlem Kayıtları</h1>
        {{ transactions }}
<!-- Girdi Formu, @submit.prevent ile form gönderimini engelleme -->
<form @submit.prevent="addTransaction" class="mb-4">
      <label for="transaction" class="block text-sm font-medium text-gray-700">Yeni İşlem (Öğeleri boşluk veya virgül ile ayırın):</label>
      <div class="mt-1 flex">
        <input id="transaction" v-model="newTransaction" type="text" class="p-2 border rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md" placeholder="Öğe1, Öğe2, Öğe3...">
        <button type="submit" class="ml-2 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Ekle</button>
      </div>
    </form>
  
      <!-- İşlem Kayıtları Tablosu -->
      <div class="flex flex-col">
        <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem Kaydı</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(record, index) in transactions" :key="index">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <ul>
                        <li v-for="(item, i) in record" :key="i">{{ item }}</li>
                      </ul>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <!-- Hesapla Butonu -->
    <button @click="calculateCombinations" class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">Hesapla</button>
    
    <!-- Sık Öğe Setleri ve İhtimallerin Gösterimi -->
    <div v-if="frequentItemSets.length > 0" class="mt-6">
      <h2 class="text-lg font-semibold">Sık Öğe Setleri ve İhtimaller:</h2>
      <ul>
        <li v-for="(set, index) in frequentItemSets" :key="index">{{ set.join(', ') }} - {{ set.probability }}</li>
      </ul>
    </div>
    </div>
  </template>
  

  