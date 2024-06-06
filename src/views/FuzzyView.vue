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
      detailedLogs.push(`Üyelik güncellendi: Nokta ${i + 1} Küme ${j + 1}: $$ \\left( \\sum_{k=1}^{N} \\left(\\frac{d_{${i+1}${j+1}}^2}{d_{${i+1}k}^2}\\right)^{\\frac{1}{${m.value} - 1}} \\right)^{-1} = ${memberships[i][j].toFixed(4)} $$`);
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
  detailedLogs.push('Başlangıç:');

  const centroids = await calculateCentroids();
  detailedLogs.push(`İlk Centroidler: ${centroids.map(c => `(${c.x.toFixed(2)}, ${c.y.toFixed(2)})`).join(', ')}`);
  await nextTick();

  await updateMembershipMatrix(centroids);
  detailedLogs.push('Üyelik matrisi güncellendi.');
  await nextTick();

  const updatedCentroids = await calculateCentroids();
  detailedLogs.push(`Güncellenmiş Centroidler: ${updatedCentroids.map(c => `(${c.x.toFixed(2)}, ${c.y.toFixed(2)})`).join(', ')}`);
  await nextTick();

  const centroidShift = updatedCentroids.reduce((sum, centroid, index) => {
    return sum + euclideanDistance(centroid, centroids[index]);
  }, 0);
  detailedLogs.push(`Centroid Kayması: ${centroidShift.toFixed(4)}`);

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

onMounted(() => {
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
});
</script>


<template>
  <div class="max-w-4xl mx-auto py-8 space-y-8">
    <!-- Nokta Ekleme Formu -->
    <div>
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
      <div v-for="(log, logIndex) in membershipLogs" :key="logIndex" class="mb-8">
        <h3 class="font-semibold">İterasyon {{ log.iteration }}</h3>
        <p>Küme Merkezleri:</p>
        <ul>
          <li v-for="(centroid, index) in log.centroids" :key="index">
            Küme {{ index + 1 }} Merkezi: ({{ centroid.x.toFixed(2) }}, {{ centroid.y.toFixed(2) }})
          </li>
        </ul>
        <table class="table-auto w-full text-left whitespace-no-wrap mb-4">
          <thead class="text-xs font-semibold uppercase text-gray-700 bg-gray-50">
            <tr>
              <th class="px-6 py-3">Nokta</th>
              <th v-for="(cluster, clusterIndex) in clusters" :key="clusterIndex" class="px-6 py-3">{{ cluster }} Üyelik</th>
            </tr>
          </thead>
          <tbody class="text-sm divide-y divide-gray-200">
            <tr v-for="entry in log.log" :key="entry.point">
              <td class="px-6 py-4">{{ entry.point }}</td>
              <td v-for="membership in entry.memberships" :key="membership.cluster" class="px-6 py-4">
                {{ membership.membership }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Detaylı Loglar -->
    <div v-if="detailedLogs.length" class="mt-8">
      <h2 class="text-lg font-semibold mb-4">Detaylı Loglar:</h2>
      <ul>
        <li v-for="(log, index) in detailedLogs" :key="index" v-html="log"></li>
      </ul>
    </div>

    <!-- Mesafe Logları -->
    <div v-if="distanceLogs.length" class="mt-8">
      <h2 class="text-lg font-semibold mb-4">Mesafe Logları:</h2>
      <ul>
        <li v-for="(log, index) in distanceLogs" :key="index" v-html="log"></li>
      </ul>
    </div>
  </div>
</template>
