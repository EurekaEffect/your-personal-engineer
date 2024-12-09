// ==UserScript==
// @name            Your Personal Engineer
// @description     Makes your trading routine more comfortable.
// @author          https://steamcommunity.com/id/EurekaEffect/
// @version         1.0

// @updateURL       https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/output/ype.bundle.user.js
// @downloadURL     https://github.com/EurekaEffect/your-personal-engineer/raw/refs/heads/master/output/ype.bundle.user.js

// @match           *://backpack.tf/stats/*
// @match           *://backpack.tf/classifieds*

// @run-at          document-start
// ==/UserScript==
(()=>{"use strict";!function(){var t,e,n,r;t=this,e=void 0,r=function(){return function(t,e){var n,r,o,a={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]},c=Object.create(("function"==typeof Iterator?Iterator:Object).prototype);return c.next=i(0),c.throw=i(1),c.return=i(2),"function"==typeof Symbol&&(c[Symbol.iterator]=function(){return this}),c;function i(i){return function(u){return function(i){if(n)throw new TypeError("Generator is already executing.");for(;c&&(c=0,i[0]&&(a=0)),a;)try{if(n=1,r&&(o=2&i[0]?r.return:i[0]?r.throw||((o=r.return)&&o.call(r),0):r.next)&&!(o=o.call(r,i[1])).done)return o;switch(r=0,o&&(i=[2&i[0],o.value]),i[0]){case 0:case 1:o=i;break;case 4:return a.label++,{value:i[1],done:!1};case 5:a.label++,r=i[1],i=[0];continue;case 7:i=a.ops.pop(),a.trys.pop();continue;default:if(!((o=(o=a.trys).length>0&&o[o.length-1])||6!==i[0]&&2!==i[0])){a=0;continue}if(3===i[0]&&(!o||i[1]>o[0]&&i[1]<o[3])){a.label=i[1];break}if(6===i[0]&&a.label<o[1]){a.label=o[1],o=i;break}if(o&&a.label<o[2]){a.label=o[2],a.ops.push(i);break}o[2]&&a.ops.pop(),a.trys.pop();continue}i=e.call(t,a)}catch(t){i=[6,t],r=0}finally{n=o=0}if(5&i[0])throw i[1];return{value:i[0]?i[1]:void 0,done:!0}}([i,u])}}}(this,(function(t){return console.log("Main.ts"),document.body.remove(),[2]}))},new((n=void 0)||(n=Promise))((function(o,a){function c(t){try{u(r.next(t))}catch(t){a(t)}}function i(t){try{u(r.throw(t))}catch(t){a(t)}}function u(t){var e;t.done?o(t.value):(e=t.value,e instanceof n?e:new n((function(t){t(e)}))).then(c,i)}u((r=r.apply(t,e||[])).next())}))}()})();