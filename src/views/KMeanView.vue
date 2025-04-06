<script setup>
import { reactive, ref, nextTick, computed, onMounted } from 'vue';

// Noktaları ve kümeleri tanımlama
const points = reactive([]);
const initialCentroids = reactive([]);
const clusters = reactive([]);
const newPoint = reactive({ x: '', y: '' });
const newCentroid = reactive({ x: '', y: '' });
const iterations = ref(10);
const iterationLogs = reactive([]);

// Giriş alanlarına referanslar
const newPointXRef = ref(null);
const newCentroidXRef = ref(null);

// Örnek veri seti
const sampleData = {
  points: [
    { x: 2, y: 3 },
    { x: 3, y: 3 },
    { x: 4, y: 3 },
    { x: 5, y: 4 },
    { x: 7, y: 4 },
    { x: 5, y: 7 },
    { x: 6, y: 7 },
    { x: 7, y: 7 },
    { x: 8, y: 8 },
    { x: 9, y: 9 }
  ],
  k: 3,
  maxIterations: 3,
  distanceMetric: 'euclidean'
};

const addPoint = async () => {
  if (newPoint.x && newPoint.y) {
    points.push({ x: parseFloat(newPoint.x), y: parseFloat(newPoint.y) });
    newPoint.x = '';
    newPoint.y = '';
    await nextTick();
    newPointXRef.value.focus(); // X alanına odaklan
  }
};

const removePoint = (index) => {
  points.splice(index, 1);
};

const addCentroid = async () => {
  if (newCentroid.x && newCentroid.y) {
    initialCentroids.push({ x: parseFloat(newCentroid.x), y: parseFloat(newCentroid.y) });
    newCentroid.x = '';
    newCentroid.y = '';
    await nextTick();
    newCentroidXRef.value.focus(); // X alanına odaklan
  }
};

const removeCentroid = (index) => {
  initialCentroids.splice(index, 1);
};

const manhattanDistance = (point1, point2) => {
  return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
};

const euclideanDistance = (point1, point2) => {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
};

const distanceType = ref('manhattan'); // Mesafe tipini seçmek için
const distance = (point1, point2) => {
  if (distanceType.value === 'euclidean') {
    return euclideanDistance(point1, point2);
  }
  return manhattanDistance(point1, point2); // Varsayılan olarak Manhattan kullan
};

const formatDistanceFormula = (point1, point2, type, value) => {
  if (type === 'euclidean') {
    return `d_E(${point1}, ${point2}) = \\sqrt{(${point1.x.toFixed(2)} - ${point2.x.toFixed(2)})^2 + (${point1.y.toFixed(2)} - ${point2.y.toFixed(2)})^2} = ${value.toFixed(2)}`;
  } else {
    return `d_M(${point1}, ${point2}) = |${point1.x.toFixed(2)} - ${point2.x.toFixed(2)}| + |${point1.y.toFixed(2)} - ${point2.y.toFixed(2)}| = ${value.toFixed(2)}`;
  }
};

