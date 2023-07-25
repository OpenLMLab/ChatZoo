import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import '@/assets/iconfont/iconfont.css'
// in main.js
import VueSSE from 'vue-sse';

// using defaults
Vue.use(VueSSE);
Vue.use(ElementUI);
Vue.config.productionTip = false

window.Vue = Vue;



new Vue({
  render: h => h(App),
}).$mount('#app')
