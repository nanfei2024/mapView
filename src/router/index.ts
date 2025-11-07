import { createRouter, createWebHistory } from 'vue-router';
import FileDetails from '../components/FileDetails.vue';
import FileEdit from '../components/FileEdit.vue';
import FilePagination from '../components/FilePagination.vue';
import HomePage from '../views/HomePage.vue';
import BookListPage from '../views/BookListPage.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomePage,
  },
  {
    path: '/files/details/:id',
    name: 'FileDetails',
    component: FileDetails,
  },
  {
    path: '/files/edit/:id',
    name: 'FileEdit',
    component: FileEdit,
    props: true,
  },
  {
    path: '/filepagination',
    name: 'filepagination',
    component: FilePagination,
  },
  {
    path: '/books',
    name: 'books',
    component: BookListPage,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;