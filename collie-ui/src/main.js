import Vue from 'vue'
import App from './App.vue'
import ElementUI from 'element-ui'
import '@/assets/iconfont/iconfont.css'
Vue.use(ElementUI);
Vue.config.productionTip = false

window.Vue = Vue;

new Vue({
  render: h => h(App),
}).$mount('#app')
