<script setup>
import { reactive, ref, nextTick, onMounted } from 'vue';

const points = reactive([]);
const clusters = reactive([]);
const memberships = reactive([]);
const newPoint = reactive({ x: '', y: '' });
const newCluster = ref('');
const m = ref(2); // Bulanıklık parametresi, genellikle 2 alınır.
const epsilon = ref(0.01); // Durdurma kriteri
const iterationLogs = reactive([]);
const membershipLogs = reactive([]);
const detailedLogs = reactive([]);
const distanceLogs = reactive([]); // Mesafe logları

// Örnek veri seti
const sampleData = {
  points: [
    { x: 2, y: 3 },
    { x: 5, y: 7 },
    { x: 1, y: 2 },
    { x: 8, y: 1 },
    { x: 7, y: 3 },
    { x: 9, y: 2 },
    { x: 6, y: 8 },
    { x: 3, y: 6 },
    { x: 4, y: 9 }
  ],
  clusters: 3,
  m: 2,
  iterations: 3,
  distanceMetric: 'euclidean'
};

const addPoint = () => {
  if (newPoint.x && newPoint.y) {
    points.push({ x: parseFloat(newPoint.x), y: parseFloat(newPoint.y) });
    newPoint.x = '';
    newPoint.y = '';
  }
};

const removePoint = (index) => {
  points.splice(index, 1);
};

const addCluster = () => {
  if (newCluster.value) {
    clusters.push(newCluster.value);
    newCluster.value = '';
  }
};

const removeCluster = (index) => {
  clusters.splice(index, 1);
};

const addMembershipValues = () => {
  memberships.length = 0;
  points.forEach(() => {
    memberships.push(new Array(clusters.length).fill(0));
  });
};

const updateMembershipValue = (pointIndex, clusterIndex, value) => {
  memberships[pointIndex][clusterIndex] = parseFloat(value);
};

const euclideanDistance = (point1, point2) => {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

const calculateCentroids = async () => {
  const centroids = [];
  for (let j = 0; j < clusters.length; j++) {
    let numeratorX = 0;
    let numeratorY = 0;
    let denominator = 0;
    const centroidLogX = [];
    const centroidLogY = [];
    const denominatorLog = [];
    for (let i = 0; i < points.length; i++) {
      const membership = Math.pow(memberships[i][j], m.value);
      numeratorX += membership * points[i].x;
      numeratorY += membership * points[i].y;
      denominator += membership;
      centroidLogX.push(`(${memberships[i][j].toFixed(4)}^${m.value}) * ${points[i].x}`);
      centroidLogY.push(`(${memberships[i][j].toFixed(4)}^${m.value}) * ${points[i].y}`);
      denominatorLog.push(`(${memberships[i][j].toFixed(4)}^${m.value})`);
    }
    const centroidX = numeratorX / denominator;
    const centroidY = numeratorY / denominator;
    centroids.push({ x: centroidX, y: centroidY });
    detailedLogs.push(`Centroid ${j + 1} hesaplandı: $$ x = \\frac{${centroidLogX.join(' + ')}}{${denominatorLog.join(' + ')}} = ${centroidX.toFixed(2)} $$, $$ y = \\frac{${centroidLogY.join(' + ')}}{${denominatorLog.join(' + ')}} = ${centroidY.toFixed(2)} $$`);
    await nextTick();
  }
  return centroids;
};

const calculateDistances = async (centroids) => {
  distanceLogs.length = 0; // Mesafe loglarını temizle
  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < clusters.length; j++) {
      const dist = euclideanDistance(points[i], centroids[j]);
      distanceLogs.push(`$$d_{${i+1}${j+1}} = \\sqrt{(${points[i].x} - ${centroids[j].x.toFixed(3)})^2 + (${points[i].y} - ${centroids[j].y.toFixed(3)})^2} = ${dist.toFixed(4)}$$`);
    }
  }
  await nextTick();
};

