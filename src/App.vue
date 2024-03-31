<script setup>
import { RouterLink, RouterView } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import Navbar from '@/components/layouts/Navbar.vue';

</script>

<template>
     
  <header>
    <div class="">
    <Navbar/>
    </div>
  </header>

  <RouterView class="container mx-auto" />
</template>

<style>
</style>

