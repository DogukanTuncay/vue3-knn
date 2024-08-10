import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NaiveView from '../views/NaiveView.vue'
import EntropyView from '@/views/EntropyView.vue'
import KMeanView from '@/views/KMeanView.vue'
import FuzzyView from '@/views/FuzzyView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'KNN',
      component: HomeView
    },
    {
      path: '/naive',
      name: 'naive',
      component: NaiveView
    },
    {
      path: '/entropy',
      name: 'entropy',
      component: EntropyView
    },
    {
      path: '/kmean',
      name: 'kmean',
      component: KMeanView
    },
    {
      path: '/fcm',
      name: 'fcm',
      component: FuzzyView
    },
  ]
})

export default router
