(()=>{function t(t,r){(null==r||r>t.length)&&(r=t.length);for(var n=0,e=new Array(r);n<r;n++)e[n]=t[n];return e}onmessage=function(r){var n,e=r.data,o=function(t){if(Array.isArray(t))return t}(n=JSON.parse(e))||function(t,r){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var e,o,a=[],l=!0,i=!1;try{for(n=n.call(t);!(l=(e=n.next()).done)&&(a.push(e.value),2!==a.length);l=!0);}catch(t){i=!0,o=t}finally{try{l||null==n.return||n.return()}finally{if(i)throw o}}return a}}(n)||function(r,n){if(r){if("string"==typeof r)return t(r,2);var e=Object.prototype.toString.call(r).slice(8,-1);return"Object"===e&&r.constructor&&(e=r.constructor.name),"Map"===e||"Set"===e?Array.from(r):"Arguments"===e||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(e)?t(r,2):void 0}}(n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}(),a=o[0],l=o[1];switch(console.log(a,l),a){case"stretch":var i=l;console.log("Got channels",i.channels.length);break;case"bpm":postMessage(JSON.stringify(["bpm",128]))}}})();