const performClustering = () => {
  clusters.length = 0; // Kümeleri temizle
  iterationLogs.length = 0; // Logları temizle

  // Başlangıç küme merkezlerini kullanıcıdan al ve ilk iterasyonda kullan
  initialCentroids.forEach(centroid => {
    clusters.push({
      centroid: { x: centroid.x, y: centroid.y },
      points: [],
    });
  });

  iterationLogs.push({
    iteration: 0,
    logs: [`K-Means algoritması başlatıldı. k=${clusters.length} küme ve mesafe metriği: ${distanceType.value === 'euclidean' ? 'Öklid' : 'Manhattan'}.`,
           `<b>Adım 0:</b> Başlangıç merkezleri kullanıcı tarafından belirlendi.`,
           ...clusters.map((c, i) => `Merkez ${i+1}: (${c.centroid.x}, ${c.centroid.y})`)],
    clusters: JSON.parse(JSON.stringify(clusters)),
    entries: [],
    previousClusters: []
  });

  let previousClusters = [];

  for (let iter = 0; iter < iterations.value; iter++) {
    // Her iterasyonda kümeleri temizle
    clusters.forEach(cluster => cluster.points = []);

    const logEntries = [];
    const iterationLog = {
      iteration: iter + 1,
      logs: [`<b>Adım ${iter*2 + 1}:</b> Noktaları en yakın küme merkezine atama:`],
      clusters: JSON.parse(JSON.stringify(clusters)), // Derin kopya
      previousClusters: JSON.parse(JSON.stringify(previousClusters)) // Önceki kümeleri sakla
    };

    // Her noktayı en yakın küme merkezine ata
    points.forEach((point, pointIndex) => {
      let minDistance = Infinity;
      let closestCluster = null;
      let closestClusterIndex = -1;
      const distances = [];

      clusters.forEach((cluster, clusterIndex) => {
        const dist = distance(point, cluster.centroid);
        const formula = formatDistanceFormula({x: point.x, y: point.y}, 
                                             {x: parseFloat(cluster.centroid.x), y: parseFloat(cluster.centroid.y)}, 
                                             distanceType.value, dist);
        distances.push({ centroidIndex: clusterIndex, value: dist, formula });
        if (dist < minDistance) {
          minDistance = dist;
          closestCluster = cluster;
          closestClusterIndex = clusterIndex;
        }
      });

      closestCluster.points.push(point);
      logEntries.push({
        pointIndex,
        point,
        clusterIndex: closestClusterIndex,
        distance: minDistance,
        distances,
      });

      // Adım adım loglama
      iterationLog.logs.push(`Nokta (${point.x}, ${point.y}), en yakın küme merkezi ${closestClusterIndex + 1} (${closestCluster.centroid.x}, ${closestCluster.centroid.y}), uzaklık: ${minDistance.toFixed(2)}`);
      iterationLog.logs.push(`\\(${distances[closestClusterIndex].formula}\\)`);
    });

    // Iterasyon logunu ekle (küme güncellemeleri öncesi)
    iterationLogs.push({
      clusters: JSON.parse(JSON.stringify(clusters)), // Derin kopya
      entries: logEntries,
      iteration: iter + 1,
      logs: iterationLog.logs,
      previousClusters: JSON.parse(JSON.stringify(previousClusters))
    });

    // Küme merkezlerini güncelle
    iterationLog.logs.push(`<b>Adım ${iter*2 + 2}:</b> Küme merkezlerini güncelleme:`);
    
    clusters.forEach((cluster, clusterIndex) => {
      let sumX = 0;
      let sumY = 0;
      if (cluster.points.length === 0) {
        iterationLog.logs.push(`Küme ${clusterIndex + 1} boş, merkez değişmedi.`);
        return;
      }
      
      const sumFormula = cluster.points.map(p => `(${p.x}, ${p.y})`).join(' + ');
      
      cluster.points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
      });

      const numPoints = cluster.points.length;
      const oldCentroid = { ...cluster.centroid };
      cluster.centroid = {
        x: (sumX / numPoints).toFixed(2),
        y: (sumY / numPoints).toFixed(2),
      };
      
      // Adım adım loglama
      iterationLog.logs.push(`Küme ${clusterIndex + 1} merkezi güncellendi:`);
      iterationLog.logs.push(`\\(C_{${clusterIndex+1}} = \\frac{${sumFormula}}{${numPoints}} = (${cluster.centroid.x}, ${cluster.centroid.y})\\)`);
    });

    iterationLogs[iterationLogs.length - 1].logs.push(...iterationLog.logs.slice(iterationLogs[iterationLogs.length - 1].logs.length));
    
    previousClusters = JSON.parse(JSON.stringify(clusters));
  }
  
  // MathJax'ı çalıştır
  nextTick(() => {
    if (window.MathJax) {
      window.MathJax.typesetPromise();
    }
  });
};

// Sayfa yüklendiğinde örnek veriyi yükle
onMounted(() => {
  loadSampleData();
});

