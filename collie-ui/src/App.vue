<template>
  <div id="app">
    <ModelShow/>
  </div>
</template>

<script>
import ModelShow from './components/ModelShow.vue';
export default {
  name: 'App',
  head: {
    title: {
      inner: 'Collie'
    }
  },
  components: {
    ModelShow
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  height: 100%;
}
</style>
