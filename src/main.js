import Vue from "vue";
import App from "./App.vue";
import axios from "axios";

Vue.use({
  install(Vue) {
    Vue.prototype.$api = axios.create({
      // Nurodome backend adresą, kuriuo kreipsimės užklausoms
      baseURL: "http://localhost:8000/api/",
    });
  },
});

Vue.config.productionTip = false;

new Vue({
  render: (h) => h(App),
}).$mount("#app");
