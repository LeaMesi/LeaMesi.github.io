import{A as e,C as t,D as n,F as r,M as i,N as a,P as o,S as s,T as c,_ as l,a as u,d,g as f,h as p,i as m,j as h,l as g,n as ee,o as _,p as te,s as v,v as ne,w as y,y as b}from"./index-Bgrn0Dhp.js";import{a as x,i as S,o as C,r as w,s as T,t as E}from"./translationService-Blv-UGMc.js";var D=`https://unison.boidu.dev`,O=`https://api.betterlyrics.org`,k={es:`Español`,en:`English`,ja:`日本語 (Japonés)`,ko:`한국어 (Coreano)`,zh:`中文 (Chino)`,fr:`Français`,de:`Deutsch`,it:`Italiano`,pt:`Português`,ru:`Русский`,und:`Original`};function A(e){return e?k[e.toLowerCase().trim()]||e.toUpperCase():`Original`}function j(e){return String(e||``).toLowerCase().normalize(`NFD`).replace(/[\u0300-\u036f]/g,``).trim()}function M(e){return e.replace(/^the\s+/i,``).trim()}function N(e,t){let n=j(e),r=j(t);if(!n||!r)return!1;let i=M(r);return!!(n===r||M(n)===i||n.split(/\s*(?:feat\.?|ft\.?|featuring|&|\/|\+|x|,|with|vs\.?)\s*/i).map(e=>e.trim()).filter(Boolean).some(e=>e===r||M(e)===i))}function P(e){if(!e)return 0;let t=String(e).trim().replace(`s`,``).split(`:`).map(Number);return t.length===3?t[0]*3600+t[1]*60+(t[2]||0):t.length===2?t[0]*60+(t[1]||0):t.length===1&&Number(t[0])||0}function F(e,t=``){let n=t?N(e.artist,t):!1;return{id:e.id,song:e.song||`Sin Título`,artist:e.artist||`Artista Desconocido`,album:e.album||``,videoId:e.videoId||``,duration:Number(e.duration)||0,format:e.format||`ttml`,syncType:e.syncType||`richsync`,confidence:e.confidence||`low`,matchScore:e.matchScore||0,language:e.language||`en`,isExactArtist:n}}async function I(e,t={}){let n={};typeof e==`string`?n={query:e,...t}:e&&typeof e==`object`&&(n={...e,...t});let{mode:r=`general`,query:a=``,artist:o=``,song:s=``,videoId:c=``,strictArtist:l=!1,syncType:u=`all`,limit:d=50}=n,f=[],p=i(c||a)||(/^[a-zA-Z0-9_-]{11}$/.test((c||a).trim())?(c||a).trim():null);if(r===`video`||r===`general`&&p){let e=p||c.trim();if(e)try{let t=await fetch(`${D}/lyrics?v=${encodeURIComponent(e)}`);if(t.ok){let e=await t.json();e.success&&e.data&&f.push(e.data)}let n=await fetch(`${D}/lyrics/variants/${encodeURIComponent(e)}?limit=20`);if(n.ok){let e=await n.json();e.success&&Array.isArray(e.data)&&e.data.forEach(e=>{f.some(t=>t.id===e.id)||f.push(e)})}}catch(e){console.warn(`Error buscando video en Unison:`,e)}}else if(r===`artist_song`){let e=(o||``).trim(),t=(s||``).trim();if(!e&&!t)return[];if(e&&t){try{let n=`${D}/lyrics/search?song=${encodeURIComponent(t)}&artist=${encodeURIComponent(e)}&limit=${d}`,r=await fetch(n);if(r.ok){let e=await r.json();e.success&&Array.isArray(e.data)&&e.data.length>0&&f.push(...e.data)}}catch{}try{let n=`${D}/lyrics/search?q=${encodeURIComponent(e+` `+t)}&limit=${d}`,r=await fetch(n);if(r.ok){let e=await r.json();e.success&&Array.isArray(e.data)&&e.data.forEach(e=>{f.some(t=>t.id===e.id)||f.push(e)})}}catch{}}else{let n=await fetch(`${D}/lyrics/search?q=${encodeURIComponent(e||t)}&limit=${d}`);if(n.ok){let e=await n.json();e.success&&Array.isArray(e.data)&&(f=e.data)}}}else if(r===`artist`){let e=(o||a||``).trim();if(!e)return[];let t=`${D}/lyrics/search?q=${encodeURIComponent(e)}&limit=${d}`,n=await fetch(t);if(n.ok){let e=await n.json();e.success&&Array.isArray(e.data)&&(f=e.data)}}else{let e=(a||``).trim();if(!e)return[];let t=`${D}/lyrics/search?q=${encodeURIComponent(e)}&limit=${d}`,n=await fetch(t);if(n.ok){let e=await n.json();e.success&&Array.isArray(e.data)&&(f=e.data)}}let m=(o||(r===`artist`?a:``)).trim(),h=j((s||``).trim()),g=f.map(e=>F(e,m));return m&&(l||r===`artist`)&&(g=g.filter(e=>N(e.artist,m))),u===`richsync`?g=g.filter(e=>e.syncType===`richsync`||e.format===`ttml`):u===`linesync`&&(g=g.filter(e=>e.syncType===`linesync`||e.format===`lrc`)),g.sort((e,t)=>{if(h){let n=e.isExactArtist&&j(e.song).includes(h),r=t.isExactArtist&&j(t.song).includes(h);if(n!==r)return r?1:-1;let i=j(e.song).includes(h),a=j(t.song).includes(h);if(i!==a)return a?1:-1}if(e.isExactArtist!==t.isExactArtist)return t.isExactArtist?1:-1;let n=+(e.syncType===`richsync`),r=+(t.syncType===`richsync`);return n===r?(t.matchScore||0)-(e.matchScore||0):r-n}),g}async function L(e,t=null,n=null,r=null){let i=null;if(e)try{let t=await fetch(`${D}/lyrics/${e}`);if(t.ok){let e=await t.json();e.success&&e.data&&(i=e.data)}}catch{}if(!i&&t)try{let e=await fetch(`${D}/lyrics?v=${encodeURIComponent(t)}`);if(e.ok){let t=await e.json();t.success&&t.data&&(i=t.data)}}catch{}if(!i&&n&&r)try{let e=await fetch(`${O}/getLyrics?s=${encodeURIComponent(n)}&a=${encodeURIComponent(r)}`);if(e.ok){let a=await e.json();a.ttml&&(i={song:n,artist:r,format:`ttml`,syncType:`richsync`,lyrics:a.ttml,videoId:t||``})}}catch{}if(!i||!i.lyrics)throw Error(`No se pudo descargar la letra sincronizada desde BetterLyrics.`);return{id:i.id||e,song:i.song||n||`Canción`,artist:i.artist||r||``,album:i.album||``,duration:Number(i.duration)||0,format:i.format||`ttml`,syncType:i.syncType||`richsync`,language:i.language||`en`,lyrics:i.lyrics,videoId:i.videoId||t||``}}async function R(e,t=`es`){if(!e||e.length===0)return{lines:[],detectedLang:``};try{let n=await E(e,t,`auto`);return{lines:(n.translatedLines||[]).map(e=>({translation:e,romanization:null,needsTranslation:!0})),detectedLang:n.detectedLang||``}}catch(e){return console.warn(`Fallo al traducir líneas:`,e),{lines:[],detectedLang:``}}}function z(e){if(!e)return[];let t=[];if(typeof DOMParser<`u`)try{let n=new DOMParser().parseFromString(e,`text/xml`),r=Array.from(n.getElementsByTagName(`p`));if(r.length>0&&(r.forEach((e,n)=>{let r=P(e.getAttribute(`begin`)),i=P(e.getAttribute(`end`)),a=Array.from(e.getElementsByTagName(`span`)),o=[];a.length>0&&a.forEach((e,t)=>{let n=P(e.getAttribute(`begin`))||r,a=P(e.getAttribute(`end`))||i;a<=n&&(a=n+.35);let s=e.textContent||``;if(e.nextSibling&&e.nextSibling.nodeType===3){let t=e.nextSibling.nodeValue||``;/\s/.test(t)&&!s.endsWith(` `)&&(s+=` `)}o.push({text:s,startTime:Math.round(n*1e3)/1e3,duration:Math.max(.05,Math.round((a-n)*1e3)/1e3)})});let s=o.map(e=>e.text).join(``).trim();if(s||=e.textContent.trim(),i<=r&&o.length>0){let e=o[o.length-1];i=e.startTime+e.duration}else i<=r&&(i=r+3);let c=o;if(c.length===0&&s){let e=T(s);c=C(e,r,i)}t.push({id:`line-${n+1}`,startTime:Math.round(r*1e3)/1e3,endTime:Math.round(i*1e3)/1e3,text:s,syllables:c})}),t.length>0))return t}catch(e){console.warn(`DOMParser falló con TTML, usando parser regex:`,e)}let n=/<p[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>([\s\S]*?)<\/p>/gi,r=/<span[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>([^<]*)<\/span>(\s*)/gi,i,a=0;for(;(i=n.exec(e))!==null;){a++;let e=P(i[1]),n=P(i[2]),o=i[3],s=[],c;for(;(c=r.exec(o))!==null;){let t=P(c[1])||e,r=P(c[2])||n;r<=t&&(r=t+.35);let i=c[3]+(c[4]||``);s.push({text:i,startTime:Math.round(t*1e3)/1e3,duration:Math.max(.05,Math.round((r-t)*1e3)/1e3)})}let l=s.map(e=>e.text).join(``).trim();if(l||=o.replace(/<[^>]+>/g,``).trim(),n<=e&&s.length>0){let e=s[s.length-1];n=e.startTime+e.duration}else n<=e&&(n=e+3);let u=s;if(u.length===0&&l){let t=T(l);u=C(t,e,n)}t.push({id:`line-${a}`,startTime:Math.round(e*1e3)/1e3,endTime:Math.round(n*1e3)/1e3,text:l,syllables:u})}return t}function B(e){if(!e)return[];let t=e.split(`
`),n=/^\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\](.*)$/,r=[];for(let e of t){let t=e.trim().match(n);if(t){let e=Number(t[1])||0,n=Number(t[2])||0,i=t[3].trim(),a=e*60+n;i&&r.push({time:a,text:i})}}r.sort((e,t)=>e.time-t.time);let i=[];for(let e=0;e<r.length;e++){let t=r[e],n=Math.round(t.time*1e3)/1e3,a=r[e+1]?r[e+1].time:n+3.5,o=Math.max(n+.5,Math.round(a*1e3)/1e3),s=T(t.text),c=C(s,n,o);i.push({id:`line-${e+1}`,startTime:n,endTime:o,text:t.text,syllables:c})}return i}async function V(e,{translateTo:t=null}={}){let n=[],r=(e.format||``).toLowerCase();if(r===`ttml`||e.lyrics.trim().startsWith(`<tt`)?n=z(e.lyrics):(r===`lrc`||/\[\d{1,2}:\d{1,2}/.test(e.lyrics))&&(n=B(e.lyrics)),!n||n.length===0){let t=e.lyrics.split(`
`).map(e=>e.trim()).filter(e=>!!e&&!e.startsWith(`<`)&&!e.endsWith(`>`)),r=2;n=t.map((e,t)=>{let n=r,i=r+3.5;r+=4;let a=T(e);return{id:`line-${t+1}`,startTime:n,endTime:i,text:e,syllables:C(a,n,i)}})}let i=n.map(e=>e.text).join(` `),a=x(i);a&&(n=S(n));let o=e.language||`und`;a&&(o===`en`||o===`und`)&&(o=`ja`);let s=`${A(o)} (Original)`,c=[{code:o,name:s,isMain:!0,plain:n.map(e=>e.text).join(`
`),lines:n}];if(t&&t!==o)try{let e=await R(n.map(e=>e.text),t);if(e.lines&&e.lines.length===n.length){let r=n.map((t,n)=>{let r=e.lines[n]?.translation||t.text,i=T(r),a=C(i,t.startTime,t.endTime);return{id:`line-trans-${n+1}`,startTime:t.startTime,endTime:t.endTime,text:r,syllables:a}});c.push({code:t,name:`${A(t)} (Traducción)`,isMain:!1,plain:r.map(e=>e.text).join(`
`),lines:r})}}catch(e){console.warn(`No se pudo generar la traducción complementaria:`,e)}let l=e.videoId?`https://music.youtube.com/watch?v=${e.videoId}`:``,u=[{id:`vid-${Date.now()}-0`,name:`Video Oficial (YouTube / YT Music)`,url:l,offset:0}],d={timing:{bpm:120,timeSignature:[4,4],syncMode:`timestamp`,globalOffset:0},styles:{textColor:`#94a3b8`,activeColor:`#fbbf24`,completedColor:`#f59e0b`,translationColor:`#38bdf8`,backgroundColor:`#0f172a`,fontFamily:`Inter, system-ui, -apple-system, sans-serif`,fontSize:`2.1rem`},languages:c},f={title:e.song||`Canción Importada`,artist:e.artist||``,genres:[`Pop`],tags:[`betterlyrics`,e.syncType||`sincronizada`],audioPath:``,videos:u};return{id:null,title:f.title,artist:f.artist,genres:f.genres,tags:f.tags,audio_path:``,videos:u,lyrics_data:d,metadata:f,basic:d}}var H=`https://lrc.red`;async function U({query:e=``,artist:t=``,track:n=``,song:r=``,syncType:i=`all`,limit:a=30}={}){let o=(n||r||``).trim(),s=t.trim(),c=e.trim(),l=``;if(o&&s)l=`${s} ${o}`;else if(o)l=o;else if(c)l=c;else if(s)l=s;else return[];try{let e=`${H}/search.json?q=${encodeURIComponent(l)}`,t=await fetch(e,{method:`GET`,headers:{Accept:`application/json`}});if(!t.ok)throw Error(`LRC.red error HTTP ${t.status}`);let n=await t.json(),r=(Array.isArray(n?.hits)?n.hits:[]).map(e=>({id:`lrcred-${e.isrc}`,rawId:e.isrc,isrc:e.isrc,source:`lrcred`,sourceName:`LRC.red`,song:e.title||`Sin Título`,artist:e.artist||`Artista Desconocido`,album:e.album||``,year:e.year||null,duration:Number(e.duration)||0,artwork:e.cover||null,color:e.color||null,format:`ttml`,syncType:`richsync`,hasSynced:!0,hasRichSync:!0,hasPlain:!1,language:`und`}));return i===`linesync`&&(r=r.filter(e=>e.hasSynced)),r.slice(0,a)}catch(e){return console.warn(`Error al buscar en LRC.red:`,e),[]}}async function W(e,t=null){let n=String(e).replace(/^lrcred-/,``);try{let e=`${H}/s/${n}.json`,r=await fetch(e,{method:`GET`,headers:{Accept:`application/json`}});if(r.ok){let e=await r.json(),i=e.files?.ttml||`${H}/s/${n}.ttml`,a=e.files?.lrc||`${H}/s/${n}.lrc`,o=e.files?.lyricsfile||`${H}/s/${n}.lyricsfile.yaml`,s=[];try{let e=await fetch(i);e.ok&&(s=z(await e.text()))}catch(e){console.warn(`Error obteniendo TTML de LRC.red:`,e)}if(!s||s.length===0)try{let e=await fetch(o);if(e.ok){let t=await e.text();s=m(t).lines||[]}}catch(e){console.warn(`Error obteniendo lyricsfile de LRC.red:`,e)}if(!s||s.length===0)try{let e=await fetch(a);e.ok&&(s=B(await e.text()))}catch(e){console.warn(`Error obteniendo LRC de LRC.red:`,e)}if(s&&s.length>0){let r=e.sync===`line`;return{id:`lrcred-${n}`,rawId:n,isrc:n,source:`lrcred`,sourceName:`LRC.red`,song:e.title||t?.song||`Sin Título`,artist:e.artist||t?.artist||`Artista Desconocido`,album:e.album||t?.album||``,duration:Number(e.duration)||t?.duration||0,sync:e.sync||(r?`line`:`word`),syncType:r?`linesync`:`richsync`,language:e.language||`und`,genres:e.genres||[],songwriters:e.songwriters||[],artwork:e.cover||t?.artwork||null,lines:s}}}}catch(e){console.warn(`Fallo al consultar endpoint JSON de LRC.red:`,e)}try{let e=await fetch(`${H}/s/${n}.ttml`);if(e.ok){let r=z(await e.text());if(r&&r.length>0)return{id:t?.id||`lrcred-${n}`,rawId:n,isrc:n,source:`lrcred`,sourceName:`LRC.red`,song:t?.song||`Sin Título`,artist:t?.artist||`Artista Desconocido`,album:t?.album||``,duration:Number(t?.duration)||0,sync:`word`,syncType:`richsync`,language:t?.language||`und`,genres:[],songwriters:[],artwork:t?.artwork||null,lines:r}}}catch(e){console.warn(`Fallback directo a TTML en LRC.red falló:`,e)}throw Error(`No se pudo obtener la letra desde LRC.red.`)}async function re(e,{translateTo:t=null}={}){let n=e.lines||[],r=n.map(e=>e.text).join(` `),i=x(r);i&&(n=S(n));let a=e.language&&e.language!==`und`?e.language:`und`;i&&(a===`und`||a===`en`)&&(a=`ja`);let o=A(a),s=[{code:a,name:o,isMain:!0,plain:n.map(e=>e.text).join(`
`),lines:n}];if(t&&t!==`none`&&t!==a)try{let e=await R(n.map(e=>e.text),t);if(e.lines&&e.lines.length===n.length){let r=n.map((t,n)=>{let r=e.lines[n]?.translation||t.text,i=T(r),a=C(i,t.startTime,t.endTime);return{id:`line-trans-${n+1}`,startTime:t.startTime,endTime:t.endTime,text:r,syllables:a}});s.push({code:t,name:`${A(t)} (Traducción)`,isMain:!1,plain:r.map(e=>e.text).join(`
`),lines:r})}}catch(e){console.warn(`No se pudo generar traducción complementaria en LRC.red:`,e)}let c={timing:{bpm:120,timeSignature:[4,4],syncMode:`timestamp`,globalOffset:0},styles:{textColor:`#94a3b8`,activeColor:`#fbbf24`,completedColor:`#f59e0b`,translationColor:`#38bdf8`,backgroundColor:`#0f172a`,fontFamily:`Inter, system-ui, -apple-system, sans-serif`,fontSize:`2.1rem`},languages:s},l={title:e.song||`Canción de LRC.red`,artist:e.artist||`Artista Desconocido`,genres:e.genres||[],tags:[`lrcred`,e.sync===`line`?`sincronizada`:`silabas`],audioPath:``,videos:[]};return{id:null,title:l.title,artist:l.artist,genres:l.genres,tags:l.tags,audio_path:``,videos:[],lyrics_data:c,metadata:l,basic:c}}var G=`https://lrclib.net/api`;async function ie({query:e=``,artist:t=``,track:n=``,song:r=``,syncType:i=`all`,limit:a=30}={}){let o=(n||r||``).trim(),s=t.trim(),c=e.trim(),l=``;if(o&&s)l=`${G}/search?track_name=${encodeURIComponent(o)}&artist_name=${encodeURIComponent(s)}`;else if(o)l=`${G}/search?track_name=${encodeURIComponent(o)}`;else if(c)l=`${G}/search?q=${encodeURIComponent(c)}`;else return[];try{let e=await fetch(l,{method:`GET`,headers:{Accept:`application/json`}});if(!e.ok)throw Error(`LRCLIB error HTTP ${e.status}`);let t=await e.json();if(!Array.isArray(t))return[];let n=t.map(e=>({id:`lrclib-${e.id}`,rawId:e.id,source:`lrclib`,sourceName:`LRCLIB`,song:e.trackName||e.name||`Sin Título`,artist:e.artistName||`Artista Desconocido`,album:e.albumName||``,duration:Number(e.duration)||0,format:e.syncedLyrics?`lrc`:`plain`,syncType:e.syncedLyrics?`linesync`:`plain`,hasSynced:!!e.syncedLyrics,hasPlain:!!e.plainLyrics,syncedLyrics:e.syncedLyrics||null,plainLyrics:e.plainLyrics||null,language:`und`}));return i===`linesync`&&(n=n.filter(e=>e.hasSynced)),n.slice(0,a)}catch(e){return console.warn(`Error al buscar en LRCLIB:`,e),[]}}async function K(e,t=null){let n=String(e).replace(/^lrclib-/,``);try{let e=`${G}/get/${n}`,r=await fetch(e,{method:`GET`,headers:{Accept:`application/json`}});if(r.ok){let e=await r.json();return{id:`lrclib-${e.id}`,rawId:e.id,source:`lrclib`,sourceName:`LRCLIB`,song:e.trackName||e.name||t?.song||`Sin Título`,artist:e.artistName||t?.artist||`Artista Desconocido`,album:e.albumName||t?.album||``,duration:Number(e.duration)||t?.duration||0,syncedLyrics:e.syncedLyrics||null,plainLyrics:e.plainLyrics||null}}}catch(e){console.warn(`Fallo al consultar endpoint get de LRCLIB, intentando fallback:`,e)}if(t&&(t.syncedLyrics||t.plainLyrics||t.song))return{id:t.id||`lrclib-${n}`,rawId:t.rawId||n,source:`lrclib`,sourceName:`LRCLIB`,song:t.song||`Sin Título`,artist:t.artist||`Artista Desconocido`,album:t.album||``,duration:Number(t.duration)||0,syncedLyrics:t.syncedLyrics||null,plainLyrics:t.plainLyrics||null};throw Error(`No se pudo obtener la letra desde LRCLIB.`)}async function q(e,{translateTo:t=null}={}){let n=[];if(e.syncedLyrics)n=B(e.syncedLyrics);else if(e.plainLyrics){let t=e.plainLyrics.split(`
`).map(e=>e.trim()).filter(Boolean),r=2;n=t.map((e,t)=>{let n=r,i=r+3;r+=3.5;let a=T(e),o=C(a,n,i);return{id:`line-${t+1}`,startTime:Math.round(n*1e3)/1e3,endTime:Math.round(i*1e3)/1e3,text:e,syllables:o}})}let r=n.map(e=>e.text).join(` `),i=x(r);i&&(n=S(n));let a=[{code:i?`ja`:`und`,name:i?`Japonés (Original)`:`Original`,isMain:!0,plain:n.map(e=>e.text).join(`
`),lines:n}];if(t&&t!==`und`)try{let e=await R(n.map(e=>e.text),t);if(e.lines&&e.lines.length===n.length){let r=n.map((t,n)=>{let r=e.lines[n]?.translation||t.text,i=T(r),a=C(i,t.startTime,t.endTime);return{id:`line-trans-${n+1}`,startTime:t.startTime,endTime:t.endTime,text:r,syllables:a}});a.push({code:t,name:`${A(t)} (Traducción)`,isMain:!1,plain:r.map(e=>e.text).join(`
`),lines:r})}}catch(e){console.warn(`No se pudo generar traducción complementaria en LRCLIB:`,e)}let o={timing:{bpm:120,timeSignature:[4,4],syncMode:`timestamp`,globalOffset:0},styles:{textColor:`#94a3b8`,activeColor:`#fbbf24`,completedColor:`#f59e0b`,translationColor:`#38bdf8`,backgroundColor:`#0f172a`,fontFamily:`Inter, system-ui, -apple-system, sans-serif`,fontSize:`2.1rem`},languages:a},s={title:e.song||`Canción de LRCLIB`,artist:e.artist||`Artista Desconocido`,genres:[],tags:[`lrclib`,e.syncedLyrics?`sincronizada`:`letra-plana`],audioPath:``,videos:[]};return{id:null,title:s.title,artist:s.artist,genres:s.genres,tags:s.tags,audio_path:``,videos:[],lyrics_data:o,metadata:s,basic:o}}var J=`https://api.genius.com`,Y=`saranga_genius_token`;function X(){if(typeof localStorage<`u`){let e=localStorage.getItem(Y);if(e&&e.trim())return e.trim()}return``}function ae(e){typeof localStorage<`u`&&(!e||!e.trim()?localStorage.removeItem(Y):localStorage.setItem(Y,e.trim()))}function oe(){return!!X()}async function se({query:e=``,artist:t=``,song:n=``,limit:r=25}={}){let i=X(),a=t&&n?`${t} ${n}`.trim():(n||t||e).trim();if(!a)return[];if(i)try{let e=`${J}/search?q=${encodeURIComponent(a)}`,t=await fetch(e,{method:`GET`,headers:{Authorization:`Bearer ${i}`,Accept:`application/json`}});if(t.ok)return((await t.json())?.response?.hits||[]).filter(e=>e.type===`song`&&e.result).slice(0,r).map(e=>{let t=e.result;return{id:`genius-${t.id}`,rawId:t.id,source:`genius`,sourceName:`Genius`,song:t.title||`Sin Título`,artist:t.primary_artist?.name||`Artista Desconocido`,album:``,artwork:t.song_art_image_thumbnail_url||t.header_image_thumbnail_url||``,duration:0,format:`plain`,syncType:`plain`,url:t.url||`https://genius.com/songs/${t.id}`,language:`en`}})}catch(e){console.warn(`Error al consultar API de Genius con token:`,e)}try{let e=`https://lrclib.net/api/search?q=${encodeURIComponent(a)}`,t=await fetch(e);if(t.ok){let e=await t.json();if(Array.isArray(e))return e.slice(0,r).map(e=>({id:`genius-fb-${e.id}`,rawId:e.id,source:`genius`,sourceName:`Genius`,song:e.trackName||e.name||`Sin Título`,artist:e.artistName||`Artista Desconocido`,album:e.albumName||``,artwork:``,duration:Number(e.duration)||0,format:e.syncedLyrics?`lrc`:`plain`,syncType:e.syncedLyrics?`linesync`:`plain`,syncedLyrics:e.syncedLyrics||null,plainLyrics:e.plainLyrics||null,language:`und`}))}}catch{}return[]}async function ce(e){let t=e.song||``,n=e.artist||``;if(e.syncedLyrics||e.plainLyrics)return{...e,lyrics:e.syncedLyrics||e.plainLyrics,isSynced:!!e.syncedLyrics};try{let r=`https://lrclib.net/api/get?track_name=${encodeURIComponent(t)}&artist_name=${encodeURIComponent(n)}`,i=await fetch(r);if(i.ok){let t=await i.json();if(t.syncedLyrics||t.plainLyrics)return{...e,lyrics:t.syncedLyrics||t.plainLyrics,isSynced:!!t.syncedLyrics,syncedLyrics:t.syncedLyrics,plainLyrics:t.plainLyrics}}}catch(e){console.warn(`Fallback LRCLIB no disponible para Genius:`,e)}try{let r=`https://api.lyrics.ovh/v1/${encodeURIComponent(n)}/${encodeURIComponent(t)}`,i=await fetch(r);if(i.ok){let t=await i.json();if(t.lyrics)return{...e,lyrics:t.lyrics,isSynced:!1}}}catch(e){console.warn(`Fallback Lyrics.ovh no disponible para Genius:`,e)}throw Error(`No se pudo obtener la letra para "${t}" de ${n}.`)}async function le(e,{translateTo:t=null}={}){let n=[],r=e.lyrics||e.plainLyrics||``;if((e.syncedLyrics||/\[\d{1,2}:\d{1,2}/.test(r))&&(n=B(e.syncedLyrics||r)),!n||n.length===0){let e=r.split(`
`).map(e=>e.trim()).filter(e=>!!e&&!e.startsWith(`[`)&&!e.endsWith(`]`)),t=2;n=e.map((e,n)=>{let r=t,i=t+3;t+=3.5;let a=T(e),o=C(a,r,i);return{id:`line-${n+1}`,startTime:Math.round(r*1e3)/1e3,endTime:Math.round(i*1e3)/1e3,text:e,syllables:o}})}let i=n.map(e=>e.text).join(` `),a=x(i);a&&(n=S(n));let o=e.language||`und`;a&&(o===`en`||o===`und`)&&(o=`ja`);let s=`${A(o)} (Original)`,c=[{code:o,name:s,isMain:!0,plain:n.map(e=>e.text).join(`
`),lines:n}];if(t&&t!==o)try{let e=await R(n.map(e=>e.text),t);if(e.lines&&e.lines.length===n.length){let r=n.map((t,n)=>{let r=e.lines[n]?.translation||t.text,i=T(r),a=C(i,t.startTime,t.endTime);return{id:`line-trans-${n+1}`,startTime:t.startTime,endTime:t.endTime,text:r,syllables:a}});c.push({code:t,name:`${A(t)} (Traducción)`,isMain:!1,plain:r.map(e=>e.text).join(`
`),lines:r})}}catch(e){console.warn(`No se pudo generar traducción complementaria en Genius:`,e)}let l={timing:{bpm:120,timeSignature:[4,4],syncMode:`timestamp`,globalOffset:0},styles:{textColor:`#94a3b8`,activeColor:`#fbbf24`,completedColor:`#f59e0b`,translationColor:`#38bdf8`,backgroundColor:`#0f172a`,fontFamily:`Inter, system-ui, -apple-system, sans-serif`,fontSize:`2.1rem`},languages:c},u={title:e.song||`Canción de Genius`,artist:e.artist||`Artista Desconocido`,genres:[],tags:[`genius`],audioPath:``,videos:[]};return{id:null,title:u.title,artist:u.artist,genres:u.genres,tags:u.tags,audio_path:``,videos:[],lyrics_data:l,metadata:u,basic:l}}var ue=[{id:`all`,name:`Todas las Fuentes`,badge:`Todas`},{id:`betterlyrics`,name:`BetterLyrics`,badge:`BetterLyrics`},{id:`lrcred`,name:`LRC.red`,badge:`LRC.red`},{id:`genius`,name:`Genius`,badge:`Genius`},{id:`lrclib`,name:`LRCLIB`,badge:`LRCLIB`},{id:`youtube`,name:`YouTube`,badge:`YouTube`}];async function Z(e={}){let{provider:t=`all`,query:n=``,artist:r=``,song:i=``,videoId:a=``,mode:o=`general`,strictArtist:s=!1,syncType:c=`all`,limit:l=40}=e;if(t===`betterlyrics`)return(await I(e)).map(e=>({...e,source:`betterlyrics`,sourceName:`BetterLyrics`}));if(t===`lrcred`)return(await U({query:n,artist:r,track:i,song:i,syncType:c,limit:l})).map(e=>({...e,source:`lrcred`,sourceName:`LRC.red`}));if(t===`genius`)return(await se({query:n,artist:r,song:i,limit:l})).map(e=>({...e,source:`genius`,sourceName:`Genius`}));if(t===`lrclib`)return(await ie({query:n,artist:r,track:i,syncType:c,limit:l})).map(e=>({...e,source:`lrclib`,sourceName:`LRCLIB`}));let u=(n||`${r} ${i}`).trim(),d=[I({mode:`general`,query:u,syncType:c,limit:15}).then(e=>e.slice(0,6).map(e=>({...e,source:`betterlyrics`,sourceName:`BetterLyrics`}))),U({query:u,artist:r.trim(),song:i.trim(),syncType:c,limit:15}).then(e=>e.slice(0,6).map(e=>({...e,source:`lrcred`,sourceName:`LRC.red`}))),ie({query:u,artist:r.trim(),track:i.trim(),syncType:c,limit:15}).then(e=>e.slice(0,6).map(e=>({...e,source:`lrclib`,sourceName:`LRCLIB`}))),se({query:u,artist:r.trim(),song:i.trim(),limit:15}).then(e=>e.slice(0,6).map(e=>({...e,source:`genius`,sourceName:`Genius`})))],f=await Promise.allSettled(d),p=[];return f.forEach(e=>{e.status===`fulfilled`&&Array.isArray(e.value)&&p.push(...e.value.slice(0,6))}),p.sort((e,t)=>{let n=e=>{let t=0;return e.syncType===`richsync`?t+=100:e.syncType===`linesync`&&(t+=50),e.videoId&&(t+=25),e.artwork&&(t+=10),t};return n(t)-n(e)}).slice(0,l)}async function de(e,t){if(e===`betterlyrics`)return await L(t.id,t.videoId,t.song,t.artist);if(e===`lrcred`)return await W(t.rawId||t.isrc||t.id,t);if(e===`lrclib`)return await K(t.rawId||t.id,t);if(e===`genius`)return await ce(t);if(e===`youtube`)return{title:t.song||t.title||`Canción de YouTube`,artist:t.artist||`Artista Desconocido`,videoId:t.videoId||``,videoUrl:t.videoUrl||(t.videoId?`https://www.youtube.com/watch?v=${t.videoId}`:``),artwork:t.artwork||``};throw Error(`Proveedor de letras desconocido: "${e}".`)}async function fe(e,t,n){if(e===`betterlyrics`)return await V(t,n);if(e===`lrcred`)return await re(t,n);if(e===`lrclib`)return await q(t,n);if(e===`genius`)return await le(t,n);if(e===`youtube`)return{version:`1.1.0`,metadata:{title:t.title,artist:t.artist,genres:[],tags:[],audioPath:``,artwork:t.artwork||``,source:`youtube`,videos:t.videoUrl?[{id:`vid-${Date.now()}-0`,name:`Video Oficial`,url:t.videoUrl,offset:0}]:[]},basic:{languages:[{code:`es`,name:`Original`,isMain:!0,phrases:[]}]},advanced:{enabled:!1,effects:[]}};throw Error(`Proveedor de letras desconocido: "${e}".`)}async function pe(e,t={}){let{onLyricsReady:n,onProgress:i,translateTo:a=null}=t,o=e.source||`betterlyrics`;i&&i(`Descargando letra desde ${e.sourceName||o}...`);let s=await de(o,e);if(n&&a&&a!==`none`){i&&i(`Letra obtenida. Procesando versos y sincronización...`);let e=await fe(o,s,{...t,translateTo:null}),c=r(e),l=w(c);n(l);let u=l.lyrics_data?.languages?.find(e=>e.isMain)||l.lyrics_data?.languages?.[0];if(u&&u.code===a)return l;i&&i(`Traduciendo frases a ${a}...`);try{let e=await fe(o,s,t),n=r(e);return w(n)}catch(e){return console.warn(`Error al traducir progresivamente:`,e),l}}let c=await fe(o,s,t),l=r(c),u=w(l);return n&&n(u),u}function me(e){if(!e)return null;let t=String(e).trim();try{let e=new URL(t.startsWith(`http`)?t:`https://${t}`);if(e.searchParams.has(`list`)){let t=e.searchParams.get(`list`);if(t&&t.length>=2)return t}}catch{}let n=t.match(/[?&]list=([a-zA-Z0-9_-]+)/);return n?n[1]:/^(?:PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(t)?t:null}function he(e){if(!e)return[];let t=e.split(/[\r\n,]+/),n=[],r=new Set;for(let e of t){let t=e.trim();if(!t)continue;let a=i(t);a&&!r.has(a)&&(r.add(a),n.push(a))}return n}function ge(e,t=``){let n=(t||``).trim();n=n.replace(/\s*-\s*Topic$/i,``).replace(/\s*VEVO$/i,``).trim();let r=(e||``).trim();for(let e of[/\s*[\(\[](?:[^\)\]]*(?:official|video|audio|remaster|4k|hd|live|visualizer|clip|lyric)[^\)\]]*)[\)\]]/gi,/\s*[\(\[]\s*[\)\]]/g])r=r.replace(e,``).trim();let i=r.match(/^(.*?)\s*[-–—]\s*(.*)$/);return i&&i[1].trim()&&i[2].trim()?{artist:i[1].trim(),title:i[2].trim()}:{artist:n||`Artista Desconocido`,title:r||`Canción de YouTube`}}async function _e(e){if(!e)throw Error(`ID de video de YouTube no especificado.`);let t=`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(e)}&format=json`,n=await fetch(t);if(!n.ok)throw Error(`No se pudo obtener información del video ${e} (código ${n.status})`);let r=await n.json(),i=ge(r.title,r.author_name);return{videoId:e,title:i.title,artist:i.artist,rawTitle:r.title||``,authorName:r.author_name||``,thumbnail:r.thumbnail_url||`https://i.ytimg.com/vi/${e}/hqdefault.jpg`,videoUrl:`https://www.youtube.com/watch?v=${e}`}}async function ve(e,{timeoutMs:t=15e3}={}){let n=me(e)||e;if(!n)throw Error(`Identificador de playlist de YouTube inválido.`);let r=await a();if(!r||!r.Player)throw Error(`No se pudo inicializar la API IFrame de YouTube.`);return new Promise((e,i)=>{let a=!1,o=null,s=null,c=document.createElement(`div`),l=`yt-temp-pl-${Date.now()}-${Math.floor(Math.random()*1e3)}`;c.id=l,c.style.cssText=`position:fixed;width:200px;height:200px;right:0;bottom:0;opacity:0.01;pointer-events:none;z-index:-9999;`,document.body.appendChild(c);let u=setTimeout(()=>{d(),a||i(Error(`Tiempo de espera agotado al consultar la lista en YouTube. Verifica que sea pública.`))},t);function d(){if(clearTimeout(u),s&&=(clearInterval(s),null),o&&typeof o.destroy==`function`)try{o.destroy()}catch{}c.parentNode&&c.parentNode.removeChild(c)}function f(){if(!a&&o)try{if(typeof o.getPlaylist==`function`){let t=o.getPlaylist();Array.isArray(t)&&t.length>0&&(a=!0,d(),e(t))}}catch{}}let p=typeof window<`u`&&window.location&&window.location.origin?window.location.origin:`https://localhost`;try{o=new r.Player(l,{height:`200`,width:`200`,host:`https://www.youtube.com`,playerVars:{listType:`playlist`,list:n,origin:p,enablejsapi:1,autoplay:0,controls:0,rel:0,playsinline:1},events:{onReady:e=>{try{typeof e.target.cuePlaylist==`function`&&e.target.cuePlaylist({listType:`playlist`,list:n})}catch{}f()},onStateChange:()=>{f()},onError:e=>{if(f(),!a){try{typeof o.nextVideo==`function`&&o.nextVideo()}catch{}setTimeout(f,300),setTimeout(f,800),setTimeout(()=>{if(f(),!a){d();let t=e?.data||`desconocido`,n=``;(t===150||t===101)&&(n=` (los propietarios de los videos de esta lista restringen la inserción o reproducción en reproductores externos). Tip: Podés copiar y pegar las URLs de los videos directamente en este cuadro para importarlos todos juntos.`),i(Error(`Error de YouTube al consultar la lista: código ${t}${n}`))}},1500)}}}}),s=setInterval(f,150)}catch(e){d(),i(e)}})}async function ye(e,{onProgress:t=null,batchSize:n=4}={}){let r=[],i=e.length;for(let a=0;a<i;a+=n){let o=e.slice(a,a+n),s=o.map(async e=>{try{return await _e(e)}catch{return{videoId:e,title:`Video ${e}`,artist:`Artista Desconocido`,rawTitle:``,authorName:``,thumbnail:`https://i.ytimg.com/vi/${e}/hqdefault.jpg`,videoUrl:`https://www.youtube.com/watch?v=${e}`}}}),c=await Promise.all(s);r.push(...c),t&&t(Math.min(a+o.length,i),i)}return r}function be(e){let t=e.videoId||``,n=e.videoUrl||(t?`https://www.youtube.com/watch?v=${t}`:``);return{version:`1.1.0`,metadata:{title:e.title||`Sin Título`,artist:e.artist||`Artista Desconocido`,genres:[],tags:[],audioPath:``,artwork:e.thumbnail||``,source:`youtube`,videos:n?[{id:`vid-${Date.now()}-0`,name:`Video Oficial`,url:n,offset:0}]:[]},basic:{languages:[{code:`es`,name:`Original`,isMain:!0,phrases:[]}]},advanced:{enabled:!1,effects:[]}}}async function xe(e,{libraryName:t=``}={}){if(!Array.isArray(e)||e.length===0)return[];let n=null,r=(t||``).trim();if(r){let e=(await v()).find(e=>e.name.toLowerCase()===r.toLowerCase());n=e?e.id:(await _(r)).id}let i=[];for(let t of e){let e={title:t.title||`Sin Título`,artist:t.artist||`Artista Desconocido`,audio_path:``,videos:[{id:`vid-${Date.now()}-${Math.floor(Math.random()*1e3)}`,name:`Video Oficial`,url:t.videoUrl||`https://www.youtube.com/watch?v=${t.videoId}`,offset:0}],lyrics_data:{languages:[{code:`es`,name:`Original`,isMain:!0,phrases:[]}]},visuals_data:{enabled:!1,effects:[]}},r=await o(e);n&&await u(r,n),i.push({songId:r,title:e.title,artist:e.artist})}return i}function Q(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}function $({containerElement:r,onSongReady:a,onCreateEmptySong:o,onImportSuccess:u,onConflictChoice:m}){let _=!1,v=`all`,x=`general`,S=`general`,C=``,w=``,T=``,E=``,D=``,O=!0,k=`all`,A=`es`,j=``,M=``,N=[],P=`Playlist de YouTube`,F=!1,I=X(),L=!1,R=!1,z=[],B=``,V=`info`,H=null,U=``,W=null;function re(){_&&G()}function G(){if(!r||!_)return;let e=r.querySelector(`.online-lyrics-modal-dialog`),t=r.querySelector(`.online-modal-body`);if(!e||!t)return;let n=window.innerWidth<=768||window.innerHeight<=520,i=r.querySelector(`.online-providers-bar`),a=r.querySelector(`.online-inputs-container`),o=r.querySelector(`.online-options-bar`),s=r.querySelector(`.status-alert`),c=(i?i.offsetHeight:0)+(a?a.offsetHeight:0)+(o?o.offsetHeight:0)+(s?s.offsetHeight:0)+36,l=t.clientHeight-c<260;n||l?(e.classList.add(`layout-scroll-controls`),e.classList.remove(`layout-fixed-controls`)):(e.classList.add(`layout-fixed-controls`),e.classList.remove(`layout-scroll-controls`))}function ie(){_=!0,R=!1,H=null,L=!1,B=``,I=X(),window.addEventListener(`resize`,re),$(),q()}function K(){_=!1,R=!1,H=null,B=``,window.removeEventListener(`resize`,re),W&&=(W.disconnect(),null),$()}function q(){setTimeout(()=>{if(!r)return;let e=null;v===`all`?e=r.querySelector(`#online-input-all`):v===`youtube`?e=r.querySelector(`#youtube-input-url`):v===`betterlyrics`?x===`general`?e=r.querySelector(`#bl-input-general`):x===`artist`?e=r.querySelector(`#bl-input-artist`):x===`artist_song`?e=r.querySelector(`#bl-input-as-artist`):x===`video`&&(e=r.querySelector(`#bl-input-video`)):e=S===`general`?r.querySelector(`#provider-input-general`):r.querySelector(`#provider-input-artist`),e&&e.focus()},80)}function J(){if(!r)return;let e=r.querySelector(`#online-input-all`);e&&(C=e.value.trim());let t=r.querySelector(`#bl-input-general`);t&&(w=t.value.trim());let n=r.querySelector(`#bl-input-artist`);n&&(T=n.value.trim());let i=r.querySelector(`#bl-input-as-artist`);i&&(T=i.value.trim());let a=r.querySelector(`#bl-input-as-song`);a&&(E=a.value.trim());let o=r.querySelector(`#bl-input-video`);o&&(D=o.value.trim());let s=r.querySelector(`#bl-check-strict`);s&&(O=s.checked);let c=r.querySelector(`#provider-input-general`);c&&(C=c.value.trim());let l=r.querySelector(`#provider-input-artist`);l&&(T=l.value.trim());let u=r.querySelector(`#provider-input-song`);u&&(E=u.value.trim());let d=r.querySelector(`#online-select-translate`);d&&(A=d.value);let f=r.querySelector(`#youtube-input-url`);f&&(j=f.value.trim());let p=r.querySelector(`#yt-library-name-input`);p&&(P=p.value.trim());let m=r.querySelector(`#yt-edit-title`);m&&N.length===1&&(N[0].title=m.value.trim());let h=r.querySelector(`#yt-edit-artist`);h&&N.length===1&&(N[0].artist=h.value.trim())}async function Y(){if(J(),!j){B=`Ingresá un enlace de video, de playlist o varios enlaces de YouTube.`,V=`error`,$();return}L=!0,B=``,M=`Analizando enlace...`,$();try{let e=me(j),t=j.includes(`playlist?list=`)||/^(?:PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(j.trim())&&!j.includes(`watch?v=`);if(e&&(t||!i(j))){M=`Consultando canciones de la lista de YouTube...`,$();let t=await ve(e);if(!t||t.length===0)throw Error(`No se encontraron videos en la lista o la lista es privada.`);M=`Obteniendo información de ${t.length} canciones...`,$();let n=await ye(t,{onProgress:(e,t)=>{M=`Obteniendo datos de canciones (${e} de ${t})...`,$()}});N=n.map(e=>({...e,isSelected:!0})),B=`Se obtuvieron ${n.length} canciones de la lista.`,V=`success`}else{let t=he(j);if(t.length>1){M=`Obteniendo información de ${t.length} videos...`,$();let e=await ye(t,{onProgress:(e,t)=>{M=`Obteniendo datos (${e} de ${t})...`,$()}});N=e.map(e=>({...e,isSelected:!0})),B=`Se obtuvieron ${e.length} canciones.`,V=`success`}else if(t.length===1){let e=t[0];M=`Obteniendo metadatos del video...`,$(),N=[{...await _e(e),isSelected:!0}],B=`Información del video obtenida con éxito.`,V=`success`}else if(e){M=`Consultando canciones de la lista de YouTube...`,$();let t=await ye(await ve(e),{onProgress:(e,t)=>{M=`Obteniendo datos (${e} de ${t})...`,$()}});N=t.map(e=>({...e,isSelected:!0})),B=`Se obtuvieron ${t.length} canciones de la lista.`,V=`success`}else throw Error(`No se pudo reconocer un enlace válido de video o de playlist de YouTube / YouTube Music.`)}}catch(e){console.error(`Error al extraer de YouTube:`,e),B=e.message||`Error al procesar el enlace de YouTube.`,V=`error`}finally{L=!1,M=``,$()}}async function se(){if(!N||N.length===0)return;J();let e=N[0],t=be(e);K(),a&&a(t,{initialStatus:{message:`Canción "${e.title}" cargada desde YouTube (sin letras). ¡Lista para reproducir o editar!`,type:`success`},sourceName:`YouTube`})}async function ce(){if(!N||N.length===0)return;J();let e=N[0];R=!0,$();try{await xe([e]),K(),u&&u(`Canción "${e.title}" guardada exitosamente en el catálogo.`)}catch(e){console.error(`Error al guardar canción de YouTube en catálogo:`,e),B=`Error al guardar canción: `+e.message,V=`error`,R=!1,$()}}async function le(){J();let e=N.filter(e=>e.isSelected);if(e.length===0){B=`Seleccioná al menos una canción para importar.`,V=`error`,$();return}R=!0,B=``,$();try{let t=await xe(e,{libraryName:P});if(K(),u){let e=P?` en la biblioteca "${P}"`:``;u(`Se importaron ${t.length} canciones desde YouTube${e} sin letras.`)}}catch(e){console.error(`Error al importar canciones de YouTube:`,e),B=`Error al importar canciones: `+e.message,V=`error`,R=!1,$()}}async function de(){J();let e=``;if(v===`all`?C||(e=`Ingresá un término para buscar en todas las fuentes.`):v===`betterlyrics`?x===`general`&&!w?e=`Ingresá un término para buscar en BetterLyrics.`:x===`artist`&&!T?e=`Ingresá el nombre del artista o banda.`:x===`artist_song`&&!T&&!E?e=`Ingresá al menos el artista o la canción.`:x===`video`&&!D&&(e=`Pegá el enlace de YouTube o el Video ID.`):S===`general`&&!C?e=`Ingresá un término para buscar.`:S===`artist_song`&&!T&&!E&&(e=`Ingresá al menos el artista o la canción.`),e){B=e,V=`error`,$();return}L=!0,B=``,$();try{let e=[],t=k;v===`all`?(e=await Z({provider:`all`,query:C,syncType:t}),U=`Búsqueda unificada en todas las fuentes: "${C}"`):v===`betterlyrics`?(e=await Z({provider:`betterlyrics`,mode:x,query:w,artist:T,song:E,videoId:D,strictArtist:O,syncType:t}),U=`Búsqueda en BetterLyrics (${x}): "${w||T||D}"`):v===`lrcred`?(e=await Z({provider:`lrcred`,query:S===`general`?C:``,artist:S===`artist_song`?T:``,song:S===`artist_song`?E:``,syncType:t}),U=`Búsqueda en LRC.red: "${S===`general`?C:`${T} - ${E}`}"`):v===`genius`?(e=await Z({provider:`genius`,query:S===`general`?C:``,artist:S===`artist_song`?T:``,song:S===`artist_song`?E:``}),U=`Búsqueda en Genius: "${S===`general`?C:`${T} - ${E}`}"`):v===`lrclib`&&(e=await Z({provider:`lrclib`,query:S===`general`?C:``,artist:S===`artist_song`?T:``,song:S===`artist_song`?E:``,syncType:t}),U=`Búsqueda en LRCLIB: "${S===`general`?C:`${T} - ${E}`}"`),z=e,e.length===0?(B=`No se encontraron resultados para la búsqueda ingresada.`,V=`info`):(B=`Se encontraron ${e.length} resultado(s).`,V=`success`)}catch(e){console.error(`Error al buscar canciones online:`,e),B=`Ocurrió un error al consultar los motores de búsqueda: `+(e.message||e),V=`error`}finally{L=!1,$()}}async function fe(e){if(R)return;R=!0,H=e.id;let t=A===`none`?null:A,n=e.sourceName||`el proveedor`,r={title:e.song||``,artist:e.artist||``,metadata:{title:e.song||``,artist:e.artist||``,album:e.album||``,duration:e.duration||0,artwork:e.artwork||``,source:e.sourceName||e.source||``},videos:e.videoId?[{id:`vid-${Date.now()}-0`,name:`Video Oficial`,url:`https://www.youtube.com/watch?v=${e.videoId}`,offset:0}]:[],lyrics_data:{languages:[{code:`es`,name:`Principal`,isMain:!0,plain:``,lines:[]}]}};K();let i=null,o=pe(e,{translateTo:t,onProgress:e=>{i?.onProgress&&i.onProgress(e)},onLyricsReady:e=>{i?.onLyricsReady&&i.onLyricsReady(e)}});a&&a(r,{loadPromise:o,initialStatus:{message:`Obteniendo letra desde ${n}...`,type:`info`},sourceName:n,translateTo:t,registerProgressCallbacks:e=>{i=e}});try{await o}catch(e){console.error(`Error al procesar letra seleccionada:`,e)}finally{R=!1,H=null}}function ge(e){ae(e),I=X(),B=oe()?`¡Token de Genius guardado exitosamente!`:`Token de Genius removido.`,V=`success`,$()}function $(){if(!r)return;if(!_){r.innerHTML=``,r.classList.remove(`is-open`);return}r.classList.add(`is-open`);let i=ue.map(t=>{let n=v===t.id,r=f;return t.id===`betterlyrics`?r=c:t.id===`lrcred`?r=ne:t.id===`genius`?r=b:t.id===`lrclib`?r=p:t.id===`youtube`&&(r=e),`
        <button
          type="button"
          class="online-provider-tab ${n?`is-active`:``} tab-prov-${t.id}"
          data-provider="${t.id}"
        >
          ${r} <span>${t.name}</span>
        </button>
      `}).join(``),a=``;if(v===`all`)a=`
        <div class="online-inputs-container">
          <div class="search-input-group">
            <div class="input-wrapper">
                <span class="search-input-icon">${y}</span>
                <input
                  type="text"
                  id="online-input-all"
                  class="form-input search-main-input"
                  placeholder="Buscar título, artista o enlace (BetterLyrics + LRC.red + LRCLIB + Genius)..."
                  value="${Q(C)}"
                />
            </div>
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
              ${L?`Buscando...`:`${y} Buscar en Todo`}
            </button>
          </div>
          <p class="search-hint-text">
            Consulta en todas las fuentes a la vez (max 6 resultados).
          </p>
        </div>
      `;else if(v===`betterlyrics`){let e=[{id:`general`,label:`General / Video`},{id:`artist`,label:`Solo por Artista`},{id:`artist_song`,label:`Artista y Título`},{id:`video`,label:`Enlace / Video YouTube`}].map(e=>`
        <button
          type="button"
          class="bl-mode-tab ${x===e.id?`is-active`:``}"
          data-bl-mode="${e.id}"
        >
          ${e.label}
        </button>
      `).join(``),t=``;x===`general`?t=`
          <div class="search-input-group">
            <div class="input-wrapper">
                <span class="search-input-icon">${y}</span>
                <input
                  type="text"
                  id="bl-input-general"
                  class="form-input search-main-input"
                  placeholder="Buscar canción, artista o pegar enlace de YouTube..."
                  value="${Q(w)}"
                />
            </div>
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
              ${L?`Buscando...`:`${y} Buscar`}
            </button>
          </div>
        `:x===`artist`?t=`
          <div class="bl-artist-mode-container">
            <div class="search-input-group">
                <div class="input-wrapper">
                  <span class="search-input-icon">${y}</span>
                  <input
                    type="text"
                    id="bl-input-artist"
                    class="form-input search-main-input"
                    placeholder="Nombre exacto del artista (ej. Queen, Soda Stereo, Coldplay)..."
                    value="${Q(T)}"
                  />
                </div>
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
                ${L?`Buscando...`:`${y} Buscar Artista`}
              </button>
            </div>
            <label class="bl-strict-checkbox-label" title="Descarta canciones de otros artistas que incluyan la palabra en el título">
              <input type="checkbox" id="bl-check-strict" ${O?`checked`:``} />
              <span>Filtro estricto: mostrar <strong>exclusivamente</strong> canciones interpretadas por este artista</span>
            </label>
          </div>
        `:x===`artist_song`?t=`
          <div class="bl-dual-inputs-grid">
            <div class="input-with-label">
              <label for="bl-input-as-artist" class="field-sublabel">Artista / Banda:</label>
              <input
                type="text"
                id="bl-input-as-artist"
                class="form-input"
                placeholder="ej. Queen"
                value="${Q(T)}"
              />
            </div>
            <div class="input-with-label">
              <label for="bl-input-as-song" class="field-sublabel">Título de la Canción:</label>
              <input
                type="text"
                id="bl-input-as-song"
                class="form-input"
                placeholder="ej. Bohemian Rhapsody"
                value="${Q(E)}"
              />
            </div>
            <div class="dual-search-btn-col">
              <label class="field-sublabel">&nbsp;</label>
              <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${L?`disabled`:``}>
                ${L?`Buscando...`:`${y} Buscar`}
              </button>
            </div>
          </div>
        `:x===`video`&&(t=`
          <div class="search-input-group">
            <div class="input-wrapper">
                <span class="search-input-icon">${l}</span>
                <input
                  type="text"
                  id="bl-input-video"
                  class="form-input search-main-input"
                  placeholder="Pegá el enlace de YouTube o YouTube Music (o el ID de 11 caracteres)..."
                  value="${Q(D)}"
                />
            </div>
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
              ${L?`Buscando...`:`${y} Sincronizar`}
            </button>
          </div>
        `),a=`
        <div class="online-inputs-container">
          <div class="bl-modes-bar">${e}</div>
          ${t}
          <!-- Filtros de sincronización -->
          <div class="bl-filters-bar">
            <span class="filter-label">Tipo de sincronización:</span>
            <div class="bl-filter-pills">
              <button type="button" class="bl-filter-pill ${k===`all`?`is-active`:``}" data-sync="all">Todas</button>
              <button type="button" class="bl-filter-pill ${k===`richsync`?`is-active`:``}" data-sync="richsync">${c} Sílabas (TTML)</button>
              <button type="button" class="bl-filter-pill ${k===`linesync`?`is-active`:``}" data-sync="linesync">${b} Por Versos (LRC)</button>
            </div>
          </div>
        </div>
      `}else if(v===`lrcred`)a=`
        <div class="online-inputs-container">
          <div class="bl-modes-bar">
            <button type="button" class="bl-mode-tab ${S===`general`?`is-active`:``}" data-submode="general">Búsqueda General</button>
            <button type="button" class="bl-mode-tab ${S===`artist_song`?`is-active`:``}" data-submode="artist_song">Artista y Canción</button>
          </div>

          ${S===`general`?`
            <div class="search-input-group">
                <div class="input-wrapper">
                  <span class="search-input-icon">${y}</span>
                  <input
                    type="text"
                    id="provider-input-general"
                    class="form-input search-main-input"
                    placeholder="Buscar canción, artista o álbum en LRC.red..."
                    value="${Q(C)}"
                  />
                </div>
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
                ${L?`Buscando...`:`${y} Buscar en LRC.red`}
              </button>
            </div>
          `:`
            <div class="bl-dual-inputs-grid">
              <div class="input-with-label">
                <label for="provider-input-artist" class="field-sublabel">Artista / Banda:</label>
                <input
                  type="text"
                  id="provider-input-artist"
                  class="form-input"
                  placeholder="ej. Queen"
                  value="${Q(T)}"
                />
              </div>
              <div class="input-with-label">
                <label for="provider-input-song" class="field-sublabel">Canción:</label>
                <input
                  type="text"
                  id="provider-input-song"
                  class="form-input"
                  placeholder="ej. Bohemian Rhapsody"
                  value="${Q(E)}"
                />
              </div>
              <div class="dual-search-btn-col">
                <label class="field-sublabel">&nbsp;</label>
                <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${L?`disabled`:``}>
                  ${L?`Buscando...`:`${y} Buscar`}
                </button>
              </div>
            </div>
          `}

          <div class="bl-filters-bar">
            <span class="filter-label">Filtro de formato:</span>
            <div class="bl-filter-pills">
              <button type="button" class="bl-filter-pill ${k===`all`?`is-active`:``}" data-sync="all">Todas</button>
              <button type="button" class="bl-filter-pill ${k===`linesync`?`is-active`:``}" data-sync="linesync">${b} Sincronizadas</button>
            </div>
          </div>
        </div>
      `;else if(v===`genius`){let e=oe();a=`
        <div class="online-inputs-container">
          <!-- Token banner -->
          <div class="genius-token-bar">
            <div class="token-status-left">
              <span class="token-badge ${e?`badge-token-active`:`badge-token-optional`}">
                ${e?`Token de Genius Activo ✓`:`Genius API (Token opcional)`}
              </span>
              <span class="token-help">
                <a href="https://genius.com/api-clients" target="_blank" rel="noopener noreferrer" class="token-external-link">
                  Obtener token gratuito en Genius.com
                </a>
              </span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-toggle-genius-token">
              ${F?`Ocultar`:`Configurar Token`}
            </button>
          </div>

          ${F?`
            <div class="genius-token-form">
              <input
                type="text"
                id="input-genius-token"
                class="form-input token-input"
                placeholder="Pega aquí tu Client Access Token de Genius..."
                value="${Q(I)}"
              />
              <button type="button" class="btn btn-outline btn-sm" id="btn-save-genius-token">
                Guardar Token
              </button>
            </div>
          `:``}

          <!-- Selector de Modo Genius -->
          <div class="bl-modes-bar">
            <button type="button" class="bl-mode-tab ${S===`general`?`is-active`:``}" data-submode="general">Búsqueda General</button>
            <button type="button" class="bl-mode-tab ${S===`artist_song`?`is-active`:``}" data-submode="artist_song">Artista y Título</button>
          </div>

          ${S===`general`?`
            <div class="search-input-group">
                <div class="input-wrapper">
                  <span class="search-input-icon">${y}</span>
                  <input
                    type="text"
                    id="provider-input-general"
                    class="form-input search-main-input"
                    placeholder="Buscar canción o artista en Genius.com..."
                    value="${Q(C)}"
                  />
                </div>
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
                ${L?`Buscando...`:`${y} Buscar en Genius`}
              </button>
            </div>
          `:`
            <div class="bl-dual-inputs-grid">
              <div class="input-with-label">
                <label for="provider-input-artist" class="field-sublabel">Artista / Banda:</label>
                <input
                  type="text"
                  id="provider-input-artist"
                  class="form-input"
                  placeholder="ej. Queen"
                  value="${Q(T)}"
                />
              </div>
              <div class="input-with-label">
                <label for="provider-input-song" class="field-sublabel">Canción:</label>
                <input
                  type="text"
                  id="provider-input-song"
                  class="form-input"
                  placeholder="ej. Bohemian Rhapsody"
                  value="${Q(E)}"
                />
              </div>
              <div class="dual-search-btn-col">
                <label class="field-sublabel">&nbsp;</label>
                <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${L?`disabled`:``}>
                  ${L?`Buscando...`:`${y} Buscar`}
                </button>
              </div>
            </div>
          `}
        </div>
      `}else v===`lrclib`?a=`
        <div class="online-inputs-container">
          <div class="bl-modes-bar">
            <button type="button" class="bl-mode-tab ${S===`general`?`is-active`:``}" data-submode="general">Búsqueda General</button>
            <button type="button" class="bl-mode-tab ${S===`artist_song`?`is-active`:``}" data-submode="artist_song">Artista y Canción</button>
          </div>

          ${S===`general`?`
            <div class="search-input-group">
                <div class="input-wrapper">
                  <span class="search-input-icon">${y}</span>
                  <input
                    type="text"
                    id="provider-input-general"
                    class="form-input search-main-input"
                    placeholder="Buscar canción o artista en LRCLIB..."
                    value="${Q(C)}"
                  />
                </div>
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${L?`disabled`:``}>
                ${L?`Buscando...`:`${y} Buscar en LRCLIB`}
              </button>
            </div>
          `:`
            <div class="bl-dual-inputs-grid">
              <div class="input-with-label">
                <label for="provider-input-artist" class="field-sublabel">Artista / Banda:</label>
                <input
                  type="text"
                  id="provider-input-artist"
                  class="form-input"
                  placeholder="ej. Queen"
                  value="${Q(T)}"
                />
              </div>
              <div class="input-with-label">
                <label for="provider-input-song" class="field-sublabel">Canción:</label>
                <input
                  type="text"
                  id="provider-input-song"
                  class="form-input"
                  placeholder="ej. Bohemian Rhapsody"
                  value="${Q(E)}"
                />
              </div>
              <div class="dual-search-btn-col">
                <label class="field-sublabel">&nbsp;</label>
                <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${L?`disabled`:``}>
                  ${L?`Buscando...`:`${y} Buscar`}
                </button>
              </div>
            </div>
          `}

          <div class="bl-filters-bar">
            <span class="filter-label">Filtro de formato:</span>
            <div class="bl-filter-pills">
              <button type="button" class="bl-filter-pill ${k===`all`?`is-active`:``}" data-sync="all">Todas</button>
              <button type="button" class="bl-filter-pill ${k===`linesync`?`is-active`:``}" data-sync="linesync">${b} Sincronizadas (LRC)</button>
            </div>
          </div>
        </div>
      `:v===`youtube`&&(a=`
        <div class="online-inputs-container youtube-inputs-container">
          <div class="input-with-label">
            <label for="youtube-input-url" class="field-sublabel">Enlace de Video o Lista de Reproducción de YouTube / YouTube Music:</label>
            <textarea
              id="youtube-input-url"
              class="form-input youtube-url-input"
              rows="2"
              placeholder="Pegá un enlace de video, shorts o playlist."
            >${Q(j)}</textarea>
          </div>
          <div class="youtube-controls-bar">
            <p class="search-hint-text">
              Soporta videos o playlists de YouTube y YouTube Music, o listas de URLs (una por línea).
            </p>
            <button type="button" class="btn btn-primary" id="btn-do-youtube-extract" ${L?`disabled`:``}>
              ${L?M||`Extrayendo...`:`${e} Extraer de YouTube`}
            </button>
          </div>
        </div>
      `);let o=``;if(v===`youtube`){if(N.length===1){let n=N[0];o=`
          <div class="youtube-single-preview">
            <div class="youtube-preview-card">
              <div class="youtube-card-media">
                <img src="${Q(n.thumbnail)}" class="youtube-preview-img" alt="Thumbnail" />
              </div>
              <div class="youtube-card-fields">
                <div class="input-with-label">
                  <label class="field-sublabel" for="yt-edit-title">Título de la Canción:</label>
                  <input type="text" id="yt-edit-title" class="form-input form-input-sm" value="${Q(n.title)}" />
                </div>
                <div class="input-with-label">
                  <label class="field-sublabel" for="yt-edit-artist">Artista o Banda:</label>
                  <input type="text" id="yt-edit-artist" class="form-input form-input-sm" value="${Q(n.artist)}" />
                </div>
                <div class="youtube-meta-url">
                  <span class="source-badge badge-source-youtube">${e} YouTube</span>
                  <a href="${Q(n.videoUrl)}" target="_blank" rel="noopener noreferrer" class="youtube-url-link">${Q(n.videoUrl)}</a>
                </div>
              </div>
            </div>
            <div class="youtube-single-actions">
              <button type="button" class="btn btn-primary" id="btn-yt-load-editor" ${R?`disabled`:``}>
                ${te} Cargar en Editor
              </button>
              <button type="button" class="btn btn-outline" id="btn-yt-save-catalog" ${R?`disabled`:``}>
                ${t} Guardar en Catálogo (sin letras)
              </button>
            </div>
          </div>
        `}else if(N.length>1){let t=N.filter(e=>e.isSelected).length;o=`
          <div class="youtube-batch-container">
            <div class="youtube-batch-header">
              <div class="youtube-batch-title-row">
                <h4 class="youtube-batch-count">
                  ${e} Se encontraron ${N.length} canciones
                </h4>
                <div class="youtube-batch-toggles">
                  <button type="button" class="btn btn-xs btn-outline" id="btn-yt-select-all">Seleccionar todas</button>
                  <button type="button" class="btn btn-xs btn-outline" id="btn-yt-deselect-all">Deseleccionar todas</button>
                </div>
              </div>
              <div class="youtube-library-input-row">
                <label for="yt-library-name-input" class="field-sublabel">Asignar a Biblioteca (opcional):</label>
                <input
                  type="text"
                  id="yt-library-name-input"
                  class="form-input form-input-sm"
                  placeholder="ej. Playlist de YouTube"
                  value="${Q(P)}"
                />
              </div>
            </div>

            <div class="youtube-batch-list">
              ${N.map((e,t)=>`
                <div class="youtube-batch-item ${e.isSelected?`is-selected`:``}" data-idx="${t}">
                  <label class="youtube-item-checkbox-label">
                    <input type="checkbox" class="youtube-item-check" data-idx="${t}" ${e.isSelected?`checked`:``} />
                  </label>
                  <img src="${Q(e.thumbnail)}" class="youtube-item-thumb" alt="Thumb" loading="lazy" />
                  <div class="youtube-item-info">
                    <div class="youtube-item-title">${Q(e.title)}</div>
                    <div class="youtube-item-artist">${Q(e.artist)}</div>
                  </div>
                  <span class="youtube-item-index">#${t+1}</span>
                </div>
              `).join(``)}
            </div>

            <div class="youtube-batch-footer">
              <button
                type="button"
                class="btn btn-primary btn-block btn-lg"
                id="btn-yt-import-batch"
                ${t===0||R?`disabled`:``}
              >
                ${R?`Importando canciones...`:`${s} Importar ${t} canciones a SarangaBaranga`}
              </button>
            </div>
          </div>
        `}else L||(o=`
          <div class="bl-empty-results youtube-empty-state">
            <div class="empty-icon" style="font-size: 2rem; color: #ef4444; margin-bottom: 8px;">${e}</div>
            <h4>Importá desde YouTube o YouTube Music</h4>
            <p>Pegá la dirección web de un video o de una playlist para crear las canciones sin letras al instante.</p>
          </div>
        `)}else z.length>0?o=z.map(e=>{let t=R&&H===e.id,n=e.duration>0?h(e.duration):``,r=`badge-source-betterlyrics`,i=`BetterLyrics`;e.source===`genius`?(r=`badge-source-genius`,i=`Genius`):e.source===`lrclib`?(r=`badge-source-lrclib`,i=`LRCLIB`):e.source===`lrcred`&&(r=`badge-source-lrcred`,i=`LRC.red`);let a=``;a=e.syncType===`richsync`?`<span class="badge-format format-richsync">${c} Sílabas (TTML)</span>`:e.syncType===`linesync`?`<span class="badge-format format-linesync">${b} Versos (LRC)</span>`:`<span class="badge-format format-plain">${p} Letra Plana</span>`;let o=e.artwork?`<img src="${Q(e.artwork)}" class="result-card-artwork" alt="Artwork" loading="lazy" />`:``;return`
          <div class="bl-result-card ${t?`is-loading-card`:``}" data-item-id="${e.id}">
            <div class="bl-card-left">
              ${o}
              <div class="bl-card-info">
                <div class="bl-card-title-row">
                  <h4 class="bl-song-title">${Q(e.song)}</h4>
                  <span class="source-badge ${r}">${Q(i)}</span>
                  ${a}
                </div>
                <div class="bl-card-artist-row">
                  <span class="bl-artist-name">${Q(e.artist)}</span>
                  ${e.album?`<span class="bl-album-name">• ${Q(e.album)}</span>`:``}
                  ${n?`<span class="bl-duration">• ${n}</span>`:``}
                </div>
              </div>
            </div>

            <div class="bl-card-right">
              <button
                type="button"
                class="btn btn-primary btn-sm btn-select-bl-song"
                data-item-id="${e.id}"
                ${R?`disabled`:``}
              >
                ${t?`Cargando...`:`${s} Cargar en Editor`}
              </button>
            </div>
          </div>
        `}).join(``):!L&&U&&(o=`
        <div class="bl-empty-results">
          <p>No se encontraron resultados para la búsqueda.</p>
        </div>
      `);if(r.innerHTML=`
      <div class="modal-backdrop" id="online-modal-backdrop"></div>
      <div class="modal-dialog online-lyrics-modal-dialog">
        <div class="modal-header">
          <div>
            <h2 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              ${f} Buscar Canción Online
            </h2>
          </div>
          <div class="modal-header-actions">
            <button type="button" class="btn btn-outline btn-modal-import" id="btn-modal-import" title="Importar archivo (.json, .yaml, .yml)" aria-label="Importar archivo">${n}</button>
            <button type="button" class="btn btn-primary btn-modal-create-empty" id="btn-modal-create-empty" title="Crear canción vacía" aria-label="Crear canción vacía">${s}</button>
            <button class="btn-close-modal" id="btn-close-online-modal" title="Cerrar modal">${d}</button>
            <input type="file" id="modal-import-file-input" accept=".json,.yaml,.yml" class="hidden-input" style="display: none;" />
          </div>
        </div>

        <div class="modal-body online-modal-body">
          <!-- Barra de Proveedores -->
          <div class="online-providers-bar">
            ${i}
          </div>

          <!-- Formulario según Proveedor -->
          ${a}

          <!-- Barra de Opciones de Traducción -->
          ${v===`youtube`?`
            <div class="online-options-bar youtube-options-bar">
              <span class="youtube-options-tag">
                ${e} Extracción de metadatos (sin letras) • Podés reproducir de inmediato o agregar letras más adelante
              </span>
            </div>
          `:`
            <div class="online-options-bar">
              <div class="option-field">
                <label for="online-select-translate" class="field-sublabel">Traducir automáticamente a:</label>
                <select id="online-select-translate" class="form-select select-sm">
                  <option value="es" ${A===`es`?`selected`:``}>Español (es)</option>
                  <option value="en" ${A===`en`?`selected`:``}>English (en)</option>
                  <option value="ja" ${A===`ja`?`selected`:``}>日本語 (ja)</option>
                  <option value="pt" ${A===`pt`?`selected`:``}>Português (pt)</option>
                  <option value="fr" ${A===`fr`?`selected`:``}>Français (fr)</option>
                  <option value="none" ${A===`none`?`selected`:``}>(Sin traducción)</option>
                </select>
              </div>
              ${U?`
                <span class="online-search-summary-tag">${Q(U)}</span>
              `:``}
            </div>
          `}

          <!-- Alerta de Estado -->
          ${B?`
            <div class="status-alert status-${V}" style="margin: 10px 0;">
              <span class="status-alert-text">${Q(B)}</span>
              <button type="button" class="btn-close-alert" id="btn-close-online-alert" title="Cerrar aviso" aria-label="Cerrar aviso">${d}</button>
            </div>
          `:``}

          <!-- Contenedor de Resultados -->
          <div class="online-results-container">
            ${L?`
              <div class="bl-loading-state">
                <span class="bl-spinner"></span>
                <p>Consultando motores de búsqueda en línea...</p>
              </div>
            `:o}
          </div>
        </div>

        <!-- Botón flotante para volver arriba -->
        <button
          type="button"
          class="btn-online-scroll-top"
          id="btn-online-scroll-top"
          title="Volver arriba a la búsqueda"
          aria-label="Volver arriba a la búsqueda"
        >
          ${g} <span>Subir</span>
        </button>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-online-modal">Cerrar</button>
        </div>
      </div>
    `,Ce(),G(),typeof ResizeObserver<`u`){W&&W.disconnect();let e=r.querySelector(`.online-lyrics-modal-dialog`);e&&(W=new ResizeObserver(()=>{G()}),W.observe(e))}}async function Se(e){R=!0,B=`Importando archivo...`,V=`info`,$();try{let t=await ee(e,{onConflictChoice:m});if(t.type===`cancelled`){B=t.message,V=`info`,R=!1,$();return}K(),u&&u(t.message)}catch(e){console.error(`Error al importar archivo en modal:`,e),R=!1,B=`Error al importar: `+e.message,V=`error`,$()}}function Ce(){if(!r)return;let e=r.querySelector(`#btn-close-online-alert`);e&&e.addEventListener(`click`,()=>{B=``,$()});let t=r.querySelector(`#btn-close-online-modal`);t&&t.addEventListener(`click`,K);let n=r.querySelector(`#btn-modal-import`),i=r.querySelector(`#modal-import-file-input`);n&&i&&(n.addEventListener(`click`,()=>{i.click()}),i.addEventListener(`change`,async e=>{let t=e.target.files[0];t&&(await Se(t),i.value=``)}));let a=r.querySelector(`#btn-modal-create-empty`);a&&a.addEventListener(`click`,()=>{K(),o&&o()});let c=r.querySelector(`#btn-cancel-online-modal`);c&&c.addEventListener(`click`,K);let l=r.querySelector(`#online-modal-backdrop`);l&&l.addEventListener(`click`,K),r.querySelectorAll(`.online-provider-tab`).forEach(e=>{e.addEventListener(`click`,()=>{J();let t=e.dataset.provider;t&&t!==v&&(v=t,$(),q())})}),r.querySelectorAll(`.bl-mode-tab[data-bl-mode]`).forEach(e=>{e.addEventListener(`click`,()=>{J();let t=e.dataset.blMode;t&&t!==x&&(x=t,$(),q())})}),r.querySelectorAll(`.bl-mode-tab[data-submode]`).forEach(e=>{e.addEventListener(`click`,()=>{J();let t=e.dataset.submode;t&&t!==S&&(S=t,$(),q())})}),r.querySelectorAll(`.bl-filter-pill`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.sync;t&&t!==k&&(k=t,de())})});let u=r.querySelector(`#btn-toggle-genius-token`);u&&u.addEventListener(`click`,()=>{F=!F,$()});let d=r.querySelector(`#btn-save-genius-token`);d&&d.addEventListener(`click`,()=>{let e=r.querySelector(`#input-genius-token`);ge(e?e.value:``)});let f=r.querySelector(`#btn-do-online-search`);f&&f.addEventListener(`click`,de);let p=r.querySelector(`#btn-do-youtube-extract`);p&&p.addEventListener(`click`,Y);let m=r.querySelector(`#youtube-input-url`);m&&m.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.ctrlKey||e.metaKey)&&(e.preventDefault(),Y())});let h=r.querySelector(`#btn-yt-load-editor`);h&&h.addEventListener(`click`,se);let g=r.querySelector(`#btn-yt-save-catalog`);g&&g.addEventListener(`click`,ce);let ee=r.querySelector(`#btn-yt-select-all`);ee&&ee.addEventListener(`click`,()=>{N.forEach(e=>{e.isSelected=!0}),$()});let _=r.querySelector(`#btn-yt-deselect-all`);_&&_.addEventListener(`click`,()=>{N.forEach(e=>{e.isSelected=!1}),$()}),r.querySelectorAll(`.youtube-item-check`).forEach(e=>{e.addEventListener(`change`,()=>{let t=Number(e.dataset.idx);if(!isNaN(t)&&N[t]){N[t].isSelected=e.checked;let n=r.querySelector(`.youtube-batch-item[data-idx="${t}"]`);n&&n.classList.toggle(`is-selected`,e.checked);let i=r.querySelector(`#btn-yt-import-batch`),a=N.filter(e=>e.isSelected).length;i&&(i.disabled=a===0||R,i.innerHTML=R?`Importando canciones...`:`${s} Importar ${a} canciones a SarangaBaranga`)}})});let te=r.querySelector(`#btn-yt-import-batch`);te&&te.addEventListener(`click`,le),r.querySelectorAll(`.search-main-input, .bl-dual-inputs-grid input`).forEach(e=>{e.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),de())})});let ne=r.querySelector(`#online-select-translate`);ne&&ne.addEventListener(`change`,e=>{A=e.target.value}),r.querySelectorAll(`.btn-select-bl-song`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.itemId,n=z.find(e=>String(e.id)===String(t));n&&fe(n)})});let y=r.querySelector(`#btn-online-scroll-top`),b=r.querySelector(`.online-modal-body`),C=r.querySelector(`.online-results-container`),w=r.querySelector(`.online-lyrics-modal-dialog`);function T(){y&&((w&&w.classList.contains(`layout-scroll-controls`)?b?b.scrollTop:0:C?C.scrollTop:0)>70?y.classList.add(`is-visible`):y.classList.remove(`is-visible`))}b&&b.addEventListener(`scroll`,T,{passive:!0}),C&&C.addEventListener(`scroll`,T,{passive:!0}),y&&y.addEventListener(`click`,()=>{let e=w&&w.classList.contains(`layout-scroll-controls`)?b:C;e&&(typeof e.scrollTo==`function`?e.scrollTo({top:0,behavior:`smooth`}):e.scrollTop=0),q()})}return{open:ie,close:K}}export{$ as createBetterLyricsModal,$ as createOnlineLyricsModal};