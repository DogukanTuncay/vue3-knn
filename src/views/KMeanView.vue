<script setup>
import { reactive, ref, nextTick } from 'vue';

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

  let previousClusters = [];

  for (let iter = 0; iter < iterations.value; iter++) {
    // Her iterasyonda kümeleri temizle
    clusters.forEach(cluster => cluster.points = []);

    const logEntries = [];
    const iterationLog = {
      iteration: iter + 1,
      logs: [],
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
        const distance = manhattanDistance(point, cluster.centroid);
        distances.push({ centroidIndex: clusterIndex, value: distance });
        if (distance < minDistance) {
          minDistance = distance;
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
      iterationLog.logs.push(`Nokta (${point.x}, ${point.y}), en yakın küme merkezi (${closestCluster.centroid.x}, ${closestCluster.centroid.y}) uzaklık: ${minDistance.toFixed(2)}`);
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
    clusters.forEach((cluster, clusterIndex) => {
      let sumX = 0;
      let sumY = 0;
      cluster.points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
      });

      const numPoints = cluster.points.length;
      if (numPoints > 0) {
        const oldCentroid = { ...cluster.centroid };
        cluster.centroid = {
          x: (sumX / numPoints).toFixed(2),
          y: (sumY / numPoints).toFixed(2),
        };
        // Adım adım loglama
        iterationLog.logs.push(`Küme ${clusterIndex + 1} merkezi güncellendi: (${oldCentroid.x}, ${oldCentroid.y}) -> (${cluster.centroid.x}, ${cluster.centroid.y})`);
      }
    });

    previousClusters = JSON.parse(JSON.stringify(clusters));
  }
};



</script>

<template>
    <div class="max-w-4xl mx-auto py-8 space-y-8">
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
      <div class="mt-4 flex gap-4">
        <div>
          <label for="iterations">İterasyon Sayısı:</label>
          <input v-model="iterations" id="iterations" type="number" min="1" class="p-2 border rounded shadow-sm" />
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
        <div v-for="(log, iterIndex) in iterationLogs" :key="iterIndex" class="mb-8">
          <h3 class="font-semibold">İterasyon {{ log.iteration }}</h3>
          <table class="table-auto w-full text-left whitespace-no-wrap mb-4">
            <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
              <tr>
                <th class="px-6 py-3">Nokta</th>
                <th v-for="(cluster, centroidIndex) in log.clusters" :key="centroidIndex" class="px-6 py-3">
                  Merkez ({{ cluster.centroid.x }}, {{ cluster.centroid.y }}) Uzaklık
                </th>
                <th v-if="log.iteration === 1" class="px-6 py-3">Küme</th>
                <th v-else class="px-6 py-3">Eski Küme</th>
                <th v-else class="px-6 py-3">Yeni Küme</th>
              </tr>
            </thead>
            <tbody class="text-sm divide-y divide-gray-200">
              <tr v-for="entry in log.entries" :key="entry.pointIndex">
                <td class="px-6 py-4">({{ entry.point.x }}, {{ entry.point.y }})</td>
                <td v-for="distance in entry.distances" :key="distance.centroidIndex" class="px-6 py-4">
                  {{ distance.value.toFixed(2) }}
                </td>
                <td v-if="log.iteration === 1" class="px-6 py-4">
                  Küme {{ entry.clusterIndex + 1 }}
                </td>
                <td v-else class="px-6 py-4">
                  Küme {{ log.previousClusters[entry.clusterIndex] ? log.previousClusters[entry.clusterIndex].centroid : 'N/A' }}
                </td>
                <td v-else class="px-6 py-4">
                  Küme {{ entry.clusterIndex + 1 }}
                </td>
              </tr>
            </tbody>
          </table>
          <p v-for="(cluster, clusterIndex) in log.clusters" :key="clusterIndex">
            Küme {{ clusterIndex + 1 }} Merkezi: ({{ cluster.centroid.x }}, {{ cluster.centroid.y }})
          </p>
          <div class="mt-4">
            <h4 class="text-md font-semibold mb-2">İterasyon Logları:</h4>
            <ul class="list-disc list-inside">
              <li v-for="(log, logIndex) in log.logs" :key="logIndex">
                {{ log }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  
  
  
  
  