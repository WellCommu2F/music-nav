import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NodeView from '../views/NodeView.vue'
import RouteView from '../views/RouteView.vue'
import LibraryView from '../views/LibraryView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/node/:id', name: 'node', component: NodeView, props: true },
  { path: '/route/:id', name: 'route', component: RouteView, props: true },
  { path: '/library', name: 'library', component: LibraryView },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