const updateMembershipMatrix = async (centroids) => {
  await calculateDistances(centroids); // Mesafeleri hesaplayıp loglayalım
  
  detailedLogs.push(`<b>Adım 2:</b> Üyelik matrisini güncelle (m = ${m.value})`);

  for (let i = 0; i < points.length; i++) {
    for (let j = 0; j < clusters.length; j++) {
      let sum = 0;
      const distToCurrentCentroid = euclideanDistance(points[i], centroids[j]);
      const membershipLog = [`d_{${i+1}${j+1}} = ${distToCurrentCentroid.toFixed(4)}`];
      for (let k = 0; k < clusters.length; k++) {
        const distToOtherCentroid = euclideanDistance(points[i], centroids[k]);
        sum += Math.pow(Math.pow(distToCurrentCentroid, 2) / Math.pow(distToOtherCentroid, 2), 1 / (m.value - 1));
        membershipLog.push(`\\left(\\frac{${Math.pow(distToCurrentCentroid, 2).toFixed(4)}}{${Math.pow(distToOtherCentroid, 2).toFixed(4)}}\\right)^{\\frac{1}{${m.value} - 1}}`);
      }
      memberships[i][j] = Math.pow(sum, -1);
      detailedLogs.push(`Üyelik güncellendi: Nokta ${i + 1} (${points[i].x}, ${points[i].y}) → Küme ${j + 1} (${centroids[j].x.toFixed(2)}, ${centroids[j].y.toFixed(2)}): $$ u_{${i+1}${j+1}} = \\left( \\sum_{k=1}^{N} \\left(\\frac{d_{${i+1}${j+1}}^2}{d_{${i+1}k}^2}\\right)^{\\frac{1}{${m.value} - 1}} \\right)^{-1} = ${memberships[i][j].toFixed(4)} $$`);
      await nextTick();
    }
  }
};

const logMembershipChanges = (iteration, centroids) => {
  const log = points.map((point, index) => {
    return {
      point: `(${point.x}, ${point.y})`,
      memberships: clusters.map((cluster, clusterIndex) => ({
        cluster,
        membership: memberships[index][clusterIndex].toFixed(4)
      }))
    };
  });
  membershipLogs.push({ iteration, centroids, log });
};

const performClustering = async () => {
  detailedLogs.length = 0; // Clear previous logs
  distanceLogs.length = 0; // Clear previous distance logs
  detailedLogs.push('<b>Fuzzy C-Means Algoritması Başladı</b>');
  detailedLogs.push(`<b>Adım 1:</b> Başlangıç üyelik matrisinden ilk küme merkezlerini hesapla`);

  const centroids = await calculateCentroids();
  detailedLogs.push(`İlk Centroidler: ${centroids.map((c, i) => `Küme ${i+1} (${c.x.toFixed(2)}, ${c.y.toFixed(2)})`).join(', ')}`);
  await nextTick();

  await updateMembershipMatrix(centroids);
  detailedLogs.push('<b>Adım 3:</b> Yeni üyelik matrisinden küme merkezlerini güncelle');
  await nextTick();

  const updatedCentroids = await calculateCentroids();
  detailedLogs.push(`Güncellenmiş Centroidler: ${updatedCentroids.map((c, i) => `Küme ${i+1} (${c.x.toFixed(2)}, ${c.y.toFixed(2)})`).join(', ')}`);
  await nextTick();

  const centroidShift = updatedCentroids.reduce((sum, centroid, index) => {
    return sum + euclideanDistance(centroid, centroids[index]);
  }, 0);
  detailedLogs.push(`<b>Adım 4:</b> Durma kriterini kontrol et (Centroid kayması: ${centroidShift.toFixed(4)}, Epsilon: ${epsilon.value})`);
  
  if (centroidShift < epsilon.value) {
    detailedLogs.push(`Algoritma yakınsadı: Merkez değişimi (${centroidShift.toFixed(4)}) < epsilon (${epsilon.value})`);
  } else {
    detailedLogs.push(`Daha fazla iterasyon gerekli, merkez değişimi (${centroidShift.toFixed(4)}) > epsilon (${epsilon.value})`);
  }

  iterationLogs.push({
    iteration: 1,
    centroids: updatedCentroids,
    memberships: JSON.parse(JSON.stringify(memberships)),
    logs: `İterasyon 1: Merkezler güncellendi, toplam kayma: ${centroidShift.toFixed(4)}`
  });

  logMembershipChanges(1, updatedCentroids);
  detailedLogs.push('Üyelik değişiklikleri loglandı.');

  // MathJax'ı tetikle
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
};

// Yardımcı fonksiyon: en yüksek üyeliğe sahip kümeyi belirler
const getMostLikelyCluster = (memberships) => {
  return memberships.reduce((maxIndex, current, index, arr) => {
    return parseFloat(current.membership) > parseFloat(arr[maxIndex].membership) ? index : maxIndex;
  }, 0);
};

// Sayfa yüklendiğinde örnek veriyi yükle
onMounted(() => {
  loadSampleData();
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
});

