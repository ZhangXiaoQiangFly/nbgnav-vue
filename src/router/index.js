import Router from 'vue-router'
import Vue from 'vue'
import List from "../components/list.vue"
import NavHome from "../components/NavHome.vue"

Vue.use(Router)
export default new Router({
    mode: 'history',
    routes: [{
        path: '/',
        name: 'List',
        component: List
    }, {
        path: '/NavHome',
        name: 'NavHome',
        component: NavHome
    }],
   
})