const loadSampleData = () => {
  // Önceki verileri temizle
  points.length = 0;
  initialCentroids.length = 0;
  clusters.length = 0;
  iterationLogs.length = 0;
  
  // Örnek verileri ekle
  sampleData.points.forEach(point => {
    points.push({ 
      x: point.x, 
      y: point.y
    });
  });
  
  // Başlangıç merkezleri oluştur
  for (let i = 0; i < sampleData.k; i++) {
    const randomPoint = sampleData.points[Math.floor(Math.random() * sampleData.points.length)];
    initialCentroids.push({
      x: randomPoint.x,
      y: randomPoint.y
    });
  }
  
  // Parametreleri ayarla
  iterations.value = sampleData.maxIterations;
  distanceType.value = sampleData.distanceMetric;
};

const clearData = () => {
  points.length = 0;
  initialCentroids.length = 0;
  clusters.length = 0;
  iterations.value = 10;
  iterationLogs.length = 0;
};

</script>

<template>
    <div class="max-w-4xl mx-auto py-8 space-y-8">
      <!-- Başlık ve Açıklama -->
      <div>
        <h1 class="text-xl font-bold mb-2">K-Means Kümeleme Algoritması</h1>
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 class="text-md font-semibold mb-2">K-Means Algoritması:</h4>
          <p class="mb-2">K-Means, veri noktalarını belirli özelliklere göre K kümeye ayıran bir kümeleme algoritmasıdır.</p>
          <p><strong>Algoritma Adımları:</strong></p>
          <ol class="list-decimal pl-5 space-y-1">
            <li>K adet rastgele merkez noktası (centroid) seç</li>
            <li>Her veri noktasını en yakın merkeze ata</li>
            <li>Her kümenin merkezini güncelle</li>
            <li>Atamalarda değişiklik olduğu sürece 2. ve 3. adımları tekrarla</li>
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
      <div>
        <form @submit.prevent="addPoint" class="flex gap-4 mb-4">
          <input v-model="newPoint.x" placeholder="X" ref="newPointXRef" class="p-2 border rounded shadow-sm w-full" />
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
  
      <!-- Merkez Noktası Ekleme Formu -->
      <div>
        <form @submit.prevent="addCentroid" class="flex gap-4 mb-4">
          <input v-model="newCentroid.x" placeholder="Merkez X" ref="newCentroidXRef" class="p-2 border rounded shadow-sm w-full" />
          <input v-model="newCentroid.y" placeholder="Merkez Y" class="p-2 border rounded shadow-sm w-full" />
          <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Merkez Ekle
          </button>
        </form>
      </div>
  
      <!-- Dinamik Merkez Noktaları Tablosu -->
      <div class="overflow-x-auto">
        <table class="table-auto w-full text-left whitespace-no-wrap">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th class="px-6 py-3">Merkez X</th>
              <th class="px-6 py-3">Merkez Y</th>
              <th class="px-6 py-3">Sil</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="(centroid, index) in initialCentroids" :key="index">
              <td class="px-6 py-4">{{ centroid.x }}</td>
              <td class="px-6 py-4">{{ centroid.y }}</td>
              <td class="px-6 py-4">
                <button @click="removeCentroid(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                  <span> <i class="fas fa-trash-can"></i> </span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- İterasyon ve Kümeleme İşlemi -->
      <div class="mt-4 flex gap-4 flex-wrap">
        <div>
          <label for="iterations">İterasyon Sayısı:</label>
          <input v-model="iterations" id="iterations" type="number" min="1" class="p-2 border rounded shadow-sm" />
        </div>
        <div>
          <label for="distanceType">Mesafe Metriği:</label>
          <select v-model="distanceType" id="distanceType" class="p-2 border rounded shadow-sm">
            <option value="manhattan">Manhattan</option>
            <option value="euclidean">Öklid</option>
          </select>
        </div>
      </div>
  
      <!-- Kümeleme İşlemi -->
      <div class="mt-8">
        <button @click="performClustering" class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
          K-Means Kümeleme
        </button>
      </div>
  
      <!-- Kümeleme Sonuçları -->
      <div v-if="iterationLogs.length" class="mt-8">
        <h2 class="text-lg font-semibold mb-4">Kümeleme Sonuçları:</h2>
        
        <!-- Matematiksel açıklama -->
        <div class="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 class="text-md font-semibold mb-2">K-Means Algoritması Özeti:</h4>
          <p class="mb-2">K-Means, veri noktalarını K adet kümeye ayıran bir denetimsiz öğrenme algoritmasıdır.</p>
          <p class="mb-2"><strong>Öklid Mesafesi:</strong> \(d_E(p,c) = \sqrt{(p_x - c_x)^2 + (p_y - c_y)^2}\)</p>
          <p class="mb-2"><strong>Manhattan Mesafesi:</strong> \(d_M(p,c) = |p_x - c_x| + |p_y - c_y|\)</p>
          <p class="mb-2"><strong>Merkez Hesaplama:</strong> \(c = \frac{1}{n} \sum_{i=1}^{n} p_i\)</p>
        </div>
        
        <div v-for="(log, iterIndex) in iterationLogs" :key="iterIndex" class="mb-8 border border-gray-200 rounded-lg p-4">
          <h3 class="font-semibold bg-purple-100 p-2 rounded-md">{{ log.iteration === 0 ? 'Başlangıç' : `İterasyon ${log.iteration}` }}</h3>
          
          <!-- İterasyon Logları -->
          <div class="mt-4 bg-gray-50 p-4 rounded-lg">
            <h4 class="text-md font-semibold mb-2">Adımlar:</h4>
            <ul class="list-decimal pl-5">
              <li v-for="(logItem, logIndex) in log.logs" :key="logIndex" v-html="logItem" class="py-1"></li>
            </ul>
          </div>
          
          <!-- Küme Merkezleri ve Uzaklık Tablosu -->
          <div v-if="log.iteration > 0" class="mt-4">
            <h4 class="text-md font-semibold mb-2">Küme-Nokta Uzaklıkları:</h4>
            <table class="table-auto w-full text-left whitespace-no-wrap mb-4">
              <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
                <tr>
                  <th class="px-6 py-3">Nokta</th>
                  <th v-for="(cluster, centroidIndex) in log.clusters" :key="centroidIndex" class="px-6 py-3">
                    Merkez {{ centroidIndex + 1 }} ({{ cluster.centroid.x }}, {{ cluster.centroid.y }})
                  </th>
                  <th class="px-6 py-3">Atanan Küme</th>
                </tr>
              </thead>
              <tbody class="text-sm divide-y divide-gray-200">
                <tr v-for="entry in log.entries" :key="entry.pointIndex">
                  <td class="px-6 py-4">({{ entry.point.x }}, {{ entry.point.y }})</td>
                  <td v-for="distance in entry.distances" :key="distance.centroidIndex" 
                      class="px-6 py-4" :class="{ 'bg-green-100': distance.centroidIndex === entry.clusterIndex }">
                    {{ distance.value.toFixed(2) }}
                  </td>
                  <td class="px-6 py-4 font-medium">
                    Küme {{ entry.clusterIndex + 1 }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Küme Merkezleri Listesi -->
          <div class="mt-4">
            <h4 class="text-md font-semibold mb-2">Küme Merkezleri:</h4>
            <div class="flex flex-wrap gap-4">
              <div v-for="(cluster, clusterIndex) in log.clusters" :key="clusterIndex" 
                   class="border border-gray-200 p-3 rounded-lg bg-gray-50 shadow-sm">
                <div class="font-medium">Küme {{ clusterIndex + 1 }}</div>
                <div>Merkez: ({{ cluster.centroid.x }}, {{ cluster.centroid.y }})</div>
                <div>Nokta sayısı: {{ cluster.points ? cluster.points.length : 0 }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  
  
  
  
  