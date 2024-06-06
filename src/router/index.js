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
      name: 'home',
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
    {
    //  path: '/about',
     // name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