const loadSampleData = () => {
  // Noktaları temizle ve örnek veriyi ekle
  points.length = 0;
  sampleData.points.forEach(point => {
    points.push({ x: point.x, y: point.y });
  });
  
  // Parametreleri ayarla
  clusters.length = sampleData.clusters;
  m.value = sampleData.m;
  epsilon.value = 0.01;
  iterationLogs.length = 0;
  membershipLogs.length = 0;
  detailedLogs.length = 0;
  distanceLogs.length = 0;
  memberships.length = 0;
  points.forEach(() => {
    memberships.push(new Array(sampleData.clusters).fill(0));
  });
};

const clearData = () => {
  points.length = 0;
  clusters.length = 3;
  m.value = 2;
  epsilon.value = 0.01;
  iterationLogs.length = 0;
  membershipLogs.length = 0;
  detailedLogs.length = 0;
  distanceLogs.length = 0;
  memberships.length = 0;
  points.forEach(() => {
    memberships.push(new Array(3).fill(0));
  });
};
</script>


<template>
  <div class="max-w-4xl mx-auto py-8 space-y-8">
    <!-- Başlık ve Açıklama -->
    <div>
      <h1 class="text-xl font-bold mb-2">Fuzzy C-Means Algoritması</h1>
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 class="text-md font-semibold mb-2">Bulanık Kümeleme:</h4>
        <p class="mb-2">Fuzzy C-Means, her veri noktasının birden fazla kümeye belirli üyelik derecelerine sahip olabileceği bir kümeleme algoritmasıdır.</p>
        <p><strong>Algoritma Adımları:</strong></p>
        <ol class="list-decimal pl-5 space-y-1">
          <li>Rastgele küme merkezleri seç</li>
          <li>Her noktanın her kümeye üyelik değerlerini hesapla</li>
          <li>Yeni küme merkezlerini hesapla</li>
          <li>Yakınsama sağlanana kadar 2. ve 3. adımları tekrarla</li>
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

    <!-- Nokta Ekleme Formu -->
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-2">Veri Noktası Ekle</h2>
      <form @submit.prevent="addPoint" class="flex gap-4 mb-4">
        <input v-model="newPoint.x" placeholder="X" class="p-2 border rounded shadow-sm w-full" />
        <input v-model="newPoint.y" placeholder="Y" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Nokta Ekle
        </button>
      </form>
    </div>

    <!-- Dinamik Nokta Tablosu -->
    <div class="overflow-x-auto">
      <table class="table-auto w-full text-left whitespace-no-wrap">
        <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
          <tr>
            <th class="px-6 py-3">X</th>
            <th class="px-6 py-3">Y</th>
            <th class="px-6 py-3">Sil</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-gray-200">
          <tr v-for="(point, index) in points" :key="index">
            <td class="px-6 py-4">{{ point.x }}</td>
            <td class="px-6 py-4">{{ point.y }}</td>
            <td class="px-6 py-4">
              <button @click="removePoint(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                <span> <i class="fas fa-trash-can"></i> </span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Küme Ekleme Formu -->
    <div>
      <form @submit.prevent="addCluster" class="flex gap-4 mb-4">
        <input v-model="newCluster" placeholder="Küme Adı" class="p-2 border rounded shadow-sm w-full" />
        <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Küme Ekle
        </button>
      </form>
    </div>

    <!-- Dinamik Küme Tablosu -->
    <div class="overflow-x-auto">
      <table class="table-auto w-full text-left whitespace-no-wrap">
        <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
          <tr>
            <th class="px-6 py-3">Küme Adı</th>
            <th class="px-6 py-3">Sil</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-gray-200">
          <tr v-for="(cluster, index) in clusters" :key="index">
            <td class="px-6 py-4">{{ cluster }}</td>
            <td class="px-6 py-4">
              <button @click="removeCluster(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                <span> <i class="fas fa-trash-can"></i> </span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Üyelik Değerleri Formu -->
    <div class="mt-4">
      <button @click="addMembershipValues" class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded">
        Üyelik Değerlerini Ekle
      </button>
    </div>

    <div class="overflow-x-auto mt-4" v-if="memberships.length > 0">
      <table class="table-auto w-full text-left whitespace-no-wrap">
        <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
          <tr>
            <th class="px-6 py-3">Nokta</th>
            <th v-for="(cluster, index) in clusters" :key="index" class="px-6 py-3">{{ cluster }} Üyelik</th>
          </tr>
        </thead>
        <tbody class="text-sm divide-y divide-gray-200">
          <tr v-for="(point, pointIndex) in points" :key="pointIndex">
            <td class="px-6 py-4">({{ point.x }}, {{ point.y }})</td>
            <td v-for="(cluster, clusterIndex) in clusters" :key="clusterIndex" class="px-6 py-4">
              <input type="number" min="0" max="1" step="0.01" v-model.number="memberships[pointIndex][clusterIndex]" @input="updateMembershipValue(pointIndex, clusterIndex, $event.target.value)" class="p-2 border rounded shadow-sm w-full" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Kümeleme İşlemi -->
    <div class="mt-8">
      <button @click="performClustering" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
        Fuzzy C-Means Kümeleme
      </button>
    </div>

    <!-- Kümeleme Sonuçları -->
    <div v-if="membershipLogs.length" class="mt-8">
      <h2 class="text-lg font-semibold mb-4">Kümeleme Sonuçları:</h2>
      
      <!-- Matematiksel açıklama -->
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <h4 class="text-md font-semibold mb-2">Fuzzy C-Means Algoritması Özeti:</h4>
        <p class="mb-2">Fuzzy C-Means, her veri noktasının birden fazla kümeye belirli üyelik dereceleriyle ait olabildiği bulanık kümeleme algoritmasıdır.</p>
        <p class="mb-2"><strong>Üyelik Hesaplama:</strong> \(u_{ij} = \left( \sum_{k=1}^{c} \left( \frac{||x_i - c_j||}{||x_i - c_k||} \right)^{\frac{2}{m-1}} \right)^{-1}\)</p>
        <p class="mb-2"><strong>Merkez Hesaplama:</strong> \(c_j = \frac{\sum_{i=1}^{n} u_{ij}^m \cdot x_i}{\sum_{i=1}^{n} u_{ij}^m}\)</p>
        <p class="mb-2"><strong>Bulanıklık parametresi (m):</strong> \(m = ${m.value}\) (Genelde 2 alınır)</p>
      </div>
      
      <div v-for="(log, logIndex) in membershipLogs" :key="logIndex" class="mb-8 border border-gray-200 rounded-lg p-4">
        <h3 class="font-semibold bg-purple-100 p-2 rounded-md">İterasyon {{ log.iteration }}</h3>
        
        <div class="mt-4 bg-gray-50 p-4 rounded-lg">
          <h4 class="text-md font-semibold mb-2">Küme Merkezleri:</h4>
          <div class="flex flex-wrap gap-4">
            <div v-for="(centroid, index) in log.centroids" :key="index" 
                class="border border-gray-200 p-3 rounded-lg bg-white shadow-sm">
              <div class="font-medium">Küme {{ index + 1 }}</div>
              <div>Merkez: ({{ centroid.x.toFixed(2) }}, {{ centroid.y.toFixed(2) }})</div>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <h4 class="text-md font-semibold mb-2">Üyelik Matrisi:</h4>
          <div class="overflow-x-auto">
            <table class="table-auto w-full text-left whitespace-no-wrap mb-4">
              <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
                <tr>
                  <th class="px-6 py-3">Nokta</th>
                  <th v-for="(cluster, clusterIndex) in clusters" :key="clusterIndex" class="px-6 py-3">{{ cluster }} Üyelik</th>
                  <th class="px-6 py-3">Baskın Küme</th>
                </tr>
              </thead>
              <tbody class="text-sm divide-y divide-gray-200">
                <tr v-for="entry in log.log" :key="entry.point">
                  <td class="px-6 py-4">{{ entry.point }}</td>
                  <td v-for="(membership, mIndex) in entry.memberships" :key="membership.cluster" 
                      :class="{'bg-green-100': getMostLikelyCluster(entry.memberships) === mIndex}" 
                      class="px-6 py-4">
                    {{ membership.membership }}
                  </td>
                  <td class="px-6 py-4 font-medium">
                    {{ clusters[getMostLikelyCluster(entry.memberships)] }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Detaylı Loglar -->
    <div v-if="detailedLogs.length" class="mt-8">
      <h2 class="text-lg font-semibold mb-4">Hesaplama Adımları:</h2>
      <div class="bg-gray-50 p-4 rounded-lg">
        <ul class="list-decimal pl-5">
          <li v-for="(log, index) in detailedLogs" :key="index" v-html="log" class="py-1"></li>
        </ul>
      </div>
    </div>

    <!-- Mesafe Logları -->
    <div v-if="distanceLogs.length" class="mt-8">
      <h2 class="text-lg font-semibold mb-4">Mesafe Hesaplamaları:</h2>
      <div class="bg-gray-50 p-4 rounded-lg">
        <ul class="list-decimal pl-5">
          <li v-for="(log, index) in distanceLogs" :key="index" v-html="log" class="py-1"></li>
        </ul>
      </div>
    </div>
  </div>
</template>
